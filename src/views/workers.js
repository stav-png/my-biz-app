import { S, save } from '../state.js';
import { ils, uid, esc, today, jTitle } from '../utils.js';
import { openForm } from '../modal.js';
import { render } from '../render.js';

export function vWorkers() {
  const view = document.querySelector('#view');
  view.innerHTML = `<div class="note">מודול עצמאי — לא מסונכרן עם שום מערכת.</div>
    <div style="margin-bottom:12px"><button class="btn primary sm" id="add">+ עובד</button></div>
    ${S.workers.length ? S.workers.map(w => {
      const ent  = S.work.filter(e => e.workerId === w.id);
      const owe  = ent.filter(e => !e.paid).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      return `<div class="row">
        <div class="top">
          <div><div class="who">${esc(w.name)}</div><div class="sub">${esc(w.phone) || '—'}</div></div>
          ${owe > 0 ? `<span class="pill late">חייב ${ils(owe)}</span>` : '<span class="pill done">מעודכן</span>'}
        </div>
        ${ent.length
          ? `<div style="margin-top:9px">${ent.map(e =>
              `<div class="kv">
                <span>${esc(e.date)} · ${esc(e.desc || '')}${e.jobId ? ' · ' + esc(jTitle(e.jobId)) : ''}</span>
                <span class="num">${ils(e.amount)} ${e.paid
                  ? '<span style="color:var(--paid)">✓</span>'
                  : `<button class="btn ghost sm" data-pd="${e.id}">שולם</button>`}
                </span>
              </div>`).join('')}</div>`
          : '<div class="mini" style="margin-top:7px">אין רישומים.</div>'}
        <div class="acts">
          <button class="btn ghost sm" data-we="${w.id}">+ רישום עבודה</button>
          <button class="btn ghost sm" data-dw="${w.id}">מחיקה</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty">אין עובדים.</div>'}`;

  view.querySelector('#add').onclick = addWorker;

  view.querySelectorAll('[data-we]').forEach(b => b.onclick = () =>
    openForm('רישום עבודה', [
      { key: 'date',   label: 'תאריך', type: 'date', def: today() },
      { key: 'jobId',  label: 'עבודה (לא חובה)', type: 'select', options: [{ v: '', t: '— ללא —' }].concat(S.jobs.map(j => ({ v: j.id, t: j.title || 'הצעה' }))) },
      { key: 'desc',   label: 'תיאור' },
      { key: 'amount', label: 'סכום לתשלום', type: 'number' },
    ], v => {
      S.work.push({ id: uid(), workerId: b.dataset.we, date: v.date || today(), jobId: v.jobId || '', desc: v.desc, amount: Number(v.amount) || 0, paid: false });
      save(); render();
    })
  );

  view.querySelectorAll('[data-pd]').forEach(b => b.onclick = async () => {
    S.work.find(x => x.id === b.dataset.pd).paid = true;
    await save(); render();
  });

  view.querySelectorAll('[data-dw]').forEach(b => b.onclick = async () => {
    if (confirm('למחוק עובד?')) {
      S.workers = S.workers.filter(w => w.id !== b.dataset.dw);
      S.work    = S.work.filter(e => e.workerId !== b.dataset.dw);
      await save(); render();
    }
  });
}

export const addWorker = () => openForm('עובד חדש', [
  { key: 'name',  label: 'שם' },
  { key: 'phone', label: 'טלפון' },
], v => { if (!v.name) return 'שם חובה'; S.workers.push({ id: uid(), ...v }); save(); render(); });
