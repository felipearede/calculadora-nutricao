-- Adicionar coluna owner (proprietário) na tabela recipes
-- Este campo é opcional e permite identificar o dono/criador de cada receita
-- O usuário pode digitar livremente o nome com ou sem @

ALTER TABLE recipes
ADD COLUMN owner TEXT;

-- Criar índice para melhorar performance das queries de filtro por owner
CREATE INDEX idx_recipes_owner ON recipes(owner);

-- Comentário: Execute este script no Supabase Dashboard > SQL Editor
-- Após a execução, todas as receitas existentes terão owner = NULL (opcional)
