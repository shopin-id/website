// app/client.ts
// Script ini berjalan di sisi browser pengguna

// 1. Fungsi Update Angka Keranjang di Header
const updateCartCounter = () => {
  const cart = JSON.parse(localStorage.getItem('shopin_cart') || '[]');
  const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const counters = document.querySelectorAll('.cart-counter');
  counters.forEach(c => { c.innerHTML = count.toString() });
};

// 2. Event Delegation untuk Tombol Tambah ke Keranjang
// Menggunakan document.click agar tombol tetap berfungsi walau pindah halaman
document.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('.add-to-cart-btn') as HTMLButtonElement;
  if (!target) return;

  e.preventDefault();

  const id = target.getAttribute('data-id');
  const price = parseInt(target.getAttribute('data-price') || '0', 10);
  const name = target.getAttribute('data-name');
  const image = target.getAttribute('data-image') || '/placeholder.jpg';

  if (!id) return;

  let cart = JSON.parse(localStorage.getItem('shopin_cart') || '[]');
  
  const existingItemIndex = cart.findIndex((item: any) => item.id === id);
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({ id, name, price, quantity: 1, image });
  }

  localStorage.setItem('shopin_cart', JSON.stringify(cart));
  
  // Update angka keranjang langsung
  updateCartCounter();
  window.dispatchEvent(new Event('cartUpdated'));

  // Umpan balik visual (Tombol berubah hijau)
  const originalText = target.innerText;
  target.innerText = '✓ Berhasil Masuk';
  target.classList.remove('text-black', 'bg-white', 'border-black');
  target.classList.add('text-green-700', 'bg-green-100', 'border-green-600');
  
  setTimeout(() => {
    target.innerText = originalText;
    target.classList.add('text-black', 'bg-white', 'border-black');
    target.classList.remove('text-green-700', 'bg-green-100', 'border-green-600');
  }, 1500);
});

// 3. Eksekusi Saat Halaman Pertama Dimuat
document.addEventListener('DOMContentLoaded', () => {
  updateCartCounter();

  // Injeksi data untuk Checkout Page
  const cartDataInput = document.getElementById('cartDataInput') as HTMLInputElement;
  if (cartDataInput) {
    cartDataInput.value = localStorage.getItem('shopin_cart') || '[]';
  }
});

// 4. Sinkronisasi antar tab / trigger manual
window.addEventListener('cartUpdated', updateCartCounter);
