import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>{title ? `${title} | Seller Center ShopinId` : 'Seller Center - ShopinId'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-[#f4f7fc] font-sans text-gray-900 antialiased">
        <div className="flex min-h-screen flex-col md:flex-row">
          
          {/* MOBILE HEADER (Atas) */}
          <div className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-40">
            <h2 className="text-base font-black tracking-widest uppercase">Seller Area</h2>
            <a href="/" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-200 px-3 py-1.5 rounded-sm">
              Ke Mall
            </a>
          </div>

          {/* SIDEBAR SELLER (Desktop Kiri) */}
          <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block sticky top-0 h-screen overflow-y-auto z-40">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-black tracking-widest uppercase">Seller Area</h2>
            </div>
            <nav className="p-4 space-y-1">
              <a href="/seller" className="block py-3 px-4 rounded-sm text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors">Dasbor Utama</a>
              <a href="/seller/products" className="block py-3 px-4 rounded-sm text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors">Produk Saya</a>
              <a href="/seller/orders" className="block py-3 px-4 rounded-sm text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors">Pesanan Masuk</a>
              <a href="/seller/wallet" className="block py-3 px-4 rounded-sm text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors">Dompet Vendor</a>
              <a href="/seller/settings" className="block py-3 px-4 rounded-sm text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-50 hover:text-black transition-colors">Pengaturan Toko</a>
              
              <div className="pt-6 mt-6 border-t border-gray-100">
                 <a href="/" className="block py-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-black">← Kembali ke Mall</a>
              </div>
            </nav>
          </aside>

          {/* KONTEN HALAMAN SELLER (Beri padding bottom di mobile agar tidak tertutup sticky nav) */}
          <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
            {children}
          </main>
          
          {/* MOBILE BOTTOM NAV (Sticky Bawah khusus HP) */}
          <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 flex justify-around items-center py-2 px-1 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <a href="/seller" className="flex flex-col items-center p-2 text-gray-500 hover:text-black">
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[9px] font-bold uppercase">Dasbor</span>
            </a>
            <a href="/seller/products" className="flex flex-col items-center p-2 text-gray-500 hover:text-black">
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="text-[9px] font-bold uppercase">Produk</span>
            </a>
            <a href="/seller/orders" className="flex flex-col items-center p-2 text-gray-500 hover:text-black relative">
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              <span className="text-[9px] font-bold uppercase">Pesanan</span>
            </a>
            <a href="/seller/wallet" className="flex flex-col items-center p-2 text-gray-500 hover:text-black">
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              <span className="text-[9px] font-bold uppercase">Dompet</span>
            </a>
            <a href="/seller/settings" className="flex flex-col items-center p-2 text-gray-500 hover:text-black">
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-[9px] font-bold uppercase">Toko</span>
            </a>
          </nav>
          
        </div>
      </body>
    </html>
  )
})
