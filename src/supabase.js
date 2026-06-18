import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rxoxecmfrmwdjlfitwrn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4b3hlY21mcm13ZGpsZml0d3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTA0ODAsImV4cCI6MjA5NzM2NjQ4MH0.CJ_-oVcE6dwN-jR9nJKEW_ygfnUjmM0F24pFh93pDvI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
