import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  
  // 1. Validasi Keamanan Pengguna
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  // 2. Ambil data Toko beserta informasi detail Level Membership-nya
  const store = await db.prepare(`
    SELECT s.*, ml.level_name, ml.product_limit 
    FROM stores s
    LEFT JOIN membership_levels ml ON s.level_id = ml.id
    WHERE s.user_id = ?
  `).bind(user.id).first()

  // Jika user belum punya toko (kasus akun lama sebelum otomatisasi), paksa buat atau arahkan
  if (!store) return c.redirect('/register')

  // 3. Hitung jumlah produk yang sudah diunggah oleh toko ini saat ini
  const productCountRow = await db.prepare("SELECT COUNT(*) as count FROM products WHERE store_id = ?").bind(store.id).first()
  const currentProductCount = (productCountRow?.count as number) || 0
  const maxProductLimit = (store.product_limit as number) || 50 // Default backup 50 jika null

  // 4. Ambil saldo dompet vendor saat ini untuk dipajang di dasbor
  const wallet = await db.prepare("SELECT available_balance FROM vendor_wallets WHERE store_id = ?").bind(store.id).first()
  const balance = (wallet?.available_balance as number) || 0

  return c.render(
    <div className="bg-transparent min-h-screen pb-12">
      
      {/* HEADER DASBOR & PROFIL TOKO */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-xl font-black text-gray-400 uppercase border">
            {store.name.substring(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">{store.name}</h1>
            <div className="flex flex-wrap gap-2 items-center mt-1.5">
              <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-0.5 rounded-sm uppercase tracking-wider border">
                Level: {store.level_name || 'LVL1'}
              </span>
              <span className="text-gray-400 text-xs">|</span>
              <span className="text-xs text-gray-500 font-medium">Lokasi: {store.location || 'Belum Diatur'}</span>
            </div>
          </div>
        </div>

        {/* INDIKATOR KUOTA PRODUK & TOMBOL UPGRADE (Sesuai Referensi Video) */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-gray-50 p-4 border border-gray-200 rounded-sm">
           <div className="flex flex-col pr-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Batas Unggah Produk</span>
              <span className="text-sm font-black text-gray-900">
                 <strong className={currentProductCount >= maxProductLimit ? "text-red-600" : "text-green-600"}>{currentProductCount}</strong> / {maxProductLimit} <span className="text-xs font-normal text-gray-400">Produk</span>
              </span>
           </div>
           
           {/* Tombol Tingkatkan Level memicu instruksi upgrade */}
           <a href={`https://wa.me/${c.env.ADMIN_WHATSAPP || '6281234567890'}?text=${encodeURIComponent(`Halo Admin,\nSaya ingin mengajukan upgrade tingkatan Level untuk toko saya: *${store.name}* (${user.email}). Mohon infonya.`)}`} 
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-sm text-center shadow-sm transition-all active:scale-95">
              Tingkatkan Level
           </a>
        </div>
      </div>

      {/* KARTU STATISTIK FINANSIAL INTERNAL SELLER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
         <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 rounded-sm text-white shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Saldo Dompet Tersedia</span>
            <h3 className="text-2xl font-black text-green-400 tracking-tight">Rp {balance.toLocaleString('id-ID')}</h3>
            <p className="text-[10px] text-gray-400 mt-4 border-t border-neutral-700 pt-3">Dana siap ditarik ke rekening bank terdaftar.</p>
         </div>
         <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Menu Cepat</span>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <a href="/seller/products/new" className="bg-black text-white p-2.5 rounded-sm text-center text-xs font-bold uppercase tracking-wider hover:bg-gray-800">+ Produk</a>
                <a href="/seller/orders" className="bg-gray-100 text-gray-800 p-2.5 rounded-sm text-center text-xs font-bold uppercase tracking-wider hover:bg-gray-200">Pesanan</a>
              </div>
            </div>
         </div>
      </div>

      {/* NOTIFIKASI SELAMAT DATANG (OTOMATISASI REGISTER) */}
      {c.req.query('welcome') === '1' && (
         <div className="bg-green-50 border border-green-200 p-4 rounded-sm mb-6 animate-pulse">
            <p className="text-sm text-green-800 font-bold">🎉 Pendaftaran Berhasil! Toko Anda telah aktif secara otomatis pada tingkatan level dasar. Selamat berjualan!</p>
         </div>
      )}

      {/* AREA MONITORING ETALASE TOKO */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-3 mb-4">Pengumuman & Kebijakan Seller</h3>
         <p className="text-xs text-gray-500 leading-relaxed">Pastikan produk yang Anda unggah tidak melanggar ketentuan ShopinId. Setiap transaksi yang masuk wajib divalidasi dan dikirim sesuai waktu tenggat untuk menjaga performa skor ulasan bintang toko Anda.</p>
      </div>

    </div>,
    { title: 'Dasbor Seller Center' }
  )
})
