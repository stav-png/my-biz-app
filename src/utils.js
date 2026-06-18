import { S } from './state.js';
import { I } from './icons.js';

export const ils = n =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n || 0);

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const esc = s =>
  (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const today = () => new Date().toISOString().slice(0, 10);

export const mKey = d => (d || '').slice(0, 7);

export const mLabel = m => {
  const [y, mo] = m.split('-');
  return ['ינו','פבר','מרץ','אפר','מאי','יונ','יול','אוג','ספט','אוק','נוב','דצמ'][+mo - 1] + ' ' + y.slice(2);
};

export const daysSince = d => d ? Math.floor((Date.now() - new Date(d).getTime()) / 864e5) : 0;

export const rate = () => Number(S.settings.vat) || 0;
export const vatOf = n => n * rate() / 100;

export const jTot = j => (j.items || []).reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
export const jOwed = j => Math.max(0, jTot(j) - (Number(j.received) || 0));

export const sName = id => (S.suppliers.find(x => x.id === id) || {}).name || '—';
export const cName = id => (S.clients.find(x => x.id === id) || {}).name || '—';
export const jTitle = id => (S.jobs.find(x => x.id === id) || {}).title || '';

export const stars = n => {
  n = Number(n) || 0;
  return n ? `<span class="stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>` : '';
};

export const pill = s =>
  s === 'work' ? '<span class="pill work">בעבודה</span>' :
  s === 'done' ? '<span class="pill done">הסתיים</span>' :
                 '<span class="pill quote">הצעה</span>';

export const svg = (p, c) =>
  `<svg viewBox="0 0 24 24" style="stroke:${c};fill:none;stroke-width:1.6">${p}</svg>`;

export const searchBox = (ph, id) =>
  `<div class="search"><svg viewBox="0 0 24 24">${I.search}</svg><input id="${id}" placeholder="${ph}"></div>`;

export const bindSearch = (id, setter, rerender) => {
  const el = document.getElementById('app').querySelector('#' + id);
  if (!el) return;
  el.oninput = () => {
    const p = el.selectionStart;
    setter(el.value);
    rerender();
    const ni = document.getElementById('app').querySelector('#' + id);
    if (ni) { ni.focus(); ni.setSelectionRange(p, p); }
  };
};
