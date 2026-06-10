import { createRoute } from 'honox/factory'
import { generateId } from '../utils/admin_utils'
import { hashPassword, createToken, setAuthCookie } from '../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const formData = await c.req.formData()
  
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string || ''
  
  // Tangkap Kode Undangan (Referral) dari Form
  const referralCodeInput = formData.get('referral_code') as string || ''

  try {
    const userId = 'USR-' + generateId().substring(0, 8).toUpperCase()
    const myReferralCode = generateId().substring(0, 8).toUpperCase() // Generate kode unik untuk user ini
    const hashed = await hashPassword(password)

    // Cek validitas kode undangan jika diisi
    let invitedById = null
    if (referralCodeInput) {
      const inviter = await db.prepare("SELECT id FROM users WHERE referral_code = ?").bind(referralCodeInput).first()
      if (inviter) invitedById = inviter.id
    }

    // Cari level membership paling dasar (yang harganya paling murah/gratis)
    // Pengaman tabel stores kita buat defensif jika level kosong
    let defaultLevel: any = null
    try {
      defaultLevel = await db.prepare("SELECT id, bonus FROM membership_levels ORDER BY price ASC LIMIT 1").first()
    } catch (e) {
      console.log("Tabel membership_levels mungkin belum dibuat")
    }

    const storeId = 'STR-' + generateId().substring(0, 8).toUpperCase()
    // Buat slug toko acak sementara berdasarkan nama
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6)
    const walletId = 'WAL-' + generateId().substring(0, 8).toUpperCase()
    const bonusAmount = defaultLevel ? (defaultLevel.bonus as number) : 0

    // Eksekusi Pendaftaran Akun + Buka Toko + Buat Dompet dalam satu operasi serentak
    await db.batch([
      // 1. Buat User Baru
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, phone, referral_code, invited_by)
        VALUES (?, ?, ?, ?, 'customer', ?, ?, ?)
      `).bind(userId, name, email, hashed, phone, myReferralCode, invitedById),
      
      // 2. Buat Toko Otomatis
      db.prepare(`
        INSERT INTO stores (id, user_id, slug, name, location, status, level_id)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
      `).bind(storeId, userId, slug, `Toko ${name}`, 'Belum Diatur', defaultLevel?.id || null),
      
      // 3. Buat Dompet Toko Otomatis (Termasuk Bonus Jika Ada)
      db.prepare(`
        INSERT INTO vendor_wallets (id, store_id, pending_balance, available_balance)
        VALUES (?, ?, 0, ?)
      `).bind(walletId, storeId, bonusAmount)
    ])

    // 4. Jika ada bonus dari pendaftaran otomatis, catat mutasinya ke buku besar (Ledger)
    if (bonusAmount > 0) {
        await db.prepare(`
          INSERT INTO wallet_transactions (id, wallet_id, type, amount, description)
          VALUES (?, ?, 'bonus', ?, 'Bonus Modal Awal Member Baru')
        `).bind(generateId(), walletId, bonusAmount).run()
    }

    // Langsung loginkan pengguna setelah berhasil daftar
    const token = await createToken(c, { id: userId, role: 'customer', name: name })
    setAuthCookie(c, token)
    
    // Arahkan langsung ke Dasbor Seller persis seperti di video!
    return c.redirect('/seller?welcome=1')

  } catch (error) {
    console.error("Register Error:", error)
    return c.redirect('/register?err=email_terdaftar')
  }
})

export default createRoute(async (c) => {
  const err = c.req.query('err')

  return c.render(
    <div className="w-full min-h-[70vh] bg-[#f4f7fc] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-sm shadow-sm border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tighter mb-2 uppercase">Gabung Shopin<span className="text-red-600">Id</span></h1>
          <p className="text-sm text-gray-500">Mulai berjualan dan dapatkan akses instan ke dasbor Anda.</p>
        </div>

        {err === 'email_terdaftar' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm text-red-700">Email ini sudah digunakan atau format salah. Silakan coba lagi.</p>
          </div>
        )}

        <form method="POST" action="/register" className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nama Lengkap</label>
            <input type="text" name="name" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" placeholder="Contoh: Budi Santoso" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Alamat Email</label>
            <input type="email" name="email" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" placeholder="nama@email.com" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nomor Telepon</label>
            <input type="text" name="phone" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" placeholder="0812xxxxxx" />
          </div>

          {/* INPUT BARU: KODE UNDANGAN */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Kode Undangan (Opsional)</label>
            <input type="text" name="referral_code" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors bg-green-50/30 text-green-800 uppercase font-bold" placeholder="Masukkan jika ada..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Kata Sandi</label>
            <input type="password" name="password" required minLength={6} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" placeholder="Minimal 6 karakter" />
          </div>

          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-sm hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm mt-4 shadow-md hover:-translate-y-0.5 transform">
            Daftar & Buka Toko Sekarang
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            Sudah punya akun? <a href="/login" className="font-bold text-black hover:underline">Masuk di sini</a>
          </p>
        </div>
        
      </div>
    </div>
  )
})
