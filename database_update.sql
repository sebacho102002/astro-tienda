-- Script para agregar las nuevas columnas a la tabla productos
-- Ejecutar en el SQL Editor de Supabase

-- Agregar columna SKU
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Agregar columna weight (peso en kg)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3);

-- Agregar columna dimensions (dimensiones como texto)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS dimensions TEXT;

-- Agregar columna images (array de URLs de imágenes)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Agregar columna payment_config (configuración de pagos como JSON)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{
  "enabled": false,
  "stripe": {"enabled": false, "price_id": ""},
  "paypal": {"enabled": false, "item_id": ""},
  "mercadopago": {"enabled": false, "preference_id": ""}
}'::jsonb;

-- Agregar columnas de timestamps si no existen
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Actualizar updated_at automáticamente cuando se modifica una fila
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_payment_enabled ON productos USING GIN ((payment_config->'enabled'));

-- Mostrar la estructura actualizada de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;
