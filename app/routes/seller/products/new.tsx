import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'
import { generateId } from '../../../utils/admin_utils'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first()
  if (!store) return c.redirect('/seller/register')

  const formData = await c.req.formData()
  const name = formData.get('name') as string
  const brand = formData.get('brand') as string
  const category_id = formData.get('category_id') as string // DIKEMBALIKAN: Mengambil dari form
  const condition = formData.get('condition') as string
  const price = parseInt(formData.get('price') as string, 10)
  const stock = parseInt(formData.get('stock') as string, 10) || 1
  const description = formData.get('description') as string
  
  const images_json = formData.get('images_json') as string || '[]'

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6)
  const productId = generateId()

  try {
    await db.prepare(`
      INSERT INTO products (id, store_id, category_id, slug, name, brand, condition, description, price, stock, is_active, images_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(productId, store.id, category_id, slug, name, brand, condition, description, price, stock, images_json).run()

    return c.redirect('/seller/products?success=1')
  } catch (error) {
    return c.redirect('/seller/products/new?err=1')
  }
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  // MENGAMBIL DAFTAR KATEGORI DARI DATABASE
  const { results: categories } = await db.prepare("SELECT id, name FROM categories ORDER BY name ASC").all()

  return c.render(
    <div className="w-full bg-[#f4f7fc] min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
            <p className="text-sm text-gray-500">Unggah barang jualan ke etalase Boutique Anda.</p>
          </div>
          <a href="/seller" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">← Kembali ke Dasbor</a>
        </div>

        <form action="/seller/products/new" method="POST" className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 space-y-8">
          
          {/* Input Tersembunyi untuk menyimpan array URL Gambar */}
          <input type="hidden" name="images_json" id="images_json_input" value="[]" />

          {/* --- BLOK UPLOAD GAMBAR CLOUDINARY --- */}
          <div className="border border-gray-200 p-6 rounded-sm bg-gray-50">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">Foto Produk</label>
            
            <div id="drop-zone" className="border-2 border-dashed border-gray-300 bg-white p-8 rounded-sm text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
               <input type="file" id="file-upload" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
               <div className="text-gray-500">
                 <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                 <p className="font-bold text-sm text-gray-700">Klik untuk memilih gambar</p>
                 <p className="text-xs mt-1">atau seret dan lepas ke area ini (Otomatis terunggah ke Cloudinary)</p>
               </div>
            </div>
            
            <div id="upload-progress" className="hidden mt-4 text-center">
              <span className="inline-block animate-pulse text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                ⏳ Sedang memproses unggahan...
              </span>
            </div>

            <div id="image-preview" className="flex flex-wrap gap-4 mt-6"></div>
          </div>

          {/* --- BLOK INFO PRODUK --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nama Produk</label>
              <input type="text" name="name" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" placeholder="Contoh: Balenciaga City Bag Black" />
            </div>

            {/* DIKEMBALIKAN: DROPDOWN KATEGORI DINAMIS */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Kategori Produk</label>
              <select name="category_id" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors bg-white">
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Brand (Merek)</label>
              <input type="text" name="brand" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" placeholder="Contoh: Balenciaga" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Kondisi</label>
              <select name="condition" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors bg-white">
                <option value="Brand New">Brand New (Baru)</option>
                <option value="Excellent">Excellent (Sangat Baik)</option>
                <option value="Very Good">Very Good (Baik)</option>
                <option value="Good">Good (Cukup)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Harga Jual (Rp)</label>
              <input type="number" name="price" required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" placeholder="Contoh: 5000000" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Stok Tersedia</label>
              <input type="number" name="stock" required defaultValue="1" min="1" className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Deskripsi Produk & Kelengkapan</label>
            <textarea name="description" rows={5} required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black transition-colors" placeholder="Jelaskan kondisi detail, minus (jika ada), dan kelengkapan (Box, Dustbag, dll)"></textarea>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button type="submit" className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-md">
              Simpan & Terbitkan Produk
            </button>
          </div>
        </form>

        {/* SCRIPT UNGGAH AJAX KE CLOUDINARY VIA API/UPLOAD */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const fileInput = document.getElementById('file-upload');
            const progress = document.getElementById('upload-progress');
            const preview = document.getElementById('image-preview');
            const jsonInput = document.getElementById('images_json_input');
            const dropZone = document.getElementById('drop-zone');
            
            let uploadedImages = [];

            dropZone.addEventListener('dragover', (e) => {
               e.preventDefault();
               dropZone.classList.add('border-black', 'bg-gray-100');
            });
            dropZone.addEventListener('dragleave', () => {
               dropZone.classList.remove('border-black', 'bg-gray-100');
            });
            dropZone.addEventListener('drop', (e) => {
               e.preventDefault();
               dropZone.classList.remove('border-black', 'bg-gray-100');
               if(e.dataTransfer.files.length > 0) {
                  fileInput.files = e.dataTransfer.files;
                  fileInput.dispatchEvent(new Event('change'));
               }
            });

            fileInput.addEventListener('change', async (e) => {
               const files = e.target.files;
               if (!files.length) return;

               progress.classList.remove('hidden');

               for (const file of files) {
                  const formData = new FormData();
                  formData.append('file', file);

                  try {
                     const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                     });
                     const data = await res.json();

                     if (data.success) {
                        uploadedImages.push(data.url);
                        renderPreview();
                     } else {
                        alert('Gagal mengunggah: ' + (data.message || 'Error tidak diketahui'));
                     }
                  } catch (err) {
                     alert('Terjadi kesalahan jaringan saat mengunggah gambar.');
                  }
               }

               progress.classList.add('hidden');
               fileInput.value = '';
            });

            window.removeImage = function(index) {
               uploadedImages.splice(index, 1);
               renderPreview();
            };

            function renderPreview() {
               jsonInput.value = JSON.stringify(uploadedImages);
               preview.innerHTML = uploadedImages.map((url, i) => \`
                  <div class="relative w-24 h-24 border border-gray-200 rounded-sm overflow-hidden group shadow-sm bg-white p-1">
                     <img src="\${url}" class="w-full h-full object-cover rounded-sm" />
                     <button type="button" onclick="removeImage(\${i})" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 font-bold">X</button>
                  </div>
               \`).join('');
            }
          });
        `}} />
      </div>
    </div>
  )
})
