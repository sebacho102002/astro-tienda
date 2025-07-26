-- 🚀 CONFIGURACIÓN SIMPLE DE PEDIDOS CON SEGUIMIENTO
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar campos necesarios a la tabla pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_seguimiento VARCHAR(20) UNIQUE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pendiente';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS notas_admin TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS transportadora VARCHAR(100);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_guia VARCHAR(100);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMP;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fecha_entrega TIMESTAMP;

-- 2. Crear función para generar número de seguimiento único
CREATE OR REPLACE FUNCTION generar_numero_seguimiento()
RETURNS TEXT AS $$
DECLARE
    numero TEXT;
    existe BOOLEAN := TRUE;
BEGIN
    WHILE existe LOOP
        -- Formato: TS + AAMMDD + 4 dígitos aleatorios
        numero := 'TS' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM pedidos WHERE numero_seguimiento = numero) INTO existe;
    END LOOP;
    
    RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger para asignar número de seguimiento automáticamente
CREATE OR REPLACE FUNCTION asignar_numero_seguimiento()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_seguimiento IS NULL THEN
        NEW.numero_seguimiento := generar_numero_seguimiento();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Aplicar trigger
DROP TRIGGER IF EXISTS trigger_numero_seguimiento ON pedidos;
CREATE TRIGGER trigger_numero_seguimiento
    BEFORE INSERT ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION asignar_numero_seguimiento();

-- 5. Asignar números de seguimiento a pedidos existentes
UPDATE pedidos 
SET numero_seguimiento = generar_numero_seguimiento()
WHERE numero_seguimiento IS NULL;

-- 6. Crear constraint para estados válidos
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS check_status_valid;
ALTER TABLE pedidos ADD CONSTRAINT check_status_valid 
CHECK (status IN ('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'));

-- 7. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_seguimiento ON pedidos(numero_seguimiento);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_envio ON pedidos(fecha_envio);

-- ✅ CONFIGURACIÓN COMPLETADA
SELECT 'Sistema de pedidos configurado correctamente' as resultado;
