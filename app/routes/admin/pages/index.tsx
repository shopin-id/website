import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const db = c.env.DB;
  const { results: pages } = await db.prepare("SELECT id, title, slug, status, updated_at FROM pages ORDER BY updated_at DESC").all();

  return c.render(
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Halaman Statis (Pages)</h1>
            <p className="text-gray-500 mt-1">Kelola halaman informasi seperti Tentang Kami, Kebijakan Privasi, dll.</p>
          </div>
          <a href="/admin/pages/new" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition">
            + Tulis Halaman Baru
          </a>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
              <tr>
                <th className="p-4 font-bold">Judul Halaman</th>
                <th className="p-4 font-bold">URL / Slug</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pages.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada halaman.</td></tr>
              ) : (
                pages.map((page: any) => (
                  <tr key={page.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-semibold text-gray-900">{page.title}</td>
                    <td className="p-4 text-gray-500 text-sm">/page/{page.slug}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <a href={`/admin/pages/${page.id}`} className="text-blue-600 font-bold text-sm hover:underline">Edit</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>,
    { title: 'Manajemen Pages - Admin' }
  )
})
