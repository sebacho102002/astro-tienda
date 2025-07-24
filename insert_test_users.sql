-- Insertar usuarios de prueba con contraseñas hasheadas
-- Ejecutar en el SQL Editor de Supabase

-- Limpiar usuarios existentes (opcional)
DELETE FROM admin_sessions;
DELETE FROM admin_audit_log;
DELETE FROM admin_users;

-- Insertar usuarios de prueba
INSERT INTO admin_users (email, name, password_hash, role) VALUES 
  ('admin@tutienda.com', 'Super Administrador', '$2b$12$dDPk648EwJUOQMZvWtK3X.8qTQQgJ73TMfXNqN3vpcEAuL5gmAtnO', 'super_admin'),
  ('manager@tutienda.com', 'Manager General', '$2b$12$Rtuq9iKT.5ShfTb9fTGmFO5d2zY0oBHBNzbPpwfPnxZCyC.ZqP/7W', 'manager'),
  ('editor@tutienda.com', 'Editor de Contenido', '$2b$12$aqQbSISF1m5LoE9ecXg0D.m9glMbuTE1RYRv5HUmOEpu7xeSahHiS', 'editor'),
  ('viewer@tutienda.com', 'Viewer General', '$2b$12$qWQuF5P7ZxRHceW26rtraObcOG4Yv5z0nkcb8v.3xSIqun5aEeGSu', 'viewer');

-- Verificar inserción
SELECT id, email, name, role, created_at FROM admin_users ORDER BY role;

COMMIT;
