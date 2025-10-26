# Sistema de Gerenciamento de Receitas de Nutrição de Plantas

Sistema completo para cadastrar produtos de nutrição e criar receitas personalizadas com cálculo automático de PPM (partes por milhão) para cada elemento.

## Funcionalidades

### Página de Produtos
- Cadastrar produtos com garantias de elementos (N, P, K, Ca, Mg, S, B, Cu, Fe, Mn, Zn, Mo)
- Listar todos os produtos cadastrados
- Editar produtos existentes
- Excluir produtos

### Página de Receitas
- Criar receitas com nome, quantidade de litros, EC e pH
- Adicionar produtos cadastrados à receita
- Definir quantidade (g/L) de cada produto
- Visualizar gramas totais de cada produto (litros × g/L)
- Cálculo automático de PPM para cada elemento
- Editar receitas e quantidades dos produtos
- Salvar receitas no banco de dados
- Listar receitas salvas

## Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Banco de dados PostgreSQL e autenticação

## Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

Você pode obter essas credenciais no painel do Supabase em: Project Settings > API

### 3. Configurar Banco de Dados

Execute o script SQL no SQL Editor do Supabase (disponível em `supabase-schema.sql`):

1. Acesse seu projeto no Supabase
2. Vá em SQL Editor
3. Crie uma nova query
4. Cole o conteúdo do arquivo `supabase-schema.sql`
5. Execute o script

Isso criará as tabelas:
- `products` - Armazena os produtos de nutrição
- `recipes` - Armazena as receitas
- `recipe_products` - Relaciona produtos com receitas

### 4. Executar o Projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
calculadora/
├── app/
│   ├── produtos/           # Página de cadastro de produtos
│   ├── receitas/           # Página de criação de receitas
│   ├── layout.tsx          # Layout principal com navegação
│   ├── page.tsx            # Página inicial
│   └── globals.css         # Estilos globais
├── lib/
│   ├── supabase.ts         # Configuração do cliente Supabase
│   ├── types.ts            # Tipos TypeScript
│   └── utils.ts            # Funções utilitárias (cálculos PPM)
├── supabase-schema.sql     # Script SQL para criar tabelas
└── package.json
```

## Como Usar

### Cadastrar Produtos

1. Acesse a página "Produtos"
2. Preencha o nome do produto
3. Informe as porcentagens de garantia de cada elemento (N, P, K, etc.)
4. Clique em "Cadastrar"

### Criar Receitas

1. Acesse a página "Receitas"
2. Preencha o nome da receita, total de litros, EC e pH
3. Selecione um produto cadastrado
4. Informe a quantidade em g/L
5. Clique em "Adicionar"
6. Repita para adicionar mais produtos
7. Visualize o cálculo de PPM de cada elemento
8. Clique em "Salvar Receita"

### Editar

- **Produtos**: Clique em "Editar" na tabela de produtos
- **Receitas**: Clique em uma receita salva na barra lateral
- **Quantidades**: Edite os valores de g/L diretamente na tabela da receita

## Cálculo de PPM

A fórmula utilizada para calcular PPM é:

```
PPM = (% de garantia / 100) × g/L × 1000
```

**Exemplo**:
- Produto com 15% de N
- Usando 1 g/L
- PPM = (15 / 100) × 1 × 1000 = 150 ppm

## Suporte

Para dúvidas ou problemas, verifique:
1. Se as variáveis de ambiente estão configuradas corretamente
2. Se o script SQL foi executado no Supabase
3. Se as dependências foram instaladas

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
