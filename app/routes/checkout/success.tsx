import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const orderId = c.req.query('order_id')
  if (!orderId) return c.redirect('/')

  // === PERBAIKAN: Baca WA dari JSON store_settings dan ubah 0 jadi 62 ===
  let waNumber = '6281234567890'
  try {
    const settingRow = await db.prepare("SELECT config_json FROM store_settings WHERE id = 'global'").first()
    if (settingRow && settingRow.config_json) {
      const config = JSON.parse(settingRow.config_json as string)
      if (config.contact_phone) {
        let rawPhone = config.contact_phone.replace(/\D/g, '')
        if (rawPhone.startsWith('0')) {
          waNumber = '62' + rawPhone.substring(1)
        } else {
          waNumber = rawPhone
        }
      }
    }
  } catch (e) {
    console.error("Gagal membaca WA dari store_settings", e)
  }

  const order = await db.prepare("SELECT grand_total FROM orders WHERE id = ?").bind(orderId).first()

  const waMessage = encodeURIComponent(`Halo Admin ShopinId,\n\nSaya telah melakukan pesanan dengan detail berikut:\n*ID Pesanan:* ${orderId}\n*Total Tagihan:* Rp ${(order?.grand_total as number || 0).toLocaleString('id-ID')}\n\nMohon informasi rekening untuk pembayaran manual. Terima kasih.`);
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  return c.render(
    <div className="bg-[#f4f7fc] min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="bg-white max-w-lg w-full p-8 md:p-12 rounded-sm shadow-sm border border-gray-200 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-widest">Pesanan Tersimpan</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">Pesanan Anda <strong>{orderId}</strong> sedang menunggu pembayaran. Sistem kami menggunakan pembayaran manual via WhatsApp untuk verifikasi keamanan tingkat tinggi.</p>
        
        <div className="bg-gray-50 p-6 border border-gray-200 rounded-sm mb-8">
           <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Tagihan</p>
           <p className="text-3xl font-black text-red-600">Rp {(order?.grand_total as number || 0).toLocaleString('id-ID')}</p>
        </div>

        <a href={waLink} target="_blank" className="block w-full bg-green-500 text-white font-bold py-4 rounded-sm hover:bg-green-600 transition-colors uppercase tracking-widest text-sm shadow-md mb-4">
           Konfirmasi & Bayar via WhatsApp
        </a>
        <a href="/account/orders" className="block text-sm font-bold text-gray-500 hover:text-black">Lihat Riwayat Pesanan</a>
      </div>
    </div>
  )
})
