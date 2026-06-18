import { S, save } from '../state.js';
import { uid, today, ils, esc } from '../utils.js';
import { printInvoice } from '../invoice.js';
import { render } from '../render.js';

export function invoiceForm() {
  const root = document.getElementById('app');
  const ov   = document.createElement('div');
  ov.className = 'ov'; ov.dir = 'rtl';

  let selectedClient = null;
  let draft = [{ desc: '', qty: 1, price: 0 }];

  const tot = () => draft.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);

  function draw() {
    const rows = () => draft.map((it, i) =>
      `<div class="lineitem">
        <input data-i="${i}" data-f="desc" placeholder="תיאור" value="${esc(it.desc)}">
        <input data-i="${i}" data-f="qty"  type="number" step="any" value="${it.qty}">
        <input data-i="${i}" data-f="price" type="number" step="any" value="${it.price}">
        <button class="x" data-rm="${i}">×</button>
      </div>`).join('');

    ov.innerHTML = `<div class="modal" style="max-width:520px">
      <h3>📄 הנפקת חשבונית</h3>

      <!-- לקוח -->
      <div class="field" style="position:relative">
        <label>שם לקוח</label>
        <input id="cli-input" placeholder="הקלידי שם לקוח…" autocomplete="off"
          value="${selectedClient ? esc(selectedClient.name) : ''}">
        <div id="cli-dropdown" style="position:absolute;top:100%;right:0;left:0;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:10;display:none;max-height:180px;overflow-y:auto"></div>
      </div>

      <!-- פרטי לקוח (אחרי בחירה) -->
      ${selectedClient ? `
      <div style="background:var(--brand-soft);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:.83rem">
        <b>${esc(selectedClient.name)}</b>
        ${selectedClient.phone ? ` · ${esc(selectedClient.phone)}` : ''}
        ${selectedClient.vatId ? ` · ח.פ ${esc(selectedClient.vatId)}` : ''}
        ${Number(selectedClient.withholdPct) > 0 ? ` · ניכוי ${selectedClient.withholdPct}%` : ''}
        <button id="change-cli" style="background:none;border:none;color:var(--brand);font-size:.78rem;cursor:pointer;margin-inline-start:8px">שנה</button>
      </div>` : ''}

      <!-- כותרת ואתר -->
      <div class="field"><label>כותרת / תיאור עבודה</label><input id="f-title" placeholder="שיפוץ מטבח, טיח חוץ…"></div>
      <div class="field"><label>אתר / פרויקט</label><input id="f-site" placeholder="וילה כהן, רח׳ הרצל 5…"></div>
      <div class="field"><label>תאריך</label><input id="f-date" type="date" value="${today()}"></div>

      <!-- שורות -->
      <div class="field">
        <label>פירוט עבודה</label>
        <div class="lineitem mini"><span>תיאור</span><span>כמות</span><span>מחיר</span><span></span></div>
        <div id="rows">${rows()}</div>
        <button class="btn ghost sm" id="add-row">+ שורה</button>
      </div>
      <div class="money" style="margin:12px 0">
        <span>סה״כ לפני מע״מ</span>
        <b class="num" id="tot">${ils(tot())}</b>
      </div>

      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn primary" style="flex:1" id="ok-save">שמור בלבד</button>
        <button class="btn primary" style="flex:1;background:var(--paid)" id="ok-print">💾 שמור + הנפק</button>
      </div>
      <button class="btn ghost full" id="cx" style="margin-top:8px">ביטול</button>
    </div>`;

    bind();
  }

  function bind() {
    const inp = ov.querySelector('#cli-input');
    const dd  = ov.querySelector('#cli-dropdown');

    if (inp) {
      inp.oninput = () => {
        const q = inp.value.trim().toLowerCase();
        if (!q) { dd.style.display = 'none'; return; }
        const matches = S.clients.filter(c => c.name.toLowerCase().includes(q));
        if (!matches.length) {
          dd.innerHTML = `<div style="padding:10px 12px;font-size:.85rem;color:var(--soft)">
            לקוח לא נמצא —
            <button id="new-cli" style="background:none;border:none;color:var(--brand);cursor:pointer;font-weight:700">+ צור לקוח חדש</button>
          </div>`;
          dd.style.display = 'block';
          dd.querySelector('#new-cli')?.addEventListener('click', () => {
            ov.remove();
            import('./clients.js').then(({ addClient }) => addClient());
          });
          return;
        }
        dd.innerHTML = matches.map(c =>
          `<button class="cli-opt" data-id="${c.id}" style="display:block;width:100%;text-align:right;background:none;border:0;padding:10px 12px;font-size:.88rem;cursor:pointer;font-family:inherit;border-bottom:1px solid var(--line)">
            <b>${esc(c.name)}</b>
            ${c.phone ? `<span style="color:var(--soft);font-size:.78rem"> · ${esc(c.phone)}</span>` : ''}
            ${Number(c.withholdPct) > 0 ? `<span style="color:var(--work);font-size:.75rem"> · ניכוי ${c.withholdPct}%</span>` : ''}
          </button>`).join('');
        dd.style.display = 'block';
        dd.querySelectorAll('.cli-opt').forEach(b => b.onclick = () => {
          selectedClient = S.clients.find(x => x.id === b.dataset.id);
          dd.style.display = 'none';
          draw();
        });
        dd.querySelectorAll('button').forEach(b => b.onmouseenter = () => b.style.background = 'var(--surface)');
        dd.querySelectorAll('button').forEach(b => b.onmouseleave = () => b.style.background = 'none');
      };
      inp.focus();
    }

    ov.querySelector('#change-cli')?.addEventListener('click', () => {
      selectedClient = null; draw();
    });

    ov.querySelectorAll('#rows input').forEach(inp => inp.oninput = () => {
      draft[+inp.dataset.i][inp.dataset.f] = inp.value;
      ov.querySelector('#tot').textContent = ils(tot());
    });
    ov.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      draft.splice(+b.dataset.rm, 1);
      if (!draft.length) draft = [{ desc: '', qty: 1, price: 0 }];
      draw();
    });
    ov.querySelector('#add-row').onclick = () => { draft.push({ desc: '', qty: 1, price: 0 }); draw(); };
    ov.querySelector('#cx').onclick = () => ov.remove();

    const doSave = async (andPrint) => {
      const title = ov.querySelector('#f-title')?.value.trim();
      const site  = ov.querySelector('#f-site')?.value.trim();
      const date  = ov.querySelector('#f-date')?.value || today();
      const items = draft.filter(i => i.desc || Number(i.price) > 0)
        .map(i => ({ desc: i.desc, qty: Number(i.qty) || 0, price: Number(i.price) || 0 }));

      if (!selectedClient) { alert('יש לבחור לקוח.'); return; }
      if (!items.length)   { alert('יש להוסיף לפחות שורה אחת.'); return; }

      const job = { id: uid(), clientId: selectedClient.id, title, site, status: 'done', items, received: 0, date };
      S.jobs.unshift(job);
      await save();
      ov.remove();
      render();
      if (andPrint) printInvoice(job.id);
    };

    ov.querySelector('#ok-save').onclick  = () => doSave(false);
    ov.querySelector('#ok-print').onclick = () => doSave(true);
  }

  draw();
  root.appendChild(ov);
}
