import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const id = c.req.param('id')
  const formData = await c.req.formData()
  
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const gender = formData.get('gender') as string
  
  // Menangkap data bank_name dari hidden input yang diisi oleh Javascript
  const bankName = formData.get('bank_name') as string 
  const bankAccountName = formData.get('bank_account_name') as string
  const bankAccountNumber = formData.get('bank_account_number') as string
  const levelId = formData.get('level_id') as string

  await db.prepare(`
    UPDATE users 
    SET name = ?, phone = ?, gender = ?, bank_name = ?, bank_account_name = ?, bank_account_number = ?
    WHERE id = ?
  `).bind(name, phone, gender, bankName, bankAccountName, bankAccountNumber, id).run()

  if (levelId) {
    await db.prepare("UPDATE stores SET level_id = ? WHERE user_id = ?").bind(levelId, id).run()
  }

  return c.redirect(`/admin/users/edit/${id}?success=1`)
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const id = c.req.param('id')
  const success = c.req.query('success')

  const user = await db.prepare(`
    SELECT u.*, s.level_id 
    FROM users u
    LEFT JOIN stores s ON u.id = s.user_id
    WHERE u.id = ?
  `).bind(id).first()

  if (!user) return c.redirect('/admin/users')

  const { results: levels } = await db.prepare("SELECT id, level_name FROM membership_levels ORDER BY price ASC").all()
  
  // AMBIL DATA BANK AKTIF UNTUK DROPDOWN
  let banks = []
  try {
    const { results } = await db.prepare("SELECT bank_name, transfer_code FROM bank_transfers WHERE is_active = 1 ORDER BY bank_name ASC").all()
    banks = results
  } catch(e) {}

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 max-w-3xl mx-auto mt-6">
      
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Edit Data Anggota</h2>
          <p className="text-sm text-gray-500">Ubah profil, perbankan, dan paket keanggotaan.</p>
        </div>
        <a href="/admin/users" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black">
          ← Kembali
        </a>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 text-sm font-bold rounded-sm mb-6">
          ✓ Data anggota berhasil diperbarui!
        </div>
      )}

      <form method="POST" className="space-y-6">
        
        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Informasi Dasar</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                 <input type="text" name="name" value={user.name as string || ''} required className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email (Hanya Baca)</label>
                 <input type="email" value={user.email as string || ''} disabled className="w-full border border-gray-200 bg-gray-100 px-3 py-2 text-sm rounded-sm text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nomor Telepon</label>
                 <input type="text" name="phone" value={user.phone as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Jenis Kelamin</label>
                 <select name="gender" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white">
                    <option value="m" selected={user.gender === 'm'}>Laki-laki (M)</option>
                    <option value="f" selected={user.gender === 'f'}>Perempuan (F)</option>
                 </select>
              </div>
           </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
           <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Perbankan & Keanggotaan</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* KOMPONEN PENCARIAN BANK CERDAS */}
              <div className="relative md:col-span-2">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Pilih / Cari Nama Bank</label>
                 
                 {/* Input tersembunyi yang akan dikirim ke server */}
                 <input type="hidden" name="bank_name" id="hidden-bank-name" value={user.bank_name as string || ''} />
                 
                 {/* Input pencarian yang dilihat pengguna */}
                 <input 
                   type="text" 
                   id="bank-search-input" 
                   value={user.bank_name as string || ''} 
                   placeholder="Ketik nama bank atau kode (Cth: BCA, BNI, Mandiri)..." 
                   className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white" 
                   autoComplete="off" 
                 />
                 
                 {/* Daftar Dropdown Bank */}
                 <ul id="bank-list" className="absolute z-20 w-full bg-white border border-gray-200 mt-1 max-h-48 overflow-y-auto hidden shadow-xl rounded-sm">
                   {banks.map((bank: any, idx: number) => (
                     <li 
                       key={idx} 
                       className="px-3 py-2 border-b border-gray-50 hover:bg-gray-100 cursor-pointer bank-item flex justify-between items-center"
                       data-name={bank.bank_name}
                       data-code={bank.transfer_code}
                       onclick={`window.selectBank('${bank.bank_name.replace(/'/g, "\\'")}')`}
                     >
                       <span className="font-bold text-gray-800 text-sm">{bank.bank_name}</span>
                       <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-sm font-mono tracking-widest">{bank.transfer_code}</span>
                     </li>
                   ))}
                   <li id="bank-not-found" className="px-3 py-3 text-sm text-gray-400 text-center hidden">Bank tidak ditemukan.</li>
                 </ul>
              </div>

              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Pemilik Rekening</label>
                 <input type="text" name="bank_account_name" value={user.bank_account_name as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nomor Rekening</label>
                 <input type="text" name="bank_account_number" value={user.bank_account_number as string || ''} className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black" />
              </div>
              
              <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                 <label className="block text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-1">Level Paket Mitra (Toko)</label>
                 <select name="level_id" className="w-full border border-gray-300 px-3 py-2 text-sm rounded-sm focus:ring-black bg-white font-bold text-blue-700">
                    <option value="">-- Tidak Memiliki Toko --</option>
                    {levels.map((lvl: any) => (
                       <option key={lvl.id} value={lvl.id} selected={user.level_id === lvl.id}>{lvl.level_name}</option>
                    ))}
                 </select>
              </div>
           </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-black text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-800 shadow-md transition-all">
            Simpan Perubahan
          </button>
        </div>
      </form>

      {/* SCRIPT LOGIKA PENCARIAN BANK */}
      <script dangerouslySetInnerHTML={{__html: `
        const searchInput = document.getElementById('bank-search-input');
        const hiddenInput = document.getElementById('hidden-bank-name');
        const bankList = document.getElementById('bank-list');
        const bankItems = document.querySelectorAll('.bank-item');
        const notFound = document.getElementById('bank-not-found');

        searchInput.addEventListener('focus', () => {
          bankList.classList.remove('hidden');
        });

        // Delay blur agar klik pada item list sempat tereksekusi
        searchInput.addEventListener('blur', () => {
          setTimeout(() => bankList.classList.add('hidden'), 200);
        });

        // Logika Filter (Bisa cari nama atau kode transfer)
        searchInput.addEventListener('input', (e) => {
          const val = e.target.value.toLowerCase();
          let count = 0;
          
          bankItems.forEach(item => {
            const name = item.getAttribute('data-name').toLowerCase();
            const code = item.getAttribute('data-code').toLowerCase();
            
            if (name.includes(val) || code.includes(val)) {
              item.style.display = 'flex';
              count++;
            } else {
              item.style.display = 'none';
            }
          });

          if (count === 0) {
            notFound.style.display = 'block';
          } else {
            notFound.style.display = 'none';
          }
        });

        // Fungsi memilih bank
        window.selectBank = function(bankName) {
          searchInput.value = bankName;
          hiddenInput.value = bankName;
          bankList.classList.add('hidden');
        };
      `}} />

    </div>,
    { title: 'Edit Anggota | Admin' }
  )
})
