import { createRoute } from 'honox/factory'
import { generateId } from '../../../utils/admin_utils'

// === MESIN PEMROSES AKUNTANSI ADMIN ===
export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const formData = await c.req.formData()
  const walletId = formData.get('wallet_id') as string
  
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
      
      // 2. PERBAIKAN FATAL: Memasukkan txType ke dalam bind agar jumlah parameter cocok dengan 6 tanda tanya (?)
      db.prepare(`
        INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, status, notes)
        VALUES (?, ?, ?, ?, ?, 'approved', ?)
      `).bind(trxId, walletId, txType, netAmount, txDesc, notes)
    ])

    return c.redirect('/admin/finance?success=injected')
  } catch (err) {
    console.error("Gagal menyesuaikan saldo:", err)
    return c.redirect('/admin/finance?err=1')
  }
})

// === ANTARMUKA ADMIN FINANSIAL ===
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
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 relative min-h-screen">
      <h2 className="text-xl font-bold text-gray-900 mb-1 uppercase tracking-tight">Keuangan & Saldo Vendor</h2>
      <p className="text-sm text-gray-500 mb-6">Kelola dan sesuaikan (Debet/Kredit) saldo vendor secara manual.</p>

      {/* CONTAINER TOAST NOTIFICATION KUSTOM */}
      <div id="toast-container" className="fixed top-5 right-5 z-[10000] flex flex-col gap-3"></div>

      <div className="overflow-x-auto custom-scrollbar mt-4">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-800 border-y border-gray-700 text-[10px] uppercase tracking-wider text-gray-200">
              <th className="p-4 font-bold">Boutique (Vendor)</th>
              <th className="p-4 font-bold text-right">Saldo Tersedia</th>
              <th className="p-4 font-bold text-center w-48">Aksi</th>
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
                
                <td className="p-4 text-center">
                  {/* TOMBOL BERSIH PEMICU MODAL */}
                  <button 
                    type="button" 
                    className="bg-black text-white px-4 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-sm w-full" 
                    onclick={`window.openAdjustModal('${w.id}', '${w.store_name.replace(/'/g, "\\'")}')`}
                  >
                    Sesuaikan Saldo
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PENYESUAIAN SALDO CANTIK */}
      <div id="adjust-modal" className="fixed inset-0 z-[9999] hidden flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity opacity-0 duration-300 px-4">
        <div className="bg-white rounded-sm shadow-2xl w-full max-w-md transform scale-95 transition-transform duration-300 overflow-hidden" id="adjust-modal-content">
           
           <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <div>
               <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Penyesuaian Saldo</h3>
               <p className="text-xs text-gray-500 mt-0.5">Toko: <strong id="modal-vendor-name" className="text-black"></strong></p>
             </div>
             <button type="button" onclick="window.closeAdjustModal()" className="text-gray-400 hover:text-red-600 transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>
           
           <div className="p-6">
             <form id="adjust-form" action="/admin/finance" method="POST" className="space-y-5">
               <input type="hidden" name="wallet_id" id="modal-wallet-id" value="" />
               
               <div className="flex space-x-4">
                 <div className="flex-1">
                   <label className="block text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1 pl-1">(-) Debet / Potong</label>
                   <input type="number" min="0" name="debet" placeholder="0" className="w-full border border-rose-200 px-3 py-3 rounded-sm text-sm focus:ring-rose-500 focus:border-rose-500 bg-rose-50 text-rose-700 font-black placeholder-rose-300 transition-colors" />
                 </div>
                 
                 <div className="flex-1">
                   <label className="block text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1 pl-1">(+) Kredit / Suntik</label>
                   <input type="number" min="0" name="kredit" placeholder="0" className="w-full border border-teal-200 px-3 py-3 rounded-sm text-sm focus:ring-teal-500 focus:border-teal-500 bg-teal-50 text-teal-700 font-black placeholder-teal-300 transition-colors" />
                 </div>
               </div>
               
               <div>
                 <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1 pl-1">Catatan Mutasi (Wajib)</label>
                 <input type="text" name="notes" placeholder="Cth: Koreksi saldo pesanan #123..." required className="w-full border border-gray-300 px-4 py-3 rounded-sm text-sm focus:ring-black focus:border-black font-medium text-gray-800 transition-colors" />
               </div>

               <div className="bg-red-50 border border-red-200 p-3 rounded-sm text-xs text-red-700 font-medium">
                 <strong>PERINGATAN!</strong> Anda akan mengubah saldo secara instan dan mutasi ini akan tercatat selamanya di riwayat penjual. Pastikan data sudah benar!
               </div>

               <div className="flex space-x-3 pt-2">
                 <button type="button" onclick="window.closeAdjustModal()" className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-sm hover:bg-gray-200 transition-colors text-[10px] uppercase tracking-wider">Batalkan</button>
                 <button type="button" onclick="window.submitAdjust()" className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 transition-colors text-[10px] uppercase tracking-wider shadow-md">Ya, Eksekusi</button>
               </div>
             </form>
           </div>
        </div>
      </div>

      {/* SCRIPT UX LOGIC: TOAST & MODAL */}
      <script dangerouslySetInnerHTML={{__html: `
        // === LOGIKA TOAST NOTIFICATION ===
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

        // Render otomatis Toast saat halaman dimuat jika ada trigger URL
        ${success === 'injected' ? "window.showToast('Saldo dompet vendor berhasil disesuaikan dan tercatat di riwayat!', 'success');" : ""}
        ${err === 'zero' ? "window.showToast('Gagal: Anda harus mengisi nilai Debet atau Kredit!', 'error');" : ""}
        ${err === '1' ? "window.showToast('Terjadi kesalahan sistem saat memproses penyesuaian saldo.', 'error');" : ""}

        // === LOGIKA CUSTOM MODAL ===
        window.openAdjustModal = function(walletId, storeName) {
          document.getElementById('modal-wallet-id').value = walletId;
          document.getElementById('modal-vendor-name').innerText = storeName;
          document.getElementById('adjust-form').reset();
          
          const modal = document.getElementById('adjust-modal');
          const content = document.getElementById('adjust-modal-content');
          
          modal.classList.remove('hidden');
          void modal.offsetWidth; // force reflow
          modal.classList.remove('opacity-0');
          content.classList.remove('scale-95');
        };

        window.closeAdjustModal = function() {
          const modal = document.getElementById('adjust-modal');
          const content = document.getElementById('adjust-modal-content');
          
          modal.classList.add('opacity-0');
          content.classList.add('scale-95');
          setTimeout(() => {
            modal.classList.add('hidden');
          }, 300);
        };

        // Eksekusi Form dengan Validasi Internal
        window.submitAdjust = function() {
          const form = document.getElementById('adjust-form');
          const debet = form.querySelector('input[name="debet"]').value;
          const kredit = form.querySelector('input[name="kredit"]').value;
          const notes = form.querySelector('input[name="notes"]').value;

          if (!debet && !kredit) {
             window.showToast('Silakan isi nominal Debet atau Kredit!', 'error');
             return;
          }

          if (!notes.trim()) {
             window.showToast('Catatan mutasi harus diisi!', 'error');
             return;
          }

          form.submit();
        };
      `}} />
    </div>,
    { title: 'Keuangan Vendor | Admin' }
  )
})
