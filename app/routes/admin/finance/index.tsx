import { createRoute } from 'honox/factory'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const formData = await c.req.formData()
  const walletId = formData.get('wallet_id') as string
  const amount = parseInt(formData.get('amount') as string, 10)

  // Suntik/Kurangi saldo available (Hanya Super Admin)
  await db.prepare(`
    UPDATE vendor_wallets 
    SET available_balance = available_balance + ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(amount, walletId).run()

  return c.redirect('/admin/finance?success=injected')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const success = c.req.query('success')
  
  const { results: wallets } = await db.prepare(`
    SELECT w.id, w.pending_balance, w.available_balance, w.updated_at, s.name as store_name
    FROM vendor_wallets w
    JOIN stores s ON w.store_id = s.id
    ORDER BY w.available_balance DESC
  `).all()

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Keuangan & Saldo Vendor</h2>
      <p className="text-sm text-gray-500 mb-6">Kelola dan suntik saldo vendor secara manual.</p>

      {success === 'injected' && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-sm mb-6">
          <p className="text-sm text-green-700 font-bold">Saldo dompet vendor berhasil disesuaikan!</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-y border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-bold">Boutique (Vendor)</th>
              <th className="p-4 font-bold">Saldo Tersedia</th>
              <th className="p-4 font-bold">Aksi (Suntik Saldo)</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {wallets.map((w: any) => (
              <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-900">{w.store_name}</td>
                <td className="p-4 font-black text-green-600">Rp {(w.available_balance as number).toLocaleString('id-ID')}</td>
                <td className="p-4">
                  {/* Form Suntik Saldo Cepat */}
                  <form action="/admin/finance" method="POST" className="flex items-center space-x-2">
                    <input type="hidden" name="wallet_id" value={w.id} />
                    <input type="number" name="amount" placeholder="Nominal (+/-)" required className="border border-gray-300 px-3 py-1.5 rounded-sm text-xs w-32 focus:ring-black" />
                    <button type="submit" className="bg-black text-white px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-800">Ubah Saldo</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})
