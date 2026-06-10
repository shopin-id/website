import { createRoute } from 'honox/factory';
import { getAllCategories, createSlug } from '../../utils/catalog';
import { generateId } from '../../utils/admin_utils';

export default createRoute(async (c) => {
  const db = c.env.DB;
  const categories = await getAllCategories(db);

  return c.render(
    <div class="max-w-4xl mx-auto py-12 px-6">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-serif tracking-widest uppercase">Category Management</h1>
        <a href="/admin" class="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-1">Back to Dashboard</a>
      </div>
      
      {/* FORM TAMBAH KATEGORI */}
      <div class="bg-gray-50 p-8 mb-12 border border-gray-100 shadow-sm">
        <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 border-b pb-4">Create New Category</h3>
        <form method="POST" class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-widest text-gray-400">Category Name</label>
            <input name="name" type="text" placeholder="e.g. Handbags" required 
              class="w-full border-b border-gray-300 bg-transparent py-2 outline-none focus:border-black text-sm transition-colors" />
          </div>
          
          <div class="space-y-2">
            <label class="block text-[9px] font-bold uppercase tracking-widest text-gray-400">Parent Category</label>
            <select name="parent_id" class="w-full border-b border-gray-300 bg-transparent py-2 outline-none text-xs uppercase tracking-tighter">
              <option value="">— No Parent (Top Level) —</option>
              {categories.map(cat => (
                <option value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" class="bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 hover:bg-neutral-800 transition shadow-lg">
            Save Category
          </button>
        </form>
      </div>

      {/* TABEL LIST KATEGORI */}
      <div class="bg-white border border-gray-100 shadow-sm">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100 text-[9px] uppercase tracking-[0.2em] text-gray-400">
              <th class="py-4 px-6 font-bold">Category Name</th>
              <th class="py-4 px-6 font-bold">Slug</th>
              <th class="py-4 px-6 font-bold">Parent</th>
              <th class="py-4 px-6 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} class="py-10 text-center text-gray-400 text-xs italic">No categories created yet.</td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr class="hover:bg-gray-50/50 transition">
                  <td class="py-4 px-6 font-medium text-gray-900">{cat.name}</td>
                  <td class="py-4 px-6">
                    <span class="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-mono">{cat.slug}</span>
                  </td>
                  <td class="py-4 px-6 text-xs text-gray-500">
                    {categories.find(p => p.id === cat.parent_id)?.name || <span class="text-gray-300 italic">None</span>}
                  </td>
                  <td class="py-4 px-6 text-right space-x-4">
                    {/* TOMBOL EDIT DITAMBAHKAN DI SINI */}
                    <a href={`/admin/categories/edit/${cat.id}`} class="text-blue-400 hover:text-blue-600 transition inline-block">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </a>
                    
                    <form method="POST" action={`/admin/categories/delete/${cat.id}`} class="inline" onsubmit="return confirm('Delete this category?')">
                      <button type="submit" class="text-red-300 hover:text-red-600 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// HANDLER POST: TAMBAH KATEGORI
export const POST = createRoute(async (c) => {
  const formData = await c.req.parseBody();
  const db = c.env.DB;

  const name = formData.name as string;
  const parentId = (formData.parent_id as string) === "" ? null : (formData.parent_id as string);
  const slug = createSlug(name);
  const id = generateId();

  try {
    await db.prepare(`
      INSERT INTO categories (id, parent_id, name, slug) 
      VALUES (?, ?, ?, ?)
    `)
    .bind(id, parentId, name, slug)
    .run();

    return c.redirect('/admin/categories');
  } catch (err: any) {
    return c.render(
      <div class="p-10 text-center">
        <h1 class="text-red-600 font-bold text-xl">Database Error</h1>
        <p class="text-gray-500 mt-2">{err.message}</p>
        <a href="/admin/categories" class="mt-4 inline-block text-black underline">Back and Try Again</a>
      </div>
    );
  }
});
