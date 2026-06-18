import { S, save } from '../state.js';
import { ils, jOwed, jTot, uid, esc, searchBox, bindSearch, pill } from '../utils.js';
import { openForm } from '../modal.js';
import { render } from '../render.js';
import { printInvoice } from '../invoice.js';

let cq = '';

export function vClients() {
  const list = S.clients.filter(c => !cq || c.name.toLowerCase().includes(cq.toLowerCase()));
  const view = document.querySelector('#view');

  view.innerHTML = searchBox('חיפוש לקוח…', 'cq') +
    `<div style="margin-bottom:12px"><button class="btn primary sm" id="add">+ לקוח</button></div>` +
    (list.length ? list.map(c => {
      const jobs     = S.jobs.filter(j => j.clientId === c.id);
      const totalOwed = jobs.reduce((s, j) => s + jOwed(j), 0);
      const checkUrl = `https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx${c.vatId ? '?hp=' + encodeURIComponent(c.vatId) : ''}`;

      const jobRows = jobs.length
        ? jobs.map(j => `
          <div class="kv" style="align-items:center">
            <span>
              ${esc(j.title || 'עבודה')}
              ${j.site ? `<span class="mini"> · 📍 ${esc(j.site)}</span>` : ''}
              <span class="mini"> · ${esc(j.date || '')}</span>
              ${pill(j.status)}
            </span>
            <span style="display:flex;gap:6px;align-items:center">
              <span class="num">${ils(jTot(j))}</span>
              <button class="btn ghost sm" data-inv="${j.id}">📄</button>
            </span>
          </div>`).join('')
        : `<div class="mini" style="padding:6px 0;color:var(--soft)">אין עבודות עדיין.</div>`;

      return `<div class="row">
        <div class="top">
          <div>
            <div class="who">${esc(c.name)}</div>
            <div class="sub">
              ${esc(c.phone) || '—'}
              ${c.vatId ? ` · ח.פ ${esc(c.vatId)}` : ''}
              ${c.site  ? ` · ${esc(c.site)}` : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            ${totalOwed > 0 ? `<span class="pill late">חייב ${ils(totalOwed)}</span>` : ''}
            ${Number(c.withholdPct) > 0
              ? `<span class="pill work">ניכוי ${c.withholdPct}%</span>`
              : `<span class="pill quote">ניכוי 0%</span>`}
          </div>
        </div>
        ${c.note ? `<div class="sub" style="margin-top:6px">${esc(c.note)}</div>` : ''}
        <div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px">${jobRows}</div>
        <div class="acts" style="margin-top:8px">
          ${c.vatId ? `<a href="${checkUrl}" target="_blank" class="btn ghost sm">🔍 אישור ניכוי</a>` : ''}
          <button class="btn ghost sm" data-ec="${c.id}">עריכה</button>
          <button class="btn ghost sm" data-dc="${c.id}">מחיקה</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty">אין לקוחות.</div>');

  bindSearch('cq', v => cq = v, vClients);
  view.querySelector('#add').onclick = addClient;
  view.querySelectorAll('[data-inv]').forEach(b => b.onclick = () => printInvoice(b.dataset.inv));
  view.querySelectorAll('[data-ec]').forEach(b => b.onclick = () => {
    const c = S.clients.find(x => x.id === b.dataset.ec);
    if (!c) return;
    openForm('עריכת לקוח', clientFields, v => {
      if (!v.name) return 'שם חובה';
      Object.assign(c, { ...v, withholdPct: Number(v.withholdPct) || 0 });
      save(); render();
    }, c);
  });
  view.querySelectorAll('[data-dc]').forEach(b => b.onclick = async () => {
    if (confirm('למחוק לקוח?')) { S.clients = S.clients.filter(c => c.id !== b.dataset.dc); await save(); render(); }
  });
}

const clientFields = [
  { key: 'name',        label: 'שם' },
  { key: 'phone',       label: 'טלפון' },
  { key: 'vatId',       label: 'ח.פ / מספר עוסק' },
  { key: 'withholdPct', label: 'ניכוי מס במקור (%)', type: 'number' },
  { key: 'site',        label: 'כתובת / אתר' },
  { key: 'note',        label: 'הערה', type: 'textarea' },
];

export const addClient = () => openForm('לקוח חדש', clientFields,
  v => { if (!v.name) return 'שם חובה'; S.clients.push({ id: uid(), ...v, withholdPct: Number(v.withholdPct) || 0 }); save(); render(); });
