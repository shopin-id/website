import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  let pages: any[] = [];
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM pages ORDER BY created_at DESC").all();
    pages = results || [];
  } catch (e) {
    console.log("Pages table not ready.");
  }

  return c.render(
    <div class="max-w-[1200px] mx-auto py-10 px-6">
      <div class="mb-12 border-b border-neutral-100 pb-8 flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-serif italic tracking-widest uppercase">Pages Management</h1>
          <p class="text-[10px] text-neutral-400 uppercase tracking-[0.3em] mt-2">Manage Standard Content or Canvas Landing Pages</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* FORM TAMBAH HALAMAN */}
        <div class="md:col-span-1 space-y-8">
          <h3 class="text-[11px] font-bold uppercase tracking-[0.3em] border-b border-neutral-200 pb-3">Create New Page</h3>
          <form method="POST" action="/admin/pages" class="space-y-6 bg-neutral-50 border border-neutral-100 p-6 shadow-sm">
            <input type="hidden" name="action" value="create" />
            <div class="space-y-2">
              <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Page Title</label>
              <input type="text" name="title" required placeholder="e.g. About Us" class="w-full border-b border-neutral-300 py-3 text-xs outline-none focus:border-black transition bg-transparent" />
            </div>
            <div class="space-y-2">
              <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">URL Slug</label>
              <input type="text" name="slug" required placeholder="e.g. about-us" class="w-full border-b border-neutral-300 py-3 text-xs outline-none focus:border-black transition bg-transparent" />
            </div>
            <div class="space-y-2">
              <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Template Type</label>
              <select name="template_type" class="w-full border-b border-neutral-300 py-3 text-xs outline-none focus:border-black transition bg-transparent uppercase tracking-widest">
                <option value="standard">Standard (Content Editor)</option>
                <option value="canvas">Canvas (Page Builder)</option>
              </select>
            </div>
            <button type="submit" class="w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-neutral-800 transition shadow-md">Create Page</button>
          </form>
        </div>

        {/* TABEL DAFTAR HALAMAN */}
        <div class="md:col-span-2 space-y-8">
          <h3 class="text-[11px] font-bold uppercase tracking-[0.3em] border-b border-neutral-200 pb-3">Existing Pages</h3>
          <div class="bg-white border border-neutral-100 shadow-sm overflow-hidden">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-neutral-50 border-b border-neutral-200 text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400">
                  <th class="py-5 px-6">Title & Slug</th>
                  <th class="py-5 px-6">Type</th>
                  <th class="py-5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr class="border-b border-neutral-100 hover:bg-neutral-50 transition">
                    <td class="py-5 px-6">
                      <div class="text-[10px] font-bold tracking-widest uppercase text-black">{p.title}</div>
                      <div class="text-[9px] font-mono text-neutral-400 mt-1">/{p.slug}</div>
                    </td>
                    <td class="py-5 px-6">
                      <span class={`text-[8px] font-bold px-2 py-1 uppercase tracking-widest rounded ${p.template_type === 'canvas' ? 'bg-blue-50 text-blue-600' : 'bg-neutral-100 text-neutral-500'}`}>
                        {p.template_type}
                      </span>
                    </td>
                    <td class="py-5 px-6 flex justify-end gap-3 items-center">
                      <a href={`/${p.slug}`} target="_blank" class="text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition">View</a>
                      
                      {/* TOMBOL EDIT (UTAMA) */}
                      <a href={`/admin/pages/edit/${p.id}`} class="text-[9px] font-bold uppercase tracking-widest border border-black px-4 py-1.5 hover:bg-black hover:text-white transition">Edit</a>
                      
                      {p.template_type === 'canvas' && (
                        <a href={`/admin/page-builder?page_id=${p.id}`} class="text-[9px] font-bold uppercase tracking-widest bg-black text-white px-4 py-1.5 shadow-lg">Build</a>
                      )}
                      
                      <form method="POST" action="/admin/pages" class="inline" onsubmit="return confirm('Delete permanently?')">
                        <input type="hidden" name="action" value="delete" />
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" class="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 ml-2">Del</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>,
    { title: 'Pages Management | Admin' }
  );
});

export const POST = createRoute(async (c) => {
  const fd = await c.req.parseBody();
  const db = c.env.DB;
  if (fd.action === 'create') {
    const id = Math.random().toString(36).substring(2, 15);
    const slug = (fd.slug as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await db.prepare("INSERT INTO pages (id, title, slug, template_type, content) VALUES (?, ?, ?, ?, '')").bind(id, fd.title, slug, fd.template_type).run();
  } else if (fd.action === 'delete') {
    await db.prepare("DELETE FROM pages WHERE id = ?").bind(fd.id).run();
    await db.prepare("DELETE FROM frontpage_widgets WHERE page_id = ?").bind(fd.id).run();
  }
  return c.redirect('/admin/pages');
});