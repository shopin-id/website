import { createRoute } from 'honox/factory';
import { invalidateProductCache } from '../../../utils/admin_utils';

export const POST = createRoute(async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    // Jalankan penghapusan di D1
    await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    
    // Hapus cache agar katalog frontend segera terupdate
    await invalidateProductCache(c);
    
    return c.redirect('/admin');
  } catch (err) {
    return c.text('Gagal menghapus produk: ' + err, 500);
  }
});