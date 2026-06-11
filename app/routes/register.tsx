import { createRoute } from 'honox/factory'
import { generateId } from '../utils/admin_utils'
import { hashPassword, createToken, setAuthCookie } from '../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const formData = await c.req.formData()
  
  const name = formData.get('name') as string
  const password = formData.get('password') as string
  const referralCodeInput = formData.get('referral_code') as string || ''
  
  // Tangkap Kode Negara dan Nomor HP
  const countryCode = formData.get('country_code') as string || '+62'
  const phoneNumber = formData.get('phone_number') as string || ''
  
  // FORMATTING OTOMATIS: 
  // 1. Buang tanda '+' dari kode negara (contoh: '+62' -> '62')
  const cleanPrefix = countryCode.replace(/\\D/g, '')
  // 2. Buang angka '0' di awal nomor HP dan buang karakter non-angka
  const cleanNumber = phoneNumber.replace(/\\D/g, '').replace(/^0+/, '')
  // 3. Gabungkan menjadi satu string (contoh: '628123456789')
  const fullPhone = cleanPrefix + cleanNumber

  // Trik Siluman: Generate email palsu agar tidak error di Database
  const dummyEmail = `${fullPhone}@wa.shopinid.com`

  try {
    const userId = 'USR-' + generateId().substring(0, 8).toUpperCase()
    const myReferralCode = generateId().substring(0, 8).toUpperCase()
    const hashed = await hashPassword(password)

    let invitedById = null
    if (referralCodeInput) {
      const inviter = await db.prepare("SELECT id FROM users WHERE referral_code = ?").bind(referralCodeInput).first()
      if (inviter) invitedById = inviter.id
    }

    let defaultLevel: any = null
    try {
      defaultLevel = await db.prepare("SELECT id, bonus FROM membership_levels ORDER BY price ASC LIMIT 1").first()
    } catch (e) {
      console.log("Tabel membership_levels mungkin belum dibuat")
    }

    const storeId = 'STR-' + generateId().substring(0, 8).toUpperCase()
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6)
    const walletId = 'WAL-' + generateId().substring(0, 8).toUpperCase()
    const bonusAmount = defaultLevel ? (defaultLevel.bonus as number) : 0

    // Eksekusi Pendaftaran
    await db.batch([
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, phone, referral_code, invited_by)
        VALUES (?, ?, ?, ?, 'customer', ?, ?, ?)
      `).bind(userId, name, dummyEmail, hashed, fullPhone, myReferralCode, invitedById),
      
      db.prepare(`
        INSERT INTO stores (id, user_id, slug, name, location, status, level_id)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
      `).bind(storeId, userId, slug, `Toko ${name}`, 'Belum Diatur', defaultLevel?.id || null),
      
      db.prepare(`
        INSERT INTO vendor_wallets (id, store_id, pending_balance, available_balance)
        VALUES (?, ?, 0, ?)
      `).bind(walletId, storeId, bonusAmount)
    ])

    if (bonusAmount > 0) {
        await db.prepare(`
          INSERT INTO wallet_transactions (id, wallet_id, type, amount, description)
          VALUES (?, ?, 'bonus', ?, 'Bonus Modal Awal Member Baru')
        `).bind(generateId(), walletId, bonusAmount).run()
    }

    const token = await createToken(c, { id: userId, role: 'customer', name: name })
    setAuthCookie(c, token)
    
    return c.redirect('/seller?welcome=1')

  } catch (error) {
    console.error("Register Error:", error)
    return c.redirect('/register?err=phone_terdaftar')
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

        {err === 'phone_terdaftar' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm text-red-700">Nomor WhatsApp ini sudah digunakan. Silakan coba masuk (Login).</p>
          </div>
        )}

        <form method="POST" action="/register" className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nama Lengkap</label>
            <input type="text" name="name" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" placeholder="Contoh: Arman Maulana" />
          </div>

          {/* INPUT BARU: NOMOR WHATSAPP DENGAN DROPDOWN NEGARA */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nomor WhatsApp</label>
            <div className="flex border border-gray-300 rounded-sm focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-colors">
              <select name="country_code" className="bg-gray-50 px-3 py-3 border-r border-gray-300 text-gray-700 font-bold focus:outline-none cursor-pointer">
                <option value="+62">🇮🇩 +62</option>
                <option value="+60">🇲🇾 +60</option>
                <option value="+65">🇸🇬 +65</option>
                <option value="+673">🇧🇳 +673</option>
              </select>
              <input type="tel" name="phone_number" required className="w-full px-4 py-3 focus:outline-none" placeholder="8123456789" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Tanpa awalan angka 0 (Contoh: 8123456789)</p>
          </div>

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
