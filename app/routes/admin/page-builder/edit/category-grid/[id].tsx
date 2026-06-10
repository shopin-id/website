import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();

  if (!widget) return c.render(<div class="p-20 text-center uppercase text-xs font-bold">Widget Not Found</div>);

  let data;
  try {
    data = JSON.parse(widget.content_json || '{"categories":[]}');
  } catch (e) {
    data = { categories: [] };
  }

  return c.render(
    <div class="max-w-[1000px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12">
        <a href="/admin/page-builder" class="text-neutral-400 hover:text-black transition text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-bold uppercase tracking-widest italic">Edit Category Nav</h1>
      </div>

      <form id="cat-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        <div class="space-y-4 max-w-xl">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Section Title</label>
          <input type="text" name="title" value={widget.title} class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent" />
        </div>

        <div class="space-y-8">
          <div class="flex justify-between items-center border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Circular Category Items</h3>
            <button type="button" onclick="window.addCat()" class="bg-black text-white px-6 py-2 text-[9px] font-bold uppercase tracking-widest">+ Add Category</button>
          </div>
          <div id="cats-container" class="grid grid-cols-3 md:grid-cols-6 gap-6">
            {data.categories?.map((cat: any) => (
              <div class="cat-item p-4 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-3 text-center">
                <button type="button" onclick="this.closest('.cat-item').remove()" class="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100 transition text-[8px] font-bold">DEL</button>
                <div class="aspect-square rounded-full border border-neutral-200 overflow-hidden bg-white mb-2">
                  <img src={cat.image || ''} class="w-full h-full object-contain" />
                </div>
                <input type="text" name="cat_name" value={cat.name} placeholder="Name" class="w-full border-b border-neutral-200 py-1 text-[9px] outline-none bg-transparent text-center font-bold" />
                <input type="text" name="cat_link" value={cat.link} placeholder="Link" class="w-full border-b border-neutral-200 py-1 text-[8px] outline-none bg-transparent" />
                <input type="text" name="cat_image" value={cat.image} placeholder="Image URL" class="w-full border-b border-neutral-200 py-1 text-[8px] outline-none bg-transparent" />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" class="w-full md:w-fit px-20 bg-black text-white py-5 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 transition-all shadow-xl">Update Navigation</button>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addCat = function() {
          const container = document.getElementById('cats-container');
          const div = document.createElement('div');
          div.className = 'cat-item p-4 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-3 text-center';
          div.innerHTML = \`
            <button type="button" onclick="this.closest('.cat-item').remove()" class="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100 transition text-[8px] font-bold">DEL</button>
            <div class="aspect-square rounded-full border border-neutral-200 overflow-hidden bg-white mb-2"></div>
            <input type="text" name="cat_name" placeholder="Name" class="w-full border-b border-neutral-200 py-1 text-[9px] outline-none bg-transparent text-center font-bold" />
            <input type="text" name="cat_link" placeholder="Link" class="w-full border-b border-neutral-200 py-1 text-[8px] outline-none bg-transparent" />
            <input type="text" name="cat_image" placeholder="Image URL" class="w-full border-b border-neutral-200 py-1 text-[8px] outline-none bg-transparent" />\`;
          container.appendChild(div);
        };

        document.getElementById('cat-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const categories = [];
          document.querySelectorAll('.cat-item').forEach(item => {
            categories.push({
              name: item.querySelector('[name="cat_name"]').value,
              link: item.querySelector('[name="cat_link"]').value,
              image: item.querySelector('[name="cat_image"]').value
            });
          });
          const res = await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: fd.get('id'), title: fd.get('title'), content_json: JSON.stringify({ categories }) })
          });
          if(res.ok) window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Categories | Admin' }
  );
});