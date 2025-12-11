# Relatório de Usabilidade Mobile - Blake Vision

**Plataforma:** Blake Vision (blake.vision/escrita)  
**Foco:** Botões de formatação B, I e Aa  
**Data:** 10 de dezembro de 2025  
**Ambiente:** Mobile (360x740px)

---

## Sumário Executivo

Este relatório documenta a análise de usabilidade dos botões de formatação de texto (B, I, Aa) na versão mobile da plataforma Blake Vision, identificação do problema crítico de acessibilidade e implementação da solução definitiva.

O problema identificado impactava diretamente a experiência do usuário ao editar textos longos, forçando interrupções constantes no fluxo de trabalho. A solução implementada restaura a acessibilidade contínua às ferramentas de formatação, alinhando a plataforma com as melhores práticas de editores mobile modernos.

---

## Problema Identificado

### Descrição do Comportamento

Durante a edição de textos no modo mobile, os botões de formatação (B para negrito, I para itálico e Aa para tamanho de fonte) desapareciam da tela quando o usuário rolava o conteúdo para baixo. Este comportamento obrigava o usuário a interromper o fluxo de edição e rolar de volta ao topo da página sempre que precisasse aplicar formatação ao texto.

### Impacto na Experiência do Usuário

O problema gerava os seguintes impactos negativos:

**Interrupção do fluxo de trabalho:** Editores de texto longos precisavam constantemente alternar entre rolar para ler/editar e rolar de volta ao topo para formatar, criando uma experiência fragmentada e frustrante.

**Perda de contexto:** Ao rolar de volta ao topo, o usuário perdia a referência visual do trecho que estava editando, necessitando reorientar-se no documento após cada formatação.

**Redução de produtividade:** O tempo adicional gasto em navegação vertical repetitiva acumulava-se significativamente em sessões de edição mais longas.

**Inconsistência com padrões modernos:** Editores mobile contemporâneos (Google Docs, Notion, Medium) mantêm ferramentas de formatação sempre acessíveis, criando uma expectativa de usabilidade que não estava sendo atendida.

---

## Análise Técnica

### Investigação da Causa Raiz

A investigação técnica revelou que a barra de formatação estava implementada com `position: sticky`, uma propriedade CSS que deveria manter o elemento fixo durante o scroll. No entanto, a análise do código e inspeção via console do navegador identificou a causa raiz do problema.

O elemento `<main>` que contém a barra de formatação possui a classe `overflow-hidden`, o que impede o funcionamento correto de `position: sticky`. Esta propriedade CSS só funciona quando o container pai não tem restrições de overflow, pois o sticky precisa "flutuar" dentro do contexto de scroll do parent.

**Estrutura problemática identificada:**

```tsx
<main className="flex-1 flex flex-col overflow-hidden">
  <div className="md:hidden sticky top-16 z-30 ...">
    {/* Botões B, I, Aa */}
  </div>
</main>
```

**Verificação via console:**

```javascript
{
  "parentTag": "MAIN",
  "parentClass": "flex-1 flex flex-col overflow-hidden",
  "overflow": "hidden",
  "overflowY": "hidden",
  "display": "flex",
  "position": "static"
}
```

### Tentativa Inicial e Aprendizado

A primeira tentativa de correção manteve o `position: sticky`, assumindo que o problema poderia ser de z-index ou posicionamento. Esta abordagem foi testada em produção, mas não resolveu o problema, confirmando que a causa raiz era realmente o `overflow: hidden` do container pai.

---

## Solução Implementada

### Abordagem Técnica

A solução definitiva substituiu `position: sticky` por `position: fixed`, que não é afetado pelas propriedades de overflow do elemento pai. Esta mudança garante que a barra de formatação permaneça fixa na tela independentemente do scroll ou das propriedades CSS dos containers ancestrais.

**Código implementado:**

```tsx
<div className="md:hidden fixed top-16 left-0 right-0 z-30 flex justify-center py-2 px-4 border-b border-light-border dark:border-dark-border bg-light-base dark:bg-dark-base">
  <div className="flex gap-2">
    <button onClick={() => editorRef.current?.chain().toggleBold().run()}>
      B
    </button>
    <button onClick={() => editorRef.current?.chain().toggleItalic().run()}>
      I
    </button>
    <button onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}>
      Aa
    </button>
  </div>
</div>
```

### Detalhamento das Mudanças

**`position: fixed`:** Garante que o elemento permaneça fixo em relação à viewport, não ao container pai, eliminando o problema do overflow.

**`top-16`:** Posiciona a barra 64px abaixo do topo da tela, logo abaixo do header principal que tem altura de 64px (h-16).

**`left-0 right-0`:** Garante que a barra ocupe toda a largura da tela, mantendo consistência visual com o header.

