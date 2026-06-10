import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const formData = await c.req.formData()
  const action = formData.get('action') as string
  const storeId = formData.get('store_id') as string

  // Defensif: Pastikan kolom status ada
  try { await db.prepare("ALTER TABLE stores ADD COLUMN status TEXT DEFAULT 'active'").run() } catch(e) {}

  if (action === 'toggle_status') {
    const currentStatus = formData.get('current_status') as string
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    await db.prepare("UPDATE stores SET status = ? WHERE id = ?").bind(newStatus, storeId).run()
  } else if (action === 'delete') {
    // Hapus toko (Tabel terkait seperti dompet dan produk akan terhapus jika Anda menyetel ON DELETE CASCADE di DB)
    await db.prepare("DELETE FROM stores WHERE id = ?").bind(storeId).run()
  }

  return c.redirect('/admin/stores')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const success = c.req.query('success')

  // Defensif: Pastikan kolom status terbaca (jika db lama, anggap active)
  try { await db.prepare("ALTER TABLE stores ADD COLUMN status TEXT DEFAULT 'active'").run() } catch(e) {}
  
  const { results: stores } = await db.prepare(`
    SELECT s.id, s.name, s.slug, s.status, s.created_at, 
           u.name as owner_name, u.email as owner_email,
           (SELECT available_balance FROM vendor_wallets WHERE store_id = s.id LIMIT 1) as balance
    FROM stores s 
    JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
  `).all()

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <div>
           <h2 className="text-xl font-bold text-gray-900">Manajemen Toko (Vendor)</h2>
           <p className="text-sm text-gray-500 mt-1">Kelola perizinan dan kendalikan akun vendor.</p>
        </div>
        <a href="/admin/stores/new" className="bg-green-600 text-white px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-green-700 shadow-sm transition-colors">
          + Tambah Vendor Manual
        </a>
      </div>

      {success === 'created' && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-sm mb-6">
          <p className="text-sm text-green-700 font-bold">✓ Vendor berhasil ditambahkan dan bonus Rp 13.000 telah masuk ke dompetnya!</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-y border-gray-200 text-[10px] uppercase tracking-widest text-gray-500">
              <th className="p-4 font-bold">Informasi Toko</th>
              <th className="p-4 font-bold">Pemilik (User)</th>
              <th className="p-4 font-bold">Saldo Dompet</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Aksi Manajemen</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {stores.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada toko yang terdaftar.</td></tr>
            )}
            {stores.map((s: any) => {
              const isActive = s.status === 'active' || !s.status;
              
              return (
              <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!isActive ? 'opacity-50 bg-gray-50' : ''}`}>
                <td className="p-4">
                  <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                     {s.name}
                     {!isActive && <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-widest">Banned</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">/store/{s.slug}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-gray-900">{s.owner_name}</div>
                  <div className="text-[11px] text-gray-500">{s.owner_email}</div>
                </td>
                <td className="p-4">
                  <span className="font-black text-green-600">Rp {(s.balance as number || 0).toLocaleString('id-ID')}</span>
                </td>
                <td className="p-4">
                   <form action="/admin/stores" method="POST" className="m-0">
                      <input type="hidden" name="action" value="toggle_status" />
                      <input type="hidden" name="store_id" value={s.id} />
                      <input type="hidden" name="current_status" value={isActive ? 'active' : 'suspended'} />
                      <button type="submit" className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'}`} title="Klik untuk mengubah status">
                         {isActive ? 'Aktif' : 'Suspended'}
                      </button>
                   </form>
                </td>
                <td className="p-4 text-right flex justify-end space-x-2">
                  <a href={`/store/${s.slug}`} target="_blank" className="bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase hover:bg-gray-200">Lihat</a>
                  
                  <form action="/admin/stores" method="POST" className="m-0" onSubmit={(e) => !confirm('Yakin ingin menghapus toko beserta produknya secara permanen?') && e.preventDefault()}>
                    <input type="hidden" name="action" value="delete" />
                    <input type="hidden" name="store_id" value={s.id} />
                    <button type="submit" className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase hover:bg-red-600 hover:text-white transition-colors">Hapus</button>
                  </form>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
})
