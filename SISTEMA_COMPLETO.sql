-- 📁 SISTEMA COMPLETO DE PEDIDOS Y ENTREGAS
-- Ejecuta estos scripts en Supabase en el orden indicado

-- ===============================================
-- 🏗️ PASO 1: CONFIGURACIÓN INICIAL DEL SISTEMA
-- ===============================================

-- Eliminar datos anteriores si existen (opcional)
-- TRUNCATE TABLE pedidos_historial CASCADE;
-- TRUNCATE TABLE pedidos CASCADE;
-- TRUNCATE TABLE productos CASCADE;

-- Crear tabla de productos si no existe
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  stock INTEGER DEFAULT 0,
  category VARCHAR(100),
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  mercadopago JSONB DEFAULT '{"enabled": false, "unit_price": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido VARCHAR(50) UNIQUE,
  numero_seguimiento VARCHAR(100) UNIQUE,
  
  -- Información del cliente
  cliente_nombre VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255),
  cliente_telefono VARCHAR(50),
  cliente_documento VARCHAR(50),
  cliente_id UUID,
  
  -- Información del producto
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10, 2),
  precio_total DECIMAL(10, 2) NOT NULL,
  
  -- Estado y tipo
  status VARCHAR(50) DEFAULT 'pendiente' CHECK (status IN (
    'pendiente', 'pagado', 'confirmado', 'preparando', 
    'enviado', 'en_transito', 'entregado', 'cancelado'
  )),
  tipo_pedido VARCHAR(50) DEFAULT 'online' CHECK (tipo_pedido IN ('online', 'whatsapp', 'manual')),
  metodo_pago VARCHAR(50) CHECK (metodo_pago IN ('online', 'transferencia', 'efectivo', 'tarjeta')),
  
  -- Información de pago
  payment_id VARCHAR(255),
  payment_status VARCHAR(50),
  payment_amount DECIMAL(10, 2),
  
  -- Información de entrega
  direccion_envio TEXT,
  direccion_entrega TEXT,
  transportadora VARCHAR(100),
  numero_guia VARCHAR(255),
  fecha_estimada_entrega DATE,
  fecha_entrega_real TIMESTAMP WITH TIME ZONE,
  notas_entrega TEXT,
  
  -- Observaciones
  observaciones TEXT,
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario_cliente TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de historial de pedidos
CREATE TABLE IF NOT EXISTS pedidos_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  observaciones TEXT,
  usuario_actualizo VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_email ON pedidos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_is_active ON productos(is_active);

-- ===============================================
-- 🛍️ PASO 2: PRODUCTOS DE EJEMPLO
-- ===============================================

INSERT INTO productos (title, description, price, sku, stock, category, images, mercadopago) VALUES
('Producto Ejemplo 1', 'Descripción del producto ejemplo 1', 89000.00, 'PROD-001', 50, 'categoria1', 
 ARRAY['https://via.placeholder.com/400x300?text=Producto+1'], 
 '{"enabled": true, "unit_price": 89000}'),
 
('Producto Ejemplo 2', 'Descripción del producto ejemplo 2', 125000.00, 'PROD-002', 30, 'categoria2', 
 ARRAY['https://via.placeholder.com/400x300?text=Producto+2'], 
 '{"enabled": true, "unit_price": 125000}'),
 
('Producto Ejemplo 3', 'Descripción del producto ejemplo 3', 67000.00, 'PROD-003', 25, 'categoria1', 
 ARRAY['https://via.placeholder.com/400x300?text=Producto+3'], 
 '{"enabled": true, "unit_price": 67000}')
ON CONFLICT(sku) DO NOTHING;

-- ===============================================
-- 🚛 PASO 3: PEDIDOS DE PRUEBA PARA ENTREGAS
-- ===============================================

INSERT INTO pedidos (
  numero_pedido, numero_seguimiento, cliente_nombre, cliente_email, cliente_telefono,
  producto_id, cantidad, precio_total, status, tipo_pedido, metodo_pago,
  direccion_envio, direccion_entrega, transportadora, numero_guia, 
  fecha_estimada_entrega, notas_entrega, created_at
) VALUES

-- Pedido listo para envío (preparando)
('WPP-2025-001', 'ENT-' || EXTRACT(EPOCH FROM NOW())::TEXT, 'María González', 'maria.gonzalez@email.com', '+57 300 123 4567',
 (SELECT id FROM productos WHERE sku = 'PROD-001'), 2, 178000, 'preparando', 'whatsapp', 'efectivo',
 'Calle 123 #45-67, Bogotá, Colombia', 'Calle 123 #45-67, Bogotá, Colombia', NULL, NULL, NULL,
 'Pedido por WhatsApp - Listo para envío', NOW() - INTERVAL '2 days'),

-- Pedido confirmado (listo para preparar)
('WPP-2025-002', 'ENT-' || (EXTRACT(EPOCH FROM NOW()) + 1)::TEXT, 'Carlos Rodríguez', 'carlos.rodriguez@email.com', '+57 301 234 5678',
 (SELECT id FROM productos WHERE sku = 'PROD-002'), 1, 125000, 'confirmado', 'whatsapp', 'transferencia',
 'Carrera 50 #23-45, Medellín, Colombia', 'Carrera 50 #23-45, Medellín, Colombia', NULL, NULL, NULL,
 'Cliente confirmó pedido - Preparar para envío', NOW() - INTERVAL '1 day'),

