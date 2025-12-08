# Focus Mode - Refatoração Completa

## Data: 2024-12-07

## Problema Identificado

### Sintomas
- Browser trava ao clicar nos botões "Sentença" ou "Parágrafo"
- Timeout após ~180 segundos
- CSS funciona quando aplicado manualmente via console

### Causa Raiz
Código atual tem múltiplas camadas conflitantes:

1. **Função `applyFocusEffect()`** (linhas 163-207)
2. **useEffect com `updateFocus()`** (linhas 213-300)
3. **MutationObserver** que monitora mudanças no DOM
4. **Listener `selectionchange`** global
5. **Botões** que chamam tanto `setFocusType()` quanto `applyFocusEffect()`

Quando o botão é clicado:
- `setFocusType()` → dispara useEffect → `updateFocus()`
- `setTimeout(() => applyFocusEffect())` → modifica DOM
- `MutationObserver` detecta mudança → `updateFocus()` novamente
- Possível loop infinito ou sobrecarga de eventos

## Solução Proposta

### Abordagem: Simplicidade e Robustez

**Princípios:**
1. Uma única fonte de verdade para aplicar focus
2. Sem MutationObserver (causa loops)
3. Listener `selectionchange` apenas quando necessário
4. Botões apenas mudam estado, não manipulam DOM diretamente

**Arquitetura:**
```
Botão Click → setFocusType() → useEffect → applyFocus() → DOM
                                              ↓
                                    selectionchange listener (se ativo)
```

### Implementação

#### 1. Remover código duplicado
- Manter apenas uma função `applyFocus()`
- Remover `applyFocusEffect()` duplicada
- Remover `MutationObserver`

#### 2. useEffect simplificado
```typescript
useEffect(() => {
  if (focusType === 'off') {
    clearAllFocusClasses();
    return;
  }
  
  applyFocus();
  
  const handleSelectionChange = () => {
    applyFocus();
  };
  
  document.addEventListener('selectionchange', handleSelectionChange);
  
  return () => {
    document.removeEventListener('selectionchange', handleSelectionChange);
  };
}, [focusType]);
```

#### 3. Botões simplificados
```typescript
onClick={() => {
  setFocusType(prev => prev === 'sentence' ? 'off' : 'sentence');
}}
```

## Etapas de Implementação

- [ ] Fase 1: Backup do código atual
- [ ] Fase 2: Remover código duplicado e problemático
- [ ] Fase 3: Implementar nova versão simplificada
- [ ] Fase 4: Testar localmente
- [ ] Fase 5: Deploy e teste em produção
- [ ] Fase 6: Validação final

## Testes Necessários

1. ✅ Build local compila sem erros
2. ✅ Clicar em "Sentença" não trava o browser
3. ✅ Clicar em "Parágrafo" não trava o browser
4. ✅ Focus é aplicado corretamente no parágrafo/sentença atual
5. ✅ Focus atualiza quando cursor se move
6. ✅ Desativar focus remove todas as classes
7. ✅ Funciona com textos longos (múltiplos parágrafos)
8. ✅ Funciona em produção (Vercel)

## Notas Técnicas

### CSS Classes
- `.focus-active`: opacity 1, elemento destacado
- `.focus-dimmed`: opacity 0.3-0.4, elementos esmaecidos

### Estados React
- `focusType`: 'off' | 'sentence' | 'paragraph'
- `isFocusMode`: boolean (para fullscreen)

### Seletor DOM
- `.ProseMirror` - container do Tiptap
- `p` - parágrafos do texto
