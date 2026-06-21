import { I } from './icons.js';
import { S } from './state.js';
import { esc, jOwed } from './utils.js';
import { signOut } from './auth.js';
import { vDash }      from './views/dash.js';
import { invoiceForm } from './views/invoice-form.js';
import { vJobs, jobForm }          from './views/jobs.js';
import { vClients, addClient }     from './views/clients.js';
import { vSuppliers, addSupplier } from './views/suppliers.js';
import { vPurchases, addPurchase } from './views/purchases.js';
import { vDebts }    from './views/debts.js';
import { vVat }      from './views/vat.js';
import { vWorkers, addWorker } from './views/workers.js';
import { vBooks }    from './views/books.js';
import { vSettings } from './views/settings.js';

let view = 'dash';
let navOpen = false;

const NAV = [
  ['dash',      'לוח בית',    'dash'],
  ['jobs',      'עבודות',     'jobs'],
  ['clients',   'לקוחות',     'clients'],
  ['suppliers', 'ספקים',      'suppliers'],
  ['purchases', 'רכש',        'purchases'],
  ['debts',     'חייבים',     'debts'],
  ['vat',       'מע״מ',       'vat'],
  ['workers',   'עובדים',     'workers'],
  ['books',     'לרו״ח',      'books'],
  ['settings',  'הגדרות',     'settings'],
];

const TITLES = {
  dash: 'לוח בית', jobs: 'עבודות והצעות', clients: 'לקוחות',
  suppliers: 'ספקים ומחירים', purchases: 'רכש והזמנות', debts: 'חייבים לי',
  vat: 'מע״מ', workers: 'עובדים', books: 'חומר לרואה חשבון', settings: 'הגדרות',
};

const counts = () => ({
  jobs:      S.jobs.length,
  clients:   S.clients.length,
  suppliers: S.suppliers.length,
  purchases: S.purchases.length,
  debts:     S.jobs.filter(j => jOwed(j) > 0).length,
  workers:   S.workers.length,
});

export function render() {
  const c = counts();
  const root = document.getElementById('app');
  root.innerHTML = `
    <div class="scrim ${navOpen ? 'show' : ''}" id="scrim"></div>
    <div class="shell">
      <aside class="sidebar ${navOpen ? 'open' : ''}">
        <div class="brand">
          <div class="logo">${esc((S.settings.biz || 'ע')[0])}</div>
          <div><div class="bn">${esc(S.settings.biz || 'העסק שלי')}</div><div class="bs">ניהול עבודות בנייה</div></div>
        </div>
        ${NAV.map(n =>
          `<button class="nav ${view === n[0] ? 'on' : ''}" data-v="${n[0]}">
            <svg viewBox="0 0 24 24">${I[n[2]]}</svg>
            <span>${n[1]}</span>
            ${c[n[0]] ? `<span class="cnt">${c[n[0]]}</span>` : ''}
          </button>`
        ).join('')}
      </aside>
      <div class="mainwrap">
        <header class="topbar">
          <button class="iconbtn" id="burger"><svg viewBox="0 0 24 24">${I.menu}</svg></button>
          <h2>${TITLES[view]}</h2>
          <div class="sp"></div>
          <button id="signout" style="background:none;border:1px solid var(--line);border-radius:8px;padding:6px 10px;font-size:.76rem;color:var(--soft);cursor:pointer;font-family:inherit">יציאה</button>
          <div class="qadd">
            <button class="btn primary" id="qbtn">
              <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:#fff;fill:none;stroke-width:2.4;vertical-align:-2px">${I.plus}</svg> חדש
            </button>
            <div id="qmenu"></div>
          </div>
        </header>
        <main class="main" id="view"></main>
      </div>
    </div>`;

  root.querySelectorAll('.nav').forEach(b => b.onclick = () => { view = b.dataset.v; navOpen = false; render(); });
  root.querySelector('#burger').onclick = () => { navOpen = !navOpen; render(); };
  root.querySelector('#scrim').onclick  = () => { navOpen = false; render(); };
  root.querySelector('#qbtn').onclick   = quickMenu;
  root.querySelector('#signout').onclick = () => { if (confirm('לצאת מהמערכת?')) signOut(); };

  ({ dash: vDash, jobs: vJobs, clients: vClients, suppliers: vSuppliers, purchases: vPurchases,
     debts: vDebts, vat: vVat, workers: vWorkers, books: vBooks, settings: vSettings })[view]();
}

function quickMenu() {
  const m = document.querySelector('#qmenu');
  if (m.innerHTML) { m.innerHTML = ''; return; }
  m.innerHTML = `<div class="menu">
    <button data-q="invoice" style="font-weight:700;color:var(--brand)">📄 חשבונית חדשה</button>
    <button data-q="job">+ הצעת מחיר</button>
    <button data-q="client">+ לקוח</button>
    <button data-q="supplier">+ ספק</button>
    <button data-q="purchase">+ רכש</button>
    <button data-q="worker">+ עובד</button>
  </div>`;
  m.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
    m.innerHTML = '';
    ({ invoice: invoiceForm, job: jobForm, client: addClient, supplier: addSupplier, purchase: addPurchase, worker: addWorker })[b.dataset.q]();
  });
}
