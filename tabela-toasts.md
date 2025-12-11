# Tabela Completa de Toasts - Blake Vision

**Total de Toasts Encontrados:** 228 ocorrências em 16 arquivos

---

## 📊 Resumo por Tipo

| Tipo | Quantidade | Porcentagem |
|------|------------|-------------|
| `toast.error` | 146 | 64% |
| `toast.success` | 74 | 32% |
| `toast.info` | 2 | 1% |
| `toast.warning` | 1 | 0.4% |
| `toast.loading` | 0 | 0% |

---

## 📄 Toasts por Página/Componente

### 1. **Página Principal** (`/app/page.tsx`) - 34 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Erro ao carregar universos" | Erro genérico ao carregar |
| ❌ Error | "Erro de rede" | Erro de conexão |
| ❌ Error | "Erro ao carregar ficha" | Erro ao buscar ficha |
| ✅ Success | "Universo criado com sucesso" | Criar universo |
| ✅ Success | "Universo atualizado com sucesso" | Atualizar universo |
| ❌ Error | "Erro ao criar/atualizar universo" | Falha na operação |
| ❌ Error | "Resposta incorreta. Tente novamente." | Captcha errado |
| ✅ Success | "Universo deletado com sucesso" | Deletar universo |
| ❌ Error | "Erro ao deletar universo" | Falha ao deletar |
| ❌ Error | "Erro: usuário não autenticado" | Sem autenticação |
| ❌ Error | "Erro ao criar nova conversa" | Falha em conversa |
| ✅ Success | "Resposta copiada para a área de transferência" | Copiar resposta |
| ❌ Error | "Erro ao copiar resposta" | Falha ao copiar |
| ❌ Error | "Seu navegador não suporta leitura de texto" | TTS não disponível |
| ✅ Success | "Texto enviado para o Editor!" | Enviar para editor |
| ❌ Error | "Erro ao enviar para o Editor" | Falha ao enviar |
| ✅ Success | "Histórico limpo com sucesso" | Limpar chat |
| ✅ Success | "Conversa exportada com sucesso" | Exportar conversa |
| ❌ Error | "Erro ao enviar mensagem" | Falha no chat |
| ❌ Error | "Erro ao deletar conversa" | Falha ao deletar |
| ✅ Success | "Conversa deletada com sucesso" | Deletar conversa |

---

### 2. **Biblioteca** (`/app/biblioteca/page.tsx`) - 8 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Erro ao carregar biblioteca" | Erro ao carregar textos |
| ✅ Success | "Texto deletado com sucesso" | Deletar texto |
| ❌ Error | "Erro ao deletar texto" | Falha ao deletar |
| ✅ Success | "Texto movido para rascunhos" | Mover para editor |
| ❌ Error | "Erro ao editar texto" | Falha ao editar |

---

### 3. **Catálogo** (`/app/catalog/page.tsx`) - 42 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Erro ao carregar catálogo" | Erro genérico |
| ❌ Error | "Erro de rede" | Erro de conexão |
| ❌ Error | "Dê um nome ao universo." | Validação |
| ❌ Error | "Usuário não autenticado." | Sem autenticação |
| ✅ Success | "Universo atualizado com sucesso." | Atualizar universo |
| ✅ Success | "Novo Universo criado com sucesso." | Criar universo |
| ❌ Error | "Erro ao atualizar/criar universo." | Falha na operação |
| ✅ Success | "Universo deletado com sucesso." | Deletar universo |
| ❌ Error | "Erro ao deletar universo." | Falha ao deletar |
| ✅ Success | "Ficha criada/atualizada com sucesso" | Salvar ficha |
| ❌ Error | "Erro ao salvar ficha" | Falha ao salvar |
| ✅ Success | "Ficha deletada com sucesso" | Deletar ficha |
| ❌ Error | "Erro ao deletar ficha" | Falha ao deletar |
| ✅ Success | "Mundo criado/atualizado com sucesso" | Salvar mundo |
| ❌ Error | "Erro ao salvar mundo" | Falha ao salvar |
| ✅ Success | "Mundo deletado com sucesso" | Deletar mundo |
| ❌ Error | "Erro ao deletar mundo" | Falha ao deletar |
| ✅ Success | "Ordem salva com sucesso!" | Salvar ordem customizada |
| ❌ Error | "Erro ao salvar ordem." | Falha ao salvar ordem |
| ✅ Success | "Ordem resetada com sucesso!" | Resetar ordem |
| ❌ Error | "Erro ao resetar ordem." | Falha ao resetar |
| ✅ Success | "Categoria criada/atualizada com sucesso" | Salvar categoria |
| ❌ Error | "Erro ao salvar categoria" | Falha ao salvar |
| ✅ Success | "Categoria deletada com sucesso" | Deletar categoria |
| ❌ Error | "Erro ao deletar categoria" | Falha ao deletar |
| ✅ Success | "X fichas exportadas" | Exportar fichas |
| ✅ Success | "X fichas apagadas" | Deletar múltiplas fichas |