**`z-30`:** Define a camada de sobreposição, ficando acima do conteúdo (z-index padrão) mas abaixo do header (z-40), mantendo a hierarquia visual correta.

**`md:hidden`:** Mantém a correção exclusiva para mobile, não afetando o layout desktop onde os botões estão em posição diferente.

**`bg-light-base dark:bg-dark-base`:** Fornece fundo sólido que cobre o conteúdo ao rolar, evitando sobreposição visual confusa.

---

## Validação e Testes

### Metodologia de Teste

Os testes foram realizados em ambiente mobile simulado (360x740px) no navegador Chromium, replicando as condições reais de uso em dispositivos móveis. O documento de teste "A Noite do Cão Misterioso (Cópia)" foi utilizado por ter conteúdo extenso suficiente para testar o comportamento em diferentes posições de scroll.

### Cenários Testados

**Teste de persistência visual:** Verificação da visibilidade dos botões em cinco posições diferentes de scroll: topo da página (0px), meio superior (699px), meio inferior (1398px), final da página (6219px) e retorno ao topo. Em todos os cenários, os botões B, I e Aa permaneceram visíveis e acessíveis.

**Teste de funcionalidade:** Validação da capacidade de clicar nos botões e aplicar formatação em diferentes posições de scroll. Todos os botões responderam corretamente aos cliques, e o editor manteve o foco adequadamente após as interações.

**Teste de layout responsivo:** Confirmação de que a barra ocupa corretamente toda a largura da tela e mantém alinhamento visual com o header, sem quebras ou sobreposições indesejadas.

**Teste de hierarquia visual:** Verificação de que a barra permanece abaixo do header (z-index correto) e acima do conteúdo, mantendo a ordem visual apropriada durante todo o scroll.

### Resultados

Todos os testes foram concluídos com sucesso. A barra de formatação agora permanece fixa e acessível em qualquer posição de scroll, os botões respondem corretamente aos cliques, e não há impactos negativos no layout ou na experiência visual da plataforma.

---

## Impacto da Solução

### Benefícios Imediatos

**Acessibilidade contínua:** Usuários agora têm acesso imediato às ferramentas de formatação em qualquer ponto do documento, eliminando a necessidade de navegação vertical repetitiva.

**Fluxo de trabalho ininterrupto:** A edição de textos longos torna-se mais fluida e natural, sem interrupções para acessar ferramentas básicas de formatação.

**Alinhamento com padrões modernos:** A experiência agora está consistente com editores mobile contemporâneos, atendendo às expectativas dos usuários.

**Manutenção do contexto:** Usuários mantêm a referência visual do trecho que estão editando, sem perder o foco ao aplicar formatação.

### Considerações de Implementação

A solução foi implementada exclusivamente para a versão mobile através da classe `md:hidden`, garantindo que o layout desktop não seja afetado. Esta abordagem permite que cada versão da plataforma mantenha sua própria lógica de interface otimizada para o respectivo contexto de uso.

A mudança não introduz regressões ou efeitos colaterais, pois o `position: fixed` é uma solução mais robusta que o `sticky` neste contexto específico, funcionando independentemente das propriedades CSS dos elementos ancestrais.

---

## Conclusão

O problema de usabilidade identificado nos botões de formatação mobile foi completamente resolvido através da mudança de `position: sticky` para `position: fixed`. A solução foi validada através de testes extensivos e está em produção, proporcionando uma experiência de edição significativamente superior para usuários mobile da plataforma Blake Vision.

Esta correção representa um avanço importante na qualidade da interface mobile, eliminando uma fonte significativa de frustração no fluxo de trabalho de edição e alinhando a plataforma com as melhores práticas de usabilidade em editores de texto mobile modernos.

---

## Anexos Técnicos

### Commits Implementados

**Commit 4968fdd:** Primeira tentativa com sticky (não resolveu o problema)
```
Fix: Tornar barra B/I/Aa sticky no mobile

- Adiciona position sticky para manter botões visíveis
- Define z-index 30 para ficar acima do conteúdo
- Mantém apenas no mobile com md:hidden
```

**Commit 01f0f20:** Solução definitiva com fixed (resolveu completamente)
```
Fix: Mudar barra B/I/Aa de sticky para fixed

- sticky não funciona porque main tem overflow-hidden
- fixed garante que botões fiquem sempre visíveis
- Adiciona left-0 right-0 para largura total
```

### Arquivos Modificados

- `app/escrita/page.tsx` - Linha 1602: Alteração da classe da barra de formatação mobile

### Deploy

**Plataforma:** Vercel  
**Branch:** main  
**Status:** ✅ Deploy bem-sucedido  
**URL:** https://blake.vision/escrita  
**Tempo de deploy:** ~1 minuto
