import { createRoute } from 'honox/factory'
import { deleteCookie } from 'hono/cookie'

// Handler jika logout ditekan melalui tombol Form (POST)
export const POST = createRoute(async (c) => {
  // Hapus cookie autentikasi. 
  // Catatan: Ganti 'session' atau 'token' sesuai dengan nama cookie yang Anda gunakan di app/utils/auth.ts
  deleteCookie(c, 'session') 
  deleteCookie(c, 'token')
  deleteCookie(c, 'auth_token')

  // Arahkan kembali ke halaman login
  return c.redirect('/login')
})

// Handler jika user iseng mengetik URL /logout langsung di browser (GET)
export default createRoute(async (c) => {
  deleteCookie(c, 'session')
  deleteCookie(c, 'token')
  deleteCookie(c, 'auth_token')

  return c.redirect('/login')
})
