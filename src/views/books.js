import { S } from '../state.js';
import { ils, vatOf, mKey, mLabel, rate, esc } from '../utils.js';

export function vBooks() {
  const months = [...new Set([
    ...S.jobs.map(j => mKey(j.date)),
    ...S.purchases.map(p => mKey(p.date)),
  ].filter(Boolean))].sort().reverse();

  let txt = `סיכום ${S.settings.biz} · מע״מ ${rate()}% (אומדן לרו״ח)\n\n`;

  const rows = months.map(m => {
    const out = S.jobs.filter(j => mKey(j.date) === m).reduce((s, j) => s + (j.items || []).reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.price) || 0), 0), 0);
    const inp = S.purchases.filter(p => mKey(p.date) === m).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    txt += `${mLabel(m)}: הכנסות ${Math.round(out)} | הוצאות ${Math.round(inp)} | מע״מ נטו ${Math.round(vatOf(out) - vatOf(inp))}\n`;
    return `<tr><td>${mLabel(m)}</td><td class="num">${ils(out)}</td><td class="num">${ils(inp)}</td><td class="num">${ils(vatOf(out) - vatOf(inp))}</td></tr>`;
  });

  document.querySelector('#view').innerHTML = `
    <div class="note">טבלה חודשית + טקסט מוכן לשליחה. לא תחליף להנהלת חשבונות.</div>
    ${months.length
      ? `<div class="panel"><table class="bk">
           <tr><th>חודש</th><th>הכנסות</th><th>הוצאות</th><th>מע״מ נטו</th></tr>
           ${rows.join('')}
         </table></div>
         <div class="panel"><h3><span class="dot"></span>טקסט למסירה</h3>
           <textarea class="exp" readonly>${esc(txt)}</textarea>
         </div>`
      : '<div class="empty">אין נתונים.</div>'}`;
}
