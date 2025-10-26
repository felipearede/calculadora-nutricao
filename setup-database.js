const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('Certifique-se de que .env.local está configurado.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Configuração do Banco de Dados - Nutrição de Plantas\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Testar conexão
    console.log('🔍 Testando conexão com Supabase...');
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });

    if (error && error.code !== 'PGRST116') {
      console.log('⚠️  Tabelas ainda não existem (esperado na primeira vez)\n');
    } else {
      console.log('✅ Conexão com Supabase OK!\n');
    }

    // Ler o arquivo SQL
    const sql = fs.readFileSync('supabase-schema.sql', 'utf8');
    const projectId = supabaseUrl.split('.')[0].replace('https://', '');

    console.log('📋 INSTRUÇÕES PARA EXECUTAR O SCHEMA:\n');
    console.log('Por segurança, o Supabase requer que você execute SQL DDL');
    console.log('manualmente no dashboard. Siga estes passos:\n');

    console.log('1️⃣  Acesse o SQL Editor do seu projeto:');
    console.log(`   https://supabase.com/dashboard/project/${projectId}/sql\n`);

    console.log('2️⃣  Clique em "+ New query"\n');

    console.log('3️⃣  Copie TODO o conteúdo do arquivo:');
    console.log('   📄 supabase-schema.sql\n');

    console.log('4️⃣  Cole no editor SQL\n');

    console.log('5️⃣  Clique em "Run" (ou pressione Ctrl+Enter)\n');

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 O schema irá criar:\n');
    console.log('   ✓ Tabela products (produtos de nutrição)');
    console.log('   ✓ Tabela recipes (receitas)');
    console.log('   ✓ Tabela recipe_products (relacionamento)');
    console.log('   ✓ Índices para performance');
    console.log('   ✓ Políticas de segurança (RLS)\n');

    console.log('Após executar o SQL, você pode rodar:');
    console.log('   npm run dev\n');

    console.log('E acessar: http://localhost:3000\n');

    // Copiar SQL para clipboard (se possível)
    console.log('💡 Dica: O conteúdo do schema está em supabase-schema.sql');
    console.log('   Você pode abrir e copiar facilmente!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

setupDatabase();
