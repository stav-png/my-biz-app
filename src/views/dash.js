import { S } from '../state.js';
import { I } from '../icons.js';
import { ils, vatOf, jTot, jOwed, mKey, mLabel, daysSince, sName, cName, svg, rate } from '../utils.js';

export function vDash() {
  const owedMe = S.jobs.reduce((s, j) => s + jOwed(j), 0);
  const owedW  = S.work.filter(w => !w.paid).reduce((s, w) => s + (Number(w.amount) || 0), 0);
  const tm     = new Date().toISOString().slice(0, 7);
  const inc    = S.jobs.filter(j => mKey(j.date) === tm).reduce((s, j) => s + jTot(j), 0);
  const exp    = S.purchases.filter(p => mKey(p.date) === tm).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const vatNet = vatOf(inc) - vatOf(exp);

  document.querySelector('#view').innerHTML = `
    <div class="stats">
      <div class="stat owe"><div class="ic">${svg(I.coin,'var(--owe)')}</div><div class="label">חייבים לי</div><div class="val num">${ils(owedMe)}</div></div>
      <div class="stat in"><div class="ic">${svg(I.dash,'var(--paid)')}</div><div class="label">הכנסות החודש</div><div class="val num">${ils(inc)}</div></div>
      <div class="stat vat"><div class="ic">${svg(I.vat,'var(--brand)')}</div><div class="label">מע״מ החודש (אומדן)</div><div class="val num">${ils(vatNet)}</div></div>
      <div class="stat pay"><div class="ic">${svg(I.workers,'var(--work)')}</div><div class="label">חייב לעובדים</div><div class="val num">${ils(owedW)}</div></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3><span class="dot"></span>הכנסות מול הוצאות · 6 חודשים</h3>${chart()}</div>
      <div class="panel"><h3><span class="dot"></span>תובנות אוטומטיות</h3><div id="ins"></div></div>
    </div>
    <div class="panel"><h3><span class="dot"></span>פעילות אחרונה</h3>
      ${S.jobs.slice(0, 4).map(j => `<div class="kv"><span>${j.title || 'הצעה'} <span class="mini">· ${cName(j.clientId)}</span></span><span class="num">${ils(jTot(j))}</span></div>`).join('') || '<div class="mini">אין עדיין פעילות.</div>'}
    </div>`;

  insights(document.querySelector('#ins'));
}

function chart() {
  const ms = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    ms.push(x.toISOString().slice(0, 7));
  }
  const data = ms.map(m => ({
    m,
    inc: S.jobs.filter(j => mKey(j.date) === m).reduce((s, j) => s + jTot(j), 0),
    exp: S.purchases.filter(p => mKey(p.date) === m).reduce((s, p) => s + (Number(p.amount) || 0), 0),
  }));
  const max = Math.max(1, ...data.map(d => Math.max(d.inc, d.exp)));
  const W = 420, H = 150, pad = 22, bw = (W - pad * 2) / 6, g = 6;
  let bars = '';
  data.forEach((d, i) => {
    const x = pad + i * bw;
    const ih = d.inc / max * (H - pad - 14);
    const eh = d.exp / max * (H - pad - 14);
    bars += `<rect x="${x+g}" y="${H-14-ih}" width="${bw/2-g-1}" height="${ih}" rx="2" fill="var(--paid)"/>`;
    bars += `<rect x="${x+bw/2}" y="${H-14-eh}" width="${bw/2-g-1}" height="${eh}" rx="2" fill="var(--owe)"/>`;
    bars += `<text x="${x+bw/2}" y="${H-3}" text-anchor="middle" font-size="8" fill="var(--soft)">${mLabel(d.m).split(' ')[0]}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;font-family:inherit">${bars}</svg>
    <div class="mini" style="display:flex;gap:14px;margin-top:6px"><span><b style="color:var(--paid)">▮</b> הכנסות</span><span><b style="color:var(--owe)">▮</b> הוצאות</span></div>`;
}

function insights(el) {
  const out = [];
  const late = S.jobs.filter(j => jOwed(j) > 0 && daysSince(j.date) > 30);
  if (late.length) {
    const t = late.reduce((s, j) => s + jOwed(j), 0);
    out.push(['var(--owe)', I.alert, `<b>${ils(t)}</b> בחובות מעל 30 יום (${late.length} ${late.length > 1 ? 'לקוחות' : 'לקוח'}). שווה להזכיר.`]);
  }
  const byItem = {};
  S.prices.forEach(p => { const k = (p.item || '').trim(); if (!k || !p.price) return; (byItem[k] = byItem[k] || []).push(p); });
  Object.entries(byItem).filter(([, a]) => new Set(a.map(x => x.supplierId)).size > 1).slice(0, 2)
    .forEach(([item, a]) => {
      const min = a.reduce((m, x) => x.price < m.price ? x : m);
      out.push(['var(--paid)', I.spark, `הזול ל<b>${item}</b>: ${sName(min.supplierId)} — ${ils(min.price)}.`]);
    });
  const ow = S.work.filter(w => !w.paid).reduce((s, w) => s + (Number(w.amount) || 0), 0);
  if (ow) out.push(['var(--work)', I.workers, `<b>${ils(ow)}</b> ממתין לתשלום לעובדים.`]);
  if (!out.length) out.push(['var(--brand)', I.spark, 'הוסיפי עבודות, ספקים ורכש — וכאן יופיעו תובנות אוטומטיות (חובות באיחור, ספק הכי זול, ועוד).']);
  el.innerHTML = out.map(o => `<div class="insight"><span class="b" style="background:${o[0]}"><svg viewBox="0 0 24 24">${o[1]}</svg></span><span>${o[2]}</span></div>`).join('');
}
