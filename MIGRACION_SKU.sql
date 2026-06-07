-- =====================================================
-- SIGIAF — Migración: SKU + campos de ubicación institucional
-- Ejecutar UNA SOLA VEZ en PostgreSQL
-- =====================================================

-- 1. Columna SKU (número de inventario único)
ALTER TABLE activos ADD COLUMN IF NOT EXISTS sku VARCHAR(60) UNIQUE;

-- 2. Campos de ubicación institucional
ALTER TABLE activos ADD COLUMN IF NOT EXISTS tecnologico  VARCHAR(120);
ALTER TABLE activos ADD COLUMN IF NOT EXISTS departamento VARCHAR(120);
ALTER TABLE activos ADD COLUMN IF NOT EXISTS oficina      VARCHAR(120);

-- 3. Generar SKUs automáticos para activos existentes sin SKU
UPDATE activos
SET sku = CONCAT(
  UPPER(SUBSTRING(
    (SELECT nombre FROM categorias WHERE id_categoria = activos.id_categoria LIMIT 1),
    1, 3
  )),
  '-ITT-',
  TO_CHAR(CURRENT_DATE, 'YY'),
  '-',
  LPAD(id_activo::TEXT, 4, '0')
)
WHERE sku IS NULL OR sku = '';

COMMENT ON COLUMN activos.sku          IS 'Número de inventario / SKU único del activo';
COMMENT ON COLUMN activos.tecnologico  IS 'Plantel o tecnológico donde se ubica el activo';
COMMENT ON COLUMN activos.departamento IS 'Departamento o área académica/administrativa';
COMMENT ON COLUMN activos.oficina      IS 'Oficina, aula o sala específica';
