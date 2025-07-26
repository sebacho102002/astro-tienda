-- 🚛 CREAR PEDIDOS DE PRUEBA PARA GESTIÓN DE ENTREGAS
-- Ejecuta este script en Supabase después de tener productos creados

-- Primero, verifica que tengamos productos
SELECT id, title, sku, price FROM productos LIMIT 5;

-- ✅ PASO 1: Crear pedidos en diferentes estados para probar entregas
-- Reemplaza los product_ids con IDs reales de tu tabla productos

INSERT INTO pedidos (
  numero_pedido,
  numero_seguimiento, 
  cliente_nombre,
  cliente_email,
  cliente_telefono,
  producto_id,
  cantidad,
  precio_total,
  status,
  tipo_pedido,
  metodo_pago,
  direccion_envio,
  direccion_entrega,
  transportadora,
  numero_guia,
  fecha_estimada_entrega,
  notas_entrega,
  created_at
) VALUES

-- Pedido listo para envío (preparando)
(
  'WPP-2025-001',
  'ENT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'María González',
  'maria.gonzalez@email.com',
  '+57 300 123 4567',
  (SELECT id FROM productos LIMIT 1 OFFSET 0), -- Primer producto
  2,
  150000,
  'preparando',
  'whatsapp',
  'efectivo',
  'Calle 123 #45-67, Bogotá, Colombia',
  'Calle 123 #45-67, Bogotá, Colombia',
  NULL,
  NULL,
  NULL,
  'Pedido por WhatsApp - Listo para envío',
  NOW() - INTERVAL '2 days'
),

-- Pedido confirmado (listo para preparar)
(
  'WPP-2025-002',
  'ENT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'Carlos Rodríguez',
  'carlos.rodriguez@email.com',
  '+57 301 234 5678',
  (SELECT id FROM productos LIMIT 1 OFFSET 1), -- Segundo producto
  1,
  89000,
  'confirmado',
  'whatsapp',
  'transferencia',
  'Carrera 50 #23-45, Medellín, Colombia',
  'Carrera 50 #23-45, Medellín, Colombia',
  NULL,
  NULL,
  NULL,
  'Cliente confirmó pedido - Preparar para envío',
  NOW() - INTERVAL '1 day'
),

-- Pedido ya enviado (con datos de transportadora)
(
  'MP-2025-003',
  'ENT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'Laura Herrera',
  'laura.herrera@email.com',
  '+57 302 345 6789',
  (SELECT id FROM productos LIMIT 1 OFFSET 0), -- Primer producto
  3,
  267000,
  'enviado',
  'mercadopago',
  'online',
  'Calle 85 #15-30, Cali, Colombia',
  'Calle 85 #15-30, Cali, Colombia',
  'Servientrega',
  'SER-2025-123456789',
  NOW() + INTERVAL '3 days',
  'Fragil - Manejar con cuidado',
  NOW() - INTERVAL '3 days'
),

-- Pedido urgente (más de 5 días sin cambio)
(
  'WPP-2025-004',
  'ENT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'Roberto Silva',
  'roberto.silva@email.com',
  '+57 303 456 7890',
  (SELECT id FROM productos LIMIT 1 OFFSET 1), -- Segundo producto
  1,
  89000,
  'pagado',
  'whatsapp',
  'efectivo',
  'Avenida 19 #104-20, Barranquilla, Colombia',
  'Avenida 19 #104-20, Barranquilla, Colombia',
  NULL,
  NULL,
  NULL,
  'Pedido URGENTE - Más de 5 días sin procesar',
  NOW() - INTERVAL '6 days'
),

-- Pedido en tránsito
(
  'MP-2025-005',
  'ENT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'Ana Martínez',
  'ana.martinez@email.com',
  '+57 304 567 8901',
  (SELECT id FROM productos LIMIT 1 OFFSET 2), -- Tercer producto  
  2,
  178000,
  'en_transito',
  'mercadopago',
  'online',
  'Calle 72 #11-45, Bucaramanga, Colombia',
  'Calle 72 #11-45, Bucaramanga, Colombia',
  'Coordinadora',
  'COOR-2025-987654321',
  NOW() + INTERVAL '1 day',
  'En camino - Seguimiento activo',
  NOW() - INTERVAL '4 days'
),

-- Pedido entregado (para estadísticas)
(
  'WPP-2025-006',
  'ENT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'Diego Pérez',
  'diego.perez@email.com',
  '+57 305 678 9012',
  (SELECT id FROM productos LIMIT 1 OFFSET 0), -- Primer producto
  1,
  89000,
  'entregado',
  'whatsapp',
  'efectivo',
  'Carrera 15 #93-47, Pereira, Colombia',
  'Carrera 15 #93-47, Pereira, Colombia',
  'TCC',
  'TCC-2025-456789123',
  NOW() - INTERVAL '1 day',
  'Entregado exitosamente',
  NOW() - INTERVAL '7 days'
);

-- ✅ PASO 2: Actualizar fecha_entrega_real para pedidos entregados
UPDATE pedidos 
SET fecha_entrega_real = NOW() - INTERVAL '1 day'
WHERE status = 'entregado' 
  AND fecha_entrega_real IS NULL;

-- ✅ PASO 3: Verificar los pedidos creados
SELECT 
  numero_pedido,
  cliente_nombre,
  status,
  transportadora,
  numero_guia,
  DATE_PART('day', NOW() - created_at) as dias_desde_creacion,
  precio_total
FROM pedidos 
WHERE numero_pedido LIKE 'WPP-2025-%' OR numero_pedido LIKE 'MP-2025-%'
ORDER BY created_at DESC;

-- ✅ PASO 4: Ver estadísticas de entregas
SELECT 
  status,
  COUNT(*) as cantidad,
  SUM(precio_total) as total_valor
FROM pedidos 
WHERE status IN ('pagado', 'confirmado', 'preparando', 'enviado', 'en_transito', 'entregado')
GROUP BY status
ORDER BY 
  CASE status 
    WHEN 'preparando' THEN 1
    WHEN 'confirmado' THEN 2  
    WHEN 'pagado' THEN 3
    WHEN 'enviado' THEN 4
    WHEN 'en_transito' THEN 5
    WHEN 'entregado' THEN 6
  END;
