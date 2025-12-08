# Focus Mode - Debug Report

## Data: 2024-12-07 19:29

## Descoberta Crítica

### Problema
**As classes CSS são removidas imediatamente após serem aplicadas!**

### Evidência
1. Apliquei manualmente via console:
   ```javascript
   paragraphs[0].classList.add('focus-active');
   paragraphs[1].classList.add('focus-dimmed');
   ```

2. Imediatamente após, verifiquei:
   ```javascript
   paragraphs[0].className // ""  (vazio!)
   paragraphs[1].className // ""  (vazio!)
   ```

### Causa Raiz Provável
O **Tiptap está re-renderizando o conteúdo** e removendo as classes que não fazem parte do schema/modelo do editor.

### Solução Necessária
Precisamos aplicar as classes de uma forma que o Tiptap não remova:

**Opção 1:** Usar `editor.view.dom.classList` no container, não nos parágrafos internos

**Opção 2:** Criar uma extensão Tiptap que adicione as classes como parte do schema

**Opção 3:** Aplicar estilos inline ou usar um wrapper externo ao editor

## Próximos Passos

1. Verificar se podemos aplicar classes no container `.ProseMirror` ao invés dos parágrafos
2. Se não funcionar, criar extensão Tiptap personalizada
3. Última opção: usar CSS puro com seletores baseados em estado (sem classes nos parágrafos)

## Arquitetura Proposta (Opção 3 - Mais Simples)

```css
/* Quando modo foco está ativo */
.focus-mode-sentence .ProseMirror p {
  opacity: 0.3;
  filter: blur(1px);
}

/* Parágrafo atual (usando :has ou JavaScript para marcar o container) */
.focus-mode-sentence .ProseMirror p:focus-within,
.focus-mode-sentence .ProseMirror p.current {
  opacity: 1;
  filter: none;
}
```

Aplicar classe no **container pai** do editor, não nos parágrafos internos.
