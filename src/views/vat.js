import { S } from '../state.js';
import { ils, vatOf, mKey, mLabel, rate } from '../utils.js';

export function vVat() {
  const months = [...new Set([
    ...S.jobs.map(j => mKey(j.date)),
    ...S.purchases.map(p => mKey(p.date)),
  ].filter(Boolean))].sort().reverse();

  document.querySelector('#view').innerHTML = `
    <div class="note">אומדן ${rate()}% לפי תאריך עסקה · למסירה לרו״ח, לא דיווח רשמי.</div>
    ${months.length ? months.map(m => {
      const out = S.jobs.filter(j => mKey(j.date) === m).reduce((s, j) => s + (j.items || []).reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.price) || 0), 0), 0);
      const inp = S.purchases.filter(p => mKey(p.date) === m).reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const net = vatOf(out) - vatOf(inp);
      return `<div class="panel"><h3><span class="dot"></span>${mLabel(m)}</h3>
        <div class="kv"><span>עסקאות (הכנסות)</span><span class="num">${ils(out)}</span></div>
        <div class="kv"><span>מע״מ עסקאות</span><span class="num">${ils(vatOf(out))}</span></div>
        <div class="kv"><span>תשומות (רכש)</span><span class="num">${ils(inp)}</span></div>
        <div class="kv"><span>מע״מ תשומות</span><span class="num">${ils(vatOf(inp))}</span></div>
        <div class="kv"><b>מע״מ לתשלום</b><b class="num" style="color:${net >= 0 ? 'var(--owe)' : 'var(--paid)'}">${ils(net)}</b></div>
      </div>`;
    }).join('') : '<div class="empty">אין נתונים.</div>'}`;
}
