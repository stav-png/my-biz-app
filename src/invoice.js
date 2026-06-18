import { S, save } from './state.js';
import { ils, vatOf, jTot, rate, esc } from './utils.js';

const THRESHOLD = 5000; // מ-1.6.2026 — חובת מספר הקצאה מ-₪5,000 כולל מע"מ

export async function printInvoice(jobId) {
  const job = S.jobs.find(j => j.id === jobId);
  if (!job) return;

  const total  = jTot(job);
  const vat    = vatOf(total);
  const grand  = total + vat;

  // בדיקת שדות חובה בהגדרות העסק
  if (!S.settings.vatId) {
    alert('חובה להזין מספר עוסק מורשה בהגדרות לפני הפקת חשבונית.');
    return;
  }

  // חסימה לפי חוק — מעל ₪5,000 חובה מספר הקצאה
  if (grand >= THRESHOLD) {
    if (!job.allocationNumber) {
      const num = prompt(
        `⚠️ חובה חוקית — החשבונית מעל ₪${THRESHOLD.toLocaleString('he-IL')}.\n\n` +
        `יש להיכנס לאתר רשות המסים, לבקש מספר הקצאה, ולהזין אותו כאן:\n` +
        `https://www.gov.il/he/service/request-assignment-number-for-tax-invoice`
      );
      if (!num || !num.trim()) {
        alert('לא ניתן להפיק חשבונית ללא מספר הקצאה. החשבונית לא תוצא.');
        return;
      }
      job.allocationNumber = num.trim();
      await save();
    }
  }

  // מספור חשבונית
  if (!job.invoiceNumber) {
    job.invoiceNumber = generateInvoiceNumber();
    await save();
  }

  const client      = S.clients.find(c => c.id === job.clientId) || {};
  const invNum      = job.invoiceNumber;
  const withholdPct = Number(client.withholdPct) || 0;
  const withholdAmt = grand * withholdPct / 100;
  const toPay       = grand - withholdAmt;

  const rows = (job.items || []).map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(item.desc || '')}</td>
      <td class="n">${Number(item.qty) || 0}</td>
      <td class="n">${ils(Number(item.price) || 0)}</td>
      <td class="n">${ils((Number(item.qty) || 0) * (Number(item.price) || 0))}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>חשבונית מס ${invNum}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; color: #1b2a36; background: #fff; padding: 40px; direction: rtl; font-size: 14px; }
    .page { max-width: 780px; margin: 0 auto; }

    /* כותרת */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #11716e; }
    .biz-name { font-size: 1.5rem; font-weight: 800; color: #11716e; }
    .biz-details { font-size: .82rem; color: #64727f; margin-top: 5px; line-height: 1.7; }
    .inv-box { text-align: left; background: #f5f9f8; border: 1px solid #c5e0de; border-radius: 10px; padding: 12px 16px; min-width: 200px; }
    .inv-box .type { font-size: .7rem; color: #64727f; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 3px; }
    .inv-box .num { font-size: 1.2rem; font-weight: 800; color: #11716e; }
    .inv-box .meta { font-size: .8rem; color: #64727f; margin-top: 4px; line-height: 1.6; }

    /* צדדים */
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e3e7ec; }
    .party h4 { font-size: .7rem; color: #64727f; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
    .party .name { font-weight: 700; font-size: .95rem; margin-bottom: 3px; }
    .party .detail { font-size: .82rem; color: #64727f; line-height: 1.6; }

    /* טבלה */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: .88rem; }
    thead tr { background: #11716e; color: #fff; }
    thead th { padding: 9px 10px; font-weight: 600; text-align: right; }
    thead th.n { text-align: left; }
    tbody tr:nth-child(even) { background: #f7f9fa; }
    tbody td { padding: 8px 10px; border-bottom: 1px solid #e3e7ec; }
    tbody td.n { text-align: left; }

    /* סיכום */
    .summary { display: flex; justify-content: flex-start; margin-bottom: 20px; }
    .totals { width: 280px; border: 1px solid #e3e7ec; border-radius: 10px; overflow: hidden; }
    .totals .row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: .88rem; border-bottom: 1px solid #e3e7ec; }
    .totals .row:last-child { border: none; background: #11716e; color: #fff; font-weight: 800; font-size: .95rem; }

    /* מספר הקצאה */
    .allocation { background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: .83rem; }
    .allocation .label { font-weight: 700; color: #2e7d32; margin-bottom: 2px; }
    .allocation .value { font-size: 1rem; font-weight: 800; color: #1b5e20; letter-spacing: .05em; }

    /* הערות */
    .notes { font-size: .82rem; color: #64727f; margin-bottom: 20px; }

    /* כותרת תחתונה */
    .footer { border-top: 1px solid #e3e7ec; padding-top: 12px; font-size: .75rem; color: #9eaab5; text-align: center; line-height: 1.8; }

    /* כפתור הדפסה */
    .print-btn { margin-top: 28px; text-align: center; }
    .print-btn button { background: #11716e; color: #fff; border: none; padding: 12px 32px; border-radius: 10px; font-size: 1rem; cursor: pointer; font-family: inherit; font-weight: 600; }

    @media print {
      body { padding: 15px; }
      .print-btn { display: none; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- כותרת -->
  <div class="header">
    <div>
      <div class="biz-name">${esc(S.settings.biz || 'העסק שלי')}</div>
      <div class="biz-details">
        עוסק מורשה: <b>${esc(S.settings.vatId || '')}</b><br>
        ${S.settings.phone   ? `טלפון: ${esc(S.settings.phone)}<br>` : ''}
        ${S.settings.address ? `כתובת: ${esc(S.settings.address)}<br>` : ''}
      </div>
    </div>
    <div class="inv-box">
      <div class="type">חשבונית מס</div>
      <div class="num">מס׳ ${esc(String(invNum))}</div>
      <div class="meta">
        תאריך: ${esc(job.date || '')}<br>
        סה״כ לתשלום: <b>${ils(grand)}</b>
      </div>
    </div>
  </div>

  <!-- צדדים -->
  <div class="parties">
    <div class="party">
      <h4>מאת (מוכר)</h4>
      <div class="name">${esc(S.settings.biz || '')}</div>
      <div class="detail">עוסק מורשה מס׳ ${esc(S.settings.vatId || '')}</div>
    </div>
    <div class="party">
      <h4>לכבוד (קונה)</h4>
      <div class="name">${esc(client.name || '—')}</div>
      <div class="detail">
        ${client.phone ? esc(client.phone) + '<br>' : ''}
        ${client.site  ? esc(client.site)  : ''}
        ${client.vatId ? '<br>ח.פ / עוסק: ' + esc(client.vatId) : ''}
      </div>
    </div>
  </div>

  <!-- נושא -->
  ${job.title ? `<div class="notes" style="margin-bottom:12px">נושא: <b>${esc(job.title)}</b></div>` : ''}

  <!-- שורות -->
  <table>
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th>תיאור</th>
        <th class="n" style="width:70px">כמות</th>
        <th class="n" style="width:110px">מחיר יחידה</th>
        <th class="n" style="width:110px">סה״כ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- סיכום -->
  <div class="summary">
    <div class="totals">
      <div class="row"><span>סכום לפני מע״מ</span><span>${ils(total)}</span></div>
      <div class="row"><span>מע״מ (${rate()}%)</span><span>${ils(vat)}</span></div>
      <div class="row"><span>סה״כ כולל מע״מ</span><span>${ils(grand)}</span></div>
      ${withholdPct > 0 ? `
      <div class="row" style="background:#fff8f0;color:#b45309"><span>ניכוי מס במקור (${withholdPct}%)</span><span>- ${ils(withholdAmt)}</span></div>
      <div class="row"><span>לתשלום בפועל</span><span>${ils(toPay)}</span></div>
      ` : ''}
      <div class="row" style="background:#11716e;color:#fff;font-weight:800"><span>${withholdPct > 0 ? 'לתשלום נטו' : 'סה״כ לתשלום'}</span><span>${ils(withholdPct > 0 ? toPay : grand)}</span></div>
    </div>
  </div>

  <!-- מספר הקצאה (אם קיים) -->
  ${job.allocationNumber ? `
  <div class="allocation">
    <div class="label">✅ מספר הקצאה (חשבוניות ישראל)</div>
    <div class="value">${esc(job.allocationNumber)}</div>
  </div>` : `
  <div style="font-size:.78rem;color:#9eaab5;margin-bottom:12px;">
    * חשבונית זו מתחת לסף חובת מספר הקצאה (₪${THRESHOLD.toLocaleString('he-IL')} כולל מע״מ)
  </div>`}

  <!-- כותרת תחתונה -->
  <div class="footer">
    ${esc(S.settings.biz || '')} · עוסק מורשה ${esc(S.settings.vatId || '')}
    ${S.settings.phone ? ' · ' + esc(S.settings.phone) : ''}
    <br>מסמך זה הופק ב-${new Date().toLocaleDateString('he-IL', { year:'numeric', month:'long', day:'numeric' })}
  </div>

  <div class="print-btn">
    <button onclick="window.print()">🖨 הדפסה / שמירה כ-PDF</button>
  </div>

</div>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

function generateInvoiceNumber() {
  const existing = S.jobs
    .filter(j => j.invoiceNumber)
    .map(j => Number(j.invoiceNumber))
    .filter(n => !isNaN(n));
  const max = existing.length ? Math.max(...existing) : 999;
  return max + 1;
}
