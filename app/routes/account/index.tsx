import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const wishlistQuery = await db.prepare(`
    SELECT p.id, p.name, p.price, p.slug, p.images_json, w.id as wishlist_id
    FROM wishlists w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `).bind(user.id).all()

  const wishlists = wishlistQuery.results || []

  return c.render(
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* SIDEBAR AKUN (STANDAR KONSISTEN) */}
        <aside className="w-full lg:col-span-1">
          <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
            <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-black mb-4 shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-gray-900 truncate">{user.name}</h2>
            <p className="text-xs text-gray-500 mb-6 truncate">{user.email}</p>
            
            <nav className="flex flex-col space-y-1">
              <a href="/account" className="block text-sm font-bold text-red-600 bg-red-50 px-4 py-2.5 rounded-sm">Dasbor Akun</a>
              <a href="/account/orders" className="block text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 px-4 py-2.5 rounded-sm transition-colors">Riwayat Pesanan</a>
              <a href="/account/settings" className="block text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 px-4 py-2.5 rounded-sm transition-colors">Pengaturan Profil</a>
              <a href="/seller" className="block text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-sm mt-4 border border-blue-100 transition-colors">Area Toko Saya</a>
              <form action="/logout" method="POST" className="pt-4 mt-4 border-t border-gray-100">
                <button type="submit" className="text-sm font-bold text-red-500 hover:text-red-700 w-full text-left px-4 py-2">Keluar (Logout)</button>
              </form>
            </nav>
          </div>
        </aside>

        {/* KONTEN UTAMA */}
        <section className="w-full lg:col-span-3">
          <div className="bg-white p-6 md:p-8 border border-gray-200 rounded-sm shadow-sm min-h-[500px]">
            <h3 className="text-xl font-black mb-6 border-b border-gray-100 pb-4 uppercase tracking-wider text-gray-900">
              Wishlist Saya <span className="text-gray-400 text-sm ml-2 font-normal">({wishlists.length} Item)</span>
            </h3>
            
            {wishlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                <p className="text-sm font-medium">Daftar keinginan Anda masih kosong.</p>
                <a href="/products" className="mt-4 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-gray-800 transition-colors">Jelajahi Produk</a>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {wishlists.map((item: any) => {
                   let imgUrl = 'https://via.placeholder.com/300'
                   try {
                     const imgs = JSON.parse(item.images_json)
                     if (imgs.length > 0) imgUrl = imgs[0]
                   } catch(e) {}

                   return (
                     <div key={item.id} className="group relative border border-gray-200 rounded-sm hover:shadow-md transition-all duration-300 bg-white flex flex-col justify-between">
                        <div>
                          <a href={`/products/${item.slug}`} className="block relative w-full aspect-square bg-gray-50 overflow-hidden">
                             <img src={imgUrl} alt={item.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                          </a>
                          <div className="p-4">
                             <h4 className="text-xs font-medium text-gray-800 line-clamp-2 min-h-[32px]">{item.name}</h4>
                             <p className="text-sm font-bold text-red-600 mt-2">Rp {item.price.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                        <div className="p-4 pt-0">
                          <button 
                             onClick={`fetch('/api/wishlist/toggle', {method: 'POST', body: JSON.stringify({product_id: '${item.id}'}), headers: {'Content-Type': 'application/json'}}).then(()=>window.location.reload())`}
                             className="w-full py-2 border border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-600 text-center text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                          >
                             Hapus Item
                          </button>
                        </div>
                     </div>
                   )
                })}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
})
