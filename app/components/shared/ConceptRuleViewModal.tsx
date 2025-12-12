"use client";

import { useEffect } from "react";
import { Modal } from "@/app/components/ui";
import type { Ficha, Universe, World } from "@/app/types";
import { PencilIcon } from "@heroicons/react/24/outline";

interface ConceptRuleViewModalProps {
  ficha: Ficha;
  universes: Universe[];
  worlds: World[];
  onClose: () => void;
  onEdit: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export default function ConceptRuleViewModal({
  ficha,
  universes,
  worlds,
  onClose,
  onEdit,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}: ConceptRuleViewModalProps) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrevious, onNext, onPrevious]);
  
  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      conceito: "Conceito",
      regra: "Regra",
    };
    return labels[ficha.tipo] || ficha.tipo;
  };

  const universe = ficha.universe_id 
    ? universes.find(u => u.id === ficha.universe_id) 
    : undefined;
  
  const world = ficha.world_id 
    ? worlds.find(w => w.id === ficha.world_id) 
    : undefined;

  return (
    <div className="relative">
      {/* Botão Anterior */}
      {hasPrevious && onPrevious && (
        <button
          onClick={onPrevious}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default hover:bg-light-hover dark:hover:bg-dark-hover transition-colors flex items-center justify-center shadow-lg"
          aria-label="Ficha anterior"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      {/* Botão Próximo */}
      {hasNext && onNext && (
        <button
          onClick={onNext}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default hover:bg-light-hover dark:hover:bg-dark-hover transition-colors flex items-center justify-center shadow-lg"
          aria-label="Próxima ficha"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      
      <Modal
        isOpen={true}
        onClose={onClose}
        title=""
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {/* Layout Minimalista */}
          <div className="space-y-6">
            
            {/* Header: Badge + Título + Botão Editar */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Badge do tipo */}
                <div className="mb-3">
                  <span className="inline-block text-xs font-medium text-primary-600 dark:text-primary-400">
                    {getTypeLabel()}
                  </span>
                </div>
                
                {/* Título */}
                <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                  {ficha.titulo}
                </h2>
                
                {/* Código e Mundo */}
                {(ficha.codigo || world) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ficha.codigo && (
                      <span className="text-sm text-text-light-secondary dark:text-dark-secondary">
                        {ficha.codigo}
                      </span>
                    )}
                    {world && (
                      <span className="text-sm text-text-light-secondary dark:text-dark-secondary">
                        • {world.nome}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Botão Editar */}
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors flex-shrink-0"
                aria-label="Editar"
              >
                <PencilIcon className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary hover:text-primary-600 dark:hover:text-primary-400" strokeWidth={1.5} />
              </button>
            </div>

            {/* Descrição */}
            {ficha.resumo && (
              <div>
                <h3 className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary mb-2">
                  Descrição
                </h3>
                <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
                  {ficha.resumo}
                </p>
              </div>
            )}

            {/* Conteúdo */}
            {ficha.conteudo && (
              <div>
                <h3 className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary mb-2">
                  Conteúdo
                </h3>
                <div className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap prose dark:prose-invert max-w-none">
                  {ficha.conteudo}
                </div>
              </div>
            )}

            {/* Tags */}
            {ficha.tags && ficha.tags.trim() !== '' && (
              <div>
                <h3 className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ficha.tags.split(',').map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
