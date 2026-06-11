import { createRoute } from 'honox/factory'
import { setAuthCookie, createToken, hashPassword } from '../../utils/auth'

// Logika Backend untuk memproses Login Administrator via Email
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const formData = await c.req.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Lakukan enkripsi password menggunakan PBKDF2 WebCrypto bawaan sistem
  const hashed = await hashPassword(password)
  
  // Ambil data user yang memiliki email cocok, password cocok, dan WAJIB memiliki role 'admin'
  const user = await db.prepare("SELECT * FROM users WHERE email = ? AND password_hash = ? AND role = 'admin'").bind(email, hashed).first()

  if (user) {
    // Generate JWT token otentikasi admin aman (berlaku 7 hari)
    const token = await createToken(c, { id: user.id, role: user.role, name: user.name })
    setAuthCookie(c, token)
    
    // Alihkan langsung ke halaman utama Dashboard Admin sesuai permintaan
    return c.redirect('/admin')
  }
  
  // Jika gagal, kembalikan ke halaman login dengan query parameter error
  return c.redirect('/admin/login?err=kredensial_salah')
})

// Logika Frontend untuk menampilkan Antarmuka Form Login Admin
export default createRoute(async (c) => {
  const err = c.req.query('err')

  return c.render(
    <div className="w-full min-h-[85vh] bg-gray-900 flex items-center justify-center py-12 px-4 text-white">
      <div className="max-w-md w-full bg-gray-800 p-8 md:p-10 rounded-sm shadow-2xl border border-gray-700">
        
        {/* LOGO & BRAND PANEL */}
        <div className="text-center mb-8">
          <div className="text-2xl font-black tracking-tighter mb-2">
            SHOPIN<span className="text-red-600">ID</span> <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-sm uppercase tracking-widest ml-1 font-bold">Admin</span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Panel Kendali Keamanan Utama</p>
        </div>

        {/* NOTIFIKASI ERROR JIKA GAGAL */}
        {err === 'kredensial_salah' && (
          <div className="bg-red-950/40 border-l-4 border-red-600 p-4 mb-6 rounded-r-sm">
            <p className="text-xs text-red-400 font-bold">Email atau kata sandi salah, atau akun Anda tidak memiliki hak akses administrator!</p>
          </div>
        )}

        {/* FORM OTENTIKASI */}
        <form method="POST" action="/admin/login" className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Administrator</label>
            <input 
              type="email" 
              name="email" 
              required 
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-sm text-white focus:outline-none focus:border-red-600 transition-colors text-sm"
              placeholder="admin@shopinid.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kata Sandi</label>
            <input 
              type="password" 
              name="password" 
              required 
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-sm text-white focus:outline-none focus:border-red-600 transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="w-full bg-red-600 text-white font-bold py-4 rounded-sm hover:bg-red-700 transition-colors uppercase tracking-widest text-sm shadow-md cursor-pointer mt-2 transform active:scale-[0.99]">
            Otentikasi Masuk
          </button>
        </form>

        {/* LINK BACK TO HOME */}
        <div className="mt-8 text-center border-t border-gray-700 pt-6">
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium">&larr; Kembali ke Beranda Utama</a>
        </div>
        
      </div>
    </div>,
    { title: 'Secure Admin Login' }
  )
})
