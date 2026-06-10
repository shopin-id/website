import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();
  if (!widget) return c.render(<div>Widget Not Found</div>);

  const data = JSON.parse(widget.content_json || '{"items":[]}');

  return c.render(
    <div class="max-w-[1000px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12">
        <a href="/admin/page-builder" class="text-neutral-400 hover:text-black transition text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-bold uppercase tracking-widest">Edit Icon Navigation</h1>
      </div>

      <form id="icon-nav-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        <div class="space-y-4 max-w-xl">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Section Reference Name</label>
          <input type="text" name="title" value={widget.title} class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent" />
        </div>

        <div class="space-y-8">
          <div class="flex justify-between items-center border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-widest">Icon Items (Circles)</h3>
            <button type="button" onclick="addIcon()" class="bg-black text-white px-6 py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition">+ Add Icon</button>
          </div>
          <div id="icons-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items?.map((item: any, idx: number) => (
              <div class="icon-item p-6 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-4">
                <button type="button" onclick="this.closest('.icon-item').remove()" class="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold uppercase">Remove</button>
                <div class="space-y-2">
                  <label class="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Title</label>
                  <input type="text" name="icon_title" value={item.title} class="w-full border-b border-neutral-200 py-1 text-[10px] tracking-widest outline-none focus:border-black transition bg-transparent" />
                </div>
                <div class="space-y-2">
                  <label class="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Link</label>
                  <input type="text" name="icon_link" value={item.link} class="w-full border-b border-neutral-200 py-1 text-[10px] tracking-widest outline-none focus:border-black transition bg-transparent" />
                </div>
                <div class="space-y-2">
                  <label class="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Image URL</label>
                  <input type="text" name="icon_image" value={item.image} class="w-full border-b border-neutral-200 py-1 text-[10px] tracking-widest outline-none focus:border-black transition bg-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" class="w-full md:w-fit px-20 bg-black text-white py-5 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 transition-all shadow-xl">Save Changes</button>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addIcon = function() {
          const container = document.getElementById('icons-container');
          const div = document.createElement('div');
          div.className = 'icon-item p-6 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-4';
          div.innerHTML = \`
            <button type="button" onclick="this.closest('.icon-item').remove()" class="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold uppercase">Remove</button>
            <div class="space-y-2"><label class="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Title</label><input type="text" name="icon_title" class="w-full border-b border-neutral-200 py-1 text-[10px] tracking-widest outline-none focus:border-black transition bg-transparent" /></div>
            <div class="space-y-2"><label class="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Link</label><input type="text" name="icon_link" class="w-full border-b border-neutral-200 py-1 text-[10px] tracking-widest outline-none focus:border-black transition bg-transparent" /></div>
            <div class="space-y-2"><label class="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Image URL</label><input type="text" name="icon_image" class="w-full border-b border-neutral-200 py-1 text-[10px] tracking-widest outline-none focus:border-black transition bg-transparent" /></div>\`;
          container.appendChild(div);
        };

        document.getElementById('icon-nav-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const items = [];
          document.querySelectorAll('.icon-item').forEach(item => {
            items.push({
              title: item.querySelector('[name="icon_title"]').value,
              link: item.querySelector('[name="icon_link"]').value,
              image: item.querySelector('[name="icon_image"]').value
            });
          });
          const res = await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: fd.get('id'), title: fd.get('title'), content_json: JSON.stringify({ items }) })
          });
          if(res.ok) window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Icon Nav | Admin' }
  );
});