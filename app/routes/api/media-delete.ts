import { createRoute } from 'honox/factory';

export const POST = createRoute(async (c) => {
  try {
    const { id } = await c.req.json();
    const db = c.env.DB;

    if (!id) {
      return c.json({ success: false, message: 'ID is required' }, 400);
    }

    // Menghapus record dari database agar hilang dari tampilan Admin
    await db.prepare("DELETE FROM media_assets WHERE id = ?").bind(id).run();

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, message: 'Delete failed' }, 500);
  }
});