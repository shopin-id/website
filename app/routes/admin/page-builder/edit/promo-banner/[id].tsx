import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();

  if (!widget) return c.render(<div class="p-20 text-center uppercase text-xs font-bold">Widget Not Found</div>);

  let data;
  try {
    data = JSON.parse(widget.content_json || '{"promos":[]}');
  } catch (e) { data = { promos: [] }; }

  return c.render(
    <div class="max-w-[1200px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12 border-b pb-8">
        <a href="/admin/page-builder" class="text-neutral-400 hover:text-black transition text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-serif italic tracking-widest uppercase">Edit Promo Banner (2-Column)</h1>
      </div>

      <form id="promo-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        
        <div class="space-y-4 max-w-xl">
          <label class="block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Section Reference Name (Internal Admin)</label>
          <input type="text" name="title" value={widget.title} class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent" />
        </div>

        <div class="space-y-8">
          <div class="flex justify-between items-end border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-[0.3em]">Promo Banners (Text Left, Image Right)</h3>
            <button type="button" onclick="window.addPromo()" class="bg-black text-white px-8 py-3 text-[9px] font-bold uppercase tracking-widest">+ Add Promo</button>
          </div>
          
          <div id="promos-container" class="space-y-8">
            {data.promos?.map((promo: any) => (
              <div class="promo-item p-8 border border-neutral-100 bg-neutral-50 relative group grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
                <button type="button" onclick="this.closest('.promo-item').remove()" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold uppercase">Remove</button>
                
                {/* Kolom Kiri: Teks Display */}
                <div class="space-y-6">
                  <div class="space-y-2">
                    <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Display Title (Serif Uppercase)</label>
                    <input type="text" name="promo_title" value={promo.title} placeholder="NEW ARRIVALS: THE ART OF ELEGANCE" class="w-full border-b border-neutral-300 py-2 text-sm outline-none focus:border-black bg-transparent font-serif" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Description Paragraph</label>
                    <textarea name="promo_subtitle" rows={3} placeholder="Explore our curated selection..." class="w-full border border-neutral-300 p-3 text-xs outline-none focus:border-black bg-transparent uppercase tracking-widest leading-relaxed">{promo.subtitle}</textarea>
                  </div>
                </div>

                {/* Kolom Kanan: Link, Button, & Gambar */}
                <div class="space-y-6">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Button Text</label>
                      <input type="text" name="promo_btn" value={promo.button_text} placeholder="SHOP NOW" class="w-full border-b border-neutral-300 py-2 text-xs outline-none focus:border-black bg-transparent" />
                    </div>
                    <div class="space-y-2">
                      <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Target Link URL</label>
                      <input type="text" name="promo_link" value={promo.link} placeholder="/products" class="w-full border-b border-neutral-300 py-2 text-xs outline-none focus:border-black bg-transparent" />
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Image URL (Right Column)</label>
                    <input type="text" name="promo_image" value={promo.image} placeholder="https://..." class="w-full border-b border-neutral-300 py-2 text-xs outline-none focus:border-black bg-transparent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="pt-10 border-t flex justify-end">
           <button type="submit" class="w-full md:w-[300px] bg-black text-white py-6 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 shadow-xl transition-all">
             Save Promos
           </button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addPromo = function() {
          const div = document.createElement('div');
          div.className = 'promo-item p-8 border border-neutral-100 bg-neutral-50 relative group grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm';
          div.innerHTML = \`
            <button type="button" onclick="this.closest('.promo-item').remove()" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold uppercase">Remove</button>
            <div class="space-y-6">
              <div class="space-y-2"><label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Display Title</label><input type="text" name="promo_title" class="w-full border-b border-neutral-300 py-2 text-sm outline-none bg-transparent font-serif" /></div>
              <div class="space-y-2"><label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Description Paragraph</label><textarea name="promo_subtitle" rows="3" class="w-full border border-neutral-300 p-3 text-xs outline-none bg-transparent uppercase tracking-widest"></textarea></div>
            </div>
            <div class="space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2"><label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Button Text</label><input type="text" name="promo_btn" class="w-full border-b border-neutral-300 py-2 text-xs outline-none bg-transparent" /></div>
                <div class="space-y-2"><label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Target Link URL</label><input type="text" name="promo_link" class="w-full border-b border-neutral-300 py-2 text-xs outline-none bg-transparent" /></div>
              </div>
              <div class="space-y-2"><label class="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Image URL</label><input type="text" name="promo_image" class="w-full border-b border-neutral-300 py-2 text-xs outline-none bg-transparent" /></div>
            </div>
          \`;
          document.getElementById('promos-container').appendChild(div);
        };

        document.getElementById('promo-form').onsubmit = async (e) => {
          e.preventDefault();
          const promos = [];
          document.querySelectorAll('.promo-item').forEach(item => {
            promos.push({
              title: item.querySelector('[name="promo_title"]').value,
              subtitle: item.querySelector('[name="promo_subtitle"]').value,
              button_text: item.querySelector('[name="promo_btn"]').value,
              link: item.querySelector('[name="promo_link"]').value,
              image: item.querySelector('[name="promo_image"]').value
            });
          });
          
          await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: new FormData(e.target).get('id'), 
              title: new FormData(e.target).get('title'), 
              content_json: JSON.stringify({ promos }) 
            })
          });
          window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Promo Banner | Admin' }
  );
});