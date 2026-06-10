import { createRoute } from 'honox/factory'
import { getAuthUser } from '../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  
  // Parameter halaman untuk widget All Products Grid
  const currentPage = parseInt(c.req.query('page') || '1', 10)

  const { results: widgets } = await db.prepare(
    "SELECT * FROM frontpage_widgets WHERE is_active = 1 AND page_id = 'home' ORDER BY display_order ASC"
  ).all()
  
  const renderWidget = async (widget: any) => {
    const content = JSON.parse((widget.content_json as string) || '{}')

    // ==========================================
    // 1. WIDGET: ALL PRODUCTS GRID (PAGINASI)
    // ==========================================
    if (widget.widget_type === 'all_products_grid') {
      const perPage = content.per_page || 10
      const offset = (currentPage - 1) * perPage

      const totalRow = await db.prepare("SELECT COUNT(*) as count FROM products WHERE is_active = 1").first()
      const totalProducts = (totalRow?.count as number) || 0
      const totalPages = Math.ceil(totalProducts / perPage)

      let products = []
      if (user) {
        const { results } = await db.prepare(`
          SELECT p.id, p.slug, p.name, p.price, p.images_json, p.brand, s.name as store_name,
                 CASE WHEN w.product_id IS NOT NULL THEN 1 ELSE 0 END as is_wishlisted
          FROM products p
          LEFT JOIN stores s ON p.store_id = s.id
          LEFT JOIN wishlists w ON p.id = w.product_id AND w.user_id = ?
          WHERE p.is_active = 1
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?
        `).bind(user.id, perPage, offset).all()
        products = results
      } else {
        const { results } = await db.prepare(`
          SELECT p.id, p.slug, p.name, p.price, p.images_json, p.brand, s.name as store_name, 0 as is_wishlisted
          FROM products p
          LEFT JOIN stores s ON p.store_id = s.id
          WHERE p.is_active = 1
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?
        `).bind(perPage, offset).all()
        products = results
      }

      if (products.length === 0) return null

      return (
        <section key={widget.id} className="w-full bg-[#f4f7fc] py-12 md:py-16 px-4 md:px-8 border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-widest mb-2 text-center">
                {widget.title || 'Semua Produk Kami'}
              </h2>
              {content.description && <p className="text-sm text-gray-500 text-center max-w-2xl">{content.description}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product: any) => {
                let images = []; try { images = JSON.parse(product.images_json || '[]') } catch(e) {}
                const mainImage = images[0] || '/placeholder.jpg'

                return (
                  <a key={product.id} href={`/products/${product.slug}`} className="group bg-white rounded-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col border border-gray-100 relative">
                    <div className="absolute top-2 right-2 z-10">
                      <button type="button" onClick={(e) => { e.preventDefault(); fetch(`/api/wishlist/toggle?product_id=${product.id}`, {method: 'POST'}) }} className="p-1.5 bg-white/80 rounded-full hover:bg-white shadow-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill={product.is_wishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-5 h-5 ${product.is_wishlisted ? 'text-red-500' : 'text-gray-400'}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                      </button>
                    </div>

                    <div className="w-full aspect-[4/5] bg-white relative overflow-hidden flex items-center justify-center p-2">
                      <img src={mainImage} alt={product.name as string} className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                    
                    <div className="p-4 flex flex-col flex-grow bg-white border-t border-gray-50">
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest line-clamp-1 mb-1">{product.store_name || 'SHOPINID DIRECT'}</span>
                      <span className="text-[15px] md:text-[17px] font-bold text-red-600 mb-1 block tracking-tight">Rp {(product.price as number).toLocaleString('id-ID')}</span>
                      <div className="flex text-amber-400 text-[10px] md:text-xs mb-2">★★★★★</div>
                      <h3 className="text-xs md:text-sm text-gray-600 line-clamp-2 leading-tight">{product.name as string}</h3>
                    </div>
                  </a>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-16">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1
                  return (
                    <a key={pageNum} href={`/?page=${pageNum}`} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${pageNum === currentPage ? 'bg-black text-white border-black shadow-md scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'}`}>
                      {pageNum}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )
    }

    // ==========================================
    // 2. WIDGET: HERO SLIDER
    // ==========================================
    if (widget.widget_type === 'hero_slider') {
      const slides = content.slides || []
      if (slides.length === 0) return null
      
      const sliderId = `hero-slider-${widget.id}`
      const dotsId = `hero-dots-${widget.id}`
      const prevBtnId = `hero-prev-${widget.id}`
      const nextBtnId = `hero-next-${widget.id}`

      return (
        <section key={widget.id} className="w-full bg-white py-6 px-4 md:px-8">
          <div className="max-w-7xl mx-auto rounded-sm relative group shadow-sm overflow-hidden">
            
            <div className="relative w-full">
              {/* Slider Container */}
              <div id={sliderId} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth">
                {slides.map((slide: any, idx: number) => (
                  <a key={idx} href={slide.link} className="flex-none w-full snap-center block">
                    <div className="w-full bg-gray-50">
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-full h-auto object-cover object-center" 
                        loading={idx === 0 ? "eager" : "lazy"} 
                      />
                    </div>
                  </a>
                ))}
              </div>

              {/* Navigasi Panah Kiri */}
              <button 
                id={prevBtnId} 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md z-10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 scale-90 hover:scale-100"
                aria-label="Previous Slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              {/* Navigasi Panah Kanan */}
              <button 
                id={nextBtnId} 
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md z-10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 scale-90 hover:scale-100"
                aria-label="Next Slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Dot Indicators */}
              <div id={dotsId} className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    data-index={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ${
                      idx === 0 ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                    }`}
                  ></button>
                ))}
              </div>
            </div>

            {/* Skrip Javascript untuk Auto-Play & Navigation */}
            <script dangerouslySetInnerHTML={{__html: `
              (function() {
                const slider = document.getElementById('${sliderId}');
                const dotsContainer = document.getElementById('${dotsId}');
                const prevBtn = document.getElementById('${prevBtnId}');
                const nextBtn = document.getElementById('${nextBtnId}');
                
                if (!slider) return;
                
                const totalSlides = ${slides.length};
                if (totalSlides <= 1) {
                  if (dotsContainer) dotsContainer.style.display = 'none';
                  if (prevBtn) prevBtn.style.display = 'none';
                  if (nextBtn) nextBtn.style.display = 'none';
                  return; 
                }
                
                let currentIndex = 0;
                let autoPlayTimer;
                
                const updateDots = (index) => {
                  if (!dotsContainer) return;
                  const dots = dotsContainer.querySelectorAll('button');
                  dots.forEach((dot, i) => {
                    if (i === index) {
                      dot.className = 'w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm bg-white scale-125';
                    } else {
                      dot.className = 'w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm bg-white/50 hover:bg-white/80';
                    }
                  });
                };

                const goToSlide = (index) => {
                  currentIndex = index;
                  slider.scrollTo({
                    left: slider.clientWidth * currentIndex,
                    behavior: 'smooth'
                  });
                  updateDots(currentIndex);
                  resetTimer();
                };

                // Event Listener Panah Navigasi
                if (prevBtn) {
                  prevBtn.addEventListener('click', () => {
                    const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                    goToSlide(prevIndex);
                  });
                }

                if (nextBtn) {
                  nextBtn.addEventListener('click', () => {
                    const nextIndex = (currentIndex + 1) % totalSlides;
                    goToSlide(nextIndex);
                  });
                }

                // Event Listener Dot Navigasi
                if (dotsContainer) {
                  const dots = dotsContainer.querySelectorAll('button');
                  dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                      goToSlide(index);
                    });
                  });
                }

                // Sinkronisasi manual swipe
                slider.addEventListener('scroll', () => {
                  const scrollPosition = slider.scrollLeft;
                  const slideIndex = Math.round(scrollPosition / slider.clientWidth);
                  
                  if (slideIndex !== currentIndex && slideIndex >= 0 && slideIndex < totalSlides) {
                    currentIndex = slideIndex;
                    updateDots(currentIndex);
                    resetTimer();
                  }
                }, { passive: true });

                const startTimer = () => {
                  autoPlayTimer = setInterval(() => {
                    const nextIndex = (currentIndex + 1) % totalSlides;
                    goToSlide(nextIndex);
                  }, 4000);
                };

                const resetTimer = () => {
                  clearInterval(autoPlayTimer);
                  startTimer();
                };

                startTimer();
              })();
            `}} />

          </div>
        </section>
      )
    }

    // ==========================================
    // 3. WIDGET: ICON NAV
    // ==========================================
    if (widget.widget_type === 'icon_nav') {
      const items = content.items || []
      if (items.length === 0) return null
      return (
        <section key={widget.id} className="w-full bg-white py-8 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-6 md:justify-center min-w-max pb-2">
              {items.map((item: any, idx: number) => (
                <a key={idx} href={item.link} className="flex flex-col items-center group w-20 md:w-24">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white overflow-hidden border border-gray-200 group-hover:border-black group-hover:shadow-md transition-all p-3">
                    <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-800 mt-3 text-center uppercase tracking-wider group-hover:text-black">{item.title}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )
    }

    // ==========================================
    // 4. WIDGET: PROMO BANNER
    // ==========================================
    if (widget.widget_type === 'promo_banner') {
      const promos = content.promos || []
      if (promos.length === 0) return null
      return (
        <section key={widget.id} className="w-full bg-white py-10 px-4 md:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {promos.map((promo: any, idx: number) => (
              <a key={idx} href={promo.link} className="group relative block overflow-hidden bg-gray-100 rounded-sm">
                <div className="aspect-[16/9] md:aspect-[4/3] w-full">
                  <img src={promo.image} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all flex flex-col items-center justify-center text-white p-6 text-center">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-widest mb-2 drop-shadow-md">{promo.title}</h3>
                  {promo.subtitle && <p className="text-sm font-medium mb-4 drop-shadow-md">{promo.subtitle}</p>}
                  <span className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-widest group-hover:bg-gray-200 transition-colors">
                    {promo.button_text || 'Belanja Sekarang'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )
    }

    // ==========================================
    // 5. WIDGET: FEATURED PRODUCTS / NEW ARRIVALS
    // ==========================================
    if (widget.widget_type === 'featured_products' || widget.widget_type === 'new_arrivals') {
      const productIds = content.product_ids || []
      if (productIds.length === 0) return null

      const placeholders = productIds.map(() => '?').join(',')
      let products = []
      
      if (user) {
        const { results } = await db.prepare(`
          SELECT p.id, p.slug, p.name, p.price, p.images_json, p.brand, s.name as store_name,
                 CASE WHEN w.product_id IS NOT NULL THEN 1 ELSE 0 END as is_wishlisted
          FROM products p
          LEFT JOIN stores s ON p.store_id = s.id
          LEFT JOIN wishlists w ON p.id = w.product_id AND w.user_id = ?
          WHERE p.id IN (${placeholders}) AND p.is_active = 1
        `).bind(user.id, ...productIds).all()
        products = results
      } else {
        const { results } = await db.prepare(`
          SELECT p.id, p.slug, p.name, p.price, p.images_json, p.brand, s.name as store_name, 0 as is_wishlisted
          FROM products p
          LEFT JOIN stores s ON p.store_id = s.id
          WHERE p.id IN (${placeholders}) AND p.is_active = 1
        `).bind(...productIds).all()
        products = results
      }

      return (
        <section key={widget.id} className="w-full bg-[#f4f7fc] py-12 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-3">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-tight">{widget.title}</h2>
              <a href="/products" className="text-sm font-semibold text-gray-500 hover:text-black transition-colors uppercase tracking-widest">Lihat Semua</a>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product: any) => {
                const images = JSON.parse((product.images_json as string) || '[]')
                const mainImage = images[0] || '/placeholder.jpg'

                return (
                  <a key={product.id} href={`/products/${product.slug}`} className="group bg-white rounded-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col border border-gray-100 relative">
                    <div className="absolute top-2 right-2 z-10">
                      <button type="button" onClick={(e) => { e.preventDefault(); fetch(`/api/wishlist/toggle?product_id=${product.id}`, {method: 'POST'}) }} className="p-1.5 bg-white/80 rounded-full hover:bg-white shadow-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill={product.is_wishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-5 h-5 ${product.is_wishlisted ? 'text-red-500' : 'text-gray-400'}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                      </button>
                    </div>

                    <div className="w-full aspect-[4/5] bg-white relative overflow-hidden flex items-center justify-center p-2">
                      <img src={mainImage} alt={product.name as string} className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                    
                    <div className="p-4 flex flex-col flex-grow bg-white border-t border-gray-50">
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest line-clamp-1 mb-1">{product.store_name || 'SHOPINID DIRECT'}</span>
                      <span className="text-[15px] md:text-[17px] font-bold text-red-600 mb-1 block tracking-tight">Rp {(product.price as number).toLocaleString('id-ID')}</span>
                      <div className="flex text-amber-400 text-[10px] md:text-xs mb-2">★★★★★</div>
                      <h3 className="text-xs md:text-sm text-gray-600 line-clamp-2 leading-tight">{product.name as string}</h3>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      )
    }

    // ==========================================
    // 6. WIDGET: TEKS KUSTOM
    // ==========================================
    if (widget.widget_type === 'custom_title') {
      return (
        <section key={widget.id} className="w-full bg-white px-4">
          <h2 style={{color: content.text_color, textAlign: content.align}} className={`py-12 ${content.font_size || 'text-3xl'} font-black uppercase tracking-widest max-w-7xl mx-auto`}>
            {content.text}
          </h2>
        </section>
      )
    }

    if (widget.widget_type === 'custom_paragraph') {
      return (
        <section key={widget.id} className="w-full bg-white px-4">
          <p style={{color: content.text_color, textAlign: content.align}} className={`py-6 ${content.font_size || 'text-base'} max-w-4xl mx-auto leading-relaxed`}>
            {content.text}
          </p>
        </section>
      )
    }
    
    return null;
  }

  const widgetElements = await Promise.all(widgets.map(w => renderWidget(w)))

  return c.render(
    <div className="bg-white min-h-screen">
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      {widgetElements}
    </div>
  )
})
