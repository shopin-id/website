import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  // Pastikan user ini sudah memiliki toko
  const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first()
  if (!store) return c.redirect('/seller/register')

  // Ambil semua produk milik toko ini
  const { results: products } = await db.prepare("SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC").bind(store.id).all()

  return c.render(
    <div className="py-8 px-6 md:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER HALAMAN */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-gray-200 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-widest">Katalog Produk</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola semua produk yang Anda jual di toko ini.</p>
          </div>
          <a href="/seller/products/new" className="bg-black text-white px-6 py-3 rounded-sm font-bold text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-sm whitespace-nowrap">
            + Tambah Produk Baru
          </a>
        </div>

        {/* TABEL DAFTAR PRODUK */}
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
          {products.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                 </svg>
              </div>
              <p className="text-gray-500 mb-6 text-sm">Anda belum memiliki produk satupun di etalase.</p>
              <a href="/seller/products/new" className="text-black text-xs font-bold uppercase tracking-widest border border-black px-8 py-3 rounded-sm hover:bg-gray-50 transition-colors">
                Buat Produk Pertama
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
                    <th className="p-4 font-bold w-1/2">Informasi Produk</th>
                    <th className="p-4 font-bold">Harga</th>
                    <th className="p-4 font-bold">Stok</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
                  {products.map((p: any) => {
                    const images = JSON.parse((p.images_json as string) || '[]')
                    const mainImage = images[0] || '/placeholder.jpg' // Fallback jika tidak ada gambar

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 flex items-center space-x-4">
                          <div className="w-14 h-14 bg-white rounded-sm border border-gray-100 flex-shrink-0 p-1 flex items-center justify-center">
                            <img src={mainImage} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <a href={`/products/${p.slug}`} target="_blank" className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">{p.name}</a>
                            <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-medium">
                              {p.brand} <span className="mx-1">•</span> {p.condition} {p.is_digital ? <span className="ml-1 text-purple-500 font-bold">(Digital)</span> : ''}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-900 whitespace-nowrap">
                          Rp {(p.price as number).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 font-medium">
                          {p.stock}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {p.is_active ? 'Aktif' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-4 whitespace-nowrap">
                          <a href={`/seller/products/edit/${p.id}`} className="text-blue-500 hover:text-blue-800 text-[10px] font-bold uppercase tracking-widest transition-colors">
                            Edit
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
