"use client";

import { useEffect } from "react";
import { Modal, Badge, Button } from "@/app/components/ui";
import type { Ficha } from "@/app/types";
import { PencilIcon } from "@heroicons/react/24/outline";

interface FichaViewModalProps {
  isOpen: boolean;
  ficha: Ficha | null;
  onClose: () => void;
  onEdit: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export default function FichaViewModal({
  isOpen,
  ficha,
  onClose,
  onEdit,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}: FichaViewModalProps) {
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrevious, onNext, onPrevious]);
  
  if (!isOpen || !ficha) return null;
  
  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      episodio: "Episódio",
      personagem: "Personagem",
      local: "Local",
      evento: "Evento",
      conceito: "Conceito",
      regra: "Regra",
      objeto: "Objeto",
    };
    return labels[ficha.tipo] || ficha.tipo;
  };

  const renderEpisodeView = () => (
    <div className="space-y-6">
      {/* Header com ícone de edição */}
      <div className="flex items-start justify-between border-b border-border-light-default dark:border-border-dark-default pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="primary" size="sm">
              {getTypeLabel()}
            </Badge>
            {ficha.codigo && (
              <Badge variant="default" size="sm">
                {ficha.codigo}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
            {ficha.episodio ? `${ficha.episodio}. ` : ""}{ficha.titulo}
          </h2>
        </div>
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
          aria-label="Editar ficha"
        >
          <PencilIcon className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" />
        </button>
      </div>

      {/* Logline */}
      {ficha.conteudo && (
        <div>
          <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
            Logline
          </h3>
          <p className="text-base italic text-text-light-primary dark:text-dark-primary leading-relaxed">
            {ficha.conteudo}
          </p>
        </div>
      )}

      {/* Sinopse */}
      {ficha.resumo && (
        <div>
          <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
            Sinopse
          </h3>
          <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
            {ficha.resumo}
          </p>
        </div>
      )}

      {/* Descrição completa */}
      {ficha.descricao && (
        <div>
          <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
            Descrição
          </h3>
          <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
            {ficha.descricao}
          </p>
        </div>
      )}

      {/* Tags */}
      {ficha.tags && ficha.tags.trim() !== '' && (
        <div>
          <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {ficha.tags.split(',').map((tag, index) => (
              <Badge key={index} variant="default" size="sm">
                {tag.trim()}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDefaultView = () => (
    <div className="space-y-6">
      {/* Header com ícone de edição */}
      <div className="flex items-start justify-between border-b border-border-light-default dark:border-border-dark-default pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="primary" size="sm">
              {getTypeLabel()}
            </Badge>
            {ficha.codigo && (
              <Badge variant="default" size="sm">
                {ficha.codigo}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
            {ficha.titulo}
          </h2>
        </div>
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
          aria-label="Editar ficha"
        >
          <PencilIcon className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" />
        </button>
      </div>

      {/* Imagem de capa */}
      {ficha.imagem_capa && (
        <div className="rounded-lg overflow-hidden">
          <img
            src={ficha.imagem_capa}
            alt={ficha.titulo}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Resumo */}
      {ficha.resumo && (
        <div>
          <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
            Resumo
          </h3>
          <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
            {ficha.resumo}
          </p>
        </div>
      )}

      {/* Descrição */}
      {ficha.descricao && (
        <div>
          <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
            Descrição
          </h3>
          <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
            {ficha.descricao}
          </p>
        </div>
      )}

      {/* Conteúdo */}
      {ficha.conteudo && (
        <div>
          <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
            Conteúdo
          </h3>
          <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
            {ficha.conteudo}
          </p>
        </div>
      )}

      {/* Ano Diegese */}
      {ficha.ano_diegese && (
        <div>
          <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
            Ano Diegese
          </h3>
          <p className="text-base text-text-light-primary dark:text-dark-primary">
            {ficha.ano_diegese}
          </p>
        </div>
      )}

      {/* Tags */}
      {ficha.tags && ficha.tags.trim() !== '' && (
        <div>
          <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {ficha.tags.split(',').map((tag, index) => (
              <Badge key={index} variant="default" size="sm">
                {tag.trim()}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

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
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {ficha.tipo === "episodio" ? renderEpisodeView() : renderDefaultView()}
        </div>
      </Modal>
    </div>
  );
}
