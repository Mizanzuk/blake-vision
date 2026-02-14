"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

interface Episode {
  id: string;
  numero: number;
  titulo: string;
  world_id: string;
  user_id: string;
}

interface NewEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  worldName: string;
  onSave: (episode: Partial<Episode>) => Promise<void>;
  mode?: "create" | "edit";
  episode?: Partial<Episode> | null;
}

export function NewEpisodeModal({
  isOpen,
  onClose,
  worldId,
  worldName,
  onSave,
  mode = "create",
  episode,
}: NewEpisodeModalProps) {
  const [formData, setFormData] = useState<any>({
    numero: "",
    titulo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        numero: "",
        titulo: "",
      });
      setError(null);
    } else if (isOpen && mode === "edit" && episode) {
      // Preencher formulário com dados do episódio em modo edição
      setFormData({
        numero: episode.numero || "",
        titulo: episode.titulo || "",
      });
      setError(null);
    }
  }, [isOpen, mode, episode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validações
      if (!formData.numero || formData.numero <= 0) {
        setError("Número do episódio deve ser maior que 0");
        setLoading(false);
        return;
      }

      if (!formData.titulo || formData.titulo.trim() === "") {
        setError("Título é obrigatório");
        setLoading(false);
        return;
      }

      await onSave({
        ...formData,
        world_id: worldId,
        numero: parseInt(formData.numero),
      });
      onClose();
    } catch (err) {
      console.error("Error saving episode:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao salvar episódio"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Novo Episódio" : "Editar Episódio"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mundo (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MUNDO
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded border border-gray-300 text-gray-700">
            {worldName}
          </div>
        </div>

        {/* Número do Episódio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NÚMERO DO EPISÓDIO *
          </label>
          <Input
            type="number"
            placeholder="Digite o número (ex: 1, 2, 3)..."
            value={formData.numero}
            onChange={(e) =>
              setFormData({ ...formData, numero: e.target.value })
            }
            min="1"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Deve ser um número inteiro positivo
          </p>
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            TÍTULO *
          </label>
          <Input
            type="text"
            placeholder="Digite o título do episódio..."
            value={formData.titulo}
            onChange={(e) =>
              setFormData({ ...formData, titulo: e.target.value })
            }
            required
          />
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-2 justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? "Salvando..." : mode === "create" ? "Criar Episódio" : "Atualizar Episódio"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
