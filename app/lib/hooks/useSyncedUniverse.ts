'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useSyncedUniverse() {
  const router = useRouter();
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Sincronizar com localStorage ao montar e quando a rota muda
  useEffect(() => {
    const syncFromStorage = () => {
      const saved = localStorage.getItem('selectedUniverseId');
      if (saved) {
        setSelectedUniverseId(saved);
      }
      setIsLoading(false);
    };

    syncFromStorage();

    // Ouvir mudanças de outras abas
    window.addEventListener('storage', (event) => {
      if (event.key === 'selectedUniverseId' && event.newValue) {
        setSelectedUniverseId(event.newValue);
      }
    });
  }, []);

  // Salvar no localStorage quando mudar
  const updateUniverse = (id: string) => {
    setSelectedUniverseId(id);
    localStorage.setItem('selectedUniverseId', id);
  };

  return { selectedUniverseId, setSelectedUniverseId: updateUniverse, isLoading };
}
