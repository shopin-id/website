import { createRoute } from 'honox/factory';
import { generateId, invalidateProductCache } from '../../utils/admin_utils';
import { getAllCategories, buildCategoryOptions } from '../../utils/catalog';

export default createRoute(async (c) => {
  const dbCategories = await getAllCategories(c.env.DB);
  const hierarchicalCategories = buildCategoryOptions(dbCategories);

  return c.render(
    <div class="max-w-6xl mx-auto py-12 px-6">
      <link href="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/css/suneditor.min.css" rel="stylesheet" />
      
      <div class="mb-10 flex justify-between items-end border-b border-gray-100 pb-6">
        <div>
          <h1 class="text-3xl font-serif tracking-widest uppercase italic">Create Listing</h1>
          <p class="text-[10px] text-gray-400 mt-1 uppercase tracking-[0.3em]">Visoe Luxury Admin Panel</p>
        </div>
        <a href="/admin" class="text-[10px] font-bold border border-black px-4 py-2 uppercase tracking-widest hover:bg-black hover:text-white transition">Back to List</a>
      </div>

      <form id="product-form" method="POST" class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div class="lg:col-span-2 space-y-10">
          
          {/* MODERN UPLOAD ZONE: STREAMING & INSTANT */}
          <section class="bg-white p-8 border border-gray-100 shadow-sm">
            <h3 class="font-bold text-[10px] uppercase tracking-[0.3em] mb-6 border-b pb-4">Gallery (Real-time Streaming)</h3>
            
            <div id="drop-zone" class="group border-2 border-dashed border-gray-200 p-12 text-center hover:border-black transition-all cursor-pointer bg-gray-50/50 rounded-lg relative">
              <input type="file" id="file-picker" multiple accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div class="space-y-3 pointer-events-none">
                <div class="mx-auto w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition">
                  <span class="text-xl">+</span>
                </div>
                <p class="text-[11px] font-bold uppercase tracking-widest">Klik atau Tarik Gambar Ke Sini</p>
                <p class="text-[9px] text-gray-400 uppercase tracking-tight">Setiap file akan langsung diunggah ke Cloudflare R2 secara mandiri</p>
              </div>
            </div>
            
            {/* Preview Box Container */}
            <div id="upload-previews" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-8">
              {/* Box preview akan muncul di sini secara otomatis via JS */}
            </div>
            {/* Hidden Input untuk payload JSON images */}
            <input type="hidden" name="images_json" id="images_payload" value="[]" />
          </section>

          {/* DETAILED SPECIFICATIONS (Sesuai visoe.sql) */}
          <section class="bg-white p-8 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <h3 class="md:col-span-2 font-bold text-[10px] uppercase tracking-[0.3em] mb-2 border-b pb-4">Technical Specifications</h3>
            
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Color</label>
              <input name="color" type="text" placeholder="e.g. Nude, Maroon" class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black transition-colors" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Dimensions</label>
              <input name="dimensions" type="text" placeholder="e.g. 23 x 10 x 14 cm" class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black transition-colors" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Hardware</label>
              <input name="hardware_color" type="text" placeholder="e.g. Gold-Tone / Palladium" class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black transition-colors" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Production Year</label>
              <input name="production_year" type="text" placeholder="e.g. 2024 / Series 32" class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black transition-colors" />
            </div>
            <div class="md:col-span-2 space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Inclusions (What's in the box?)</label>
              <input name="inclusions" type="text" placeholder="Box, Care Booklet, Copy Receipt, Dust Bag, etc." class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black transition-colors" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Exterior Material</label>
              <input name="exterior_material" type="text" placeholder="e.g. Lizard Leather" class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black transition-colors" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Interior Material</label>
              <input name="interior_material" type="text" placeholder="e.g. Lambskin" class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black transition-colors" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Weight (Grams)</label>
              <input name="weight" type="number" defaultValue="500" class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black transition-colors" />
            </div>
          </section>

          <section class="bg-white p-8 border border-gray-100 shadow-sm">
            <h3 class="font-bold text-[10px] uppercase tracking-[0.3em] mb-6 border-b pb-4">Detailed Description (Rich Text)</h3>
            <textarea id="sun-editor-target" name="description" class="hidden"></textarea>
          </section>
        </div>

        {/* SIDEBAR: HARGA & IDENTITAS */}
        <div class="space-y-8">
          <section class="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 class="font-bold text-[10px] uppercase tracking-[0.3em] border-b pb-4">Identity & Price</h3>
            <div class="space-y-4">
              <input name="name" type="text" required placeholder="Product Name" class="w-full border-b border-gray-200 py-2 font-serif text-xl outline-none" />
              <input name="brand" type="text" required placeholder="Brand" class="w-full border-b border-gray-200 py-2 text-sm outline-none uppercase tracking-widest" />
              <input name="price" type="number" required placeholder="Price (IDR)" class="w-full border-b border-gray-200 py-2 font-bold text-xl outline-none" />
              <input name="compare_at_price" type="number" placeholder="Strike-through Price (IDR)" class="w-full border-b border-gray-200 py-2 text-sm outline-none text-gray-400" />
              
              <div class="pt-4">
                <label class="block text-[9px] font-bold uppercase text-gray-400 mb-1">Kategori</label>
                <select name="category_id" required class="w-full border-b border-gray-200 py-2 text-xs bg-transparent uppercase tracking-tighter cursor-pointer">
                  <option value="">-- Pilih Kategori --</option>
                  {hierarchicalCategories.map(cat => (
                    <option value={cat.id}>{cat.displayName}</option>
                  ))}
                </select>
              </div>
              <div class="pt-2">
                <label class="block text-[9px] font-bold uppercase text-gray-400 mb-1">Kondisi</label>
                <select name="condition" class="w-full border-b border-gray-200 py-2 text-xs bg-transparent uppercase cursor-pointer">
                  <option value="Pristine">Pristine (Like New)</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                </select>
              </div>
              <div class="pt-2">
                <label class="block text-[9px] font-bold uppercase text-gray-400 mb-1">Stok Awal</label>
                <input name="stock" type="number" defaultValue="1" class="w-full border-b border-gray-200 py-2 text-sm outline-none" />
              </div>
            </div>
          </section>

          <button id="pub-btn" type="submit" class="w-full bg-black text-white py-6 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 transition-all shadow-2xl disabled:bg-gray-400 active:scale-95">
            Publish to Store
          </button>
        </div>
      </form>

      {/* SCRIPTS: EDITOR & STREAMING UPLOAD */}
      <script src="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/suneditor.min.js"></script>
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const editor = SUNEDITOR.create('sun-editor-target', {
            buttonList: [['bold', 'italic', 'underline', 'list', 'align', 'link', 'image']],
            width: '100%', height: '350px',
            placeholder: 'Tulis deskripsi detail produk...'
          });

          const picker = document.getElementById('file-picker');
          const previews = document.getElementById('upload-previews');
          const payload = document.getElementById('images_payload');
          let uploadedUrls = [];

          picker.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
              const id = 'up-' + Math.random().toString(36).substr(2, 5);
              const box = document.createElement('div');
              box.id = id;
              box.className = 'aspect-[3/4] bg-gray-50 border border-gray-100 flex items-center justify-center relative overflow-hidden group';
              box.innerHTML = '<div class="absolute inset-0 bg-white/80 flex items-center justify-center z-10"><span class="text-[8px] animate-pulse font-bold tracking-widest">UPLOADING</span></div>';
              previews.appendChild(box);

              const fd = new FormData();
              fd.append('file', file);

              try {
                const res = await fetch('/api/upload', { method: 'POST', body: fd });
                const data = await res.json();
                if(data.success) {
                  uploadedUrls.push(data.url);
                  payload.value = JSON.stringify(uploadedUrls);
                  box.innerHTML = \`<img src="\${data.url}" class="w-full h-full object-cover" />\`;
                } else { box.innerHTML = '<span class="text-red-500 text-[8px]">FAILED</span>'; }
              } catch { box.innerHTML = '<span class="text-red-500 text-[8px]">ERROR</span>'; }
            }
          });

          document.getElementById('product-form').onsubmit = (event) => {
            const btn = document.getElementById('pub-btn');
            btn.disabled = true;
            btn.textContent = 'PUBLISHING...';
            document.getElementById('sun-editor-target').value = editor.getContents();
          };
        });
      `}} />
    </div>
  );
});

