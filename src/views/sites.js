import { S } from '../state.js';
import { ils, jTot, cName, esc } from '../utils.js';
import { printInvoice } from '../invoice.js';

export function vSites() {
  // אוסף כל האתרים הייחודיים מכל העבודות
  const siteNames = [...new Set(S.jobs.map(j => j.site).filter(Boolean))].sort();
  const view = document.querySelector('#view');

  if (!siteNames.length) {
    view.innerHTML = '<div class="empty">אין אתרים עדיין.<br><span class="mini">הוסיפי שדה "אתר" בעת פתיחת עבודה חדשה.</span></div>';
    return;
  }

  view.innerHTML = siteNames.map(site => {
    // עבודות באתר
    const jobs      = S.jobs.filter(j => j.site === site);
    const revenue   = jobs.reduce((s, j) => s + jTot(j), 0);

    // הוצאות רכש — מקושרות לעבודות של האתר
    const jobIds    = new Set(jobs.map(j => j.id));
    const purchases = S.purchases.filter(p => jobIds.has(p.jobId));
    const purCost   = purchases.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    // עלויות עובדים — מקושרות לעבודות של האתר
    const workCost  = S.work.filter(w => jobIds.has(w.jobId)).reduce((s, w) => s + (Number(w.amount) || 0), 0);

    const totalCost = purCost + workCost;
    const profit    = revenue - totalCost;
    const isProfit  = profit >= 0;

    return `<div class="panel">
      <h3>
        <span class="dot"></span>
        📍 ${esc(site)}
        <span style="margin-inline-start:auto;font-size:.8rem;font-weight:700;color:${isProfit ? 'var(--paid)' : 'var(--owe)'}">
          ${isProfit ? '▲' : '▼'} ${ils(Math.abs(profit))}
        </span>
      </h3>

      <!-- סיכום פיננסי -->
      <div class="stats" style="margin-bottom:12px">
        <div class="stat in">
          <div class="label">הכנסות</div>
          <div class="val num">${ils(revenue)}</div>
        </div>
        <div class="stat owe">
          <div class="label">הוצאות רכש</div>
          <div class="val num">${ils(purCost)}</div>
        </div>
        <div class="stat pay">
          <div class="label">עלויות עובדים</div>
          <div class="val num">${ils(workCost)}</div>
        </div>
        <div class="stat ${isProfit ? 'in' : 'owe'}" style="border-inline-start-width:3px">
          <div class="label">רווח / הפסד נטו</div>
          <div class="val num">${ils(profit)}</div>
        </div>
      </div>

      <!-- עבודות וחשבוניות -->
      <div style="margin-bottom:10px">
        <div class="mini" style="margin-bottom:6px;font-weight:600">עבודות וחשבוניות</div>
        ${jobs.map(j => `
          <div class="kv" style="align-items:center">
            <span>${esc(j.title || 'עבודה')} <span class="mini">· ${esc(cName(j.clientId))} · ${esc(j.date || '')}</span></span>
            <span style="display:flex;gap:6px;align-items:center">
              <span class="num">${ils(jTot(j))}</span>
              <button class="btn primary sm" data-inv="${j.id}">📄 חשבונית</button>
            </span>
          </div>`).join('')}
      </div>

      <!-- הוצאות רכש -->
      ${purchases.length ? `
      <div style="margin-bottom:10px">
        <div class="mini" style="margin-bottom:6px;font-weight:600">רכש והוצאות</div>
        ${purchases.map(p => `
          <div class="kv">
            <span>${esc(p.item)} <span class="mini">· ${esc(p.date || '')}</span></span>
            <span class="num">${ils(p.amount)}</span>
          </div>`).join('')}
      </div>` : ''}

      <!-- עלויות עובדים -->
      ${S.work.filter(w => jobIds.has(w.jobId)).length ? `
      <div>
        <div class="mini" style="margin-bottom:6px;font-weight:600">עובדים</div>
        ${S.work.filter(w => jobIds.has(w.jobId)).map(w => {
          const worker = S.workers.find(x => x.id === w.workerId) || {};
          return `<div class="kv">
            <span>${esc(worker.name || '—')} <span class="mini">· ${esc(w.desc || '')} · ${esc(w.date || '')}</span></span>
            <span class="num">${ils(w.amount)}</span>
          </div>`;
        }).join('')}
      </div>` : ''}
    </div>`;
  }).join('');

  view.querySelectorAll('[data-inv]').forEach(b => b.onclick = () => printInvoice(b.dataset.inv));
}
