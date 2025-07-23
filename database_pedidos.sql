-- 📦 Creación de tabla para gestionar pedidos y pagos
-- Ejecuta este script en tu panel de Supabase (SQL Editor)

-- 1. Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id),
  
  -- Información del cliente
  cliente_nombre VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255) NOT NULL,
  cliente_telefono VARCHAR(50),
  
  -- Información del pedido
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  precio_total DECIMAL(10,2) NOT NULL,
  
  -- Estado del pedido
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  
  -- Información de pago
  metodo_pago VARCHAR(50), -- 'mercadopago', 'stripe', 'paypal', etc.
  payment_id VARCHAR(255), -- ID del pago en la plataforma
  payment_status VARCHAR(50), -- Estado específico de la plataforma de pago
  
  -- Información de envío
  direccion_envio TEXT,
  codigo_postal VARCHAR(20),
  ciudad VARCHAR(100),
  pais VARCHAR(100) DEFAULT 'Colombia',
  
  -- Tracking y referencias
  external_reference VARCHAR(255), -- Referencia externa para webhooks
  numero_pedido VARCHAR(50) UNIQUE, -- Número único del pedido
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear función para generar número de pedido automático
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Generar número de pedido único (ej: PED-20240101-0001)
  NEW.numero_pedido := 'PED-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                       LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear secuencia para números de pedido
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- 4. Crear trigger para generar número de pedido automáticamente
DROP TRIGGER IF EXISTS trigger_generate_order_number ON pedidos;
CREATE TRIGGER trigger_generate_order_number
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- 5. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_pedidos_updated_at ON pedidos;
CREATE TRIGGER trigger_update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_email ON pedidos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_payment_id ON pedidos(payment_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON pedidos(numero_pedido);

-- 8. Habilitar RLS (Row Level Security)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- 9. Crear políticas RLS básicas
-- Política para permitir lectura de pedidos propios (por email)
CREATE POLICY "Los usuarios pueden ver sus propios pedidos"
  ON pedidos FOR SELECT
  USING (cliente_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Política para permitir creación de pedidos
CREATE POLICY "Los usuarios pueden crear pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (true);

-- Política para que los administradores puedan ver todos los pedidos
CREATE POLICY "Los administradores pueden ver todos los pedidos"
  ON pedidos FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- 10. Insertar algunos datos de ejemplo (opcional)
INSERT INTO pedidos (
  producto_id, 
  cliente_nombre, 
  cliente_email, 
  cantidad, 
  precio_unitario, 
  precio_total,
  estado,
  metodo_pago,
  direccion_envio,
  codigo_postal,
  ciudad
) VALUES
(
  (SELECT id FROM productos LIMIT 1), -- Toma el primer producto disponible
  'Cliente de Prueba',
  'cliente@example.com',
  2,
  50000.00,
  100000.00,
  'pendiente',
  'mercadopago',
  'Calle 123 #45-67',
  '110111',
  'Bogotá'
) ON CONFLICT DO NOTHING;

-- ✅ Verificación de la instalación
SELECT 
  'pedidos' as tabla,
  COUNT(*) as registros,
  'Tabla creada correctamente' as status
FROM pedidos;
