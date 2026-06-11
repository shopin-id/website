import { createRoute } from 'honox/factory'
import { generateId } from '../../../utils/admin_utils'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const formData = await c.req.formData()
  const walletId = formData.get('wallet_id') as string
  
  // Tangkap nilai Debet dan Kredit (Pasti positif karena di HTML kita set min="0")
  const debetStr = formData.get('debet') as string
  const kreditStr = formData.get('kredit') as string
  const notes = formData.get('notes') as string || 'Penyesuaian saldo manual oleh Admin'

  const debet = parseInt(debetStr || '0', 10)
  const kredit = parseInt(kreditStr || '0', 10)

  // LOGIKA AKUNTANSI: Kredit menambah saldo, Debet mengurangi saldo.
  const netAmount = kredit - debet

  // Cegah eksekusi jika admin menekan tombol tapi kolom kosong/0 semua
  if (netAmount === 0) {
     return c.redirect('/admin/finance?err=zero')
  }

  const trxId = 'TRX-' + generateId().substring(0, 8).toUpperCase()
  const txType = netAmount > 0 ? 'bonus' : 'adjustment'
  const txDesc = netAmount > 0 ? 'Suntik Saldo (Kredit)' : 'Potongan Saldo (Debet)'

  try {
    await db.batch([
      // 1. Sesuaikan saldo utama vendor
      db.prepare(`
        UPDATE vendor_wallets 
        SET available_balance = available_balance + ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(netAmount, walletId),
      
      // 2. Catat ke riwayat transaksi agar Seller tahu ada mutasi dari Admin
      db.prepare(`
        INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, status, notes)
        VALUES (?, ?, ?, ?, ?, 'approved', ?)
      `).bind(trxId, walletId, netAmount, txDesc, notes)
    ])

    return c.redirect('/admin/finance?success=injected')
  } catch (err) {
    console.error("Gagal menyesuaikan saldo:", err)
    return c.redirect('/admin/finance?err=1')
  }
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const success = c.req.query('success')
  const err = c.req.query('err')
  
  const { results: wallets } = await db.prepare(`
    SELECT w.id, w.pending_balance, w.available_balance, w.updated_at, s.name as store_name
    FROM vendor_wallets w
    JOIN stores s ON w.store_id = s.id
    ORDER BY w.available_balance DESC
  `).all()

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-1 uppercase tracking-tight">Keuangan & Saldo Vendor</h2>
      <p className="text-sm text-gray-500 mb-6">Kelola dan sesuaikan (Debet/Kredit) saldo vendor secara manual.</p>

      {success === 'injected' && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-sm mb-6 shadow-sm flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <p className="text-sm text-green-700 font-bold">Saldo dompet vendor berhasil disesuaikan dan tercatat di riwayat transaksi!</p>
        </div>
      )}

      {err === 'zero' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm mb-6 shadow-sm flex items-center">
          <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-sm text-amber-700 font-bold">Gagal: Anda harus mengisi salah satu kolom Debet atau Kredit dengan angka lebih dari 0.</p>
        </div>
      )}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-800 border-y border-gray-700 text-[10px] uppercase tracking-wider text-gray-200">
              <th className="p-4 font-bold">Boutique (Vendor)</th>
              <th className="p-4 font-bold text-right">Saldo Tersedia</th>
              <th className="p-4 font-bold text-center">Panel Penyesuaian Saldo (Debet/Kredit)</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
            {wallets.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-gray-400 font-medium text-xs">Belum ada dompet vendor terdaftar.</td></tr>
            )}
            {wallets.map((w: any) => (
              <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-gray-900 block">{w.store_name}</span>
                  <span className="text-[10px] font-mono text-gray-400 mt-1 block">ID: {w.id.split('-')[1]}</span>
                </td>
                
                <td className="p-4 font-black text-green-600 text-right text-lg">
                  Rp {(w.available_balance as number).toLocaleString('id-ID')}
                </td>
                
                <td className="p-4">
                  {/* FORM PENYESUAIAN AKUNTANSI */}
                  <form action="/admin/finance" method="POST" className="flex flex-col space-y-2 w-full max-w-sm ml-auto bg-gray-50/50 p-3 rounded-sm border border-gray-200">
                    <input type="hidden" name="wallet_id" value={w.id} />
                    
                    <div className="flex space-x-3">
                      {/* KOLOM DEBET (PENGURANGAN) */}
                      <div className="flex-1">
                        <label className="block text-[9px] font-bold text-rose-600 uppercase tracking-widest mb-1 pl-1">(-) Debet / Potong</label>
                        <input 
                          type="number" 
                          min="0" 
                          name="debet" 
                          placeholder="0" 
                          className="w-full border border-rose-200 px-3 py-2 rounded-sm text-xs focus:ring-rose-500 focus:border-rose-500 bg-rose-50 text-rose-700 font-black placeholder-rose-300 transition-colors" 
                        />
                      </div>
                      
                      {/* KOLOM KREDIT (PENAMBAHAN) */}
                      <div className="flex-1">
                        <label className="block text-[9px] font-bold text-teal-600 uppercase tracking-widest mb-1 pl-1">(+) Kredit / Suntik</label>
                        <input 
                          type="number" 
                          min="0" 
                          name="kredit" 
                          placeholder="0" 
                          className="w-full border border-teal-200 px-3 py-2 rounded-sm text-xs focus:ring-teal-500 focus:border-teal-500 bg-teal-50 text-teal-700 font-black placeholder-teal-300 transition-colors" 
                        />
                      </div>
                    </div>
                    
                    {/* KOLOM CATATAN (MUTLAK UNTUK LOG) */}
                    <div>
                      <input 
                        type="text" 
                        name="notes" 
                        placeholder="Catatan mutasi untuk Seller..." 
                        className="w-full border border-gray-300 px-3 py-2 rounded-sm text-[11px] focus:ring-black focus:border-black font-medium text-gray-700 transition-colors" 
                        required
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="w-full bg-black text-white px-3 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-sm" 
                      onclick="return confirm('PERINGATAN! Anda akan mengubah saldo dan mutasi ini akan tercatat selamanya di riwayat penjual. Lanjutkan?')"
                    >
                      Eksekusi Penyesuaian
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { title: 'Keuangan Vendor | Admin' }
  )
})
