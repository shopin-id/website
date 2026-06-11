import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'
import { generateId } from '../../utils/admin_utils'

// === MESIN PENYIMPAN DATA (DUA AKSI: UPDATE BANK & PENARIKAN) ===
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
  // AKSI 2: PROSES PENARIKAN DANA (WITHDRAWAL)
  // ==========================================
  if (actionType === 'withdraw') {
    const amountStr = formData.get('amount') as string
    const amount = parseInt(amountStr, 10)

    try {
      const user = await db.prepare("SELECT bank_name, bank_account_number FROM users WHERE id = ?").bind(userAuth.id).first()
      if (!user || !user.bank_account_number) {
        return c.redirect('/seller/wallet?err=no_bank')
      }

      const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(userAuth.id).first()
      if (!store) return c.redirect('/seller/wallet?err=1')

      const wallet = await db.prepare("SELECT id, available_balance FROM vendor_wallets WHERE store_id = ?").bind(store.id).first()
      if (!wallet || (wallet.available_balance as number) < amount || amount <= 0) {
         return c.redirect('/seller/wallet?err=insufficient')
      }

      const trxId = 'TRX-' + generateId().substring(0, 8).toUpperCase()
      const desc = `Penarikan ke ${user.bank_name} - ${user.bank_account_number}`

      await db.batch([
        db.prepare("UPDATE vendor_wallets SET available_balance = available_balance - ? WHERE id = ?").bind(amount, wallet.id),
        db.prepare(`
          INSERT INTO wallet_transactions (id, wallet_id, type, amount, description)
          VALUES (?, ?, 'withdrawal', ?, ?)
        `).bind(trxId, wallet.id, amount, desc)
      ])

      return c.redirect('/seller/wallet?success=withdraw_ok')
    } catch (err) {
      console.error("Gagal penarikan:", err)
      return c.redirect('/seller/wallet?err=1')
    }
  }

  return c.redirect('/seller/wallet')
})

