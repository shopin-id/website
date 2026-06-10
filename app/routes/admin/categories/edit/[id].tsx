import { createRoute } from 'honox/factory';
import { getAllCategories, createSlug } from '../../../../utils/catalog';

export default createRoute(async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  // Ambil data untuk diisikan ke form
  const categories = await getAllCategories(db);
  const categoryToEdit = categories.find(cat => cat.id === id);

  if (!categoryToEdit) {
    return c.notFound();
  }

  // Filter agar kategori tidak bisa menjadikan dirinya sendiri (atau anaknya) sebagai parent
  const availableParents = categories.filter(cat => cat.id !== id);

  return c.render(
    <div class="max-w-3xl mx-auto py-12 px-6">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-serif tracking-widest uppercase">Edit Category</h1>
        <a href="/admin/categories" class="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-1">Cancel & Back</a>
      </div>
      
      <div class="bg-gray-50 p-8 border border-gray-100 shadow-sm">
        <form method="POST" class="space-y-6">
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-widest text-gray-400">Category Name</label>
            <input name="name" type="text" value={categoryToEdit.name} required 
              class="w-full border-b border-gray-300 bg-transparent py-2 outline-none focus:border-black text-sm transition-colors" />
          </div>

          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-widest text-gray-400">URL Slug</label>
            <input name="slug" type="text" value={categoryToEdit.slug} required 
              class="w-full border-b border-gray-300 bg-transparent py-2 outline-none focus:border-black text-sm font-mono text-gray-600 transition-colors" />
            <p class="text-[10px] text-gray-400 italic">This will be used in the URL (e.g. /category/your-slug). No spaces allowed.</p>
          </div>
          
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-widest text-gray-400">Parent Category</label>
            <select name="parent_id" class="w-full border-b border-gray-300 bg-transparent py-2 outline-none text-xs uppercase tracking-tighter">
              <option value="" selected={!categoryToEdit.parent_id}>— No Parent (Top Level) —</option>
              {availableParents.map(cat => (
                <option value={cat.id} selected={cat.id === categoryToEdit.parent_id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div class="pt-6">
            <button type="submit" class="bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-3.5 hover:bg-neutral-800 transition shadow-lg w-full md:w-auto">
              Update Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export const POST = createRoute(async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const formData = await c.req.parseBody();

  const name = formData.name as string;
  let slug = formData.slug as string;
  const parentId = (formData.parent_id as string) === "" ? null : (formData.parent_id as string);

  // Pastikan slug formatnya benar meskipun diketik manual
  slug = slug ? createSlug(slug) : createSlug(name);

  try {
    await db.prepare(`
      UPDATE categories 
      SET name = ?, slug = ?, parent_id = ? 
      WHERE id = ?
    `)
    .bind(name, slug, parentId, id)
    .run();

    return c.redirect('/admin/categories');
  } catch (err: any) {
    return c.render(
      <div class="p-10 text-center">
        <h1 class="text-red-600 font-bold text-xl">Database Error</h1>
        <p class="text-gray-500 mt-2">{err.message}</p>
        <p class="text-xs text-gray-400 mt-1">If the error is about unique constraint, the slug might already be used by another category.</p>
        <a href={`/admin/categories/edit/${id}`} class="mt-4 inline-block text-black underline">Back to Edit Form</a>
      </div>
    );
  }
});
