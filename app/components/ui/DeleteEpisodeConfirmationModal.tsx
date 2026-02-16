'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

interface DeleteEpisodeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  episodeName: string;
}

export function DeleteEpisodeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  episodeName,
}: DeleteEpisodeConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting episode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-light-raised dark:bg-dark-raised rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light-default dark:border-border-dark-default">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
            Deletar Episódio
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors disabled:opacity-50"
          >
            <svg
              className="w-5 h-5 text-text-light-tertiary dark:text-dark-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          <p className="text-text-light-primary dark:text-dark-primary">
            Tem certeza que deseja deletar o episódio <strong>{episodeName}</strong>?
          </p>
          <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
            Esta ação não pode ser desfeita.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-light-overlay/50 dark:bg-dark-overlay/50 border-t border-border-light-default dark:border-border-dark-default">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isLoading
                ? 'bg-red-400 text-white cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md'
            )}
          >
            {isLoading ? 'Deletando...' : 'Deletar'}
          </button>
        </div>
      </div>
    </div>
  );
}
