# 🚀 Guia de Deploy - Blake Vision

Este guia detalha o processo completo para fazer deploy do Blake Vision no Vercel.

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter:

- [x] Conta no GitHub
- [x] Conta no Vercel (pode criar com GitHub)
- [x] Projeto Supabase configurado
- [x] Chave da API da OpenAI

---

## 📝 Passo 1: Preparar o Repositório GitHub

### **1.1. Criar Repositório**

1. Acesse [github.com](https://github.com)
2. Clique em "New repository"
3. Nome: `blake-vision` (ou outro de sua escolha)
4. Visibilidade: Private (recomendado)
5. **NÃO** inicialize com README
6. Clique em "Create repository"

### **1.2. Fazer Upload do Código**

Você tem duas opções:

**Opção A: Via Interface Web do GitHub**

1. No repositório criado, clique em "uploading an existing file"
2. Arraste a pasta `blake-vision` completa
3. Escreva uma mensagem de commit: "Initial commit - Blake Vision 0.0.1"
4. Clique em "Commit changes"

**Opção B: Via Git (se tiver instalado localmente)**

```bash
cd blake-vision
git init
git add .
git commit -m "Initial commit - Blake Vision 0.0.1"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/blake-vision.git
git push -u origin main
```

---

## 🗄️ Passo 2: Configurar Supabase

### **2.1. Verificar Tabelas**

Acesse seu projeto Supabase e verifique se estas tabelas existem:

- `universes`
- `worlds`
- `fichas`
- `categories`
- `relations`
- `episodes`

### **2.2. Adicionar Função de Busca Vetorial**

No SQL Editor do Supabase, execute:

```sql
-- Habilitar extensão de vetores (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar função de busca vetorial
CREATE OR REPLACE FUNCTION match_fichas(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_universe_id uuid
)
RETURNS TABLE (
  id uuid,
  titulo text,
  tipo text,
  resumo text,
  conteudo text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.titulo,
    f.tipo,
    f.resumo,
    f.conteudo,
    1 - (f.embedding <=> query_embedding) as similarity
  FROM fichas f
  INNER JOIN worlds w ON f.world_id = w.id
  WHERE w.universe_id = filter_universe_id
    AND f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) > match_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### **2.3. Configurar Storage (para imagens)**

1. Vá em "Storage" no Supabase
2. Crie um bucket chamado `fichas-images`
3. Configure como **público**
4. Políticas de acesso:
   - **INSERT:** Apenas usuários autenticados
   - **SELECT:** Público
   - **UPDATE/DELETE:** Apenas owner

### **2.4. Obter Credenciais**

Vá em "Settings" → "API" e copie:

- **Project URL:** `https://seu-projeto.supabase.co`
- **anon public key:** `eyJhbGc...` (chave pública)
- **service_role key:** `eyJhbGc...` (chave privada - **não compartilhe!**)

---

## 🔑 Passo 3: Obter Chave OpenAI

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Vá em "API Keys"
3. Clique em "Create new secret key"
4. Copie a chave (começa com `sk-...`)
5. **Guarde em local seguro** (não será mostrada novamente)

---

## 🌐 Passo 4: Deploy no Vercel

### **4.1. Conectar GitHub ao Vercel**

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "Add New..." → "Project"
4. Selecione o repositório `blake-vision`
5. Clique em "Import"

### **4.2. Configurar Variáveis de Ambiente**

Na tela de configuração, clique em "Environment Variables" e adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua chave anon do Supabase | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua chave service_role do Supabase | Production |
| `OPENAI_API_KEY` | Sua chave OpenAI (sk-...) | Production |

**⚠️ IMPORTANTE:**
- Certifique-se de copiar as chaves corretamente (sem espaços extras)
- `NEXT_PUBLIC_*` são visíveis no navegador (use apenas chaves públicas)
- Chaves privadas (service_role, OpenAI) ficam apenas no servidor

### **4.3. Configurações de Build**

Deixe as configurações padrão:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### **4.4. Deploy**

1. Clique em "Deploy"
2. Aguarde ~2-3 minutos
3. ✅ Deploy concluído!

Você verá uma URL como: `https://blake-vision-abc123.vercel.app`

---

## 🌍 Passo 5: Configurar Domínio Personalizado

### **5.1. Adicionar Domínio no Vercel**

1. No projeto, vá em "Settings" → "Domains"
2. Digite `blake.vision`
3. Clique em "Add"

### **5.2. Configurar DNS**

O Vercel mostrará instruções específicas. Geralmente:

**Tipo A:**
```
@ → 76.76.21.21
```

**Tipo CNAME:**
```
www → cname.vercel-dns.com
```

### **5.3. Aguardar Propagação**

- DNS pode levar de 5 minutos a 48 horas para propagar
- Vercel emitirá certificado SSL automaticamente
- Você receberá email quando estiver pronto

---

## ✅ Passo 6: Testar a Aplicação

### **6.1. Acessar a Aplicação**

Acesse `https://blake.vision` (ou sua URL do Vercel)

### **6.2. Criar Conta de Teste**

1. Vá para a página de login
2. Use o Supabase para criar um usuário manualmente:
   - Vá em "Authentication" → "Users"
   - Clique em "Add user"
   - Email: `seu-email@example.com`
   - Senha: `senha-segura`
   - Confirme email automaticamente

### **6.3. Fazer Login**

1. Faça login com as credenciais criadas
2. Você será redirecionado para a página inicial (Chat)

### **6.4. Criar Primeiro Universo**

1. Clique no dropdown de universos
2. Selecione "+ Criar Universo"
3. Nome: "Meu Universo de Teste"
4. Descrição: "Universo para testes"
5. Clique em "Criar"

### **6.5. Testar Agentes de IA**

1. Clique em "Nova Conversa"
2. Escolha Urizen ou Urthona
3. Digite uma pergunta
4. Verifique se a IA responde

**Se a IA não responder:**
- Verifique se a chave OpenAI está correta
- Verifique os logs no Vercel: "Deployments" → "Functions" → "Logs"

---

## 🐛 Solução de Problemas

### **Erro: "OPENAI_API_KEY não configurada"**

**Causa:** Variável de ambiente não foi configurada corretamente

**Solução:**
1. Vá em "Settings" → "Environment Variables" no Vercel
2. Verifique se `OPENAI_API_KEY` está presente
3. Se não estiver, adicione
4. Faça redeploy: "Deployments" → "..." → "Redeploy"

### **Erro: "Acesso negado (401)"**

**Causa:** Problema com autenticação Supabase

**Solução:**
1. Verifique se as URLs e chaves do Supabase estão corretas
2. Verifique se o usuário existe no Supabase
3. Tente fazer logout e login novamente

### **Erro: "Erro ao buscar universos"**

**Causa:** RLS (Row Level Security) pode estar bloqueando

**Solução:**
1. No Supabase, vá em "Authentication" → "Policies"
2. Verifique se há políticas para as tabelas
3. Se necessário, crie políticas básicas:

```sql
-- Política para universes
CREATE POLICY "Users can view own universes"
  ON universes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own universes"
  ON universes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### **Erro: "Function match_fichas does not exist"**

**Causa:** Função de busca vetorial não foi criada

**Solução:**
1. Execute o SQL do Passo 2.2 no SQL Editor do Supabase
2. Verifique se a extensão `vector` está habilitada

### **Deploy falhou**

**Causa:** Erro de build

**Solução:**
1. Veja os logs de build no Vercel
2. Erros comuns:
   - Dependência faltando: rode `npm install` localmente
   - Erro de TypeScript: verifique tipos
   - Erro de importação: verifique caminhos

---

## 📊 Monitoramento

### **Logs do Vercel**

- **Build Logs:** Erros durante build
- **Function Logs:** Erros nas API routes
- **Edge Logs:** Erros no middleware

### **Logs do Supabase**

- **Query Performance:** Queries lentas
- **Auth Logs:** Tentativas de login
- **Storage Logs:** Uploads de arquivos

---

## 🔄 Atualizações Futuras

### **Como Atualizar o Código**

1. Faça alterações no código localmente
2. Commit e push para GitHub:
   ```bash
   git add .
   git commit -m "Descrição da alteração"
   git push
   ```
3. Vercel fará deploy automaticamente

### **Rollback**

Se algo der errado:

1. Vá em "Deployments" no Vercel
2. Encontre o deploy anterior que funcionava
3. Clique em "..." → "Promote to Production"

---

## 🎉 Pronto!

Seu Blake Vision está no ar! 🚀

Acesse: **https://blake.vision**

---

## 📞 Suporte

Problemas? Entre em contato: [help.manus.im](https://help.manus.im)
