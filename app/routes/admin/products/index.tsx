import { createRoute } from 'honox/factory'
import { getAuthUser } from '../../../utils/auth'

export const POST = createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.text('Unauthorized', 401)

  const formData = await c.req.formData()
  const action = formData.get('action') as string
  const id = formData.get('id') as string

  if (action === 'delete' && id) {
    try {
      // 1. Coba Hapus Permanen (Hard Delete)
      await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run()
      return c.redirect('/admin/products?success=deleted')
    } catch (error: any) {
      // 2. Jika gagal karena produk terkait dengan nota pesanan (RESTRICT), lakukan Soft Delete
      if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
        await db.prepare("UPDATE products SET is_active = 0 WHERE id = ?").bind(id).run()
        return c.redirect('/admin/products?success=soft_deleted')
      }
      return c.redirect('/admin/products?err=delete_failed')
    }
  }

  return c.redirect('/admin/products')
})

export default createRoute(async (c) => {
  const db = c.env.DB
  const admin = await getAuthUser(c)
  if (!admin || admin.role !== 'admin') return c.redirect('/login')

  const success = c.req.query('success')
  const err = c.req.query('err')

  // Tarik seluruh data produk gabung dengan nama Kategori dan nama Toko/Vendor
  const { results: products } = await db.prepare(`
    SELECT p.id, p.name, p.brand, p.price, p.stock, p.is_active, p.images_json, p.created_at,
           c.name as category_name, s.name as store_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN stores s ON p.store_id = s.id
    ORDER BY p.created_at DESC
  `).all()

  const formatIDR = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p || 0)

  // LOGIKA TOAST NOTIFICATION MODERN
  let toast = null;
  if (success === 'deleted') {
    toast = { type: 'success', title: 'Berhasil Dihapus', message: 'Produk telah dihapus permanen dari database.', icon: '✓', color: 'bg-green-500' };
  } else if (success === 'soft_deleted') {
    toast = { type: 'warning', title: 'Produk Disembunyikan', message: 'Produk dinonaktifkan karena terikat dengan riwayat pesanan aktif.', icon: '⚠', color: 'bg-amber-500' };
  } else if (err === 'delete_failed') {
    toast = { type: 'error', title: 'Gagal Menghapus', message: 'Terjadi kesalahan sistem saat memproses permintaan.', icon: '✕', color: 'bg-red-500' };
  }

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200 relative min-h-screen">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; visibility: hidden; }
        }
        .animate-slideInRight {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fadeOut {
          animation: fadeOut 0.4s ease-out forwards;
        }
      `}} />

      {/* FLOATING TOAST NOTIFICATION (CANTIK & PROFESIONAL) */}
      {toast && (
        <div id="modern-toast" className="fixed top-6 right-6 z-[999] flex items-stretch bg-white shadow-2xl border border-gray-100 rounded-sm overflow-hidden animate-slideInRight w-80">
          <div className={`flex items-center justify-center w-12 text-white font-black text-xl ${toast.color}`}>
            {toast.icon}
          </div>
          <div className="p-4 flex-1">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{toast.title}</h4>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick="closeToast()" className="absolute top-2 right-2 text-gray-400 hover:text-black transition-colors focus:outline-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          {/* Progress Bar Loading Toast */}
          <div className={`absolute bottom-0 left-0 h-1 ${toast.color} animate-[shrink_4s_linear_forwards]`} style={{ width: '100%' }}></div>
        </div>
      )}

      {/* HEADER PAGE */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Katalog Produk Global</h2>
          <p className="text-sm text-gray-500 mt-0.5">Kelola seluruh produk, hapus item, dan pantau stok dari berbagai vendor.</p>
        </div>
        <a href="/admin/products/new" className="bg-green-600 text-white px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-green-700 shadow-md transition-colors">
          + Tambah Produk
        </a>
      </div>

      {/* TABEL DATA */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-900 border-y border-gray-800 text-[11px] uppercase tracking-wider text-gray-200">
              <th className="p-3 w-16 text-center font-bold">Foto</th>
              <th className="p-3 font-bold">Nama Produk & Brand</th>
              <th className="p-3 font-bold">Toko / Vendor</th>
              <th className="p-3 font-bold">Harga & Stok</th>
              <th className="p-3 text-center font-bold">Status</th>
              <th className="p-3 font-bold">Tanggal Dibuat</th>
              <th className="p-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">Belum ada produk yang terdaftar.</td>
              </tr>
            ) : (
              products.map((p: any) => {
                let images = []
                try { images = JSON.parse(p.images_json || '[]') } catch(e) {}
                const mainImg = images[0] || '/placeholder.jpg'

                return (
                  <tr key={p.id} className={`transition-colors ${p.is_active ? 'hover:bg-gray-50' : 'bg-red-50/30 opacity-70'}`}>
                    <td className="p-3 text-center">
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-sm overflow-hidden flex items-center justify-center mx-auto">
                        <img src={mainImg} alt={p.name} className="object-cover w-full h-full" loading="lazy" />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-gray-900 line-clamp-1" title={p.name}>{p.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border">{p.brand}</span>
                        <span className="text-[10px] text-gray-400">{p.category_name || 'Tanpa Kategori'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-blue-700 uppercase tracking-widest text-[10px]">
                        {p.store_name || 'ShopinId Direct'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-black text-gray-900 text-sm">{formatIDR(p.price)}</div>
                      <div className="text-[10px] font-bold text-gray-500 mt-0.5">Sisa Stok: <span className={p.stock <= 5 ? "text-red-500" : "text-green-600"}>{p.stock}</span></div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                    </td>
                    
                    {/* TOMBOL AKSI MODERN MEMANGGIL MODAL */}
                    <td className="p-3 text-right whitespace-nowrap space-x-1.5 flex justify-end items-center">
                      <a 
                        href={`/admin/products/edit/${p.id}`} 
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors inline-block"
                      >
                        Edit
                      </a>
                      
                      <button 
                        type="button" 
                        onClick={`openDeleteModal('${p.id}', '${p.name.replace(/'/g, "\\'")}')`}
                        className="bg-red-50 text-red-600 px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ==========================================
          MODAL DRAWER POP-UP KONFIRMASI HAPUS
          ========================================== */}
      <div id="delete-modal" className="fixed inset-0 bg-black/60 z-[999] hidden items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300 opacity-0">
        <div id="delete-modal-box" className="bg-white w-full max-w-sm p-6 shadow-2xl rounded-sm border border-gray-100 transform scale-95 transition-transform duration-300">
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Konfirmasi Hapus</h3>
          </div>

          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            Apakah Anda yakin ingin menghapus produk <strong id="modal-product-name" className="text-gray-900 border-b border-gray-300"></strong>? Tindakan ini akan menghapus data secara permanen. Jika produk sudah pernah dibeli, sistem hanya akan menyembunyikannya.
          </p>

          <form action="/admin/products" method="POST" className="flex justify-end space-x-2 m-0">
            <input type="hidden" name="action" value="delete" />
            <input type="hidden" name="id" id="modal-product-id" />
            <button type="button" onClick="closeDeleteModal()" className="px-4 py-2 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-gray-200 transition-colors">
              Batalkan
            </button>
            <button type="submit" className="px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-red-700 shadow-md transition-colors">
              Ya, Hapus
            </button>
          </form>

        </div>
      </div>

      {/* SCRIPT KONTROL UI MODERN */}
      <script dangerouslySetInnerHTML={{__html: `
        // Logika Toast Otomatis Hilang
        const toast = document.getElementById('modern-toast');
        if (toast) {
          setTimeout(() => {
            closeToast();
          }, 4000); // Hilang dalam 4 detik
        }

        window.closeToast = function() {
          if(toast) {
            toast.classList.add('animate-fadeOut');
            setTimeout(() => toast.remove(), 400);
          }
        };

        // Logika Modal Hapus
        window.openDeleteModal = function(id, name) {
          document.getElementById('modal-product-id').value = id;
          document.getElementById('modal-product-name').innerText = name;
          
          const modal = document.getElementById('delete-modal');
          const box = document.getElementById('delete-modal-box');
          
          modal.classList.remove('hidden');
          // Trick to allow display:block to render before transitioning opacity
          requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            box.classList.remove('scale-95');
          });
        };

        window.closeDeleteModal = function() {
          const modal = document.getElementById('delete-modal');
          const box = document.getElementById('delete-modal-box');
          
          modal.classList.add('opacity-0');
          box.classList.add('scale-95');
          
          setTimeout(() => {
            modal.classList.add('hidden');
          }, 300); // Sesuai dengan durasi transisi
        };
        
        // CSS animasi garis loading toast
        const style = document.createElement('style');
        style.innerHTML = '@keyframes shrink { from { width: 100%; } to { width: 0%; } } .animate-\\\\[shrink_4s_linear_forwards\\\\] { animation: shrink 4s linear forwards; }';
        document.head.appendChild(style);
      `}} />

    </div>,
    { title: 'Katalog Produk | Admin' }
  )
})
