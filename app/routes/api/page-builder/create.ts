import { Hono } from 'hono';

const app = new Hono();

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env.DB;

    const widget_type = body.widget_type;
    const page_id = body.page_id || 'home';
    const title = body.title || widget_type.replace('_', ' ').toUpperCase();
    const content_json = body.content_json || "{}";

    // Cari urutan terakhir di context halaman ini
    const lastWidget = await db.prepare(
      "SELECT MAX(display_order) as max_order FROM frontpage_widgets WHERE page_id = ?"
    ).bind(page_id).first();
    
    const nextOrder = (Number(lastWidget?.max_order) || 0) + 1;

    // INSERT baris baru. Jika widget_type adalah 'global_header', 
    // maka content_json di baris ini bisa dikosongkan karena nanti renderernya 
    // akan mengambil data dari page_id = 'GLOBAL'.
    await db.prepare(`
      INSERT INTO frontpage_widgets (widget_type, title, content_json, display_order, is_active, page_id) 
      VALUES (?, ?, ?, ?, 1, ?)
    `).bind(widget_type, title, content_json, nextOrder, page_id).run();

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;