---

### 4. **Modal de Categoria** (`/app/components/catalog/CategoryModal.tsx`) - 7 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Digite um nome para a categoria primeiro" | Validação |
| ✅ Success | "Descrição gerada com IA!" | IA gerou descrição |
| ❌ Error | "Erro ao gerar descrição" | Falha na IA |
| ❌ Error | "Slug é obrigatório" | Validação |
| ❌ Error | "Nome é obrigatório" | Validação |

---

### 5. **Modal de Ficha** (`/app/components/catalog/FichaModal.tsx`) - 8 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Selecione um mundo" | Validação |
| ❌ Error | "Selecione um tipo" | Validação |
| ❌ Error | "Digite um título" | Validação |
| ✅ Success | "Imagem enviada com sucesso!" | Upload de imagem |
| ❌ Error | "Erro ao enviar imagem" | Falha no upload |
| ✅ Success | "Ficha excluída com sucesso!" | Deletar ficha |
| ❌ Error | "Erro ao excluir ficha" | Falha ao deletar |

---

### 6. **Aba de Relações** (`/app/components/catalog/RelationsTab.tsx`) - 8 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Selecione uma ficha e um tipo de relação" | Validação |
| ✅ Success | "Relação criada com sucesso!" | Criar relação |
| ❌ Error | "Erro ao criar relação" | Falha ao criar |
| ✅ Success | "Relação removida com sucesso!" | Remover relação |
| ❌ Error | "Erro ao remover relação" | Falha ao remover |

---

### 7. **Modal de Conceito/Regra** (`/app/components/projetos/ConceptRuleModal.tsx`) - 4 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Selecione um universo" | Validação |
| ❌ Error | "Título é obrigatório" | Validação |
| ❌ Error | "Descrição é obrigatória" | Validação |

---

### 8. **Modal de Episódio** (`/app/components/projetos/EpisodeModal.tsx`) - 12 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Selecione um universo" | Validação |
| ❌ Error | "Selecione um mundo" | Validação |
| ❌ Error | "Este mundo não permite episódios. Edite o mundo para habilitar." | Validação |
| ❌ Error | "Número do episódio é obrigatório" | Validação |
| ❌ Error | "Número do episódio deve ser um número válido maior que zero" | Validação |
| ❌ Error | "Título é obrigatório" | Validação |
| ❌ Error | "Logline é obrigatória" | Validação |
| ❌ Error | "Sinopse é obrigatória" | Validação |
| ❌ Error | "Já existe um episódio X neste mundo" | Validação de duplicata |
| ❌ Error | "Erro ao verificar episódios duplicados" | Falha na verificação |

---

### 9. **Modal de Mundo** (`/app/components/projetos/WorldModal.tsx`) - 1 toast

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Nome do mundo é obrigatório" | Validação |

---

### 10. **Editor** (`/app/editor/[[...id]]/page.tsx`) - 20 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Texto não encontrado" | Erro ao carregar |
| ❌ Error | "Erro ao carregar texto" | Falha ao carregar |
| ❌ Error | "Título e conteúdo são obrigatórios" | Validação |
| ✅ Success | "Texto salvo com sucesso" | Salvar texto |
| ❌ Error | "Erro ao salvar texto" | Falha ao salvar |
| ❌ Error | "Erro ao publicar texto" | Falha ao publicar |
| ✅ Success | "Texto publicado com sucesso!" | Publicar texto |
| ❌ Error | "Salve o texto antes de enviar para upload" | Validação |
| ❌ Error | "Seu navegador não suporta leitura de texto" | TTS não disponível |
| ❌ Error | "Erro ao conversar com assistente" | Falha no chat IA |
| ❌ Error | "Erro ao ler resposta do assistente" | Falha no streaming |
| ✅ Success | "Texto atualizado por Urthona!" | IA atualizou texto |
| ℹ️ Info | "Funcionalidade de criar categoria será implementada em breve" | Recurso futuro |
| ✅ Success | "Episódio 'X' criado com sucesso!" | Criar episódio |

---

