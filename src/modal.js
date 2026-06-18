import { esc } from './utils.js';

const root = () => document.getElementById('app');

export function openForm(title, fields, onSave, init) {
  init = init || {};
  const ov = document.createElement('div');
  ov.className = 'ov';
  ov.dir = 'rtl';

  const html = fields.map(f => {
    const v = init[f.key] != null ? init[f.key] : (f.def != null ? f.def : '');
    if (f.type === 'select') {
      return `<div class="field"><label>${esc(f.label)}</label><select data-k="${f.key}">${
        f.options.map(o => `<option value="${esc(o.v)}" ${String(o.v) === String(v) ? 'selected' : ''}>${esc(o.t)}</option>`).join('')
      }</select></div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="field"><label>${esc(f.label)}</label><textarea data-k="${f.key}" rows="2">${esc(v)}</textarea></div>`;
    }
    const t = f.type || 'text';
    return `<div class="field"><label>${esc(f.label)}</label><input data-k="${f.key}" type="${t}" ${t === 'number' ? 'step="any" min="0"' : ''} value="${esc(v)}" placeholder="${esc(f.ph || '')}"></div>`;
  }).join('');

  ov.innerHTML = `<div class="modal"><h3>${esc(title)}</h3>${html}
    <button class="btn primary full" data-a="ok">שמירה</button>
    <button class="btn ghost full" data-a="cx" style="margin-top:8px">ביטול</button></div>`;

  root().appendChild(ov);

  ov.querySelector('[data-a="cx"]').onclick = () => ov.remove();
  ov.querySelector('[data-a="ok"]').onclick = () => {
    const o = {};
    ov.querySelectorAll('[data-k]').forEach(el => o[el.dataset.k] = el.value.trim());
    const err = onSave(o);
    if (err) { alert(err); return; }
    ov.remove();
  };

  const f0 = ov.querySelector('input,select,textarea');
  if (f0) f0.focus();
}
