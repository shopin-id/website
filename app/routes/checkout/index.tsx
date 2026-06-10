import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../utils/auth'

export default createRoute(async (c) => {
  const user = await getAuthUser(c)
  const err = c.req.query('err')

  return c.render(
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Checkout</h1>
      
      {err === 'email_terdaftar' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-sm text-red-700">Email yang Anda masukkan sudah terdaftar. Silakan <a href="/login" className="font-bold underline hover:text-black">Masuk (Login)</a> terlebih dahulu atau gunakan email lain.</p>
        </div>
      )}
      
      <form action="/checkout/process" method="POST" className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Keranjang (Diisi oleh client.ts) */}
        <input type="hidden" name="cart_data" id="cartDataInput" value="[]" />

        <div className="space-y-8">
          
          {/* Blok Pendaftaran Otomatis (Hanya muncul jika belum login) */}
          {!user && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Informasi Akun (Pendaftaran)</h2>
              <p className="text-sm text-gray-500 mb-4">Buat akun untuk melacak pesanan dan mempercepat checkout Anda selanjutnya.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input type="text" name="name" required className="w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" placeholder="John Doe"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
                  <input type="email" name="email" required className="w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" placeholder="nama@email.com"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buat Kata Sandi</label>
                  <input type="password" name="password" required minLength={6} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" placeholder="Minimal 6 karakter" />
                </div>
              </div>
            </div>
          )}

          {/* Form Informasi Pengiriman */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Informasi Pengiriman</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
              <textarea 
                name="address" 
                required 
                rows={4} 
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black p-2 border" 
                placeholder="Jalan, RT/RW, Kota, Kode Pos"
              ></textarea>
            </div>
          </div>

        </div>

        {/* Form Metode Pembayaran */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-fit">
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Metode Pembayaran</h2>
            <div className="space-y-3 mt-4">
              <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" name="payment_method" value="automatic" className="h-4 w-4 text-black focus:ring-black" defaultChecked />
                <span className="ml-3 font-medium text-gray-900">Pembayaran Otomatis (Virtual Account/CC)</span>
              </label>
              
              <label className="flex items-center p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" name="payment_method" value="manual" className="h-4 w-4 text-black focus:ring-black" />
                <span className="ml-3 font-medium text-gray-900">Transfer Bank Manual</span>
              </label>
            </div>
          </div>

          <button type="submit" className="mt-8 w-full bg-black text-white py-4 px-4 rounded-md hover:bg-gray-800 font-bold uppercase tracking-wide transition-colors">
            Selesaikan Pesanan
          </button>
        </div>
      </form>
    </div>
  )
})
