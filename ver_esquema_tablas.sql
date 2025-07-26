-- 🔍 CONSULTAS ESPECÍFICAS PARA LA TABLA PEDIDOS
-- Ejecutar en Supabase SQL Editor

-- 1. Ver estructura COMPLETA de la tabla pedidos
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'pedidos'
ORDER BY ordinal_position;

-- 2. Ver pedidos existentes (solo los primeros 3)
SELECT * FROM pedidos LIMIT 3;

-- 3. Ver si existe el campo numero_seguimiento
SELECT COUNT(*) as tiene_numero_seguimiento
FROM information_schema.columns 
WHERE table_name = 'pedidos' AND column_name = 'numero_seguimiento';

-- 4. Ver si existe el campo status  
SELECT COUNT(*) as tiene_status
FROM information_schema.columns 
WHERE table_name = 'pedidos' AND column_name = 'status';
