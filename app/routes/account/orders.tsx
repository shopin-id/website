import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  // Ambil data profil untuk Sidebar agar konsisten dengan halaman member lainnya
  const account = await db.prepare("SELECT name, email FROM users WHERE id = ?").bind(user.id).first()
  if (!account) return c.redirect('/logout')

  // Ambil data Tagihan Utama (orders) beserta Sub-Pesanan Tokonya (store_orders)
  const { results: rawOrders } = await db.prepare(`
    SELECT o.id as order_id, o.grand_total, o.status as payment_status, o.created_at,
           so.id as store_order_id, so.status as delivery_status, s.name as store_name
    FROM orders o
    LEFT JOIN store_orders so ON o.id = so.order_id
    LEFT JOIN stores s ON so.store_id = s.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).bind(user.id).all()

  // Mengelompokkan data berdasarkan order_id
  const groupedOrders: Record<string, any> = {}
  rawOrders.forEach((row: any) => {
    if (!groupedOrders[row.order_id]) {
      groupedOrders[row.order_id] = {
        order_id: row.order_id,
        grand_total: row.grand_total,
        payment_status: row.payment_status,
        created_at: row.created_at,
        store_orders: []
      }
    }
    if (row.store_order_id) {
      groupedOrders[row.order_id].store_orders.push({
        store_order_id: row.store_order_id,
        store_name: row.store_name,
        delivery_status: row.delivery_status
      })
    }
  })

  const orders = Object.values(groupedOrders)

  return c.render(
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* SIDEBAR AKUN (SUDAH DIKEMBALIKAN & KONSISTEN) */}
        <aside className="w-full lg:col-span-1">
          <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
            <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-black mb-4 shadow-inner">
              {account.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-gray-900 truncate">{account.name}</h2>
            <p className="text-xs text-gray-500 mb-6 truncate">{account.email}</p>
            
            <nav className="flex flex-col space-y-1">
              <a href="/account" className="block text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 px-4 py-2.5 rounded-sm transition-colors">Dasbor Akun</a>
              <a href="/account/orders" className="block text-sm font-bold text-red-600 bg-red-50 px-4 py-2.5 rounded-sm">Riwayat Pesanan</a>
              <a href="/account/settings" className="block text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 px-4 py-2.5 rounded-sm transition-colors">Pengaturan Profil</a>
              <a href="/seller" className="block text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-sm mt-4 border border-blue-100 transition-colors">Area Toko Saya</a>
              <form action="/logout" method="POST" className="pt-4 mt-4 border-t border-gray-100">
                <button type="submit" className="text-sm font-bold text-red-500 hover:text-red-700 w-full text-left px-4 py-2">Keluar (Logout)</button>
              </form>
            </nav>
          </div>
        </aside>

        {/* KONTEN UTAMA */}
        <section className="w-full lg:col-span-3">
          <div className="bg-white p-6 md:p-8 border border-gray-200 rounded-sm shadow-sm min-h-[500px]">
            <h3 className="text-xl font-black mb-6 border-b border-gray-100 pb-4 uppercase tracking-wider text-gray-900">Riwayat Pesanan Saya</h3>
            
            {orders.length === 0 ? (
              <div className="bg-white p-12 border border-gray-200 rounded-sm shadow-sm text-center text-gray-500">
                Anda belum pernah melakukan pemesanan.
              </div>
            ) : (
              orders.map((order: any) => (
                <div key={order.order_id} className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden mb-6">
                  
                  {/* Header Pesanan Utama */}
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center">
                     <div>
                       <span className="text-xs text-gray-500 block">ID Tagihan: <strong className="text-black">{order.order_id}</strong></span>
                       <span className="text-xs text-gray-500 block mt-1">{new Date(order.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                     </div>
                     <div className="mt-3 md:mt-0 text-right">
                       <span className="text-xs text-gray-500 block">Total Pembayaran</span>
                       <span className="text-lg font-black text-red-600 block">Rp {(order.grand_total as number).toLocaleString('id-ID')}</span>
                     </div>
                  </div>

                  {/* Status Pembayaran & Rincian Paket */}
                  <div className="p-4">
                    <div className="mb-4">
                      <span className="text-xs font-bold uppercase mr-2 text-gray-600">Status Pembayaran:</span>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.payment_status}
                      </span>
                    </div>

                    <div className="space-y-3 mt-4 border-t border-gray-100 pt-4">
                       <h4 className="text-xs font-bold text-gray-800 uppercase">Paket Pengiriman (Dari Penjual)</h4>
                       {order.store_orders.map((so: any) => (
                         <div key={so.store_order_id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 p-3 rounded-sm border border-gray-100">
                           <div className="mb-2 sm:mb-0">
                              <p className="text-sm font-bold text-gray-900">📦 {so.store_name}</p>
                              <p className="text-[10px] text-gray-500 uppercase mt-1">ID: {so.store_order_id}</p>
                           </div>
                           <div className="text-left sm:text-right flex flex-col sm:items-end">
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] font-bold uppercase inline-block w-max mb-2">{so.delivery_status}</span>
                              
                              {/* TOMBOL AKSI OTOMATIS MUNCUL BERDASARKAN STATUS */}
                              {so.delivery_status === 'shipped' && (
                                <button onClick={`fetch('/api/orders/complete', {method:'POST', body: JSON.stringify({store_order_id: '${so.store_order_id}'}), headers:{'Content-Type':'application/json'}}).then(()=>window.location.reload())`} 
                                className="bg-black text-white px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-sm w-max">
                                  Pesanan Diterima
                                </button>
                              )}
                              
                              {so.delivery_status === 'completed' && (
                                 <a href={`/account/reviews/new?so_id=${so.store_order_id}`} className="text-blue-600 hover:text-blue-800 text-[10px] font-bold uppercase underline mt-1 block">Beri Ulasan</a>
                              )}
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                  
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  )
})