// === ANTARMUKA DOMPET & PENGATURAN REKENING ===
export default createRoute(async (c) => {
  const db = c.env.DB
  const userAuth = await getAuthUser(c)
  if (!userAuth) return c.redirect('/login')

  const user = await db.prepare("SELECT bank_name, bank_account_number, bank_account_name FROM users WHERE id = ?").bind(userAuth.id).first()
  
  const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(userAuth.id).first()
  if (!store) return c.redirect('/seller/register')

  const wallet = await db.prepare("SELECT pending_balance, available_balance FROM vendor_wallets WHERE store_id = ?").bind(store.id).first()
  
  let banks: any[] = []
  try {
    const { results } = await db.prepare("SELECT bank_name, transfer_code FROM bank_transfers WHERE is_active = 1 ORDER BY bank_name ASC").all()
    banks = results || []
  } catch(e) {}

  const pending = wallet ? (wallet.pending_balance as number) : 0;
  const available = wallet ? (wallet.available_balance as number) : 0;
  
  const success = c.req.query('success')
  const err = c.req.query('err')

  return c.render(
    <div className="w-full bg-[#f4f7fc] min-h-screen py-10 px-4 relative">
      
      {/* KONTEM UTAMA */}
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER DOMPET */}
        <div className="flex justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <div>
             <h1 className="text-2xl font-bold text-gray-900">Dompet & Saldo</h1>
             <p className="text-sm text-gray-500">Kelola penghasilan dan rekening pencairan Anda.</p>
          </div>
          <a href="/seller" className="text-sm font-bold text-gray-500 hover:text-black">← Kembali ke Dasbor</a>
        </div>

        {/* NOTIFIKASI STATUS */}
        {success === 'bank_updated' && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-sm shadow-sm flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p className="text-sm text-green-700 font-bold">Informasi Rekening Bank berhasil diperbarui!</p>
          </div>
        )}
        {success === 'withdraw_ok' && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-sm shadow-sm flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p className="text-sm text-green-700 font-bold">Permintaan penarikan dana berhasil diproses! Saldo Anda telah dipotong.</p>
          </div>
        )}
        {err === 'no_bank' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-sm shadow-sm flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-sm text-red-700 font-bold">Gagal: Mohon lengkapi Data Rekening Pencairan Anda di bawah!</p>
          </div>
        )}
        {err === 'insufficient' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-sm shadow-sm flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-sm text-red-700 font-bold">Gagal: Saldo tidak mencukupi atau nominal penarikan tidak valid.</p>
          </div>
        )}

        {/* KARTU SALDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-gradient-to-r from-gray-900 to-black p-8 rounded-sm shadow-md text-white relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Saldo Bisa Ditarik</p>
                <h2 className="text-4xl font-black mb-6">Rp {available.toLocaleString('id-ID')}</h2>
                
                {/* TOMBOL PEMICU CUSTOM MODAL */}
                <form id="withdraw-form" method="POST" action="/seller/wallet">
                  <input type="hidden" name="action_type" value="withdraw" /> 
                  <input type="hidden" name="amount" id="withdraw_amount" value="" />
                  <button 
                    type="button"
                    disabled={available <= 0}
                    onClick={`openWithdrawModal(${available})`}
                    className={`px-6 py-2.5 rounded-sm font-bold text-sm uppercase tracking-wide transition-colors ${available > 0 ? 'bg-white text-black hover:bg-gray-100 shadow-sm' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                  >
                     Tarik Dana
                  </button>
                </form>

             </div>
             <div className="absolute -right-10 -bottom-10 opacity-10">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
             </div>
           </div>

           <div className="bg-white p-8 border border-gray-200 rounded-sm shadow-sm flex flex-col justify-center">
             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Dana Tertahan (Pending Escrow)</p>
             <h3 className="text-3xl font-black text-gray-900 mb-2">Rp {pending.toLocaleString('id-ID')}</h3>
             <p className="text-sm text-gray-500 leading-relaxed">Dana ini masih ditahan karena pesanan sedang dalam proses pengiriman atau belum dikonfirmasi selesai oleh pembeli.</p>
           </div>
        </div>

        {/* FORMULIR REKENING BANK PENGIRIMAN */}
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest">Informasi Rekening Pencairan</h2>
            <p className="text-xs text-gray-500 mt-1">Pastikan nama pada rekening sesuai dengan identitas Anda untuk menghindari kegagalan penarikan dana.</p>
          </div>

          <form action="/seller/wallet" method="POST" className="p-6 md:p-8 space-y-6">
            <input type="hidden" name="action_type" value="update_bank" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="relative">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Pilih / Cari Nama Bank</label>
                 <input type="hidden" name="bank_name" id="hidden-bank-name" value={user?.bank_name as string || ''} />
                 <input 
                   type="text" 
                   id="bank-search-input" 
                   value={user?.bank_name as string || ''} 
                   placeholder="Ketik nama bank (Cth: BCA, BNI)..." 
                   className="w-full border border-gray-300 px-4 py-3 text-sm rounded-sm focus:ring-black bg-white font-bold" 
                   autoComplete="off" 
                   required
                 />
                 <ul id="bank-list" className="absolute z-20 w-full bg-white border border-gray-200 mt-1 max-h-48 overflow-y-auto hidden shadow-xl rounded-sm">
                   {banks.map((bank: any, idx: number) => (
                     <li 
                       key={idx} 
                       className="px-4 py-3 border-b border-gray-50 hover:bg-gray-100 cursor-pointer bank-item flex justify-between items-center"
                       data-name={bank.bank_name}
                       data-code={bank.transfer_code}
                       onclick={`window.selectBank('${(bank.bank_name || '').replace(/'/g, "\\'")}')`}
                     >
                       <span className="font-bold text-gray-800 text-sm">{bank.bank_name}</span>
                       <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-sm font-mono tracking-widest">{bank.transfer_code}</span>
                     </li>
                   ))}
                   {banks.length === 0 && <li className="px-3 py-3 text-sm text-gray-400 text-center">Data bank belum tersedia.</li>}
                   <li id="bank-not-found" className="px-3 py-3 text-sm text-gray-400 text-center hidden">Bank tidak ditemukan.</li>
                 </ul>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nomor Rekening</label>
                <input 
                  type="text" 
                  name="bank_account_number" 
                  id="form_bank_number"
                  required 
                  defaultValue={user?.bank_account_number as string || ''} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black text-sm font-bold tracking-wider" 
                  placeholder="Contoh: 8192000123" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nama Pemilik Rekening</label>
                <input 
                  type="text" 
                  name="bank_account_name" 
                  required 
                  defaultValue={user?.bank_account_name as string || ''} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-black text-sm font-bold uppercase" 
                  placeholder="Sesuai yang tertera di buku tabungan" 
                />
              </div>

            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-colors shadow-md w-full md:w-auto">
                Simpan Data Rekening
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* CONTAINER UNTUK TOAST NOTIFICATION KUSTOM */}
      <div id="toast-container" className="fixed top-5 right-5 z-[10000] flex flex-col gap-3"></div>

      {/* MODAL PENARIKAN (MENGGANTIKAN PROMPT/ALERT/CONFIRM BAWAAN JS) */}
      <div id="withdraw-modal" className="fixed inset-0 z-[9999] hidden flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity opacity-0 duration-300">
        <div className="bg-white rounded-sm shadow-2xl p-6 w-11/12 max-w-md transform scale-95 transition-transform duration-300" id="withdraw-modal-content">
           <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Penarikan Dana</h3>
           <p className="text-sm text-gray-500 mb-4">Masukkan nominal penarikan. Saldo maksimal Anda adalah <strong id="modal-max-amount" className="text-black"></strong>.</p>
           
           <div className="relative mb-6">
             <span className="absolute left-4 top-3.5 text-gray-500 font-bold">Rp</span>
             {/* Input angka otomatis terformat separator ribuan */}
             <input type="text" id="modal-input-amount" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-sm focus:ring-black focus:border-black font-black text-xl text-gray-900" placeholder="0" />
           </div>

           <div className="flex space-x-3">
             <button type="button" onClick="closeWithdrawModal()" className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-sm hover:bg-gray-200 transition-colors text-xs uppercase tracking-wider">Batal</button>
             <button type="button" onClick="submitWithdrawal()" className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 transition-colors text-xs uppercase tracking-wider shadow-md">Konfirmasi Tarik</button>
           </div>
        </div>
      </div>

      {/* SCRIPT LOGIKA PENCARIAN BANK & MODAL KUSTOM */}
      <script dangerouslySetInnerHTML={{__html: `
        // === LOGIKA TOAST NOTIFICATION KUSTOM ===
        window.showToast = function(message, type = 'error') {
          const container = document.getElementById('toast-container');
          const toast = document.createElement('div');
          const isError = type === 'error';
          
          toast.className = 'flex items-center p-4 rounded-sm shadow-xl text-sm font-bold transform transition-all duration-300 translate-x-full opacity-0 ' + (isError ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'bg-green-50 text-green-700 border-l-4 border-green-600');
          
          toast.innerHTML = '<span class="mr-2 text-lg">' + (isError ? '⚠' : '✓') + '</span><span>' + message + '</span>';
          container.appendChild(toast);
          
          // Animasikan masuk
          requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
          });
          
          // Hilangkan otomatis setelah 3 detik
          setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
          }, 3000);
        };

        // === LOGIKA CUSTOM MODAL PENARIKAN ===
        let maxWithdrawAmount = 0;

        window.openWithdrawModal = function(maxAmount) {
          const bankNum = document.getElementById('form_bank_number');
          // Jika nomor rekening kosong, tolak dan munculkan toast error
          if (!bankNum || !bankNum.value.trim()) {
              showToast('Mohon lengkapi dan simpan Data Rekening Bank Anda terlebih dahulu di bawah!', 'error');
              return;
          }
          
          maxWithdrawAmount = maxAmount;
          document.getElementById('modal-max-amount').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(maxAmount);
          document.getElementById('modal-input-amount').value = '';
          
          const modal = document.getElementById('withdraw-modal');
          const content = document.getElementById('withdraw-modal-content');
          
          modal.classList.remove('hidden');
          // Trigger reflow untuk animasi
          void modal.offsetWidth;
          modal.classList.remove('opacity-0');
          content.classList.remove('scale-95');
        };

        window.closeWithdrawModal = function() {
          const modal = document.getElementById('withdraw-modal');
          const content = document.getElementById('withdraw-modal-content');
          
          modal.classList.add('opacity-0');
          content.classList.add('scale-95');
          setTimeout(() => {
            modal.classList.add('hidden');
          }, 300);
        };

        // Format angka menjadi mata uang saat mengetik di dalam Modal
        const amountInput = document.getElementById('modal-input-amount');
        if(amountInput) {
           amountInput.addEventListener('input', function(e) {
              let value = e.target.value.replace(/\\D/g, '');
              if(value) {
                 e.target.value = new Intl.NumberFormat('id-ID').format(parseInt(value, 10));
              } else {
                 e.target.value = '';
              }
           });
        }

        window.submitWithdrawal = function() {
          const inputVal = document.getElementById('modal-input-amount').value.replace(/\\D/g, '');
          const amount = parseInt(inputVal, 10);
          
          if (isNaN(amount) || amount <= 0) {
              showToast('Nominal yang Anda masukkan tidak valid.', 'error');
              return;
          }
          if (amount > maxWithdrawAmount) {
              showToast('Nominal penarikan melebihi saldo yang tersedia!', 'error');
              return;
          }

          // Lolos validasi, masukkan nilai ke form hidden dan submit!
          document.getElementById('withdraw_amount').value = amount;
          document.getElementById('withdraw-form').submit();
        };

        // === LOGIKA DROPDOWN BANK ===
        const searchInput = document.getElementById('bank-search-input');
        const hiddenInput = document.getElementById('hidden-bank-name');
        const bankList = document.getElementById('bank-list');
        const bankItems = document.querySelectorAll('.bank-item');
        const notFound = document.getElementById('bank-not-found');

        if(searchInput) {
          searchInput.addEventListener('focus', () => { bankList.classList.remove('hidden'); });
          searchInput.addEventListener('blur', () => { setTimeout(() => bankList.classList.add('hidden'), 200); });
          searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            let count = 0;
            hiddenInput.value = e.target.value; 
            bankItems.forEach(item => {
              const name = item.getAttribute('data-name').toLowerCase();
              const code = item.getAttribute('data-code') ? item.getAttribute('data-code').toLowerCase() : '';
              if (name.includes(val) || code.includes(val)) {
                item.style.display = 'flex';
                count++;
              } else {
                item.style.display = 'none';
              }
            });
            if(notFound) notFound.style.display = count === 0 ? 'block' : 'none';
          });
          window.selectBank = function(bankName) {
            searchInput.value = bankName;
            hiddenInput.value = bankName;
            bankList.classList.add('hidden');
          };
        }
      `}} />

    </div>
  )
})
