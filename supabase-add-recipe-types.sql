-- Adiciona coluna recipe_types para armazenar tipos de receita (vega, flora, clone, madre)
-- Execute este SQL no Supabase Dashboard -> SQL Editor

-- Adicionar coluna recipe_types como array de texto
ALTER TABLE recipes
ADD COLUMN recipe_types TEXT[];

-- Criar índice GIN para otimizar buscas em arrays
CREATE INDEX idx_recipes_types ON recipes USING GIN (recipe_types);

-- Opcional: Adicionar comentário para documentação
COMMENT ON COLUMN recipes.recipe_types IS 'Tipos de receita: vega, flora, clone, madre (pode ter múltiplos valores)';
