import { createRoute } from 'honox/factory';

export const POST = createRoute(async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  try {
    // Mencoba menghapus kategori
    await db.prepare(`DELETE FROM categories WHERE id = ?`).bind(id).run();
    
    // Jika berhasil, kembali ke daftar kategori
    return c.redirect('/admin/categories');
  } catch (err: any) {
    // Menangkap error Foreign Key D1/SQLite
    return c.render(
      <div class="max-w-2xl mx-auto py-16 px-6 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 class="text-2xl font-serif tracking-widest uppercase mb-4">Cannot Delete Category</h1>
        <p class="text-gray-600 mb-8 leading-relaxed">
          Kategori ini tidak dapat dihapus karena masih ada produk yang menggunakan kategori ini. 
          Anda harus memindahkan produk ke kategori lain terlebih dahulu, atau menghapus produk yang terkait.
        </p>
        
        <div class="bg-gray-50 border border-gray-200 text-left p-4 rounded mb-8 text-xs font-mono text-gray-500 overflow-x-auto">
          Raw Error: {err.message}
        </div>

        <a href="/admin/categories" class="bg-black text-white px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition">
          Return to Categories
        </a>
      </div>
    );
  }
});
