// Prueba rápida para verificar productos en Supabase
import { supabase } from './src/lib/supabaseClient.js';

console.log('🔍 Verificando productos en la base de datos...');

const { data: productos, error } = await supabase
  .from('productos')
  .select('id, title, price')
  .limit(5);

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log('✅ Productos encontrados:', productos?.length || 0);
  console.log(productos);
}

// También verificar si la tabla existe
const { data: tables, error: tablesError } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public');

if (!tablesError) {
  const tableNames = tables?.map(t => t.table_name) || [];
  console.log('📋 Tablas disponibles:', tableNames);
} else {
  console.log('⚠️ No se pudieron obtener las tablas');
}
