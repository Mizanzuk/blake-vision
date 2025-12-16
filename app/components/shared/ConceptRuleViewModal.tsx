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
  currentIndex?: number;
  totalCount?: number;
  worldName?: string;
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
  currentIndex,
  totalCount,
  worldName,
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
  
  const getTypeColor = () => {
    const colors: Record<string, string> = {
      conceito: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      regra: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return colors[ficha.tipo] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

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
        noBorder={true}
        headerActions={
          <button
            onClick={onEdit}
            className="p-1 rounded-lg text-text-light-tertiary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-tertiary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
            aria-label="Editar"
          >
            <PencilIcon className="w-4 h-4" strokeWidth={1.5} />
          </button>
        }
      >
        {/* Conteúdo */}
        <div>
          <div className="w-full space-y-6 md:space-y-8 py-2 md:py-3 px-2">
            
            {/* Header: Badge + Título */}
            <div>
              {/* Badge do tipo + Mundo na mesma linha */}
              <div className="mb-4 flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor()}`}>
                  {getTypeLabel()}
                </span>
                {worldName && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {worldName}
                  </span>
                )}
              </div>
              
              {/* Título */}
              <h2 className="text-xl md:text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                {ficha.titulo}
              </h2>
              
              {/* Código */}
              {ficha.codigo && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-text-light-secondary dark:text-dark-secondary">
                    {ficha.codigo}
                  </span>
                </div>
              )}
              
              {/* Metadados de data */}
              <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {ficha.created_at && (
                  <span>Criado em {new Date(ficha.created_at).toLocaleDateString('pt-BR')}</span>
                )}
                {ficha.updated_at && ficha.updated_at !== ficha.created_at && (
                  <span>• Atualizado em {new Date(ficha.updated_at).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
              
              {/* Tags */}
              {ficha.tags && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {ficha.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Descrição */}
            {ficha.resumo && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">
                  Descrição
                </h3>
                <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {ficha.resumo}
                </p>
              </div>
            )}

            {/* Conteúdo */}
            {ficha.conteudo && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">
                  Conteúdo
                </h3>
                <div className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap prose dark:prose-invert max-w-none max-h-96 overflow-y-auto">
                  {ficha.conteudo}
                </div>
              </div>
            )}

            {/* Tags */}
            {ficha.tags && ficha.tags.trim() !== '' && (
              <div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">
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

            {/* Indicadores de navegação */}
            {(currentIndex !== undefined && totalCount !== undefined) || (hasNext || hasPrevious) ? (
              <div className="flex items-center justify-between pt-4 border-t border-border-light-default dark:border-border-dark-default mt-8">
                {/* Contador de fichas */}
                {currentIndex !== undefined && totalCount !== undefined && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {currentIndex + 1} / {totalCount}
                  </div>
                )}
                
                {/* Hint de navegação por teclado */}
                {(hasNext || hasPrevious) && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <span>← → para navegar</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}
