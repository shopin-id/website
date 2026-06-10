import { Hono } from 'hono';

const app = new Hono();

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env.DB;

    // Mengharapkan body berupa: { items: [{ id: 1, order: 0 }, { id: 2, order: 1 }] }
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return c.json({ 
        success: false, 
        error: 'Invalid data format. "items" array is required.' 
      }, 400);
    }

    // MENYIAPKAN BATCH UPDATE:
    // Kita membuat daftar perintah SQL sekaligus agar database tidak bekerja berat 
    // melakukan koneksi berulang-ulang untuk setiap baris.
    const statements = items.map((item: any) => 
      db.prepare("UPDATE frontpage_widgets SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(item.order, item.id)
    );

    // EKSEKUSI BATCH:
    // Menjalankan semua perintah UPDATE dalam satu transaksi atomik.
    await db.batch(statements);

    return c.json({ 
      success: true, 
      message: 'Widget order updated successfully' 
    });

  } catch (err: any) {
    console.error("Reorder API Error:", err.message);
    return c.json({ 
      success: false, 
      error: err.message 
    }, 500);
  }
});

export default app;