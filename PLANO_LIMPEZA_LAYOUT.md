# Plano de Limpeza do Layout - Página Escrita

## Objetivo
Resetar o layout da página Escrita para um estado limpo, mantendo TODAS as funcionalidades (efeitos, botões, handlers, lógica).

## Análise do Arquivo Atual

### Funcionalidades Existentes (MANTER ✅)
1. **Estados de Autenticação e Loading**
   - isLoading, isSaving
   
2. **Estados da Biblioteca (Sidebar)**
   - activeTab (rascunhos/publicados)
   - rascunhos, publicados (arrays de textos)
   - searchQuery, filterUniverseId, filterWorldId, filterCategorias
   
3. **Estados do Editor**
   - currentTextoId, titulo, conteudo
   - universeId, worldId, episodio, categoria, status
   - isMetadataLocked, isMetadataSaved, isHeaderExpanded
   - hasUnsavedMetadataChanges, savedMetadataSnapshot
   
4. **Estados de Dados**
   - universes, worlds, availableEpisodes, categories, allFichas
   
5. **Handlers e Funções**
   - loadTextos(), saveTexto(), deleteTexto()
   - handleTextoSelect(), handleNewTexto()
   - Todos os handlers de mudança de estado
   
6. **Efeitos (useEffect)**
   - Carregamento de dados
   - Detecção de alterações
   - Sincronização com URL

### Problemas de Layout (REMOVER ❌)
1. **Classes CSS quebradas**
   - grid-cols-[auto_1fr_auto] com gaps inconsistentes
   - Múltiplas tentativas de alinhamento
   - Classes de padding/margin conflitantes
   
2. **Estrutura JSX complexa**
   - Múltiplos níveis de aninhamento
   - Divs extras para alinhamento
   - Ternários aninhados quebrados

3. **Commits de tentativas**
   - 32dfd91, ded75b0, d52d8c1, 2e58c42, 217e7ae (grid 6x3)
   - a7d5ea5, 5874918, 30bc3f9, etc. (alinhamentos)

## Estratégia de Limpeza

### Fase 1: Backup (JÁ FEITO ✅)
- Arquivo atual está em `/home/ubuntu/upload/page.tsx`
- Versão compilando está em git commit 5818e3b

### Fase 2: Criar Layout Limpo
1. Manter TODOS os imports
2. Manter TODAS as interfaces e tipos
3. Manter TODOS os estados (useState)
4. Manter TODOS os useEffect
5. Manter TODOS os handlers e funções
6. **SIMPLIFICAR** o JSX return:
   - Remover grid complexo
   - Usar flex simples para sidebar + conteúdo
   - Usar classes básicas do Tailwind

### Fase 3: Estrutura JSX Simplificada
```
<div className="min-h-screen bg-light-base dark:bg-dark-base">
  <Header />
  <div className="flex h-[calc(100vh-4rem)]">
    {/* SIDEBAR - Biblioteca */}
    <aside className="w-[250px] bg-light-raised dark:bg-dark-raised">
      {/* Conteúdo da sidebar */}
    </aside>
    
    {/* MAIN - Editor */}
    <main className="flex-1 flex flex-col">
      {/* Conteúdo do editor */}
    </main>
  </div>
</div>
```

### Fase 4: Implementar Grid 6x3 Corretamente
Depois de ter o layout limpo funcionando, implementar o grid 6x3 de forma estruturada.

## Próximos Passos
1. Extrair o arquivo limpo
2. Testar compilação
3. Fazer commit
4. Fazer push para Vercel
5. Depois implementar grid 6x3 incrementalmente
