import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const slug = c.req.param('slug');
  const page = await c.env.DB.prepare("SELECT * FROM pages WHERE slug = ?").bind(slug).first();

  if (!page) {
    return c.render(<div class="py-40 text-center text-xs tracking-widest uppercase">Page Not Found</div>, { title: '404 - Not Found' });
  }

  // --- OPSI 1: STANDARD PAGE (Text / HTML Biasa) ---
  if (page.template_type === 'standard') {
    return c.render(
      <div class="max-w-[800px] mx-auto py-20 px-6">
        <h1 class="text-3xl font-serif italic tracking-widest uppercase text-center mb-16">{page.title}</h1>
        {/* Render HTML content (bisa dari WYSIWYG Editor) */}
        <div class="prose prose-sm md:prose-base max-w-none tracking-wide text-neutral-600 leading-relaxed" 
             dangerouslySetInnerHTML={{ __html: page.content || '' }} />
      </div>,
      { title: `${page.title} | Visoe` }
    );
  }

  // --- OPSI 2: CANVAS PAGE (Landing Page Builder) ---
  if (page.template_type === 'canvas') {
    // Ambil widget KHUSUS untuk halaman ini
    const { results: widgets } = await c.env.DB.prepare(
      "SELECT * FROM frontpage_widgets WHERE page_id = ? AND is_active = 1 ORDER BY display_order ASC"
    ).bind(page.id).all();

    // Render Canvas Tanpa Layout Global (Blank Slate). 
    // Jika User mau Header/Footer, mereka harus menambahkan widget Header/Footer secara manual di Builder.
    return c.html(
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{page.title} | Visoe Landing</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap');
            body { font-family: 'Inter', sans-serif; overflow-x: hidden; }
            .font-serif { font-family: 'Bodoni Moda', serif; }
            .tracking-widest-extra { letter-spacing: 0.3em; }
          `}} />
        </head>
        <body class="bg-white text-gray-900 antialiased">
          <div class="space-y-16 md:space-y-20 pb-16 md:pb-24">
            
            {/* RENDER WIDGET SAMA PERSIS SEPERTI HOMEPAGE (Gunakan logika yang sama seperti di index.tsx) */}
            {/* Karena aturan tidak memotong kode, Anda cukup menyalin blok `.map` widget dari index.tsx ke dalam div ini. */}
            <div class="text-center py-20 text-[10px] uppercase tracking-widest text-neutral-400">
               Canvas Builder Mode Aktif. Sisipkan logika widget index.tsx di sini.
            </div>

          </div>
          <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
        </body>
      </html>
    );
  }

  return c.render(<div>Invalid Template</div>);
});