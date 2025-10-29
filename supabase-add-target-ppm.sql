-- Adicionar campos de PPM alvo para cada elemento na tabela recipes

ALTER TABLE recipes
ADD COLUMN target_n NUMERIC,
ADD COLUMN target_p NUMERIC,
ADD COLUMN target_k NUMERIC,
ADD COLUMN target_ca NUMERIC,
ADD COLUMN target_mg NUMERIC,
ADD COLUMN target_s NUMERIC,
ADD COLUMN target_b NUMERIC,
ADD COLUMN target_cu NUMERIC,
ADD COLUMN target_fe NUMERIC,
ADD COLUMN target_mn NUMERIC,
ADD COLUMN target_zn NUMERIC,
ADD COLUMN target_mo NUMERIC;

COMMENT ON COLUMN recipes.target_n IS 'PPM alvo de Nitrogênio';
COMMENT ON COLUMN recipes.target_p IS 'PPM alvo de Fósforo';
COMMENT ON COLUMN recipes.target_k IS 'PPM alvo de Potássio';
COMMENT ON COLUMN recipes.target_ca IS 'PPM alvo de Cálcio';
COMMENT ON COLUMN recipes.target_mg IS 'PPM alvo de Magnésio';
COMMENT ON COLUMN recipes.target_s IS 'PPM alvo de Enxofre';
COMMENT ON COLUMN recipes.target_b IS 'PPM alvo de Boro';
COMMENT ON COLUMN recipes.target_cu IS 'PPM alvo de Cobre';
COMMENT ON COLUMN recipes.target_fe IS 'PPM alvo de Ferro';
COMMENT ON COLUMN recipes.target_mn IS 'PPM alvo de Manganês';
COMMENT ON COLUMN recipes.target_zn IS 'PPM alvo de Zinco';
COMMENT ON COLUMN recipes.target_mo IS 'PPM alvo de Molibdênio';
