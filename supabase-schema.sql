-- Criação das tabelas para o sistema de gerenciamento de receitas de nutrição

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  n DECIMAL(5,2) DEFAULT 0 NOT NULL,  -- Nitrogênio (%)
  p DECIMAL(5,2) DEFAULT 0 NOT NULL,  -- Fósforo (%)
  k DECIMAL(5,2) DEFAULT 0 NOT NULL,  -- Potássio (%)
  ca DECIMAL(5,2) DEFAULT 0 NOT NULL, -- Cálcio (%)
  mg DECIMAL(5,2) DEFAULT 0 NOT NULL, -- Magnésio (%)
  s DECIMAL(5,2) DEFAULT 0 NOT NULL,  -- Enxofre (%)
  b DECIMAL(5,2) DEFAULT 0 NOT NULL,  -- Boro (%)
  cu DECIMAL(5,2) DEFAULT 0 NOT NULL, -- Cobre (%)
  fe DECIMAL(5,2) DEFAULT 0 NOT NULL, -- Ferro (%)
  mn DECIMAL(5,2) DEFAULT 0 NOT NULL, -- Manganês (%)
  zn DECIMAL(5,2) DEFAULT 0 NOT NULL, -- Zinco (%)
  mo DECIMAL(5,2) DEFAULT 0 NOT NULL, -- Molibdênio (%)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de receitas
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  total_liters DECIMAL(10,2) NOT NULL,
  ec DECIMAL(5,2) DEFAULT 0 NOT NULL,
  ph DECIMAL(4,2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de relacionamento produtos-receitas
CREATE TABLE IF NOT EXISTS recipe_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  grams_per_liter DECIMAL(10,3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_recipe_products_recipe_id ON recipe_products(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_products_product_id ON recipe_products(product_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_products ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (ajuste conforme suas necessidades de segurança)
-- Permite leitura, inserção, atualização e exclusão para todos os usuários

-- Políticas para products
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON products FOR DELETE USING (true);

-- Políticas para recipes
CREATE POLICY "Enable read access for all users" ON recipes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON recipes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON recipes FOR DELETE USING (true);

-- Políticas para recipe_products
CREATE POLICY "Enable read access for all users" ON recipe_products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON recipe_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON recipe_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON recipe_products FOR DELETE USING (true);
