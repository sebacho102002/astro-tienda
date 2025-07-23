import { createClient } from '@supabase/supabase-js';

// Verificar variables de entorno
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Debug en desarrollo
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Config Check:');
  console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Falta PUBLIC_SUPABASE_URL');
  console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Falta PUBLIC_SUPABASE_ANON_KEY');
}

// Validar que existan las variables
if (!supabaseUrl || !supabaseKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('PUBLIC_SUPABASE_URL');
  if (!supabaseKey) missing.push('PUBLIC_SUPABASE_ANON_KEY');
  
  throw new Error(`❌ Faltan variables de entorno: ${missing.join(', ')}`);
}

// Crear cliente
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});