-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- Ve a: https://supabase.com/dashboard → Tu proyecto → SQL Editor

-- Script para arreglar la tabla pedidos con las columnas faltantes
-- Primero vamos a verificar si la tabla existe y agregarle las columnas que faltan

-- Agregar la columna 'status' si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'status'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN status VARCHAR(50) DEFAULT 'pendiente';
        RAISE NOTICE 'Columna status agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna status ya existe';
    END IF;
END $$;

-- Agregar la columna 'items' si no existe (para carrito con múltiples productos)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'items'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN items JSONB;
        RAISE NOTICE 'Columna items agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna items ya existe';
    END IF;
END $$;

-- Agregar otras columnas útiles si no existen
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'external_reference'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN external_reference VARCHAR(255);
        RAISE NOTICE 'Columna external_reference agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna external_reference ya existe';
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN payment_id VARCHAR(255);
        RAISE NOTICE 'Columna payment_id agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna payment_id ya existe';
    END IF;
END $$;

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN payment_status VARCHAR(50);
        RAISE NOTICE 'Columna payment_status agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna payment_status ya existe';
    END IF;
END $$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_external_reference ON pedidos(external_reference);
CREATE INDEX IF NOT EXISTS idx_pedidos_payment_id ON pedidos(payment_id);

-- Mostrar mensaje de éxito
DO $$ 
BEGIN 
    RAISE NOTICE 'Índices creados exitosamente';
END $$;

-- Mostrar estructura final
DO $$ 
BEGIN 
    RAISE NOTICE 'ESTRUCTURA FINAL DE LA TABLA PEDIDOS:';
END $$;

SELECT 
    column_name as "Columna",
    data_type as "Tipo", 
    is_nullable as "Nulo",
    column_default as "Defecto"
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
ORDER BY ordinal_position;
