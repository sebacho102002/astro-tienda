-- 🚛 CONSULTA PARA VERIFICAR PEDIDOS DE ENTREGAS
-- Ejecuta esta consulta en Supabase para ver qué pedidos aparecen en la página de entregas

-- 1. Ver todos los pedidos relevantes para entregas
SELECT 
  id,
  numero_pedido,
  numero_seguimiento,
  status as estado_actual,
  cliente_nombre,
  cliente_email,
  cliente_telefono,
  producto_id,
  cantidad,
  precio_total,
  transportadora,
  numero_guia,
  fecha_estimada_entrega,
  direccion_entrega,
  notas_entrega,
  created_at as fecha_pedido,
  fecha_entrega_real
FROM pedidos 
WHERE status IN ('pagado', 'confirmado', 'preparando', 'enviado', 'en_transito', 'entregado')
ORDER BY 
  CASE status 
    WHEN 'preparando' THEN 1
    WHEN 'confirmado' THEN 2  
    WHEN 'pagado' THEN 3
    WHEN 'enviado' THEN 4
    WHEN 'en_transito' THEN 5
    WHEN 'entregado' THEN 6
  END,
  created_at DESC;

-- 2. Estadísticas por estado
SELECT 
  status,
  COUNT(*) as cantidad_pedidos,
  SUM(precio_total) as valor_total
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

-- 3. Pedidos urgentes (más de 5 días sin cambio)
SELECT 
  id,
  numero_pedido,
  cliente_nombre,
  status,
  DATE_PART('day', NOW() - created_at) as dias_desde_creacion,
  created_at
FROM pedidos 
WHERE status IN ('pagado', 'confirmado', 'preparando', 'enviado', 'en_transito')
  AND DATE_PART('day', NOW() - created_at) > 5
ORDER BY created_at ASC;

-- 4. Promedio de días de entrega
SELECT 
  AVG(DATE_PART('day', fecha_entrega_real - created_at)) as promedio_dias_entrega,
  COUNT(*) as pedidos_entregados
FROM pedidos 
WHERE status = 'entregado' 
  AND fecha_entrega_real IS NOT NULL;
