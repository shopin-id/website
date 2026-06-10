import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();

  if (!widget) return c.render(<div class="p-20 text-center uppercase text-xs font-bold">Widget Not Found</div>);

  let data;
  try {
    data = JSON.parse(widget.content_json || '{"brands":[]}');
  } catch (e) {
    data = { brands: [] };
  }

  return c.render(
    <div class="max-w-[1000px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12">
        <a href="/admin/page-builder" class="text-neutral-400 hover:text-black transition text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-bold uppercase tracking-widest italic">Edit Brand Grid</h1>
      </div>

      <form id="brand-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        <div class="space-y-4 max-w-xl">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Section Title</label>
          <input type="text" name="title" value={widget.title} class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent" />
        </div>

        <div class="space-y-8">
          <div class="flex justify-between items-center border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Brand Logos</h3>
            <button type="button" onclick="window.addBrand()" class="bg-black text-white px-6 py-2 text-[9px] font-bold uppercase tracking-widest">+ Add Brand</button>
          </div>
          <div id="brands-container" class="grid grid-cols-2 md:grid-cols-4 gap-6">
            {data.brands?.map((brand: any) => (
              <div class="brand-item p-4 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-3">
                <button type="button" onclick="this.closest('.brand-item').remove()" class="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold">REMOVE</button>
                <input type="text" name="brand_name" value={brand.name} placeholder="Brand Name" class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none bg-transparent" />
                <input type="text" name="brand_link" value={brand.link} placeholder="Link URL" class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none bg-transparent" />
                <input type="text" name="brand_image" value={brand.image} placeholder="Logo URL" class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none bg-transparent" />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" class="w-full md:w-fit px-20 bg-black text-white py-5 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 transition-all shadow-xl">Update Brand Grid</button>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addBrand = function() {
          const container = document.getElementById('brands-container');
          const div = document.createElement('div');
          div.className = 'brand-item p-4 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-3';
          div.innerHTML = \`
            <button type="button" onclick="this.closest('.brand-item').remove()" class="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold">REMOVE</button>
            <input type="text" name="brand_name" placeholder="Brand Name" class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none bg-transparent" />
            <input type="text" name="brand_link" placeholder="Link URL" class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none bg-transparent" />
            <input type="text" name="brand_image" placeholder="Logo URL" class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none bg-transparent" />\`;
          container.appendChild(div);
        };

        document.getElementById('brand-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const brands = [];
          document.querySelectorAll('.brand-item').forEach(item => {
            brands.push({
              name: item.querySelector('[name="brand_name"]').value,
              link: item.querySelector('[name="brand_link"]').value,
              image: item.querySelector('[name="brand_image"]').value
            });
          });
          const res = await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: fd.get('id'), title: fd.get('title'), content_json: JSON.stringify({ brands }) })
          });
          if(res.ok) window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Brand Grid | Admin' }
  );
});