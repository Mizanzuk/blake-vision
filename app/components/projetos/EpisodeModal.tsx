"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Button } from "@/app/components/ui";
import type { Ficha } from "@/app/types";
import { toast } from "sonner";

interface EpisodeModalProps {
  episode: Ficha | null;
  worldId: string;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function EpisodeModal({
  episode,
  worldId,
  onSave,
  onDelete,
  onClose,
}: EpisodeModalProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [numeroEpisodio, setNumeroEpisodio] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [logline, setLogline] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [worldHasEpisodes, setWorldHasEpisodes] = useState(false);

  useEffect(() => {
    checkIfWorldHasEpisodes();
  }, [worldId]);

  useEffect(() => {
    if (episode) {
      setNumeroEpisodio(episode.numero_episodio?.toString() || "");
      setTitulo(episode.titulo || "");
      setLogline(episode.logline || "");
      setSinopse(episode.resumo || "");
    } else {
      setNumeroEpisodio("");
      setTitulo("");
      setLogline("");
      setSinopse("");
    }
    setHasChanges(false);
  }, [episode]);

  async function checkIfWorldHasEpisodes() {
    try {
      const response = await fetch(`/api/worlds?id=${worldId}`);
      const data = await response.json();
      
      if (response.ok && data.world) {
        setWorldHasEpisodes(data.world.tem_episodios || false);
      }
    } catch (error) {
      console.error("Error checking world episodes:", error);
    }
  }

  function handleChange() {
    setHasChanges(true);
  }

  function handleClose() {
    if (hasChanges) {
      const confirmed = window.confirm(
        "Você tem alterações não salvas. Deseja realmente fechar sem salvar?"
      );
      if (!confirmed) return;
    }
    onClose();
  }

  function handleSave() {
    // Validation
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!logline.trim()) {
      toast.error("Logline é obrigatória");
      return;
    }

    if (worldHasEpisodes && !numeroEpisodio.trim()) {
      toast.error("Número do episódio é obrigatório para mundos com episódios");
      return;
    }

    const episodeData = {
      id: episode?.id,
      titulo: titulo.trim(),
      logline: logline.trim(),
      resumo: sinopse.trim() || null,
      numero_episodio: worldHasEpisodes && numeroEpisodio ? parseInt(numeroEpisodio) : null,
    };

    onSave(episodeData);
    setHasChanges(false);
  }

  function handleDelete() {
    if (!episode?.id) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja deletar este episódio? Esta ação não pode ser desfeita."
    );

    if (confirmed) {
      onDelete(episode.id);
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={episode ? "Editar Episódio" : "Novo Episódio"}
      size="lg"
    >
      <div className="space-y-4">
        {/* Número do Episódio */}
        {worldHasEpisodes && (
          <Input
            label="Número do Episódio"
            type="number"
            value={numeroEpisodio}
            onChange={(e) => {
              setNumeroEpisodio(e.target.value);
              handleChange();
            }}
            placeholder="1"
            required
            fullWidth
          />
        )}

        {/* Título */}
        <Input
          label="Título do Episódio"
          type="text"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            handleChange();
          }}
          placeholder="Ex: O Início da Jornada"
          required
          fullWidth
        />

        {/* Logline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Logline <span className="text-red-500">*</span>
          </label>
          <textarea
            value={logline}
            onChange={(e) => {
              setLogline(e.target.value);
              handleChange();
            }}
            placeholder="Frase curta que descreve o conflito central"
            rows={2}
            required
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Sinopse */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sinopse
          </label>
          <textarea
            value={sinopse}
            onChange={(e) => {
              setSinopse(e.target.value);
              handleChange();
            }}
            placeholder="Um resumo curto da história, apresentando o protagonista, o conflito, o contexto e o gancho da trama."
            rows={6}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {episode && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
