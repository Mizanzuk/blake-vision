# Análise da Extensão Focus do Tiptap

**Fonte:** https://tiptap.dev/docs/editor/extensions/functionality/focus

---

## 📋 **O QUE A EXTENSÃO FOCUS SUPORTA**

### **Configurações Disponíveis:**

#### 1. **className**
- **Descrição:** A classe CSS aplicada ao elemento focado
- **Default:** `'has-focus'`
- **Exemplo:**
```typescript
Focus.configure({
  className: 'focus',
})
```

#### 2. **mode**
- **Descrição:** Aplica a classe em diferentes níveis do DOM
- **Opções:**
  - `'all'` - Aplica em todos os elementos
  - `'shallowest'` - Aplica no elemento mais superficial
  - `'deepest'` - Aplica no elemento mais profundo (padrão)
- **Default:** `'all'`
- **Exemplo:**
```typescript
Focus.configure({
  mode: 'deepest',
})
```

---

## ❌ **O QUE A EXTENSÃO NÃO SUPORTA**

### **Modo Sentença**
- ❌ **NÃO há suporte nativo** para detectar sentenças
- A extensão apenas adiciona classe `.has-focus` ao **nó** (node) focado
- Não há lógica para detectar sentenças dentro de um parágrafo

### **Modo Máquina de Escrever (Typewriter)**
- ❌ **NÃO há suporte nativo** para scroll automático
- A extensão apenas gerencia classes CSS
- Não há lógica para centralizar o cursor na tela

---

## ✅ **O QUE ESTÁ FUNCIONANDO NO BLAKE VISION**

### **Modo Parágrafo**
- ✅ Usando `mode: 'deepest'`
- ✅ Adiciona classe `.has-focus` ao parágrafo ativo
- ✅ CSS aplica blur nos outros parágrafos
- ✅ **100% FUNCIONAL**

**Implementação atual:**
```typescript
Focus.configure({
  mode: 'deepest',
  className: 'has-focus',
})
```

```css
.focus-mode-active .tiptap-editor-content > * {
  opacity: 0.3;
  filter: blur(1px);
  transition: all 0.2s ease;
}

.focus-mode-active .has-focus {
  opacity: 1 !important;
  filter: none !important;
}
```

---

## 🚀 **COMO IMPLEMENTAR OS OUTROS MODOS**

### **Modo Sentença**

**Abordagem:** Plugin customizado

**Passos:**
1. Criar plugin que detecta sentenças usando regex
2. Calcular posição do cursor dentro do parágrafo
3. Identificar sentença que contém o cursor
4. Aplicar blur nos outros parágrafos (igual ao Modo Parágrafo)

**Nota:** Não é possível aplicar blur em sentenças individuais sem manipular o DOM do Tiptap, o que é complexo e arriscado.

**Alternativa simples:** Modo Sentença = Modo Parágrafo (já que a extensão Focus não suporta nível de sentença)

**Estimativa:** 4-6 horas (se quiser implementar detecção de sentença real)

---

### **Modo Máquina de Escrever**

**Abordagem:** CSS + JavaScript para scroll

**Passos:**
1. Adicionar CSS: `padding: 50vh 0;` no editor
2. Adicionar listener para `selectionUpdate`
3. Usar `scrollIntoView()` para centralizar cursor
4. Aplicar `behavior: 'smooth'` para transição suave

**Código:**
```typescript
useEffect(() => {
  if (!editor || !typewriterMode) return;

  const updateScroll = () => {
    const { selection } = editor.state;
    const coords = editor.view.coordsAtPos(selection.from);
    
    window.scrollTo({
      top: coords.top - window.innerHeight / 2,
      behavior: 'smooth'
    });
  };

  editor.on('selectionUpdate', updateScroll);
  editor.on('update', updateScroll);

  return () => {
    editor.off('selectionUpdate', updateScroll);
    editor.off('update', updateScroll);
  };
}, [editor, typewriterMode]);
```

**Estimativa:** 2-3 horas

---

## 📊 **RESUMO**

| Modo | Suporte Nativo | Status Blake Vision | Estimativa |
|------|----------------|---------------------|------------|
| **Parágrafo** | ✅ Sim (`mode: 'deepest'`) | ✅ **FUNCIONANDO** | - |
| **Sentença** | ❌ Não | ❌ Não implementado | 4-6h |
| **Máquina de Escrever** | ❌ Não | ❌ Não implementado | 2-3h |

---

## 💡 **RECOMENDAÇÃO**

### **Modo Sentença**
- **Opção A:** Não implementar (Modo Parágrafo já atende)
- **Opção B:** Implementar detecção de sentença (4-6h de trabalho)

### **Modo Máquina de Escrever**
- **Recomendo implementar** (2-3h, funcionalidade útil)
- Mais simples que Modo Sentença
- Diferencial competitivo (poucos editores têm)

---

## 🎯 **CONCLUSÃO**

A extensão Focus do Tiptap **suporta apenas Modo Parágrafo** nativamente.

**Modo Sentença e Máquina de Escrever** requerem implementação customizada adicional.
