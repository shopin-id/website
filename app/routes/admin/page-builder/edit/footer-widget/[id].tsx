import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();
  if (!widget) return c.render(<div>Not Found</div>);
  
  let data;
  try { data = JSON.parse(widget.content_json || '{"layout":"4","columns":[]}'); } catch(e) { data = { layout: '4', columns: [] }; }

  return c.render(
    <div class="max-w-[1000px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12 border-b pb-8">
        <a href="/admin/page-builder" class="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-serif italic tracking-widest uppercase">Edit Footer Layout</h1>
      </div>

      <form id="widget-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="title" value={widget.title} />

        <div class="space-y-4 max-w-sm">
          <label class="block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Layout Grid</label>
          <select name="layout" class="w-full border border-neutral-200 py-3 px-4 text-xs bg-transparent outline-none">
            <option value="3" selected={data.layout === '3'}>3 Columns</option>
            <option value="4" selected={data.layout === '4'}>4 Columns</option>
          </select>
        </div>

        <div class="space-y-8">
          <div class="flex justify-between border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-[0.3em]">Footer Columns</h3>
            <button type="button" onclick="window.addCol()" class="bg-black text-white px-6 py-2 text-[9px] font-bold uppercase">+ Add Column</button>
          </div>
          
          <div id="items-container" class="space-y-6">
            {data.columns?.map((col: any) => {
              // Format link kembali ke string dengan pemisah newline untuk diedit
              const linksText = (col.links || []).map((lnk: any) => `${lnk.name} | ${lnk.url}`).join('\n');
              return (
                <div class="col-item p-6 border border-neutral-100 bg-neutral-50 relative group grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button type="button" onclick="this.closest('.col-item').remove()" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase">Remove</button>
                  <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Column Title</label><input type="text" name="c_title" value={col.title} placeholder="e.g. SHOP" class="w-full border-b border-neutral-300 py-2 text-xs bg-transparent outline-none focus:border-black" /></div>
                  <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Logo URL (Optional)</label><input type="text" name="c_img" value={col.image} placeholder="CDN URL" class="w-full border-b border-neutral-300 py-2 text-xs bg-transparent outline-none focus:border-black" /></div>
                  <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Paragraph Content</label><textarea name="c_text" rows={4} placeholder="Address, hours, or description..." class="w-full border border-neutral-200 p-3 text-xs bg-white outline-none focus:border-black">{col.text}</textarea></div>
                  <div class="space-y-2">
                    <label class="text-[9px] font-bold uppercase text-neutral-400">Navigation Links</label>
                    <textarea name="c_links" rows={4} placeholder="New Arrivals | /collections/new&#10;Handbags | /collections/handbags" class="w-full border border-neutral-200 p-3 text-xs bg-white outline-none focus:border-black">{linksText}</textarea>
                    <p class="text-[8px] text-neutral-400 mt-1 uppercase">Format: Name | Target URL (Satu link per baris)</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div class="pt-8 border-t flex justify-end">
           <button type="submit" class="bg-black text-white px-10 py-5 text-[11px] font-bold uppercase tracking-widest">Save Footer</button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addCol = function() {
          const div = document.createElement('div');
          div.className = 'col-item p-6 border border-neutral-100 bg-neutral-50 relative group grid grid-cols-1 md:grid-cols-2 gap-6';
          div.innerHTML = '<button type="button" onclick="this.closest(\\\'.col-item\\\').remove()" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase">Remove</button><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Column Title</label><input type="text" name="c_title" placeholder="e.g. SHOP" class="w-full border-b border-neutral-300 py-2 text-xs bg-transparent outline-none focus:border-black" /></div><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Logo URL (Optional)</label><input type="text" name="c_img" placeholder="CDN URL" class="w-full border-b border-neutral-300 py-2 text-xs bg-transparent outline-none focus:border-black" /></div><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Paragraph Content</label><textarea name="c_text" rows="4" placeholder="Address, hours, or description..." class="w-full border border-neutral-200 p-3 text-xs bg-white outline-none focus:border-black"></textarea></div><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Navigation Links</label><textarea name="c_links" rows="4" placeholder="New Arrivals | /collections/new\\nHandbags | /collections/handbags" class="w-full border border-neutral-200 p-3 text-xs bg-white outline-none focus:border-black"></textarea><p class="text-[8px] text-neutral-400 mt-1 uppercase">Format: Name | Target URL (Satu link per baris)</p></div>';
          document.getElementById('items-container').appendChild(div);
        };

        document.getElementById('widget-form').onsubmit = async (e) => {
          e.preventDefault();
          const cols = [];
          document.querySelectorAll('.col-item').forEach(item => {
            
            // Proses parsing text area menjadi array object untuk Links
            const linksRaw = item.querySelector('[name="c_links"]').value;
            const links = linksRaw.split('\\n').filter(l => l.includes('|')).map(l => {
              const parts = l.split('|');
              return { name: parts[0].trim(), url: parts[1].trim() };
            });

            cols.push({ 
              title: item.querySelector('[name="c_title"]').value, 
              image: item.querySelector('[name="c_img"]').value, 
              text: item.querySelector('[name="c_text"]').value,
              links: links // Simpan sebagai array
            });
          });

          await fetch('/api/page-builder/update', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: new FormData(e.target).get('id'), 
              title: new FormData(e.target).get('title'), 
              content_json: JSON.stringify({ layout: new FormData(e.target).get('layout'), columns: cols }) 
            })
          });
          window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Footer | Admin' }
  );
});