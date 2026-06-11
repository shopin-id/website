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
      // 1. Validasi User dan memastikan Data Bank tidak kosong
      const user = await db.prepare("SELECT bank_name, bank_account_number FROM users WHERE id = ?").bind(userAuth.id).first()
      if (!user || !user.bank_account_number) {
        return c.redirect('/seller/wallet?err=no_bank')
      }

      // 2. Validasi Toko & Ketersediaan Saldo
      const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(userAuth.id).first()
      if (!store) return c.redirect('/seller/wallet?err=1')

      const wallet = await db.prepare("SELECT id, available_balance FROM vendor_wallets WHERE store_id = ?").bind(store.id).first()
      if (!wallet || (wallet.available_balance as number) < amount || amount <= 0) {
         return c.redirect('/seller/wallet?err=insufficient')
      }

      // 3. Eksekusi Penarikan (Potong Saldo & Catat Histori Transaksi)
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

  // Ambil data User untuk info Bank
  const user = await db.prepare("SELECT bank_name, bank_account_number, bank_account_name FROM users WHERE id = ?").bind(userAuth.id).first()
  
  // Ambil data Store untuk mencari Wallet
  const store = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(userAuth.id).first()
  if (!store) return c.redirect('/seller/register')

  // Ambil Saldo dari Wallet
  const wallet = await db.prepare("SELECT pending_balance, available_balance FROM vendor_wallets WHERE store_id = ?").bind(store.id).first()
  
  // Ambil Daftar Bank
  let banks: any[] = []
  try {
    const { results } = await db.prepare("SELECT bank_name, transfer_code FROM bank_transfers WHERE is_active = 1 ORDER BY bank_name ASC").all()
    banks = results || []
  } catch(e) {}

  const pending = wallet ? (wallet.pending_balance as number) : 0;
  const available = wallet ? (wallet.available_balance as number) : 0;
  
  // Tangkap Pesan Status
  const success = c.req.query('success')
  const err = c.req.query('err')

  return c.render(
    <div className="w-full bg-[#f4f7fc] min-h-screen py-10 px-4">
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
          <div className="bg-green-50 border border-green-200 p-4 rounded-sm shadow-sm">
            <p className="text-sm text-green-700 font-bold">✓ Informasi Rekening Bank berhasil diperbarui!</p>
          </div>
        )}
        {success === 'withdraw_ok' && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-sm shadow-sm">
            <p className="text-sm text-green-700 font-bold">✓ Permintaan penarikan dana berhasil diproses! Saldo Anda telah dipotong.</p>
          </div>
        )}
        {err === 'no_bank' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-sm shadow-sm">
            <p className="text-sm text-red-700 font-bold">⚠ Gagal: Mohon isi dan simpan data Rekening Pencairan Anda terlebih dahulu di bawah!</p>
          </div>
        )}
        {err === 'insufficient' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-sm shadow-sm">
            <p className="text-sm text-red-700 font-bold">⚠ Gagal: Saldo tidak mencukupi atau nominal penarikan tidak valid.</p>
          </div>
        )}

        {/* KARTU SALDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-gradient-to-r from-gray-900 to-black p-8 rounded-sm shadow-md text-white relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Saldo Bisa Ditarik</p>
                <h2 className="text-4xl font-black mb-6">Rp {available.toLocaleString('id-ID')}</h2>
                
                {/* PERBAIKAN: TOMBOL TARIK DANA SEKARANG HIDUP & BERFUNGSI */}
                <form method="POST" action="/seller/wallet" onSubmit={`return window.confirmWithdrawal(this, ${available})`}>
                  {/* Indikator agar Backend tahu ini aksi Penarikan */}
                  <input type="hidden" name="action_type" value="withdraw" /> 
                  <input type="hidden" name="amount" id="withdraw_amount" value="" />
                  <button 
                    type="submit"
                    disabled={available <= 0}
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
            {/* Indikator agar Backend tahu ini aksi Penyimpanan Bank */}
            <input type="hidden" name="action_type" value="update_bank" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* KOMPONEN PENCARIAN BANK CERDAS */}
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
                   
                   {banks.length === 0 && (
                     <li className="px-3 py-3 text-sm text-gray-400 text-center">Data bank belum tersedia.</li>
                   )}
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

      {/* SCRIPT LOGIKA PENCARIAN BANK & PENARIKAN DANA */}
      <script dangerouslySetInnerHTML={{__html: `
        // === LOGIKA DROPDOWN BANK ===
        const searchInput = document.getElementById('bank-search-input');
        const hiddenInput = document.getElementById('hidden-bank-name');
        const bankList = document.getElementById('bank-list');
        const bankItems = document.querySelectorAll('.bank-item');
        const notFound = document.getElementById('bank-not-found');

        if(searchInput) {
          searchInput.addEventListener('focus', () => {
            bankList.classList.remove('hidden');
          });

          searchInput.addEventListener('blur', () => {
            setTimeout(() => bankList.classList.add('hidden'), 200);
          });

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

            if (count === 0) {
              if(notFound) notFound.style.display = 'block';
            } else {
              if(notFound) notFound.style.display = 'none';
            }
          });

          window.selectBank = function(bankName) {
            searchInput.value = bankName;
            hiddenInput.value = bankName;
            bankList.classList.add('hidden');
          };
        }

        // === LOGIKA POPUP TARIK DANA ===
        window.confirmWithdrawal = function(form, maxAmount) {
          if (maxAmount <= 0) return false;
          
          // Cek keamanan: pastikan rekening sudah diisi
          const bankNum = document.getElementById('form_bank_number');
          if (!bankNum || !bankNum.value.trim()) {
              alert('PENTING: Mohon lengkapi dan simpan Data Rekening Bank Anda terlebih dahulu di formulir bawah!');
              return false;
          }

          // Munculkan popup nominal
          const input = prompt('Masukkan nominal dana yang ingin ditarik (Maksimal: Rp ' + new Intl.NumberFormat('id-ID').format(maxAmount) + '):\\n\\nPastikan rekening bank Anda sudah benar!', maxAmount);
          
          if (!input) return false; // Batal ditarik

          // Bersihkan angka dari titik/koma
          const amount = parseInt(input.replace(/\\D/g, ''), 10);
          
          if (isNaN(amount) || amount <= 0) {
              alert('GAGAL: Nominal yang dimasukkan tidak valid.');
              return false;
          }
          if (amount > maxAmount) {
              alert('GAGAL: Nominal penarikan (' + amount + ') melebihi saldo yang tersedia (' + maxAmount + ')!');
              return false;
          }

          // Konfirmasi akhir
          const konfirmasi = confirm('Anda akan menarik dana sebesar Rp ' + new Intl.NumberFormat('id-ID').format(amount) + '. Proses ini tidak dapat dibatalkan. Lanjutkan?');
          if (!konfirmasi) return false;

          // Suntikkan angka ke input form tersembunyi
          document.getElementById('withdraw_amount').value = amount;
          return true;
        };
      `}} />

    </div>
  )
})
