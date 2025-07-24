-- Migración para Supabase: Sistema de usuarios real
-- Ejecutar en el SQL Editor de Supabase

-- 1. Tabla de usuarios administradores
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hash
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'editor', 'viewer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de sesiones (más seguro que cookies)
CREATE TABLE admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  refresh_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de auditoría (tracking de acciones)
CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL, -- 'login', 'logout', 'create_product', 'delete_product', etc.
  resource TEXT, -- 'product:123', 'order:456', etc.
  details JSONB, -- datos adicionales de la acción
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Configuración de la tienda
CREATE TABLE store_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL, -- 'store_name', 'logo_url', 'theme_color', etc.
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'general', 'appearance', 'payments', etc.
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices para performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX idx_audit_log_user_action ON admin_audit_log(user_id, action);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at);

-- 6. RLS (Row Level Security) para admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Solo super_admin puede ver todos los usuarios
CREATE POLICY "Super admin can view all users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_sessions s
      JOIN admin_users u ON s.user_id = u.id
      WHERE s.token = current_setting('request.jwt.claims', true)::json->>'token'
      AND u.role = 'super_admin'
    )
  );

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON admin_users
  FOR SELECT USING (
    id = (
      SELECT s.user_id FROM admin_sessions s
      WHERE s.token = current_setting('request.jwt.claims', true)::json->>'token'
    )
  );

-- 7. Función para limpiar sesiones expiradas (ejecutar diariamente)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Insertar usuario super admin inicial (cambiar password!)
INSERT INTO admin_users (email, name, password_hash, role) VALUES (
  'admin@tutienda.com',
  'Super Administrador',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXzgVB/hl5NK', -- hash de 'admin123'
  'super_admin'
);

-- 9. Configuración inicial de la tienda
INSERT INTO store_config (key, value, category) VALUES 
  ('store_name', 'Mi E-commerce', 'general'),
  ('store_description', 'Tienda online especializada', 'general'),
  ('theme_color', '#7c3aed', 'appearance'),
  ('currency', 'ARS', 'general'),
  ('max_products_per_page', '20', 'general');

COMMIT;
