import { createMiddleware } from 'hono/factory'
import { getAuthUser } from '../../utils/auth'

export const middleware = createMiddleware(async (c, next) => {
  // Fungsi getAuthUser memverifikasi token JWT (HS256) dari cookie
  const user = await getAuthUser(c)
  
  // Jika tidak ada token atau token tidak valid, tolak akses!
  if (!user) {
    return c.redirect('/login')
  }
  
  // Lanjutkan jika aman
  await next()
})
