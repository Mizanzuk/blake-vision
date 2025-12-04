"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";

interface NewEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (episodio: string) => void;
}

export function NewEpisodeModal({ isOpen, onClose, onSave }: NewEpisodeModalProps) {
  const [episodio, setEpisodio] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEpisodio("");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (episodio.trim()) {
      onSave(episodio.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-light-raised dark:bg-dark-raised rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light-default dark:border-border-dark-default">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
            Novo Episódio
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
          >
            <svg className="w-5 h-5 text-text-light-tertiary dark:text-dark-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-light-secondary dark:text-dark-secondary">
              Número ou Nome do Episódio
            </label>
            <input
              type="text"
              value={episodio}
              onChange={(e) => setEpisodio(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 1, 2, Piloto, Final..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-light-overlay/50 dark:bg-dark-overlay/50 border-t border-border-light-default dark:border-border-dark-default">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!episodio.trim()}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              episodio.trim()
                ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            )}
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}
