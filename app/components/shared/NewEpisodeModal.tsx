"use client";

import { useState, useEffect } from "react";
import { SimpleModal } from "@/app/components/shared/SimpleModal";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

interface NewEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  universeId: string;
  onSave: (episodeId: string) => Promise<void>;
}

export default function NewEpisodeModal({
  isOpen,
  onClose,
  worldId,
  universeId,
  onSave,
}: NewEpisodeModalProps) {
  const [numero, setNumero] = useState<string>("");
  const [titulo, setTitulo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNumero("");
      setTitulo("");
      setError(null);
    }
  }, [isOpen]);

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
      const response = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          world_id: worldId,
          universe_id: universeId,
          numero: parseInt(numero),
          titulo: titulo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar episódio");
      }

      const data = await response.json();
      const newEpisodeId = data.id || data.episode_id;
      
      await onSave(newEpisodeId);
      onClose();
    } catch (err) {
      console.error("Erro ao criar episódio:", err);
      setError(err instanceof Error ? err.message : "Erro ao criar episódio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Episódio"
      size="sm"
      footer={
        <>
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
            disabled={loading || !numero || !titulo}
            size="sm"
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="p-3 mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Número do Episódio */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wide mb-1.5">
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
        <label className="block text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wide mb-1.5">
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
    </SimpleModal>
  );
}
