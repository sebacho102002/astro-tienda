-- Agregar columna notes a la tabla pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS notes TEXT;
