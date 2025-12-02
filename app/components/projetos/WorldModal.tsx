"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Button } from "@/app/components/ui";
import type { World } from "@/app/types";
import { toast } from "sonner";

interface WorldModalProps {
  world: World | null;
  universeId: string;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function WorldModal({
  world,
  universeId,
  onSave,
  onDelete,
  onClose,
}: WorldModalProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [hasEpisodes, setHasEpisodes] = useState(false);

  useEffect(() => {
    if (world) {
      setNome(world.nome || "");
      setDescricao(world.descricao || "");
      setHasEpisodes(world.has_episodes || world.tem_episodios || false);
    } else {
      setNome("");
      setDescricao("");
      setHasEpisodes(false);
    }
    setHasChanges(false);
  }, [world]);

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
    if (!nome.trim()) {
      toast.error("Nome do mundo é obrigatório");
      return;
    }

    const worldData = {
      id: world?.id,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      has_episodes: hasEpisodes,
      universe_id: universeId,
    };

    onSave(worldData);
    setHasChanges(false);
  }

  function handleDelete() {
    if (!world?.id || !onDelete) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja deletar este mundo? Esta ação não pode ser desfeita."
    );

    if (confirmed) {
      onDelete(world.id);
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={world ? "Editar Mundo" : "Novo Mundo"}
      size="md"
    >
      <div className="space-y-4">
        {/* Nome */}
        <Input
          label="Nome do Mundo"
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            handleChange();
          }}
          placeholder="Ex: Terra Média"
          required
          fullWidth
        />

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
              handleChange();
            }}
            placeholder="Descreva este mundo"
            rows={3}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Tem Episódios */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="tem_episodios"
            checked={hasEpisodes}
            onChange={(e) => {
              setHasEpisodes(e.target.checked);
              handleChange();
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <label
              htmlFor="tem_episodios"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Tem Episódios
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Permite organizar fichas por episódios/capítulos
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {world && onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
              >
                Deletar
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
