import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'
import { generateId } from '../../utils/admin_utils'

// --- HANDLER POST: MENYIMPAN HASIL URL CLOUDINARY KE DATABASE ---
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  
  if (!user || user.role !== 'admin') return c.redirect('/login')

  const formData = await c.req.formData()
  const fileUrl = formData.get('file_url') as string
  const id = 'MED-' + generateId().substring(0, 8).toUpperCase()

  if (!fileUrl) {
    return c.redirect('/admin/media?err=missing_url')
  }

  try {
    // Simpan data url file ke tabel media platform
    await db.prepare(`
      INSERT INTO media (id, url, created_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind(id, fileUrl).run()

    return c.redirect('/admin/media?success=1')
  } catch (error) {
    return c.redirect('/admin/media?err=db_error')
  }
})

// --- HANDLER GET: TAMPILKAN GALERI MEDIA ---
export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  
  if (!user || user.role !== 'admin') return c.redirect('/login')

  // Mengambil data seluruh item galeri yang tersimpan
  const { results: galleryItems } = await db.prepare("SELECT * FROM media ORDER BY created_at DESC").all()
  
  const success = c.req.query('success')
  const error = c.req.query('err')

  return c.render(
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-widest">Galeri Media Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Unggah dan kelola aset gambar CDN Cloudinary secara terpusat.</p>
        </div>
        <div>
          {/* Tombol pemicu input file AJAX */}
          <input type="file" id="media_file_input" accept="image/*" className="hidden" onChange="uploadToCloudinary()" />
          <button 
            type="button" 
            onClick="document.getElementById('media_file_input').click()"
            className="bg-black text-white px-6 py-3 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition shadow-sm"
          >
            + Unggah Gambar Baru
          </button>
        </div>
      </div>

      {/* Indikator Loading Status */}
      <div id="upload_loader" className="hidden bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-sm text-sm font-medium animate-pulse">
        Sedang mengunggah file gambar ke server Cloudinary, mohon tunggu sebentar...
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-sm text-sm font-medium">✓ Gambar baru berhasil diunggah dan disimpan ke dalam galeri.</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-sm text-sm font-medium">⚠ Terjadi kesalahan sistem saat memproses atau menyimpan berkas gambar.</div>}

      {/* Form Tersembunyi Untuk Submit URL Cloudinary ke SQLite */}
      <form id="save_media_form" action="/admin/media" method="POST" className="hidden">
        <input type="hidden" name="file_url" id="cloudinary_url_holder" />
      </form>

      {/* RENDER GRID ITEM GAMBAR */}
      <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
        {galleryItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400 italic text-sm">Belum ada aset gambar yang diunggah ke dalam galeri media.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {galleryItems.map((item: any) => (
              <div key={item.id} className="group border border-gray-100 rounded-sm overflow-hidden bg-gray-50 relative aspect-square flex items-center justify-center p-2 shadow-sm hover:shadow-md transition">
                <img src={item.url} alt="Media Asset" className="object-contain w-full h-full" loading="lazy" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2">
                  <button 
                    type="button" 
                    onClick={`navigator.clipboard.writeText('${item.url}'); alert('URL Gambar berhasil disalin ke clipboard!');`}
                    className="bg-white text-black text-[9px] font-bold uppercase px-2 py-1.5 tracking-wider rounded-sm shadow hover:bg-gray-100"
                  >
                    Salin URL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JAVASCRIPT CLIENT AJAX UPLOAD */}
      <script dangerouslySetInnerHTML={{__html: `
        async function uploadToCloudinary() {
          const fileInput = document.getElementById('media_file_input');
          const file = fileInput.files[0];
          if (!file) return;

          const loader = document.getElementById('upload_loader');
          const form = document.getElementById('save_media_form');
          const urlHolder = document.getElementById('cloudinary_url_holder');

          // Munculkan indikator pengunggahan gambar
          loader.classList.remove('hidden');

          const formData = new FormData();
          formData.append('file', file);

          try {
            // Memanfaatkan API upload Cloudinary terpadu yang sudah kita miliki
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();

            if (result.success && result.url) {
              // Masukkan URL ke input tersembunyi dan otomatis trigger submit form native
              urlHolder.value = result.url;
              form.submit();
            } else {
              alert('Gagal mengunggah media: ' + (result.message || 'Error repositori pihak ketiga'));
              loader.classList.add('hidden');
            }
          } catch (err) {
            alert('Gangguan koneksi jaringan terdeteksi saat melakukan proses unggah gambar.');
            loader.classList.add('hidden');
          } finally {
            fileInput.value = '';
          }
        }
      `}} />

    </div>
  )
})
