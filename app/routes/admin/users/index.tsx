import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'
import { generateId } from '../../../utils/admin_utils'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.text('Unauthorized', 401)

  const formData = await c.req.formData()
  const action = formData.get('action') as string

  // LOGIKA UTAMA: PROSES DEPOSIT MODAL HIJAU
  if (action === 'deposit') {
    const walletId = formData.get('wallet_id') as string
    const jumlah = parseFloat(formData.get('jumlah') as string) || 0
    const promosi = parseFloat(formData.get('promosi') as string) || 0
    const catatan = formData.get('catatan') as string || 'Deposit via Admin'

    if (!walletId) return c.redirect('/admin/users?err=missing_wallet')

    // 1. Tambahkan Saldo Utama + Saldo Promosi Bonus ke Dompet Vendor
    const totalSuntikan = jumlah + promosi
    await db.prepare(`
      UPDATE vendor_wallets 
      SET available_balance = available_balance + ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(totalSuntikan, walletId).run()

    // 2. Catat Mutasi Kredit Utama ke Ledger
    if (jumlah > 0) {
      await db.prepare(`
        INSERT INTO wallet_transactions (id, wallet_id, type, amount, description)
        VALUES (?, ?, 'deposit', ?, ?)
      `).bind(generateId(), walletId, jumlah, catatan).run()
    }

    // 3. Catat Mutasi Kredit Promosi/Bonus ke Ledger
    if (promosi > 0) {
      await db.prepare(`
        INSERT INTO wallet_transactions (id, wallet_id, type, amount, description)
        VALUES (?, ?, 'bonus', ?, ?)
      `).bind(generateId(), walletId, promosi, `[Bonus Promosi] ${catatan}`).run()
    }

    return c.redirect('/admin/users?success=deposited')
  }

  return c.redirect('/admin/users')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const success = c.req.query('success')
  const err = c.req.query('err')

  // Ambil daftar seluruh Anggota terikat dengan data Toko, Saldo Dompet (Kredit), dan Paket Level-nya
  const { results: members } = await db.prepare(`
    SELECT u.id as user_id, u.name, u.email, u.phone, u.gender, u.ip_address, u.created_at,
           u.bank_name, u.bank_account_name, u.bank_account_number,
           s.id as store_id, s.name as store_name, s.status as store_status,
           ml.level_name, w.id as wallet_id, w.available_balance as kredit
    FROM users u
    LEFT JOIN stores s ON u.id = s.user_id
    LEFT JOIN membership_levels ml ON s.level_id = ml.id
    LEFT JOIN vendor_wallets w ON s.id = w.store_id
    ORDER BY u.created_at DESC
  `).all()

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200">
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Daftar Anggota / Members</h2>
          <p className="text-sm text-gray-500 mt-0.5">Kelola data profil, rekening bank, mutasi kredit deposit, dan level paket mitra.</p>
        </div>
      </div>

      {success === 'deposited' && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 text-sm font-bold rounded-sm mb-6">
          ✓ Transaksi berhasil! Dana deposit dan promosi bonus telah sukses disuntikkan ke saldo kredit anggota.
        </div>
      )}

      {/* DATATABLE SANGAT LENGKAP MAP PERSIS SEPERTI DI VIDEO */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-gray-900 border-y border-gray-800 text-[11px] uppercase tracking-wider text-gray-200">
              <th className="p-3 text-center w-12 font-bold">#</th>
              <th className="p-3 font-bold">Nama Anggota</th>
              <th className="p-3 font-bold">Telepon / Email</th>
              <th className="p-3 font-bold">Kredit (Saldo)</th>
              <th className="p-3 text-center font-bold">L/P</th>
              <th className="p-3 font-bold">Area Pendaftaran / IP</th>
              <th className="p-3 font-bold">Nama Rekening Bank</th>
              <th className="p-3 font-bold">No. Rekening</th>
              <th className="p-3 text-center font-bold">Paket</th>
              <th className="p-3 text-center font-bold">Status</th>
              <th className="p-3 font-bold">Tanggal Gabung</th>
              <th className="p-3 text-right font-bold sticky right-0 bg-gray-900 shadow-md">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
            {members.map((m: any, idx: number) => {
              const isStoreActive = m.store_status === 'active';
              return (
                <tr key={m.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-center font-medium text-gray-400">{idx + 1}</td>
                  <td className="p-3">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      {m.name}
                      <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {m.level_name || 'LVL1'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Toko: {m.store_name || '-'}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{m.phone || '-'}</div>
                    <div className="text-[10px] text-gray-400">{m.email}</div>
                  </td>
                  <td className="p-3 font-black text-gray-900 text-sm">
                    Rp {(m.kredit || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-center uppercase font-bold text-gray-500">{m.gender || 'm'}</td>
                  <td className="p-3">
                    <div className="font-medium text-gray-800">Indonesia</div>
                    <div className="text-[10px] text-gray-400 font-mono">{m.ip_address || '66.102.0.0'}</div>
                  </td>
                  <td className="p-3 font-bold text-gray-800">{m.bank_account_name || 'Belum Diisi'}</td>
                  <td className="p-3 font-mono text-gray-600">
                    <div className="font-bold text-gray-900">{m.bank_name || '-'}</div>
                    <div>{m.bank_account_number || '-'}</div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-purple-50 border border-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      {m.level_name || 'LVL1'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isStoreActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isStoreActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400 whitespace-nowrap">{new Date(m.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'})}</td>
                  
                  {/* BUTTON ACTION DENGAN TOMBOL DEPOSIT MODAL HIJAU & LINK AKTIF */}
                  <td className="p-3 text-right whitespace-nowrap sticky right-0 bg-white shadow-md flex justify-end space-x-1.5">
                    
                    {/* Tombol Pesan (WhatsApp / Email) */}
                    <a 
                      href={m.phone ? `https://wa.me/${m.phone.replace(/^0/, '62')}` : `mailto:${m.email}`} 
                      target="_blank" 
                      className="bg-blue-50 text-blue-600 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-colors flex items-center"
                    >
                      Pesan
                    </a>
                    
                    {/* Tombol pemicu Modal Hijau Deposit */}
                    <button 
                      type="button" 
                      onClick={`window.openDepositModal('${m.wallet_id}', '${m.name}', '${m.kredit || 0}')`}
                      disabled={!m.wallet_id}
                      className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors ${!m.wallet_id ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                      Deposit
                    </button>
                    
                    {/* Tombol Edit Mengarah ke Halaman Khusus */}
                    <a 
                      href={`/admin/users/edit/${m.user_id}`} 
                      className="bg-gray-100 text-gray-600 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center"
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ==========================================
          MODAL DRAWER POP-UP DEPOSIT
          ========================================== */}
      <div id="deposit-modal" className="fixed inset-0 bg-black/60 z-[999] hidden items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-md p-6 shadow-2xl rounded-sm border border-gray-100">
          
          <div className="border-b border-gray-100 pb-3 mb-5 flex justify-between items-center">
            <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Formulir Suntik Kredit / Deposit</h3>
            <button onClick="window.closeDepositModal()" className="text-gray-400 hover:text-black focus:outline-none">✕</button>
          </div>

          <div className="bg-gray-50 p-3 border rounded-sm mb-5 text-xs text-gray-600 space-y-1">
            <div>Anggota: <strong id="modal-member-name" className="text-black"></strong></div>
            <div>Saldo Kredit Saat Ini: <strong id="modal-member-balance" className="text-green-600"></strong></div>
          </div>

          <form action="/admin/users" method="POST" className="space-y-4">
            <input type="hidden" name="action" value="deposit" />
            <input type="hidden" name="wallet_id" id="modal-wallet-id" />

            {/* Input 1: Jumlah Saldo Utama */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">Jumlah Setor Utama (Rp)</label>
              <input type="number" name="jumlah" value="0" required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black focus:border-black font-bold" placeholder="Masukkan nominal uang..." />
            </div>

            {/* Input 2: Dropdown / Isian Promosi Bonus */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">Promosi / Bonus Tambahan (Rp)</label>
              <input type="number" name="promosi" value="0" required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-green-600 focus:border-green-600 font-bold text-green-700" placeholder="Masukkan nominal bonus..." />
              <p className="text-[10px] text-gray-400 mt-1">Gunakan untuk menyuntikkan bonus komitmen pendaftaran awal (misal Rp 13.000).</p>
            </div>

            {/* Input 3: Catatan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">Catatan Transaksi</label>
              <textarea name="catatan" rows={2} required className="w-full border border-gray-300 px-3 py-2 text-xs rounded-sm focus:ring-black focus:border-black" placeholder="Contoh: Bonus pendaftaran upgrade akun LVL1..."></textarea>
            </div>

            {/* Tombol Aksi Simpan / Batal */}
            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
              <button type="button" onClick="window.closeDepositModal()" className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors">
                Batalkan
              </button>
              <button type="submit" className="bg-green-600 text-white px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-green-700 shadow-md transition-colors">
                Simpan
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* JAVASCRIPT BINDING KONTROL MODAL DYNAMIC */}
      <script dangerouslySetInnerHTML={{__html: `
        window.openDepositModal = function(walletId, name, balance) {
          document.getElementById('modal-wallet-id').value = walletId;
          document.getElementById('modal-member-name').innerText = name;
          document.getElementById('modal-member-balance').innerText = 'Rp ' + parseInt(balance).toLocaleString('id-ID');
          document.getElementById('deposit-modal').style.display = 'flex';
        };
        window.closeDepositModal = function() {
          document.getElementById('deposit-modal').style.display = 'none';
        };
      `}} />

    </div>,
    { title: 'Anggota | Admin' }
  )
})
