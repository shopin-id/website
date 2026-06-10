import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const page = await c.env.DB.prepare("SELECT * FROM pages WHERE id = ?").bind(id).first();

  if (!page) return c.redirect('/admin/pages');

  return c.render(
    <div class="max-w-[1100px] mx-auto py-10 px-6">
      {/* SunEditor CSS */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/css/suneditor.min.css" />
      
      <div class="flex items-center gap-4 mb-12 border-b pb-8">
        <a href="/admin/pages" class="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">← Back to Pages</a>
        <h1 class="text-2xl font-serif italic tracking-widest uppercase">Edit Page Settings</h1>
      </div>

      <form id="page-edit-form" method="POST" class="space-y-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 border border-neutral-100 shadow-sm">
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Page Title</label>
            <input type="text" name="title" value={page.title} required class="w-full border-b border-neutral-300 py-3 text-sm outline-none focus:border-black bg-transparent" />
          </div>
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">URL Slug</label>
            <input type="text" name="slug" value={page.slug} required class="w-full border-b border-neutral-300 py-3 text-sm outline-none focus:border-black bg-transparent" />
          </div>
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Template Type</label>
            <select name="template_type" class="w-full border-b border-neutral-300 py-3 text-xs outline-none focus:border-black transition bg-transparent uppercase tracking-widest">
              <option value="standard" selected={page.template_type === 'standard'}>Standard (WYSIWYG Editor)</option>
              <option value="canvas" selected={page.template_type === 'canvas'}>Canvas (Page Builder)</option>
            </select>
          </div>
          <div class="flex items-end text-[8px] text-neutral-400 uppercase tracking-widest leading-relaxed">
            * Canvas mode will bypass this editor and use the Widget Builder instead.
          </div>
        </div>

        {/* AREA SUNEDITOR */}
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-[10px] font-bold uppercase tracking-[0.3em]">Page Content Editor</h3>
            <span class="text-[8px] bg-black text-white px-2 py-1 uppercase tracking-widest font-bold">Standard Mode</span>
          </div>
          
          <div class="bg-white shadow-sm border border-neutral-100">
            <textarea id="sun-editor-area" name="content" style={{ display: 'none' }}>{page.content}</textarea>
          </div>
          <p class="text-[8px] text-neutral-400 uppercase tracking-widest">Editor ini mendukung Gambar, Tabel, dan Video secara langsung.</p>
        </div>

        <div class="pt-6 border-t flex justify-between items-center">
           <a href={`/${page.slug}`} target="_blank" class="text-[9px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-200 pb-1">Preview Changes ↗</a>
           <button type="submit" class="bg-black text-white px-12 py-5 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition shadow-xl">Update Page</button>
        </div>
      </form>

      {/* SunEditor JS & Initialization */}
      <script src="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/suneditor.min.js"></script>
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', () => {
          const editor = SUNEDITOR.create('sun-editor-area', {
            buttonList: [
              ['undo', 'redo'],
              ['font', 'fontSize', 'formatBlock'],
              ['paragraphStyle', 'blockquote'],
              ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
              ['fontColor', 'hiliteColor', 'textStyle'],
              ['removeFormat'],
              ['outdent', 'indent'],
              ['align', 'horizontalRule', 'list', 'lineHeight'],
              ['table', 'link', 'image', 'video'], 
              ['fullScreen', 'showBlocks', 'codeView'],
              ['preview', 'print']
            ],
            width: '100%',
            height: '500px',
            placeholder: 'Mulai menulis konten mewah Anda di sini...',
            charCounter: true,
            stickyToolbar: '0px'
          });

          // Memastikan konten di-sync kembali ke textarea sebelum form disubmit
          const form = document.getElementById('page-edit-form');
          form.onsubmit = () => {
            document.getElementById('sun-editor-area').value = editor.getContents();
          };
        });
      `}} />
    </div>,
    { title: `Editing ${page.title} | Admin` }
  );
});

export const POST = createRoute(async (c) => {
  const id = c.req.param('id');
  const fd = await c.req.parseBody();
  const db = c.env.DB;

  const slug = (fd.slug as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');

  try {
    await db.prepare("UPDATE pages SET title = ?, slug = ?, template_type = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(fd.title, slug, fd.template_type, fd.content, id).run();
    
    return c.redirect('/admin/pages');
  } catch (err: any) {
    return c.render(<div class="p-10 text-red-500 uppercase tracking-widest">Error: {err.message}</div>);
  }
});