export const POST = createRoute(async (c) => {
  const f = await c.req.parseBody();
  const db = c.env.DB;
  const name = f.name as string;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + generateId().substring(0, 5);

  try {
    // FIX: Tidak menggunakan backslash di depan backtick. 
    // Menyertakan 22 parameter sesuai field di visoe.sql + weight
    await db.prepare(`
      INSERT INTO products (
        id, category_id, slug, name, brand, condition, description, 
        price, compare_at_price, stock, is_active, images_json,
        brand_serial, inclusions, dimensions, exterior_material, 
        interior_material, hardware_color, model_name, production_year, color, weight
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      generateId(), 
      f.category_id, 
      slug, 
      name, 
      f.brand, 
      f.condition, 
      f.description,
      Number(f.price), 
      f.compare_at_price ? Number(f.compare_at_price) : null, 
      Number(f.stock), 
      f.images_json, // JSON dari Hidden Input
      '', // brand_serial (kosongkan dulu)
      f.inclusions, 
      f.dimensions, 
      f.exterior_material, 
      f.interior_material, 
      f.hardware_color, 
      '', // model_name (kosongkan dulu)
      f.production_year, 
      f.color,
      Number(f.weight)
    ).run();

    await invalidateProductCache(c);
    return c.redirect('/admin');
  } catch (err: any) {
    return c.render(
      <div class="p-20 text-center font-bold text-red-500">
        DATABASE ERROR: {err.message}
        <br />
        <a href="/admin/new" class="mt-4 inline-block underline font-normal text-black">Coba Lagi</a>
      </div>
    );
  }
});