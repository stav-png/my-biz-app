import './style.css';
import { load } from './state.js';
import { render } from './render.js';

(async () => {
  await load();
  render();
})();
