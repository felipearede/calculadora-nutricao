-- Adicionar campos de peso e preço aos produtos
-- Execute este script no SQL Editor do Supabase Dashboard

ALTER TABLE products
ADD COLUMN weight DECIMAL(10,2),
ADD COLUMN weight_unit TEXT,
ADD COLUMN price DECIMAL(10,2);

COMMENT ON COLUMN products.weight IS 'Peso/volume do produto';
COMMENT ON COLUMN products.weight_unit IS 'Unidade de medida: kg, g, mg, L, ml';
COMMENT ON COLUMN products.price IS 'Preço do produto em reais';
