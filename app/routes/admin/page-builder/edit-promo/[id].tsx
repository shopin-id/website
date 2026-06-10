import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();

  if (!widget) return c.render(<div class="py-20 text-center uppercase text-xs font-bold">Widget Not Found</div>);

  const data = JSON.parse(widget.content_json || '{"promos":[]}');

  return c.render(
    <div class="max-w-[1200px] mx-auto px-6 py-10">
      <div class="flex items-center gap-4 mb-12 border-b pb-8">
        <a href="/admin/page-builder" class="text-neutral-400 hover:text-black transition text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-serif italic tracking-widest uppercase">Edit Promo Section</h1>
      </div>

      <form id="promo-form" class="space-y-16">
        <input type="hidden" name="id" value={id} />
        
        <div class="space-y-4 max-w-xl">
          <label class="block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Section Title (Internal)</label>
          <input type="text" name="title" value={widget.title} class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent" />
        </div>

        <div class="space-y-8">
          <div class="flex justify-between items-end border-b border-neutral-100 pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-[0.3em]">Promo Banner Grid</h3>
            <button type="button" onclick="window.addPromo()" class="text-[9px] font-bold uppercase tracking-[0.3em] bg-black text-white px-8 py-3">Add New Promo</button>
          </div>

          <div id="promos-container" class="grid grid-cols-1 md:grid-cols-2 gap-10">
            {data.promos?.map((promo: any) => (
              <div class="promo-item p-8 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-6">
                <button type="button" onclick="window.removePromo(this)" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold uppercase tracking-widest">Remove</button>
                <div class="space-y-4">
                  <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Main Title</label>
                  <input type="text" name="promo_title" value={promo.title} class="w-full border-b border-neutral-200 py-2 text-xs outline-none focus:border-black transition bg-transparent font-bold" />
                </div>
                <div class="space-y-4">
                  <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Subtitle / Description</label>
                  <input type="text" name="promo_subtitle" value={promo.subtitle} class="w-full border-b border-neutral-200 py-2 text-xs outline-none focus:border-black transition bg-transparent" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-4">
                    <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Button Text</label>
                    <input type="text" name="promo_btn_text" value={promo.button_text} placeholder="Shop Now" class="w-full border-b border-neutral-200 py-2 text-xs outline-none focus:border-black transition bg-transparent" />
                  </div>
                  <div class="space-y-4">
                    <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Target Link</label>
                    <input type="text" name="promo_link" value={promo.link} class="w-full border-b border-neutral-200 py-2 text-xs outline-none focus:border-black transition bg-transparent" />
                  </div>
                </div>
                <div class="space-y-4">
                  <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Image URL</label>
                  <input type="text" name="promo_image" value={promo.image} class="w-full border-b border-neutral-200 py-2 text-xs outline-none focus:border-black transition bg-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="pt-12 border-t border-neutral-100 flex justify-end">
          <button type="submit" class="w-full md:w-[300px] bg-black text-white py-5 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 shadow-xl">Save Configuration</button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addPromo = function() {
          const container = document.getElementById('promos-container');
          const div = document.createElement('div');
          div.className = 'promo-item p-8 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-6';
          div.innerHTML = \`
            <button type="button" onclick="window.removePromo(this)" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold uppercase tracking-widest">Remove</button>
            <div class="space-y-4"><label class="block text-[9px] font-bold uppercase text-neutral-400">Main Title</label><input type="text" name="promo_title" class="w-full border-b border-neutral-200 py-2 text-xs outline-none bg-transparent font-bold" /></div>
            <div class="space-y-4"><label class="block text-[9px] font-bold uppercase text-neutral-400">Subtitle / Description</label><input type="text" name="promo_subtitle" class="w-full border-b border-neutral-200 py-2 text-xs outline-none bg-transparent" /></div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-4"><label class="block text-[9px] font-bold uppercase text-neutral-400">Button Text</label><input type="text" name="promo_btn_text" placeholder="Shop Now" class="w-full border-b border-neutral-200 py-2 text-xs outline-none bg-transparent" /></div>
              <div class="space-y-4"><label class="block text-[9px] font-bold uppercase text-neutral-400">Target Link</label><input type="text" name="promo_link" class="w-full border-b border-neutral-200 py-2 text-xs outline-none bg-transparent" /></div>
            </div>
            <div class="space-y-4"><label class="block text-[9px] font-bold uppercase text-neutral-400">Image URL</label><input type="text" name="promo_image" class="w-full border-b border-neutral-200 py-2 text-xs outline-none bg-transparent" /></div>\`;
          container.appendChild(div);
        };

        window.removePromo = function(btn) { btn.closest('.promo-item').remove(); };

        document.getElementById('promo-form').onsubmit = async (e) => {
          e.preventDefault();
          const promos = [];
          document.querySelectorAll('.promo-item').forEach(item => {
            promos.push({
              title: item.querySelector('[name="promo_title"]').value,
              subtitle: item.querySelector('[name="promo_subtitle"]').value,
              button_text: item.querySelector('[name="promo_btn_text"]').value,
              link: item.querySelector('[name="promo_link"]').value,
              image: item.querySelector('[name="promo_image"]').value
            });
          });

          await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: new FormData(e.target).get('id'), title: new FormData(e.target).get('title'), content_json: JSON.stringify({ promos }) })
          });
          window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Promo Banner | Admin' }
  );
});