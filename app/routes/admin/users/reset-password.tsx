import { createRoute } from 'honox/factory'
import { getAuthUser, hashPassword } from '../../../utils/auth'

// --- LOGIKA BACKEND: ADMIN MERESET PASSWORD PENGGUNA ---
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const loggedInUser = await getAuthUser(c)
  
  // Validasi mutlak hak akses Administrator
  if (!loggedInUser || loggedInUser.role !== 'admin') return c.redirect('/login')

  const formData = await c.req.formData()
  const targetUserId = formData.get('target_user_id') as string
  const forcedNewPassword = formData.get('forced_new_password') as string

  if (!targetUserId || !forcedNewPassword) {
    return c.redirect('/admin/users/reset-password?err=missing')
  }

  try {
    // Jalankan enkripsi password baru dan paksa timpa database target
    const encryptedNewPassword = await hashPassword(forcedNewPassword)
    
    const result = await db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(encryptedNewPassword, targetUserId).run()

    if (result.meta.changes === 0) {
      return c.redirect('/admin/users/reset-password?err=not_found')
    }

    return c.redirect(`/admin/users/reset-password?success=1&target=${targetUserId}`)
  } catch (error) {
    return c.redirect('/admin/users/reset-password?err=failed')
  }
})

// --- LOGIKA FRONTEND: FORM FORCE RESET PASSWORD ---
export default createRoute(async (c) => {
  const loggedInUser = await getAuthUser(c)
  if (!loggedInUser || loggedInUser.role !== 'admin') return c.redirect('/login')

  const success = c.req.query('success')
  const error = c.req.query('err')
  const target = c.req.query('target')

  return c.render(
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Overtake & Reset Kata Sandi User</h1>
        <a href="/admin" className="text-xs font-bold text-gray-500 hover:text-black">← Menu Admin</a>
      </div>

      <div className="bg-white p-6 md:p-8 border border-gray-200 rounded-sm shadow-sm space-y-6">
        <p className="text-xs text-gray-500 leading-relaxed bg-yellow-50 p-3 border border-yellow-100 text-yellow-800 rounded-sm">
          <strong>Perhatian Super Admin:</strong> Fitur ini akan langsung menimpa kunci enkripsi lama pengguna tanpa memerlukan konfirmasi kata sandi lama mereka. Gunakan hanya jika ada permintaan resmi dari pemilik akun.
        </p>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 text-xs font-medium rounded-sm">
            ✓ Akun dengan ID <strong className="underline">{target}</strong> berhasil diganti password-nya. Silakan infokan password baru tersebut kepada user.
          </div>
        )}
        {error === 'not_found' && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-xs font-medium rounded-sm">
            ⚠ ID User tidak ditemukan di sistem. Periksa kembali kecocokan data.
          </div>
        )}
        {error === 'missing' && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-xs font-medium rounded-sm">
            ⚠ Seluruh data form masukan wajib terisi dengan benar.
          </div>
        )}

        <form action="/admin/users/reset-password" method="POST" className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Masukkan User ID / Vendor ID Target</label>
            <input type="text" name="target_user_id" required placeholder="Contoh: USR-1H2F3TR2" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black font-mono text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Setel Password Baru Secara Paksa</label>
            <input type="text" name="forced_new_password" required placeholder="Ketik kata sandi acak baru yang kuat" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" className="w-full bg-black text-white px-8 py-3 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-gray-800 shadow-md">
              Eksekusi Perubahan Kata Sandi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})
