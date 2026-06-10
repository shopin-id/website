import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  return c.render(
    <div className="max-w-7xl mx-auto py-10 px-4 min-h-[70vh]">
      <h1 className="text-3xl md:text-4xl font-black mb-8 text-gray-900 uppercase tracking-widest">Keranjang Belanja</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Kolom Daftar Produk (Kiri) */}
        <div className="lg:col-span-2">
          <div id="cart-items-container" className="space-y-4">
            <p className="text-gray-500 font-bold animate-pulse">Memuat keranjang Anda...</p>
          </div>
        </div>

        {/* Kolom Ringkasan Pesanan (Kanan - Sticky) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 sticky top-24">
            <h2 className="text-lg font-bold border-b pb-4 mb-4 uppercase tracking-widest text-gray-900">Ringkasan Pesanan</h2>
            
            <div className="flex justify-between mb-3 text-sm text-gray-600">
              <span className="font-medium">Subtotal (<span id="summary-count">0</span> Item)</span>
              <span id="summary-subtotal" className="font-bold text-black tracking-tight">Rp 0</span>
            </div>
            <div className="flex justify-between mb-4 text-sm text-gray-600">
              <span className="font-medium">Estimasi Ongkir</span>
              <span className="font-bold text-gray-400 italic text-[11px]">Dihitung saat Checkout</span>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6 flex justify-between items-center">
              <span className="font-bold text-gray-900 uppercase tracking-wider text-sm">Total Sementara</span>
              <span id="summary-total" className="font-black text-red-600 text-xl tracking-tight">Rp 0</span>
            </div>

            <a href="/checkout" className="block w-full bg-black text-white text-center py-4 rounded-sm font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors shadow-md">
              Lanjut ke Checkout
            </a>
            <a href="/products" className="block text-center mt-4 text-xs font-bold text-gray-500 hover:text-black uppercase tracking-widest transition-colors">
              Lanjut Belanja Produk Lain
            </a>
          </div>
        </div>

      </div>

      {/* Mesin Javascript Khusus Halaman Cart */}
      <script dangerouslySetInnerHTML={{__html: `
        function renderCart() {
          const cart = JSON.parse(localStorage.getItem('shopin_cart') || '[]');
          const container = document.getElementById('cart-items-container');
          
          if(cart.length === 0) {
            container.innerHTML = \`
              <div class="text-center py-20 bg-white border border-gray-200 rounded-sm shadow-sm">
                <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <h2 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-widest">Keranjang Kosong</h2>
                <p class="text-sm text-gray-500 mb-8 max-w-md mx-auto">Anda belum menambahkan kemewahan apapun ke dalam keranjang. Mulai jelajahi koleksi kami sekarang.</p>
                <a href="/products" class="inline-block bg-black text-white px-8 py-3.5 font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-gray-800 shadow-md transition-colors">Jelajahi Katalog</a>
              </div>
            \`;
            document.getElementById('summary-count').innerText = '0';
            document.getElementById('summary-subtotal').innerText = 'Rp 0';
            document.getElementById('summary-total').innerText = 'Rp 0';
            return;
          }

          let html = '';
          let totalItems = 0;
          let subtotal = 0;

          cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalItems += item.quantity;
            subtotal += itemTotal;

            const formattedPrice = new Intl.NumberFormat('id-ID').format(item.price);
            const formattedTotal = new Intl.NumberFormat('id-ID').format(itemTotal);
            const imgUrl = item.image || '/placeholder.jpg';

            html += \`
              <div class="flex flex-col sm:flex-row items-start sm:items-center bg-white p-4 md:p-6 border border-gray-200 rounded-sm gap-6 shadow-sm hover:shadow-md transition-shadow">
                <a href="/products/\${item.slug || '#'}" class="flex-shrink-0">
                  <img src="\${imgUrl}" alt="\${item.name}" class="w-24 h-32 md:w-32 md:h-40 object-cover bg-gray-50 border border-gray-100 rounded-sm" />
                </a>
                
                <div class="flex-grow w-full">
                  <h3 class="font-black text-gray-900 line-clamp-2 text-sm md:text-base mb-1 uppercase tracking-tight">\${item.name}</h3>
                  <p class="text-gray-500 font-bold text-xs mb-4">HARGA SATUAN: <span class="text-black">Rp \${formattedPrice}</span></p>
                  
                  <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-4">
                      <div class="flex items-center border border-gray-300 rounded-sm bg-white">
                        <button type="button" class="w-8 h-8 flex justify-center items-center hover:bg-gray-100 font-bold text-gray-600 transition-colors" onclick="updateQty(\${index}, -1)">-</button>
                        <span class="w-10 h-8 flex justify-center items-center text-sm font-bold border-x border-gray-300 text-black">\${item.quantity}</span>
                        <button type="button" class="w-8 h-8 flex justify-center items-center hover:bg-gray-100 font-bold text-gray-600 transition-colors" onclick="updateQty(\${index}, 1)">+</button>
                      </div>
                      
                      <button type="button" class="text-[10px] text-gray-400 hover:text-red-600 font-bold uppercase tracking-wider flex items-center transition-colors" onclick="removeItem(\${index})">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Hapus
                      </button>
                    </div>

                    <div class="text-right">
                      <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Total Harga</p>
                      <p class="font-black text-red-600 text-lg tracking-tight">Rp \${formattedTotal}</p>
                    </div>
                  </div>
                </div>
              </div>
            \`;
          });

          container.innerHTML = html;
          document.getElementById('summary-count').innerText = totalItems;
          const formattedSub = new Intl.NumberFormat('id-ID').format(subtotal);
          document.getElementById('summary-subtotal').innerText = 'Rp ' + formattedSub;
          document.getElementById('summary-total').innerText = 'Rp ' + formattedSub;
        }

        window.updateQty = function(index, change) {
          let cart = JSON.parse(localStorage.getItem('shopin_cart') || '[]');
          if(!cart[index]) return;
          
          cart[index].quantity += change;
          if(cart[index].quantity < 1) cart[index].quantity = 1; // Minimal 1 barang
          
          localStorage.setItem('shopin_cart', JSON.stringify(cart));
          window.dispatchEvent(new Event('cartUpdated')); // Update ikon header
          renderCart(); // Render ulang keranjang
        }

        window.removeItem = function(index) {
          let cart = JSON.parse(localStorage.getItem('shopin_cart') || '[]');
          cart.splice(index, 1);
          localStorage.setItem('shopin_cart', JSON.stringify(cart));
          window.dispatchEvent(new Event('cartUpdated')); // Update ikon header
          renderCart(); // Render ulang keranjang
        }

        // Jalankan saat masuk halaman
        document.addEventListener('DOMContentLoaded', renderCart);
      `}} />
    </div>
  )
})
