import { useEffect, useCallback } from 'react';

/**
 * Hook para sincronizar o Universo selecionado entre abas abertas
 * Usa o evento 'storage' do localStorage para detectar mudanças em outras abas
 * 
 * @param selectedUniverseId - ID do universo selecionado atualmente
 * @param setSelectedUniverseId - Função para atualizar o ID do universo
 */
export function useUniverseSync(
  selectedUniverseId: string,
  setSelectedUniverseId: (id: string) => void
) {
  // Listener para mudanças de localStorage em outras abas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Verificar se a chave que mudou é a do Universo selecionado
      if (event.key === 'selectedUniverseId' && event.newValue) {
        console.log('🔄 Sincronizando Universo de outra aba:', event.newValue);
        setSelectedUniverseId(event.newValue);
      }
    };

    // Adicionar listener para o evento 'storage'
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setSelectedUniverseId]);
}
