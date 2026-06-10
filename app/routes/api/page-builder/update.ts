import { Hono } from 'hono';

const app = new Hono();

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env.DB;

    const { id, title, content_json, is_active } = body;

    // VALIDASI: ID harus ada
    if (!id) {
      return c.json({ 
        success: false, 
        error: 'Widget ID is required.' 
      }, 400);
    }

    // Pastikan data content_json dikirim dalam format string
    const finalContentJson = typeof content_json === 'object' 
      ? JSON.stringify(content_json) 
      : content_json;

    // EKSEKUSI UPDATE: 
    // Saya hapus updated_at karena kemungkinan besar kolom tersebut tidak ada di tabel Anda.
    const result = await db.prepare(`
      UPDATE frontpage_widgets 
      SET 
        title = COALESCE(?, title),
        content_json = COALESCE(?, content_json),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).bind(
      title || null, 
      finalContentJson || null, 
      is_active !== undefined ? (is_active ? 1 : 0) : null, 
      id
    ).run();

    if (result.success) {
      return c.json({ 
        success: true, 
        message: 'Widget saved successfully' 
      });
    } else {
      throw new Error('Database execution failed.');
    }

  } catch (err: any) {
    // Log error di server agar Anda bisa melihat penyebab aslinya di Cloudflare Dashboard
    console.error("Update API Error:", err.message);
    return c.json({ 
      success: false, 
      error: err.message 
    }, 500);
  }
});

export default app;