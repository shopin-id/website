import { createRoute } from 'honox/factory'
import { setAuthCookie, createToken, hashPassword } from '../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const formData = await c.req.formData()
  const password = formData.get('password') as string

  // Tangkap Kode Negara dan Nomor HP
  const countryCode = formData.get('country_code') as string || '+62'
  const phoneNumber = formData.get('phone_number') as string || ''
  
  // Format ulang nomor persis seperti saat registrasi
  const cleanPrefix = countryCode.replace(/\\D/g, '')
  const cleanNumber = phoneNumber.replace(/\\D/g, '').replace(/^0+/, '')
  const fullPhone = cleanPrefix + cleanNumber

  const hashed = await hashPassword(password)
  
  // SEKARANG MENCARI BERDASARKAN NOMOR HP, BUKAN EMAIL
  const user = await db.prepare("SELECT * FROM users WHERE phone = ? AND password_hash = ?").bind(fullPhone, hashed).first()

  if (user) {
    const token = await createToken(c, { id: user.id, role: user.role, name: user.name })
    setAuthCookie(c, token)
    return c.redirect('/account')
  }
  
  return c.redirect('/login?err=kredensial_salah')
})

export default createRoute(async (c) => {
  const err = c.req.query('err')

  return c.render(
    <div className="w-full min-h-[70vh] bg-[#f4f7fc] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-sm shadow-sm border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tighter mb-2 uppercase">Masuk ke Shopin<span className="text-red-600">Id</span></h1>
          <p className="text-sm text-gray-500">Selamat datang kembali! Silakan masuk ke akun Anda.</p>
        </div>

        {err && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm text-red-700">Nomor WhatsApp atau kata sandi yang Anda masukkan salah.</p>
          </div>
        )}

        <form method="POST" action="/login" className="space-y-6">
          
          {/* INPUT LOGIN WHATSAPP */}
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Kata Sandi</label>
              <a href="#" className="text-xs text-gray-500 hover:text-black">Lupa sandi?</a>
            </div>
            <input 
              type="password" 
              name="password" 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-sm hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm hover:-translate-y-0.5 transform shadow-md">
            Masuk
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            Belum punya akun? <a href="/register" className="font-bold text-black hover:underline">Daftar sekarang</a>
          </p>
        </div>
        
      </div>
    </div>
  )
})
