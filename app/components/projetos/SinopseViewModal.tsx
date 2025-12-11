"use client";

import { Episode } from "@/app/types";

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
  if (!sinopse) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-light-raised dark:bg-dark-raised rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-light-raised dark:bg-dark-raised border-b border-border-light-default dark:border-border-dark-default p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
            Sinopse {sinopse.numero}
          </h2>
          <button
            onClick={onClose}
            className="text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
              Título
            </h3>
            <p className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
              {sinopse.titulo}
            </p>
          </div>

          {/* Logline */}
          {sinopse.logline && (
            <div>
              <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
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
              <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
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
              <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                Duração
              </h3>
              <p className="text-base text-text-light-primary dark:text-dark-primary">
                {sinopse.duracao_minutos} minutos
              </p>
            </div>
          )}

          {/* Status */}
          {sinopse.status && (
            <div>
              <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                Status
              </h3>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {sinopse.status}
              </span>
            </div>
          )}

          {/* Data de Lançamento */}
          {sinopse.data_lancamento && (
            <div>
              <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                Data de Lançamento
              </h3>
              <p className="text-base text-text-light-primary dark:text-dark-primary">
                {new Date(sinopse.data_lancamento).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-light-raised dark:bg-dark-raised border-t border-border-light-default dark:border-border-dark-default p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
