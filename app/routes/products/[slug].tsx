import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const db = c.env.DB
  const slug = c.req.param('slug')

  const product = await db.prepare(`
    SELECT p.*, c.name as category_name, s.name as store_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN stores s ON p.store_id = s.id
    WHERE p.slug = ? AND p.is_active = 1
  `).bind(slug).first()

  if (!product) return c.redirect('/404')

  // Parse gambar Cloudinary dengan aman
  let images: string[] = []
  try {
    images = JSON.parse((product.images_json as string) || '[]')
  } catch (e) {
    images = ['/placeholder.jpg']
  }
  if (images.length === 0) images = ['/placeholder.jpg']

  return c.render(
    <div className="bg-white min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* --- AREA GALERI GAMBAR --- */}
        <div className="space-y-4">
          <div className="w-full aspect-[4/5] bg-gray-100 rounded-sm overflow-hidden border border-gray-200">
            <img id="main-product-image" src={images[0]} alt={product.name as string} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button key={idx} onClick={`document.getElementById('main-product-image').src='${img}'`} className="w-20 h-24 flex-shrink-0 border border-gray-200 rounded-sm overflow-hidden hover:border-black transition-colors focus:outline-none">
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- AREA INFO PRODUK --- */}
        <div className="flex flex-col">
          <div className="mb-6 border-b border-gray-100 pb-6">
            <a href={`/store/${product.store_id}`} className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black mb-2 block">
              Boutique: {product.store_name || 'ShopinId Direct'}
            </a>
            <h1 className="text-3xl font-black text-gray-900 mb-2 leading-tight uppercase tracking-tight">{product.name}</h1>
            <p className="text-2xl font-bold text-red-600 mb-4">Rp {(product.price as number).toLocaleString('id-ID')}</p>
            <div className="flex items-center space-x-4 text-xs font-bold uppercase tracking-wider text-gray-600 bg-gray-50 p-3 rounded-sm border border-gray-200 w-fit">
              <span>Brand: <strong className="text-black">{product.brand}</strong></span>
              <span>|</span>
              <span>Kondisi: <strong className="text-black">{product.condition}</strong></span>
              <span>|</span>
              <span>Stok: <strong className="text-black">{product.stock}</strong></span>
            </div>
          </div>

          <div className="prose prose-sm text-gray-600 max-w-none mb-8" dangerouslySetInnerHTML={{ __html: product.description as string }} />

          {/* PERBAIKAN: Tombol terintegrasi dengan fungsi add-to-cart di client.ts */}
          <div className="mt-auto flex space-x-4">
            <button 
              type="button" 
              disabled={product.stock === 0} 
              className={`add-to-cart-btn flex-1 py-4 rounded-sm font-bold uppercase tracking-widest text-sm transition-colors border-2 ${product.stock === 0 ? 'border-gray-300 text-gray-500 bg-gray-100 cursor-not-allowed' : 'border-black text-black bg-white hover:bg-black hover:text-white'}`}
              data-id={product.id}
              data-name={product.name}
              data-price={product.price}
              data-image={images[0]}
            >
              {product.stock === 0 ? 'Stok Habis' : 'Tambah Keranjang'}
            </button>
            
            <button 
              type="button" 
              disabled={product.stock === 0} 
              onClick="const btn = this.previousElementSibling; btn.click(); window.location.href='/cart';"
              className={`flex-1 py-4 rounded-sm font-bold uppercase tracking-widest text-sm shadow-md transition-colors ${product.stock === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              Beli Sekarang
            </button>
          </div>

        </div>
      </div>
    </div>
  )
})
