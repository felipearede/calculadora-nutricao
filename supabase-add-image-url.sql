-- Adicionar coluna image_url à tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Comentário explicativo
COMMENT ON COLUMN products.image_url IS 'URL da imagem do produto';
