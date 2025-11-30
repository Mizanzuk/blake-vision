# 📝 Changelog - Blake Vision

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.1.1] - 2025-11-30

### 🐛 Correções de Build

#### **Corrigido: Classes Tailwind CSS Customizadas**
- **Problema:** Build falhava no Vercel com erro `The 'dark:text-dark-primary' class does not exist`
- **Causa:** Classes customizadas do design system não estavam definidas explicitamente no `globals.css`
- **Solução:** Adicionadas todas as classes customizadas no `@layer utilities`:
  - Classes de superfície: `.bg-light-base`, `.bg-light-raised`, `.bg-light-overlay` (+ dark variants)
  - Classes de texto: `.text-text-light-primary`, `.text-text-light-secondary`, `.text-text-light-tertiary` (+ dark variants)
  - Classes de borda: `.border-border-light-default`, `.border-border-light-subtle`, `.border-border-light-strong` (+ dark variants)
  - Estados hover/active/placeholder para dark mode
  - Ring offset para dark mode

#### **Corrigido: Imports de Fontes**
- **Problema:** Build falhava com erro `'Geist' is not exported from 'geist/font'`
- **Causa:** Pacote `geist/font` não disponível ou com estrutura de exports incompatível
- **Solução:** Removidos imports de `geist/font`, mantendo apenas fontes do Google (`Inter` e `Merriweather`)

### 📁 Arquivos Modificados
- `app/styles/globals.css` - Adicionadas 50+ linhas de classes customizadas no `@layer utilities`
- `app/layout.tsx` - Removida linha 3 (`import { Geist, Geist_Mono } from "geist/font"`) e referências no className

### ✅ Impacto
- Build agora completa com sucesso no Vercel
- Todas as funcionalidades mantidas (zero breaking changes)
- Design system funciona corretamente em light/dark mode
- Fontes profissionais mantidas (Inter para UI, Merriweather para conteúdo)

---

## [0.1.0] - 2025-11-30

### 🎉 Lançamento Inicial

Primeira versão do **Blake Vision** - redesign completo e melhorado do projeto "Lore Machine".

#### **✨ Novas Funcionalidades (11 features)**

1. **👤 Perfil de Usuário**
   - Página dedicada em `/profile`
   - Exibição de avatar, nome e email
   - Estatísticas de uso (universos, mundos, fichas)
   - Configurações de tema e idioma
   - Botão de logout

2. **❓ FAQ Interativo**
   - Página dedicada em `/faq`
   - 12 perguntas frequentes organizadas em 3 categorias
   - Accordion expansível para navegação eficiente
   - Seção de contato com suporte

3. **🌓 Theme Toggle**
   - Alternância entre light/dark mode
   - Ícones intuitivos (sol/lua)
   - Persistência de preferência
   - Transições suaves

4. **🌐 Internacionalização (i18n)**
   - Suporte para Português (pt-BR) e Inglês (en-US)
   - Toggle de idioma no header
   - Traduções completas em todas as páginas
   - Estrutura preparada para novos idiomas

5. **🔗 Sistema de Relações**
   - 18 tipos de relações entre fichas
   - Interface visual para criar/editar relações
   - Autocomplete inteligente para buscar fichas
   - Exibição de relações existentes com badges
   - Navegação entre fichas relacionadas

6. **🖼️ Upload de Imagens**
   - Upload para Supabase Storage
   - Preview antes do upload
   - Suporte para PNG, JPG, WEBP (max 5MB)
   - URLs públicas geradas automaticamente
   - Integração com fichas (campo `image_url`)

7. **@ Mentions Autocomplete**
   - Autocomplete com @ em campos de texto
   - Busca em tempo real de fichas
   - Navegação por teclado (↑↓ Enter Esc)
   - Inserção automática de `[[nome_ficha]]`
   - Visual com ícone, nome e categoria

8. **📅 Agrupamento de Timeline**
   - 4 modos de visualização: Lista, Década, Ano, Mês
   - Seletor visual no header
   - Agrupamento automático por período
   - Contadores de eventos por grupo
   - Ordenação cronológica

9. **💬 Melhorias no Chat**
   - Seleção de agente (Urizen/Urthona)
   - Histórico persistente no localStorage
   - Indicador de digitação animado
   - Scroll automático para última mensagem
   - Botão de limpar histórico

10. **📚 Melhorias no Catálogo**
    - Filtros por universo/mundo/categoria
    - Busca em tempo real
    - Cards com preview de conteúdo
    - Contador de fichas
    - Navegação breadcrumb

11. **📤 Melhorias no Upload**
    - Drag & drop de arquivos
    - Suporte para PDF, DOCX, TXT
    - Preview de arquivo selecionado
    - Progresso de upload
    - Instruções claras

#### **🎨 Design System Completo**

**Cores Semânticas:**
- Sistema baseado em variáveis CSS (`--color-*`)
- Paleta stone (50-950) para neutralidade elegante
- Suporte completo a light/dark mode
- Cores de superfície: base, raised, overlay
- Cores de borda: subtle, default, strong
- Cores de texto: primary, secondary, tertiary, disabled

