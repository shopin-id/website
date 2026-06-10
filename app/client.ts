// app/client.ts
// Script ini berjalan di sisi browser pengguna

document.addEventListener('DOMContentLoaded', () => {
  // 1. Logika Tambah ke Keranjang (Add to Cart)
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  
  addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const id = target.getAttribute('data-id');
      const price = parseInt(target.getAttribute('data-price') || '0', 10);
      const name = target.getAttribute('data-name');

      if (!id) return;

      // Ambil keranjang dari localStorage (Gunakan nama unik ShopinId)
      let cart = JSON.parse(localStorage.getItem('shopin_cart') || '[]');
      
      // Cek apakah produk sudah ada di keranjang
      const existingItemIndex = cart.findIndex((item: any) => item.id === id);
      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
      } else {
        cart.push({ id, name, price, quantity: 1 });
      }

      // Simpan kembali ke penyimpanan browser
      localStorage.setItem('shopin_cart', JSON.stringify(cart));
      
      // Umpan balik visual (Visual Feedback) untuk pengguna
      const originalText = target.innerText;
      target.innerText = '✓ Berhasil Ditambahkan';
      target.classList.replace('bg-pink-100', 'bg-green-100');
      target.classList.replace('text-pink-700', 'text-green-700');
      
      setTimeout(() => {
        target.innerText = originalText;
        target.classList.replace('bg-green-100', 'bg-pink-100');
        target.classList.replace('text-green-700', 'text-pink-700');
      }, 2000);
    });
  });

  // 2. Logika Injeksi Data Keranjang ke Halaman Checkout
  // (Mencari input hidden yang sudah kita buat di app/routes/checkout/index.tsx)
  const cartDataInput = document.getElementById('cartDataInput') as HTMLInputElement;
  if (cartDataInput) {
    const cart = localStorage.getItem('shopin_cart') || '[]';
    cartDataInput.value = cart;
  }
});
