# 🗺️ Roadmap - Blake Vision

Este documento lista funcionalidades planejadas e melhorias futuras para o Blake Vision.

---

## 📋 Versão Atual: 0.0.1

### ✅ Implementado

- [x] Design system completo (Tailwind + variáveis CSS)
- [x] Componentes reutilizáveis (Button, Input, Modal, etc.)
- [x] Sistema de temas (claro/escuro)
- [x] Internacionalização (pt-BR + en-US)
- [x] Autenticação com Supabase
- [x] Página de login
- [x] Página de perfil
- [x] Página de chat com IA (Urizen e Urthona)
- [x] Página de catálogo (listagem de fichas)
- [x] Página de timeline
- [x] Página de upload
- [x] Página de FAQ
- [x] API routes completas
- [x] RAG com busca vetorial
- [x] Gerenciamento de universos

### ⚠️ Parcialmente Implementado

Estas funcionalidades têm a estrutura base mas precisam ser expandidas:

- [ ] **Modal de Ficha Completo**
  - Estrutura criada
  - Falta: Tabs, upload de imagens, autocomplete, relações
  
- [ ] **Extração de Lore**
  - Interface de upload criada
  - Falta: Processamento de documentos, extração com IA

- [ ] **Gerenciamento de Mundos**
  - API criada
  - Falta: Modal de criação/edição

- [ ] **Gerenciamento de Categorias**
  - API criada
  - Falta: Interface de gerenciamento

---

## 🎯 Versão 0.1.0 (Próxima Release)

### **Prioridade Alta**

1. **Modal de Ficha Completo**
   - [ ] Tab "Básico" (título, tipo, resumo, conteúdo)
   - [ ] Tab "Datas" (ano diegético, datas de início/fim)
   - [ ] Tab "Relações" (adicionar/remover relações com outras fichas)
   - [ ] Tab "Imagens" (upload de capa e álbum)
   - [ ] Autocomplete de menções (digitar @ para citar fichas)
   - [ ] Validações e feedback visual

2. **Extração Automática de Lore**
   - [ ] Upload de PDF para Supabase Storage
   - [ ] Extração de texto de PDF (pdf-parse)
   - [ ] Extração de texto de DOCX (mammoth)
   - [ ] Prompt para OpenAI extrair entidades
   - [ ] Interface de revisão antes de salvar
   - [ ] Criação em lote de fichas

3. **Gerenciamento de Mundos**
   - [ ] Modal de criação de mundo
   - [ ] Modal de edição de mundo
   - [ ] Checkbox "Tem episódios"
   - [ ] Campo "Ordem" para organização
   - [ ] Exclusão com confirmação

4. **Gerenciamento de Categorias**
   - [ ] Modal de criação de categoria
   - [ ] Modal de edição de categoria
   - [ ] Campo "Prefixo" para códigos
   - [ ] Campo "Descrição" para guiar extração
   - [ ] Botão "Gerar descrição com IA"
   - [ ] Exclusão com confirmação

### **Prioridade Média**

5. **Sistema de Relações**
   - [ ] Interface para adicionar relações
   - [ ] Tipos de relações pré-definidos
   - [ ] Relações bidirecionais automáticas
   - [ ] Visualização de relações na ficha

6. **Upload de Imagens**
   - [ ] Drag & drop de imagens
   - [ ] Preview antes de upload
   - [ ] Crop/resize de imagens
   - [ ] Álbum de múltiplas imagens
   - [ ] Lightbox para visualização

7. **Busca Avançada**
   - [ ] Busca full-text
   - [ ] Filtros combinados
   - [ ] Busca por tags
   - [ ] Busca por relações
   - [ ] Histórico de buscas

### **Prioridade Baixa**

8. **Melhorias de UX**
   - [ ] Atalhos de teclado (Ctrl+K para busca, etc.)
   - [ ] Breadcrumbs de navegação
   - [ ] Indicadores de progresso
   - [ ] Animações de transição
   - [ ] Tooltips informativos

9. **Acessibilidade**
   - [ ] Atributos ARIA completos
   - [ ] Navegação por teclado
   - [ ] Contraste de cores (WCAG AA)
   - [ ] Screen reader support
   - [ ] Focus visible em todos os elementos

