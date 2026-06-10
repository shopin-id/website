import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.text('Unauthorized', 401)

  const formData = await c.req.formData()
  
  // Ambil semua field pengaturan dari form
  const siteName = formData.get('site_name') as string || 'ShopinId'
  const siteDescription = formData.get('site_description') as string || ''
  const adminWhatsapp = formData.get('admin_whatsapp') as string || '6281234567890'
  const defaultAdminFee = formData.get('default_admin_fee') as string || '0'

  // Simpan data dengan metode Key-Value ON CONFLICT (Sangat aman di SQLite / D1)
  const settingsData = [
    { key: 'site_name', value: siteName },
    { key: 'site_description', value: siteDescription },
    { key: 'admin_whatsapp', value: adminWhatsapp },
    { key: 'default_admin_fee', value: defaultAdminFee }
  ]

  const statements = settingsData.map(item => {
    return db.prepare(`
      INSERT INTO platform_settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).bind(item.key, item.value)
  })

  // Jalankan batch statement serentak
  await db.batch(statements)

  return c.redirect('/admin/settings?success=1')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const success = c.req.query('success')

  // 1. Pembuat tabel otomatis secara defensif jika belum ada di database
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  // 2. Tarik semua data pengaturan dari database
  const { results } = await db.prepare("SELECT key, value FROM platform_settings").all()
  
  // 3. Petakan hasil query ke dalam object key-value agar mudah dibaca di form
  const settings: Record<string, string> = {}
  results.forEach((row: any) => {
    settings[row.key] = row.value
  })

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 max-w-3xl mx-auto mt-6">
      
      {/* HEADER HALAMAN */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Pengaturan Platform</h2>
          <p className="text-sm text-gray-500 mt-0.5">Konfigurasi nama website, deskripsi SEO, nomor admin, dan biaya sistem.</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 text-sm font-bold rounded-sm mb-6">
          ✓ Konfigurasi pengaturan platform berhasil disimpan dan diterapkan!
        </div>
      )}

      {/* FORM PENGATURAN UTAMANYA */}
      <form method="POST" className="space-y-6">
        
        {/* BLOK IDENTITAS SITUS */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Identitas Website</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Aplikasi / Website</label>
              {/* PERBAIKAN: Menggunakan value={...} dan import path yang benar */}
              <input 
                type="text" 
                name="site_name" 
                value={settings.site_name || 'ShopinId'} 
                required 
                className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Deskripsi Meta / SEO</label>
              <textarea 
                name="site_description" 
                rows={3} 
                className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black text-gray-600"
                placeholder="Deskripsi ringkas marketplace Anda untuk mesin pencari Google..."
              >{settings.site_description || ''}</textarea>
            </div>
          </div>
        </div>

        {/* BLOK INTEGRASI DAN BIAYA */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Sistem & Integrasi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nomor WhatsApp Admin</label>
              <input 
                type="text" 
                name="admin_whatsapp" 
                value={settings.admin_whatsapp || '6281234567890'} 
                required 
                className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-mono font-bold" 
                placeholder="Gunakan kode negara (Cth: 6281234567890)"
              />
              <p className="text-[10px] text-gray-400 mt-1">Digunakan untuk menerima rujukan tombol "Tingkatkan Level" dari vendor.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Biaya Administrasi Default (Rp)</label>
              <input 
                type="number" 
                name="default_admin_fee" 
                value={settings.default_admin_fee || '0'} 
                required 
                className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold text-red-600" 
              />
              <p className="text-[10px] text-gray-400 mt-1">Biaya penanganan standar setiap transaksi pesanan baru.</p>
            </div>
          </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-black text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-800 shadow-md transition-all">
            Simpan Konfigurasi
          </button>
        </div>
      </form>

    </div>,
    { title: 'Pengaturan Platform | Admin' }
  )
})
