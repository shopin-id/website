import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first()
  if (!store) return c.redirect('/seller/register')

  // Ambil saldo dompet
  const wallet = await db.prepare("SELECT pending_balance, available_balance FROM vendor_wallets WHERE store_id = ?").bind(store.id).first()
  
  const pending = wallet ? (wallet.pending_balance as number) : 0;
  const available = wallet ? (wallet.available_balance as number) : 0;

  return c.render(
    <div className="w-full bg-[#f4f7fc] min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <div>
             <h1 className="text-2xl font-bold text-gray-900">Dompet & Saldo</h1>
             <p className="text-sm text-gray-500">Kelola penghasilan dari penjualan Anda.</p>
          </div>
          <a href="/seller" className="text-sm font-bold text-gray-500 hover:text-black">← Kembali ke Dasbor</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-gradient-to-r from-gray-900 to-black p-8 rounded-sm shadow-md text-white relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Saldo Bisa Ditarik</p>
                <h2 className="text-4xl font-black mb-6">Rp {available.toLocaleString('id-ID')}</h2>
                <button className="bg-white text-black px-6 py-2.5 rounded-sm font-bold text-sm uppercase tracking-wide hover:bg-gray-100 transition-colors">
                   Tarik Dana
                </button>
             </div>
             {/* Ornamen Latar */}
             <div className="absolute -right-10 -bottom-10 opacity-10">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
             </div>
           </div>

           <div className="bg-white p-8 border border-gray-200 rounded-sm shadow-sm flex flex-col justify-center">
             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Dana Tertahan (Pending Escrow)</p>
             <h3 className="text-3xl font-black text-gray-900 mb-2">Rp {pending.toLocaleString('id-ID')}</h3>
             <p className="text-sm text-gray-500">Dana ini masih ditahan karena pesanan belum diselesaikan atau dikonfirmasi oleh pembeli.</p>
           </div>
        </div>

      </div>
    </div>
  )
})
