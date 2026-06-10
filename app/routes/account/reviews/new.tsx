import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'
import { generateId } from '../../../utils/admin_utils'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const formData = await c.req.formData()
  const storeOrderId = formData.get('store_order_id') as string
  const storeId = formData.get('store_id') as string
  const productRating = parseInt(formData.get('product_rating') as string, 10)
  const comment = formData.get('comment') as string

  try {
    // Simpan ke tabel ulasan
    await db.prepare(`
      INSERT INTO reviews (id, store_order_id, user_id, store_id, product_rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(generateId(), storeOrderId, user.id, storeId, productRating, comment).run()

    // Kalkulasi ulang rata-rata rating toko
    const avgData = await db.prepare("SELECT AVG(product_rating) as avg_rating FROM reviews WHERE store_id = ?").bind(storeId).first()
    if (avgData && avgData.avg_rating) {
       await db.prepare("UPDATE stores SET rating = ? WHERE id = ?").bind(avgData.avg_rating, storeId).run()
    }

    return c.redirect('/account/orders?review_success=1')
  } catch (err) {
    return c.redirect(`/account/orders?err=already_reviewed`)
  }
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const storeOrderId = c.req.query('so_id')
  
  // Ambil detail pesanan yang akan diulas
  const order = await db.prepare(`
    SELECT so.id, so.store_id, s.name as store_name 
    FROM store_orders so
    JOIN stores s ON so.store_id = s.id
    WHERE so.id = ? AND so.status = 'completed'
  `).bind(storeOrderId).first()

  if (!order) return c.redirect('/account/orders')

  return c.render(
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-200">
        <h1 className="text-2xl font-black mb-2 uppercase tracking-tight text-gray-900">Beri Ulasan Penjual</h1>
        <p className="text-gray-500 text-sm mb-8 border-b border-gray-100 pb-4">Bagaimana pengalaman Anda berbelanja di <strong>{order.store_name}</strong>?</p>

        <form action="/account/reviews/new" method="POST" className="space-y-6">
          <input type="hidden" name="store_order_id" value={order.id as string} />
          <input type="hidden" name="store_id" value={order.store_id as string} />

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Penilaian Produk (1-5)</label>
            <select name="product_rating" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black bg-white font-bold" required>
              <option value="5">★★★★★ - Sangat Puas</option>
              <option value="4">★★★★☆ - Puas</option>
              <option value="3">★★★☆☆ - Cukup</option>
              <option value="2">★★☆☆☆ - Kurang</option>
              <option value="1">★☆☆☆☆ - Mengecewakan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Komentar & Pengalaman</label>
            <textarea name="comment" rows={4} required placeholder="Apakah barang sesuai dengan deskripsi? Bagaimana dengan pengemasannya?" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black"></textarea>
          </div>

          <div className="pt-4 flex space-x-4">
            <a href="/account/orders" className="w-1/3 bg-gray-100 text-center text-gray-600 font-bold py-3 rounded-sm uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">Batal</a>
            <button type="submit" className="w-2/3 bg-black text-white font-bold py-3 rounded-sm uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors shadow-md">Kirim Ulasan</button>
          </div>
        </form>
      </div>
    </div>
  )
})
