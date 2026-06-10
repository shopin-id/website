import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'
import { generateId } from '../../../utils/admin_utils'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const storeOrderId = body.store_order_id

  try {
    // 1. Validasi: Pastikan pesanan ini memang milik pembeli yang login dan statusnya 'shipped'
    const order = await db.prepare(`
      SELECT so.id, so.store_id, o.user_id 
      FROM store_orders so
      JOIN orders o ON so.order_id = o.id
      WHERE so.id = ? AND so.status = 'shipped'
    `).bind(storeOrderId).first()

    if (!order || order.user_id !== user.id) {
      return c.json({ error: 'Pesanan tidak valid atau tidak bisa diselesaikan.' }, 400)
    }

    // 2. Hitung total uang yang harus dicairkan ke penjual (Harga Barang x Kuantitas)
    const { results: items } = await db.prepare(
      "SELECT quantity, price_at_purchase FROM order_items WHERE store_order_id = ?"
    ).bind(storeOrderId).all()
    
    const totalAmount = items.reduce((sum, item: any) => sum + (item.quantity * item.price_at_purchase), 0)

    // === TRANSAKSI DATABASE (Pelepasan Escrow) ===
    
    // A. Update status pesanan menjadi Selesai (Completed)
    await db.prepare("UPDATE store_orders SET status = 'completed' WHERE id = ?").bind(storeOrderId).run()

    // B. Pindahkan uang di dompet penjual (Kurangi Pending, Tambah Available)
    // Menggunakan UPSERT jika dompet belum pernah dibuat
    const walletId = 'WAL-' + generateId().substring(0, 8).toUpperCase()
    await db.prepare(`
      INSERT INTO vendor_wallets (id, store_id, pending_balance, available_balance)
      VALUES (?, ?, 0, ?)
      ON CONFLICT(store_id) DO UPDATE SET 
        pending_balance = pending_balance - ?,
        available_balance = available_balance + ?
    `).bind(walletId, order.store_id, totalAmount, totalAmount, totalAmount).run()

    // C. Dapatkan ID dompet untuk mencatat log
    const wallet = await db.prepare("SELECT id FROM vendor_wallets WHERE store_id = ?").bind(order.store_id).first()

    // D. Catat riwayat mutasi (Wallet Transactions)
    await db.prepare(`
      INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, reference_id)
      VALUES (?, ?, 'escrow_release', ?, ?, ?)
    `).bind(generateId(), wallet.id, totalAmount, `Pencairan dana dari pesanan ${storeOrderId}`, storeOrderId).run()

    return c.json({ success: true, message: 'Pesanan berhasil diselesaikan!' })
  } catch (err) {
    return c.json({ error: 'Terjadi kesalahan sistem' }, 500)
  }
})
