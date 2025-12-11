const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://qvqfifbayxuuoilxliwy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cWZpZmJheXh1dW9pbHhsaXd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxMzA3NCwiZXhwIjoyMDc4Nzg5MDc0fQ.JO5I5wTEc_ea17m4Rr4No_sBf9GlOwaXnIwVScFwf_I';

// Ler o arquivo SQL
const sqlFile = fs.readFileSync('./supabase/migrations/20241211_create_episodes_table.sql', 'utf8');

// Dividir em statements individuais (simples, pode não funcionar para todos os casos)
const statements = sqlFile
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Total de ${statements.length} statements para executar\n`);

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'qvqfifbayxuuoilxliwy.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          reject({ success: false, status: res.statusCode, error: body });
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function runMigration() {
  console.log('Iniciando aplicação da migration...\n');
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`[${i + 1}/${statements.length}] Executando statement...`);
    console.log(statement.substring(0, 100) + '...\n');
    
    try {
      const result = await executeSQL(statement + ';');
      console.log('✅ Sucesso!\n');
    } catch (error) {
      console.error('❌ Erro:', error);
      console.error('\nStatement que falhou:');
      console.error(statement);
      console.error('\n');
    }
  }
  
  console.log('\n✅ Migration concluída!');
}

runMigration().catch(console.error);
