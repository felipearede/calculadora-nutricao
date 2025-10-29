-- Atualizar precisão da coluna grams_per_liter para suportar até 7 casas decimais
-- Mudando de DECIMAL(10,3) para DECIMAL(12,10)
--
-- Antes: DECIMAL(10,3) - apenas 3 casas decimais (ex: 1.234)
-- Depois: DECIMAL(12,10) - até 10 casas decimais (ex: 0.0000250000)
--
-- Isso permite salvar valores muito pequenos como:
-- - 0.000025 (micronutrientes)
-- - 0.0000001 (traços)
--
-- Faixa de valores suportados: 0.0000000001 até 99.9999999999 g/L

ALTER TABLE recipe_products
ALTER COLUMN grams_per_liter TYPE DECIMAL(12,10);

-- Verificar a alteração (opcional)
-- SELECT column_name, data_type, numeric_precision, numeric_scale
-- FROM information_schema.columns
-- WHERE table_name = 'recipe_products' AND column_name = 'grams_per_liter';
