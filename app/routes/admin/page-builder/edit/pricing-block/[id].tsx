import { createRoute } from 'honox/factory';

export default createRoute(async (c) => {
  const id = c.req.param('id');
  const widget = await c.env.DB.prepare("SELECT * FROM frontpage_widgets WHERE id = ?").bind(id).first();
  if (!widget) return c.render(<div>Not Found</div>);
  
  let data;
  try { data = JSON.parse(widget.content_json || '{"layout":"3","plans":[]}'); } catch(e) { data = { layout: '3', plans: [] }; }

  return c.render(
    <div class="max-w-[1200px] mx-auto py-10 px-6">
      <div class="flex items-center gap-4 mb-12 border-b pb-8">
        <a href="/admin/page-builder" class="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">← Back</a>
        <h1 class="text-2xl font-serif italic tracking-widest uppercase">Edit Pricing Block</h1>
      </div>

      <form id="widget-form" class="space-y-12">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="title" value={widget.title} />

        <div class="space-y-4 max-w-sm">
          <label class="block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Grid Layout</label>
          <select name="layout" class="w-full border border-neutral-200 py-3 px-4 text-xs bg-transparent outline-none">
            <option value="1" selected={data.layout === '1'}>1 Column</option>
            <option value="2" selected={data.layout === '2'}>2 Columns</option>
            <option value="3" selected={data.layout === '3'}>3 Columns</option>
            <option value="4" selected={data.layout === '4'}>4 Columns</option>
            <option value="6" selected={data.layout === '6'}>6 Columns (2 Rows of 3)</option>
          </select>
        </div>

        <div class="space-y-8">
          <div class="flex justify-between border-b pb-4">
            <h3 class="text-[10px] font-bold uppercase tracking-[0.3em]">Pricing Plans</h3>
            <button type="button" onclick="window.addPlan()" class="bg-black text-white px-6 py-2 text-[9px] font-bold uppercase">+ Add Plan</button>
          </div>
          
          <div id="items-container" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.plans?.map((plan: any) => {
              const featText = (plan.features || []).join('\n');
              return (
                <div class="plan-item p-6 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-4">
                  <button type="button" onclick="this.closest('.plan-item').remove()" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase">Remove</button>
                  <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Plan Name</label><input type="text" name="p_name" value={plan.name} class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div>
                  <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Price String</label><input type="text" name="p_price" value={plan.price} placeholder="Rp 5.000.000 /mo" class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div>
                  <div class="space-y-2 flex-1"><label class="text-[9px] font-bold uppercase text-neutral-400">Features (One per line)</label><textarea name="p_feat" rows={4} class="w-full border border-neutral-200 p-2 text-xs bg-white outline-none focus:border-black">{featText}</textarea></div>
                  <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Button Text</label><input type="text" name="p_btn" value={plan.button_text} class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div>
                  <div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Button Link</label><input type="text" name="p_link" value={plan.button_url} class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div>
                  <label class="flex items-center gap-2 mt-2"><input type="checkbox" name="p_high" checked={plan.highlight} class="w-4 h-4" /><span class="text-[9px] font-bold uppercase tracking-widest text-black">Highlight Plan (Black BG)</span></label>
                </div>
              );
            })}
          </div>
        </div>

        <div class="pt-8 border-t flex justify-end">
           <button type="submit" class="bg-black text-white px-10 py-5 text-[11px] font-bold uppercase tracking-widest">Save Pricing</button>
        </div>
      </form>

      <script dangerouslySetInnerHTML={{ __html: `
        window.addPlan = function() {
          const div = document.createElement('div');
          div.className = 'plan-item p-6 border border-neutral-100 bg-neutral-50 relative group flex flex-col gap-4';
          div.innerHTML = '<button type="button" onclick="this.closest(\\\'.plan-item\\\').remove()" class="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase">Remove</button><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Plan Name</label><input type="text" name="p_name" class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Price String</label><input type="text" name="p_price" class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div><div class="space-y-2 flex-1"><label class="text-[9px] font-bold uppercase text-neutral-400">Features</label><textarea name="p_feat" rows="4" class="w-full border border-neutral-200 p-2 text-xs bg-white outline-none focus:border-black"></textarea></div><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Button Text</label><input type="text" name="p_btn" class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div><div class="space-y-2"><label class="text-[9px] font-bold uppercase text-neutral-400">Button Link</label><input type="text" name="p_link" class="w-full border-b py-2 text-xs bg-transparent outline-none focus:border-black" /></div><label class="flex items-center gap-2 mt-2"><input type="checkbox" name="p_high" class="w-4 h-4" /><span class="text-[9px] font-bold uppercase tracking-widest text-black">Highlight</span></label>';
          document.getElementById('items-container').appendChild(div);
        };

        document.getElementById('widget-form').onsubmit = async (e) => {
          e.preventDefault();
          const plans = [];
          document.querySelectorAll('.plan-item').forEach(item => {
            const featRaw = item.querySelector('[name="p_feat"]').value;
            const features = featRaw.split('\\n').map(f => f.trim()).filter(f => f !== '');
            plans.push({ 
              name: item.querySelector('[name="p_name"]').value, 
              price: item.querySelector('[name="p_price"]').value, 
              features: features,
              button_text: item.querySelector('[name="p_btn"]').value,
              button_url: item.querySelector('[name="p_link"]').value,
              highlight: item.querySelector('[name="p_high"]').checked
            });
          });

          await fetch('/api/page-builder/update', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: new FormData(e.target).get('id'), 
              title: new FormData(e.target).get('title'), 
              content_json: JSON.stringify({ layout: new FormData(e.target).get('layout'), plans: plans }) 
            })
          });
          window.location.href = '/admin/page-builder';
        };
      `}} />
    </div>,
    { title: 'Edit Pricing | Admin' }
  );
});