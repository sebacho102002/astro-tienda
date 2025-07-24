-- Opcional: Cambiar la política de foreign key para permitir eliminación en cascada
-- ⚠️ CUIDADO: Esto eliminará TODOS los pedidos del producto cuando elimines el producto

-- Primero eliminar la constraint existente
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_producto_id_fkey;

-- Recrear con CASCADE (eliminación en cascada)
ALTER TABLE pedidos ADD CONSTRAINT pedidos_producto_id_fkey 
FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE;

-- O con SET NULL (establecer como NULL los pedidos huérfanos)
-- ALTER TABLE pedidos ADD CONSTRAINT pedidos_producto_id_fkey 
-- FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL;
