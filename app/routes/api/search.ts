import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const db = c.env.DB
  
  // Tangkap parameter 'q' dari URL (contoh: /api/search?q=tas)
  const query = c.req.query('q') || ''

  // Lapis Pertahanan 1: Jika kurang dari 3 karakter, langsung hentikan eksekusi 
  // dan kembalikan array kosong agar database tidak bekerja sia-sia
  if (query.length < 3) {
    return c.json([])
  }

  // Siapkan string pencarian dengan wildcard '%' untuk SQL LIKE operator
  const searchTerm = `%${query}%`

  try {
    // Lapis Pertahanan 2: Batasi hasil maksimal 10 data (LIMIT 10) 
    // karena AJAX dropdown hanya butuh beberapa sampel produk teratas
    const { results } = await db.prepare(`
      SELECT slug, name, price, images_json 
      FROM products 
      WHERE is_active = 1 AND (name LIKE ? OR brand LIKE ?)
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(searchTerm, searchTerm).all()

    // Kembalikan hasil langsung dalam format JSON ke klien
    return c.json(results)
    
  } catch (error) {
    console.error("API Search Error:", error)
    // Jika terjadi error pada database, jangan buat halaman crash, 
    // cukup kembalikan array kosong dengan status 500
    return c.json([], 500)
  }
})
