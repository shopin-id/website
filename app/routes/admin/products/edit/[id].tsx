import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const id = c.req.param('id')
  const formData = await c.req.formData()
  
  // 1. Tangkap Data Teks & Angka Komplit
  const name = formData.get('name') as string
  const category_id = formData.get('category_id') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  
  const price = parseInt(formData.get('price') as string) || 0
  const compare_at_price = formData.get('compare_at_price') ? parseInt(formData.get('compare_at_price') as string) : null
  const stock = parseInt(formData.get('stock') as string) || 0
  const weight = parseInt(formData.get('weight') as string) || 500
  const is_active = parseInt(formData.get('is_active') as string) || 0
  const is_digital = parseInt(formData.get('is_digital') as string) || 0

  // Atribut Spesifikasi Detail
  const color = formData.get('color') as string || ''
  const dimensions = formData.get('dimensions') as string || ''
  const model_name = formData.get('model_name') as string || ''
  const production_year = formData.get('production_year') as string || ''
  const exterior_material = formData.get('exterior_material') as string || ''
  const interior_material = formData.get('interior_material') as string || ''
  const hardware_color = formData.get('hardware_color') as string || ''
  const inclusions = formData.get('inclusions') as string || ''
  const brand_serial = formData.get('brand_serial') as string || ''

  // 2. TANGKAP ARRAY IMAGES (Berisi gambar lama + gambar baru dari API /api/media)
  const imagesArray = formData.getAll('images[]') as string[]
  const imagesJson = JSON.stringify(imagesArray.filter(url => url.trim() !== ''))

  // 3. Eksekusi Update ke Database
  await db.prepare(`
    UPDATE products 
    SET name = ?, category_id = ?, brand = ?, condition = ?, description = ?, 
        price = ?, compare_at_price = ?, stock = ?, weight = ?, is_active = ?, is_digital = ?,
        color = ?, dimensions = ?, model_name = ?, production_year = ?, 
        exterior_material = ?, interior_material = ?, hardware_color = ?, inclusions = ?, brand_serial = ?,
        images_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    name, category_id, brand, condition, description, 
    price, compare_at_price, stock, weight, is_active, is_digital,
    color, dimensions, model_name, production_year, 
    exterior_material, interior_material, hardware_color, inclusions, brand_serial,
    imagesJson, id
  ).run()

  return c.redirect('/admin/products?success=1')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const id = c.req.param('id')

  // Ambil data produk lama
  const product = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first()
  if (!product) return c.redirect('/admin/products')

  // Ambil data kategori
  const { results: categories } = await db.prepare("SELECT id, name FROM categories ORDER BY name ASC").all()

  // Amankan data JSON Gambar agar aman di-parsing oleh Javascript sisi klien
  const safeImagesJson = product.images_json ? product.images_json : '[]'

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 max-w-4xl mx-auto mt-6 mb-12">
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Edit Detail Produk</h2>
          <p className="text-sm text-gray-500">Kelola gambar galeri, stok, harga, dan spesifikasi secara komprehensif.</p>
        </div>
        <a href="/admin/products" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black">
          ← Kembali ke Daftar
        </a>
      </div>

      <form method="POST" className="space-y-6" id="product-form">
        
        {/* AREA DRAG & DROP UNTUK UPLOAD GAMBAR TAMBAHAN VIA API */}
        <div className="bg-gray-50 p-5 rounded-sm border border-gray-200 shadow-inner">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Galeri Foto Produk</h3>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">Realtime Upload</span>
           </div>
           
           <div id="image-preview-grid" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-5">
              {/* Hasil kembalian link gambar dipajang di sini */}
           </div>

           <div id="hidden-images-container" className="hidden"></div>

           <div className="relative border-2 border-dashed border-gray-300 bg-white rounded-sm p-8 text-center hover:bg-gray-50 transition-colors group cursor-pointer">
              <input 
                type="file" 
                id="image-upload-input" 
                multiple 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="text-gray-500 group-hover:text-black transition-colors">
                 <svg className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                 <p className="text-xs font-bold uppercase tracking-wider">Pilih atau Seret Foto Tambahan ke Sini</p>
                 <p className="text-[10px] mt-1 text-gray-400">Berkas baru akan langsung ditambahkan ke galeri via API media.</p>
              </div>
           </div>
        </div>

        {/* BLOK INFORMASI DASAR */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Informasi Dasar</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Produk</label>
                 <input type="text" name="name" value={product.name as string || ''} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold text-gray-900" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kategori</label>
                 <select name="category_id" required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white">
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((cat: any) => (
                       <option key={cat.id} value={cat.id} selected={product.category_id === cat.id}>{cat.name}</option>
                    ))}
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Merek / Brand</label>
                 <input type="text" name="brand" value={product.brand as string || ''} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black uppercase font-bold" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kondisi Barang</label>
                 <select name="condition" required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white">
                    <option value="New" selected={product.condition === 'New'}>Baru (New)</option>
                    <option value="Pristine" selected={product.condition === 'Pristine'}>Sangat Mulus (Pristine)</option>
                    <option value="Excellent" selected={product.condition === 'Excellent'}>Sangat Bagus (Excellent)</option>
                    <option value="Good" selected={product.condition === 'Good'}>Bagus (Good)</option>
                    <option value="Fair" selected={product.condition === 'Fair'}>Cukup (Fair)</option>
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tipe Produk</label>
                 <select name="is_digital" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white">
                    <option value="0" selected={product.is_digital === 0}>Produk Fisik (Perlu Pengiriman)</option>
                    <option value="1" selected={product.is_digital === 1}>Produk Digital / Jasa</option>
                 </select>
              </div>
           </div>
        </div>

        {/* BLOK HARGA & INVENTORI */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Harga & Inventori</h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Harga Jual Normal (Rp)</label>
                 <input type="number" name="price" value={product.price as number || 0} required className="w-full border border-blue-300 px-3 py-2 text-base rounded-sm focus:ring-blue-500 font-black text-blue-700 bg-blue-50" />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Harga Coret / Asli (Rp) - Opsional</label>
                 <input type="number" name="compare_at_price" value={product.compare_at_price as number || ''} placeholder="Contoh: 1500000" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black text-gray-500 line-through" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Jumlah Stok</label>
                 <input type="number" name="stock" value={product.stock as number || 0} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Berat Gram</label>
                 <input type="number" name="weight" value={product.weight as number || 500} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status Visibilitas Web</label>
                 <select name="is_active" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white font-bold">
                    <option value="1" selected={product.is_active === 1}>AKTIF (Ditampilkan)</option>
                    <option value="0" selected={product.is_active === 0}>NONAKTIF (Disembunyikan)</option>
                 </select>
              </div>
           </div>
        </div>

        {/* BLOK SPESIFIKASI DETAIL */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Spesifikasi Detail Tambahan</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Warna (Color)</label>
                 <input type="text" name="color" value={product.color as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Model Name</label>
                 <input type="text" name="model_name" value={product.model_name as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tahun Produksi</label>
                 <input type="text" name="production_year" value={product.production_year as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dimensi (P x L x T)</label>
                 <input type="text" name="dimensions" value={product.dimensions as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Material Luar (Exterior)</label>
                 <input type="text" name="exterior_material" value={product.exterior_material as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Material Dalam (Interior)</label>
                 <input type="text" name="interior_material" value={product.interior_material as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Warna Perangkat (Hardware)</label>
                 <input type="text" name="hardware_color" value={product.hardware_color as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nomor Seri Brand</label>
                 <input type="text" name="brand_serial" value={product.brand_serial as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-mono" />
              </div>
              <div className="md:col-span-3">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kelengkapan (Inclusions)</label>
                 <input type="text" name="inclusions" value={product.inclusions as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
           </div>
        </div>

        {/* BLOK DESKRIPSI UTAMA */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Deskripsi Produk (SEO & Konten)</h3>
           <textarea name="description" rows={10} required className="w-full border border-gray-300 px-4 py-3 text-sm rounded-sm focus:ring-black text-gray-700 leading-relaxed font-serif">{product.description as string}</textarea>
        </div>

        {/* TOMBOL AKSI BAWAH */}
        <div className="pt-6 flex justify-end space-x-3 border-t border-gray-100">
          <a href="/admin/products" className="bg-white text-gray-600 border border-gray-300 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
            Batalkan
          </a>
          <button id="btn-submit" type="submit" className="bg-black text-white px-10 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-800 shadow-xl transition-all">
            SIMPAN PERUBAHAN
          </button>
        </div>
      </form>

      {/* ========================================================
          SCRIPT ARRAY-BASED STATE UNTUK GALERI GAMBAR
          ======================================================== */}
      <script dangerouslySetInnerHTML={{__html: `
        // State array utama yang memuat gambar existing dari database
        let productImages = ${safeImagesJson};
        
        const fileInput = document.getElementById('image-upload-input');
        const grid = document.getElementById('image-preview-grid');
        const hiddenContainer = document.getElementById('hidden-images-container');
        const form = document.getElementById('product-form');
        const btnSubmit = document.getElementById('btn-submit');

        // Render fungsi UI
        function renderGallery() {
            grid.innerHTML = '';
            hiddenContainer.innerHTML = '';

            productImages.forEach((url, index) => {
                grid.innerHTML += \`
                    <div class="relative group border border-gray-200 rounded-sm overflow-hidden bg-white aspect-square shadow-sm animate-fadeIn">
                        \${index === 0 ? '<span class="absolute top-0 left-0 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 z-10 rounded-br-sm">Utama</span>' : ''}
                        <img src="\${url}" class="w-full h-full object-cover" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button type="button" onclick="window.removeFile(\${index})" class="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all shadow-lg focus:outline-none">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                           </button>
                        </div>
                    </div>
                \`;

                // Menyuntikkan input hidden yang akan dikirim ke Backend POST handler
                hiddenContainer.innerHTML += \`<input type="hidden" name="images[]" value="\${url}" />\`;
            });
        }

        // Penghapusan element array
        window.removeFile = function(index) {
            productImages.splice(index, 1);
            renderGallery();
        };

        // Pemanggilan API Upload saat File dimasukkan
        fileInput.addEventListener('change', async function(event) {
            const files = Array.from(event.target.files);
            
            for (const file of files) {
                const tempId = 'loading-' + Math.random().toString(36).substring(2, 9);
                
                // Menambah kotak Loading sementara
                const loadCard = document.createElement('div');
                loadCard.id = tempId;
                loadCard.className = "border border-dashed border-gray-300 rounded-sm bg-gray-100 flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-wider text-gray-400 aspect-square animate-pulse text-center p-2";
                loadCard.innerHTML = \`
                   <svg class="w-5 h-5 animate-spin text-blue-600 mb-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Uploading...
                \`;
                grid.appendChild(loadCard);

                try {
                    const apiData = new FormData();
                    apiData.append('file', file);

                    // Panggil rute API Internal Cloudflare Pages Anda
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: apiData
                    });

                    if (!response.ok) throw new Error('Gagal memproses API Media');
                    
                    const result = await response.json();
                    
                    // Menghapus elemen loading
                    document.getElementById(tempId).remove();
                    
                    // Memasukkan hasil URL ke dalam array utama dan merender ulang galeri
                    productImages.push(result.url);
                    renderGallery();

                } catch (err) {
                    console.error(err);
                    loadCard.className = "border border-red-300 bg-red-50 text-red-600 font-bold rounded-sm aspect-square flex flex-col items-center justify-center text-[10px] p-2 text-center";
                    loadCard.innerHTML = '✕ Gagal Upload';
                    setTimeout(() => loadCard.remove(), 3000);
                }
            }
            fileInput.value = ''; // Reset input agar event change bisa mentrigger file yang sama
        });

        // Eksekusi Render Pertama Kali
        renderGallery();

        // Kunci form saat tombol submit ditekan
        form.addEventListener('submit', function() {
            btnSubmit.innerHTML = 'Menyimpan Perubahan...';
            btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
            btnSubmit.disabled = true;
        });
      `}} />

    </div>,
    { title: 'Edit Produk | Admin' }
  )
})
