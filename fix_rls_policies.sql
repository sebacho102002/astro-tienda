-- Script para corregir políticas RLS de la tabla pedidos
-- Ejecutar en el SQL Editor de Supabase

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow public read access" ON pedidos;
DROP POLICY IF EXISTS "Allow public insert access" ON pedidos;
DROP POLICY IF EXISTS "Allow public update access" ON pedidos;

-- Crear políticas más permisivas para la tabla pedidos
CREATE POLICY "Allow public read access" ON pedidos
FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON pedidos
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON pedidos
FOR UPDATE USING (true);

-- Verificar que RLS está habilitado
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