### 11. **Escrita** (`/app/escrita/page.tsx`) - 58 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Erro ao carregar texto" | Falha ao carregar |
| ❌ Error | "Nenhum texto selecionado para duplicar" | Validação |
| ✅ Success | "Texto duplicado com sucesso!" | Duplicar texto |
| ❌ Error | "Erro ao duplicar texto" | Falha ao duplicar |
| ❌ Error | "Texto vazio não pode ser exportado" | Validação |
| ✅ Success | "Texto exportado como TXT!" | Exportar TXT |
| ✅ Success | "Texto exportado como PDF/DOCX!" | Exportar PDF/DOCX |
| ❌ Error | "Erro ao exportar como PDF/DOCX" | Falha ao exportar |
| ❌ Error | "Nenhum texto selecionado para excluir" | Validação |
| ❌ Error | "Ficha não encontrada" | Erro ao buscar ficha |
| ❌ Error | "Erro ao carregar ficha" | Falha ao carregar |
| ❌ Error | "Erro ao deletar texto" | Falha ao deletar |
| ✅ Success | "Título atualizado!" | Atualizar título |
| ❌ Error | "Erro ao atualizar título" | Falha ao atualizar |
| ❌ Error | "Por favor, adicione um título" | Validação |
| ✅ Success | "Texto atualizado!" | Salvar texto (auto-save) |
| ✅ Success | "Texto criado!" | Criar texto |
| ❌ Error | "Erro ao salvar texto" | Falha ao salvar |
| ✅ Success | "Texto publicado!" | Publicar texto |
| ❌ Error | "Nome do universo é obrigatório" | Validação |
| ✅ Success | "Universo criado!" | Criar universo |
| ❌ Error | "Erro ao criar universo" | Falha ao criar |
| ✅ Success | "Universo atualizado!" | Atualizar universo |
| ❌ Error | "Erro ao atualizar universo" | Falha ao atualizar |
| ❌ Error | "Resposta incorreta. Tente novamente." | Captcha errado |
| ✅ Success | "Universo deletado!" | Deletar universo |
| ❌ Error | "Erro ao deletar universo" | Falha ao deletar |
| ❌ Error | "Selecione um universo primeiro" | Validação |
| ✅ Success | "Mundo criado!" | Criar mundo |
| ❌ Error | "Erro ao criar mundo" | Falha ao criar |
| ❌ Error | "Por favor, insira um número válido" | Validação |
| ❌ Error | "Episódio X já existe na lista" | Validação de duplicata |
| ✅ Success | "Episódio X criado!" | Criar episódio |
| ❌ Error | "Erro ao criar episódio" | Falha ao criar |
| ✅ Success | "Categoria criada!" | Criar categoria |
| ❌ Error | "Erro ao criar categoria" | Falha ao criar |

---

### 12. **Login** (`/app/login/page.tsx`) - 4 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Erro ao fazer login" | Falha no login |
| ✅ Success | "Bem-vindo de volta, [email]" | Login bem-sucedido |
| ℹ️ Info | "Funcionalidade em desenvolvimento. Em breve você poderá criar sua conta!" | Recurso futuro |

---

### 13. **Perfil** (`/app/profile/page.tsx`) - 10 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Erro ao carregar dados do usuário" | Falha ao carregar |
| ❌ Error | "Erro ao atualizar perfil" | Falha ao atualizar |
| ✅ Success | "Perfil atualizado com sucesso" | Atualizar perfil |
| ❌ Error | "As senhas não coincidem" | Validação |
| ❌ Error | "A senha deve ter no mínimo 6 caracteres" | Validação |
| ❌ Error | "Erro ao alterar senha" | Falha ao alterar |
| ✅ Success | "Senha alterada com sucesso" | Alterar senha |

---

### 14. **Projetos** (`/app/projetos/page.tsx`) - 14 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Selecione um universo antes de criar" | Validação |
| ✅ Success | "Episódio/Conceito/Regra criado/atualizado" | Salvar ficha |
| ❌ Error | "Erro ao salvar" | Falha ao salvar |
| ❌ Error | "Erro de rede ao salvar" | Erro de conexão |
| ✅ Success | "Item deletado" | Deletar ficha |
| ❌ Error | "Erro ao deletar" | Falha ao deletar |
| ❌ Error | "Erro de rede ao deletar" | Erro de conexão |
| ❌ Error | "Selecione um universo antes de criar um mundo" | Validação |
| ✅ Success | "Mundo criado/atualizado" | Salvar mundo |
| ❌ Error | "Erro ao salvar mundo" | Falha ao salvar |
| ❌ Error | "Erro de rede ao salvar mundo" | Erro de conexão |
| ✅ Success | "Mundo deletado" | Deletar mundo |
| ❌ Error | "Erro ao deletar mundo" | Falha ao deletar |
| ❌ Error | "Erro de rede ao deletar mundo" | Erro de conexão |

---

