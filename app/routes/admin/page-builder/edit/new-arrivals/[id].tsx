import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();

  if (!widget) return c.render(<div class="p-20 text-center uppercase text-xs font-bold">Widget Not Found</div>);

  let data;
  try {
    data = JSON.parse(widget.content_json || '{}');
  } catch (e) { data = {}; }

  return c.render(
    <div class="max-w-[1000px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12 border-b pb-8">
        <a href="/admin/page-builder" class="text-neutral-400 hover:text-black transition text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-serif italic tracking-widest uppercase">Edit New Arrivals</h1>
      </div>

      <form id="edit-arrivals-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-neutral-100 pb-12">
          {/* KOLOM KIRI: TEKS */}
          <div class="space-y-8">
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Subtitle (Label Kecil)</label>
              <input type="text" name="subtitle" value={data.subtitle || ''} placeholder="e.g. COLLECTIONS" class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Main Title (Italic Serif)</label>
              <input type="text" name="title" value={widget.title} class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent font-serif italic text-lg" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Description</label>
              <textarea name="description" rows={4} class="w-full border border-neutral-100 p-4 text-xs tracking-widest outline-none focus:border-black transition bg-neutral-50 leading-relaxed">{data.description || ''}</textarea>
            </div>
          </div>

          {/* KOLOM KANAN: TOMBOL */}
          <div class="space-y-8">
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Button Text</label>
              <input type="text" name="button_text" value={data.button_text || ''} placeholder="EXPLORE NOW" class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent" />
            </div>
            <div class="space-y-2">
              <label class="block text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Button Link</label>
              <input type="text" name="button_link" value={data.button_link || ''} placeholder="/products" class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent" />
            </div>
          </div>
        </div>

        {/* PRODUK SELECTION */}
        <div class="space-y-8">
          <div class="flex justify-between items-center border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-[0.4em]">Product List (IDs)</h3>
            <button type="button" onclick="addProductId()" class="bg-black text-white px-8 py-2 text-[9px] font-bold uppercase tracking-widest">+ Add ID</button>
          </div>
          <div id="product-ids-container" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(data.product_ids || []).map((pid: string) => (
              <div class="product-id-item flex items-center bg-neutral-50 border border-neutral-100 p-3 group">
                <input type="text" name="pid" value={pid} class="flex-1 bg-transparent text-xs font-bold outline-none uppercase" />
                <button type="button" onclick="this.closest('.product-id-item').remove()" class="text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold">REMOVE</button>
              </div>
            ))}
          </div>
        </div>

        <div class="pt-10 border-t flex justify-end">
          <button type="submit" class="w-full md:w-[300px] bg-black text-white py-6 text-[11px] font-bold tracking-[0.5em] uppercase hover:bg-neutral-800 transition-all shadow-xl">
            Update Widget
          </button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addProductId = function() {
          const div = document.createElement('div');
          div.className = 'product-id-item flex items-center bg-neutral-50 border border-neutral-100 p-3 group';
          div.innerHTML = '<input type="text" name="pid" class="flex-1 bg-transparent text-xs font-bold outline-none uppercase" placeholder="ID" /><button type="button" onclick="this.closest(\\\'.product-id-item\\\').remove()" class="text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold">REMOVE</button>';
          document.getElementById('product-ids-container').appendChild(div);
        };

        document.getElementById('edit-arrivals-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const pids = [];
          document.querySelectorAll('[name="pid"]').forEach(i => { if(i.value.trim()) pids.push(i.value.trim()); });

          await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: fd.get('id'),
              title: fd.get('title'),
              content_json: JSON.stringify({
                subtitle: fd.get('subtitle'),
                description: fd.get('description'),
                button_text: fd.get('button_text'),
                button_link: fd.get('button_link'),
                product_ids: pids
              })
            })
          });
          window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit New Arrivals | Admin' }
  );
});