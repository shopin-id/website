import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const id = c.req.param('id')
  const formData = await c.req.formData()
  
  // Tangkap data dari form
  const name = formData.get('name') as string
  const category_id = formData.get('category_id') as string
  const brand = formData.get('brand') as string
  const condition = formData.get('condition') as string
  const price = parseInt(formData.get('price') as string) || 0
  const stock = parseInt(formData.get('stock') as string) || 0
  const is_active = parseInt(formData.get('is_active') as string) || 0
  const description = formData.get('description') as string

  // Proses update ke database
  await db.prepare(`
    UPDATE products 
    SET name = ?, category_id = ?, brand = ?, condition = ?, price = ?, stock = ?, is_active = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(name, category_id, brand, condition, price, stock, is_active, description, id).run()

  // WAJIB RETURN RESPONSE (Inilah yang menyebabkan error sebelumnya jika tidak ada)
  return c.redirect('/admin/products?success=1')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const id = c.req.param('id')

  // 1. Ambil data produk berdasarkan ID di URL
  const product = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first()
  
  // Jika produk tidak ditemukan, kembalikan ke halaman list
  if (!product) return c.redirect('/admin/products')

  // 2. Ambil daftar kategori untuk dropdown
  const { results: categories } = await db.prepare("SELECT id, name FROM categories ORDER BY name ASC").all()

  // WAJIB RETURN c.render (Jika hanya c.render tanpa return, akan muncul error Promise Response!)
  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 max-w-4xl mx-auto mt-6">
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Edit Produk</h2>
          <p className="text-sm text-gray-500">Ubah informasi, harga, stok, dan status produk secara manual.</p>
        </div>
        <a href="/admin/products" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black">
          ← Kembali
        </a>
      </div>

      <form method="POST" className="space-y-6">
        
        {/* BLOK INFORMASI UTAMA */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Informasi Dasar</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Produk</label>
                 <input type="text" name="name" value={product.name as string} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold" />
              </div>
              
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kategori</label>
                 <select name="category_id" required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white">
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((cat: any) => (
                       <option key={cat.id} value={cat.id} selected={product.category_id === cat.id}>{cat.name}</option>
                    ))}
                 </select>
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Brand / Merek</label>
                 <input type="text" name="brand" value={product.brand as string} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kondisi Barang</label>
                 <select name="condition" required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white">
                    <option value="New" selected={product.condition === 'New'}>Baru (New)</option>
                    <option value="Pristine" selected={product.condition === 'Pristine'}>Pristine (Seperti Baru)</option>
                    <option value="Excellent" selected={product.condition === 'Excellent'}>Sangat Bagus (Excellent)</option>
                    <option value="Good" selected={product.condition === 'Good'}>Bagus (Good)</option>
                    <option value="Fair" selected={product.condition === 'Fair'}>Cukup (Fair)</option>
                 </select>
              </div>
           </div>
        </div>

        {/* BLOK INVENTORI & HARGA */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Harga, Stok & Status</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Harga Jual (Rp)</label>
                 <input type="number" name="price" value={product.price as number} required className="w-full border border-blue-300 px-3 py-2 text-sm rounded-sm focus:ring-blue-500 font-bold text-blue-700 bg-blue-50" />
              </div>
              
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sisa Stok</label>
                 <input type="number" name="stock" value={product.stock as number} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black font-bold" />
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status Visibilitas</label>
                 <select name="is_active" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white font-bold">
                    <option value="1" selected={product.is_active === 1}>AKTIF (Ditampilkan)</option>
                    <option value="0" selected={product.is_active === 0}>NONAKTIF (Disembunyikan)</option>
                 </select>
              </div>
           </div>
        </div>

        {/* BLOK DESKRIPSI */}
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Deskripsi Produk</h3>
           <textarea 
             name="description" 
             rows={8} 
             required 
             className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black text-gray-700 leading-relaxed"
           >{product.description as string}</textarea>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <a href="/admin/products" className="bg-gray-100 text-gray-600 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
            Batal
          </a>
          <button type="submit" className="bg-black text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-800 shadow-md transition-all">
            Simpan Perubahan
          </button>
        </div>
      </form>

    </div>,
    { title: 'Edit Produk | Admin' }
  )
})
