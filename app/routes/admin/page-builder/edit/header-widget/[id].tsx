import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;

  let siteTitle = 'System Builder';
  try {
    const storeSettingsRow: any = await db.prepare("SELECT config_json FROM store_settings WHERE id = 'GLOBAL'").first();
    if (storeSettingsRow && storeSettingsRow.config_json) {
      const parsedSettings = JSON.parse(storeSettingsRow.config_json);
      siteTitle = parsedSettings.store_name || parsedSettings.site_title || 'System Builder';
    }
  } catch (e) {}

  const widget = await db.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();
  if (!widget) return c.redirect('/admin/page-builder');
  
  const data = JSON.parse(widget.content_json || '{}');

  return c.render(
    <div class="max-w-[1200px] mx-auto py-10 px-6 pb-40">
      <div class="flex items-center justify-between mb-12 border-b border-neutral-100 pb-8">
        <div class="flex items-center gap-4">
          <a href={`/admin/page-builder?page_id=${widget.page_id}`} class="text-neutral-400 text-[10px] font-bold uppercase tracking-widest hover:text-black transition">← Back</a>
          <h1 class="text-2xl font-serif italic tracking-widest uppercase">Navigation & Mega Menu</h1>
        </div>
        <div class="flex gap-4">
           <button type="submit" form="header-form" class="bg-black text-white px-10 py-4 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition">Save Changes</button>
        </div>
      </div>

      <form id="header-form" class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <input type="hidden" name="id" value={id} />

        <div class="lg:col-span-1 space-y-8">
          <section class="bg-white p-8 border border-neutral-100 shadow-sm space-y-6">
            <h2 class="text-[11px] font-bold uppercase tracking-[0.3em] border-b pb-4">Identity & Branding</h2>
            
            <div class="space-y-6">
              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Desktop Logo URL (Horizontal)</label>
                  <input type="text" name="logo_desktop" value={data.logo_desktop || data.logo} class="w-full border-b border-neutral-200 py-2 outline-none focus:border-black transition text-sm" placeholder="https://..." />
                </div>
                <div class="space-y-2">
                  <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Desktop Logo Width</label>
                  <input type="text" name="logo_width_desktop" value={data.logo_width_desktop || data.logo_width || '180px'} class="w-full border-b border-neutral-200 py-2 outline-none focus:border-black transition text-sm" placeholder="e.g. 200px" />
                </div>
              </div>

              <div class="space-y-4 pt-4 border-t border-neutral-100">
                <div class="space-y-2">
                  <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Mobile Logo URL (Square 1:1)</label>
                  <input type="text" name="logo_mobile" value={data.logo_mobile || data.favicon || ''} class="w-full border-b border-neutral-200 py-2 outline-none focus:border-black transition text-sm" placeholder="https://..." />
                  <p class="text-[8px] text-neutral-400 leading-relaxed mt-1">This square logo will automatically be used as your website's Favicon.</p>
                </div>
                <div class="space-y-2">
                  <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Mobile Logo Width</label>
                  <input type="text" name="logo_width_mobile" value={data.logo_width_mobile || '45px'} class="w-full border-b border-neutral-200 py-2 outline-none focus:border-black transition text-sm" placeholder="e.g. 45px" />
                </div>
              </div>

              <div class="space-y-4 pt-4 border-t border-neutral-100">
                <div class="space-y-2">
                  <label class="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Top Bar Announcement</label>
                  <input type="text" name="top_bar_text" value={data.top_bar_text || 'Authentic Luxury Goods Only'} class="w-full border-b border-neutral-200 py-2 outline-none focus:border-black transition text-sm" placeholder="Enter top bar text..." />
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-4 pt-6 border-t border-neutral-100">
              <label class="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="show_cart" checked={data.show_cart !== false} class="w-4 h-4 accent-black" />
                <span class="text-[10px] font-bold uppercase tracking-widest group-hover:text-black transition">Show Shopping Cart</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="show_search" checked={data.show_search !== false} class="w-4 h-4 accent-black" />
                <span class="text-[10px] font-bold uppercase tracking-widest group-hover:text-black transition">Show Search Bar</span>
              </label>
            </div>
          </section>
        </div>

        <div class="lg:col-span-2 space-y-8">
          <section class="bg-white p-8 border border-neutral-100 shadow-sm space-y-8">
            <div class="flex justify-between items-center border-b pb-4">
              <h2 class="text-[11px] font-bold uppercase tracking-[0.3em]">Menu Structure</h2>
              <button type="button" onclick="window.addCategory()" class="text-[9px] font-bold bg-neutral-100 text-black px-4 py-2 uppercase tracking-widest hover:bg-black hover:text-white transition">+ Add Root Category</button>
            </div>
            
            <div id="menu-container" class="space-y-8"></div>
          </section>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        let menuState = ${JSON.stringify(data.menu || [])};

        window.addCategory = () => { menuState.push({ title: 'New Category', url: '#', columns: [] }); render(); };
        window.addColumn = (catIdx) => { menuState[catIdx].columns.push({ heading: 'New Column', links: [] }); render(); };
        window.addLink = (catIdx, colIdx) => { menuState[catIdx].columns[colIdx].links.push({ name: 'New Link', url: '/' }); render(); };

        window.removeItem = (type, cIdx, colIdx, lIdx) => {
          if(!confirm('Hapus item ini?')) return;
          if(type === 'cat') menuState.splice(cIdx, 1);
          if(type === 'col') menuState[cIdx].columns.splice(colIdx, 1);
          if(type === 'link') menuState[cIdx].columns[colIdx].links.splice(lIdx, 1);
          render();
        };

        function render() {
          const container = document.getElementById('menu-container');
          if(!container) return;
          
          container.innerHTML = menuState.map((cat, cIdx) => \`
            <div class="bg-neutral-50 border border-neutral-200 p-6 space-y-6 relative group/cat">
              <div class="flex gap-4 items-center border-b border-neutral-200 pb-4">
                <div class="flex-1 space-y-1">
                   <label class="text-[8px] font-bold uppercase opacity-30">Category Name</label>
                   <input type="text" value="\${cat.title}" onchange="menuState[\${cIdx}].title = this.value" class="w-full bg-transparent font-serif italic text-xl outline-none" />
                </div>
                <div class="flex-1 space-y-1">
                   <label class="text-[8px] font-bold uppercase opacity-30">Category URL</label>
                   <input type="text" value="\${cat.url}" onchange="menuState[\${cIdx}].url = this.value" class="w-full bg-transparent text-[10px] uppercase tracking-widest outline-none border-b border-transparent focus:border-black" />
                </div>
                <button type="button" onclick="window.removeItem('cat', \${cIdx})" class="text-red-400 hover:text-red-600 p-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                \${cat.columns.map((col, colIdx) => \`
                  <div class="bg-white p-5 border border-neutral-100 shadow-sm space-y-4">
                    <div class="flex justify-between items-center border-b pb-2">
                      <input type="text" value="\${col.heading}" onchange="menuState[\${cIdx}].columns[\${colIdx}].heading = this.value" class="font-bold text-[9px] uppercase tracking-widest outline-none w-full bg-transparent" placeholder="Column Heading" />
                      <button type="button" onclick="window.removeItem('col', \${cIdx}, \${colIdx})" class="text-neutral-300 hover:text-red-500">×</button>
                    </div>
                    <div class="space-y-3">
                      \${col.links.map((lnk, lIdx) => \`
                        <div class="flex gap-2 items-center group/link">
                          <input type="text" value="\${lnk.name}" onchange="menuState[\${cIdx}].columns[\${colIdx}].links[\${lIdx}].name = this.value" class="text-[10px] border-b border-transparent group-hover/link:border-neutral-200 outline-none w-1/2" placeholder="Link Name" />
                          <input type="text" value="\${lnk.url}" onchange="menuState[\${cIdx}].columns[\${colIdx}].links[\${lIdx}].url = this.value" class="text-[10px] border-b border-transparent group-hover/link:border-neutral-200 outline-none w-1/2 opacity-50 font-mono" placeholder="/url" />
                          <button type="button" onclick="window.removeItem('link', \${cIdx}, \${colIdx}, \${lIdx})" class="opacity-0 group-hover/link:opacity-100 text-red-300">×</button>
                        </div>
                      \`).join('')}
                      <button type="button" onclick="window.addLink(\${cIdx}, \${colIdx})" class="text-[8px] font-bold text-neutral-400 uppercase tracking-widest hover:text-black transition">+ Add Link</button>
                    </div>
                  </div>
                \`).join('')}
                <button type="button" onclick="window.addColumn(\${cIdx})" class="border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center p-6 hover:bg-neutral-100 transition text-neutral-400 space-y-2"><span class="text-[16px]">+</span><span class="text-[8px] font-bold uppercase tracking-widest">New Column</span></button>
              </div>
            </div>
          \`).join('');
        }

        render();

        document.getElementById('header-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const logoMobileUrl = fd.get('logo_mobile');

          const payload = {
            id: fd.get('id'),
            title: 'Main Site Navigation',
            content_json: JSON.stringify({
              logo: fd.get('logo_desktop'),
              logo_desktop: fd.get('logo_desktop'),
              logo_width_desktop: fd.get('logo_width_desktop'),
              logo_mobile: logoMobileUrl,
              logo_width_mobile: fd.get('logo_width_mobile'),
              favicon: logoMobileUrl,
              top_bar_text: fd.get('top_bar_text'),
              show_cart: fd.get('show_cart') === 'on',
              show_search: fd.get('show_search') === 'on',
              menu: menuState
            })
          };

          try {
            const res = await fetch('/api/page-builder/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if(res.ok) { window.location.href = '/admin/page-builder?page_id=${widget.page_id}'; }
          } catch(err) { alert('Save failed'); }
        };
      `}} />
    </div>,
    { title: `Edit Header | ${siteTitle}` }
  );
});