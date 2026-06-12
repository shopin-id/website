import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  
  // Tangkap parameter pesanan dari URL (Asumsi: redirect dari proses checkout melempar ?order_id=...&amount=...)
  const orderId = c.req.query('order_id') || c.req.query('id') || 'ORD-UNKNOWN'
  
  let totalAmount = 0
  
  try {
    // Upaya 1: Tarik total tagihan dari database langsung jika tabel orders sudah tersedia
    const order = await db.prepare("SELECT total_amount FROM orders WHERE id = ?").bind(orderId).first()
    if (order) {
      totalAmount = order.total_amount as number
    }
  } catch(e) {
    // Abaikan jika tabel orders belum siap
  }

  // Upaya 2: Tangkap dari query parameter jika database gagal/kosong
  if (totalAmount === 0) {
    totalAmount = parseInt(c.req.query('amount') || '0', 10)
  }

  // === TARIK NOMOR WA DARI PENGATURAN GLOBAL (JSON) ===
  let waNumber = "6281234567890" // Angka fallback darurat jika pengaturan belum diisi
  
  try {
    const settingRow = await db.prepare("SELECT config_json FROM store_settings WHERE id = 'global'").first()
    
    if (settingRow && settingRow.config_json) {
      const config = JSON.parse(settingRow.config_json as string)
      
      if (config.contact_phone) {
        // Bersihkan semua karakter selain angka (menghapus spasi, +, atau strip)
        let rawPhone = config.contact_phone.replace(/\D/g, '')
        
        // Logika konversi: Ubah angka 0 di depan menjadi 62
        if (rawPhone.startsWith('0')) {
          waNumber = '62' + rawPhone.substring(1)
        } else {
          waNumber = rawPhone
        }
      }
    }
  } catch (e) {
    console.error("Gagal menarik nomor WA dari settings:", e)
  }

  // === RAKIT TAUTAN WHATSAPP DINAMIS ===
  const waText = encodeURIComponent(`Halo Admin ShopinId,\n\nSaya telah melakukan pesanan dengan detail berikut:\n*ID Pesanan:* ${orderId}\n*Total Tagihan:* Rp ${totalAmount.toLocaleString('id-ID')}\n\nMohon informasi rekening untuk pembayaran manual. Terima kasih.`)
  
  const waLink = `https://wa.me/${waNumber}?text=${waText}`

  return c.render(
    <div className="min-h-screen bg-[#f4f7fc] flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-sm shadow-xl max-w-md w-full text-center border-t-4 border-green-500">
        
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Pesanan Berhasil!</h1>
        <p className="text-sm text-gray-500 mb-6">Terima kasih. Pesanan Anda telah masuk ke dalam sistem kami.</p>
        
        {/* KARTU RINCIAN */}
        <div className="bg-gray-50 p-5 rounded-sm border border-gray-100 mb-8 text-left shadow-inner">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID Pesanan</p>
          <p className="text-sm font-black text-gray-900 mb-4">{orderId}</p>
          
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Tagihan</p>
          <p className="text-2xl font-black text-green-600">Rp {totalAmount.toLocaleString('id-ID')}</p>
        </div>
        
        {/* TOMBOL WHATSAPP OTOMATIS */}
        <a 
          href={waLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-4 rounded-sm font-bold uppercase tracking-widest text-xs transition-colors shadow-md mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.237a9.994 9.994 0 004.779 1.216h.004c5.502 0 9.985-4.48 9.985-9.99S17.518 2 12.012 2zm0 16.972h-.003a8.31 8.31 0 01-4.24-1.157l-.304-.18-3.155.746.84-3.079-.197-.313A8.272 8.272 0 013.684 11.99C3.684 7.399 7.42 3.666 12.016 3.666 14.246 3.666 16.34 4.536 17.915 6.11c1.576 1.575 2.443 3.67 2.443 5.897 0 4.587-3.737 8.322-8.332 8.322l-.014-.002zm4.568-6.236c-.25-.125-1.482-.733-1.712-.816-.23-.084-.398-.125-.565.125-.168.25-.648.816-.795.983-.146.167-.294.188-.544.063-.25-.125-1.057-.39-2.014-1.088-.745-.544-1.248-1.215-1.395-1.465-.147-.25-.015-.385.11-.51.112-.112.25-.292.375-.439.124-.146.166-.25.25-.417.084-.167.042-.313-.021-.438-.063-.125-.566-1.365-.776-1.87-.203-.49-.411-.424-.565-.432-.146-.007-.313-.007-.481-.007-.168 0-.44.063-.67.313-.23.25-.88.86 1.395.23 1.104.776 1.776.985 2.026.208.25.46.25.648.167s.48-.354.647-.71c.167-.354.167-.666.115-.73-.05-.062-.187-.083-.437-.208z"/>
          </svg>
          Konfirmasi via WhatsApp
        </a>
        
        <a href="/" className="block text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors">
          Kembali ke Beranda
        </a>
      </div>
    </div>,
    { title: 'Checkout Berhasil' }
  )
})
