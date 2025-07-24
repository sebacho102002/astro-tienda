-- Script de emergencia para crear un usuario simple
-- Ejecutar en el SQL Editor de Supabase

-- Limpiar y crear un usuario básico con hash conocido
DELETE FROM admin_sessions;
DELETE FROM admin_audit_log;
DELETE FROM admin_users WHERE email = 'test@admin.com';

-- Insertar un usuario con hash simple (contraseña: "password")
INSERT INTO admin_users (email, name, password_hash, role, status) VALUES 
  ('test@admin.com', 'Usuario Test', '$2b$12$LQv3c1yqBwKUbkKmFJtjZ.X7K.cGJTqQNQMK6Nxm7K2eR8m.PfzPO', 'super_admin', 'active');

-- Verificar
SELECT id, email, name, role, status, password_hash FROM admin_users WHERE email = 'test@admin.com';
