import { S, save } from '../state.js';
import { ils, uid, esc, today, sName, jTitle, stars } from '../utils.js';
import { openForm } from '../modal.js';
import { render } from '../render.js';

export function vPurchases() {
  const view = document.querySelector('#view');
  view.innerHTML = `<div class="note">כל הזמנה מתעדכנת אוטומטית בתשומות המע״מ + נשמרת למחירון הספק.</div>
    <div style="margin-bottom:12px"><button class="btn primary sm" id="add">+ הזמנת רכש</button></div>
    ${S.purchases.length ? [...S.purchases].reverse().map(p =>
      `<div class="row">
        <div class="top">
          <div><div class="who">${esc(p.item)}</div><div class="sub">${esc(sName(p.supplierId))} · ${esc(p.date)}${p.jobId ? ' · ' + esc(jTitle(p.jobId)) : ''}</div></div>
          <span class="num">${ils(p.amount)}</span>
        </div>
        ${(p.rating || p.ratingNote) ? `<div class="rate">${stars(p.rating)} ${esc(p.ratingNote || '')}</div>` : ''}
        <div class="acts"><button class="btn ghost sm" data-dp="${p.id}">מחיקה</button></div>
      </div>`
    ).join('') : '<div class="empty">אין הזמנות רכש.</div>'}`;

  view.querySelector('#add').onclick = addPurchase;
  view.querySelectorAll('[data-dp]').forEach(b => b.onclick = async () => {
    if (confirm('למחוק?')) { S.purchases = S.purchases.filter(p => p.id !== b.dataset.dp); await save(); render(); }
  });
}

export function addPurchase() {
  if (!S.suppliers.length) { alert('הוסיפי קודם ספק.'); return; }
  openForm('הזמנת רכש', [
    { key: 'supplierId', label: 'ספק', type: 'select', options: S.suppliers.map(s => ({ v: s.id, t: s.name })) },
    { key: 'jobId', label: 'שייך לעבודה (לא חובה)', type: 'select', options: [{ v: '', t: '— ללא —' }].concat(S.jobs.map(j => ({ v: j.id, t: j.title || 'הצעה' }))) },
    { key: 'item',       label: 'פריט / תיאור' },
    { key: 'amount',     label: 'סכום (לפני מע״מ)', type: 'number' },
    { key: 'date',       label: 'תאריך', type: 'date', def: today() },
    { key: 'rating',     label: 'דירוג ספק 1-5', type: 'number' },
    { key: 'ratingNote', label: 'הערה ("פעם הבאה לדבר עם דני…")', type: 'textarea' },
  ], v => {
    if (!v.item) return 'פריט חובה';
    const amt = Number(v.amount) || 0;
    S.purchases.push({ id: uid(), supplierId: v.supplierId, jobId: v.jobId || '', item: v.item, amount: amt, date: v.date || today(), rating: Math.min(5, Math.max(0, Number(v.rating) || 0)), ratingNote: v.ratingNote });
    if (amt > 0) S.prices.push({ id: uid(), supplierId: v.supplierId, item: v.item, price: amt, unit: '', date: v.date || today() });
    save(); render();
  });
}
