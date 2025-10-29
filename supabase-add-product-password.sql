-- Adicionar campo de senha aos produtos
-- Execute este script no SQL Editor do Supabase Dashboard

ALTER TABLE products
ADD COLUMN password TEXT;

COMMENT ON COLUMN products.password IS 'Senha opcional para proteção de edição/exclusão do produto';
