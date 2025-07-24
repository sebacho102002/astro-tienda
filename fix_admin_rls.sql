-- Arreglar políticas RLS para admin_users - SCRIPT DE EMERGENCIA
-- Ejecutar en el SQL Editor de Supabase

-- Desactivar temporalmente RLS para poder trabajar
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que pueden estar causando problemas
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON admin_users;

DROP POLICY IF EXISTS "admin_sessions_select_policy" ON admin_sessions;
DROP POLICY IF EXISTS "admin_sessions_insert_policy" ON admin_sessions;
DROP POLICY IF EXISTS "admin_sessions_update_policy" ON admin_sessions;
DROP POLICY IF EXISTS "admin_sessions_delete_policy" ON admin_sessions;

DROP POLICY IF EXISTS "admin_audit_log_select_policy" ON admin_audit_log;
DROP POLICY IF EXISTS "admin_audit_log_insert_policy" ON admin_audit_log;

-- Verificar que no hay RLS activo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'admin_%';

-- Mostrar todas las políticas que puedan estar causando problemas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'admin_%';

COMMIT;
