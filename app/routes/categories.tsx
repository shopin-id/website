import { createRoute } from 'honox/factory'
import { getAuthUser } from '../utils/auth'

export default createRoute(async (c) => {
  const db = c.env.DB
  
  // 1. Tarik seluruh kategori, urutkan murni berdasarkan abjad (A-Z)
  const { results: allCategories } = await db.prepare(`
    SELECT id, name, slug, parent_id 
    FROM categories 
    ORDER BY name ASC
  `).all()

  // 2. Mesin Perakit Pohon Hierarki (Category Tree Builder)
  const categoryMap = new Map()
  const rootCategories: any[] = []

  // Siapkan map penampung
  allCategories.forEach((cat: any) => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })

  // Sambungkan setiap anak ke induknya
  allCategories.forEach((cat: any) => {
    if (cat.parent_id) {
      const parent = categoryMap.get(cat.parent_id)
      if (parent) {
        parent.children.push(categoryMap.get(cat.id))
      }
    } else {
      rootCategories.push(categoryMap.get(cat.id))
    }
  })

  // 3. Render Antarmuka
  return c.render(
    <div className="bg-[#f4f7fc] min-h-screen py-10 md:py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER PAGE */}
        <div className="flex flex-col items-center mb-12 border-b border-gray-200 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-widest mb-3 text-center drop-shadow-sm">
            Direktori Kategori
          </h1>
          <p className="text-sm md:text-base text-gray-500 text-center max-w-2xl leading-relaxed">
            Jelajahi seluruh koleksi produk kami dengan mudah. Temukan gaya, spesifikasi, dan kebutuhan yang paling sesuai dengan Anda melalui indeks kategori lengkap di bawah ini.
          </p>
        </div>

        {/* MASONRY LAYOUT
            Menggunakan 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4' agar 
            kotak-kotak yang panjangnya berbeda saling mengisi ruang kosong di bawahnya.
        */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {rootCategories.map((root: any) => (
            <div 
              key={root.id} 
              className="break-inside-avoid bg-white p-6 rounded-sm shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Judul Kategori Induk */}
              <a 
                href={`/products?category=${root.slug}`} 
                className="group flex items-center justify-between border-b border-gray-200 pb-3 mb-4 transition-colors"
              >
                <h2 className="text-base font-black text-gray-900 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                  {root.name}
                </h2>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors transform group-hover:translate-x-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>

              {/* Daftar Sub-Kategori (Anak) */}
              {root.children.length > 0 ? (
                <ul className="space-y-2.5">
                  {root.children.map((child: any) => (
                    <li key={child.id}>
                      <a 
                        href={`/products?category=${child.slug}`} 
                        className="group flex items-start text-sm text-gray-500 hover:text-black transition-colors"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 bg-gray-300 rounded-full mr-2.5 flex-shrink-0 group-hover:bg-blue-500 transition-colors"></span>
                        <span className="leading-tight">{child.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">Lihat seluruh produk di kategori ini.</p>
              )}
            </div>
          ))}
        </div>

        {/* KONDISI JIKA KOSONG (Fall-back) */}
        {rootCategories.length === 0 && (
          <div className="text-center py-20 bg-white rounded-sm border border-gray-100 shadow-sm">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"></path></svg>
            <h3 className="text-lg font-bold text-gray-900">Belum Ada Kategori</h3>
            <p className="text-sm text-gray-500 mt-1">Daftar kategori akan muncul di sini setelah ditambahkan.</p>
          </div>
        )}

      </div>
    </div>,
    { title: 'Direktori Kategori | ShopinId' }
  )
})
