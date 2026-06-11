import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c, next) => {
  // --- PERBAIKAN: JALUR PENGECUALIAN UNTUK HALAMAN LOGIN ---
  // Jika URL yang diakses adalah halaman login, biarkan lewat tanpa diinterogasi
  if (c.req.path === '/admin/login') {
    return await next()
  }

  // 1. Verifikasi JWT 
  const user = await getAuthUser(c)
  
  // 2. Otorisasi Ketat: Jika belum login atau rolenya bukan admin, tolak!
  if (!user || user.role !== 'admin') {
    // penyusup langsung ditendang kembali ke halaman form login
    return c.redirect('/login')
  }
  
  // Jika aman (admin yang sah), lanjutkan render halaman yang dituju
  await next()
})
