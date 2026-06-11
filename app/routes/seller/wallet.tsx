import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'
import { generateId } from '../../utils/admin_utils'

// === MESIN PENYIMPAN DATA (AKSI: UPDATE BANK & PENARIKAN DENGAN LOCKING) ===
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const userAuth = await getAuthUser(c)
  if (!userAuth) return c.redirect('/login')

  const formData = await c.req.formData()
  const actionType = formData.get('action_type') as string

  // ==========================================
  // AKSI 1: SIMPAN DATA REKENING BANK
  // ==========================================
  if (actionType === 'update_bank') {
    const bank_name = formData.get('bank_name') as string
    const bank_account_number = formData.get('bank_account_number') as string
    const bank_account_name = formData.get('bank_account_name') as string

    try {
      await db.prepare(`
        UPDATE users 
        SET bank_name = ?, bank_account_number = ?, bank_account_name = ?
        WHERE id = ?
      `).bind(bank_name, bank_account_number, bank_account_name, userAuth.id).run()

      return c.redirect('/seller/wallet?success=bank_updated')
    } catch (err) {
      console.error("Gagal menyimpan rekening:", err)
      return c.redirect('/seller/wallet?err=1')
    }
  }

  // ==========================================
  // AKSI 2: PROSES PENARIKAN DANA (ANTI-RACE CONDITION)
  // ==========================================
  if (actionType === 'withdraw') {
    const amountStr = formData.get('amount') as string
    const amount = parseInt(amountStr, 10)
    const notes = formData.get('notes') as string || '' 

    try {
      const user = await db.prepare("SELECT bank_name, bank_account_number FROM users WHERE id = ?").bind(userAuth.id).first()
      if (!user || !user.bank_account_number) {
        return c.redirect('/seller/wallet?err=no_bank')
      }

      const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(userAuth.id).first()
      if (!store) return c.redirect('/seller/wallet?err=1')

      const wallet = await db.prepare("SELECT id, available_balance FROM vendor_wallets WHERE store_id = ?").bind(store.id).first()
      if (!wallet || amount <= 0) {
         return c.redirect('/seller/wallet?err=insufficient')
      }

      const updateResult = await db.prepare(`
        UPDATE vendor_wallets 
        SET available_balance = available_balance - ? 
        WHERE id = ? AND available_balance >= ?
      `).bind(amount, wallet.id, amount).run()

      if (!updateResult.meta || updateResult.meta.changes === 0) {
        return c.redirect('/seller/wallet?err=insufficient')
      }

      const trxId = 'TRX-' + generateId().substring(0, 8).toUpperCase()
      const desc = `Penarikan ke ${user.bank_name} - ${user.bank_account_number}`

      await db.prepare(`
        INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, status, notes)
        VALUES (?, ?, 'withdrawal', ?, ?, 'pending', ?)
      `).bind(trxId, wallet.id, amount, desc, notes).run()

      return c.redirect('/seller/wallet?success=withdraw_ok')
    } catch (err) {
      console.error("Gagal melakukan proses penarikan:", err)
      return c.redirect('/seller/wallet?err=1')
    }
  }

  return c.redirect('/seller/wallet')
})

