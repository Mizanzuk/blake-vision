"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui";
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
  const [isSaving, setIsSaving] = useState(false);

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

  async function handleClose() {
    if (hasChanges) {
      const confirmed = window.confirm(
        "Você tem alterações não salvas. Deseja realmente fechar sem salvar?"
      );
      if (!confirmed) return;
    }
    onClose();
  }

  async function handleSave() {
    // Validation
    if (!nome.trim()) {
      toast.error("Nome do mundo é obrigatório");
      return;
    }

    setIsSaving(true);

    const worldData = {
      id: world?.id,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      has_episodes: hasEpisodes,
      ...(world === null && { universe_id: universeId }), // Apenas enviar universe_id ao criar
    };

    console.log('[WorldModal] Enviando dados:', worldData);
    try {
      await onSave(worldData);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!world?.id || !onDelete) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja deletar este mundo? Esta ação não pode ser desfeita."
    );

    if (confirmed) {
      onDelete(world.id);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-border-light-default dark:border-border-dark-default rounded-lg p-6 bg-light-base dark:bg-dark-base space-y-4 mx-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{world ? "Editar Mundo" : "Novo Mundo"}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Nome */}
        <div>
          <label className="block text-xs font-semibold mb-2">Nome do Mundo {!world && <span className="text-error-light dark:text-error-dark">*</span>}</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              handleChange();
            }}
            placeholder="Ex: Terra Média"
            className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-semibold mb-2">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
              handleChange();
            }}
            placeholder="Descreva este mundo"
            className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="mt-1 h-4 w-4 rounded border-border-light-default dark:border-border-dark-default text-primary-600 focus:ring-primary-500 bg-light-raised dark:bg-dark-raised"
          />
          <div>
            <label
              htmlFor="tem_episodios"
              className="text-xs font-semibold text-text-light-primary dark:text-dark-primary cursor-pointer"
            >
              Tem Episódios
            </label>
            <p className="text-xs text-text-light-tertiary dark:text-dark-tertiary mt-0.5">
              Permite organizar fichas por episódios/capítulos
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {world && onDelete && (
              <Button
                variant="danger"
                size="sm"
                type="button"
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
              type="button"
              onClick={handleClose}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSaving}
            >
              {world ? (isSaving ? "Salvando..." : "Salvar") : (isSaving ? "Criando..." : "Criar Mundo")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
