-- Adicionar colunas marca e sigla à tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS marca VARCHAR(255) DEFAULT '' NOT NULL,
ADD COLUMN IF NOT EXISTS sigla VARCHAR(50) DEFAULT '' NOT NULL;

-- Criar índices para melhorar performance de ordenação e busca
CREATE INDEX IF NOT EXISTS idx_products_marca ON products(marca);
CREATE INDEX IF NOT EXISTS idx_products_sigla ON products(sigla);
