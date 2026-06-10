import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c, next) => {
  // 1. Verifikasi JWT 
  const user = await getAuthUser(c)
  
  // 2. Otorisasi Ketat: Jika belum login atau rolenya bukan admin, tolak!
  if (!user || user.role !== 'admin') {
    // Bisa dikembalikan ke text 403 atau di-redirect ke halaman login
    return c.text('403 Forbidden: Akses Ditolak. Anda bukan Administrator.', 403)
    
    // Opsional: Jika ingin langsung dilempar ke login, gunakan baris ini:
    // return c.redirect('/login')
  }
  
  // Jika aman (admin), lanjutkan ke halaman yang dituju
  await next()
})
