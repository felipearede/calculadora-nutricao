-- Adicionar coluna product_url à tabela products
ALTER TABLE products
ADD COLUMN product_url TEXT;

COMMENT ON COLUMN products.product_url IS 'URL do site onde o produto é vendido';
