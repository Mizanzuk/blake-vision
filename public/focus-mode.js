// Focus Mode - JavaScript puro (sem React)
console.log('[Focus Mode Script] Carregado!');

(function() {
  let currentFocusType = 'off';
  
  function updateFocus() {
    console.log('[Focus Mode Script] updateFocus chamado, tipo:', currentFocusType);
    
    const proseMirror = document.querySelector('.ProseMirror');
    if (!proseMirror) {
      console.log('[Focus Mode Script] ProseMirror não encontrado');
      return;
    }
    
    // Remove all focus classes
    proseMirror.querySelectorAll('.focus-active, .focus-dimmed').forEach(el => {
      el.classList.remove('focus-active', 'focus-dimmed');
    });
    
    if (currentFocusType === 'off') {
      console.log('[Focus Mode Script] Foco desativado');
      return;
    }
    
    console.log('[Focus Mode Script] Aplicando foco...');
    
    // Get all paragraphs
    const paragraphs = Array.from(proseMirror.querySelectorAll('p'));
    console.log('[Focus Mode Script] Encontrados', paragraphs.length, 'parágrafos');
    
    // Find current paragraph
    let currentParagraph = null;
    const selection = window.getSelection();
    
    if (selection && selection.anchorNode) {
      let node = selection.anchorNode;
      while (node && node !== proseMirror) {
        if (node.nodeName === 'P') {
          currentParagraph = node;
          break;
        }
        node = node.parentNode;
      }
    }
    
    if (!currentParagraph && paragraphs.length > 0) {
      currentParagraph = paragraphs[0];
    }
    
    console.log('[Focus Mode Script] Parágrafo atual:', !!currentParagraph);
    
    if (!currentParagraph) return;
    
    // Apply focus classes
    paragraphs.forEach(p => {
      if (p === currentParagraph) {
        p.classList.add('focus-active');
        console.log('[Focus Mode Script] Classe focus-active adicionada');
      } else {
        p.classList.add('focus-dimmed');
      }
    });
  }
  
  // Listen to button clicks
  function setupButtons() {
    console.log('[Focus Mode Script] Configurando botões...');
    
    // Sentença button
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      
      const hint = target.getAttribute('hint');
      
      if (hint && hint.includes('Foco em Sentença')) {
        console.log('[Focus Mode Script] Botão Sentença clicado');
        currentFocusType = currentFocusType === 'sentence' ? 'off' : 'sentence';
        updateFocus();
      } else if (hint && hint.includes('Foco em Parágrafo')) {
        console.log('[Focus Mode Script] Botão Parágrafo clicado');
        currentFocusType = currentFocusType === 'paragraph' ? 'off' : 'paragraph';
        updateFocus();
      }
    });
    
    // Listen to selection changes
    document.addEventListener('selectionchange', () => {
      if (currentFocusType !== 'off') {
        updateFocus();
      }
    });
    
    // Listen to input events
    const proseMirror = document.querySelector('.ProseMirror');
    if (proseMirror) {
      proseMirror.addEventListener('input', () => {
        if (currentFocusType !== 'off') {
          setTimeout(updateFocus, 100);
        }
      });
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupButtons);
  } else {
    setupButtons();
  }
  
  // Also try after a delay (for dynamic content)
  setTimeout(setupButtons, 1000);
  setTimeout(setupButtons, 3000);
})();
