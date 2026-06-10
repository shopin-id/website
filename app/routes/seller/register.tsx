import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  const user = await getAuthUser(c)
  if (!user) return c.redirect('/login')

  const existingStore = await db.prepare("SELECT id FROM stores WHERE user_id = ?").bind(user.id).first()
  if (existingStore) return c.redirect('/seller')

  // KONSISTEN: Ambil WhatsApp Admin dari platform_settings
  const settings = await db.prepare("SELECT whatsapp_number FROM platform_settings WHERE id = 1").first()
  const waNumber = settings?.whatsapp_number || '6281234567890'
  
  const waMessage = encodeURIComponent(`Halo Admin ShopinId,\n\nSaya ingin mendaftar sebagai Vendor/Boutique di marketplace. Berikut email akun saya: ${user.email}\n\nMohon instruksi selanjutnya.`);
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  return c.render(
    <div className="min-h-[80vh] bg-[#f4f7fc] flex items-center justify-center py-12 px-4">
      <div className="max-w-xl w-full bg-white p-8 md:p-10 rounded-sm shadow-sm border border-gray-200 text-center">
        <h1 className="text-2xl font-black tracking-tighter mb-4 uppercase">Buka Boutique Anda</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed border-b border-gray-100 pb-8">
          Untuk menjaga kualitas premium dan otentisitas barang di ShopinId, pembukaan toko (Vendor) dilakukan melalui proses kurasi. Silakan hubungi tim Admin kami melalui WhatsApp untuk membuka akses Seller Center Anda.
        </p>
        
        <a href={waLink} target="_blank" className="block w-full bg-black text-white font-bold py-4 rounded-sm hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm shadow-md">
          Ajukan Toko via WhatsApp
        </a>
      </div>
    </div>
  )
})
