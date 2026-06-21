import './style.css';
import { load } from './state.js';
import { render } from './render.js';
import { getUser, showAuthScreen } from './auth.js';

const ALLOWED_EMAILS = ['stavchacham@gmail.com'];

(async () => {
  const user = await getUser();
  if (!user) {
    showAuthScreen();
    return;
  }
  if (!ALLOWED_EMAILS.includes(user.email)) {
    document.getElementById('app').innerHTML = `
      <div style="min-height:100vh;background:#f5f0e8;display:flex;align-items:center;justify-content:center;direction:rtl">
        <div style="background:#fff;border-radius:16px;padding:36px;text-align:center;max-width:360px;box-shadow:0 4px 24px rgba(0,0,0,.1)">
          <div style="font-size:2rem;margin-bottom:12px">🚫</div>
          <div style="font-weight:700;font-size:1.1rem;margin-bottom:8px">אין גישה</div>
          <div style="color:#6b7a88;font-size:.88rem">המשתמש ${user.email} אינו מורשה להיכנס למערכת.</div>
          <button onclick="import('./auth.js').then(m=>m.signOut())" style="margin-top:20px;background:#c2601a;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:600">יציאה</button>
        </div>
      </div>`;
    return;
  }
  await load();
  render();
})();
