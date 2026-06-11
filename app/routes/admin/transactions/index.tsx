import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../../utils/auth'

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

  // Defensif: Pastikan kolom status dan notes terbaca dengan aman
  try { await db.prepare("ALTER TABLE wallet_transactions ADD COLUMN status TEXT DEFAULT 'approved'").run() } catch(e) {}
  try { await db.prepare("ALTER TABLE wallet_transactions ADD COLUMN notes TEXT").run() } catch(e) {}

  // PERBAIKAN: Tarik data t.notes DAN data rekening bank milik penjual
  const { results: txs } = await db.prepare(`
    SELECT t.id as tx_id, t.type, t.amount, t.description, t.status, t.created_at, t.notes,
           u.name as member_name, u.phone as member_phone, 
           u.bank_name, u.bank_account_number, u.bank_account_name,
           w.id as wallet_id
    FROM wallet_transactions t
    JOIN vendor_wallets w ON t.wallet_id = w.id
    JOIN stores s ON w.store_id = s.id
    JOIN users u ON s.user_id = u.id
    ORDER BY t.created_at DESC
  `).all()

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 relative">
      
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

      {/* TAMPILAN DATA TABEL */}
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
              <th className="p-3 text-center font-bold">Rincian & Catatan</th>
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
              const isUangKeluar = tx.type === 'withdrawal' || tx.type === 'bonus_withdrawal';
              const jenisTeks = isUangKeluar ? 'Uang Keluar' : 'Uang Masuk';
              
              const nominalUtama = tx.type === 'bonus' ? 0 : tx.amount;
              const nominalBonus = tx.type === 'bonus' ? tx.amount : 0;

              let statusLabel = 'Disetujui';
              let statusClass = 'bg-teal-500 text-white';
              if (tx.status === 'pending') {
                statusLabel = 'Tertunda';
                statusClass = 'bg-amber-500 text-white';
              } else if (tx.status === 'rejected') {
                statusLabel = 'Ditolak';
                statusClass = 'bg-rose-500 text-white';
              }

              // Gabungkan data rekening bank agar bisa dilempar ke Modal
              const bankInfo = tx.bank_name && tx.bank_account_number 
                ? `${tx.bank_name} - ${tx.bank_account_number} (a.n. ${tx.bank_account_name || tx.member_name})`
                : 'Data rekening belum diatur / Kosong';

              return (
                <tr key={tx.tx_id} className={`transition-colors ${isUangKeluar ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                  <td className="p-3 text-center font-medium text-gray-400">{idx + 1}</td>
                  <td className="p-3 font-bold text-gray-900">{tx.member_name}</td>
                  <td className="p-3 font-medium text-gray-600">{tx.member_phone || '-'}</td>
                  <td className="p-3 text-center text-gray-300 font-mono">-</td>
                  
                  <td className={`p-3 font-bold text-sm ${nominalUtama < 0 ? 'text-rose-600' : nominalUtama > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {nominalUtama !== 0 ? `${nominalUtama.toLocaleString('id-ID')}.00 Rp` : '0.00 Rp'}
                  </td>
                  
                  <td className={`p-3 font-bold text-sm ${nominalBonus > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                    {nominalBonus !== 0 ? `${nominalBonus.toLocaleString('id-ID')}.00 Rp` : ''}
                  </td>
                  
                  {/* TOMBOL PEMICU MODAL RINCIAN & CATATAN */}
                  <td className="p-3 text-center">
                    <button 
                      type="button"
                      className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors shadow-sm"
                      data-id={tx.tx_id}
                      data-member={tx.member_name}
                      data-type={jenisTeks}
                      data-amount={Math.abs(nominalUtama || nominalBonus).toLocaleString('id-ID')}
                      data-desc={tx.description || '-'}
                      data-notes={tx.notes || 'Tidak ada catatan pengirim.'}
                      data-bank={bankInfo}
                      onclick="window.openTrxModal(this)"
                    >
                      Buka Rincian
                    </button>
                  </td>
                  
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider ${isUangKeluar ? 'bg-pink-500 text-white' : 'bg-teal-500 text-white'}`}>
                      {jenisTeks}
                    </span>
                  </td>
                  
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>

                  <td className="p-3 text-gray-400 whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})} {new Date(tx.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                  </td>

                  <td className="p-3 text-center whitespace-nowrap">
                    {tx.status === 'pending' ? (
                      <div className="flex items-center justify-center space-x-1">
                        <form action="/admin/transactions" method="POST" className="m-0">
                          <input type="hidden" name="action" value="approve" />
                          <input type="hidden" name="transaction_id" value={tx.tx_id} />
                          <button type="submit" className="bg-teal-500 text-white px-2 py-1 rounded-sm text-[10px] font-bold uppercase hover:bg-teal-600 transition-colors" onclick="return confirm('Anda yakin sudah mentransfer dana ini dan ingin menyetujuinya?')">
                            ✓ Setujui
                          </button>
                        </form>
                        <form action="/admin/transactions" method="POST" className="m-0">
                          <input type="hidden" name="action" value="reject" />
                          <input type="hidden" name="transaction_id" value={tx.tx_id} />
                          <button type="submit" className="bg-rose-600 text-white px-2 py-1 rounded-sm text-[10px] font-bold uppercase hover:bg-rose-700 transition-colors" onclick="return confirm('Tolak penarikan dan kembalikan saldo ke penjual?')">
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

      {/* === MODAL KUSTOM: RINCIAN PENARIKAN & CATATAN === */}
      <div id="trx-modal" className="fixed inset-0 z-[9999] hidden flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity opacity-0 duration-300 px-4">
        <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg transform scale-95 transition-transform duration-300 flex flex-col overflow-hidden" id="trx-modal-content">
           
           <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Rincian Transaksi</h3>
             <button type="button" onclick="window.closeTrxModal()" className="text-gray-400 hover:text-red-600 transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>
           
           <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID Transaksi / Member</p>
                <p className="text-sm font-bold text-gray-900"><span id="modal-tx-id" className="font-mono text-xs text-gray-500"></span> • <span id="modal-member"></span></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-sm border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Jenis Transaksi</p>
                  <p className="text-sm font-black text-blue-700" id="modal-type"></p>
                </div>
                <div className="bg-green-50 p-3 rounded-sm border border-green-100">
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Nominal</p>
                  <p className="text-sm font-black text-green-700 text-right">Rp <span id="modal-amount"></span></p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tujuan Transfer (Rekening Penjual)</p>
                <div className="bg-gray-800 text-white p-3 rounded-sm font-mono text-sm break-all">
                  <span id="modal-bank" className="font-bold text-yellow-400"></span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 italic">* Pastikan Anda mentransfer tepat ke rekening ini sebelum menekan tombol Setujui.</p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deskripsi Sistem</p>
                <p className="text-sm text-gray-800" id="modal-desc"></p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Catatan Dari Pengguna (Notes)</p>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-sm text-sm italic shadow-inner">
                  "<span id="modal-notes"></span>"
                </div>
              </div>
           </div>

           <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
             <button type="button" onclick="window.closeTrxModal()" className="px-6 py-2.5 bg-gray-200 text-gray-800 font-bold rounded-sm hover:bg-gray-300 transition-colors text-xs uppercase tracking-wider">Tutup Rincian</button>
           </div>
        </div>
      </div>

      {/* SCRIPT KENDALI MODAL */}
      <script dangerouslySetInnerHTML={{__html: `
        window.openTrxModal = function(btn) {
          document.getElementById('modal-tx-id').innerText = btn.getAttribute('data-id');
          document.getElementById('modal-member').innerText = btn.getAttribute('data-member');
          document.getElementById('modal-amount').innerText = btn.getAttribute('data-amount');
          document.getElementById('modal-type').innerText = btn.getAttribute('data-type');
          document.getElementById('modal-bank').innerText = btn.getAttribute('data-bank');
          document.getElementById('modal-desc').innerText = btn.getAttribute('data-desc');
          document.getElementById('modal-notes').innerText = btn.getAttribute('data-notes');

          const modal = document.getElementById('trx-modal');
          const content = document.getElementById('trx-modal-content');
          
          modal.classList.remove('hidden');
          void modal.offsetWidth; // trigger reflow
          modal.classList.remove('opacity-0');
          content.classList.remove('scale-95');
        };

        window.closeTrxModal = function() {
          const modal = document.getElementById('trx-modal');
          const content = document.getElementById('trx-modal-content');
          
          modal.classList.add('opacity-0');
          content.classList.add('scale-95');
          setTimeout(() => {
            modal.classList.add('hidden');
          }, 300);
        };
      `}} />
      
    </div>,
    { title: 'Transaksi Keuangan | Admin' }
  )
})
