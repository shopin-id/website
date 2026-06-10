import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'
import { generateId } from '../../../utils/admin_utils'

// Endpoint POST: /api/wishlist/toggle
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  
  // Hanya member/user yang sudah login yang bisa menyimpan wishlist
  if (!user) {
    return c.json({ success: false, message: 'Silakan login terlebih dahulu untuk menyimpan ke Wishlist.' }, 401)
  }

  const body = await c.req.json()
  const { product_id } = body

  if (!product_id) {
    return c.json({ success: false, message: 'Product ID tidak valid' }, 400)
  }

  // Cek apakah produk sudah ada di wishlist user ini
  const existing = await db.prepare("SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?").bind(user.id, product_id).first()

  if (existing) {
    // Jika sudah ada, maka hapus dari wishlist (Toggle OFF)
    await db.prepare("DELETE FROM wishlists WHERE id = ?").bind(existing.id).run()
    return c.json({ success: true, is_wishlisted: false, message: 'Dihapus dari Wishlist' })
  } else {
    // Jika belum ada, masukkan ke wishlist (Toggle ON)
    const newId = generateId()
    await db.prepare("INSERT INTO wishlists (id, user_id, product_id) VALUES (?, ?, ?)").bind(newId, user.id, product_id).run()
    return c.json({ success: true, is_wishlisted: true, message: 'Ditambahkan ke Wishlist' })
  }
})
