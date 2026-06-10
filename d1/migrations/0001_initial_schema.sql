-- Dilarang memotong bagian ini. Skema penuh untuk e-commerce single-vendor.

-- Tabel Pengguna (Admin dan Pelanggan)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer', -- 'admin' atau 'customer'
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Kategori Produk (Misal: Tas, Sepatu, Aksesoris - seperti Huntstreet)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Produk Utama
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL, -- Penting untuk barang premium
    condition TEXT NOT NULL, -- Misal: 'Pristine', 'Excellent', 'Very Good'
    description TEXT NOT NULL,
    price INTEGER NOT NULL, -- Disimpan dalam satuan terkecil (misal Rupiah tanpa desimal)
    compare_at_price INTEGER, -- Untuk fitur diskon / harga coret
    stock INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1, -- 1 = Aktif, 0 = Draft/Sembunyi
    images_json TEXT NOT NULL, -- Array URL dari R2 disimpan dalam format JSON (contoh: '["url1", "url2"]')
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Indexing untuk mempercepat pencarian (Penting untuk optimasi D1)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Tabel Pesanan (Checkout)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'completed', 'cancelled'
    total_amount INTEGER NOT NULL,
    shipping_address TEXT NOT NULL,
    tracking_number TEXT,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Tabel Item dalam Pesanan
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase INTEGER NOT NULL, -- Menyimpan harga saat itu walau harga produk berubah nanti
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);