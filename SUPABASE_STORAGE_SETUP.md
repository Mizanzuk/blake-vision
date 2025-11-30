# Configuração do Supabase Storage para Blake Vision

## 📦 Bucket Necessário

A funcionalidade de **Upload e Extração de Lore** requer um bucket no Supabase Storage para armazenar os documentos enviados pelos usuários.

---

## 🔧 Passos para Configurar

### **1. Acessar o Painel do Supabase**

1. Acesse https://supabase.com
2. Faça login na sua conta
3. Selecione o projeto do Blake Vision

### **2. Criar o Bucket "documents"**

1. No menu lateral, clique em **Storage**
2. Clique em **"New bucket"**
3. Preencha:
   - **Name:** `documents`
   - **Public bucket:** ❌ **Desmarque** (bucket privado)
   - **File size limit:** 50 MB (ou conforme necessário)
   - **Allowed MIME types:** Deixe em branco (permitir todos)
4. Clique em **"Create bucket"**

### **3. Configurar Políticas de Acesso (RLS)**

O bucket `documents` deve ser **privado**, mas usuários autenticados devem poder:
- **Upload** de seus próprios arquivos
- **Download** de seus próprios arquivos

#### **Política 1: Permitir Upload**

```sql
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### **Política 2: Permitir Download**

```sql
CREATE POLICY "Users can download their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### **Política 3: Permitir Exclusão**

```sql
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### **4. Aplicar as Políticas**

1. No painel do Supabase, vá para **Storage**
2. Clique no bucket **documents**
3. Clique na aba **"Policies"**
4. Clique em **"New policy"**
5. Cole cada uma das políticas acima
6. Clique em **"Review"** e depois **"Save policy"**

---

## 🧪 Testar a Configuração

### **Teste Manual via Painel**

1. Vá para **Storage** → **documents**
2. Tente fazer upload de um arquivo de teste
3. Verifique se o arquivo aparece na listagem

### **Teste via Aplicação**

1. Faça login no Blake Vision
2. Vá para a página de **Upload**
3. Selecione um universo e mundo
4. Faça upload de um arquivo PDF, DOCX ou TXT
5. Verifique se:
   - Upload é bem-sucedido
   - Extração de texto funciona
   - Entidades são extraídas
   - Fichas são criadas

---

## 🔐 Segurança

### **Estrutura de Pastas**

Os arquivos são organizados por usuário:

```
documents/
├── {user_id_1}/
│   ├── 1701234567890-documento1.pdf
│   └── 1701234567891-documento2.docx
├── {user_id_2}/
│   ├── 1701234567892-documento3.txt
│   └── 1701234567893-documento4.pdf
```

### **Isolamento**

- Cada usuário só pode acessar seus próprios arquivos
- O `user_id` é extraído do token JWT (autenticação)
- Não é possível acessar arquivos de outros usuários

---

## ⚠️ Importante

### **Service Role Key**

A API de extração usa a **Service Role Key** para:
- Baixar arquivos do Storage
- Processar texto
- Chamar OpenAI

Certifique-se de que a variável `SUPABASE_SERVICE_ROLE_KEY` está configurada no `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### **Onde Encontrar a Service Role Key**

1. Painel do Supabase
2. **Settings** → **API**
3. Seção **"Project API keys"**
4. Copie a **service_role key** (não a anon key!)

---

## 📝 Checklist de Configuração

- [ ] Bucket `documents` criado
- [ ] Bucket configurado como **privado**
- [ ] Política de upload aplicada
- [ ] Política de download aplicada
- [ ] Política de exclusão aplicada
- [ ] Service Role Key configurada no `.env.local`
- [ ] Teste de upload realizado com sucesso

---

## 🐛 Troubleshooting

### **Erro: "new row violates row-level security policy"**

**Causa:** Políticas RLS não configuradas corretamente

**Solução:** Verifique se as 3 políticas foram aplicadas corretamente

---

### **Erro: "Error uploading file"**

**Causa:** Bucket não existe ou nome incorreto

**Solução:** Verifique se o bucket se chama exatamente `documents`

---

### **Erro: "Unauthorized"**

**Causa:** Service Role Key não configurada ou inválida

**Solução:** Verifique o `.env.local` e reinicie o servidor

---

## ✅ Conclusão

Após seguir estes passos, a funcionalidade de **Upload e Extração de Lore** estará totalmente funcional!

Os usuários poderão:
- Fazer upload de documentos
- Extrair automaticamente entidades com IA
- Revisar e editar antes de salvar
- Criar fichas em lote

---

**Configuração completa!** 🚀
