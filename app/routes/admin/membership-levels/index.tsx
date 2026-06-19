import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'
import { generateId } from '../../../utils/admin_utils'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.text('Unauthorized', 401)

  const formData = await c.req.formData()
  const action = formData.get('action') as string

  if (action === 'create') {
    const name = formData.get('level_name') as string
    const price = parseFloat(formData.get('price') as string) || 0
    const bonus = parseFloat(formData.get('bonus') as string) || 0
    
    // BACA STRING LANGSUNG: Jika form kosong, jadikan 50. Jika ada isinya (termasuk "0"), jadikan angka.
    const limitRaw = formData.get('product_limit') as string
    const product_limit = (limitRaw !== null && limitRaw.trim() !== '') ? parseInt(limitRaw, 10) : 50
    
    const benefit = formData.get('benefit') as string
    const id = 'LVL-' + generateId().substring(0, 6).toUpperCase()

    try { await db.prepare("ALTER TABLE membership_levels ADD COLUMN product_limit INTEGER DEFAULT 50").run() } catch(e) {}

    await db.prepare(`
      INSERT INTO membership_levels (id, level_name, price, bonus, product_limit, benefit)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, name, price, bonus, product_limit, benefit).run()
  } 
  else if (action === 'update') {
    const id = formData.get('id') as string
    const price = parseFloat(formData.get('price') as string) || 0
    const bonus = parseFloat(formData.get('bonus') as string) || 0
    
    // BACA STRING LANGSUNG: Sama seperti di atas agar 0 tidak diubah otomatis
    const limitRaw = formData.get('product_limit') as string
    const product_limit = (limitRaw !== null && limitRaw.trim() !== '') ? parseInt(limitRaw, 10) : 50
    
    const benefit = formData.get('benefit') as string

    try { await db.prepare("ALTER TABLE membership_levels ADD COLUMN product_limit INTEGER DEFAULT 50").run() } catch(e) {}

    await db.prepare(`
      UPDATE membership_levels 
      SET price = ?, bonus = ?, product_limit = ?, benefit = ? 
      WHERE id = ?
    `).bind(price, bonus, product_limit, benefit, id).run()
  }

  return c.redirect('/admin/membership-levels?success=1')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  try { await db.prepare("ALTER TABLE membership_levels ADD COLUMN product_limit INTEGER DEFAULT 50").run() } catch(e) {}

  const { results: levels } = await db.prepare("SELECT * FROM membership_levels ORDER BY price ASC").all()
  const success = c.req.query('success')

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kelola Level Membership Vendor</h2>
          <p className="text-sm text-gray-500 mt-1">Atur harga pendaftaran, bonus, batas produk, dan keuntungan toko.</p>
        </div>
        
        {/* FORM INLINE TAMBAH LEVEL BARU */}
        <form action="/admin/membership-levels" method="POST" className="flex flex-wrap gap-2 items-center bg-gray-50 p-4 border border-gray-200 rounded-sm w-full xl:w-auto">
          <input type="hidden" name="action" value="create" />
          <input type="text" name="level_name" placeholder="Nama Level" required className="border border-gray-300 px-3 py-2 text-xs rounded-sm focus:ring-black w-24 font-bold" />
          <input type="number" name="price" placeholder="Harga Jual" required className="border border-gray-300 px-3 py-2 text-xs rounded-sm focus:ring-black w-24" />
          <input type="number" name="bonus" placeholder="Bonus Awal" required className="border border-gray-300 px-3 py-2 text-xs rounded-sm focus:ring-black w-24" />
          <input type="number" name="product_limit" placeholder="Batas Produk" required className="border border-gray-300 px-3 py-2 text-xs rounded-sm focus:ring-black w-24" title="Ketik 99999 untuk Unlimited" />
          <input type="text" name="benefit" placeholder="Deskripsi Benefit..." required className="border border-gray-300 px-3 py-2 text-xs rounded-sm focus:ring-black w-32" />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 text-xs font-bold rounded-sm hover:bg-green-700 uppercase tracking-wider whitespace-nowrap">
             + Tambah
          </button>
        </form>
      </div>

      {success && <div className="bg-green-50 text-green-700 border border-green-200 p-4 text-sm font-bold mb-6">✓ Perubahan tingkatan keanggotaan berhasil disimpan!</div>}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-y border-gray-200 text-[10px] uppercase tracking-widest text-gray-500">
              <th className="p-4 font-bold">Nama Level</th>
              <th className="p-4 font-bold">Harga Daftar (Rp)</th>
              <th className="p-4 font-bold">Bonus Saldo (Rp)</th>
              <th className="p-4 font-bold text-red-600">Batas Produk</th>
              <th className="p-4 font-bold">Deskripsi Benefit</th>
              <th className="p-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {levels.map((lvl: any) => {
              // KUNCI UTAMA: Evaluasi dulu nilainya. Jika benar-benar kosong/null jadikan 50.
              const currentLimit = (lvl.product_limit !== null && lvl.product_limit !== undefined) ? lvl.product_limit : 50;

              return (
                <tr key={lvl.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <form action="/admin/membership-levels" method="POST" className="m-0">
                    <input type="hidden" name="action" value="update" />
                    <input type="hidden" name="id" value={lvl.id} />
                    
                    <td className="p-4 font-black text-gray-900">{lvl.level_name}</td>
                    
                    <td className="p-4">
                       <input type="number" name="price" value={String(lvl.price || 0)} className="border border-gray-300 px-2 py-1 text-xs rounded-sm focus:ring-black font-bold w-28" />
                    </td>
                    
                    <td className="p-4">
                       <input type="number" name="bonus" value={String(lvl.bonus || 0)} className="border border-gray-300 px-2 py-1 text-xs rounded-sm focus:ring-black font-bold w-24 text-green-600" />
                    </td>

                    {/* PAKSA JADI STRING: String(0) hasilnya "0", jadi atribut tidak akan dihilangkan oleh JSX */}
                    <td className="p-4">
                       <input type="number" name="product_limit" value={String(currentLimit)} className="border border-red-300 px-2 py-1 text-xs rounded-sm focus:ring-red-500 font-bold w-20 text-red-600 bg-red-50" title="Isi 99999 untuk Unlimited" />
                    </td>
                    
                    <td className="p-4">
                       <input type="text" name="benefit" value={lvl.benefit || ''} className="border border-gray-300 px-2 py-1 text-xs rounded-sm focus:ring-black w-full min-w-[150px]" />
                    </td>
                    
                    <td className="p-4 text-right">
                       <button type="submit" className="bg-black text-white px-4 py-1.5 rounded-sm text-xs font-bold uppercase hover:bg-gray-800 transition-colors">
                          Simpan
                       </button>
                    </td>
                  </form>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
})
