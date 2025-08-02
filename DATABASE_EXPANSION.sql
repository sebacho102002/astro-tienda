-- 🗄️ MEJORAS SUGERIDAS PARA LA BASE DE DATOS

-- 1. TABLA DE USUARIOS/CLIENTES
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  es_admin BOOLEAN DEFAULT false,
  email_verificado BOOLEAN DEFAULT false,
  telefono_verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DIRECCIONES DE USUARIOS
CREATE TABLE IF NOT EXISTS direcciones_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL, -- "Casa", "Oficina", etc.
  direccion TEXT NOT NULL,
  ciudad VARCHAR(100),
  departamento VARCHAR(100),
  codigo_postal VARCHAR(20),
  pais VARCHAR(50) DEFAULT 'Colombia',
  es_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CATEGORÍAS ESTRUCTURADAS
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  parent_id UUID REFERENCES categorias(id),
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. REVIEWS Y CALIFICACIONES
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id), -- Solo usuarios que compraron
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  titulo VARCHAR(255),
  comentario TEXT,
  verificado BOOLEAN DEFAULT false, -- Review de compra verificada
  util_count INTEGER DEFAULT 0, -- Votos "útil"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(producto_id, usuario_id, pedido_id)
);

-- 5. CUPONES Y DESCUENTOS
CREATE TABLE IF NOT EXISTS cupones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) CHECK (tipo IN ('porcentaje', 'fijo')),
  valor DECIMAL(10, 2) NOT NULL,
  monto_minimo DECIMAL(10, 2) DEFAULT 0,
  usos_maximos INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_expiracion TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. WISHLIST/FAVORITOS
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);

-- 7. CARRITO PERSISTENTE
CREATE TABLE IF NOT EXISTS carrito (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- Para usuarios anónimos
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10, 2), -- Precio al momento de agregar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'pedido', 'promocion', 'sistema'
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  data JSONB, -- Datos adicionales (ID pedido, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. MÉTRICAS Y ANALYTICS
CREATE TABLE IF NOT EXISTS eventos_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255),
  usuario_id UUID REFERENCES usuarios(id),
  evento VARCHAR(100) NOT NULL, -- 'page_view', 'add_to_cart', 'purchase'
  pagina VARCHAR(255),
  producto_id UUID REFERENCES productos(id),
  datos JSONB, -- Datos adicionales del evento
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. CONFIGURACIÓN DEL SITIO
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuraciones básicas
INSERT INTO configuracion (clave, valor, descripcion) VALUES 
('sitio_nombre', 'Tu Tienda Online', 'Nombre del sitio web'),
('sitio_email', 'contacto@tutienda.com', 'Email de contacto'),
('sitio_telefono', '300-123-4567', 'Teléfono de contacto'),
('envio_gratis_minimo', '50000', 'Monto mínimo para envío gratis'),
('moneda', 'COP', 'Moneda del sitio'),
('iva_porcentaje', '19', 'Porcentaje de IVA'),
('whatsapp_numero', '573053947290', 'Número de WhatsApp para pedidos');
