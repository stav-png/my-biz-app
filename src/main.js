import './style.css';
import { load } from './state.js';
import { render } from './render.js';
import { getUser, showAuthScreen } from './auth.js';

(async () => {
  const user = await getUser();
  if (!user) {
    showAuthScreen();
    return;
  }
  await load();
  render();
})();
