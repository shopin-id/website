import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const store = await db.prepare("SELECT id, slug FROM stores WHERE user_id = ?").bind(user.id).first()
  if (!store) return c.redirect('/seller/register')

  const formData = await c.req.formData()
  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const rawSlug = formData.get('slug') as string
  
  const avatar_url = formData.get('avatar_url') as string
  const banner_url = formData.get('banner_url') as string

  // Format slug: huruf kecil, ganti spasi/karakter aneh dengan strip
  let newSlug = rawSlug ? rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : store.slug

  // Cek ketersediaan slug jika penjual mengubahnya
  if (newSlug !== store.slug) {
    const existingStore = await db.prepare("SELECT id FROM stores WHERE slug = ? AND id != ?").bind(newSlug, store.id).first()
    
    if (existingStore) {
      // Buat suggesti postfix acak (4 karakter)
      const suggestion = `${newSlug}-${Math.random().toString(36).substring(2, 6)}`
      return c.redirect(`/seller/settings?err=slug_taken&suggest=${suggestion}`)
    }
  }

  try {
    await db.prepare(`
      UPDATE stores 
      SET slug = ?, description = ?, location = ?, avatar_url = ?, banner_url = ? 
      WHERE id = ?
    `).bind(newSlug, description, location, avatar_url, banner_url, store.id).run()

    return c.redirect('/seller/settings?success=1')
  } catch (err) {
    return c.redirect('/seller/settings?err=1')
  }
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const store = await db.prepare("SELECT * FROM stores WHERE user_id = ?").bind(user.id).first()
  if (!store) return c.redirect('/seller/register')

  const success = c.req.query('success')
  const err = c.req.query('err')
  const suggest = c.req.query('suggest')

  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + (store.name || 'Toko') + '&background=f3f4f6&color=000';
  const defaultBanner = 'https://placehold.co/800x200/e2e8f0/94a3b8?text=Banner+Toko';

  return c.render(
    <div className="py-8 px-4 md:px-10">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <div>
             <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pengaturan Toko</h1>
             <p className="text-sm text-gray-500 mt-1">Sesuaikan identitas dan URL toko publik Anda.</p>
          </div>
        </div>

        {success === '1' && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-sm shadow-sm">
            <p className="text-sm text-green-700 font-bold">✓ Profil toko berhasil diperbarui!</p>
          </div>
        )}

        {err === 'slug_taken' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-sm shadow-sm">
            <p className="text-sm text-red-700 font-bold mb-1">⚠ URL Toko tidak tersedia (sudah dipakai toko lain).</p>
            <p className="text-xs text-red-600">Saran URL untuk Anda: <strong className="bg-white px-1 border border-red-200">{suggest}</strong></p>
          </div>
        )}

        <form action="/seller/settings" method="POST" className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 space-y-8">
          
          {/* AREA UPLOAD GAMBAR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 pb-8">
            
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Foto Profil (Avatar)</label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0 relative">
                  <img id="avatar_preview" src={(store.avatar_url as string) || defaultAvatar} className="w-full h-full object-cover" />
                  <div id="avatar_loading" className="absolute inset-0 bg-white/80 flex items-center justify-center hidden">
                    <span className="text-xs font-bold animate-pulse">Wait...</span>
                  </div>
                </div>
                <div className="flex-1">
                  <input type="hidden" name="avatar_url" id="avatar_url_input" value={store.avatar_url as string || ''} />
                  <input type="file" id="avatar_file" accept="image/*" className="hidden" 
                    onChange="uploadImageToServer('avatar_file', 'avatar_url_input', 'avatar_preview', 'avatar_loading')" />
                  <button type="button" onClick="document.getElementById('avatar_file').click()" className="border border-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition">
                    Pilih Gambar
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Gambar Banner</label>
              <div className="space-y-4">
                <div className="w-full h-24 rounded-sm border border-gray-200 overflow-hidden bg-gray-50 relative">
                  <img id="banner_preview" src={(store.banner_url as string) || defaultBanner} className="w-full h-full object-cover" />
                  <div id="banner_loading" className="absolute inset-0 bg-white/80 flex items-center justify-center hidden">
                    <span className="text-xs font-bold animate-pulse">Uploading...</span>
                  </div>
                </div>
                <div>
                  <input type="hidden" name="banner_url" id="banner_url_input" value={store.banner_url as string || ''} />
                  <input type="file" id="banner_file" accept="image/*" className="hidden" 
                    onChange="uploadImageToServer('banner_file', 'banner_url_input', 'banner_preview', 'banner_loading')" />
                  <button type="button" onClick="document.getElementById('banner_file').click()" className="border border-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition">
                    Ubah Banner
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* AREA TEKS & URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Input URL Toko yang bisa diubah */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">URL Toko (Boutique Link)</label>
              <div className="flex rounded-sm shadow-sm">
                <span className="inline-flex items-center px-4 rounded-l-sm border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  shopinid.com/store/
                </span>
                <input type="text" name="slug" required defaultValue={store.slug as string} className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-sm border border-gray-300 focus:ring-black focus:border-black sm:text-sm font-bold" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Lokasi Pengiriman (Kota)</label>
              <input type="text" name="location" required defaultValue={store.location as string || ''} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black text-sm" placeholder="Contoh: Jakarta Selatan" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Deskripsi Toko</label>
              <textarea name="description" rows={5} required defaultValue={store.description as string || ''} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black text-sm" placeholder="Ceritakan keunikan barang yang Anda jual..."></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-colors shadow-md w-full md:w-auto">
              Simpan Pengaturan
            </button>
          </div>
        </form>

      </div>

      <script dangerouslySetInnerHTML={{__html: `
        async function uploadImageToServer(fileInputId, hiddenInputId, previewId, loadingId) {
          const fileInput = document.getElementById(fileInputId);
          const file = fileInput.files[0];
          if (!file) return;

          const loadingIndicator = document.getElementById(loadingId);
          const previewImage = document.getElementById(previewId);
          const hiddenInput = document.getElementById(hiddenInputId);

          loadingIndicator.classList.remove('hidden');
          const formData = new FormData();
          formData.append('file', file);

          try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
              previewImage.src = result.url;
              hiddenInput.value = result.url;
            } else {
              alert('Gagal mengunggah: ' + (result.message || 'Error'));
            }
          } catch (error) {
            alert('Kesalahan jaringan.');
          } finally {
            loadingIndicator.classList.add('hidden');
            fileInput.value = ''; 
          }
        }
      `}} />

    </div>
  )
})
