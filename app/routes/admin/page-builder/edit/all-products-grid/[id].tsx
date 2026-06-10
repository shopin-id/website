import { createRoute } from 'honox/factory';

export const POST = createRoute(async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const formData = await c.req.formData();

  const title = formData.get('title') as string;
  const is_active = formData.get('is_active') === '1' ? 1 : 0;
  
  // Tangkap data spesifik widget ini
  const description = formData.get('description') as string;
  const per_page = parseInt(formData.get('per_page') as string, 10) || 15;

  const content = {
    description,
    per_page
  };

  await db.prepare(
    "UPDATE frontpage_widgets SET title = ?, is_active = ?, content_json = ? WHERE id = ?"
  ).bind(title, is_active, JSON.stringify(content), id).run();

  // Redirect kembali ke konteks halamannya
  const widget = await db.prepare("SELECT page_id FROM frontpage_widgets WHERE id = ?").bind(id).first();
  return c.redirect(`/admin/page-builder?page_id=${widget?.page_id || 'home'}`);
});

export default createRoute(async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const widget = await db.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();
  if (!widget) return c.redirect('/admin/page-builder');

  let content: any = {};
  try {
    content = JSON.parse((widget.content_json as string) || '{}');
  } catch (e) {}

  return c.render(
    <div class="max-w-[800px] mx-auto py-10 px-6">
      <div class="flex justify-between items-center mb-8 border-b border-neutral-100 pb-8">
        <div>
          <h1 class="text-2xl font-bold uppercase tracking-[0.2em]">Edit All Products Grid</h1>
          <p class="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest">
            ID: {widget.id}
          </p>
        </div>
        <a href={`/admin/page-builder?page_id=${widget.page_id}`} class="text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-6 py-3 hover:bg-black hover:text-white transition">
          Back to Builder
        </a>
      </div>

      <form method="POST" class="space-y-8 bg-white p-8 border border-neutral-100 shadow-sm">
        
        {/* PENGATURAN UMUM WIDGET */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-neutral-100">
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Section Title</label>
            <input type="text" name="title" value={widget.title as string} class="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors" required />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Visibility Status</label>
            <select name="is_active" class="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors appearance-none bg-white">
              <option value="1" selected={widget.is_active === 1}>Active (Visible)</option>
              <option value="0" selected={widget.is_active === 0}>Hidden (Draft)</option>
            </select>
          </div>
        </div>

        {/* PENGATURAN KONTEN SPESIFIK */}
        <div class="space-y-6">
          <h3 class="text-[10px] font-bold uppercase tracking-widest text-black bg-neutral-50 inline-block px-3 py-1">Grid Settings</h3>
          
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Subtitle / Description</label>
            <textarea 
              name="description" 
              rows={2} 
              class="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors" 
              placeholder="Contoh: Temukan berbagai produk unggulan dari vendor terbaik kami."
            >{content.description || ''}</textarea>
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Jumlah Produk Per Halaman (Paginasi)</label>
            <input 
              type="number" 
              name="per_page" 
              value={content.per_page || 15} 
              min="5" max="100" 
              class="w-full md:w-1/3 border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors font-bold" 
              required 
            />
            <p class="text-[10px] text-neutral-400 mt-2">Menentukan berapa kotak produk yang muncul sebelum dipotong oleh angka halaman.</p>
          </div>

        </div>

        <div class="pt-8 border-t border-neutral-100 flex justify-end">
          <button type="submit" class="bg-black text-white px-10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition shadow-xl">
            Save Widget Settings
          </button>
        </div>
      </form>
    </div>
  );
});
