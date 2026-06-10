import { createRoute } from 'honox/factory'
import { setAuthCookie, createToken, hashPassword } from '../utils/auth'

// Logika Backend untuk memproses Login
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const formData = await c.req.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Menggunakan fungsi hashing PBKDF2 yang aman
  const hashed = await hashPassword(password)
  
  const user = await db.prepare("SELECT * FROM users WHERE email = ? AND password_hash = ?").bind(email, hashed).first()

  if (user) {
    // Ingat: createToken sekarang membutuhkan context 'c'
    const token = await createToken(c, { id: user.id, role: user.role, name: user.name })
    setAuthCookie(c, token)
    return c.redirect('/account')
  }
  
  return c.redirect('/login?err=kredensial_salah')
})

// Logika Frontend untuk menampilkan Halaman Login
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
            <p className="text-sm text-red-700">Email atau kata sandi yang Anda masukkan salah.</p>
          </div>
        )}

        <form method="POST" action="/login" className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Alamat Email</label>
            <input 
              type="email" 
              name="email" 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors"
              placeholder="nama@email.com"
            />
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

          <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-sm hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm">
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
