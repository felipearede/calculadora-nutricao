# Configuração do MCP do Supabase

## ✅ Passo 1: Configuração Concluída

O arquivo `.claude/mcp.json` já foi atualizado com:
- Project Reference: `anawjrzalulfkivnvtui`
- Autenticação via Bearer Token

## 🔑 Passo 2: Adicionar seu Personal Access Token

Você precisa definir a variável de ambiente `SUPABASE_ACCESS_TOKEN` com seu PAT.

### Opção A: Definir no Sistema (Recomendado)

**Windows (PowerShell):**
```powershell
$env:SUPABASE_ACCESS_TOKEN = "seu-token-aqui"
```

**Windows (CMD):**
```cmd
set SUPABASE_ACCESS_TOKEN=seu-token-aqui
```

**Linux/Mac:**
```bash
export SUPABASE_ACCESS_TOKEN="seu-token-aqui"
```

### Opção B: Adicionar ao .env.local

Adicione esta linha ao arquivo `.env.local`:
```env
SUPABASE_ACCESS_TOKEN=seu-token-aqui
```

**Importante**: Claude Code pode precisar que você defina a variável de ambiente no sistema operacional, não apenas no .env.local.

## 🔄 Passo 3: Reiniciar Claude Code

Após definir o token:
1. Feche completamente o Claude Code
2. Reabra o Claude Code
3. Execute `/mcp` para verificar se o servidor está conectado

## ✅ Passo 4: Verificar Conexão

Execute no terminal:
```bash
/mcp
```

Você deverá ver o servidor Supabase listado como conectado.

## 🚀 Passo 5: Executar o Schema SQL

Depois que o MCP estiver conectado, posso usar as ferramentas MCP do Supabase para executar o schema SQL automaticamente!

## 📋 Onde Encontrar seu PAT

Se você não tiver o PAT em mãos:
1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate new token"
3. Dê um nome descritivo (ex: "Claude Code MCP")
4. Marque os scopes necessários (recomendado: all)
5. Copie o token gerado

**⚠️ Importante**: O token só será mostrado uma vez! Guarde-o em local seguro.

## 🛡️ Segurança

- Nunca comite o token no Git
- O `.env.local` já está no .gitignore
- Use este MCP apenas em ambiente de desenvolvimento
