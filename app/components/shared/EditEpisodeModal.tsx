'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

interface EditEpisodeModalProps {
  isOpen: boolean;
  episodeId: string;
  episodeName: string;
  onClose: () => void;
  onSave: (episodeId: string, newNumber: number, newTitle: string) => Promise<void>;
}

export default function EditEpisodeModal({
  isOpen,
  episodeId,
  episodeName,
  onClose,
  onSave,
}: EditEpisodeModalProps) {
  const [number, setNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse episodeName to extract number and title
  // Format: "Episódio 1: Título do Episódio"
  useEffect(() => {
    setError(null);
    if (episodeName) {
      // Try to extract number and title from the format "Episódio X: Título"
      const match = episodeName.match(/Episódio\s+(\d+):\s*(.*)/i);
      if (match) {
        setNumber(match[1]);
        setTitle(match[2]);
      } else {
        // Fallback: try to extract just the number from the beginning
        const numberMatch = episodeName.match(/^(\d+)/);
        if (numberMatch) {
          setNumber(numberMatch[1]);
          setTitle(episodeName.substring(numberMatch[1].length).trim());
        } else {
          setNumber('');
          setTitle(episodeName);
        }
      }
    }
  }, [episodeName, isOpen]);

  const handleSave = async () => {
    if (!number.trim()) {
      setError('O número do episódio não pode estar vazio');
      return;
    }

    if (!title.trim()) {
      setError('O título do episódio não pode estar vazio');
      return;
    }

    const episodeNumber = parseInt(number.trim(), 10);
    if (isNaN(episodeNumber) || episodeNumber <= 0) {
      setError('O número do episódio deve ser um número válido');
      return;
    }

    setLoading(true);
    try {
      await onSave(episodeId, episodeNumber, title.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar episódio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-light-raised dark:bg-dark-raised rounded-2xl shadow-soft-xl animate-slide-up border border-border-light-default dark:border-border-dark-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border-light-default dark:border-border-dark-default">
          <h3 className="text-xl font-bold text-text-light-primary dark:text-dark-primary">
            Editar Episódio
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-light-tertiary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-tertiary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
            aria-label="Fechar modal"
          >
            <svg
              className="w-5 h-5"
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
        <div className="p-6 space-y-4">
          {/* Número do Episódio */}
          <div>
            <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
              Número do Episódio
            </label>
            <Input
              type="number"
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
                setError(null);
              }}
              placeholder="Ex: 1"
              disabled={loading}
              min="1"
            />
          </div>

          {/* Título do Episódio */}
          <div>
            <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
              Título do Episódio
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="Digite o título do episódio"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border-light-default dark:border-border-dark-default bg-light-overlay dark:bg-dark-overlay">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            size="sm"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
            loading={loading}
            size="sm"
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
