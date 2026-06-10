import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM products ORDER BY created_at DESC"
    ).all();

    const products = results || [];

    const formatIDR = (p: number) => new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(p || 0);

    return c.render(
      <div class="max-w-[1200px] mx-auto px-6 py-10">
        <div class="flex justify-between items-center mb-10 border-b border-neutral-100 pb-8">
          <div>
            <h1 class="text-2xl font-bold uppercase tracking-[0.2em]">Product Inventory</h1>
            <p class="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-bold">Manage your luxury catalog</p>
          </div>
          <a href="/admin/new" class="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition shadow-xl">
            + Add New Product
          </a>
        </div>

        <div class="bg-white border border-neutral-100 shadow-sm overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-neutral-50 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 border-b border-neutral-100">
                <th class="p-6">Item</th>
                <th class="p-6">Product ID</th>
                <th class="p-6">Brand</th>
                <th class="p-6">Price</th>
                <th class="p-6">Stock</th>
                <th class="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 text-[11px] uppercase tracking-wider">
              {products.map((p: any) => {
                let images = [];
                try {
                  // Safety Check untuk JSON
                  const parsed = JSON.parse(p.images_json || '[]');
                  images = Array.isArray(parsed) ? parsed : [];
                } catch (e) { images = []; }

                return (
                  <tr key={p.id} class="hover:bg-neutral-50 transition-colors">
                    <td class="p-6">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-neutral-100 border border-neutral-100 overflow-hidden">
                          {images[0] && <img src={images[0]} class="w-full h-full object-cover" />}
                        </div>
                        <span class="font-bold text-black truncate max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td class="p-6 font-mono text-neutral-400">{p.id}</td>
                    <td class="p-6 font-bold">{p.brand}</td>
                    <td class="p-6 font-bold italic">{formatIDR(p.price)}</td>
                    <td class="p-6">
                      <span class={p.stock > 0 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                        {p.stock > 0 ? `${p.stock} UNIT` : "SOLD OUT"}
                      </span>
                    </td>
                    <td class="p-6 text-right space-x-4">
                      {/* FIX: Link diarahkan ke folder admin/edit sesuai lokasi file */}
                      <a href={`/admin/edit/${p.id}`} class="text-black font-bold border-b border-black">EDIT</a>
                      <button onclick={`window.deleteProduct('${p.id}')`} class="text-red-400 font-bold">DELETE</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          window.deleteProduct = async function(id) {
            if(!confirm('Delete this item?')) return;
            const res = await fetch('/api/page-builder/delete', { // Gunakan API delete yang sudah ada
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id })
            });
            if(res.ok) window.location.reload();
          }
        `}} />
      </div>,
      { title: 'Product Management | Visoe Adm' }
    );
  } catch (err: any) {
    return c.render(<div class="p-20 text-center uppercase tracking-widest text-xs font-bold text-red-500">Render Error: {err.message}</div>);
  }
});