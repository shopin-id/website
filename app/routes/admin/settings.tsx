import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

// === MESIN PENYIMPAN PENGATURAN (JSON MODE) ===
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const formData = await c.req.formData()

  // 1. Kumpulkan semua data ke dalam satu objek Javascript
  const configObj = {
    site_name: formData.get('site_name') as string,
    site_description: formData.get('site_description') as string,
    contact_email: formData.get('contact_email') as string,
    contact_phone: formData.get('contact_phone') as string,
    admin_fee_percent: formData.get('admin_fee_percent') as string,
    min_withdrawal: formData.get('min_withdrawal') as string,
  }

  // 2. Ubah objek menjadi string JSON
  const configJsonStr = JSON.stringify(configObj)

  try {
    // 3. Simpan dengan teknik UPSERT (Insert jika belum ada, Update jika sudah ada ID 'global')
    await db.prepare(`
      INSERT INTO store_settings (id, config_json) 
      VALUES ('global', ?) 
      ON CONFLICT(id) DO UPDATE SET 
        config_json = excluded.config_json, 
        updated_at = CURRENT_TIMESTAMP
    `).bind(configJsonStr).run()

    return c.redirect('/admin/settings?success=1')
  } catch (err) {
    console.error("Gagal menyimpan pengaturan JSON:", err)
    return c.redirect('/admin/settings?err=1')
  }
})

// === ANTARMUKA HALAMAN PENGATURAN ===
export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  let config: Record<string, string> = {}
  
  try {
    // Tarik JSON dari database berdasarkan ID 'global'
    const row = await db.prepare("SELECT config_json FROM store_settings WHERE id = 'global'").first()
    
    if (row && row.config_json) {
      // Parsing JSON string kembali menjadi Objek
      config = JSON.parse(row.config_json as string)
    }
  } catch (e) {
    console.error("Gagal membaca atau mem-parsing tabel store_settings:", e)
  }

  const success = c.req.query('success')
  const err = c.req.query('err')

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 relative min-h-screen">
      
      <div className="mb-8 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Pengaturan Platform</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola identitas, kontak, dan aturan finansial utama dari marketplace Anda.</p>
      </div>

      <form action="/admin/settings" method="POST" className="space-y-8">
        
        {/* KATEGORI 1: IDENTITAS PLATFORM */}
        <div className="bg-gray-50 p-6 rounded-sm border border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            Identitas Website
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Platform (Site Name)</label>
              <input type="text" name="site_name" defaultValue={config['site_name'] || ''} required className="w-full border border-gray-300 px-4 py-3 rounded-sm text-sm focus:ring-black focus:border-black font-bold text-gray-900 bg-white" placeholder="Contoh: ShopinId" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi / Tagline Singkat</label>
              <textarea name="site_description" rows={2} defaultValue={config['site_description'] || ''} required className="w-full border border-gray-300 px-4 py-3 rounded-sm text-sm focus:ring-black focus:border-black text-gray-700 bg-white" placeholder="Slogan atau deskripsi platform..."></textarea>
            </div>
          </div>
        </div>

        {/* KATEGORI 2: KONTAK & DUKUNGAN */}
        <div className="bg-gray-50 p-6 rounded-sm border border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Kontak Customer Service
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Email Bantuan</label>
              <input type="email" name="contact_email" defaultValue={config['contact_email'] || ''} required className="w-full border border-gray-300 px-4 py-3 rounded-sm text-sm focus:ring-black focus:border-black text-gray-900 bg-white" placeholder="support@domain.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nomor Telepon / WhatsApp</label>
              <input type="text" name="contact_phone" defaultValue={config['contact_phone'] || ''} required className="w-full border border-gray-300 px-4 py-3 rounded-sm text-sm focus:ring-black focus:border-black text-gray-900 bg-white" placeholder="081234567890" />
            </div>
          </div>
        </div>

        {/* KATEGORI 3: ATURAN FINANSIAL */}
        <div className="bg-gray-50 p-6 rounded-sm border border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Aturan Keuangan & Transaksi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">Potongan Komisi Admin (%)</label>
              <div className="relative">
                <input type="number" min="0" max="100" name="admin_fee_percent" defaultValue={config['admin_fee_percent'] || ''} required className="w-full border border-gray-300 px-4 py-3 rounded-sm text-sm focus:ring-rose-500 focus:border-rose-500 font-black text-rose-700 bg-white" placeholder="5" />
                <span className="absolute right-4 top-3.5 text-gray-400 font-bold">%</span>
              </div>
              <p className="text-[9px] text-gray-500 mt-1 italic">Potongan dari setiap penjualan berhasil vendor.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-2">Batas Minimal Penarikan (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 font-bold">Rp</span>
                <input type="number" min="0" name="min_withdrawal" defaultValue={config['min_withdrawal'] || ''} required className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-sm text-sm focus:ring-teal-500 focus:border-teal-500 font-black text-teal-700 bg-white" placeholder="50000" />
              </div>
              <p className="text-[9px] text-gray-500 mt-1 italic">Syarat saldo minimal untuk melakukan "Tarik Dana".</p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 shadow-md w-full md:w-auto transition-colors">
            Simpan Perubahan
          </button>
        </div>
      </form>

      {/* CONTAINER TOAST NOTIFICATION KUSTOM */}
      <div id="toast-container" className="fixed top-5 right-5 z-[10000] flex flex-col gap-3"></div>

      {/* SCRIPT UX LOGIC */}
      <script dangerouslySetInnerHTML={{__html: `
        // === LOGIKA TOAST NOTIFICATION KUSTOM ===
        window.showToast = function(message, type = 'error') {
          const container = document.getElementById('toast-container');
          const toast = document.createElement('div');
          const isError = type === 'error';
          
          toast.className = 'flex items-center p-4 rounded-sm shadow-xl text-sm font-bold transform transition-all duration-300 translate-x-full opacity-0 ' + (isError ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'bg-green-50 text-green-700 border-l-4 border-green-600');
          toast.innerHTML = '<span class="mr-2 text-lg">' + (isError ? '⚠' : '✓') + '</span><span>' + message + '</span>';
          container.appendChild(toast);
          
          requestAnimationFrame(() => toast.classList.remove('translate-x-full', 'opacity-0'));
          setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
          }, 3000);
        };

        // Render otomatis Toast saat halaman dimuat jika berhasil/gagal disimpan
        ${success === '1' ? "window.showToast('Pengaturan global berhasil disimpan ke JSON!', 'success');" : ""}
        ${err === '1' ? "window.showToast('Gagal menyimpan pengaturan ke database.', 'error');" : ""}
      `}} />

    </div>,
    { title: 'Pengaturan Global | Admin' }
  )
})
