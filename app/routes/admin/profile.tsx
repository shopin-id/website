import { createRoute } from 'honox/factory'
import { getAuthUser, hashPassword } from '../../utils/auth'

// --- LOGIKA BACKEND: ADMIN UBAH PASSWORD SENDIRI ---
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user || user.role !== 'admin') return c.redirect('/login')

  const formData = await c.req.formData()
  const oldPassword = formData.get('old_password') as string
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!oldPassword || !newPassword || !confirmPassword) {
    return c.redirect('/admin/profile?err=empty')
  }

  if (newPassword !== confirmPassword) {
    return c.redirect('/admin/profile?err=mismatch')
  }

  try {
    const adminData = await db.prepare("SELECT password_hash FROM users WHERE id = ?").bind(user.id).first()
    const currentOldHash = await hashPassword(oldPassword)

    if (adminData.password_hash !== currentOldHash) {
      return c.redirect('/admin/profile?err=wrong_password')
    }

    const newHash = await hashPassword(newPassword)
    await db.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(newHash, user.id).run()

    return c.redirect('/admin/profile?success=1')
  } catch (e) {
    return c.redirect('/admin/profile?err=sys')
  }
})

// --- LOGIKA FRONTEND: FORM PROFIL ADMIN ---
export default createRoute(async (c) => {
  const user = await getAuthUser(c)
  if (!user || user.role !== 'admin') return c.redirect('/login')

  const success = c.req.query('success')
  const error = c.req.query('err')

  return c.render(
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Profil Keamanan Admin</h1>
        <a href="/admin" className="text-xs font-bold text-gray-500 hover:text-black">← Kembali</a>
      </div>

      <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm space-y-6">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 text-xs font-bold rounded-sm">
            ✓ Password administrator sukses diperbarui!
          </div>
        )}
        {error === 'mismatch' && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-xs font-bold rounded-sm">
            ⚠ Konfirmasi kata sandi baru tidak cocok.
          </div>
        )}
        {error === 'wrong_password' && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-xs font-bold rounded-sm">
            ⚠ Verifikasi password lama administratif salah!
          </div>
        )}

        <form action="/admin/profile" method="POST" className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Nama Operator</label>
            <input type="text" disabled value={user.name} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-400 font-medium text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Password Sekarang</label>
            <input type="password" name="old_password" required className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Kata Sandi Baru</label>
            <input type="password" name="new_password" required className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Ulangi Kata Sandi Baru</label>
            <input type="password" name="confirm_password" required className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" />
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="w-full bg-red-600 text-white font-bold uppercase tracking-widest text-xs py-3 rounded-sm hover:bg-red-700 shadow-sm">
              Perbarui Password Sistem
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})
