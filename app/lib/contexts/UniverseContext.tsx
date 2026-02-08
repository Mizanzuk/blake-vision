'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UniverseContextType {
  selectedUniverseId: string;
  setSelectedUniverseId: (id: string) => void;
  isLoading: boolean;
}

const UniverseContext = createContext<UniverseContextType | undefined>(undefined);

export function UniverseProvider({ children }: { children: ReactNode }) {
  const [selectedUniverseId, setSelectedUniverseIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem('selectedUniverseId');
    if (saved) {
      setSelectedUniverseIdState(saved);
    }
    setIsLoading(false);
  }, []);

  // Salvar no localStorage quando mudar
  const setSelectedUniverseId = (id: string) => {
    setSelectedUniverseIdState(id);
    localStorage.setItem('selectedUniverseId', id);
    
    // Disparar evento customizado para sincronizar com outras abas
    window.dispatchEvent(
      new CustomEvent('universeChanged', { detail: { universeId: id } })
    );
  };

  // Ouvir mudanças de outras abas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'selectedUniverseId' && event.newValue) {
        setSelectedUniverseIdState(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <UniverseContext.Provider value={{ selectedUniverseId, setSelectedUniverseId, isLoading }}>
      {children}
    </UniverseContext.Provider>
  );
}

export function useUniverse() {
  const context = useContext(UniverseContext);
  if (context === undefined) {
    throw new Error('useUniverse deve ser usado dentro de UniverseProvider');
  }
  return context;
}
