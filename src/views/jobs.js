import { S, save } from '../state.js';
import { ils, vatOf, jTot, jOwed, cName, uid, today, daysSince, esc, searchBox, bindSearch, pill } from '../utils.js';
import { render } from '../render.js';
import { printInvoice } from '../invoice.js';

let jq = '';
let draft = [];

export function vJobs() {
  const list = S.jobs.filter(j => !jq || ((j.title || '') + cName(j.clientId) + (j.site || '')).toLowerCase().includes(jq.toLowerCase()));
  const view = document.querySelector('#view');
  view.innerHTML = searchBox('חיפוש לפי כותרת, לקוח או אתר…', 'jq') +
    (list.length ? list.map(j => {
      const t    = jTot(j), o = jOwed(j);
      const pc   = t > 0 ? Math.min(100, Math.round((t - o) / t * 100)) : 0;
      const late = o > 0 && daysSince(j.date) > 30;

      // רווחיות האתר (הוצאות רכש + עובדים)
      const purCost  = S.purchases.filter(p => p.jobId === j.id).reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const workCost = S.work.filter(w => w.jobId === j.id).reduce((s, w) => s + (Number(w.amount) || 0), 0);
      const profit   = t - purCost - workCost;
      const hasExp   = purCost + workCost > 0;

      return `<div class="row">
        <div class="top">
          <div>
            <div class="who">${esc(j.title || 'הצעה')}</div>
            <div class="sub">
              👤 ${esc(cName(j.clientId))}
              ${j.site ? ` · 📍 ${esc(j.site)}` : ''}
              · ${esc(j.date || '')}
            </div>
          </div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">
            ${late ? '<span class="pill late">באיחור</span>' : ''}
            ${pill(j.status)}
          </div>
        </div>
        <div class="money">
          <span>${ils(t)} <span class="mini">(מע״מ ${ils(vatOf(t))})</span></span>
          <span class="${o > 0 ? 'o' : 'c'} num">${o > 0 ? 'חייב ' + ils(o) : 'שולם ✓'}</span>
        </div>
        <div class="bar"><span style="width:${pc}%"></span></div>
        ${hasExp ? `<div class="mini" style="margin-top:6px;display:flex;gap:12px">
          <span>רכש: <b>${ils(purCost)}</b></span>
          <span>עובדים: <b>${ils(workCost)}</b></span>
          <span style="color:${profit>=0?'var(--paid)':'var(--owe)'}">רווח נטו: <b>${ils(profit)}</b></span>
        </div>` : ''}
        <div class="acts">
          <button class="btn ghost sm" data-pay="${j.id}">💰 תשלום</button>
          <button class="btn ghost sm" data-st="${j.id}">סטטוס</button>
          <button class="btn primary sm" data-inv="${j.id}">📄 חשבונית</button>
          <button class="btn ghost sm" data-dj="${j.id}">מחיקה</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty">אין עבודות. לחצי "חדש" → חשבונית חדשה.</div>');

  const inp = view.querySelector('#jq');
  inp.value = jq;
  bindSearch('jq', v => jq = v, vJobs);

  view.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => pay(b.dataset.pay));
  view.querySelectorAll('[data-inv]').forEach(b => b.onclick = () => printInvoice(b.dataset.inv));
  view.querySelectorAll('[data-st]').forEach(b => b.onclick = async () => {
    const j = S.jobs.find(x => x.id === b.dataset.st);
    j.status = j.status === 'quote' ? 'work' : j.status === 'work' ? 'done' : 'quote';
    await save(); render();
  });
  view.querySelectorAll('[data-dj]').forEach(b => b.onclick = async () => {
    if (confirm('למחוק?')) { S.jobs = S.jobs.filter(x => x.id !== b.dataset.dj); await save(); render(); }
  });
}

export function jobForm() {
  draft = [{ desc: '', qty: 1, price: 0 }];
  const root = document.getElementById('app');
  const ov = document.createElement('div');
  ov.className = 'ov'; ov.dir = 'rtl';

  const cli = S.clients.length
    ? `<select data-k="client">${S.clients.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>`
    : `<input data-k="client" placeholder="שם לקוח (ייווצר)">`;

  const rows = () => draft.map((it, i) =>
    `<div class="lineitem">
      <input data-i="${i}" data-f="desc" placeholder="תיאור" value="${esc(it.desc)}">
      <input data-i="${i}" data-f="qty" type="number" step="any" value="${it.qty}">
      <input data-i="${i}" data-f="price" type="number" step="any" value="${it.price}">
      <button class="x" data-rm="${i}">×</button>
    </div>`).join('');

  const tot = () => draft.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);

  function draw() {
    ov.innerHTML = `<div class="modal"><h3>הצעת מחיר חדשה</h3>
      <div class="field"><label>כותרת / עבודה</label><input data-k="title" placeholder="דירה ברח׳ הראשונים"></div>
      <div class="field"><label>לקוח</label>${cli}</div>
      <div class="field"><label>אתר / פרויקט</label><input data-k="site" placeholder="וילה כהן, בניין רמת גן..."></div>
      <div class="field"><label>תאריך</label><input data-k="date" type="date" value="${today()}"></div>
      <div class="field"><label>שורות</label>
        <div class="lineitem mini"><span>תיאור</span><span>כמות</span><span>מחיר</span><span></span></div>
        <div id="rows">${rows()}</div>
        <button class="btn ghost sm" id="add">+ שורה</button>
      </div>
      <div class="money" style="margin:12px 0"><span>סה״כ לפני מע״מ</span><b class="num" id="tot">${ils(tot())}</b></div>
      <button class="btn primary full" id="ok">שמירה</button>
      <button class="btn ghost full" id="cx" style="margin-top:8px">ביטול</button>
    </div>`;
    bind();
  }

  function bind() {
    ov.querySelectorAll('#rows input').forEach(inp => inp.oninput = () => {
      draft[+inp.dataset.i][inp.dataset.f] = inp.value;
      ov.querySelector('#tot').textContent = ils(tot());
    });
    ov.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      draft.splice(+b.dataset.rm, 1);
      if (!draft.length) draft = [{ desc: '', qty: 1, price: 0 }];
      draw();
    });
    ov.querySelector('#add').onclick = () => { draft.push({ desc: '', qty: 1, price: 0 }); draw(); };
    ov.querySelector('#cx').onclick = () => ov.remove();
    ov.querySelector('#ok').onclick = async () => {
      const g = k => { const e = ov.querySelector(`[data-k="${k}"]`); return e ? e.value.trim() : ''; };
      const title = g('title');
      let clientId;
      if (S.clients.length) {
        clientId = g('client');
      } else {
        const nm = g('client');
        if (nm) { const c = { id: uid(), name: nm, phone: '', site: '', note: '' }; S.clients.push(c); clientId = c.id; }
      }
      const items = draft.filter(i => i.desc || Number(i.price) > 0).map(i => ({ desc: i.desc, qty: Number(i.qty) || 0, price: Number(i.price) || 0 }));
      if (!title && !items.length) { alert('הוסיפי כותרת או שורה.'); return; }
      S.jobs.unshift({ id: uid(), clientId, title, site: g('site'), status: 'quote', items, received: 0, date: g('date') || today() });
      await save(); ov.remove(); render();
    };
  }

  draw();
  root.appendChild(ov);
}

async function pay(id) {
  const j = S.jobs.find(x => x.id === id);
  if (!j) return;
  const o = jOwed(j);
  const v = prompt(`כמה התקבל? (נותר ${ils(o)})`, o || '');
  if (v === null) return;
  const a = Number(v);
  if (isNaN(a) || a < 0) { alert('סכום לא תקין'); return; }
  j.received = (Number(j.received) || 0) + a;
  if (j.received >= jTot(j) && jTot(j) > 0) j.status = 'done';
  await save(); render();
}
