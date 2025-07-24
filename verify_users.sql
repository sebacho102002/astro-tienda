-- Verificar usuarios en la base de datos
SELECT id, email, name, role, created_at, password_hash 
FROM admin_users 
ORDER BY role;

-- También verificar si existen las tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'admin_%';
