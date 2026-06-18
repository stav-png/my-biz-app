import { supabase } from './supabase.js';

const KEY = 'biz:data:v3';

export let S = {
  settings:  { vat: 18, biz: 'העסק שלי' },
  clients:   [],
  jobs:      [],
  suppliers: [],
  prices:    [],
  purchases: [],
  workers:   [],
  work:      [],
};

export function replaceS(newS) {
  Object.assign(S, newS);
}

export async function save() {
  try {
    await supabase.from('app_data').upsert({ key: KEY, value: S });
  } catch (e) {
    console.error('שגיאת שמירה:', e);
  }
}

export async function load() {
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
    const query = supabase.from('app_data').select('value').eq('key', KEY).maybeSingle();
    const { data } = await Promise.race([query, timeout]);
    if (data?.value) Object.assign(S, data.value);
  } catch (e) {}
}
