import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const storeOrderId = c.req.param('id')
  const formData = await c.req.formData()
  const trackingNumber = formData.get('tracking_number') as string
  const courier = formData.get('shipping_courier') as string

  // Update status pesanan menjadi dikirim (shipped) dan masukkan resi
  await db.prepare(`
    UPDATE store_orders 
    SET status = 'shipped', tracking_number = ?, shipping_courier = ? 
    WHERE id = ? AND store_id = (SELECT id FROM stores WHERE user_id = ?)
  `).bind(trackingNumber, courier, storeOrderId, user.id).run()

  return c.redirect(`/seller/orders/${storeOrderId}?success=1`)
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const storeOrderId = c.req.param('id')
  const success = c.req.query('success')

  const order = await db.prepare(`
    SELECT so.*, o.shipping_address, u.name as buyer_name, u.phone as buyer_phone
    FROM store_orders so
    JOIN orders o ON so.order_id = o.id
    JOIN users u ON o.user_id = u.id
    WHERE so.id = ? AND so.store_id = (SELECT id FROM stores WHERE user_id = ?)
  `).bind(storeOrderId, user.id).first()

  if (!order) return c.redirect('/seller/orders')

  const { results: items } = await db.prepare(`
    SELECT oi.quantity, oi.price_at_purchase, p.name 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.store_order_id = ?
  `).bind(storeOrderId).all()

  return c.render(
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Detail Pesanan: {order.id}</h1>
        <a href="/seller/orders" className="text-sm font-bold text-gray-500 hover:text-black">← Kembali</a>
      </div>

      {success === '1' && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <p className="text-sm text-green-700 font-bold">Pesanan berhasil diproses dan resi telah dikirim ke pembeli!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-100 pb-3 mb-4">Daftar Barang</h2>
            <div className="space-y-4">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity}x @ Rp {(item.price_at_purchase as number).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="font-bold text-gray-900">
                    Rp {(item.quantity * item.price_at_purchase).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-100 pb-3 mb-4">Alamat Pengiriman</h2>
            <p className="font-bold text-gray-900">{order.buyer_name}</p>
            <p className="text-sm text-gray-600 my-1 whitespace-pre-line">{order.shipping_address as string}</p>
            <p className="text-sm font-bold text-gray-900">Telp: {order.buyer_phone}</p>
          </div>
        </div>

        <div>
          <form action={`/seller/orders/${storeOrderId}`} method="POST" className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 sticky top-24">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-100 pb-3 mb-4">Aksi Penjual</h2>
            
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Status Saat Ini:</p>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-sm text-xs font-bold uppercase">{order.status}</span>
            </div>

            {order.status === 'pending' ? (
              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Kurir Pengiriman</label>
                  <input type="text" name="shipping_courier" required placeholder="JNE / TIKI / Sicepat" className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Nomor Resi</label>
                  <input type="text" name="tracking_number" required placeholder="Masukkan no resi valid" className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm" />
                </div>
                <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded-sm uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors">
                  Kirim Pesanan
                </button>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-sm">
                <p className="text-xs text-gray-500 mb-1">Resi Pengiriman:</p>
                <p className="font-bold text-gray-900">{order.shipping_courier} - {order.tracking_number}</p>
                <p className="text-[10px] text-gray-400 mt-4 leading-relaxed">Menunggu pembeli menekan tombol "Pesanan Diterima" agar dana cair ke dompet Anda.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
})
