import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();
  
  if (!widget) return c.redirect('/admin/page-builder');
  
  let data;
  try { 
    data = JSON.parse(widget.content_json || '{}'); 
  } catch(e) { 
    data = {}; 
  }

  return c.render(
    <div class="max-w-[800px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12 border-b pb-8">
        <a href="/admin/page-builder" class="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">← Back to Builder</a>
        <h1 class="text-2xl font-serif italic tracking-widest uppercase">Edit Countdown Timer</h1>
      </div>

      <form id="widget-form" class="space-y-8 bg-neutral-50 p-8 border border-neutral-100 shadow-sm">
        <input type="hidden" name="id" value={id} />

        {/* KOLOM JUDUL YANG SEBELUMNYA MATI / HILANG */}
        <div class="space-y-2">
          <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-black">Widget Admin Title</label>
          <input 
            type="text" 
            name="title" 
            value={widget.title} 
            placeholder="Contoh: Flash Sale Ramadhan" 
            class="w-full border-b border-neutral-300 py-3 text-sm outline-none focus:border-black bg-transparent font-bold" 
          />
          <p class="text-[8px] text-neutral-400 uppercase tracking-widest">Judul ini yang akan muncul di daftar urutan Page Builder.</p>
        </div>

        <hr class="border-neutral-200" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Target End Time</label>
            <input type="datetime-local" name="end_time" value={data.end_time || ''} required class="w-full border-b border-neutral-300 py-3 text-sm outline-none focus:border-black bg-transparent" />
          </div>

          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Expired Message</label>
            <input type="text" name="expired_text" value={data.expired_text || 'OFFER EXPIRED'} class="w-full border-b border-neutral-300 py-3 text-xs outline-none focus:border-black bg-transparent tracking-widest uppercase font-bold text-red-500" />
          </div>
        </div>

        <div class="pt-8 flex justify-end">
           <button type="submit" class="bg-black text-white px-10 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition shadow-lg">Save Countdown</button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('widget-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          
          const payload = {
            id: fd.get('id'),
            title: fd.get('title'), // Mengirim judul baru ke database
            content_json: JSON.stringify({ 
              end_time: fd.get('end_time'), 
              expired_text: fd.get('expired_text') 
            })
          };

          const res = await fetch('/api/page-builder/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if(res.ok) {
            window.location.href = '/admin/page-builder' + window.location.search;
          } else {
            alert("Gagal mengupdate widget.");
          }
        };
      `}} />
    </div>,
    { title: 'Edit Countdown | Admin' }
  );
});