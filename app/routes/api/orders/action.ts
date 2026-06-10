import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'
import { generateId } from '../../../utils/admin_utils'

// Endpoint POST: /api/orders/action
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { store_order_id, action, reason } = body

  // Validasi pesanan: pastikan pesanan ini milik user tersebut
  const order = await db.prepare(`
    SELECT so.id, so.store_id, so.status, o.user_id 
    FROM store_orders so
    JOIN orders o ON so.order_id = o.id
    WHERE so.id = ? AND o.user_id = ?
  `).bind(store_order_id, user.id).first()

  if (!order) {
    return c.json({ success: false, message: 'Pesanan tidak ditemukan atau akses ditolak' }, 404)
  }

  if (order.status !== 'shipped' && order.status !== 'delivered') {
    return c.json({ success: false, message: 'Status pesanan tidak valid untuk aksi ini' }, 400)
  }

  // --- AKSI: PEMBELI MENERIMA BARANG (SETTLEMENT) ---
  if (action === 'accept') {
    // 1. Ubah status pesanan menjadi Selesai
    await db.prepare("UPDATE store_orders SET status = 'completed' WHERE id = ?").bind(store_order_id).run()

    // 2. Hitung total uang yang harus dicairkan ke vendor
    const items = await db.prepare("SELECT price_at_purchase, quantity FROM order_items WHERE store_order_id = ?").bind(store_order_id).all()
    const totalIncome = items.results.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0)

    // 3. Pindahkan uang dari Pending Balance ke Available Balance
    const wallet = await db.prepare("SELECT id FROM vendor_wallets WHERE store_id = ?").bind(order.store_id).first()
    
    await db.prepare(`
      UPDATE vendor_wallets 
      SET pending_balance = pending_balance - ?, 
          available_balance = available_balance + ? 
      WHERE store_id = ?
    `).bind(totalIncome, totalIncome, order.store_id).run()

    // 4. Catat mutasi sukses
    await db.prepare(`
      INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, reference_id)
      VALUES (?, ?, 'settlement', ?, 'Pencairan dana pesanan selesai', ?)
    `).bind(generateId(), wallet.id, totalIncome, store_order_id).run()

    return c.json({ success: true, message: 'Pesanan selesai. Silahkan berikan ulasan Anda!' })
  } 
  
  // --- AKSI: PEMBELI MENGAJUKAN REFUND / KOMPLAIN ---
  else if (action === 'refund') {
    if (!reason) return c.json({ success: false, message: 'Alasan komplain wajib diisi' }, 400)

    // 1. Ubah status pesanan menjadi Disengketakan (Uang tetap ditahan di pending_balance)
    await db.prepare("UPDATE store_orders SET status = 'disputed' WHERE id = ?").bind(store_order_id).run()

    // 2. Masukkan ke tabel Disputes untuk ditengahi oleh Admin
    await db.prepare(`
      INSERT INTO disputes (id, store_order_id, buyer_id, reason, status)
      VALUES (?, ?, ?, ?, 'open')
    `).bind(generateId(), store_order_id, user.id, reason).run()

    return c.json({ success: true, message: 'Komplain diajukan. Dana ditahan sementara admin meninjau masalah ini.' })
  }

  return c.json({ success: false, message: 'Aksi tidak dikenal' }, 400)
})
