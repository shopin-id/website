import { createRoute } from 'honox/factory';
import { getAllCategories, buildCategoryOptions } from '../../../utils/catalog';
import { invalidateProductCache } from '../../../utils/admin_utils';

export default createRoute(async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first() as any;
  const dbCategories = await getAllCategories(db);
  const hierarchicalCategories = buildCategoryOptions(dbCategories);

  if (!product) return c.render(<div class="p-20 text-center uppercase tracking-widest text-xs">Product Not Found</div>);

  return c.render(
    <div class="max-w-6xl mx-auto py-12 px-6">
      <link href="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/css/suneditor.min.css" rel="stylesheet" />
      
      <div class="mb-10 flex justify-between items-end border-b border-gray-100 pb-6">
        <div>
          <h1 class="text-3xl font-serif tracking-widest uppercase italic">Edit Listing</h1>
          <p class="text-[10px] text-gray-400 mt-1 uppercase tracking-[0.3em]">ID: {product.id}</p>
        </div>
        <a href="/admin/products" class="text-[10px] font-bold border border-black px-4 py-2 uppercase tracking-widest hover:bg-black hover:text-white transition">Cancel</a>
      </div>

      <form id="edit-product-form" method="POST" class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div class="lg:col-span-2 space-y-10">
          
          <section class="bg-white p-8 border border-gray-100 shadow-sm">
            <h3 class="font-bold text-[10px] uppercase tracking-[0.3em] mb-6 border-b pb-4">Gallery Management</h3>
            <div id="edit-drop-zone" class="group border-2 border-dashed border-gray-200 p-10 text-center hover:border-black transition-all cursor-pointer bg-gray-50/50 rounded-lg relative mb-8">
              <input type="file" id="edit-file-picker" multiple accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div class="space-y-2 pointer-events-none">
                <span class="text-xl">+</span>
                <p class="text-[11px] font-bold uppercase tracking-widest">Add More Images</p>
              </div>
            </div>
            <div id="edit-previews" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4"></div>
            <input type="hidden" name="images_json" id="edit-images-payload" value={product.images_json} />
          </section>

          <section class="bg-white p-8 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <h3 class="md:col-span-2 font-bold text-[10px] uppercase tracking-[0.3em] mb-2 border-b pb-4">Detailed Specs</h3>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Color</label>
              <input name="color" type="text" value={product.color || ''} class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Dimensions</label>
              <input name="dimensions" type="text" value={product.dimensions || ''} class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Hardware</label>
              <input name="hardware_color" type="text" value={product.hardware_color || ''} class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Production Year</label>
              <input name="production_year" type="text" value={product.production_year || ''} class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black" />
            </div>
            <div class="md:col-span-2 space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Includes</label>
              <input name="inclusions" type="text" value={product.inclusions || ''} class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Exterior Material</label>
              <input name="exterior_material" type="text" value={product.exterior_material || ''} class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Interior Material</label>
              <input name="interior_material" type="text" value={product.interior_material || ''} class="w-full border-b border-gray-200 py-2 outline-none text-sm focus:border-black" />
            </div>
          </section>

          <section class="bg-white p-8 border border-gray-100 shadow-sm">
            <h3 class="font-bold text-[10px] uppercase tracking-[0.3em] mb-6 border-b pb-4">Description</h3>
            <textarea id="sun-editor-edit" name="description" class="hidden">{product.description}</textarea>
          </section>
        </div>

        <div class="space-y-8">
          <section class="bg-white p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 class="font-bold text-[10px] uppercase tracking-[0.3em] border-b pb-4">Status & Price</h3>
            <div class="space-y-4">
              <input name="name" type="text" value={product.name} required class="w-full border-b border-gray-200 py-2 font-serif text-xl outline-none" />
              <input name="brand" type="text" value={product.brand} required class="w-full border-b border-gray-200 py-2 text-sm outline-none uppercase tracking-widest" />
              <input name="price" type="number" value={product.price} required class="w-full border-b border-gray-200 py-2 font-bold text-xl outline-none" />
              <div class="pt-4">
                <label class="block text-[9px] font-bold uppercase text-gray-400 mb-1">Category</label>
                <select name="category_id" required class="w-full border-b border-gray-200 py-2 text-xs bg-transparent uppercase">
                  {hierarchicalCategories.map(cat => (
                    <option value={cat.id} selected={cat.id === product.category_id}>{cat.displayName}</option>
                  ))}
                </select>
              </div>
              <div class="pt-2">
                <label class="block text-[9px] font-bold uppercase text-gray-400 mb-1">Condition</label>
                <select name="condition" class="w-full border-b border-gray-200 py-2 text-xs bg-transparent uppercase">
                  <option value="Pristine" selected={product.condition === 'Pristine'}>Pristine</option>
                  <option value="Excellent" selected={product.condition === 'Excellent'}>Excellent</option>
                  <option value="Very Good" selected={product.condition === 'Very Good'}>Very Good</option>
                </select>
              </div>
              <div class="pt-2">
                <label class="block text-[9px] font-bold uppercase text-gray-400 mb-1">Visibility</label>
                <select name="is_active" class="w-full border-b border-gray-200 py-2 text-xs bg-transparent uppercase">
                  <option value="1" selected={product.is_active === 1}>Active</option>
                  <option value="0" selected={product.is_active === 0}>Hidden / Draft</option>
                </select>
              </div>
              <div class="pt-2">
                <label class="block text-[9px] font-bold uppercase text-gray-400 mb-1">Inventory (Stock)</label>
                <input name="stock" type="number" defaultValue={product.stock ?? 1} class="w-full border-b border-gray-200 py-2 text-sm" />
              </div>
            </div>
          </section>
          <button id="save-btn" type="submit" class="w-full bg-black text-white py-6 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 transition-all shadow-xl disabled:bg-gray-400">
            Save Changes
          </button>
        </div>
      </form>

      <script src="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/suneditor.min.js"></script>
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const editor = SUNEDITOR.create('sun-editor-edit', {
            buttonList: [['bold', 'italic', 'underline', 'list', 'align', 'link', 'image']],
            width: '100%', height: '350px'
          });

          const picker = document.getElementById('edit-file-picker');
          const previews = document.getElementById('edit-previews');
          const payload = document.getElementById('edit-images-payload');
          let uploadedUrls = JSON.parse(payload.value || '[]');

          function renderGallery() {
            previews.innerHTML = '';
            uploadedUrls.forEach((url, index) => {
              const box = document.createElement('div');
              box.className = 'aspect-[3/4] bg-gray-50 border border-gray-100 relative overflow-hidden group';
              box.innerHTML = \`
                <img src="\${url}" class="w-full h-full object-cover" />
                <button type="button" onclick="removeImage(\${index})" class="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" stroke-width="2" /></svg>
                </button>\`;
              previews.appendChild(box);
            });
            payload.value = JSON.stringify(uploadedUrls);
          }

          window.removeImage = (index) => { uploadedUrls.splice(index, 1); renderGallery(); };

          picker.addEventListener('change', async (e) => {
            for (const file of e.target.files) {
              const fd = new FormData(); fd.append('file', file);
              const res = await fetch('/api/upload', { method: 'POST', body: fd });
              const data = await res.json();
              if(data.success) { uploadedUrls.push(data.url); renderGallery(); }
            }
          });

          document.getElementById('edit-product-form').onsubmit = () => {
            document.getElementById('save-btn').disabled = true;
            document.getElementById('sun-editor-edit').value = editor.getContents();
          };
          renderGallery();
        });
      `}} />
    </div>
  );
});

export const POST = createRoute(async (c) => {
  const f = await c.req.parseBody();
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    // FIX: Update SQL disesuaikan persis dengan visoe.sql (menghapus 'weight' yang tidak ada)
    await db.prepare(`
      UPDATE products SET 
        name = ?, brand = ?, category_id = ?, price = ?, 
        stock = ?, description = ?, is_active = ?, images_json = ?,
        color = ?, dimensions = ?, hardware_color = ?, production_year = ?, 
        inclusions = ?, exterior_material = ?, interior_material = ?, condition = ?
      WHERE id = ?
    `).bind(
      f.name, f.brand, f.category_id, Number(f.price || 0),
      Number(f.stock || 0), f.description, Number(f.is_active || 1), 
      f.images_json, f.color, f.dimensions, f.hardware_color, 
      f.production_year, f.inclusions, f.exterior_material, f.interior_material,
      f.condition, id
    ).run();

    await invalidateProductCache(c);
    return c.redirect('/admin/products'); // Redirect ke daftar produk yang benar
  } catch (err: any) {
    return c.render(<div class="p-20 text-center text-red-500 font-bold uppercase">Update Error: {err.message}</div>);
  }
});