-- Pedido ya enviado (con datos de transportadora)
('MP-2025-003', 'ENT-' || (EXTRACT(EPOCH FROM NOW()) + 2)::TEXT, 'Laura Herrera', 'laura.herrera@email.com', '+57 302 345 6789',
 (SELECT id FROM productos WHERE sku = 'PROD-001'), 3, 267000, 'enviado', 'mercadopago', 'online',
 'Calle 85 #15-30, Cali, Colombia', 'Calle 85 #15-30, Cali, Colombia', 'Servientrega', 'SER-2025-123456789',
 NOW() + INTERVAL '3 days', 'Fragil - Manejar con cuidado', NOW() - INTERVAL '3 days'),

-- Pedido urgente (más de 5 días sin cambio)
('WPP-2025-004', 'ENT-' || (EXTRACT(EPOCH FROM NOW()) + 3)::TEXT, 'Roberto Silva', 'roberto.silva@email.com', '+57 303 456 7890',
 (SELECT id FROM productos WHERE sku = 'PROD-002'), 1, 125000, 'pagado', 'whatsapp', 'efectivo',
 'Avenida 19 #104-20, Barranquilla, Colombia', 'Avenida 19 #104-20, Barranquilla, Colombia', NULL, NULL, NULL,
 'Pedido URGENTE - Más de 5 días sin procesar', NOW() - INTERVAL '6 days'),

-- Pedido en tránsito
('MP-2025-005', 'ENT-' || (EXTRACT(EPOCH FROM NOW()) + 4)::TEXT, 'Ana Martínez', 'ana.martinez@email.com', '+57 304 567 8901',
 (SELECT id FROM productos WHERE sku = 'PROD-003'), 2, 134000, 'en_transito', 'mercadopago', 'online',
 'Calle 72 #11-45, Bucaramanga, Colombia', 'Calle 72 #11-45, Bucaramanga, Colombia', 'Coordinadora', 'COOR-2025-987654321',
 NOW() + INTERVAL '1 day', 'En camino - Seguimiento activo', NOW() - INTERVAL '4 days'),

-- Pedido entregado (para estadísticas)
('WPP-2025-006', 'ENT-' || (EXTRACT(EPOCH FROM NOW()) + 5)::TEXT, 'Diego Pérez', 'diego.perez@email.com', '+57 305 678 9012',
 (SELECT id FROM productos WHERE sku = 'PROD-001'), 1, 89000, 'entregado', 'whatsapp', 'efectivo',
 'Carrera 15 #93-47, Pereira, Colombia', 'Carrera 15 #93-47, Pereira, Colombia', 'TCC', 'TCC-2025-456789123',
 NOW() - INTERVAL '1 day', 'Entregado exitosamente', NOW() - INTERVAL '7 days')

ON CONFLICT(numero_pedido) DO NOTHING;

-- Actualizar fecha_entrega_real para pedidos entregados
UPDATE pedidos 
SET fecha_entrega_real = NOW() - INTERVAL '1 day'
WHERE status = 'entregado' AND fecha_entrega_real IS NULL;

-- ===============================================
-- 📊 PASO 4: CONSULTAS DE VERIFICACIÓN
-- ===============================================

-- Ver todos los productos
SELECT id, title, sku, price, stock FROM productos ORDER BY title;

-- Ver estadísticas de pedidos por estado
SELECT 
  status,
  COUNT(*) as cantidad,
  SUM(precio_total) as total_valor
FROM pedidos 
GROUP BY status
ORDER BY 
  CASE status 
    WHEN 'preparando' THEN 1
    WHEN 'confirmado' THEN 2  
    WHEN 'pagado' THEN 3
    WHEN 'enviado' THEN 4
    WHEN 'en_transito' THEN 5
    WHEN 'entregado' THEN 6
    WHEN 'cancelado' THEN 7
  END;

-- Ver pedidos de entregas (los que aparecen en el panel)
SELECT 
  numero_pedido,
  cliente_nombre,
  status,
  transportadora,
  numero_guia,
  DATE_PART('day', NOW() - created_at) as dias_desde_creacion,
  precio_total
FROM pedidos 
WHERE status IN ('pagado', 'confirmado', 'preparando', 'enviado', 'en_transito', 'entregado')
ORDER BY created_at DESC;

-- Ver pedidos urgentes (más de 5 días)
SELECT 
  numero_pedido,
  cliente_nombre,
  status,
  DATE_PART('day', NOW() - created_at) as dias_desde_creacion
FROM pedidos 
WHERE status IN ('pagado', 'confirmado', 'preparando', 'enviado', 'en_transito')
  AND DATE_PART('day', NOW() - created_at) > 5
ORDER BY created_at ASC;

-- Promedio de días de entrega
SELECT 
  AVG(DATE_PART('day', fecha_entrega_real - created_at)) as promedio_dias_entrega,
  COUNT(*) as pedidos_entregados
FROM pedidos 
WHERE status = 'entregado' AND fecha_entrega_real IS NOT NULL;

-- ===============================================
-- ✅ INSTALACIÓN COMPLETADA
-- ===============================================
-- 
-- Tu sistema está listo con:
-- - ✅ Tablas de productos y pedidos
-- - ✅ Productos de ejemplo
-- - ✅ Pedidos de prueba para entregas
-- - ✅ Estadísticas y consultas de verificación
-- 
-- Próximos pasos:
-- 1. Accede a /admin/pedidos para gestionar pedidos
-- 2. Accede a /admin/entregas para gestionar entregas
-- 3. Accede a /admin/productos para gestionar productos
-- 
-- ===============================================
