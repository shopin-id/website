import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  // Melakukan kueri kalkulasi paralel (Batch Performance)
  const stats = await db.batch([
    db.prepare("SELECT SUM(amount) as total FROM wallet_transactions WHERE type = 'escrow_release'"),
    db.prepare("SELECT SUM(amount) as total FROM wallet_transactions WHERE type = 'withdrawal'"),
    db.prepare("SELECT SUM(amount) as total FROM wallet_transactions WHERE type = 'bonus'"),
    db.prepare("SELECT SUM(amount) as total FROM wallet_transactions WHERE type = 'bonus_withdrawal'"),
    
    // RUMUS 1: Total Pendaftaran (Mengakumulasi harga pendaftaran dari tingkat membership tiap toko)
    db.prepare("SELECT SUM(ml.price) as total FROM stores s JOIN membership_levels ml ON s.level_id = ml.id"),
    // RUMUS 2: Total Biaya Administrasi dari pesanan (orders) yang sukses/paid
    db.prepare("SELECT SUM(admin_fee) as total FROM orders WHERE status = 'paid'")
  ])

  const totalDeposit = stats[0].results[0]?.total || 0
  const totalWithdrawal = stats[1].results[0]?.total || 0
  const totalBonusDeposit = stats[2].results[0]?.total || 0
  const totalBonusWithdrawal = stats[3].results[0]?.total || 0
  
  const totalPendaftaran = stats[4].results[0]?.total || 0
  const totalAdminFeeOrder = stats[5].results[0]?.total || 0

  // RUMUS AKUNTANSI KEUNTUNGAN BERSIH PLATFORM MARKETPLACE
  const totalKeuntungan = (totalPendaftaran as number + totalAdminFeeOrder as number) - (totalBonusDeposit as number)

  const MoneyIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  // PERBAIKAN: Harus menggunakan return c.render(...)
  return c.render(
    <div className="bg-transparent min-h-screen pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Neraca perputaran kas, performa penjualan vendor, dan profitabilitas platform.</p>
      </div>

      {/* BLOK BARU: RINGKASAN REVENUE & PROFIT UTAMA PLATFORM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
         <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 rounded-sm shadow-sm text-white flex items-center justify-between">
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Total Keuntungan Bersih Platform</p>
               <h3 className="text-3xl font-black">Rp {(totalKeuntungan as number).toLocaleString('id-ID')}</h3>
               <p className="text-[10px] opacity-70 mt-3">Kalkulasi: (Pendaftaran + Fee Transaksi) - Bonus Anggota</p>
            </div>
            <div className="p-4 bg-white/10 rounded-full text-white"><MoneyIcon /></div>
         </div>
         <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Omset Biaya Pendaftaran</p>
               <h3 className="text-3xl font-black text-gray-900">Rp {(totalPendaftaran as number).toLocaleString('id-ID')}</h3>
               <p className="text-[10px] text-gray-400 mt-3">Seluruh dana masuk dari upgrade keanggotaan seller.</p>
            </div>
            <div className="p-4 bg-gray-50 border text-gray-400 rounded-full"><MoneyIcon /></div>
         </div>
      </div>

      {/* GRID 4 KARTU STATISTIK FINANSIAL VENDOR */}
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Statistik Keuangan Dompet Anggota</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200 flex items-center space-x-4">
           <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><MoneyIcon /></div>
           <div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Deposit</span>
             <span className="text-lg font-black text-gray-900">Rp {(totalDeposit as number).toLocaleString('id-ID')}</span>
           </div>
        </div>
        <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200 flex items-center space-x-4">
           <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0"><MoneyIcon /></div>
           <div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Penarikan</span>
             <span className="text-lg font-black text-gray-900">Rp {(totalWithdrawal as number).toLocaleString('id-ID')}</span>
           </div>
        </div>
        <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200 flex items-center space-x-4">
           <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0"><MoneyIcon /></div>
           <div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Bonus Deposit</span>
             <span className="text-lg font-black text-gray-900">Rp {(totalBonusDeposit as number).toLocaleString('id-ID')}</span>
           </div>
        </div>
        <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200 flex items-center space-x-4">
           <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0"><MoneyIcon /></div>
           <div>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Bonus Penarikan</span>
             <span className="text-lg font-black text-gray-900">Rp {(totalBonusWithdrawal as number).toLocaleString('id-ID')}</span>
           </div>
        </div>
      </div>
    </div>
  )
})
