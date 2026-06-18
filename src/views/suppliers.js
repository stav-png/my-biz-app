import { S, save } from '../state.js';
import { ils, uid, esc, today, sName, stars, bindSearch } from '../utils.js';
import { openForm } from '../modal.js';
import { render } from '../render.js';
import { I } from '../icons.js';

let pcq = '';

export function vSuppliers() {
  let cmpHtml = '';
  if (pcq) {
    const q = pcq.toLowerCase();
    const matches = S.prices.filter(p => (p.item || '').toLowerCase().includes(q)).sort((a, b) => a.price - b.price);
    cmpHtml = `<div class="panel"><h3><span class="dot"></span>השוואת מחירים: "${esc(pcq)}"</h3>
      ${matches.length ? matches.map((p, i) =>
        `<div class="kv"><span>${esc(sName(p.supplierId))} <span class="mini">${esc(p.item)} ${esc(p.unit || '')}</span></span>
        <span class="num">${ils(p.price)} ${i === 0 ? '<span class="cheap">הכי זול</span>' : ''}</span></div>`
      ).join('') : '<div class="mini">לא נמצאו מחירים לפריט הזה.</div>'}
    </div>`;
  }

  const view = document.querySelector('#view');
  view.innerHTML = `<div class="search"><svg viewBox="0 0 24 24">${I.search}</svg>
      <input id="pcq" placeholder="השוואת מחירים — הקלידי פריט (למשל: טיח גבס)…"></div>
    ${cmpHtml}
    <div style="margin-bottom:12px"><button class="btn primary sm" id="add">+ ספק</button></div>
    ${S.suppliers.length ? S.suppliers.map(s => {
      const pr = S.prices.filter(p => p.supplierId === s.id);
      const rs = S.purchases.filter(p => p.supplierId === s.id && (p.ratingNote || p.rating));
      return `<div class="row">
        <div class="top"><div><div class="who">${esc(s.name)}</div><div class="sub">${esc(s.phone) || '—'}</div></div></div>
        ${pr.length
          ? `<div style="margin-top:9px">${pr.slice(-5).map(p => `<div class="kv"><span>${esc(p.item)} <span class="mini">${esc(p.unit || '')}</span></span><span class="num">${ils(p.price)}</span></div>`).join('')}</div>`
          : '<div class="mini" style="margin-top:7px">אין מחירים שמורים.</div>'}
        ${rs.length ? `<div class="rate">${stars(rs[rs.length - 1].rating)} ${esc(rs[rs.length - 1].ratingNote || '')}</div>` : ''}
        <div class="acts">
          <button class="btn ghost sm" data-ap="${s.id}">+ מחיר</button>
          <button class="btn ghost sm" data-ds="${s.id}">מחיקה</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty">אין ספקים.</div>'}`;

  bindSearch('pcq', v => pcq = v, vSuppliers);
  view.querySelector('#add').onclick = addSupplier;
  view.querySelectorAll('[data-ap]').forEach(b => b.onclick = () =>
    openForm('מחיר לספק', [
      { key: 'item',  label: 'פריט' },
      { key: 'price', label: 'מחיר (לפני מע״מ)', type: 'number' },
      { key: 'unit',  label: 'יחידה' },
    ], v => {
      if (!v.item) return 'פריט חובה';
      S.prices.push({ id: uid(), supplierId: b.dataset.ap, item: v.item, price: Number(v.price) || 0, unit: v.unit, date: today() });
      save(); render();
    })
  );
  view.querySelectorAll('[data-ds]').forEach(b => b.onclick = async () => {
    if (confirm('למחוק ספק?')) {
      S.suppliers = S.suppliers.filter(s => s.id !== b.dataset.ds);
      S.prices    = S.prices.filter(p => p.supplierId !== b.dataset.ds);
      await save(); render();
    }
  });
}

export const addSupplier = () => openForm('ספק חדש', [
  { key: 'name',  label: 'שם' },
  { key: 'phone', label: 'טלפון' },
  { key: 'note',  label: 'הערה', type: 'textarea' },
], v => { if (!v.name) return 'שם חובה'; S.suppliers.push({ id: uid(), ...v }); save(); render(); });
