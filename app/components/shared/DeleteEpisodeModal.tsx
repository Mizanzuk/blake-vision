"use client";

import { useState } from "react";

interface DeleteEpisodeModalProps {
  isOpen: boolean;
  episodeName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteEpisodeModal({
  isOpen,
  episodeName,
  onConfirm,
  onCancel,
}: DeleteEpisodeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar episódio");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-light-raised dark:bg-dark-raised rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary mb-2">
          Deletar Episódio
        </h2>
        
        <p className="text-sm text-text-light-secondary dark:text-dark-secondary mb-6">
          Tem certeza que deseja deletar o episódio <strong>{episodeName}</strong>? Esta ação não pode ser desfeita.
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-text-light-primary dark:text-dark-primary hover:bg-light-overlay dark:hover:bg-dark-overlay rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? "Deletando..." : "Deletar"}
          </button>
        </div>
      </div>
    </div>
  );
}
