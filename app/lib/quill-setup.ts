// Registrar quill-mention globalmente
let mentionRegistered = false;

export async function registerQuillMention() {
  if (typeof window === 'undefined' || mentionRegistered) {
    return;
  }

  try {
    // Importar Quill do react-quill
    const ReactQuillModule = await import('react-quill');
    const Quill = (ReactQuillModule as any).Quill;
    
    if (!Quill) {
      console.error('Quill não encontrado em react-quill');
      return;
    }

    // Importar quill-mention
    const QuillMention = (await import('quill-mention')).default;
    
    // Registrar o módulo
    if (!Quill.imports['modules/mention']) {
      Quill.register('modules/mention', QuillMention);
      mentionRegistered = true;
      console.log('✅ quill-mention registrado globalmente');
    } else {
      console.log('✅ quill-mention já estava registrado');
      mentionRegistered = true;
    }
  } catch (error) {
    console.error('❌ Erro ao registrar quill-mention:', error);
  }
}
