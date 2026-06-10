import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>{title ? `${title} | ShopinId` : 'ShopinId - Belanja Barang Mewah Autentik'}</title>
        
        {/* Tailwind CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}} />
      </head>
      {/* pb-24 pada mobile memastikan konten terbawah dapat di-scroll penuh tanpa tertutup sticky menu */}
      <body className="bg-[#f4f7fc] min-h-screen flex flex-col font-sans text-gray-800 pb-24 md:pb-0 relative antialiased">
        
        {/* === TOPBAR === */}
        <div className="bg-[#f8f8f8] w-full border-b border-gray-200 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-8 text-[11px] md:text-xs text-gray-500">
            <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-800">
              <span className="text-red-600 font-bold">ID</span>
              <span>Bahasa Indonesia</span>
            </div>
            <div className="flex space-x-4 font-medium">
              <a href="/login" className="hover:text-black">Masuk</a>
              <a href="/register" className="hover:text-black">Daftar</a>
            </div>
          </div>
        </div>

        {/* === HEADER UTAMA & NAVIGASI === */}
        <header className="bg-black w-full text-white sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between">
            
            {/* Logo */}
            <div className="flex justify-between items-center w-full md:w-auto mb-4 md:mb-0">
              <a href="/" className="flex-shrink-0 text-2xl font-black tracking-tighter md:mr-10">
                SHOPIN<span className="text-red-600">ID</span>
              </a>
            </div>

            {/* Menu Navigasi Kategori (Desktop) DENGAN DROPDOWN SESUAI SCREENSHOT */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold mr-6 flex-shrink-0 h-full">
              
              {/* Dropdown Kategori Induk */}
              <div className="relative group py-2">
                <button className="flex items-center hover:text-gray-300 transition-colors focus:outline-none cursor-pointer pb-1">
                  Kategori
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Kotak Dropdown (Muncul saat Hover) */}
                <div className="absolute top-[100%] left-0 w-72 bg-white text-gray-800 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110] flex flex-col rounded-b-sm overflow-hidden">
                  
                  {/* Header Hitam Kategori | See All */}
                  <div className="bg-black text-white px-5 py-3 flex justify-between items-center border-t border-gray-800">
                    <span className="font-bold text-[15px]">Kategori</span>
                    <a href="/categories" className="text-xs text-gray-300 hover:text-white transition-colors">See All &gt;</a>
                  </div>
                  
                  {/* Daftar 10 Kategori Induk Ber-child (Sesuai Data HTML Anda) */}
                  <ul className="py-2 flex flex-col text-[13px] font-normal">
                    <li><a href="/products?category=snack-dessert" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Snack Dessert</a></li>
                    <li><a href="/products?category=recreational-fishing-gear" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Recreational Fishing Gear</a></li>
                    <li><a href="/products?category=phones-accessories" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Phones & Accessories</a></li>
                    <li><a href="/products?category=epidemic-prevention-supplies" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Epidemic Prevention Supplies</a></li>
                    <li><a href="/products?category=office-stationery" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Office Stationery</a></li>
                    <li><a href="/products?category=computer-peripherals" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Computer Peripherals</a></li>
                    <li><a href="/products?category=digital-products" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Digital Products</a></li>
                    <li><a href="/products?category=sports-outdoors" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Sports & Outdoors</a></li>
                    <li><a href="/products?category=home-appliances" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Home Appliances</a></li>
                    <li><a href="/products?category=health-beauty-hair" className="block px-5 py-2.5 hover:text-red-600 hover:bg-gray-50 transition-colors">Health Beauty & Hair</a></li>
                  </ul>
                </div>
              </div>
              
              <a href="/products" className="hover:text-gray-300 transition-colors">Semua Produk</a>
            </nav>
            
            {/* Bar Pencarian (Desktop) DENGAN LIVE AJAX DROPDOWN */}
            <div className="flex-grow max-w-xl relative hidden md:block group">
              <form action="/products" method="GET">
                <input 
                  type="text" 
                  name="q"
                  id="search-desktop"
                  autoComplete="off"
                  placeholder="Saya Mencari..." 
                  className="w-full rounded-sm py-2 px-4 text-black text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button type="submit" className="absolute right-3 top-2 text-gray-500 hover:text-black">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </form>
              {/* Dropdown Live Search Desktop */}
              <div id="results-desktop" className="absolute top-full mt-1 left-0 w-full bg-white rounded-sm shadow-2xl border border-gray-200 z-[100] hidden max-h-96 overflow-y-auto custom-scrollbar text-black divide-y divide-gray-100">
                {/* Hasil AJAX akan disuntikkan ke sini */}
              </div>
            </div>

            {/* Ikon Aksi Kanan (Desktop) */}
            <div className="flex items-center space-x-6 ml-8 hidden md:flex text-sm font-medium">
              <a href="/account" className="flex items-center hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Akun Saya
              </a>
              <a href="/checkout" className="flex items-center hover:text-gray-300 transition-colors bg-white/10 px-3 py-1.5 rounded-sm">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Keranjang
              </a>
            </div>
          </div>

          {/* Bar Pencarian Mobile DENGAN LIVE AJAX DROPDOWN */}
          <div className="md:hidden w-full px-4 pb-4 relative">
            <form action="/products" method="GET" className="relative">
              <input 
                type="text" 
                name="q"
                id="search-mobile"
                autoComplete="off"
                placeholder="Cari produk impian..." 
                className="w-full rounded-sm py-2.5 px-4 text-black text-sm focus:outline-none"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </form>
            {/* Dropdown Live Search Mobile */}
            <div id="results-mobile" className="absolute top-full mt-1 left-4 right-4 bg-white rounded-sm shadow-2xl border border-gray-200 z-[100] hidden max-h-80 overflow-y-auto custom-scrollbar text-black divide-y divide-gray-100">
              {/* Hasil AJAX akan disuntikkan ke sini */}
            </div>
          </div>
        </header>

        {/* === KONTEN HALAMAN === */}
        <main className="flex-grow w-full flex flex-col">
          {children}
        </main>

        {/* === FOOTER ASLI DIKEMBALIKAN UTUH === */}
        <footer className="bg-black text-white py-12 mt-auto w-full border-t-4 border-gray-900 mb-16 md:mb-0">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-black tracking-tighter mb-4">SHOPIN<span className="text-red-600">ID</span></div>
              <p className="text-xs text-gray-400 mb-6">Belanja cerdas, gaya tanpa batas. Solusi e-commerce terpercaya Anda.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Informasi Kontak</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong>Alamat:</strong><br/>
                Intiland Tower Jl.Raya Darmo No.88<br/>
                Surabaya, Jawa Timur 60226, Indonesia<br/><br/>
                <strong>Email:</strong> cs@shopinid.com
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Metode Pembayaran</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white h-8 rounded-sm text-black flex items-center justify-center text-[10px] font-bold">BCA</div>
                <div className="bg-white h-8 rounded-sm text-black flex items-center justify-center text-[10px] font-bold">MANDIRI</div>
                <div className="bg-white h-8 rounded-sm text-black flex items-center justify-center text-[10px] font-bold">BNI</div>
                <div className="bg-white h-8 rounded-sm text-black flex items-center justify-center text-[10px] font-bold">QRIS</div>
                <div className="bg-white h-8 rounded-sm text-black flex items-center justify-center text-[10px] font-bold">OVO</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Jelajahi</h4>
              <ul className="text-xs text-gray-400 space-y-2">
                <li><a href="/login" className="hover:text-white transition-colors">Masuk Akun</a></li>
                <li><a href="/register" className="hover:text-white transition-colors">Daftar Pengguna Baru</a></li>
                <li><a href="/account" className="hover:text-white transition-colors">Riwayat & Lacak Pesanan</a></li>
                <li><a href="/products" className="hover:text-white transition-colors">Katalog Produk</a></li>
              </ul>
            </div>
          </div>
        </footer>

        {/* === STICKY MOBILE BOTTOM NAVIGATION === */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-[9999] flex justify-between items-center px-6 py-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
          <a href="/" className="flex flex-col items-center text-gray-500 hover:text-black">
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-[10px] font-bold">Beranda</span>
          </a>
          <a href="/products" className="flex flex-col items-center text-gray-500 hover:text-black">
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            <span className="text-[10px] font-bold">Katalog</span>
          </a>
          
          <a href="/seller" className="flex flex-col items-center text-red-600">
            <div className="bg-red-50 p-3 rounded-full -mt-8 border border-red-100 shadow-md bg-white">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <span className="text-[10px] font-bold mt-1">Vendor</span>
          </a>
          
          <a href="/checkout" className="flex flex-col items-center text-gray-500 hover:text-black">
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="text-[10px] font-bold">Cart</span>
          </a>
          <a href="/account" className="flex flex-col items-center text-gray-500 hover:text-black">
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-bold">Akun</span>
          </a>
        </div>

        {/* === MESIN LIVE AJAX SEARCH === */}
        <script dangerouslySetInnerHTML={{__html: `
          function initLiveSearch(inputId, resultsId) {
            const input = document.getElementById(inputId);
            const resultsBox = document.getElementById(resultsId);
            if (!input || !resultsBox) return;

            let debounceTimer;

            input.addEventListener('input', function(e) {
              clearTimeout(debounceTimer);
              const query = e.target.value.trim();

              // Trigger minimal 3 digit
              if (query.length < 3) {
                resultsBox.classList.add('hidden');
                resultsBox.innerHTML = '';
                return;
              }

              // Loading state interaktif
              resultsBox.classList.remove('hidden');
              resultsBox.innerHTML = '<div class="p-4 text-xs font-bold text-center text-gray-400">Mencari...</div>';

              debounceTimer = setTimeout(async () => {
                try {
                  const res = await fetch('/api/search?q=' + encodeURIComponent(query));
                  if (!res.ok) throw new Error('API Error');
                  
                  const products = await res.json();

                  if (products && products.length > 0) {
                    let html = products.slice(0, 6).map(p => {
                      let images = []; 
                      try { images = JSON.parse(p.images_json || '[]') } catch(err){}
                      const mainImage = images[0] || '/placeholder.jpg';
                      const formattedPrice = new Intl.NumberFormat('id-ID').format(p.price || 0);
                      
                      return \`
                        <a href="/products/\${p.slug}" class="flex items-center p-3 hover:bg-gray-50 transition-colors">
                          <img src="\${mainImage}" class="w-10 h-10 object-cover rounded-sm border border-gray-100 flex-shrink-0" alt="\${p.name}">
                          <div class="ml-3 flex-grow overflow-hidden">
                            <h4 class="text-xs font-bold text-gray-900 truncate">\${p.name}</h4>
                            <p class="text-[10px] font-bold text-red-600 mt-0.5">Rp \${formattedPrice}</p>
                          </div>
                        </a>
                      \`;
                    }).join('');
                    
                    // Tombol lihat semua hasil
                    html += \`
                      <a href="/products?q=\${encodeURIComponent(query)}" class="block text-center p-3 text-[11px] font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 uppercase tracking-widest">
                        Lihat Semua Hasil Pencarian 
                      </a>
                    \`;
                    
                    resultsBox.innerHTML = html;
                  } else {
                    resultsBox.innerHTML = '<div class="p-6 text-xs text-center text-gray-500 font-medium">Produk tidak ditemukan. Coba kata kunci lain.</div>';
                  }
                } catch (error) {
                  resultsBox.innerHTML = '<div class="p-4 text-xs text-center text-red-500">Terjadi kesalahan. Silakan tekan Enter untuk mencari.</div>';
                }
              }, 400); // 400ms Debounce agar server D1 Anda tidak jebol
            });

            // Tutup dropdown jika user klik di luar area pencarian
            document.addEventListener('click', function(e) {
              if (!input.contains(e.target) && !resultsBox.contains(e.target)) {
                resultsBox.classList.add('hidden');
              }
            });
            
            // Tampilkan kembali jika user klik input dan sudah ada isinya
            input.addEventListener('focus', function(e) {
              if (e.target.value.trim().length >= 3) {
                resultsBox.classList.remove('hidden');
              }
            });
          }

          // Inisialisasi untuk Desktop dan Mobile
          initLiveSearch('search-desktop', 'results-desktop');
          initLiveSearch('search-mobile', 'results-mobile');
        `}} />

      </body>
    </html>
  )
})