// === ANTARMUKA DOMPET, REKENING, DAN RIWAYAT TRANSAKSI ===
export default createRoute(async (c) => {
  const db = c.env.DB
  const userAuth = await getAuthUser(c)
  if (!userAuth) return c.redirect('/login')

  const user = await db.prepare("SELECT bank_name, bank_account_number, bank_account_name FROM users WHERE id = ?").bind(userAuth.id).first()
  const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(userAuth.id).first()
  if (!store) return c.redirect('/seller/register')

  const wallet = await db.prepare("SELECT id, pending_balance, available_balance FROM vendor_wallets WHERE store_id = ?").bind(store.id).first()
  
  let banks: any[] = []
  try {
    const { results } = await db.prepare("SELECT bank_name, transfer_code FROM bank_transfers WHERE is_active = 1 ORDER BY bank_name ASC").all()
    banks = results || []
  } catch(e) {}

  const rawPage = parseInt(c.req.query('page') || '1', 10)
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
  
  const rawLimit = parseInt(c.req.query('limit') || '5', 10)
  const allowedLimits = [5, 10, 20, 50]
  const limit = allowedLimits.includes(rawLimit) ? rawLimit : 5
  
  const offset = (page - 1) * limit

  let transactions: any[] = []
  let totalRecords = 0
  if (wallet) {
    const countResult = await db.prepare("SELECT COUNT(*) as total FROM wallet_transactions WHERE wallet_id = ?").bind(wallet.id).first()
    totalRecords = countResult ? (countResult.total as number) : 0

    const { results } = await db.prepare("SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(wallet.id, limit, offset).all()
    transactions = results || []
  }

  const totalPages = Math.ceil(totalRecords / limit)
  
  let startPage = Math.max(1, page - 2)
  let endPage = Math.min(totalPages, page + 2)
  if (endPage - startPage < 4) {
    if (startPage === 1) endPage = Math.min(totalPages, startPage + 4)
    else if (endPage === totalPages) startPage = Math.max(1, endPage - 4)
  }
  const pagesArray = []
  for (let i = startPage; i <= endPage; i++) pagesArray.push(i)

  const pending = wallet ? (wallet.pending_balance as number) : 0;
  const available = wallet ? (wallet.available_balance as number) : 0;
  
  const success = c.req.query('success')
  const err = c.req.query('err')

  return c.render(
    <div className="w-full bg-[#f4f7fc] min-h-screen py-10 px-2 md:px-4 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER DOMPET */}
        <div className="flex justify-between items-center bg-white p-5 md:p-6 rounded-sm shadow-sm border border-gray-200">
          <div>
             <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dompet & Saldo</h1>
             <p className="text-xs md:text-sm text-gray-500">Kelola penghasilan dan riwayat keuangan.</p>
          </div>
          <a href="/seller" className="text-xs md:text-sm font-bold text-gray-500 hover:text-black">← Dasbor</a>
        </div>

        {/* KARTU SALDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
           <div className="bg-gradient-to-r from-gray-900 to-black p-6 md:p-8 rounded-sm shadow-md text-white relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Saldo Bisa Ditarik</p>
                <h2 className="text-3xl md:text-4xl font-black mb-6 truncate">Rp {available.toLocaleString('id-ID')}</h2>
                
                <form id="withdraw-form" method="POST" action="/seller/wallet">
                  <input type="hidden" name="action_type" value="withdraw" /> 
                  <input type="hidden" name="amount" id="withdraw_amount" value="" />
                  <input type="hidden" name="notes" id="withdraw_notes" value="" />
                  <button 
                    type="button"
                    disabled={available <= 0}
                    onClick={`openWithdrawModal(${available})`}
                    className={`px-5 py-2 md:px-6 md:py-2.5 rounded-sm font-bold text-xs md:text-sm uppercase tracking-wide transition-colors ${available > 0 ? 'bg-white text-black hover:bg-gray-100 shadow-sm' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                  >
                     Tarik Dana
                  </button>
                </form>
             </div>
             <div className="absolute -right-10 -bottom-10 opacity-10">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
             </div>
           </div>

           <div className="bg-white p-6 md:p-8 border border-gray-200 rounded-sm shadow-sm flex flex-col justify-center">
             <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Dana Tertahan (Pending)</p>
             <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 truncate">Rp {pending.toLocaleString('id-ID')}</h3>
             <p className="text-xs md:text-sm text-gray-500 leading-relaxed">Dana ini masih ditahan dalam proses *escrow* menunggu pesanan selesai.</p>
           </div>
        </div>

        {/* SPOILER REKENING BANK (ACCORDION) */}
        <details className="group bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
          <summary className="p-5 md:p-6 cursor-pointer font-bold text-sm md:text-base flex justify-between items-center bg-gray-50/50 hover:bg-gray-100 transition-colors list-none">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              <span>Informasi Rekening Pencairan</span>
            </div>
            <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </summary>
          
          <div className="border-t border-gray-100">
            <form action="/seller/wallet" method="POST" className="p-5 md:p-8 space-y-6">
              <input type="hidden" name="action_type" value="update_bank" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                
                <div className="relative">
                   <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pilih / Cari Nama Bank</label>
                   <input type="hidden" name="bank_name" id="hidden-bank-name" value={(user?.bank_name as string) || ''} />
                   <input 
                     type="text" 
                     id="bank-search-input" 
                     value={(user?.bank_name as string) || ''} 
                     placeholder="Ketik nama bank (Cth: BCA, BNI)..." 
                     className="w-full border border-gray-300 px-4 py-3 text-sm rounded-sm focus:ring-black bg-white font-bold" 
                     autoComplete="off" 
                     required
                   />
                   <ul id="bank-list" className="absolute z-20 w-full bg-white border border-gray-200 mt-1 max-h-48 overflow-y-auto hidden shadow-xl rounded-sm">
                     {banks.map((bank: any, idx: number) => (
                       <li key={idx} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-100 cursor-pointer bank-item flex justify-between items-center" data-name={bank.bank_name} data-code={bank.transfer_code}>
                         <span className="font-bold text-gray-800 text-sm">{bank.bank_name}</span>
                         <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-sm font-mono tracking-widest">{bank.transfer_code}</span>
                       </li>
                     ))}
                   </ul>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nomor Rekening</label>
                  <input type="text" name="bank_account_number" id="form_bank_number" required value={(user?.bank_account_number as string) || ''} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black text-sm font-bold tracking-wider" placeholder="Cth: 8192000123" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nama Pemilik Rekening</label>
                  <input type="text" name="bank_account_name" required value={(user?.bank_account_name as string) || ''} className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black text-sm font-bold uppercase" placeholder="Sesuai buku tabungan" />
                </div>

              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 shadow-md w-full md:w-auto">Simpan Rekening</button>
              </div>
            </form>
          </div>
        </details>

        {/* RIWAYAT TRANSAKSI */}
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-900 uppercase tracking-widest">Riwayat Transaksi</h2>
              <p className="text-[10px] md:text-xs text-gray-500 mt-1">Daftar mutasi dompet Anda.</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-medium">Tampilkan:</span>
              <select 
                className="border border-gray-300 text-xs rounded-sm px-2 py-1.5 focus:outline-none focus:border-black font-bold bg-white"
                onChange="window.location.href='?limit='+this.value"
              >
                {allowedLimits.map(l => (
                  <option key={l} value={l} selected={limit === l}>{l} Baris</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="px-5 py-4 font-bold border-b border-gray-200">ID / Waktu</th>
                  <th className="px-5 py-4 font-bold border-b border-gray-200">Deskripsi & Catatan</th>
                  <th className="px-5 py-4 font-bold border-b border-gray-200 text-right">Nominal</th>
                  <th className="px-5 py-4 font-bold border-b border-gray-200 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400 text-xs italic">Belum ada riwayat transaksi.</td></tr>
                ) : (
                  transactions.map((t: any) => {
                    const isIncome = t.type === 'income' || t.type === 'bonus';
                    const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
                    const sign = isIncome ? '+' : '-';
                    
                    let statusBadge = <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest">{t.status}</span>;
                    if (t.status === 'approved') statusBadge = <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest">Selesai</span>;
                    if (t.status === 'pending') statusBadge = <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest">Diproses</span>;
                    if (t.status === 'rejected') statusBadge = <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest">Ditolak</span>;

                    const dateObj = new Date(t.created_at);
                    const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });

                    return (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-mono text-xs text-gray-900">{t.id}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{formattedDate}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-gray-700 font-medium">{t.description || t.type}</div>
                          {t.notes && (
                            <div className="text-xs text-amber-700 bg-amber-50 rounded-sm px-2 py-1 mt-1 border border-amber-100 w-fit max-w-md">
                              <strong>Memo:</strong> {t.notes}
                            </div>
                          )}
                        </td>
                        <td className={`px-5 py-4 font-black text-right ${amountClass}`}>
                          {sign} Rp {t.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-4 text-center">{statusBadge}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINASI HORIZONTAL */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
              <p className="text-[10px] md:text-xs text-gray-500 hidden sm:block">
                Menampilkan {(offset + 1)} - {Math.min(offset + limit, totalRecords)} dari {totalRecords} transaksi
              </p>
              
              <div className="flex space-x-1 sm:space-x-2 w-full sm:w-auto justify-center sm:justify-end">
                <a 
                  href={page > 1 ? `?page=${page - 1}&limit=${limit}` : '#'} 
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors border ${page > 1 ? 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white' : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'}`}
                >
                  &laquo; Prev
                </a>
                
                {pagesArray.map(p => (
                  <a 
                    key={p} 
                    href={`?page=${p}&limit=${limit}`}
                    className={`w-8 py-1.5 flex justify-center items-center rounded-sm text-xs font-bold transition-colors border ${page === p ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-100'}`}
                  >
                    {p}
                  </a>
                ))}

                <a 
                  href={page < totalPages ? `?page=${page + 1}&limit=${limit}` : '#'} 
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors border ${page < totalPages ? 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white' : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'}`}
                >
                  Next &raquo;
                </a>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* TOAST CONTAINER */}
      <div id="toast-container" className="fixed top-5 right-5 z-[10000] flex flex-col gap-3"></div>
      
      {/* CUSTOM MODAL */}
      <div id="withdraw-modal" className="fixed inset-0 z-[9999] hidden flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity opacity-0 duration-300 px-4">
        <div className="bg-white rounded-sm shadow-2xl p-6 w-full max-w-md transform scale-95 transition-transform duration-300" id="withdraw-modal-content">
           <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Penarikan Dana</h3>
           <p className="text-xs md:text-sm text-gray-500 mb-4">Masukkan nominal penarikan. Saldo maksimal Anda adalah <strong id="modal-max-amount" className="text-black"></strong>.</p>
           
           <div className="space-y-4 mb-6">
             <div className="relative">
               <span className="absolute left-4 top-3.5 text-gray-500 font-bold">Rp</span>
               <input type="text" id="modal-input-amount" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black font-black text-xl text-gray-900" placeholder="0" />
             </div>
             
             <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Catatan / Pesan Pengiriman Untuk Admin (Opsional)</label>
               <textarea id="modal-input-notes" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-black text-xs font-semibold text-gray-800" placeholder="Contoh: Tolong proses ke rekening utama BCA ini ya min..."></textarea>
             </div>
           </div>

           <div className="flex space-x-3">
             <button type="button" onClick="closeWithdrawModal()" className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-sm hover:bg-gray-200 text-[10px] md:text-xs uppercase tracking-wider">Batal</button>
             <button type="button" onClick="submitWithdrawal()" className="flex-1 py-3 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 text-[10px] md:text-xs uppercase tracking-wider shadow-md">Konfirmasi Tarik</button>
           </div>
        </div>
      </div>

      {/* SCRIPT UX LOGIC */}
      <script dangerouslySetInnerHTML={{__html: `
        window.showToast = function(message, type = 'error') {
          const container = document.getElementById('toast-container');
          const toast = document.createElement('div');
          const isError = type === 'error';
          toast.className = 'flex items-center p-4 rounded-sm shadow-xl text-sm font-bold transform transition-all duration-300 translate-x-full opacity-0 ' + (isError ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'bg-green-50 text-green-700 border-l-4 border-green-600');
          toast.innerHTML = '<span class="mr-2 text-lg">' + (isError ? '⚠' : '✓') + '</span><span>' + message + '</span>';
          container.appendChild(toast);
          requestAnimationFrame(() => toast.classList.remove('translate-x-full', 'opacity-0'));
          setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
          }, 4000);
        };

        ${success === 'bank_updated' ? "showToast('Informasi Rekening Bank berhasil diperbarui!', 'success');" : ""}
        ${success === 'withdraw_ok' ? "showToast('Permintaan penarikan dana berhasil diproses! Menunggu transfer Admin.', 'success');" : ""}
        ${err === 'no_bank' ? "showToast('Gagal: Mohon isi data Rekening pada tab Informasi Rekening!', 'error');" : ""}
        ${err === 'insufficient' ? "showToast('Gagal: Saldo tidak mencukupi, sedang terkunci, atau nominal tidak valid.', 'error');" : ""}

        let maxWithdrawAmount = 0;
        window.openWithdrawModal = function(maxAmount) {
          const bankNum = document.getElementById('form_bank_number');
          if (!bankNum || !bankNum.value.trim()) {
              showToast('Mohon buka tab Rekening dan simpan Data Bank Anda terlebih dahulu!', 'error');
              return;
          }
          maxWithdrawAmount = maxAmount;
          document.getElementById('modal-max-amount').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(maxAmount);
          document.getElementById('modal-input-amount').value = '';
          document.getElementById('modal-input-notes').value = '';
          const modal = document.getElementById('withdraw-modal');
          const content = document.getElementById('withdraw-modal-content');
          modal.classList.remove('hidden');
          void modal.offsetWidth;
          modal.classList.remove('opacity-0');
          content.classList.remove('scale-95');
        };

        window.closeWithdrawModal = function() {
          const modal = document.getElementById('withdraw-modal');
          const content = document.getElementById('withdraw-modal-content');
          modal.classList.add('opacity-0');
          content.classList.add('scale-95');
          setTimeout(() => modal.classList.add('hidden'), 300);
        };

        const amountInput = document.getElementById('modal-input-amount');
        if(amountInput) {
           amountInput.addEventListener('input', function(e) {
              let value = e.target.value.replace(/\\D/g, '');
              if(value) e.target.value = new Intl.NumberFormat('id-ID').format(parseInt(value, 10));
              else e.target.value = '';
           });
        }

        window.submitWithdrawal = function() {
          const inputVal = document.getElementById('modal-input-amount').value.replace(/\\D/g, '');
          const amount = parseInt(inputVal, 10);
          const notesVal = document.getElementById('modal-input-notes').value.trim();
          
          if (isNaN(amount) || amount <= 0) { showToast('Nominal yang Anda masukkan tidak valid.', 'error'); return; }
          if (amount > maxWithdrawAmount) { showToast('Nominal penarikan melebihi saldo yang tersedia!', 'error'); return; }
          
          // === PERBAIKAN TYPO: Menggunakan underscore withdraw_notes ===
          document.getElementById('withdraw_amount').value = amount;
          document.getElementById('withdraw_notes').value = notesVal;
          document.getElementById('withdraw-form').submit();
        };

        const searchInput = document.getElementById('bank-search-input');
        const hiddenInput = document.getElementById('hidden-bank-name');
        const bankList = document.getElementById('bank-list');
        const bankItems = document.querySelectorAll('.bank-item');

        if(searchInput) {
          searchInput.addEventListener('focus', () => bankList.classList.remove('hidden'));
          searchInput.addEventListener('blur', () => setTimeout(() => bankList.classList.add('hidden'), 200));
          searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            hiddenInput.value = e.target.value; 
            bankItems.forEach(item => {
              const name = item.getAttribute('data-name').toLowerCase();
              const code = item.getAttribute('data-code') ? item.getAttribute('data-code').toLowerCase() : '';
              item.style.display = (name.includes(val) || code.includes(val)) ? 'flex' : 'none';
            });
          });
          bankItems.forEach(item => {
            item.addEventListener('click', function() {
              const name = this.getAttribute('data-name');
              searchInput.value = name;
              hiddenInput.value = name;
              bankList.classList.add('hidden');
            });
          });
        }
      `}} />
    </div>
  )
})
