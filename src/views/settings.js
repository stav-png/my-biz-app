import { S, save, replaceS } from '../state.js';
import { esc } from '../utils.js';
import { render } from '../render.js';

export function vSettings() {
  const view = document.querySelector('#view');
  view.innerHTML = `
    <div class="panel">
      <div class="field"><label>שם העסק</label><input id="sbiz" value="${esc(S.settings.biz)}"></div>
      <div class="field"><label>טלפון</label><input id="sphone" value="${esc(S.settings.phone || '')}"></div>
      <div class="field"><label>כתובת</label><input id="saddress" value="${esc(S.settings.address || '')}"></div>
      <div class="field"><label>מספר עוסק מורשה</label><input id="svatid" value="${esc(S.settings.vatId || '')}"></div>
      <div class="field"><label>שיעור מע״מ (%)</label><input id="svat" type="number" step="any" value="${S.settings.vat}"></div>
      <button class="btn primary" id="ss">שמירה</button>
    </div>
    <div class="panel">
      <h3><span class="dot"></span>נתונים</h3>
      <div class="mini" style="margin-bottom:9px">הנתונים נשמרים מקומית במכשיר זה.</div>
      <button class="btn ghost" id="rs">איפוס כל הנתונים</button>
    </div>`;

  view.querySelector('#ss').onclick = async () => {
    S.settings.biz     = view.querySelector('#sbiz').value.trim() || 'העסק שלי';
    S.settings.phone   = view.querySelector('#sphone').value.trim();
    S.settings.address = view.querySelector('#saddress').value.trim();
    S.settings.vatId   = view.querySelector('#svatid').value.trim();
    S.settings.vat     = Number(view.querySelector('#svat').value) || 0;
    await save(); render();
  };

  view.querySelector('#rs').onclick = async () => {
    if (confirm('למחוק הכל לצמיתות?')) {
      replaceS({ settings: { vat: 18, biz: 'העסק שלי' }, clients: [], jobs: [], suppliers: [], prices: [], purchases: [], workers: [], work: [] });
      await save(); render();
    }
  };
}
