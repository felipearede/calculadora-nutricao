-- Adicionar coluna password à tabela recipes para proteção de edição e exclusão
-- A senha é opcional e armazenada em texto plano
-- Receitas sem senha podem ser editadas/excluídas livremente
-- Receitas com senha requerem autenticação para modificação

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Comentário: A senha é opcional (NULL permitido)
-- Para adicionar hash no futuro, considere usar extensão pgcrypto do PostgreSQL

-- Verificar a alteração (opcional)
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'recipes' AND column_name = 'password';
