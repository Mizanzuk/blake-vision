"use client";

import { Episode } from "@/app/types";
import { PencilIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

interface SinopseViewModalProps {
  sinopse: Episode | null;
  onClose: () => void;
  onEdit: () => void;
}

export default function SinopseViewModal({
  sinopse,
  onClose,
  onEdit,
}: SinopseViewModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!sinopse) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-light-raised dark:bg-dark-raised rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-light-raised dark:bg-dark-raised p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
            {sinopse.numero}. {sinopse.titulo}
          </h2>
          <div className="flex items-center gap-2">
            {/* Botão de editar */}
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
              aria-label="Editar"
            >
              <PencilIcon className="w-4 h-4 text-text-light-secondary dark:text-dark-secondary hover:text-primary-600 dark:hover:text-primary-400" strokeWidth={1.5} />
            </button>
            {/* Botão de fechar */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-4 h-4 text-text-light-secondary dark:text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Logline */}
          {sinopse.logline && (
            <div>
              <h3 className="text-xs font-medium text-text-light-tertiary dark:text-dark-tertiary mb-2">
                Logline
              </h3>
              <p className="text-base text-text-light-primary dark:text-dark-primary whitespace-pre-wrap">
                {sinopse.logline}
              </p>
            </div>
          )}

          {/* Sinopse */}
          {sinopse.sinopse && (
            <div>
              <h3 className="text-xs font-medium text-text-light-tertiary dark:text-dark-tertiary mb-2">
                Sinopse
              </h3>
              <p className="text-base text-text-light-primary dark:text-dark-primary whitespace-pre-wrap">
                {sinopse.sinopse}
              </p>
            </div>
          )}

          {/* Duração */}
          {sinopse.duracao_minutos && (
            <div>
              <h3 className="text-xs font-medium text-text-light-tertiary dark:text-dark-tertiary mb-2">
                Duração
              </h3>
              <p className="text-base text-text-light-primary dark:text-dark-primary">
                {sinopse.duracao_minutos} minutos
              </p>
            </div>
          )}

          {/* Data de Lançamento */}
          {sinopse.data_lancamento && (
            <div>
              <h3 className="text-xs font-medium text-text-light-tertiary dark:text-dark-tertiary mb-2">
                Data de Lançamento
              </h3>
              <p className="text-base text-text-light-primary dark:text-dark-primary">
                {new Date(sinopse.data_lancamento).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