### 15. **Timeline** (`/app/timeline/page.tsx`) - 11 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Dê um nome ao novo Universo." | Validação |
| ✅ Success | "Novo Universo criado com sucesso." | Criar universo |
| ❌ Error | "Erro ao criar Universo." | Falha ao criar |
| ✅ Success | "Ficha criada/atualizada com sucesso" | Salvar ficha |
| ❌ Error | "Erro ao salvar ficha" | Falha ao salvar |
| ❌ Error | "Erro de rede" | Erro de conexão |
| ✅ Success | "Ficha deletada com sucesso" | Deletar ficha |
| ❌ Error | "Erro ao deletar ficha" | Falha ao deletar |

---

### 16. **Upload** (`/app/upload/page.tsx`) - 29 toasts

| Tipo | Mensagem | Contexto |
|------|----------|----------|
| ❌ Error | "Erro ao carregar catálogo" | Falha ao carregar |
| ❌ Error | "Erro de rede" | Erro de conexão |
| ✅ Success | "Arquivo lido com sucesso!" | Upload de arquivo |
| ❌ Error | "Erro ao processar arquivo." | Falha no upload |
| ❌ Error | "Dê um nome ao novo Universo." | Validação |
| ❌ Error | "Usuário não autenticado." | Sem autenticação |
| ✅ Success | "Novo Universo criado com sucesso." | Criar universo |
| ❌ Error | "Erro ao criar Universo." | Falha ao criar |
| ❌ Error | "Dê um nome ao novo Mundo." | Validação |
| ❌ Error | "Selecione um Universo primeiro." | Validação |
| ❌ Error | "Erro ao criar novo Mundo." | Falha ao criar |
| ✅ Success | "Novo Mundo criado com sucesso." | Criar mundo |
| ❌ Error | "Erro inesperado ao criar Mundo." | Falha inesperada |
| ❌ Error | "Usuário não autenticado." | Sem autenticação |
| ❌ Error | "Selecione um Universo antes de extrair fichas." | Validação |
| ❌ Error | "Selecione um Mundo antes de extrair fichas." | Validação |
| ❌ Error | "Informe o número do episódio/capítulo." | Validação |
| ❌ Error | "Cole um texto ou faça upload de um arquivo para extrair fichas." | Validação |
| ❌ Error | "Selecione pelo menos uma categoria para extrair." | Validação |
| ✅ Success | "X fichas extraídas com sucesso!" | Extração de fichas |
| ⚠️ Warning | "Nenhuma ficha foi extraída." | Nenhum resultado |
| ❌ Error | "Erro ao processar extração." | Falha na extração |
| ❌ Error | "Nenhuma ficha para salvar." | Validação |
| ✅ Success | "X fichas salvas com sucesso!" | Salvar fichas |
| ❌ Error | "Erro ao salvar fichas." | Falha ao salvar |

---

## 📈 Análise de Padrões

### Mensagens Mais Comuns

1. **"Erro ao salvar"** - Aparece em múltiplas páginas
2. **"Erro de rede"** - Usado para erros de conexão
3. **"[Item] criado/atualizado com sucesso"** - Padrão de sucesso
4. **"Erro ao deletar"** - Padrão de erro em deleções
5. **"[Campo] é obrigatório"** - Padrão de validação

### Páginas com Mais Toasts

1. **Escrita** (`/app/escrita/page.tsx`) - 58 toasts
2. **Catálogo** (`/app/catalog/page.tsx`) - 42 toasts
3. **Página Principal** (`/app/page.tsx`) - 34 toasts
4. **Upload** (`/app/upload/page.tsx`) - 29 toasts
5. **Editor** (`/app/editor/[[...id]]/page.tsx`) - 20 toasts

---

## 🎨 Tipos de Toast Usados

### ✅ Success (74 ocorrências)
Usado para operações bem-sucedidas como:
- Criar, atualizar, deletar itens
- Salvar dados
- Exportar arquivos
- Copiar para clipboard

### ❌ Error (146 ocorrências)
Usado para:
- Erros de validação
- Erros de rede
- Falhas em operações
- Autenticação inválida

### ℹ️ Info (2 ocorrências)
Usado para:
- Funcionalidades em desenvolvimento
- Informações gerais

### ⚠️ Warning (1 ocorrência)
Usado para:
- Nenhuma ficha extraída (resultado vazio mas não erro)

---

## 💡 Recomendações

1. **Padronizar mensagens** - Algumas mensagens são inconsistentes
2. **Usar i18n** - Algumas páginas usam `t.errors.generic`, outras não
3. **Adicionar toast.loading** - Para operações longas (upload, IA, etc.)
4. **Reduzir duplicação** - Muitas mensagens são idênticas em páginas diferentes
5. **Melhorar descrições** - Alguns toasts poderiam ter mais contexto

---

**Tabela gerada em:** 11 de dezembro de 2024  
**Total de arquivos analisados:** 16  
**Total de toasts encontrados:** 228
