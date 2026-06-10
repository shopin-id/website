import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.text('Unauthorized', 401)

  const formData = await c.req.formData()
  const action = formData.get('action') as string
  const txId = formData.get('transaction_id') as string

  if (action === 'approve') {
    // Setujui penarikan: Ubah status menjadi disetujui
    await db.prepare("UPDATE wallet_transactions SET status = 'approved' WHERE id = ?")
      .bind(txId).run()
  } 
  
  else if (action === 'reject') {
    // Tolak penarikan: Ambil data nominal saldo untuk dikembalikan (refund) ke dompet asal
    const tx = await db.prepare("SELECT wallet_id, amount FROM wallet_transactions WHERE id = ?")
      .bind(txId).first()

    if (tx) {
      const walletId = tx.wallet_id as string
      const amount = Math.abs(tx.amount as number) // Pastikan nilainya absolut positif untuk dikembalikan

      await db.batch([
        // 1. Ubah status mutasi menjadi ditolak
        db.prepare("UPDATE wallet_transactions SET status = 'rejected' WHERE id = ?").bind(txId),
        // 2. Kembalikan saldo ke dompet penjual
        db.prepare("UPDATE vendor_wallets SET available_balance = available_balance + ? WHERE id = ?").bind(amount, walletId)
      ])
    }
  }

  return c.redirect('/admin/transactions?success=1')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const success = c.req.query('success')

  // Defensif: Pastikan kolom status terbaca dengan aman
  try { await db.prepare("ALTER TABLE wallet_transactions ADD COLUMN status TEXT DEFAULT 'approved'").run() } catch(e) {}

  // Tarik data seluruh riwayat mutasi dari database gabung dengan identitas user pemilik dompet
  const { results: txs } = await db.prepare(`
    SELECT t.id as tx_id, t.type, t.amount, t.description, t.status, t.created_at,
           u.name as member_name, u.phone as member_phone, w.id as wallet_id
    FROM wallet_transactions t
    JOIN vendor_wallets w ON t.wallet_id = w.id
    JOIN stores s ON w.store_id = s.id
    JOIN users u ON s.user_id = u.id
    ORDER BY t.created_at DESC
  `).all()

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200">
      
      {/* HEADER PAGE */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Log Transaksi Finansial Platform</h2>
          <p className="text-sm text-gray-500 mt-0.5">Pantau mutasi uang masuk dan kelola persetujuan klaim dana pencairan uang keluar.</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 text-sm font-bold rounded-sm mb-6">
          ✓ Status pemrosesan transaksi penarikan dana berhasil diperbarui!
        </div>
      )}

      {/* TAMPILAN DATA TABEL MENIRU PERSIS SCREENSHOT 105 */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-gray-800 border-y border-gray-700 text-[11px] uppercase tracking-wider text-gray-200">
              <th className="p-3 text-center w-12 font-bold">#</th>
              <th className="p-3 font-bold">Nama Anggota</th>
              <th className="p-3 font-bold">Telepon</th>
              <th className="p-3 text-center font-bold">Slip</th>
              <th className="p-3 font-bold">Jumlah</th>
              <th className="p-3 font-bold">Promosi / Bonus</th>
              <th className="p-3 font-bold">Catatan</th>
              <th className="p-3 font-bold">Jenis</th>
              <th className="p-3 font-bold">Status</th>
              <th className="p-3 font-bold">Tanggal Dibuat</th>
              <th className="p-3 text-center font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
            {txs.length === 0 && (
              <tr><td colSpan={11} className="p-8 text-center text-gray-400 font-medium">Belum ada riwayat transaksi finansial yang tercatat.</td></tr>
            )}
            {txs.map((tx: any, idx: number) => {
              // Pilah jenis transaksi uang masuk / keluar
              const isUangKeluar = tx.type === 'withdrawal' || tx.type === 'bonus_withdrawal';
              const jenisTeks = isUangKeluar ? 'Uang Keluar' : 'Uang Masuk';
              
              // Map nominal rupiah mengikuti struktur kolom
              const nominalUtama = tx.type === 'bonus' ? 0 : tx.amount;
              const nominalBonus = tx.type === 'bonus' ? tx.amount : 0;

              // Ambil penanda status lokal indonesia
              let statusLabel = 'Disetujui';
              let statusClass = 'bg-teal-500 text-white';
              if (tx.status === 'pending') {
                statusLabel = 'Tertunda';
                statusClass = 'bg-amber-500 text-white';
              } else if (tx.status === 'rejected') {
                statusLabel = 'Ditolak';
                statusClass = 'bg-rose-500 text-white';
              }

              return (
                <tr key={tx.tx_id} className={`transition-colors ${isUangKeluar ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                  <td className="p-3 text-center font-medium text-gray-400">{idx + 1}</td>
                  <td className="p-3 font-bold text-gray-900">{tx.member_name}</td>
                  <td className="p-3 font-medium text-gray-600">{tx.member_phone || '-'}</td>
                  <td className="p-3 text-center text-gray-300 font-mono">-</td>
                  
                  {/* Kolom Jumlah */}
                  <td className={`p-3 font-bold text-sm ${nominalUtama < 0 ? 'text-rose-600' : nominalUtama > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {nominalUtama !== 0 ? `${nominalUtama.toLocaleString('id-ID')}.00 Rp` : '0.00 Rp'}
                  </td>
                  
                  {/* Kolom Promosi */}
                  <td className={`p-3 font-bold text-sm ${nominalBonus > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                    {nominalBonus !== 0 ? `${nominalBonus.toLocaleString('id-ID')}.00 Rp` : ''}
                  </td>
                  
                  <td className="p-3 text-gray-500 max-w-xs truncate" title={tx.description}>{tx.description || '-'}</td>
                  
                  {/* Kolom Jenis Badge */}
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider ${isUangKeluar ? 'bg-pink-500 text-white' : 'bg-teal-500 text-white'}`}>
                      {jenisTeks}
                    </span>
                  </td>
                  
                  {/* Kolom Status Badge */}
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>

                  <td className="p-3 text-gray-400 whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})} {new Date(tx.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                  </td>

                  {/* TOMBOL MANAJEMEN AKSI PERSETUJUAN */}
                  <td className="p-3 text-center whitespace-nowrap">
                    {tx.status === 'pending' ? (
                      <div className="flex items-center justify-center space-x-1">
                        <form action="/admin/transactions" method="POST" className="m-0">
                          <input type="hidden" name="action" value="approve" />
                          <input type="hidden" name="transaction_id" value={tx.tx_id} />
                          <button type="submit" className="bg-teal-500 text-white px-2 py-1 rounded-sm text-[10px] font-bold uppercase hover:bg-teal-600 transition-colors">
                            ✓ Setujui
                          </button>
                        </form>
                        <form action="/admin/transactions" method="POST" className="m-0">
                          <input type="hidden" name="action" value="reject" />
                          <input type="hidden" name="transaction_id" value={tx.tx_id} />
                          <button type="submit" className="bg-rose-600 text-white px-2 py-1 rounded-sm text-[10px] font-bold uppercase hover:bg-rose-700 transition-colors">
                            ✕ Tolak
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selesai</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
    </div>,
    { title: 'Transaksi Keuangan | Admin' }
  )
})
