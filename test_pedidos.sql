-- 🎯 SCRIPT SIMPLE PARA CREAR PEDIDOS DE PRUEBA
-- Ejecutar después de setup_pedidos_simple.sql

-- Insertar pedidos de prueba
INSERT INTO pedidos (
  producto_id,
  cliente_nombre,
  cliente_email,
  cliente_telefono,
  cantidad,
  precio_unitario,
  precio_total,
  estado,
  metodo_pago,
  direccion_envio,
  created_at
)
SELECT 
  p.id,
  'Juan Pérez',
  'juan@test.com',
  '300-123-4567',
  1,
  p.price,
  p.price,
  'pendiente',
  'whatsapp',
  'Calle 45 #12-34, Bogotá',
  NOW() - INTERVAL '1 hour'
FROM productos p
LIMIT 1;

INSERT INTO pedidos (
  producto_id,
  cliente_nombre,
  cliente_email,
  cliente_telefono,
  cantidad,
  precio_unitario,
  precio_total,
  estado,
  metodo_pago,
  direccion_envio,
  created_at
)
SELECT 
  p.id,
  'María González',
  'maria@test.com',
  '300-987-6543',
  2,
  p.price,
  p.price * 2,
  'confirmado',
  'mercadopago',
  'Carrera 15 #80-25, Bogotá',
  NOW() - INTERVAL '2 hours'
FROM productos p
LIMIT 1;

-- Verificar pedidos creados
SELECT 
  '✅ PEDIDOS CREADOS' as resultado,
  numero_seguimiento,
  cliente_nombre,
  status,
  metodo_pago,
  precio_total
FROM pedidos 
WHERE cliente_email LIKE '%@test.com'
ORDER BY created_at DESC;
