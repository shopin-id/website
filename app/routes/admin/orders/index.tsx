import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  let orders: any[] = [];
  
  // Tangkap parameter status dari URL (contoh: ?status=pending)
  const statusParam = c.req.query('status');

  try {
    if (statusParam) {
      if (statusParam === 'confirmed') {
        // Menggabungkan status PAID dan COMPLETED (Case-insensitive)
        const { results } = await c.env.DB.prepare(`
          SELECT o.id, o.created_at, o.grand_total as total_amount, o.status,
                 u.name as customer_name, u.email as customer_email
          FROM orders o
          JOIN users u ON o.user_id = u.id
          WHERE LOWER(o.status) IN ('paid', 'completed') 
          ORDER BY o.created_at DESC
        `).all();
        orders = results || [];
      } else {
        // Pencarian aman tanpa peduli huruf besar/kecil di database
        const { results } = await c.env.DB.prepare(`
          SELECT o.id, o.created_at, o.grand_total as total_amount, o.status,
                 u.name as customer_name, u.email as customer_email
          FROM orders o
          JOIN users u ON o.user_id = u.id
          WHERE LOWER(o.status) = LOWER(?)
          ORDER BY o.created_at DESC
        `).bind(statusParam).all();
        orders = results || [];
      }
    } else {
      // Tampilkan semua jika tidak ada filter
      const { results } = await c.env.DB.prepare(`
        SELECT o.id, o.created_at, o.grand_total as total_amount, o.status,
               u.name as customer_name, u.email as customer_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `).all();
      orders = results || [];
    }
  } catch (e) {
    console.error("Order Fetch Error:", e);
    orders = [];
  }

  const formatIDR = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p || 0);

  // Terjemahkan status URL ke teks yang lebih enak dibaca untuk Header
  let statusTitle = "Semua Pesanan";
  if (statusParam === 'pending') statusTitle = "Pesanan Tertunda";
  if (statusParam === 'shipped') statusTitle = "Pesanan Dikirim";
  if (statusParam === 'confirmed') statusTitle = "Pesanan Dikonfirmasi";
  if (statusParam === 'cancelled') statusTitle = "Pesanan Dibatalkan";

  return c.render(
    <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-gray-200">
      
      {/* HEADER PAGE (Disamakan dengan halaman admin lainnya) */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
            Manajemen Pesanan <span className="text-gray-400 font-normal">| {statusTitle}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Pantau dan kelola seluruh transaksi pesanan pelanggan dari berbagai toko.
          </p>
        </div>
      </div>

      {/* TABEL DATA (Desain disamakan dengan tabel Anggota & Transaksi) */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-900 border-y border-gray-800 text-[11px] uppercase tracking-wider text-gray-200">
              <th className="p-3 font-bold w-48">Nomor Pesanan</th>
              <th className="p-3 font-bold">Tanggal Pesanan</th>
              <th className="p-3 font-bold">Detail Pelanggan</th>
              <th className="p-3 font-bold">Total Harga</th>
              <th className="p-3 font-bold text-center">Status Pembayaran & Aksi</th>
            </tr>
          </thead>
          <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 font-medium text-sm">
                  Tidak ada data pesanan untuk kategori ini.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const currentStatus = (order.status || 'pending').toLowerCase();
                
                // Pewarnaan baris tipis berdasarkan status
                let rowBg = "hover:bg-gray-50";
                if (currentStatus === 'cancelled') rowBg = "bg-red-50/30 hover:bg-red-50";
                if (currentStatus === 'completed' || currentStatus === 'paid') rowBg = "bg-green-50/30 hover:bg-green-50";

                return (
                  <tr key={order.id} className={`transition-colors ${rowBg}`}>
                    <td className="p-3 font-mono font-bold text-gray-800">{order.id}</td>
                    
                    <td className="p-3 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})} 
                      <span className="text-[10px] ml-1">{new Date(order.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-bold text-gray-900 uppercase tracking-widest">{order.customer_name || 'Unknown User'}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{order.customer_email || 'Tidak ada email'}</div>
                    </td>
                    
                    <td className="p-3 font-black text-blue-600 text-sm">
                      {formatIDR(order.total_amount)}
                    </td>
                    
                    <td className="p-3 text-center">
                      <select 
                        data-order-id={order.id}
                        className={`order-status-select border text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-sm outline-none cursor-pointer transition-colors
                          ${currentStatus === 'pending' ? 'border-amber-300 text-amber-700 bg-amber-50 focus:border-amber-500' : ''}
                          ${currentStatus === 'paid' ? 'border-blue-300 text-blue-700 bg-blue-50 focus:border-blue-500' : ''}
                          ${currentStatus === 'shipped' ? 'border-purple-300 text-purple-700 bg-purple-50 focus:border-purple-500' : ''}
                          ${currentStatus === 'completed' ? 'border-green-300 text-green-700 bg-green-50 focus:border-green-500' : ''}
                          ${currentStatus === 'cancelled' ? 'border-red-300 text-red-700 bg-red-50 focus:border-red-500' : ''}
                        `}
                      >
                        <option value="pending" selected={currentStatus === 'pending'}>TERTUNDA (PENDING)</option>
                        <option value="paid" selected={currentStatus === 'paid'}>DIBAYAR (PAID)</option>
                        <option value="shipped" selected={currentStatus === 'shipped'}>DIKIRIM (SHIPPED)</option>
                        <option value="completed" selected={currentStatus === 'completed'}>SELESAI (COMPLETED)</option>
                        <option value="cancelled" selected={currentStatus === 'cancelled'}>DIBATALKAN</option>
                      </select>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('.order-status-select').forEach(select => {
          select.addEventListener('change', async (e) => {
            const orderId = e.target.getAttribute('data-order-id');
            const newStatus = e.target.value;
            
            // Berikan efek visual loading pada select
            e.target.style.opacity = '0.5';
            e.target.disabled = true;

            try {
              const res = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: orderId, status: newStatus })
              });
              
              if(res.ok) {
                window.location.reload(); 
              } else {
                alert('Gagal memperbarui status pesanan.');
                e.target.style.opacity = '1';
                e.target.disabled = false;
              }
            } catch (err) {
              alert('Terjadi kesalahan jaringan.');
              e.target.style.opacity = '1';
              e.target.disabled = false;
            }
          });
        });
      `}} />
    </div>,
    { title: 'Manajemen Pesanan | Admin' }
  );
});
