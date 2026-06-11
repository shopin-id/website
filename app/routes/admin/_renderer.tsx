import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }, c) => {
  // === LOGIKA PENGECUALIAN HALAMAN LOGIN ===
  const isLoginPage = c.req.path === '/admin/login' || c.req.path === '/admin/login/';

  // Jika ini halaman login, render desain polos tanpa sidebar
  if (isLoginPage) {
    return (
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <title>{title || 'Admin Login - ShopinId'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        {/* Latar belakang gelap khusus form login */}
        <body className="bg-gray-900 min-h-screen font-sans antialiased text-white">
          {children}
        </body>
      </html>
    )
  }

  // === JIKA BUKAN HALAMAN LOGIN, RENDER SIDEBAR LENGKAP ===
  return (
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>{title ? `${title} | Admin ShopinId` : 'Admin Dashboard - ShopinId'}</title>
        {/* Tailwind CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        <style dangerouslySetInnerHTML={{__html: `
          /* Sembunyikan default panah summary pada browser Safari/Chrome lama */
          details > summary::-webkit-details-marker { display: none; }
        `}} />
      </head>
      <body className="bg-gray-100 min-h-screen font-sans antialiased text-gray-900">
        
        <div className="flex h-screen overflow-hidden relative">

          {/* === BACKDROP OVERLAY (Khusus Mobile saat Sidebar Terbuka) === */}
          <div 
            id="sidebar-overlay" 
            className="fixed inset-0 bg-black/50 z-40 hidden transition-opacity duration-300 md:hidden"
            onClick="toggleSidebar()"
          ></div>
          
          {/* === SIDEBAR MENU ADMIN (RESPONSIVE DRAWER) === */}
          <aside 
            id="admin-sidebar" 
            className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-50 transform -translate-x-full transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:flex flex-shrink-0 h-full"
          >
            {/* Header Sidebar */}
            <div className="p-6 text-center border-b border-gray-800 flex items-center justify-between md:justify-center">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">SHOPIN<span className="text-red-500">ID</span></h1>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Marketplace Admin</p>
              </div>
              {/* Tombol Tutup Sidebar di Mobile */}
              <button 
                onClick="toggleSidebar()" 
                className="text-gray-400 hover:text-white md:hidden focus:outline-none"
                aria-label="Tutup Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Navigasi Link Menu */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
              
              <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Utama</p>
              <a href="/admin" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Dashboard Utama</a>
              
              {/* MENU PESANAN DENGAN DROPDOWN (Sesuai Screenshot 106) */}
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors list-none">
                  <span>Pesanan</span>
                  <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-1 pl-4 space-y-1 border-l border-gray-700 ml-6 py-2">
                  <a href="/admin/orders?status=pending" className="block pl-6 pr-4 py-2 rounded-md text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors relative before:content-[''] before:absolute before:left-2 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-teal-500 before:rounded-full">Tertunda</a>
                  <a href="/admin/orders?status=shipped" className="block pl-6 pr-4 py-2 rounded-md text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors relative before:content-[''] before:absolute before:left-2 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-teal-500 before:rounded-full">Sedang Dikirim</a>
                  <a href="/admin/orders?status=confirmed" className="block pl-6 pr-4 py-2 rounded-md text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors relative before:content-[''] before:absolute before:left-2 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-teal-500 before:rounded-full">Dikonfirmasi</a>
                  <a href="/admin/orders?status=cancelled" className="block pl-6 pr-4 py-2 rounded-md text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors relative before:content-[''] before:absolute before:left-2 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-teal-500 before:rounded-full">Dibatalkan</a>
                </div>
              </details>
              
              <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Manajemen Entitas</p>
              <a href="/admin/users" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Kelola Pengguna</a>
              {/* TRANSAKSI DAN LEDGER DITAMBAHKAN DI SINI */}
              <a href="/admin/transactions" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Transaksi & Ledger</a>
              <a href="/admin/stores" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Kelola Toko (Vendor)</a>
              <a href="/admin/finance" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Keuangan & Saldo</a>
              
              <a href="/admin/membership-levels" className="block px-4 py-2.5 rounded-md text-sm font-bold text-green-400 hover:bg-gray-800 hover:text-green-300 transition-colors">Level Membership</a>

              <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Katalog Global</p>
              <a href="/admin/products" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Daftar Produk</a>
              <a href="/admin/categories" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Kategori Produk</a>
              
              <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Tampilan & Sistem</p>
              <a href="/admin/page-builder" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Page Builder (Widget)</a>
              <a href="/admin/pages" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Halaman Statis</a>
              <a href="/admin/media" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Media Library</a>
              <a href="/admin/settings" className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">Pengaturan Platform</a>
              
            </nav>

            {/* Footer Sidebar */}
            <div className="p-4 border-t border-gray-800">
              <a href="/" target="_blank" className="block w-full text-center px-4 py-2 bg-gray-800 rounded text-sm font-bold text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                Lihat Website ↗
              </a>
            </div>
          </aside>

          {/* === KONTEN KANAN UTAMA === */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            
            {/* Top Header Navigation Bar */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center z-30 sticky top-0 flex-shrink-0">
              <div className="flex items-center space-x-3">
                {/* Hamburger Button (Hanya Muncul di Mobile) */}
                <button 
                  onClick="toggleSidebar()" 
                  className="text-gray-600 hover:text-black md:hidden focus:outline-none p-1"
                  aria-label="Buka Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">{title || 'Dashboard'}</h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100 hidden sm:inline-block">Super Admin</span>
                <form action="/logout" method="POST" className="m-0 p-0">
                  <button type="submit" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Keluar</button>
                </form>
              </div>
            </header>
            
            {/* Scrollable Main Content Space */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 custom-scrollbar">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </div>

          </main>

        </div>

        {/* === LOGIKA TOGGLE SIDEBAR JAVASCRIPT === */}
        <script dangerouslySetInnerHTML={{__html: `
          function toggleSidebar() {
            const sidebar = document.getElementById('admin-sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            
            if (sidebar.classList.contains('-translate-x-full')) {
              sidebar.classList.remove('-translate-x-full');
              overlay.classList.remove('hidden');
            } else {
              sidebar.classList.add('-translate-x-full');
              overlay.classList.add('hidden');
            }
          }
        `}} />

        {/* Styling Khusus Scrollbar Kustom */}
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
          #admin-sidebar .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; }
          #admin-sidebar .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #4b5563; }
        `}} />

      </body>
    </html>
  )
})
