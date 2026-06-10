import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare(
    "SELECT * FROM frontpage_widgets WHERE id = ?"
  ).bind(id).first();

  if (!widget) return c.render(<div>Widget Not Found</div>);

  const data = JSON.parse(widget.content_json || '{"slides":[]}');

  return c.render(
    <div class="max-w-[1200px] mx-auto px-6 py-10">
      <div class="flex items-center gap-4 mb-10">
        <a href="/admin/page-builder" class="text-neutral-400 hover:text-black transition text-xs font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-bold uppercase tracking-widest">Edit {widget.widget_type}</h1>
      </div>

      <form id="edit-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        
        <div class="space-y-4">
          <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">Section Title</label>
          <input 
            type="text" 
            name="title" 
            value={widget.title} 
            class="w-full border border-neutral-100 p-4 text-xs tracking-widest outline-none focus:border-black transition"
          />
        </div>

        <div class="space-y-6">
          <div class="flex justify-between items-center border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-widest">Slides Configuration</h3>
            <button type="button" onclick="addSlide()" class="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-6 py-2">
              + Add Slide
            </button>
          </div>

          <div id="slides-container" class="space-y-8">
            {data.slides?.map((slide: any, index: number) => (
              <div class="slide-item p-8 border border-neutral-100 bg-neutral-50 relative group">
                <button type="button" onclick="removeSlide(this)" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition text-[10px] font-bold uppercase">Remove</button>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Slide Title (Serif)</label>
                    <input type="text" name="slide_title" value={slide.title} class="w-full border border-white p-3 text-xs tracking-widest outline-none focus:border-black transition" />
                  </div>
                  <div class="space-y-4">
                    <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Button Link</label>
                    <input type="text" name="slide_link" value={slide.link} class="w-full border border-white p-3 text-xs tracking-widest outline-none focus:border-black transition" />
                  </div>
                  <div class="md:col-span-2 space-y-4">
                    <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Image URL</label>
                    <div class="flex gap-4">
                      <input type="text" name="slide_image" value={slide.image} class="flex-1 border border-white p-3 text-xs tracking-widest outline-none focus:border-black transition" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="pt-10 border-t">
          <button type="submit" class="w-full md:w-fit px-20 bg-black text-white py-5 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 transition-all shadow-xl">
            Save Changes
          </button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        function addSlide() {
          const container = document.getElementById('slides-container');
          const div = document.createElement('div');
          div.className = 'slide-item p-8 border border-neutral-100 bg-neutral-50 relative group';
          div.innerHTML = \`
            <button type="button" onclick="removeSlide(this)" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition text-[10px] font-bold uppercase">Remove</button>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Slide Title (Serif)</label>
                <input type="text" name="slide_title" class="w-full border border-white p-3 text-xs tracking-widest outline-none focus:border-black transition" />
              </div>
              <div class="space-y-4">
                <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Button Link</label>
                <input type="text" name="slide_link" class="w-full border border-white p-3 text-xs tracking-widest outline-none focus:border-black transition" />
              </div>
              <div class="md:col-span-2 space-y-4">
                <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Image URL</label>
                <input type="text" name="slide_image" class="w-full border border-white p-3 text-xs tracking-widest outline-none focus:border-black transition" />
              </div>
            </div>
          \`;
          container.appendChild(div);
        }

        function removeSlide(btn) {
          btn.closest('.slide-item').remove();
        }

        document.getElementById('edit-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const slides = [];
          const items = document.querySelectorAll('.slide-item');
          
          items.forEach(item => {
            slides.push({
              title: item.querySelector('[name="slide_title"]').value,
              link: item.querySelector('[name="slide_link"]').value,
              image: item.querySelector('[name="slide_image"]').value
            });
          });

          const payload = {
            id: fd.get('id'),
            title: fd.get('title'),
            content_json: JSON.stringify({ slides })
          };

          const res = await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if(res.ok) {
            alert('Widget updated successfully');
            window.location.href = '/admin/page-builder';
          }
        };
      `}} />
    </div>,
    { title: 'Edit Hero Slider | Admin' }
  );
});