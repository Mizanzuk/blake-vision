# 📚 Sistema de Biblioteca e Editor - Instruções de Instalação

## ✅ O que foi implementado:

### 1. **Botão "Enviar para Editor" no Chat**
- Ao passar o mouse sobre mensagens do assistente (Urthona/Urizen)
- Aparece botão de "Enviar para Editor" ao lado do botão "Copiar"
- Cria automaticamente um rascunho na Biblioteca

### 2. **Página de Editor** (`/editor`)
- Editor de texto completo com salvamento automático
- Configuração de Universo, Mundo e Episódio
- **Assistentes integrados:**
  - **Urthona** (Criativo): Ajuda a desenvolver e expandir o texto
  - **Urizen** (Analítico): Verifica consistência com o lore
- Botão "Publicar" para mover de Rascunho → Publicado
- Botão "Enviar para Upload" (apenas em textos publicados)

### 3. **Página de Biblioteca** (`/biblioteca`)
- **Aba Rascunhos:** Textos em desenvolvimento
- **Aba Publicados:** Textos finalizados
- **Label "Extração OK":** Aparece em textos que já foram enviados para Upload e extraídos

### 4. **Integração com Upload**
- Textos publicados podem ser enviados para Upload
- Preenche automaticamente: texto, universo, mundo, episódio
- Inicia extração automática de fichas
- Marca texto como "extraído" após processamento

### 5. **Link "Biblioteca" no TopNav**
- Adicionado entre Timeline e Upload

---

## 🔧 PASSO A PASSO PARA ATIVAR:

### **Passo 1: Criar tabela `textos` no Supabase**

1. Acesse: https://supabase.com/dashboard/project/qvqfifbayxuuoilxliwy/sql/new

2. Cole e execute este SQL:

```sql
-- Tabela para armazenar textos do editor/biblioteca
CREATE TABLE textos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  universe_id UUID,
  world_id TEXT,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  episodio TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
  extraido BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_textos_user_id ON textos(user_id);
CREATE INDEX idx_textos_status ON textos(status);
CREATE INDEX idx_textos_universe_id ON textos(universe_id);
CREATE INDEX idx_textos_world_id ON textos(world_id);
CREATE INDEX idx_textos_extraido ON textos(extraido);

-- RLS (Row Level Security)
ALTER TABLE textos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios textos"
  ON textos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios textos"
  ON textos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios textos"
  ON textos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios textos"
  ON textos FOR DELETE
  USING (auth.uid() = user_id);
```

3. Clique em **"Run"** ou **"Execute"**

4. ✅ Pronto! A tabela foi criada.

---

### **Passo 2: Verificar se o deploy já foi feito**

O código já foi commitado e enviado para o GitHub. O Vercel deve fazer o deploy automaticamente.

Aguarde 1-2 minutos e acesse: https://blake.vision

---

## 🎯 Como usar:

### **Fluxo completo:**

1. **Chat → Editor**
   - Converse com Urthona (modo criativo)
   - Passe o mouse sobre a resposta
   - Clique em "Enviar para Editor"
   - ✅ Texto vai para Biblioteca como Rascunho

2. **Editor**
   - Configure Universo, Mundo, Episódio
   - Edite o texto
   - Use Urthona para desenvolver mais
   - Use Urizen para verificar consistência
   - Clique em "Publicar"
   - ✅ Texto vai para Publicados

3. **Biblioteca → Upload**
   - Vá em Biblioteca → Publicados
   - Abra o texto
   - Clique em "Enviar para Upload"
   - ✅ Upload abre com tudo preenchido
   - ✅ Extração inicia automaticamente
   - ✅ Texto recebe label "Extração OK"

---

## 📋 Checklist:

- [ ] Executar SQL no Supabase
- [ ] Aguardar deploy do Vercel
- [ ] Testar fluxo: Chat → Editor → Biblioteca → Upload
- [ ] Verificar se label "Extração OK" aparece

---

## 🐛 Se algo não funcionar:

1. Verifique se a tabela `textos` foi criada no Supabase
2. Faça hard refresh (Ctrl+Shift+R) no navegador
3. Verifique o console do navegador (F12) para erros
4. Me avise! 😊

---

**Bom teste! 🚀**
