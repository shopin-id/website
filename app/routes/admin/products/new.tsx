import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'

// Generator ID & Slug standar HonoX
const generateId = () => Math.random().toString(36).substring(2, 12).toUpperCase()
const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + generateId().substring(0, 4).toLowerCase()

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const formData = await c.req.formData()
  
  // 1. Tangkap Data Teks & Angka Komplit sesuai Skema Tabel Proyek Anda
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

  // Atribut Spesifikasi Detail Luar & Dalam
  const color = formData.get('color') as string || ''
  const dimensions = formData.get('dimensions') as string || ''
  const model_name = formData.get('model_name') as string || ''
  const production_year = formData.get('production_year') as string || ''
  const exterior_material = formData.get('exterior_material') as string || ''
  const interior_material = formData.get('interior_material') as string || ''
  const hardware_color = formData.get('hardware_color') as string || ''
  const inclusions = formData.get('inclusions') as string || ''
  const brand_serial = formData.get('brand_serial') as string || ''

  // 2. TANGKAP ARRAY IMAGES (Hasil Suntikan Otomatis dari API /api/media di Sisi Klien)
  const imagesArray = formData.getAll('images[]') as string[]
  const imagesJson = JSON.stringify(imagesArray.filter(url => url.trim() !== ''))

  // 3. Olah Parameter Kunci Utama
  const id = 'PRD-' + generateId()
  const slug = generateSlug(name)

  // 4. Eksekusi Masukkan Data ke Tabel Cloudflare D1 (store_id = NULL karena Produk Resmi Platform)
  await db.prepare(`
    INSERT INTO products (
      id, category_id, slug, name, brand, condition, description, 
      price, compare_at_price, stock, weight, is_active, is_digital,
      color, dimensions, model_name, production_year, 
      exterior_material, interior_material, hardware_color, inclusions, brand_serial,
      images_json, store_id
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL
    )
  `).bind(
    id, category_id, slug, name, brand, condition, description, 
    price, compare_at_price, stock, weight, is_active, is_digital,
    color, dimensions, model_name, production_year, 
    exterior_material, interior_material, hardware_color, inclusions, brand_serial,
    imagesJson
  ).run()

  return c.redirect('/admin/products?success=created')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const { results: categories } = await db.prepare("SELECT id, name FROM categories ORDER BY name ASC").all()

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 max-w-4xl mx-auto mt-6 mb-12">
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Tambah Produk Baru Platform</h2>
          <p className="text-sm text-gray-500">Unggah berkas foto langsung menggunakan API media internal repositori Anda.</p>
        </div>
        <a href="/admin/products" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black">
          ← Kembali ke Daftar
        </a>
      </div>

      <form method="POST" className="space-y-6" id="product-form">
        
        {/* AREA DRAG & DROP UNTUK UNGGAH GAMBAR REALTIME */}
        <div className="bg-gray-50 p-5 rounded-sm border border-gray-200 shadow-inner">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 mb-4">Galeri Foto Produk</h3>
           
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
                 <p className="text-xs font-bold uppercase tracking-wider">Pilih atau Seret Foto ke Sini</p>
                 <p className="text-[10px] mt-1 text-gray-400">Berkas akan langsung diproses secara otomatis via sistem media platform.</p>
              </div>
           </div>
        </div>

        {/* BLOK INFORMASI DASAR */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Informasi Dasar</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Produk</label>
                 <input type="text" name="name" required placeholder="Contoh: Tas Balenciaga City Bag" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold text-gray-900" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kategori</label>
                 <select name="category_id" required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white">
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((cat: any) => (
                       <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Merek / Brand</label>
                 <input type="text" name="brand" required placeholder="Contoh: Balenciaga" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black uppercase font-bold" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kondisi Barang</label>
                 <select name="condition" required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white">
                    <option value="New">Baru (New)</option>
                    <option value="Pristine">Sangat Mulus (Pristine)</option>
                    <option value="Excellent">Sangat Bagus (Excellent)</option>
                    <option value="Good">Bagus (Good)</option>
                    <option value="Fair">Cukup (Fair)</option>
                 </select>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tipe Produk</label>
                 <select name="is_digital" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white">
                    <option value="0">Produk Fisik (Perlu Pengiriman)</option>
                    <option value="1">Produk Digital / Jasa</option>
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
                 <input type="number" name="price" required placeholder="0" className="w-full border border-blue-300 px-3 py-2 text-base rounded-sm focus:ring-blue-500 font-black text-blue-700 bg-blue-50" />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Harga Coret / Asli (Rp) - Opsional</label>
                 <input type="number" name="compare_at_price" placeholder="Contoh: 1500000" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black text-gray-500 line-through" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Jumlah Stok</label>
                 <input type="number" name="stock" required defaultValue="1" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Berat Gram</label>
                 <input type="number" name="weight" required defaultValue="500" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status Visibilitas Web</label>
                 <select name="is_active" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white font-bold">
                    <option value="1">AKTIF (Tampilkan Segera)</option>
                    <option value="0">NONAKTIF (Simpan sebagai Draft)</option>
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
                 <input type="text" name="color" placeholder="Cth: Black, Red" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Model Name</label>
                 <input type="text" name="model_name" placeholder="Cth: City Bag Medium" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tahun Produksi</label>
                 <input type="text" name="production_year" placeholder="Cth: 2023" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dimensi (P x L x T)</label>
                 <input type="text" name="dimensions" placeholder="20cm x 10cm x 5cm" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Material Luar (Exterior)</label>
                 <input type="text" name="exterior_material" placeholder="Cth: Lambskin Leather" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Material Dalam (Interior)</label>
                 <input type="text" name="interior_material" placeholder="Cth: Cotton Canvas" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Warna Perangkat (Hardware)</label>
                 <input type="text" name="hardware_color" placeholder="Cth: Gold / Silver" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nomor Seri Brand</label>
                 <input type="text" name="brand_serial" placeholder="Cth: BLC-900293X" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-mono" />
              </div>
              <div className="md:col-span-3">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kelengkapan (Inclusions)</label>
                 <input type="text" name="inclusions" placeholder="Box, Dustbag, Certificate..." className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
           </div>
        </div>

        {/* BLOK DESKRIPSI UTAMA */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Deskripsi Produk (SEO & Konten)</h3>
           <textarea name="description" rows={10} required placeholder="Tuliskan deskripsi lengkap produk..." className="w-full border border-gray-300 px-4 py-3 text-sm rounded-sm focus:ring-black text-gray-700 leading-relaxed font-serif"></textarea>
        </div>

        {/* TOMBOL AKSI BAWAH */}
        <div className="pt-6 flex justify-end space-x-3 border-t border-gray-100">
          <a href="/admin/products" className="bg-white text-gray-600 border border-gray-300 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors">
            Batalkan
          </a>
          <button id="btn-submit" type="submit" className="bg-green-600 text-white px-10 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-green-700 shadow-xl transition-all">
            + SIMPAN PRODUK BARU
          </button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{__html: `
        const fileInput = document.getElementById('image-upload-input');
        const grid = document.getElementById('image-preview-grid');
        const hiddenContainer = document.getElementById('hidden-images-container');
        const form = document.getElementById('product-form');
        const btnSubmit = document.getElementById('btn-submit');

        fileInput.addEventListener('change', async function(event) {
            const files = Array.from(event.target.files);
            
            for (const file of files) {
                const tempId = 'loading-' + Math.random().toString(36).substring(2, 9);
                
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

                    const response = await fetch('/api/media', {
                        method: 'POST',
                        body: apiData
                    });

                    if (!response.ok) throw new Error('Gagal memproses API Media');
                    
                    const result = await response.json();
                    const urlAset = result.url;

                    loadCard.removeAttribute('id');
                    loadCard.className = "relative group border border-gray-200 rounded-sm overflow-hidden bg-white aspect-square shadow-sm animate-fadeIn";
                    
                    const currentIdx = hiddenContainer.querySelectorAll('input').length;
                    
                    loadCard.innerHTML = \`
                        <img src="\${urlAset}" class="w-full h-full object-cover" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button type="button" onclick="this.closest('div.relative').remove(); document.getElementById('input-\${currentIdx}').remove(); refreshMainBadge();" class="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all shadow-lg focus:outline-none">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                           </button>
                        </div>
                    \`;

                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'images[]';
                    hiddenInput.id = 'input-' + currentIdx;
                    hiddenInput.value = urlAset;
                    hiddenContainer.appendChild(hiddenInput);

                    refreshMainBadge();

                } catch (err) {
                    console.error(err);
                    loadCard.className = "border border-red-300 bg-red-50 text-red-600 font-bold rounded-sm aspect-square flex flex-col items-center justify-center text-[10px] p-2 text-center";
                    loadCard.innerHTML = '✕ Gagal Upload';
                    setTimeout(() => loadCard.remove(), 3000);
                }
            }
            fileInput.value = ''; 
        });

        window.refreshMainBadge = function() {
            const cards = grid.querySelectorAll('div.group');
            cards.forEach((card, index) => {
                const badge = card.querySelector('span');
                if (badge) badge.remove();
                if (index === 0) {
                    const tag = document.createElement('span');
                    tag.className = "absolute top-0 left-0 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 z-10 rounded-br-sm";
                    tag.innerText = "Utama";
                    card.appendChild(tag);
                }
            });
        };

        form.addEventListener('submit', function() {
            btnSubmit.innerHTML = 'Memproses...';
            btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
            btnSubmit.disabled = true;
        });
      `}} />

    </div>,
    { title: 'Tambah Produk | Admin' }
  )
})
