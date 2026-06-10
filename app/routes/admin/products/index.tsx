import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.text('Unauthorized', 401)

  const formData = await c.req.formData()
  const action = formData.get('action') as string
  const id = formData.get('id') as string

  if (action === 'delete' && id) {
    try {
      // 1. Coba Hapus Permanen (Hard Delete)
      await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run()
      return c.redirect('/admin/products?success=deleted')
    } catch (error: any) {
      // 2. Jika gagal karena produk terkait dengan nota pesanan (RESTRICT), lakukan Soft Delete
      if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
        await db.prepare("UPDATE products SET is_active = 0 WHERE id = ?").bind(id).run()
        return c.redirect('/admin/products?success=soft_deleted')
      }
      console.error("Delete Error:", error)
      return c.redirect('/admin/products?err=delete_failed')
    }
  }

  return c.redirect('/admin/products')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const success = c.req.query('success')
  const err = c.req.query('err')

  // Tarik seluruh data produk gabung dengan nama Kategori dan nama Toko/Vendor
  const { results: products } = await db.prepare(`
    SELECT p.id, p.name, p.brand, p.price, p.stock, p.is_active, p.images_json, p.created_at,
           c.name as category_name, s.name as store_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN stores s ON p.store_id = s.id
    ORDER BY p.created_at DESC
  `).all()

  const formatIDR = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p || 0)

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200">
      
      {/* HEADER PAGE */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Katalog Produk Global</h2>
          <p className="text-sm text-gray-500 mt-0.5">Kelola seluruh produk, hapus item, dan pantau stok dari berbagai vendor.</p>
        </div>
        <a href="/admin/products/new" className="bg-green-600 text-white px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-green-700 shadow-md transition-colors">
          + Tambah Produk
        </a>
      </div>

      {/* NOTIFIKASI */}
      {success === 'deleted' && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 text-sm font-bold rounded-sm mb-6">
          ✓ Produk berhasil dihapus permanen dari sistem.
        </div>
      )}
      {success === 'soft_deleted' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 text-sm font-bold rounded-sm mb-6">
          ⚠ Produk dinonaktifkan (disembunyikan) karena memiliki riwayat pesanan yang tidak boleh dihapus.
        </div>
      )}
      {err === 'delete_failed' && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-sm font-bold rounded-sm mb-6">
          ✕ Terjadi kesalahan sistem saat menghapus produk.
        </div>
      )}

      {/* TABEL DATA SAMA DENGAN STANDAR ADMIN */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-900 border-y border-gray-800 text-[11px] uppercase tracking-wider text-gray-200">
              <th className="p-3 w-16 text-center font-bold">Foto</th>
              <th className="p-3 font-bold">Nama Produk & Brand</th>
              <th className="p-3 font-bold">Toko / Vendor</th>
              <th className="p-3 font-bold">Harga & Stok</th>
              <th className="p-3 text-center font-bold">Status</th>
              <th className="p-3 font-bold">Tanggal Dibuat</th>
              <th className="p-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">Belum ada produk yang terdaftar.</td>
              </tr>
            ) : (
              products.map((p: any) => {
                let images = []
                try { images = JSON.parse(p.images_json || '[]') } catch(e) {}
                const mainImg = images[0] || '/placeholder.jpg'

                return (
                  <tr key={p.id} className={`transition-colors ${p.is_active ? 'hover:bg-gray-50' : 'bg-red-50/30 opacity-70'}`}>
                    <td className="p-3 text-center">
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-sm overflow-hidden flex items-center justify-center mx-auto">
                        <img src={mainImg} alt={p.name} className="object-cover w-full h-full" loading="lazy" />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-gray-900 line-clamp-1" title={p.name}>{p.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border">{p.brand}</span>
                        <span className="text-[10px] text-gray-400">{p.category_name || 'Tanpa Kategori'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-blue-700 uppercase tracking-widest text-[10px]">
                        {p.store_name || 'ShopinId Direct'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-black text-gray-900 text-sm">{formatIDR(p.price)}</div>
                      <div className="text-[10px] font-bold text-gray-500 mt-0.5">Sisa Stok: <span className={p.stock <= 5 ? "text-red-500" : "text-green-600"}>{p.stock}</span></div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                    </td>
                    
                    {/* TOMBOL AKSI TERMASUK FORM HAPUS */}
                    <td className="p-3 text-right whitespace-nowrap space-x-1.5 flex justify-end items-center">
                      <a 
                        href={`/admin/products/edit/${p.id}`} 
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors inline-block"
                      >
                        Edit
                      </a>
                      
                      <form action="/admin/products" method="POST" className="m-0 inline-block" onsubmit="return confirm('Apakah Anda yakin ingin menghapus produk ini?');">
                        <input type="hidden" name="action" value="delete" />
                        <input type="hidden" name="id" value={p.id} />
                        <button 
                          type="submit" 
                          className="bg-red-50 text-red-600 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors"
                        >
                          Hapus
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

    </div>,
    { title: 'Katalog Produk | Admin' }
  )
})
