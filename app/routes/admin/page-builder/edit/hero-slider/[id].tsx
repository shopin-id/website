import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();

  if (!widget) return c.render(<div class="p-20 text-center uppercase text-xs font-bold">Widget Not Found</div>);

  let data;
  try {
    data = JSON.parse(widget.content_json || '{"slides":[]}');
  } catch (e) {
    data = { slides: [] };
  }

  return c.render(
    <div class="max-w-[1000px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12">
        <a href="/admin/page-builder" class="text-neutral-400 hover:text-black transition text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-bold uppercase tracking-widest italic">Edit Hero Slider</h1>
      </div>

      <form id="hero-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        <div class="space-y-4 max-w-xl">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Section Reference Name</label>
          <input type="text" name="title" value={widget.title} class="w-full border-b border-neutral-200 py-3 text-xs tracking-widest outline-none focus:border-black transition bg-transparent" />
        </div>

        <div class="space-y-8">
          <div class="flex justify-between items-center border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Slider Banners (Full Width)</h3>
            <button type="button" onclick="window.addSlide()" class="bg-black text-white px-6 py-2 text-[9px] font-bold uppercase tracking-widest">+ Add Slide</button>
          </div>
          <div id="slides-container" class="space-y-6">
            {data.slides?.map((slide: any) => (
              <div class="slide-item p-6 border border-neutral-100 bg-neutral-50 relative group grid grid-cols-1 md:grid-cols-2 gap-4">
                <button type="button" onclick="this.closest('.slide-item').remove()" class="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold">REMOVE</button>
                <div class="space-y-2">
                  <label class="text-[9px] font-bold uppercase text-neutral-400">Slide Description (Internal)</label>
                  <input type="text" name="slide_title" value={slide.title} class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none focus:border-black transition bg-transparent" />
                </div>
                <div class="space-y-2">
                  <label class="text-[9px] font-bold uppercase text-neutral-400">Link URL</label>
                  <input type="text" name="slide_link" value={slide.link} class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none focus:border-black transition bg-transparent" />
                </div>
                <div class="md:col-span-2 space-y-2">
                  <label class="text-[9px] font-bold uppercase text-neutral-400">Image URL</label>
                  <input type="text" name="slide_image" value={slide.image} class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none focus:border-black transition bg-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" class="w-full md:w-fit px-20 bg-black text-white py-5 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 transition-all shadow-xl">Save Slider</button>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addSlide = function() {
          const container = document.getElementById('slides-container');
          const div = document.createElement('div');
          div.className = 'slide-item p-6 border border-neutral-100 bg-neutral-50 relative group grid grid-cols-1 md:grid-cols-2 gap-4';
          div.innerHTML = \`
            <button type="button" onclick="this.closest('.slide-item').remove()" class="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition text-[9px] font-bold">REMOVE</button>
            <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Slide Description</label><input type="text" name="slide_title" class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none" /></div>
            <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Link URL</label><input type="text" name="slide_link" class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none" /></div>
            <div class="md:col-span-2 space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Image URL</label><input type="text" name="slide_image" class="w-full border-b border-neutral-200 py-1 text-[10px] outline-none" /></div>\`;
          container.appendChild(div);
        };

        document.getElementById('hero-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const slides = [];
          document.querySelectorAll('.slide-item').forEach(item => {
            slides.push({
              title: item.querySelector('[name="slide_title"]').value,
              link: item.querySelector('[name="slide_link"]').value,
              image: item.querySelector('[name="slide_image"]').value
            });
          });
          const res = await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: fd.get('id'), title: fd.get('title'), content_json: JSON.stringify({ slides }) })
          });
          if(res.ok) window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Hero Slider | Admin' }
  );
});