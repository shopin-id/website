import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const pageId = c.req.query('page_id') || 'home';
  const db = c.env.DB;
  
  const { results: widgets } = await db.prepare(
    "SELECT * FROM frontpage_widgets WHERE page_id = ? ORDER BY display_order ASC"
  ).bind(pageId).all();

  let builderTitle = "Homepage Builder";
  if (pageId === 'GLOBAL') {
    builderTitle = "Global Header & Footer";
  } else if (pageId !== 'home') {
    builderTitle = "Landing Page Builder";
  }

  return c.render(
    <div class="max-w-[1100px] mx-auto py-10 px-6">
      <div class="flex justify-between items-end mb-8 border-b border-neutral-100 pb-8">
        <div>
          <h1 class="text-2xl font-bold uppercase tracking-[0.2em]">{builderTitle}</h1>
          <p class="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-bold">
            Editing Context: <span class="text-black">{pageId}</span>
          </p>
        </div>
        <button 
          onclick="document.getElementById('add-widget-modal').style.display = 'flex'" 
          class="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition shadow-xl active:scale-95"
        >
          + Add New Widget
        </button>
      </div>

      <div class="flex gap-4 mb-8 border-b border-neutral-200 pb-4">
        <a href="/admin/page-builder?page_id=home" 
           class={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition ${pageId === 'home' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}>
          Homepage
        </a>
        <a href="/admin/page-builder?page_id=GLOBAL" 
           class={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 transition ${pageId === 'GLOBAL' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}>
          Global Elements
        </a>
        {pageId !== 'home' && pageId !== 'GLOBAL' && (
          <span class="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-blue-100 text-blue-800 border border-blue-200">
            Custom Page (Canvas)
          </span>
        )}
      </div>

      <div id="sortable-widgets" class="space-y-4">
        {widgets.length === 0 ? (
          <div class="p-20 text-center border border-dashed border-neutral-200 rounded-lg">
            <p class="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">No widgets found for this page.</p>
            <p class="text-[9px] uppercase tracking-widest text-neutral-300 mt-2">Click "+ Add New Widget" to start building.</p>
          </div>
        ) : (
          widgets.map((widget) => {
            let editFolder = widget.widget_type.replace(/_/g, '-');
            if (widget.widget_type === 'custom_title' || widget.widget_type === 'custom_paragraph') {
              editFolder = 'custom-text';
            }

            return (
              <div 
                key={widget.id} 
                data-id={widget.id}
                class="bg-white border border-neutral-100 p-6 flex justify-between items-center shadow-sm hover:shadow-md transition-all cursor-move group"
              >
                <div class="flex items-center gap-6">
                  <div class="text-neutral-200 group-hover:text-black transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <div>
                    <span class="text-[9px] font-bold bg-neutral-100 px-2 py-1 uppercase tracking-widest text-neutral-500 rounded">
                      {widget.widget_type.replace(/_/g, ' ')}
                    </span>
                    <h3 class="text-sm font-bold mt-2 uppercase tracking-widest text-neutral-800">{widget.title}</h3>
                  </div>
                </div>
                
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2 mr-4">
                    <div class={`w-2 h-2 rounded-full ${widget.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span class="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                      {widget.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  
                  <a 
                    href={`/admin/page-builder/edit/${editFolder}/${widget.id}`}
                    class="text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-6 py-2 hover:bg-black hover:text-white transition-all"
                  >
                    Edit
                  </a>
                  
                  <button 
                    onclick={`window.deleteWidget('${widget.id}')`}
                    class="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors px-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div id="add-widget-modal" class="fixed inset-0 bg-black/60 z-[100] hidden items-center justify-center p-6 backdrop-blur-sm">
        <div class="bg-white w-full max-w-4xl p-10 shadow-2xl space-y-8 animate-fadeIn">
          <h2 class="text-xl font-bold uppercase tracking-widest border-b pb-4 text-center">Select Widget Type</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-center">
            
            <button onclick="window.createWidget('header_widget')" class="p-6 border-2 border-purple-50 hover:border-purple-600 bg-purple-50/30 transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-purple-900 group-hover:scale-105 transition-transform">Global Header</p>
              <p class="text-[8px] text-purple-400 uppercase mt-1 tracking-tighter">Panggil header dari setelan Global</p>
            </button>
            <button onclick="window.createWidget('footer_widget')" class="p-6 border-2 border-purple-50 hover:border-purple-600 bg-purple-50/30 transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-purple-900 group-hover:scale-105 transition-transform">Global Footer</p>
              <p class="text-[8px] text-purple-400 uppercase mt-1 tracking-tighter">Panggil footer dari setelan Global</p>
            </button>

            <button onclick="window.createWidget('hero_slider')" class="p-6 border border-neutral-100 hover:border-black bg-white transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-black group-hover:scale-105 transition-transform">Hero Slider</p>
            </button>
            <button onclick="window.createWidget('promo_banner')" class="p-6 border border-neutral-100 hover:border-black bg-white transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-black group-hover:scale-105 transition-transform">Promo Banner</p>
            </button>

            {/* --- PENAMBAHAN WIDGET BARU DI SINI --- */}
            <button onclick="window.createWidget('all_products_grid')" class="p-6 border-2 border-green-50 hover:border-green-600 bg-green-50/30 transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-green-900 group-hover:scale-105 transition-transform">All Products Grid</p>
              <p class="text-[8px] text-green-600 uppercase mt-1 tracking-tighter">Katalog Produk + Paginasi</p>
            </button>

            <button onclick="window.createWidget('new_arrivals')" class="p-6 border border-neutral-100 hover:border-black bg-white transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-black group-hover:scale-105 transition-transform">New Arrivals</p>
            </button>
            <button onclick="window.createWidget('featured_products')" class="p-6 border border-neutral-100 hover:border-black bg-white transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-black group-hover:scale-105 transition-transform">Featured Products</p>
            </button>
            <button onclick="window.createWidget('brand_grid')" class="p-6 border border-neutral-100 hover:border-black bg-white transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-black group-hover:scale-105 transition-transform">Brand Grid</p>
            </button>

            <button onclick="window.createWidget('pricing_block')" class="p-6 border border-blue-100 hover:border-blue-600 bg-blue-50/30 transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-blue-900 group-hover:scale-105 transition-transform">Pricing Grid</p>
            </button>
            <button onclick="window.createWidget('countdown_widget')" class="p-6 border border-red-100 hover:border-red-600 bg-red-50/30 transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-red-900 group-hover:scale-105 transition-transform">Countdown Timer</p>
            </button>
            <button onclick="window.createWidget('trust_badges')" class="p-6 border border-neutral-100 hover:border-black bg-white transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-black group-hover:scale-105 transition-transform">Trust Badges</p>
            </button>

            <button onclick="window.createWidget('custom_title')" class="p-6 border border-neutral-100 hover:border-black bg-white transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-black group-hover:scale-105 transition-transform">Custom Title</p>
            </button>
            <button onclick="window.createWidget('custom_paragraph')" class="p-6 border border-neutral-100 hover:border-black bg-white transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-black group-hover:scale-105 transition-transform">Custom Paragraph</p>
            </button>
            <button onclick="window.createWidget('icon_nav')" class="p-6 border border-neutral-100 hover:border-black bg-white transition-all group">
              <p class="text-[10px] font-bold uppercase tracking-widest text-black group-hover:scale-105 transition-transform">Icon Navigation</p>
            </button>

          </div>
          <button 
            onclick="document.getElementById('add-widget-modal').style.display = 'none'" 
            class="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition text-center border border-neutral-200"
          >
            CANCEL
          </button>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
      <script dangerouslySetInnerHTML={{ __html: `
        const urlParams = new URLSearchParams(window.location.search);
        const currentPageId = urlParams.get('page_id') || 'home';

        window.createWidget = async function(type) {
          const contentMap = {
            hero_slider: { slides: [] },
            all_products_grid: { per_page: 15, description: 'Temukan berbagai produk unggulan dari vendor terbaik kami.' }, // SETELAH DITAMBAHKAN
            new_arrivals: { description: '', button_text: 'Shop Now', product_ids: [] },
            icon_nav: { items: [] },
            promo_banner: { promos: [] },
            featured_products: { product_ids: [] },
            brand_grid: { brands: [] },
            trust_badges: { badges: [] },
            footer_widget: { layout: '4', columns: [] },
            header_widget: { logo: '', logo_width: '180px', show_search: true, show_cart: true, menu: [] },
            custom_title: { text: 'New Section Title', font_size: 'text-3xl', align: 'center', text_color: '#000000' },
            custom_paragraph: { text: 'Enter your text here...', font_size: 'text-sm', align: 'center', text_color: '#666666' },
            pricing_block: { layout: '3', plans: [] },
            countdown_widget: { end_time: '', expired_text: 'OFFER EXPIRED' }
          };

          try {
            const res = await fetch('/api/page-builder/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                widget_type: type,
                title: type.replace(/_/g, ' ').toUpperCase(),
                content_json: JSON.stringify(contentMap[type] || {}),
                page_id: currentPageId
              })
            });
            
            const result = await res.json();
            if(result.success) {
              window.location.reload();
            } else {
              alert("Error: " + (result.error || "Gagal membuat widget"));
            }
          } catch (e) {
            alert("Network error: Gagal menghubungi API.");
          }
        };

        window.deleteWidget = async function(id) {
          if(!confirm('Delete permanently?')) return;
          const res = await fetch('/api/page-builder/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          if(res.ok) window.location.reload();
        };

        const sortEl = document.getElementById('sortable-widgets');
        if (sortEl) {
          Sortable.create(sortEl, {
            animation: 150,
            handle: '.cursor-move',
            onEnd: async function() {
              const items = Array.from(sortEl.children).map((item, index) => ({ 
                id: item.dataset.id, 
                order: index 
              }));
              
              await fetch('/api/page-builder/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
              });
            }
          });
        }
      `}} />
    </div>,
    { title: 'Page Builder | Admin' }
  );
});
