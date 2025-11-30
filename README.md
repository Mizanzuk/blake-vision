# Blake Vision 0.0.1

**Blake Vision** é uma plataforma avançada para gerenciar universos ficcionais complexos, com agentes de IA para consulta e criação de narrativas.

Inspirado em William Blake, poeta e visionário inglês.

---

## 🌟 Funcionalidades

### **Organização Hierárquica**
- **Universos** → Container principal do seu mundo ficcional
- **Mundos** → Diferentes histórias, séries ou contextos dentro do universo
- **Fichas** → Personagens, locais, eventos, conceitos, regras e roteiros

### **Agentes de IA**
- **Urizen (Consulta)** → Responde com base em fatos estabelecidos
- **Urthona (Criativo)** → Cria e expande narrativas respeitando regras

### **Recursos Avançados**
- ✅ RAG (Retrieval-Augmented Generation) com busca vetorial
- ✅ Extração automática de lore de documentos (PDF, DOCX, TXT)
- ✅ Sistema de relações entre fichas
- ✅ Timeline de eventos
- ✅ Códigos únicos para fichas
- ✅ Upload de imagens
- ✅ Autocomplete de menções
- ✅ Categorias customizáveis
- ✅ Filtros avançados

### **Novas Funcionalidades (v0.0.1)**
- ✅ Perfil de usuário
- ✅ Modo claro/escuro
- ✅ Internacionalização (pt-BR + en-US)
- ✅ FAQ completa
- ✅ Botão "Criar Conta" (preparado para integração futura)

---

## 🚀 Deploy Rápido

### **1. Fork/Clone no GitHub**

```bash
# Clone este repositório
git clone https://github.com/SEU-USUARIO/blake-vision.git
cd blake-vision
```

### **2. Configure o Supabase**

Você já tem um projeto Supabase configurado. Certifique-se de que as seguintes tabelas existem:

- `universes`
- `worlds`
- `fichas`
- `categories`
- `relations`
- `episodes`

**Função SQL necessária para RAG:**

```sql
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

### **3. Configure Variáveis de Ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# OpenAI
OPENAI_API_KEY=sua-chave-openai
```

### **4. Deploy no Vercel**

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Importe seu repositório do GitHub
4. Configure as variáveis de ambiente (mesmas do `.env.local`)
5. Clique em "Deploy"

**Pronto!** Seu Blake Vision estará no ar em ~2 minutos.

### **5. Configure Domínio Personalizado**

1. No Vercel, vá em "Settings" → "Domains"
2. Adicione `blake.vision`
3. Configure os registros DNS conforme instruções do Vercel

---

## 🛠️ Desenvolvimento Local

### **Pré-requisitos**
- Node.js 18+
- npm ou pnpm

### **Instalação**

```bash
# Instale dependências
npm install

# Execute em modo desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### **Build de Produção**

```bash
npm run build
npm start
```

---

## 📁 Estrutura do Projeto

```
blake-vision/
├── app/
│   ├── api/                    # API Routes
│   │   ├── chat/              # Chat com IA
│   │   ├── catalog/           # Listagem de dados
│   │   ├── universes/         # CRUD de universos
│   │   ├── worlds/            # CRUD de mundos
│   │   ├── fichas/            # CRUD de fichas
│   │   └── categories/        # CRUD de categorias
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes reutilizáveis
│   │   └── providers/        # Providers (Theme, etc.)
│   ├── lib/                   # Bibliotecas e utilitários
│   │   ├── supabase/         # Cliente Supabase
│   │   ├── hooks/            # Custom hooks
│   │   └── stores/           # Zustand stores
│   ├── locales/              # Traduções (i18n)
│   ├── styles/               # Estilos globais
│   ├── types/                # TypeScript types
│   ├── login/                # Página de login
│   ├── profile/              # Página de perfil
│   ├── catalog/              # Página de catálogo
│   ├── timeline/             # Página de timeline
│   ├── upload/               # Página de upload
│   ├── faq/                  # Página de FAQ
│   ├── layout.tsx            # Layout raiz
│   └── page.tsx              # Página inicial (chat)
├── public/                    # Arquivos estáticos
├── tailwind.config.ts        # Configuração Tailwind
├── next.config.mjs           # Configuração Next.js
├── package.json              # Dependências
└── README.md                 # Este arquivo
```

---

## 🎨 Design System

### **Cores**

**Modo Claro:**
- Base: `#FFFFFF`
- Raised: `#F8F9FA`
- Primary: `#2563EB`

**Modo Escuro:**
- Base: `#0A0A0B`
- Raised: `#18181B`
- Primary: `#3B82F6`

### **Tipografia**
- **Sans-serif:** Inter (UI, corpo)
- **Serif:** Merriweather (leitura longa)

### **Componentes Reutilizáveis**
- Button (5 variantes, 3 tamanhos)
- Input, Textarea, Select
- Modal, Card, Badge
- EmptyState, Loading
- ThemeToggle, LocaleToggle

---

## 🔒 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ Row Level Security (RLS) no banco de dados
- ✅ Variáveis de ambiente para chaves sensíveis
- ✅ Isolamento de dados por usuário

---

## 🌐 Internacionalização

Suporte para:
- 🇧🇷 Português Brasileiro (padrão)
- 🇺🇸 English

Arquivos de tradução em `app/locales/`

---

## 📚 Documentação Adicional

### **Como usar os Agentes de IA**

**Urizen (Consulta):**
- Pergunte sobre fatos estabelecidos
- Verifique consistências
- Consulte informações específicas

**Urthona (Criativo):**
- Crie novas histórias
- Expanda narrativas
- Brainstorm de ideias

### **Como criar Fichas**

1. Selecione um universo
2. Vá para "Catálogo"
3. Clique em "+ Nova Ficha"
4. Preencha os campos
5. Adicione imagens (opcional)
6. Salve

### **Como funciona a Timeline**

A Timeline mostra automaticamente todas as fichas que possuem:
- `ano_diegese` (ano no universo ficcional)
- `data_inicio` / `data_fim` (datas específicas)

---

## 🐛 Problemas Conhecidos

### **Funcionalidades Pendentes**

Estas funcionalidades estão preparadas mas não implementadas:

1. **Modal de Ficha Completo**
   - Tabs (Básico, Datas, Relações, Imagens)
   - Upload de múltiplas imagens
   - Autocomplete de menções
   - Gerenciamento de relações

2. **Extração de Lore**
   - Upload funciona, mas extração automática precisa ser implementada
   - Requer integração com OpenAI para análise de documentos

3. **Botão "Criar Conta"**
   - Preparado para integração futura com sistema de pagamento
   - Atualmente apenas visual

### **Melhorias Futuras**

- Exportação de dados (JSON, Markdown, PDF)
- Gráfico de relações (network graph)
- Busca full-text avançada
- Versionamento de fichas
- Colaboração em tempo real

---

## 🤝 Contribuindo

Este é um projeto privado, mas sugestões são bem-vindas!

Entre em contato: [help.manus.im](https://help.manus.im)

---

## 📄 Licença

Propriedade privada. Todos os direitos reservados.

---

## 🙏 Créditos

**Inspiração:** William Blake (1757-1827)

**Tecnologias:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI GPT-4o
- Vercel

---

**Blake Vision v0.0.1** - *"To see a World in a Grain of Sand"*
