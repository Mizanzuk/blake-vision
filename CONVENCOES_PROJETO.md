# Convenções e Padrões do Projeto Blake Vision

Este arquivo documenta as convenções, nomenclaturas e padrões de design estabelecidos para o projeto Blake Vision.

---

## 🎨 Componentes de UI

### Dropdown Estilizado

**Nome técnico:** `UniverseDropdown` (e variações)  
**Nome de referência:** **"dropdown estilizado"**

**Descrição:**  
Componente de dropdown personalizado usado em todo o projeto para seleção de opções com design consistente.

**Localização dos componentes:**
- `/app/components/ui/UniverseDropdown.tsx` - Seleção de universos
- `/app/components/ui/WorldsDropdown.tsx` - Seleção de múltiplos mundos
- `/app/components/ui/WorldsDropdownSingle.tsx` - Seleção de um único mundo
- `/app/components/ui/TypesDropdown.tsx` - Seleção de tipos de fichas
- `/app/components/ui/EpisodesDropdown.tsx` - Seleção de episódios
- `/app/components/projetos/OrdenacaoDropdown.tsx` - Ordenação
- `/app/components/projetos/TipoDropdown.tsx` - Filtro de tipos

**Características visuais:**
- Botão principal com fundo claro, borda, texto à esquerda e seta à direita
- Menu dropdown que aparece abaixo com sombra
- Itens com hover destacado
- Opção "Criar Novo" no final da lista com ícone "+"
- Suporte a drag-and-drop para reordenação (quando aplicável)
- Botões de editar/deletar no hover (quando aplicável)

**Como referenciar:**
Quando precisar aplicar esse padrão de design, use o termo:
- ✅ **"dropdown estilizado"**

---

## 📋 Padrões de Cards

### Cards de Fichas

**Estrutura para Episódios:**
```
┌─────────────────────────┐
│ EP                      │ ← Badge de tipo
│                         │
│ Número. Título          │ ← Negrito
│                         │
│   Logline em itálico    │ ← Padding-left, itálico
│                         │
│   Sinopse do episódio   │ ← Padding-left
│                         │
└─────────────────────────┘
```

**Componentes:**
- `/app/components/shared/FichaCard.tsx` - Card compartilhado
- `/app/components/shared/FichaViewModal.tsx` - Modal de visualização

**Comportamento:**
- Clicar no card → Abre modal de visualização (somente leitura)
- Clicar no ícone de editar no modal → Abre modal de edição
- Sem botões no hover do card (design limpo)

---

## 🤖 Agentes de IA

### Urthona (Criativo)
- **Função:** Análise criativa e sugestões narrativas
- **Capacidade:** Lê o conteúdo do editor e oferece ideias criativas

### Urizen (Analítico)
- **Função:** Análise factual e resposta a perguntas
- **Capacidade:** Lê o conteúdo do editor e responde perguntas sobre o texto

**Implementação:**
- API: `/app/api/chat/route.ts`
- Frontend: `/app/editor/[[...id]]/page.tsx`
- Os agentes recebem o campo `textContent` com o conteúdo atual do texto

---

## 🎯 Boas Práticas

### Padronização Visual
- Manter consistência entre páginas Projetos e Catálogo
- Usar componentes compartilhados sempre que possível
- Seguir o design system estabelecido (cores, espaçamentos, tipografia)

### Nomenclatura
- Usar termos simplificados para referência rápida
- Documentar convenções neste arquivo
- Manter nomes técnicos nos componentes, mas usar nomes amigáveis na comunicação

---

**Última atualização:** 03/12/2025  
**Mantido por:** Equipe de desenvolvimento Blake Vision
