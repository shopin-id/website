import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'
import { generateId } from '../../../utils/admin_utils'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const formData = await c.req.formData()
  const targetUserId = formData.get('user_id') as string
  const storeName = formData.get('name') as string
  const location = formData.get('location') as string
  const levelId = formData.get('level_id') as string

  // Ambil rincian harga pendaftaran & bonus berdasarkan level_id yang dipilih
  const levelData = await db.prepare("SELECT price, bonus FROM membership_levels WHERE id = ?").bind(levelId).first()
  if (!levelData) return c.redirect('/admin/stores/new?err=invalid_level')

  const storeId = 'STR-' + generateId().substring(0, 8).toUpperCase()
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6)

  try {
    // 1. Masukkan data toko lengkap dengan level keanggotaannya
    await db.prepare(`
      INSERT INTO stores (id, user_id, slug, name, location, status, level_id)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).bind(storeId, targetUserId, slug, storeName, location, levelId).run()

    // 2. Buat dompet vendor dengan saldo awal dinamis mengikuti skema level keanggotaan
    const walletId = 'WAL-' + generateId().substring(0, 8).toUpperCase()
    const bonusAmount = levelData.bonus as number

    await db.prepare(`
      INSERT INTO vendor_wallets (id, store_id, pending_balance, available_balance)
      VALUES (?, ?, 0, ?)
    `).bind(walletId, storeId, bonusAmount).run()

    // 3. Catat transaksi bonus ke buku besar mutasi keuangan
    await db.prepare(`
      INSERT INTO wallet_transactions (id, wallet_id, type, amount, description)
      VALUES (?, ?, 'bonus', ?, ?)
    `).bind(generateId(), walletId, bonusAmount, `Bonus pendaftaran awal tingkat ${levelId}`).run()

    return c.redirect('/admin/stores?success=created')
  } catch (err) {
    return c.redirect('/admin/stores/new?err=failed')
  }
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  // Ambil list customer yang belum punya toko
  const { results: availableUsers } = await db.prepare("SELECT id, name, email FROM users WHERE id NOT IN (SELECT user_id FROM stores) ORDER BY created_at DESC").all()
  
  // Ambil list semua pilihan tingkatan keanggotaan untuk dropdown
  const { results: membershipLevels } = await db.prepare("SELECT id, level_name, price, bonus FROM membership_levels ORDER BY price ASC").all()

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 max-w-3xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-xl font-bold text-gray-900">Registrasi Toko Vendor Baru</h2>
           <p className="text-sm text-gray-500 mt-1">Daftarkan toko secara manual setelah validasi pembayaran WhatsApp.</p>
        </div>
        <a href="/admin/stores" className="text-sm font-bold text-gray-500 hover:text-black">← Batal</a>
      </div>

      <form action="/admin/stores/new" method="POST" className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pilih Akun Pengguna</label>
          <select name="user_id" required className="w-full border-gray-300 rounded-sm shadow-sm p-3 border focus:ring-black bg-white text-sm">
             <option value="">-- Pilih Pengguna --</option>
             {availableUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
             ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pilih Tingkat Keanggotaan (Membership Level)</label>
          <select name="level_id" required className="w-full border-gray-300 rounded-sm shadow-sm p-3 border focus:ring-black bg-white text-sm font-bold text-green-700">
             <option value="">-- Pilih Level Keanggotaan --</option>
             {membershipLevels.map((lvl: any) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.level_name} (Biaya: Rp {(lvl.price as number).toLocaleString('id-ID')} | Bonus Cair: Rp {(lvl.bonus as number).toLocaleString('id-ID')})
                </option>
             ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nama Toko</label>
              <input type="text" name="name" required className="w-full border-gray-300 rounded-sm shadow-sm p-3 border focus:ring-black text-sm" placeholder="Contoh: Toko Elektronik Maju" />
           </div>
           <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Lokasi Asal Kota</label>
              <input type="text" name="location" required className="w-full border-gray-300 rounded-sm shadow-sm p-3 border focus:ring-black text-sm" placeholder="Contoh: Jakarta Pusat" />
           </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
           <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-gray-800 shadow-md">
              Buat Toko & Sinkronisasi Saldo
           </button>
        </div>
      </form>
    </div>
  )
})
