// app/client.ts
document.addEventListener('DOMContentLoaded', () => {
  
  // FUNGSI UPDATE ANGKA DI HEADER (LIVE)
  const updateCartCounter = () => {
    const cart = JSON.parse(localStorage.getItem('shopin_cart') || '[]');
    const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const counters = document.querySelectorAll('.cart-counter');
    counters.forEach(c => { c.innerHTML = count.toString() });
  };

  // Panggil saat pertama kali web dimuat
  updateCartCounter();
  // Tangkap event jika keranjang diubah
  window.addEventListener('cartUpdated', updateCartCounter);

  // LOGIKA TAMBAH KE KERANJANG
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const id = target.getAttribute('data-id');
      const price = parseInt(target.getAttribute('data-price') || '0', 10);
      const name = target.getAttribute('data-name');
      const image = target.getAttribute('data-image') || '/placeholder.jpg'; // Ambil Gambar

      if (!id) return;

      let cart = JSON.parse(localStorage.getItem('shopin_cart') || '[]');
      
      const existingItemIndex = cart.findIndex((item: any) => item.id === id);
      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
      } else {
        cart.push({ id, name, price, quantity: 1, image });
      }

      localStorage.setItem('shopin_cart', JSON.stringify(cart));
      
      // Beritahu browser bahwa keranjang bertambah!
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Umpan balik visual tombol
      const originalText = target.innerText;
      target.innerText = '✓ Berhasil Masuk';
      target.classList.replace('bg-white', 'bg-green-100');
      target.classList.replace('text-black', 'text-green-700');
      target.classList.replace('border-black', 'border-green-600');
      
      setTimeout(() => {
        target.innerText = originalText;
        target.classList.replace('bg-green-100', 'bg-white');
        target.classList.replace('text-green-700', 'text-black');
        target.classList.replace('border-green-600', 'border-black');
      }, 1500);
    });
  });

  // Injeksi data untuk Checkout Page (Sudah Anda buat sebelumnya)
  const cartDataInput = document.getElementById('cartDataInput') as HTMLInputElement;
  if (cartDataInput) {
    const cart = localStorage.getItem('shopin_cart') || '[]';
    cartDataInput.value = cart;
  }
});
