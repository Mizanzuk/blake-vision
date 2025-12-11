# Investigação dos Problemas Restantes

**Data:** 10 de dezembro de 2025

---

## Problema 1: Mudança de Fonte Não Funciona

### Código Atual

**Estado:**
```tsx
const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
```

**Botões do dropdown (linha ~1823-1850):**
```tsx
<button
  onClick={() => {
    setFontFamily('serif');
    setShowStylesDropdown(false);
  }}
>
  Serif
</button>

<button
  onClick={() => {
    setFontFamily('sans');
    setShowStylesDropdown(false);
  }}
>
  Sans
</button>

<button
  onClick={() => {
    setFontFamily('mono');
    setShowStylesDropdown(false);
  }}
>
  Mono
</button>
```

**Aplicação da classe (linha 2371):**
```tsx
<div className={`max-w-4xl mx-auto px-16 pt-24 pb-12 font-${fontFamily}`}>
  <TiptapEditor
    fontFamily={fontFamily}
    onFontChange={(font) => setFontFamily(font)}
  />
</div>
```

### Análise

**PROBLEMA IDENTIFICADO:** ❌

A classe `font-${fontFamily}` está usando **interpolação dinâmica**, que **NÃO FUNCIONA** com Tailwind CSS!

Tailwind precisa das classes completas no código para incluí-las no build. Classes dinâmicas como `font-${fontFamily}` não são detectadas pelo compilador.

**Exemplo:**
- ❌ `font-${fontFamily}` → NÃO FUNCIONA (classe dinâmica)
- ✅ `font-serif` → FUNCIONA (classe estática)

### Solução

Usar um objeto de mapeamento ou `clsx` com classes completas:

```tsx
// Opção 1: Mapeamento
const fontClasses = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono'
};

<div className={`max-w-4xl mx-auto px-16 pt-24 pb-12 ${fontClasses[fontFamily]}`}>

// Opção 2: clsx com condicionais
<div className={clsx(
  'max-w-4xl mx-auto px-16 pt-24 pb-12',
  fontFamily === 'serif' && 'font-serif',
  fontFamily === 'sans' && 'font-sans',
  fontFamily === 'mono' && 'font-mono'
)}>
```

---

## Problema 2: Toggle de Negrito

### Código Atual

**Botão B (linha ~1790):**
```tsx
<button
  onClick={() => editor?.chain().focus().toggleBold().run()}
>
  B
</button>
```

### Análise

O código parece correto:
- ✅ Tem `.focus()`
- ✅ Tem `.toggleBold()`
- ✅ Tem `.run()`

**Possível causa:** O problema pode não estar no código do botão, mas sim:

1. **Seleção perdida:** Quando clico no botão, a seleção pode ser perdida antes do `.focus()` restaurá-la
2. **Editor não está pronto:** O `editor` pode ser `null` ou `undefined`
3. **Problema do TipTap:** O toggle pode não funcionar corretamente com seleções existentes

### Próximos Passos

1. Testar se o botão B funciona para **adicionar** negrito (já testei remover)
2. Verificar se o editor está pronto quando clico no botão
3. Adicionar logs para debug

---

## Conclusão Preliminar

### Problema 1: Mudança de Fonte
**Causa:** Interpolação dinâmica de classes Tailwind  
**Certeza:** 99% - Este é definitivamente o problema  
**Solução:** Usar mapeamento ou clsx com classes completas

### Problema 2: Toggle de Negrito
**Causa:** Incerta - Precisa mais investigação  
**Certeza:** 30% - Pode ser problema de seleção ou timing  
**Solução:** Testar mais cenários e adicionar logs


---

## Teste Adicional: Botão B (Adicionar Negrito)

**Procedimento:**
1. Selecionei a palavra "cidade" (sem formatação)
2. Cliquei no botão B
3. Verifiquei via console

**Resultado:** ❌ **NÃO FUNCIONA**

```
Negrito em "cidade": NÃO
```

**Conclusão:** O botão B **não funciona** nem para adicionar nem para remover negrito!

### Análise Aprofundada

O problema não é específico do toggle. O botão B simplesmente **não aplica** a formatação.

**Possíveis causas:**

1. **Seleção perdida:** Ao clicar no botão, a seleção é perdida antes do `.focus()` restaurá-la
2. **Editor não recebe foco:** O `.focus()` pode não estar funcionando corretamente
3. **Problema com o editor mobile:** O TipTap pode ter comportamento diferente no mobile

### Solução Proposta

Em vez de confiar apenas no `.focus()`, podemos:

1. **Salvar a seleção antes de clicar:**
   ```tsx
   const [savedSelection, setSavedSelection] = useState<any>(null);
   ```

2. **Restaurar a seleção manualmente:**
   ```tsx
   onClick={() => {
     if (savedSelection) {
       editor?.commands.setTextSelection(savedSelection);
     }
     editor?.chain().focus().toggleBold().run();
   }}
   ```

3. **Ou usar `onMouseDown` em vez de `onClick`:**
   ```tsx
   onMouseDown={(e) => {
     e.preventDefault(); // Previne perda de foco
     editor?.chain().focus().toggleBold().run();
   }}
   ```

**A opção 3 é mais simples e deve resolver o problema!**
