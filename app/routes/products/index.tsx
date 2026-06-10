import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  
  // Tangkap parameter query dari URL (misal: ?category=bags)
  const categorySlug = c.req.query('category')
  
  let products = []
  
  if (categorySlug) {
    // =========================================================================
    // JIKA ADA FILTER KATEGORI: Gunakan RECURSIVE CTE untuk mengambil induk + anak
    // =========================================================================
    if (user) {
      const { results } = await db.prepare(`
        WITH RECURSIVE CategoryTree AS (
            SELECT id FROM categories WHERE slug = ?1
            UNION ALL
            SELECT c.id FROM categories c
            INNER JOIN CategoryTree ct ON c.parent_id = ct.id
        )
        SELECT p.*, CASE WHEN w.product_id IS NOT NULL THEN 1 ELSE 0 END as is_wishlisted 
        FROM products p 
        LEFT JOIN wishlists w ON p.id = w.product_id AND w.user_id = ?2
        WHERE p.category_id IN (SELECT id FROM CategoryTree)
        ORDER BY p.created_at DESC
      `).bind(categorySlug, user.id).all()
      products = results
    } else {
      const { results } = await db.prepare(`
        WITH RECURSIVE CategoryTree AS (
            SELECT id FROM categories WHERE slug = ?
            UNION ALL
            SELECT c.id FROM categories c
            INNER JOIN CategoryTree ct ON c.parent_id = ct.id
        )
        SELECT p.*, 0 as is_wishlisted 
        FROM products p 
        WHERE p.category_id IN (SELECT id FROM CategoryTree)
        ORDER BY p.created_at DESC
      `).bind(categorySlug).all()
      products = results
    }
  } else {
    // =========================================================================
    // JIKA TIDAK ADA FILTER KATEGORI: Tampilkan semua produk seperti biasa
    // =========================================================================
    if (user) {
      const { results } = await db.prepare(`
        SELECT p.*, CASE WHEN w.product_id IS NOT NULL THEN 1 ELSE 0 END as is_wishlisted 
        FROM products p 
        LEFT JOIN wishlists w ON p.id = w.product_id AND w.user_id = ? 
        ORDER BY p.created_at DESC
      `).bind(user.id).all()
      products = results
    } else {
      const { results } = await db.prepare("SELECT *, 0 as is_wishlisted FROM products ORDER BY created_at DESC").all()
      products = results
    }
  }

  return c.render(
    <div className="w-full bg-[#f4f7fc] py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {categorySlug ? `Kategori: ${categorySlug.replace(/-/g, ' ').toUpperCase()}` : 'Semua Produk'}
          </h1>
          <p className="text-sm text-gray-500">Menampilkan {products.length} item dari koleksi ShopinId.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product: any) => {
            const images = JSON.parse((product.images_json as string) || '[]')
            const mainImage = images[0] || '/placeholder.jpg'

            return (
              <a 
                key={product.id} 
                href={`/products/${product.slug}`}
                className="group bg-white rounded-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col relative"
              >
                {/* ICON WISHLIST */}
                <div className="absolute top-2 right-2 z-10">
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); fetch(`/api/wishlist/toggle?product_id=${product.id}`, {method: 'POST'}) }} 
                    className="p-1.5 bg-white/80 rounded-full hover:bg-white shadow-sm transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill={product.is_wishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-5 h-5 ${product.is_wishlisted ? 'text-red-500' : 'text-gray-400'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  </button>
                </div>

                <div className="w-full aspect-square bg-white relative overflow-hidden flex items-center justify-center p-2">
                  <img 
                    src={mainImage} 
                    alt={product.name} 
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                
                <div className="p-4 flex flex-col flex-grow bg-white border-t border-gray-50">
                  <span className="text-[15px] md:text-[17px] font-bold text-gray-900 mb-1 block tracking-tight">
                    Rp {(product.price as number).toLocaleString('id-ID')}
                  </span>
                  <div className="flex text-amber-400 text-[10px] md:text-xs mb-2">★★★★★</div>
                  {product.brand && (
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      {product.brand}
                    </span>
                  )}
                  <h3 className="text-xs md:text-sm text-gray-600 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                </div>
              </a>
            )
          })}
        </div>

        {/* Paginasi Sementara */}
        {products.length > 0 && (
          <div className="flex justify-center items-center mt-12 space-x-2">
             <button className="w-10 h-10 rounded-full bg-black text-white text-sm font-bold">1</button>
             <button className="w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-600 text-sm hover:bg-gray-100">2</button>
             <button className="w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-600 text-sm hover:bg-gray-100">3</button>
             <span className="text-gray-400 px-2">...</span>
             <button className="w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-600 text-sm hover:bg-gray-100">20</button>
          </div>
        )}

      </div>
    </div>
  )
})