**Tipografia:**
- **Inter** (Google Fonts) para UI e interface
- **Merriweather** (Google Fonts) para conteúdo longo
- Escala tipográfica consistente (text-xs a text-5xl)
- Line-height otimizado para leitura
- Antialiasing e font-smoothing

**Espaçamento:**
- Sistema de espaçamento consistente (4px base)
- Padding e margin harmonizados
- Gaps em flexbox/grid padronizados

**Componentes UI (14 componentes):**
- `Button` - 3 variantes (primary, secondary, ghost) + 3 tamanhos
- `Input` - Com label, ícones, estados de erro
- `Textarea` - Redimensionável, contador de caracteres
- `Select` - Dropdown customizado com ícone
- `Badge` - 3 variantes (default, primary, success)
- `Card` - 2 variantes (default, elevated)
- `Modal` - Com header, body, footer customizáveis
- `EmptyState` - Para estados vazios com ícone e CTA
- `Loading` - Spinner e skeleton loaders
- `ThemeToggle` - Alternância de tema
- `LocaleToggle` - Alternância de idioma
- `MentionTextarea` - Textarea com autocomplete
- `Toaster` - Notificações toast
- `Breadcrumb` - Navegação hierárquica

**Componentes Especializados (4 modais):**
- `FichaModal` - Criar/editar fichas com 4 abas (Conteúdo, Relações, Imagem, Metadados)
- `WorldModal` - Criar/editar mundos
- `CategoryModal` - Criar/editar categorias
- `UniverseModal` - Criar/editar universos

#### **🏗️ Arquitetura**

**Páginas (7 rotas):**
- `/` - Chat com agentes IA
- `/login` - Autenticação
- `/profile` - Perfil do usuário
- `/catalog` - Catálogo de fichas
- `/timeline` - Linha do tempo
- `/upload` - Upload de documentos
- `/faq` - Perguntas frequentes

**API Routes (11 endpoints):**
- `/api/chat` - Conversa com agentes IA
- `/api/extract-lore` - Extração de lore de documentos
- `/api/universes` - CRUD de universos
- `/api/worlds` - CRUD de mundos
- `/api/categories` - CRUD de categorias
- `/api/fichas` - CRUD de fichas
- `/api/fichas/[id]` - Operações em ficha específica
- `/api/relations` - CRUD de relações
- `/api/timeline` - Busca de eventos
- `/api/search` - Busca RAG com embeddings
- `/api/upload-image` - Upload de imagens

**Banco de Dados (Supabase):**
- `universes` - Universos narrativos
- `worlds` - Mundos dentro de universos
- `categories` - Categorias de fichas
- `fichas` - Fichas de lore
- `relations` - Relações entre fichas
- `documents` - Documentos embeddings para RAG

**Integrações:**
- **Supabase** - PostgreSQL + Auth + Storage
- **OpenAI GPT-4o** - Agentes IA e embeddings
- **Vercel** - Hosting e deployment
- **GitHub** - Controle de versão

#### **📚 Documentação**

**Arquivos criados:**
- `README.md` (8.092 bytes) - Documentação principal do projeto
- `DEPLOY.md` (8.753 bytes) - Guia completo de deployment
- `ROADMAP.md` (7.118 bytes) - Roadmap de features futuras
- `CHANGELOG.md` (este arquivo) - Histórico de mudanças
- `SUPABASE_STORAGE_SETUP.md` (4.752 bytes) - Configuração do Storage

**Conteúdo da documentação:**
- Visão geral do projeto
- Guia de instalação local
- Guia de deployment (GitHub + Vercel)
- Configuração de variáveis de ambiente
- Estrutura do banco de dados
- Arquitetura do sistema
- Roadmap de features
- Troubleshooting

#### **✅ Paridade com Lore Machine**

**Todas as funcionalidades originais mantidas:**
- ✅ Chat com agentes IA (Urizen e Urthona)
- ✅ Extração automática de lore de documentos
- ✅ Gestão hierárquica (Universo → Mundo → Ficha)
- ✅ Categorias customizáveis
- ✅ Busca RAG com embeddings
- ✅ Timeline de eventos
- ✅ Autenticação Supabase
- ✅ Upload de documentos (PDF, DOCX, TXT)

**Melhorias sobre o original:**
- 🎨 Design system profissional e consistente
- 🌓 Suporte a dark mode
- 🌐 Internacionalização (pt-BR + en-US)
- 🔗 Sistema de relações entre fichas
- 🖼️ Upload de imagens
- @ Autocomplete de menções
- 📅 Múltiplos modos de visualização de timeline
- 👤 Perfil de usuário completo
- ❓ FAQ interativo
- 📚 Documentação extensa

#### **📊 Estatísticas**

- **Linhas de código:** ~15.000
- **Componentes:** 18 (14 UI + 4 modais)
- **Páginas:** 7
- **API Routes:** 11
- **Tabelas DB:** 5
- **Documentação:** 1.800+ linhas
- **Tamanho do ZIP:** 110 KB
- **Features novas:** 11
- **Melhorias:** 15

---

## Tipos de Mudanças

- `Added` - Novas funcionalidades
- `Changed` - Mudanças em funcionalidades existentes
- `Deprecated` - Funcionalidades que serão removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Correções de bugs
- `Security` - Correções de segurança

---

**Blake Vision** - *"Illuminate Your Narrative Universe"*
