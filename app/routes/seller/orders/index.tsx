import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first()
  if (!store) return c.redirect('/seller/register')

  // Ambil daftar pesanan khusus toko ini
  const { results: storeOrders } = await db.prepare(`
    SELECT so.id, so.status, so.created_at, o.shipping_address, u.name as buyer_name,
           (SELECT SUM(quantity * price_at_purchase) FROM order_items WHERE store_order_id = so.id) as subtotal
    FROM store_orders so
    JOIN orders o ON so.order_id = o.id
    JOIN users u ON o.user_id = u.id
    WHERE so.store_id = ?
    ORDER BY so.created_at DESC
  `).bind(store.id).all()

  return c.render(
    <div className="w-full bg-[#f4f7fc] min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <div>
             <h1 className="text-2xl font-bold text-gray-900">Kelola Pesanan</h1>
             <p className="text-sm text-gray-500">Daftar pesanan dari pelanggan untuk boutique Anda.</p>
          </div>
          <a href="/seller" className="text-sm font-bold text-gray-500 hover:text-black">← Kembali ke Dasbor</a>
        </div>

        <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
          {storeOrders.length === 0 ? (
             <div className="p-12 text-center text-gray-500">Belum ada pesanan masuk.</div>
          ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                     <th className="p-4 font-bold">ID Pesanan</th>
                     <th className="p-4 font-bold">Pembeli</th>
                     <th className="p-4 font-bold">Subtotal</th>
                     <th className="p-4 font-bold">Status</th>
                     <th className="p-4 font-bold">Aksi</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm text-gray-700">
                   {storeOrders.map((so: any) => (
                     <tr key={so.id} className="border-b border-gray-50 hover:bg-gray-50">
                       <td className="p-4 font-medium text-black">{so.id}</td>
                       <td className="p-4">
                          <div className="font-bold">{so.buyer_name}</div>
                          <div className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{so.shipping_address}</div>
                       </td>
                       <td className="p-4 font-bold">Rp {(so.subtotal as number).toLocaleString('id-ID')}</td>
                       <td className="p-4">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-sm text-[10px] font-bold uppercase">{so.status}</span>
                       </td>
                       <td className="p-4">
                          <button className="bg-black text-white px-3 py-1.5 rounded-sm text-xs font-bold hover:bg-gray-800">Proses</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}
        </div>

      </div>
    </div>
  )
})
