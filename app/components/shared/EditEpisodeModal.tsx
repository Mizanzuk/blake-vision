"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

interface EditEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodeId: string;
  episodeName: string;
  onSave: (episodeId: string, numero: number, titulo: string) => Promise<void>;
}

export default function EditEpisodeModal({
  isOpen,
  onClose,
  episodeId,
  episodeName,
  onSave,
}: EditEpisodeModalProps) {
  const [numero, setNumero] = useState<string>("");
  const [titulo, setTitulo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format: "Episódio 1: Título do Episódio"
  useEffect(() => {
    setError(null);
    if (isOpen && episodeName) {
      // Try to extract number and title from the format "Episódio X: Título" or "Episodio X: Título"
      const match = episodeName.match(/Epis[óo]dios?\s+(\d+):\s*(.*)/i);
      if (match) {
        setNumero(match[1]);
        let title = match[2].trim();
        // Remove any duplicate "Episódio X: " prefix from the title
        const duplicateMatch = title.match(/^Epis[óo]dios?\s+\d+:\s*(.*)/i);
        if (duplicateMatch) {
          title = duplicateMatch[1].trim();
        }
        setTitulo(title);
      } else {
        // Fallback: try to extract just the number from the beginning
        const numberMatch = episodeName.match(/^(\d+)/);
        if (numberMatch) {
          setNumero(numberMatch[1]);
          let remainingText = episodeName.substring(numberMatch[1].length).trim();
          // Remove leading colon if present
          if (remainingText.startsWith(':')) {
            remainingText = remainingText.substring(1).trim();
          }
          setTitulo(remainingText);
        } else {
          setNumero("");
          setTitulo(episodeName);
        }
      }
    }
  }, [episodeName, isOpen]);

  async function handleSave() {
    setError(null);

    if (!numero || numero.trim() === "") {
      setError("Número do episódio é obrigatório");
      return;
    }

    if (!titulo || titulo.trim() === "") {
      setError("Título do episódio é obrigatório");
      return;
    }

    setLoading(true);
    try {
      await onSave(episodeId, parseInt(numero), titulo);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar episódio:", err);
      setError("Erro ao salvar episódio");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-light-raised dark:bg-dark-raised rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border">
          <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">
            Editar Episódio
          </h2>
          <button
            onClick={onClose}
            className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Número do Episódio */}
          <div>
            <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2 uppercase tracking-wide">
              Número do Episódio
            </label>
            <Input
              type="number"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 1, 2, 3..."
              disabled={loading}
            />
          </div>

          {/* Título do Episódio */}
          <div>
            <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-2 uppercase tracking-wide">
              Título do Episódio
            </label>
            <Input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: O Começo, A Volta..."
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-light-border dark:border-dark-border justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
