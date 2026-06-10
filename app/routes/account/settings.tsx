import { createRoute } from 'honox/factory'
import { getAuthUser, hashPassword } from '../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const formData = await c.req.formData()
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const avatarUrl = formData.get('avatar_url') as string
  const oldPassword = formData.get('old_password') as string
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  try {
    await db.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, address = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(name, phone, address, avatarUrl, user.id).run()

    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        return c.redirect('/account/settings?err=missing_fields')
      }

      if (newPassword !== confirmPassword) {
        return c.redirect('/account/settings?err=password_mismatch')
      }

      const userData = await db.prepare("SELECT password_hash FROM users WHERE id = ?").bind(user.id).first()
      const oldPasswordHash = await hashPassword(oldPassword)

      if (userData.password_hash !== oldPasswordHash) {
        return c.redirect('/account/settings?err=wrong_old_password')
      }

      const newPasswordHash = await hashPassword(newPassword)
      await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newPasswordHash, user.id).run()
    }

    return c.redirect('/account/settings?success=1')
  } catch (error) {
    return c.redirect('/account/settings?err=system_error')
  }
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const account = await db.prepare("SELECT name, email, phone, address, avatar_url FROM users WHERE id = ?").bind(user.id).first()
  
  if (!account) return c.redirect('/logout')

  const success = c.req.query('success')
  const error = c.req.query('err')

  return c.render(
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* SIDEBAR AKUN */}
        <aside className="w-full lg:col-span-1">
          <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
            <div className="w-16 h-16 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center text-2xl font-black mb-4 shadow-inner overflow-hidden border border-gray-200">
              {account.avatar_url ? (
                <img src={account.avatar_url as string} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                account.name.charAt(0).toUpperCase()
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 truncate">{account.name}</h2>
            <p className="text-xs text-gray-500 mb-6 truncate">{account.email}</p>
            
            <nav className="flex flex-col space-y-1">
              <a href="/account" className="block text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 px-4 py-2.5 rounded-sm transition-colors">Dasbor Akun</a>
              <a href="/account/orders" className="block text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 px-4 py-2.5 rounded-sm transition-colors">Riwayat Pesanan</a>
              <a href="/account/settings" className="block text-sm font-bold text-red-600 bg-red-50 px-4 py-2.5 rounded-sm">Pengaturan Profil</a>
              <a href="/seller" className="block text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-sm mt-4 border border-blue-100 transition-colors">Area Toko Saya</a>
              <form action="/logout" method="POST" className="pt-4 mt-4 border-t border-gray-100">
                <button type="submit" className="text-sm font-bold text-red-500 hover:text-red-700 w-full text-left px-4 py-2">Keluar (Logout)</button>
              </form>
            </nav>
          </div>
        </aside>

        {/* KONTEN UTAMA */}
        <section className="w-full lg:col-span-3">
          <div className="bg-white p-6 md:p-8 border border-gray-200 rounded-sm shadow-sm min-h-[500px]">
            <h3 className="text-xl font-black mb-6 border-b border-gray-100 pb-4 uppercase tracking-wider">Pengaturan Profil & Keamanan</h3>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 text-sm font-medium rounded-sm mb-6">
                ✓ Perubahan profil dan kata sandi berhasil diperbarui.
              </div>
            )}
            {error === 'missing_fields' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-sm font-medium rounded-sm mb-6">
                ⚠ Gagal mengubah password. Semua kolom password wajib diisi!
              </div>
            )}
            {error === 'password_mismatch' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-sm font-medium rounded-sm mb-6">
                ⚠ Password baru dan konfirmasi password tidak cocok!
              </div>
            )}
            {error === 'wrong_old_password' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-sm font-medium rounded-sm mb-6">
                ⚠ Password lama yang Anda masukkan tidak sesuai!
              </div>
            )}

            <form action="/account/settings" method="POST" className="space-y-8">
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Informasi Pribadi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Nama Lengkap</label>
                    <input type="text" name="name" required defaultValue={account.name} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">URL Avatar (Foto Profil)</label>
                    <input type="url" name="avatar_url" defaultValue={account.avatar_url as string || ''} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Nomor Telepon</label>
                    <input type="text" name="phone" defaultValue={account.phone || ''} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" placeholder="Contoh: 08123456789" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Alamat Lengkap Pengiriman</label>
                    <textarea name="address" rows={3} defaultValue={account.address || ''} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" placeholder="Tulis alamat rumah lengkap Anda..."></textarea>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Ubah Kata Sandi (Opsional)</h4>
                <p className="text-[11px] text-gray-500 mb-4">Kosongkan ketiga kolom di bawah ini jika Anda tidak ingin mengubah kata sandi Anda saat ini.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Password Lama</label>
                    <input type="password" name="old_password" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Password Baru</label>
                    <input type="password" name="new_password" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Ulangi Password Baru</label>
                    <input type="password" name="confirm_password" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black text-sm" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button type="submit" className="bg-black text-white px-8 py-3 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-gray-800 transition-colors shadow-sm">
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </section>

      </div>
    </div>
  )
})
