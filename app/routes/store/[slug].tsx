import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const db = c.env.DB
  const slug = c.req.param('slug')

  // 1. Ambil Data Toko
  const store = await db.prepare("SELECT * FROM stores WHERE slug = ?").bind(slug).first()
  if (!store) return c.redirect('/404')

  // 2. Ambil Etalase Produk Khusus Toko Ini
  const { results: products } = await db.prepare("SELECT * FROM products WHERE store_id = ? AND is_active = 1 ORDER BY created_at DESC").bind(store.id).all()

  return c.render(
    <div className="w-full bg-[#f4f7fc] min-h-screen pb-12">
      
      {/* --- HEADER BOUTIQUE (BANNER & AVATAR) --- */}
      <div className="w-full bg-white border-b border-gray-200">
        {/* Banner */}
        <div className="h-48 md:h-64 w-full bg-gray-200 relative overflow-hidden">
           <img 
              src={(store.banner_url as string) || '/default-banner.jpg'} 
              alt={`Banner ${store.name}`} 
              className="w-full h-full object-cover" 
           />
        </div>
        
        {/* Profil & Info Toko */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-12 md:-mt-16 pb-6 flex flex-col md:flex-row md:items-end md:justify-between">
           
           <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
             {/* Avatar */}
             <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-sm border-4 border-white shadow-md overflow-hidden flex-shrink-0">
                <img 
                  src={(store.avatar_url as string) || '/default-avatar.png'} 
                  alt={store.name as string} 
                  className="w-full h-full object-cover" 
                />
             </div>
             
             {/* Nama & Meta Info */}
             <div className="mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">{store.name}</h1>
                <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
                   <span className="flex items-center">
                      <span className="mr-1">📍</span> {store.location || 'Indonesia'}
                   </span>
                   <span className="flex items-center text-amber-500 font-bold">
                      ★ {(store.rating as number).toFixed(1)} <span className="text-gray-400 font-normal ml-1">Rating</span>
                   </span>
                   <span>
                      <strong className="text-black">{store.followers_count}</strong> Followers
                   </span>
                </div>
             </div>
           </div>

           {/* Tombol Aksi Kanan */}
           <div className="mt-4 md:mt-0 flex space-x-3">
              <button className="bg-transparent border border-black text-black px-6 py-2.5 rounded-sm font-bold text-sm uppercase tracking-wide hover:bg-gray-50 transition-colors">
                 Hubungi Penjual
              </button>
              <button className="bg-black text-white px-8 py-2.5 rounded-sm font-bold text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors shadow-sm">
                 + Follow
              </button>
           </div>
           
        </div>
      </div>

      {/* --- ETALASE PRODUK --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Koleksi Boutique</h2>
          <span className="text-sm text-gray-500">{products.length} Barang Ditemukan</span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white p-12 text-center border border-gray-200 rounded-sm">
             <p className="text-gray-500">Boutique ini belum memiliki produk yang diunggah.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((product: any) => {
               const images = JSON.parse((product.images_json as string) || '[]')
               return (
                <a key={product.id} href={`/products/${product.slug}`} className="group bg-white rounded-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <div className="w-full aspect-square bg-white relative overflow-hidden p-2">
                    <img src={images[0] || '/placeholder.jpg'} alt={product.name as string} className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4 flex flex-col flex-grow border-t border-gray-50">
                    <span className="text-[15px] font-bold text-gray-900 mb-1 block">Rp {(product.price as number).toLocaleString('id-ID')}</span>
                    <h3 className="text-xs text-gray-600 line-clamp-2 leading-tight">{product.name as string}</h3>
                  </div>
                </a>
               )
            })}
          </div>
        )}
      </div>

    </div>
  )
})
