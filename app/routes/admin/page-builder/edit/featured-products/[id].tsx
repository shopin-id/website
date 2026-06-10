import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  
  // Ambil data widget dari database
  const widget = await c.env.DB.prepare(
    "SELECT * FROM frontpage_widgets WHERE id = ?"
  ).bind(id).first();

  if (!widget) {
    return c.render(
      <div class="max-w-[1200px] mx-auto p-20 text-center">
        <h1 class="text-xl font-bold uppercase tracking-widest text-red-500">Widget Not Found</h1>
        <a href="/admin/page-builder" class="inline-block mt-10 border border-black px-8 py-3 text-[10px] font-bold uppercase tracking-widest">Back to Builder</a>
      </div>
    );
  }

  // Parsing data dengan pengaman (Cegah Error 1101 saat data kosong)
  let data;
  try {
    data = JSON.parse(widget.content_json || '{"product_ids":[]}');
  } catch (e) {
    data = { product_ids: [] };
  }

  return c.render(
    <div class="max-w-[1000px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12">
        <a href="/admin/page-builder" class="text-neutral-400 hover:text-black transition text-[10px] font-bold uppercase tracking-widest">← Back to Builder</a>
        <h1 class="text-2xl font-bold uppercase tracking-widest">Edit Featured Products</h1>
      </div>

      <form id="featured-products-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        
        <div class="space-y-4 max-w-xl">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Section Reference Title</label>
          <input 
            type="text" 
            name="title" 
            value={widget.title} 
            class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent"
          />
        </div>

        <div class="space-y-8">
          <div class="flex justify-between items-center border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-widest">Selected Product IDs</h3>
            <button type="button" onclick="addProductId()" class="bg-black text-white px-6 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition">
              + Add Product ID
            </button>
          </div>
          
          <div id="product-ids-container" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.product_ids?.map((pid: string) => (
              <div class="product-id-item flex items-center bg-neutral-50 border border-neutral-100 p-3 group">
                <input 
                  type="text" 
                  name="pid" 
                  value={pid} 
                  class="flex-1 bg-transparent text-xs font-bold outline-none uppercase" 
                  placeholder="ID (e.g. w3gvxuiw6n)"
                />
                <button type="button" onclick="this.closest('.product-id-item').remove()" class="text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold">REMOVE</button>
              </div>
            ))}
          </div>
          <p class="text-[9px] text-neutral-400 italic uppercase">Input the Product IDs exactly as they appear in the Product Management table.</p>
        </div>

        <div class="pt-10 border-t border-neutral-100 flex justify-end">
          <button type="submit" class="w-full md:w-[300px] bg-black text-white py-5 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 transition-all shadow-xl active:scale-95">
            Save Changes
          </button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addProductId = function() {
          const container = document.getElementById('product-ids-container');
          const div = document.createElement('div');
          div.className = 'product-id-item flex items-center bg-neutral-50 border border-neutral-100 p-3 group';
          div.innerHTML = \`
            <input type="text" name="pid" class="flex-1 bg-transparent text-xs font-bold outline-none uppercase" placeholder="ID (e.g. w3gvxuiw6n)" />
            <button type="button" onclick="this.closest('.product-id-item').remove()" class="text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold">REMOVE</button>
          \`;
          container.appendChild(div);
        };

        document.getElementById('featured-products-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          
          const product_ids = [];
          document.querySelectorAll('[name="pid"]').forEach(input => {
            if(input.value.trim()) product_ids.push(input.value.trim());
          });

          const payload = {
            id: fd.get('id'),
            title: fd.get('title'),
            content_json: JSON.stringify({
              product_ids: product_ids
            })
          };

          const res = await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if(res.ok) {
            window.location.href = '/admin/page-builder';
          } else {
            alert('Update failed. Check your API endpoint.');
          }
        };
      `}} />
    </div>,
    { title: 'Edit Featured Products | Admin' }
  );
});