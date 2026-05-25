import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ylrpddmhtlujncglsptn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscnBkZG1odGx1am5jZ2xzcHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzE4ODMsImV4cCI6MjA5MTI0Nzg4M30.H01FFVbHOcDWhVIfSyOV22rEw6MT2NQKzMVscWGxJWU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  // Testa se a coluna tipo_registro existe tentando filtrar por ela
  const { data, error } = await supabase
    .from('diario_espiritual')
    .select('id, tipo_registro, evento_id')
    .limit(1);
  console.log("COLUMNS TEST:", { data, error });
}

test();
