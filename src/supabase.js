import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zjcyjyytxwusixelcpmr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqY3lqeXl0eHd1c2l4ZWxjcG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTY0MDIsImV4cCI6MjA5Nzc3MjQwMn0.EygTtlOFk_FnVxTwV29L3YcW1ginpsdjPqWsN5CFLoc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
