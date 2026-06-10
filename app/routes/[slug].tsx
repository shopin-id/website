import { createRoute } from 'honox/factory';

export default createRoute(async (c, next) => {
  const slug = c.req.param('slug');
  const db = c.env.DB;

  const reserved = ['products', 'checkout', 'admin', 'api', 'categories', 'cart', 'login', 'media', 'search', 'account'];
  if (reserved.includes(slug) || slug.includes('.')) return await next();

  try {
    let siteTitle = 'Visoe Luxury';
    try {
      const storeSettingsRow: any = await db.prepare("SELECT config_json FROM store_settings WHERE id = 'GLOBAL'").first();
      if (storeSettingsRow && storeSettingsRow.config_json) {
        const parsedSettings = JSON.parse(storeSettingsRow.config_json);
        siteTitle = parsedSettings.store_name || parsedSettings.site_title || 'Visoe Luxury';
      }
    } catch (e) {}

    const page: any = await db.prepare("SELECT * FROM pages WHERE slug = ?").bind(slug).first();
    if (!page) return await next();

    const headerRow: any = await db.prepare("SELECT content_json FROM frontpage_widgets WHERE widget_type = 'header_widget' AND is_active = 1 ORDER BY id DESC LIMIT 1").first();
    const footerRow: any = await db.prepare("SELECT content_json FROM frontpage_widgets WHERE widget_type = 'footer_widget' AND is_active = 1 ORDER BY id DESC LIMIT 1").first();
    
    let headerData = headerRow ? JSON.parse(headerRow.content_json || '{}') : {};
    let footerData = footerRow ? JSON.parse(footerRow.content_json || '{}') : {};

    if (!headerData.menu || headerData.menu.length === 0) headerData.menu = [{ title: 'Shop', url: '/products', columns: [] }];
    if (!footerData.columns || footerData.columns.length === 0) footerData.columns = [{ title: 'Company', links: [{ name: 'About Us', url: '/about' }] }];

    const { results: widgets } = await db.prepare(
      "SELECT * FROM frontpage_widgets WHERE page_id = ? AND widget_type NOT IN ('header_widget', 'footer_widget') AND is_active = 1 ORDER BY display_order ASC"
    ).bind(page.id).all();

    const formatIDR = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p || 0);

    return c.html(
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{page.title} | {siteTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap');
            body { font-family: 'Inter', sans-serif; background: white; color: #1a1a1a; margin: 0; overflow-x: hidden; }
            .font-serif { font-family: 'Bodoni Moda', serif; }
            .mega-menu-transition { transition: all 0.3s ease-in-out; }
            .nav-link { position: relative; padding-bottom: 4px; }
            .nav-link::after { content: ''; position: absolute; width: 0; height: 1.5px; bottom: 0; left: 0; background-color: black; transition: width 0.3s ease; }
            .nav-link:hover::after { width: 100%; }
            .drawer-transform { transform: translateX(100%); transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
            .drawer-open { transform: translateX(0) !important; }
            .overlay-fade { opacity: 0; visibility: hidden; transition: all 0.5s ease; }
            .overlay-visible { opacity: 1 !important; visibility: visible !important; }
          `}} />
        </head>
        <body class="flex flex-col min-h-screen">
          {headerData.favicon && <link rel="icon" href={headerData.favicon} />}

          <header class="w-full bg-white z-[100] relative border-b border-neutral-100">
            <div class="w-full border-b border-neutral-50 py-2 hidden md:block">
              <div class="max-w-[1200px] mx-auto px-6 flex justify-end">
                <span class="text-[9px] tracking-[0.3em] text-neutral-400 uppercase">{headerData.top_bar_text || "Authentic Luxury Goods Only"}</span>
              </div>
            </div>

            <div class="max-w-[1200px] mx-auto px-6 py-6 hidden md:grid grid-cols-3 items-center">
              <form action="/products" method="GET" class="flex items-center gap-2 group w-fit">
                <button type="submit" class="p-1 cursor-pointer"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg></button>
                <input type="text" name="search" placeholder="SEARCH..." class="text-[10px] font-bold uppercase tracking-[0.2em] outline-none border-b border-transparent focus:border-black bg-transparent w-24 focus:w-40 transition-all placeholder-neutral-400 group-hover:placeholder-black" />
              </form>
              <div class="flex justify-center"><a href="/"><img src={headerData.logo_desktop || headerData.logo || '/logo.png'} style={{ width: headerData.logo_width_desktop || '200px' }} class="object-contain" alt={siteTitle} /></a></div>
              <div class="flex justify-end items-center gap-8">
                <a href="/login" class="flex items-center gap-2 group"><svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg><span class="text-[10px] font-bold uppercase tracking-[0.2em]">Sign In</span></a>
                <button id="cart-trigger-desktop" class="flex items-center gap-2 relative group"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2"><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/></svg><span class="cart-badge absolute -top-1 -right-2 bg-black text-white text-[7px] w-4 h-4 flex items-center justify-center rounded-full font-bold">0</span></button>
              </div>
            </div>

            <div class="w-full border-t border-neutral-50 hidden md:block">
              <div class="max-w-[1200px] mx-auto px-6 flex justify-center items-center h-12 gap-12 relative">
                {headerData.menu?.map((cat: any) => (
                  <div class="group h-full flex items-center">
                    <a href={cat.url} class="text-[10px] font-bold uppercase tracking-[0.2em] nav-link transition-colors hover:text-neutral-400 flex items-center gap-1 h-full">{cat.title}{cat.columns?.length > 0 && (<svg class="w-3 h-3 opacity-40 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>)}</a>
                    {cat.columns?.length > 0 && (
                      <div class="absolute left-0 top-full w-full bg-white border-b border-neutral-100 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible mega-menu-transition translate-y-2 group-hover:translate-y-0 z-[200]">
                        <div class="max-w-[1200px] mx-auto grid grid-cols-4 gap-12 p-12 text-left">
                          {cat.columns.map((col: any) => (
                            <div class="space-y-6"><h4 class="text-[9px] font-bold uppercase tracking-[0.4em] text-neutral-400 border-b border-neutral-50 pb-2">{col.heading}</h4><ul class="space-y-4">{col.links.map((lnk: any) => (<li><a href={lnk.url} class="text-[11px] uppercase tracking-widest hover:pl-2 transition-all block text-neutral-600 hover:text-black">{lnk.name}</a></li>))}</ul></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div class="md:hidden bg-white sticky top-0 z-[110] px-4 py-4 flex justify-between items-center relative border-b border-neutral-50">
              <button id="mobile-menu-open" class="p-1"><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg></button>
              <div class="absolute left-1/2 -translate-x-1/2"><a href="/"><img src={headerData.logo_mobile || headerData.logo || '/logo.png'} style={{ width: headerData.logo_width_mobile || '45px' }} class="object-contain" alt={siteTitle} /></a></div>
              <button id="cart-trigger-mobile" class="relative"><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2"><path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/></svg><span class="cart-badge absolute top-0 -right-2 bg-black text-white text-[7px] w-4 h-4 flex items-center justify-center rounded-full font-bold">0</span></button>
            </div>

            <div id="cart-overlay" class="fixed inset-0 bg-black/40 z-[300] overlay-fade">
              <div id="cart-drawer" class="absolute right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl drawer-transform flex flex-col">
                <div class="p-6 border-b flex justify-between items-center"><span class="text-[10px] font-bold uppercase tracking-[0.3em]">Shopping Bag (<span class="cart-badge">0</span>)</span><button id="cart-close" class="p-2 uppercase text-[9px] font-bold tracking-widest opacity-40 hover:opacity-100 transition-opacity">Close</button></div>
                <div id="cart-empty-state" class="flex-1 overflow-y-auto p-12 flex flex-col items-center justify-center text-center"><svg class="w-16 h-16 opacity-5 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-width="1"/></svg><p class="text-[11px] uppercase tracking-[0.2em] opacity-30">Your bag is currently empty.</p><button id="cart-close-empty" class="mt-8 border border-black px-10 py-4 text-[9px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">Start Shopping</button></div>
                <div id="cart-items-list" class="flex-1 overflow-y-auto p-6 hidden"></div>
                <div class="p-8 border-t bg-neutral-50 space-y-6"><div class="flex justify-between text-[11px] font-bold uppercase tracking-widest"><span>Subtotal</span><span id="cart-subtotal">Rp 0</span></div><button id="cart-checkout-btn" class="w-full bg-black text-white py-5 text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 cursor-not-allowed transition-all">Proceed to Checkout</button></div>
              </div>
            </div>

            <div id="mobile-menu-overlay" class="fixed inset-0 bg-black/40 z-[250] overlay-fade">
              <div id="mobile-menu-drawer" class="absolute left-0 top-0 h-full w-[85%] bg-white shadow-2xl translate-x-[-100%] transition-transform duration-500 flex flex-col">
                <div class="p-6 border-b flex justify-between items-center"><span class="text-[10px] font-bold uppercase tracking-widest">Navigation</span><button id="mobile-menu-close" class="p-2 uppercase text-[9px] font-bold tracking-widest opacity-40">Close</button></div>
                <div class="flex-1 overflow-y-auto px-8 py-12 space-y-10">
                  <form action="/products" method="GET" class="flex items-center gap-2 border-b border-neutral-100 pb-2"><input type="text" name="search" placeholder="SEARCH..." class="w-full text-[10px] font-bold uppercase tracking-[0.2em] outline-none bg-transparent" /><button type="submit"><svg class="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg></button></form>
                  {headerData.menu?.map((cat: any) => (<div class="space-y-4"><a href={cat.url} class="text-xl font-serif italic uppercase tracking-widest block border-b border-neutral-50 pb-2">{cat.title}</a></div>))}
                </div>
              </div>
            </div>
          </header>

          <main class="flex-1 pb-24">
            {await Promise.all(widgets.map(async (widget) => {
              let data: any = {};
              try { data = JSON.parse(widget.content_json || '{}'); } catch(e) { data = {}; }

              if (widget.widget_type === 'hero_slider') {
                return (
                  <div class="max-w-[1200px] mx-auto px-4 md:px-6 mt-6 md:mt-10">
                    <div class="swiper hero-slider h-[250px] md:h-[450px] overflow-hidden relative shadow-sm">
                      <div class="swiper-wrapper">{data.slides?.map((s: any) => (<div class="swiper-slide relative"><img src={s.image} class="w-full h-full object-cover" loading="lazy" /><div class="absolute inset-0 bg-black/5"></div><a href={s.link || '#'} class="absolute inset-0"></a></div>))}</div>
                      <div class="swiper-pagination"></div>
                    </div>
                  </div>
                );
              }
              if (widget.widget_type === 'custom_title' || widget.widget_type === 'custom_paragraph') {
                const Tag = widget.widget_type === 'custom_title' ? 'h2' : 'p';
                const styleClass = widget.widget_type === 'custom_title' ? `${data.font_size || 'text-3xl md:text-4xl'} font-serif italic uppercase tracking-[0.2em] mt-20` : `${data.font_size || 'text-sm md:text-base'} leading-relaxed font-light mt-10`;
                return (<div class="max-w-[1200px] mx-auto px-4 md:px-6" style={{ textAlign: data.align || 'center' }}><Tag class={styleClass} style={{ color: data.text_color }}>{data.text}</Tag></div>);
              }
              return null;
            }))}
          </main>

          <footer class="w-full bg-neutral-50 border-t border-neutral-100 py-24 px-6 mt-auto">
            <div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-20 text-left">
              <div class="space-y-8">
                <h4 class="text-2xl font-serif italic uppercase tracking-widest">{siteTitle}</h4>
                <p class="text-[11px] opacity-40 leading-relaxed uppercase tracking-[0.2em]">Exclusively Curated Authentic Luxury.</p>
              </div>
              {footerData.columns?.map((col: any) => (
                <div class="space-y-8">
                  <h5 class="text-[9px] font-bold uppercase tracking-[0.4em] opacity-30">{col.title}</h5>
                  <ul class="space-y-5">{col.links?.map((lnk: any) => (<li><a href={lnk.url} class="text-[11px] uppercase tracking-[0.1em] hover:pl-2 transition-all block opacity-70">{lnk.name}</a></li>))}</ul>
                </div>
              ))}
            </div>
            <div class="max-w-[1200px] mx-auto mt-24 pt-12 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-6">
               <span class="text-[9px] font-bold uppercase tracking-widest opacity-30">&copy; {new Date().getFullYear()} {siteTitle}.</span>
               <div class="flex gap-8 text-[9px] font-bold uppercase tracking-widest opacity-30"><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div>
            </div>
          </footer>

          <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
          <script dangerouslySetInnerHTML={{ __html: `
            const formatIDR = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

            window.updateCartUI = () => {
              const cart = JSON.parse(localStorage.getItem('premium_cart')) || [];
              const count = cart.reduce((sum, item) => sum + item.quantity, 0);
              document.querySelectorAll('.cart-badge').forEach(el => el.textContent = count);
              const emptyState = document.getElementById('cart-empty-state');
              const itemsContainer = document.getElementById('cart-items-list');
              const subtotalEl = document.getElementById('cart-subtotal');
              const checkoutBtn = document.getElementById('cart-checkout-btn');

              if (cart.length === 0) {
                if (emptyState) emptyState.style.display = 'flex';
                if (itemsContainer) itemsContainer.style.display = 'none';
                if (subtotalEl) subtotalEl.textContent = 'Rp 0';
                if (checkoutBtn) { checkoutBtn.classList.add('opacity-30', 'cursor-not-allowed'); checkoutBtn.onclick = (e) => e.preventDefault(); }
              } else {
                if (emptyState) emptyState.style.display = 'none';
                let total = 0; let html = '';
                cart.forEach((item, idx) => {
                  total += item.price * item.quantity;
                  html += \`
                    <div class="flex items-center gap-4 border-b border-neutral-100 py-4">
                      <img src="\${item.image}" class="w-16 h-20 object-cover border border-neutral-50" />
                      <div class="flex-1 space-y-1">
                        <h4 class="text-[10px] font-bold uppercase tracking-widest line-clamp-1">\${item.name}</h4>
                        <p class="text-[9px] uppercase tracking-widest text-neutral-400">\${item.brand}</p>
                        <div class="flex items-center gap-3 mt-2">
                          <button onclick="window.updateQty(\${idx}, -1)" class="p-1 hover:text-neutral-400 transition">-</button>
                          <span class="text-[10px]">\${item.quantity}</span>
                          <button onclick="window.updateQty(\${idx}, 1)" class="p-1 hover:text-neutral-400 transition">+</button>
                        </div>
                      </div>
                      <div class="text-[10px] font-bold tracking-widest">\${formatIDR(item.price * item.quantity)}</div>
                      <button onclick="window.removeCartItem(\${idx})" class="p-2 text-neutral-300 hover:text-red-500 transition">×</button>
                    </div>
                  \`;
                });
                if (itemsContainer) { itemsContainer.innerHTML = html; itemsContainer.style.display = 'block'; }
                if (subtotalEl) subtotalEl.textContent = formatIDR(total);
                if (checkoutBtn) { checkoutBtn.classList.remove('opacity-30', 'cursor-not-allowed'); checkoutBtn.onclick = () => window.location.href = '/checkout'; }
              }
            };

            window.updateQty = (idx, delta) => {
              let cart = JSON.parse(localStorage.getItem('premium_cart')) || [];
              if(cart[idx]) { cart[idx].quantity += delta; if(cart[idx].quantity <= 0) cart.splice(idx, 1); localStorage.setItem('premium_cart', JSON.stringify(cart)); window.updateCartUI(); }
            };

            window.removeCartItem = (idx) => {
              let cart = JSON.parse(localStorage.getItem('premium_cart')) || []; cart.splice(idx, 1); localStorage.setItem('premium_cart', JSON.stringify(cart)); window.updateCartUI();
            };

            document.addEventListener('DOMContentLoaded', () => {
              if(document.querySelector('.hero-slider')) new Swiper('.hero-slider', { loop: true, autoplay: { delay: 6000 }, pagination: { el: '.swiper-pagination', clickable: true }, effect: 'fade' });
              window.updateCartUI();
              const q = (s) => document.querySelector(s);
              const openCart = () => { q('#cart-overlay').classList.add('overlay-visible'); q('#cart-drawer').classList.add('drawer-open'); document.body.style.overflow = 'hidden'; };
              const closeCart = () => { q('#cart-overlay').classList.remove('overlay-visible'); q('#cart-drawer').classList.remove('drawer-open'); document.body.style.overflow = 'auto'; };
              if(q('#cart-trigger-desktop')) q('#cart-trigger-desktop').onclick = openCart;
              if(q('#cart-trigger-mobile')) q('#cart-trigger-mobile').onclick = openCart;
              if(q('#cart-close')) q('#cart-close').onclick = closeCart;
              if(q('#cart-close-empty')) q('#cart-close-empty').onclick = closeCart;
              if(q('#cart-overlay')) q('#cart-overlay').onclick = (e) => { if(e.target === q('#cart-overlay')) closeCart(); };
              
              const menuOverlay = q('#mobile-menu-overlay');
              const menuDrawer = q('#mobile-menu-drawer');
              const openMenu = () => { menuOverlay.classList.add('overlay-visible'); menuDrawer.classList.add('drawer-open'); document.body.style.overflow = 'hidden'; };
              const closeMenu = () => { menuOverlay.classList.remove('overlay-visible'); menuDrawer.classList.remove('drawer-open'); document.body.style.overflow = 'auto'; };
              
              if(q('#mobile-menu-open')) q('#mobile-menu-open').onclick = openMenu;
              if(q('#mobile-menu-close')) q('#mobile-menu-close').onclick = closeMenu;
              if(menuOverlay) menuOverlay.onclick = (e) => { if(e.target === menuOverlay) closeMenu(); };
            });
          `}} />
        </body>
      </html>
    );
  } catch (err: any) { 
    return c.text("System Error: " + err.message, 500); 
  }
});