---

## 🚀 Versão 0.2.0 (Futuro)

### **Recursos Avançados**

1. **Gráfico de Relações**
   - [ ] Visualização em rede (network graph)
   - [ ] Filtros por tipo de relação
   - [ ] Zoom e pan
   - [ ] Clique para abrir ficha

2. **Exportação de Dados**
   - [ ] Exportar universo completo (JSON)
   - [ ] Exportar fichas selecionadas (Markdown)
   - [ ] Exportar timeline (PDF)
   - [ ] Exportar gráfico de relações (PNG)

3. **Versionamento**
   - [ ] Histórico de alterações de fichas
   - [ ] Comparação entre versões
   - [ ] Restaurar versão anterior
   - [ ] Comentários em alterações

4. **Colaboração**
   - [ ] Compartilhar universo com outros usuários
   - [ ] Permissões (leitura, escrita, admin)
   - [ ] Comentários em fichas
   - [ ] Notificações de alterações

5. **Integração com IA**
   - [ ] Geração de imagens com DALL-E
   - [ ] Geração de áudio (narração)
   - [ ] Sugestões automáticas de relações
   - [ ] Detecção de inconsistências

---

## 🎨 Versão 0.3.0 (Visão de Longo Prazo)

### **Funcionalidades Premium**

1. **Editor de Texto Rico**
   - [ ] Markdown avançado
   - [ ] Formatação visual
   - [ ] Inserção de imagens inline
   - [ ] Tabelas e listas
   - [ ] Blocos de código

2. **Templates**
   - [ ] Templates de fichas por categoria
   - [ ] Templates de universos (fantasia, sci-fi, etc.)
   - [ ] Importar/exportar templates
   - [ ] Marketplace de templates

3. **Análise de Dados**
   - [ ] Dashboard de estatísticas
   - [ ] Gráficos de crescimento
   - [ ] Análise de complexidade
   - [ ] Sugestões de expansão

4. **Mobile App**
   - [ ] App nativo iOS
   - [ ] App nativo Android
   - [ ] Sincronização offline
   - [ ] Notificações push

5. **API Pública**
   - [ ] Documentação completa
   - [ ] Rate limiting
   - [ ] Webhooks
   - [ ] SDKs (Python, JavaScript)

---

## 🐛 Bugs Conhecidos

### **Alta Prioridade**

- [ ] Nenhum bug crítico identificado

### **Média Prioridade**

- [ ] Modal de ficha não salva dados (não implementado)
- [ ] Upload não processa documentos (não implementado)

### **Baixa Prioridade**

- [ ] Responsividade em telas pequenas precisa ajustes
- [ ] Alguns textos não traduzidos
- [ ] Loading states faltando em algumas ações

---

## 💡 Ideias para Explorar

Funcionalidades que ainda estão em discussão:

- **Modo Offline:** Trabalhar sem internet e sincronizar depois
- **Integração com Notion:** Importar/exportar de Notion
- **Integração com Obsidian:** Sincronizar com vault do Obsidian
- **Geração de Mapas:** Criar mapas visuais de locais
- **Árvore Genealógica:** Visualização de famílias
- **Calendário Diegético:** Sistema de datas customizado
- **Geração de Roteiros:** Criar roteiros formatados
- **Text-to-Speech:** Narração automática de fichas
- **Modo Apresentação:** Apresentar universo como slides

---

## 📊 Métricas de Sucesso

Como medir o sucesso de cada versão:

### **v0.1.0**
- [ ] Modal de ficha 100% funcional
- [ ] Extração de lore funcionando
- [ ] 90% dos usuários criam pelo menos 10 fichas

### **v0.2.0**
- [ ] Gráfico de relações usado por 70% dos usuários
- [ ] Exportação usada por 50% dos usuários
- [ ] Tempo médio de sessão aumenta 30%

### **v0.3.0**
- [ ] 1000+ usuários ativos
- [ ] 100+ universos criados
- [ ] 10.000+ fichas no sistema

---

## 🤝 Como Contribuir

Quer sugerir uma funcionalidade? Entre em contato: [help.manus.im](https://help.manus.im)

---

**Última atualização:** Dezembro 2024
