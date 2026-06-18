import { S, save } from '../state.js';
import { ils, jTot, jOwed, cName, esc, daysSince } from '../utils.js';
import { render } from '../render.js';

export function vDebts() {
  const list = S.jobs.filter(j => jOwed(j) > 0).sort((a, b) => daysSince(b.date) - daysSince(a.date));
  const tot  = list.reduce((s, j) => s + jOwed(j), 0);
  const view = document.querySelector('#view');
  view.innerHTML = `<div class="note">סה״כ פתוח: <b class="num">${ils(tot)}</b> · ממוין מהישן לחדש</div>
    ${list.length ? list.map(j => {
      const d = daysSince(j.date);
      return `<div class="row">
        <div class="top">
          <div>
            <div class="who">${esc(cName(j.clientId))}</div>
            <div class="sub">על: ${esc(j.title || 'עבודה')}${(j.items && j.items.length) ? ' — ' + esc(j.items.map(i => i.desc).filter(Boolean).join(', ')) : ''}</div>
          </div>
          <div style="text-align:left">
            <div class="o num">${ils(jOwed(j))}</div>
            ${d > 30 ? `<span class="pill late">${d} ימים</span>` : `<span class="mini">${d} ימים</span>`}
          </div>
        </div>
        <div class="mini" style="margin-top:6px">מתוך ${ils(jTot(j))} · התקבל ${ils(Number(j.received) || 0)}</div>
        <div class="acts"><button class="btn ghost sm" data-pay="${j.id}">רישום תשלום</button></div>
      </div>`;
    }).join('') : '<div class="empty">אין חובות פתוחים 🎉</div>'}`;

  view.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => payDebt(b.dataset.pay));
}

async function payDebt(id) {
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
