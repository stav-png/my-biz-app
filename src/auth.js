import { supabase } from './supabase.js';

export async function getUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function signOut() {
  await supabase.auth.signOut();
  location.reload();
}

export function showAuthScreen() {
  let mode = 'login'; // 'login' | 'signup' | 'forgot'

  const root = document.getElementById('app');

  function draw() {
    root.innerHTML = `
    <div style="min-height:100vh;background:#f5f0e8;display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;">
      <div style="background:#fffdf9;border-radius:20px;box-shadow:0 8px 40px rgba(90,60,20,.12);padding:36px 32px;width:100%;max-width:400px;border:1px solid #e8e2d9;">

        <!-- לוגו -->
        <div style="text-align:center;margin-bottom:28px">
          <div style="width:52px;height:52px;background:linear-gradient(135deg,#d97722,#c2601a);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
            <span style="color:#fff;font-size:1.5rem">🏗️</span>
          </div>
          <div style="font-size:1.2rem;font-weight:800;color:#1e2c38">ניהול עסק בנייה</div>
          <div style="font-size:.8rem;color:#6b7a88;margin-top:3px">
            ${mode === 'login' ? 'ברוכים השבים!' : mode === 'signup' ? 'יצירת חשבון חדש' : 'איפוס סיסמא'}
          </div>
        </div>

        ${mode === 'forgot' ? `
          <!-- איפוס סיסמא -->
          <div style="margin-bottom:14px">
            <label style="display:block;font-size:.76rem;color:#6b7a88;margin-bottom:5px">אימייל</label>
            <input id="f-email" type="email" placeholder="your@email.com" style="width:100%;padding:10px 12px;border:1px solid #e8e2d9;border-radius:10px;font-size:.92rem;font-family:inherit;background:#fff;direction:ltr;text-align:left">
          </div>
          <button id="btn-main" style="width:100%;background:#c2601a;color:#fff;border:none;padding:12px;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:14px">שלח קישור לאיפוס</button>
          <div id="msg" style="font-size:.8rem;text-align:center;min-height:20px;color:#c2601a"></div>
          <button id="btn-back" style="width:100%;background:none;border:none;color:#6b7a88;font-size:.82rem;cursor:pointer;margin-top:8px;font-family:inherit">חזרה להתחברות</button>
        ` : `
          <!-- התחברות / הרשמה -->
          <div style="margin-bottom:14px">
            <label style="display:block;font-size:.76rem;color:#6b7a88;margin-bottom:5px">אימייל</label>
            <input id="f-email" type="email" placeholder="your@email.com" style="width:100%;padding:10px 12px;border:1px solid #e8e2d9;border-radius:10px;font-size:.92rem;font-family:inherit;background:#fff;direction:ltr;text-align:left">
          </div>
          <div style="margin-bottom:6px">
            <label style="display:block;font-size:.76rem;color:#6b7a88;margin-bottom:5px">סיסמא</label>
            <div style="position:relative">
              <input id="f-pass" type="password" placeholder="לפחות 6 תווים" style="width:100%;padding:10px 36px 10px 12px;border:1px solid #e8e2d9;border-radius:10px;font-size:.92rem;font-family:inherit;background:#fff;direction:ltr;text-align:left">
              <button id="toggle-pass" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;color:#6b7a88" title="הצג/הסתר">👁</button>
            </div>
          </div>
          ${mode === 'login' ? `<div style="text-align:left;margin-bottom:16px"><button id="btn-forgot" style="background:none;border:none;color:#c2601a;font-size:.78rem;cursor:pointer;font-family:inherit">שכחתי סיסמא</button></div>` : '<div style="margin-bottom:16px"></div>'}
          <button id="btn-main" style="width:100%;background:#c2601a;color:#fff;border:none;padding:12px;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:12px">
            ${mode === 'login' ? 'כניסה' : 'יצירת חשבון'}
          </button>
          <div id="msg" style="font-size:.8rem;text-align:center;min-height:20px;color:#b44444"></div>
          <div style="text-align:center;margin-top:12px;font-size:.82rem;color:#6b7a88">
            ${mode === 'login' ? 'אין לך חשבון?' : 'כבר יש לך חשבון?'}
            <button id="btn-toggle" style="background:none;border:none;color:#c2601a;font-weight:700;cursor:pointer;font-family:inherit;font-size:.82rem">
              ${mode === 'login' ? 'הרשמה' : 'התחברות'}
            </button>
          </div>
        `}
      </div>
    </div>`;

    // bind
    const msg = root.querySelector('#msg');
    const setMsg = (txt, ok) => { msg.textContent = txt; msg.style.color = ok ? '#1a7a50' : '#b44444'; };

    root.querySelector('#toggle-pass')?.addEventListener('click', () => {
      const p = root.querySelector('#f-pass');
      p.type = p.type === 'password' ? 'text' : 'password';
    });

    root.querySelector('#btn-forgot')?.addEventListener('click', () => { mode = 'forgot'; draw(); });
    root.querySelector('#btn-back')?.addEventListener('click', () => { mode = 'login'; draw(); });
    root.querySelector('#btn-toggle')?.addEventListener('click', () => { mode = mode === 'login' ? 'signup' : 'login'; draw(); });

    root.querySelector('#btn-main').addEventListener('click', async () => {
      const email = root.querySelector('#f-email').value.trim();

      if (mode === 'forgot') {
        if (!email) { setMsg('נא להכניס אימייל'); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setMsg('שגיאה: ' + error.message);
        else setMsg('נשלח! בדקי את האימייל שלך ✓', true);
        return;
      }

      const pass = root.querySelector('#f-pass').value;
      if (!email || !pass) { setMsg('נא למלא אימייל וסיסמא'); return; }
      if (pass.length < 6) { setMsg('הסיסמא חייבת להכיל לפחות 6 תווים'); return; }

      const btn = root.querySelector('#btn-main');
      btn.textContent = '...'; btn.disabled = true;

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) { setMsg('אימייל או סיסמא שגויים'); btn.textContent = 'כניסה'; btn.disabled = false; }
        else location.reload();
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) { setMsg('שגיאה: ' + error.message); btn.textContent = 'יצירת חשבון'; btn.disabled = false; }
        else setMsg('נרשמת! בדקי את האימייל לאישור ✓', true);
      }
    });

    // Enter להגשה
    root.querySelectorAll('input').forEach(inp => inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') root.querySelector('#btn-main').click();
    }));
  }

  draw();
}
