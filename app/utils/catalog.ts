import type { Context } from 'hono';

/**
 * DEFINISI INTERFACE
 * Disesuaikan 100% dengan visoe.sql & Kebutuhan Huntstreet
 */

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description?: string | null;
  created_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  brand: string;
  condition: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  is_active: number;
  images_json: string;
  // Detail Teknis (Urutan sesuai database)
  brand_serial: string | null;
  inclusions: string | null;
  dimensions: string | null;
  exterior_material: string | null;
  interior_material: string | null;
  hardware_color: string | null;
  model_name: string | null;
  production_year: string | null;
  color: string | null;
  weight: number; 
  created_at: string;
  updated_at: string;
  // Virtual Fields (Hasil JOIN)
  category_name?: string;
  category_slug?: string;
}

/**
 * UTILS & HELPERS
 */

// Helper untuk membuat slug yang bersih dan SEO friendly
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')     // Ganti karakter non-alfanumerik dengan dash
    .replace(/(^-|-$)/g, '');       // Hapus dash di awal atau akhir
};

// Helper Recursive untuk menyusun kategori di Dropdown Admin (Induk > Anak)
export function buildCategoryOptions(
  categories: Category[], 
  parentId: string | null = null, 
  depth = 0
): (Category & { displayName: string })[] {
  let options: (Category & { displayName: string })[] = [];
  
  const items = categories.filter(c => c.parent_id === parentId);
  
  for (const item of items) {
    options.push({
      ...item,
      displayName: "— ".repeat(depth) + item.name
    });
    
    const children = buildCategoryOptions(categories, item.id, depth + 1);
    options = options.concat(children);
  }
  
  return options;
}

/**
 * DATABASE FETCHING (D1 + KV CACHING)
 */

// Mengambil semua kategori dari D1
export async function getAllCategories(db: D1Database): Promise<Category[]> {
  const { results } = await db
    .prepare('SELECT * FROM categories ORDER BY name ASC')
    .all<Category>();
  return results || [];
}

// Mengambil semua produk aktif (Untuk Katalog)
// Menambahkan dukungan filter Brand & Category agar katalog dinamis
export async function getActiveProducts(
  c: Context, 
  filters?: { brand?: string; category_slug?: string }
): Promise<Product[]> {
  const db = c.env.DB;
  const kv = c.env.CACHE_KV;
  
  // Cache key unik berdasarkan filter
  const cacheKey = `products:active:all:${filters?.brand || 'all'}:${filters?.category_slug || 'all'}`;
  
  const cachedData = await kv.get(cacheKey);
  if (cachedData) return JSON.parse(cachedData) as Product[];

  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  
  const params: any[] = [];
  if (filters?.brand) {
    query += ` AND p.brand = ?`;
    params.push(filters.brand);
  }
  if (filters?.category_slug) {
    query += ` AND c.slug = ?`;
    params.push(filters.category_slug);
  }

  query += ` ORDER BY p.created_at DESC`;

  const { results } = await db.prepare(query).bind(...params).all<Product>();
  const products = results || [];

  await kv.put(cacheKey, JSON.stringify(products), { expirationTtl: 3600 });
  return products;
}

// Mengambil detail satu produk berdasarkan Slug (Halaman Detail)
// DITINGKATKAN: Melakukan JOIN dengan kategori untuk Breadcrumbs
export async function getProductBySlug(c: Context, slug: string): Promise<Product | null> {
  const cacheKey = `product:slug:v2:${slug}`; // Versi 2 untuk membedakan data JOIN
  const kv = c.env.CACHE_KV;
  const db = c.env.DB;

  const cachedData = await kv.get(cacheKey);
  if (cachedData) return JSON.parse(cachedData) as Product;

  const query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
    LIMIT 1
  `;

  const product = await db.prepare(query).bind(slug).first<Product>();

  if (!product) return null;

  await kv.put(cacheKey, JSON.stringify(product), { expirationTtl: 3600 });
  return product;
}