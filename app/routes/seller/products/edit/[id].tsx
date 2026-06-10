import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const productId = c.req.param('id')
  const formData = await c.req.formData()
  
  const name = formData.get('name') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const price = parseInt(formData.get('price') as string, 10)
  const stock = parseInt(formData.get('stock') as string, 10)
  const description = formData.get('description') as string

  // Pastikan produk milik seller yang bersangkutan
  await db.prepare(`
    UPDATE products 
    SET name = ?, brand = ?, condition = ?, price = ?, stock = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND store_id = (SELECT id FROM stores WHERE user_id = ?)
  `).bind(name, brand, condition, price, stock, description, productId, user.id).run()

  return c.redirect('/seller/products?success=edited')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const productId = c.req.param('id')
  const product = await db.prepare("SELECT * FROM products WHERE id = ? AND store_id = (SELECT id FROM stores WHERE user_id = ?)").bind(productId, user.id).first()
  
  if (!product) return c.redirect('/seller/products')

  return c.render(
    <div className="w-full bg-[#f4f7fc] min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
          <a href="/seller/products" className="text-sm font-bold text-gray-500 hover:text-black">← Batal</a>
        </div>

        <form action={`/seller/products/edit/${productId}`} method="POST" className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nama Produk</label>
              <input type="text" name="name" defaultValue={product.name as string} required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Brand</label>
              <input type="text" name="brand" defaultValue={product.brand as string} required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Kondisi</label>
              <input type="text" name="condition" defaultValue={product.condition as string} required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Harga Jual (Rp)</label>
              <input type="number" name="price" defaultValue={product.price as number} required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Stok</label>
              <input type="number" name="stock" defaultValue={product.stock as number} required className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Deskripsi Produk</label>
              <textarea name="description" rows={5} required defaultValue={product.description as string} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black"></textarea>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button type="submit" className="bg-black text-white px-8 py-3 rounded-sm font-bold uppercase tracking-widest text-sm hover:bg-gray-800 shadow-md">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  )
})
