"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";

interface EpisodeCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (numero: number, titulo: string) => Promise<void>;
  worldId: string;
}

export function EpisodeCreationModal({
  isOpen,
  onClose,
  onSave,
  worldId,
}: EpisodeCreationModalProps) {
  const [numero, setNumero] = useState("");
  const [titulo, setTitulo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNumero("");
      setTitulo("");
      setError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setError(null);

    // Validações
    if (!numero.trim()) {
      setError("Número do episódio é obrigatório");
      return;
    }

    const episodeNumber = parseInt(numero, 10);
    if (isNaN(episodeNumber) || episodeNumber <= 0) {
      setError("Número deve ser um valor positivo");
      return;
    }

    if (!titulo.trim()) {
      setError("Título do episódio é obrigatório");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(episodeNumber, titulo.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar episódio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
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
          {/* Número */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-light-secondary dark:text-dark-secondary">
              Número do Episódio
            </label>
            <input
              type="number"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: 1, 2, 3..."
              autoFocus
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all disabled:opacity-50"
            />
          </div>

          {/* Título */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-light-secondary dark:text-dark-secondary">
              Título do Episódio
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: O Começo, A Volta..."
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all disabled:opacity-50"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
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
            onClick={handleSave}
            disabled={isLoading || !numero.trim() || !titulo.trim()}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              numero.trim() && titulo.trim() && !isLoading
                ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            )}
          >
            {isLoading ? "Criando..." : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
