import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const id = c.req.param('id')
  const formData = await c.req.formData()
  
  // 1. Tangkap Data Dasar
  const name = formData.get('name') as string
  const category_id = formData.get('category_id') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  
  // 2. Tangkap Data Angka
  const price = parseInt(formData.get('price') as string) || 0
  const compare_at_price = parseInt(formData.get('compare_at_price') as string) || 0
  const stock = parseInt(formData.get('stock') as string) || 0
  const weight = parseInt(formData.get('weight') as string) || 500
  const is_active = parseInt(formData.get('is_active') as string) || 0
  const is_digital = parseInt(formData.get('is_digital') as string) || 0

  // 3. Tangkap Spesifikasi Tambahan
  const color = formData.get('color') as string || ''
  const dimensions = formData.get('dimensions') as string || ''
  const model_name = formData.get('model_name') as string || ''
  const production_year = formData.get('production_year') as string || ''
  const exterior_material = formData.get('exterior_material') as string || ''
  const interior_material = formData.get('interior_material') as string || ''
  const hardware_color = formData.get('hardware_color') as string || ''
  const inclusions = formData.get('inclusions') as string || ''
  const brand_serial = formData.get('brand_serial') as string || ''

  // 4. TANGKAP ARRAY GAMBAR (GALERI)
  // Mengambil semua input dengan name="images[]"
  const imagesArray = formData.getAll('images[]') as string[]
  // Buang URL kosong, lalu ubah jadi JSON String
  const imagesJson = JSON.stringify(imagesArray.filter(url => url.trim() !== ''))

  // 5. Eksekusi Update Besar-Besaran
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

  // Ambil data produk
  const product = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first()
  if (!product) return c.redirect('/admin/products')

  // Ambil data kategori
  const { results: categories } = await db.prepare("SELECT id, name FROM categories ORDER BY name ASC").all()

  // Amankan data JSON Gambar agar tidak crash saat dilempar ke Javascript
  const safeImagesJson = product.images_json ? product.images_json : '[]'

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 max-w-5xl mx-auto mt-6 mb-12">
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Edit Produk Super Lengkap</h2>
          <p className="text-sm text-gray-500">Kelola galeri gambar, spesifikasi detail, harga, dan inventori produk.</p>
        </div>
        <a href="/admin/products" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black">
          ← Kembali
        </a>
      </div>

      <form method="POST" className="space-y-8">
        
        {/* =========================================
            BLOK GALERI GAMBAR INTERAKTIF 
            ========================================= */}
        <div className="bg-gray-50 p-5 rounded-sm border border-gray-200 shadow-inner">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Galeri Gambar Produk</h3>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">URL Base</span>
           </div>
           
           {/* Grid Visual Galeri (Dibuat otomatis oleh JS) */}
           <div id="image-gallery-grid" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-5">
              {/* Tempat gambar akan dirender */}
           </div>

           {/* Input Tersembunyi (Disinkronkan oleh JS untuk dikirim ke Backend) */}
           <div id="hidden-images-container" className="hidden"></div>

           {/* Alat Penambah Gambar */}
           <div className="flex gap-2">
              <input 
                type="url" 
                id="new-image-url" 
                placeholder="Tempel URL Gambar di sini (Contoh: https://res.cloudinary.com/...)" 
                className="flex-1 border border-gray-300 px-4 py-2 text-sm rounded-sm focus:ring-black" 
              />
              <button 
                type="button" 
                onClick="window.addImage()" 
                className="bg-blue-600 text-white px-6 py-2 text-xs font-bold rounded-sm uppercase tracking-wider hover:bg-blue-700 shadow-sm"
              >
                + Tambah Gambar
              </button>
           </div>
           <p className="text-[10px] text-gray-500 mt-2">Gambar pertama (kiri atas) akan menjadi *Thumbnail* utama. Klik Hapus pada gambar untuk membuangnya dari galeri.</p>
        </div>

        {/* BLOK INFORMASI DASAR */}
        <div className="bg-white p-5 rounded-sm border border-gray-100 shadow-sm">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Informasi Dasar</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Produk</label>
                 <input type="text" name="name" value={product.name as string} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold text-gray-900" />
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
                 <input type="text" name="brand" value={product.brand as string} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black uppercase font-bold" />
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
        <div className="bg-white p-5 rounded-sm border border-gray-100 shadow-sm">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Harga & Inventori</h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Harga Jual Normal (Rp)</label>
                 <input type="number" name="price" value={product.price as number} required className="w-full border border-blue-300 px-3 py-2 text-base rounded-sm focus:ring-blue-500 font-black text-blue-700 bg-blue-50" />
              </div>
              
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Harga Coret / Asli (Rp) - Opsional</label>
                 <input type="number" name="compare_at_price" value={product.compare_at_price as number || ''} placeholder="Contoh: 1500000" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black text-gray-500 line-through" />
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sisa Stok</label>
                 <input type="number" name="stock" value={product.stock as number} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold" />
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Berat Gram</label>
                 <input type="number" name="weight" value={product.weight as number || 500} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" title="Berat dalam gram (Cth: 1000 = 1Kg)" />
              </div>

              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status Visibilitas Web</label>
                 <select name="is_active" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white font-bold">
                    <option value="1" selected={product.is_active === 1}>AKTIF (Ditampilkan di Toko)</option>
                    <option value="0" selected={product.is_active === 0}>NONAKTIF (Disembunyikan)</option>
                 </select>
              </div>
           </div>
        </div>

        {/* BLOK SPESIFIKASI DETAIL (LENGKAP SESUAI DATABASE) */}
        <div className="bg-white p-5 rounded-sm border border-gray-100 shadow-sm">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Spesifikasi Detail Tambahan</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                 <input type="text" name="production_year" value={product.production_year as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" placeholder="Cth: 2023" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dimensi (P x L x T)</label>
                 <input type="text" name="dimensions" value={product.dimensions as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" placeholder="20cm x 10cm x 5cm" />
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
                 <input type="text" name="hardware_color" value={product.hardware_color as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" placeholder="Gold / Silver" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nomor Seri Brand</label>
                 <input type="text" name="brand_serial" value={product.brand_serial as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-mono" />
              </div>
              <div className="md:col-span-3">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kelengkapan (Inclusions)</label>
                 <input type="text" name="inclusions" value={product.inclusions as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" placeholder="Box, Dustbag, Certificate..." />
              </div>
           </div>
        </div>

        {/* BLOK DESKRIPSI UTAMA */}
        <div className="bg-white p-5 rounded-sm border border-gray-100 shadow-sm">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Deskripsi Produk (SEO & Konten)</h3>
           <textarea 
             name="description" 
             rows={12} 
             required 
             className="w-full border border-gray-300 px-4 py-3 text-sm rounded-sm focus:ring-black text-gray-700 leading-relaxed font-serif"
           >{product.description as string}</textarea>
        </div>

        {/* TOMBOL AKSI BAWAH */}
        <div className="pt-6 pb-12 flex justify-end space-x-3 border-t border-gray-200">
          <a href="/admin/products" className="bg-white text-gray-600 border border-gray-300 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
            Batalkan
          </a>
          <button type="submit" className="bg-black text-white px-10 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-800 shadow-xl transition-all">
            SIMPAN SELURUH PERUBAHAN
          </button>
        </div>
      </form>

      {/* ==========================================
          SCRIPT MESIN GALERI GAMBAR 
          ========================================== */}
      <script dangerouslySetInnerHTML={{__html: `
        // 1. Ambil data gambar awal dari Backend (PHP/HonoX)
        let productImages = ${safeImagesJson};

        // 2. Fungsi Utama Render Galeri
        function renderGallery() {
            const grid = document.getElementById('image-gallery-grid');
            const hiddenContainer = document.getElementById('hidden-images-container');
            
            // Bersihkan kanvas
            grid.innerHTML = '';
            hiddenContainer.innerHTML = '';

            if (productImages.length === 0) {
                grid.innerHTML = '<div class="col-span-full p-8 text-center border-2 border-dashed border-gray-300 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-sm bg-white">Belum ada gambar ditambahkan</div>';
                return;
            }

            productImages.forEach((url, index) => {
                // A. Buat Kartu Visual
                grid.innerHTML += \`
                    <div class="relative group border border-gray-200 rounded-sm overflow-hidden bg-white aspect-square shadow-sm">
                        \${index === 0 ? '<span class="absolute top-0 left-0 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 z-10 rounded-br-sm">Utama</span>' : ''}
                        <img src="\${url}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button type="button" onclick="window.removeImage(\${index})" class="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 hover:scale-110 transition-all shadow-lg focus:outline-none">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                           </button>
                        </div>
                    </div>
                \`;

                // B. Buat Input Tersembunyi (Ini yang akan dibaca oleh formData.getAll('images[]') di server)
                hiddenContainer.innerHTML += \`<input type="hidden" name="images[]" value="\${url}" />\`;
            });
        }

        // 3. Fungsi Tambah Gambar
        window.addImage = function() {
            const input = document.getElementById('new-image-url');
            const url = input.value.trim();
            
            if (url && url.startsWith('http')) {
                productImages.push(url);
                input.value = ''; // Kosongkan input
                renderGallery();  // Render ulang
            } else {
                alert('Tolong masukkan URL gambar yang valid (dimulai dengan http/https).');
            }
        };

        // 4. Fungsi Hapus Gambar (Berdasarkan Index)
        window.removeImage = function(index) {
            productImages.splice(index, 1);
            renderGallery();
        };

        // Jalankan render saat halaman pertama kali dimuat
        renderGallery();
      `}} />

    </div>,
    { title: 'Edit Produk Lanjutan | Admin' }
  )
})
