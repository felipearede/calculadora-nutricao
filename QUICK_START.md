# Guia de Início Rápido

## Passo 1: Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. No painel do seu projeto, vá em **Settings** > **API**
3. Copie a **URL** e a **anon public key**
4. Abra o arquivo `.env.local` e cole suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

## Passo 2: Configure o Banco de Dados

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **+ New query**
3. Abra o arquivo `supabase-schema.sql` deste projeto
4. Copie todo o conteúdo e cole no SQL Editor
5. Clique em **Run** (ou pressione Ctrl+Enter)

Isso criará todas as tabelas necessárias: `products`, `recipes` e `recipe_products`.

## Passo 3: Execute o Projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Passo 4: Use o Sistema

### Cadastrar Produtos
1. Clique em **Gerenciar Produtos**
2. Preencha o nome do produto
3. Informe a porcentagem de garantia de cada elemento (N, P, K, Ca, Mg, S, B, Cu, Fe, Mn, Zn, Mo)
4. Clique em **Cadastrar**

Exemplo:
- Nome: NPK 15-15-15
- N: 15
- P: 15
- K: 15
- Outros: 0

### Criar Receitas
1. Clique em **Criar Receitas**
2. Preencha:
   - Nome da receita
   - Total de litros (ex: 100)
   - EC (condutividade elétrica)
   - pH
3. Selecione um produto e informe g/L
4. Clique em **Adicionar**
5. Repita para adicionar mais produtos
6. Visualize o cálculo automático de PPM
7. Clique em **Salvar Receita**

### Entendendo o Cálculo PPM

**Fórmula**: `(% garantia / 100) × g/L × 1000 = PPM`

**Exemplo**:
- Produto com 15% de N
- Usando 1 g/L
- PPM = (15 / 100) × 1 × 1000 = **150 ppm de N**

## Funcionalidades

- ✅ Cadastrar produtos com 12 elementos (N, P, K, Ca, Mg, S, B, Cu, Fe, Mn, Zn, Mo)
- ✅ Criar receitas com múltiplos produtos
- ✅ Calcular gramas totais automaticamente (litros × g/L)
- ✅ Visualizar PPM de cada elemento em tempo real
- ✅ Editar produtos e receitas
- ✅ Alterar quantidades dos produtos na receita
- ✅ Dados persistidos no Supabase
- ✅ Interface responsiva

## Dicas

- **Gramas Totais**: Mostra quanto você vai usar de cada produto (Total litros × g/L)
- **PPM**: Indica a concentração de cada elemento na solução final
- **Editar**: Clique em "Editar" nos produtos ou clique em uma receita salva para editá-la
- **EC e pH**: Registre esses valores para controle de qualidade

## Suporte

Se tiver problemas:
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme que o script SQL foi executado no Supabase
3. Verifique o console do navegador para erros
4. Teste a conexão com o Supabase na página de API Settings

## Próximos Passos

Agora você pode:
- Cadastrar todos os seus produtos de nutrição
- Criar diferentes receitas para diferentes estágios de crescimento
- Experimentar diferentes combinações de produtos
- Monitorar e ajustar o PPM de cada elemento

Boa nutrição! 🌱
