import { Hono } from 'hono';

const app = new Hono();

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env.DB;

    // Mengharapkan body berupa: { id: "widget_id_here" }
    const { id } = body;

    // VALIDASI: ID wajib ada untuk menghapus data
    if (!id) {
      return c.json({ 
        success: false, 
        error: 'Widget ID is required for deletion.' 
      }, 400);
    }

    // EKSEKUSI PENGHAPUSAN:
    // Menghapus baris dari tabel frontpage_widgets berdasarkan ID uniknya.
    const result = await db.prepare("DELETE FROM frontpage_widgets WHERE id = ?")
      .bind(id)
      .run();

    if (result.success) {
      return c.json({ 
        success: true, 
        message: 'Widget deleted successfully.' 
      });
    } else {
      throw new Error('Database failed to delete the record.');
    }

  } catch (err: any) {
    console.error("Delete API Error:", err.message);
    return c.json({ 
      success: false, 
      error: err.message 
    }, 500);
  }
});

export default app;