import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();
  if (!widget) return c.render(<div>Not Found</div>);
  
  let data;
  try { data = JSON.parse(widget.content_json || '{"badges":[]}'); } catch(e) { data = { badges: [] }; }

  return c.render(
    <div class="max-w-[1000px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12 border-b pb-8">
        <a href="/admin/page-builder" class="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-serif italic tracking-widest uppercase">Edit Trust Badges</h1>
      </div>

      <form id="widget-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="title" value={widget.title} />

        <div class="space-y-8">
          <div class="flex justify-between border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-[0.3em]">Badges</h3>
            <button type="button" onclick="window.addBadge()" class="bg-black text-white px-6 py-2 text-[9px] font-bold uppercase">+ Add Badge</button>
          </div>
          
          <div id="items-container" class="space-y-6">
            {data.badges?.map((badge: any) => (
              <div class="badge-item p-6 border border-neutral-100 bg-neutral-50 relative group grid grid-cols-1 md:grid-cols-3 gap-4">
                <button type="button" onclick="this.closest('.badge-item').remove()" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase">Remove</button>
                <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Title</label><input type="text" name="b_title" value={badge.title} class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div>
                <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Description</label><input type="text" name="b_desc" value={badge.description} class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div>
                <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Icon URL (Optional)</label><input type="text" name="b_img" value={badge.image} class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div>
              </div>
            ))}
          </div>
        </div>

        <div class="pt-8 border-t flex justify-end">
           <button type="submit" class="bg-black text-white px-10 py-5 text-[11px] font-bold uppercase tracking-widest">Save Badges</button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addBadge = function() {
          const div = document.createElement('div');
          div.className = 'badge-item p-6 border border-neutral-100 bg-neutral-50 relative group grid grid-cols-1 md:grid-cols-3 gap-4';
          div.innerHTML = '<button type="button" onclick="this.closest(\\\'.badge-item\\\').remove()" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase">Remove</button><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Title</label><input type="text" name="b_title" class="w-full border-b py-2 text-xs bg-transparent outline-none" /></div><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Description</label><input type="text" name="b_desc" class="w-full border-b py-2 text-xs bg-transparent outline-none" /></div><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Icon URL</label><input type="text" name="b_img" class="w-full border-b py-2 text-xs bg-transparent outline-none" /></div>';
          document.getElementById('items-container').appendChild(div);
        };
        document.getElementById('widget-form').onsubmit = async (e) => {
          e.preventDefault();
          const badges = [];
          document.querySelectorAll('.badge-item').forEach(item => {
            badges.push({ title: item.querySelector('[name="b_title"]').value, description: item.querySelector('[name="b_desc"]').value, image: item.querySelector('[name="b_img"]').value });
          });
          await fetch('/api/page-builder/update', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: new FormData(e.target).get('id'), title: new FormData(e.target).get('title'), content_json: JSON.stringify({ badges }) })
          });
          window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Trust Badges | Admin' }
  );
});