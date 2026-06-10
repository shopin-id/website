import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();
  if (!widget) return c.render(<div>Not Found</div>);
  
  let data;
  try { data = JSON.parse(widget.content_json || '{}'); } catch(e) { data = {}; }

  const isTitle = widget.widget_type === 'custom_title';

  return c.render(
    <div class="max-w-[800px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12 border-b pb-8">
        <a href="/admin/page-builder" class="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-serif italic tracking-widest uppercase">Edit {isTitle ? 'Title' : 'Paragraph'}</h1>
      </div>

      <form id="widget-form" class="space-y-8 bg-neutral-50 p-8 border border-neutral-100 shadow-sm">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="title" value={widget.title} />

        <div class="space-y-2">
          <label class="block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Content Text</label>
          {isTitle ? (
             <input type="text" name="text" value={data.text || ''} class="w-full border-b border-neutral-300 py-3 text-xl font-serif outline-none focus:border-black bg-transparent" />
          ) : (
             <textarea name="text" rows={5} class="w-full border border-neutral-200 p-4 text-sm outline-none focus:border-black bg-white">{data.text || ''}</textarea>
          )}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Font Size</label>
            <select name="font_size" class="w-full border-b border-neutral-300 py-2 text-xs bg-transparent outline-none">
              <option value="text-sm" selected={data.font_size === 'text-sm'}>Small</option>
              <option value="text-base" selected={data.font_size === 'text-base'}>Normal</option>
              <option value="text-xl" selected={data.font_size === 'text-xl'}>Large</option>
              <option value="text-3xl" selected={data.font_size === 'text-3xl'}>Heading (3XL)</option>
              <option value="text-5xl" selected={data.font_size === 'text-5xl'}>Giant (5XL)</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Alignment</label>
            <select name="align" class="w-full border-b border-neutral-300 py-2 text-xs bg-transparent outline-none">
              <option value="left" selected={data.align === 'left'}>Left</option>
              <option value="center" selected={data.align === 'center'}>Center</option>
              <option value="right" selected={data.align === 'right'}>Right</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Text Color (HEX)</label>
            <input type="color" name="text_color" value={data.text_color || '#000000'} class="w-full h-10 border-none cursor-pointer bg-transparent" />
          </div>
        </div>

        <div class="pt-8 flex justify-end">
           <button type="submit" class="bg-black text-white px-10 py-4 text-[11px] font-bold uppercase tracking-widest">Save Typography</button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('widget-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          await fetch('/api/page-builder/update', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: fd.get('id'), title: fd.get('title'), 
              content_json: JSON.stringify({ text: fd.get('text'), font_size: fd.get('font_size'), align: fd.get('align'), text_color: fd.get('text_color') }) 
            })
          });
          window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Typography | Admin' }
  );
});