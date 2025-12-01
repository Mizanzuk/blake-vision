"use client";

import { useState, useEffect, FormEvent } from "react";
import { Modal, Input, Textarea, Button } from "@/app/components/ui";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import type { World } from "@/app/types";

interface WorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  world: Partial<World> | null;
  onSave: (world: any) => Promise<void>;
  onDelete?: (worldId: string) => Promise<void>;
}

export default function WorldModal({
  isOpen,
  onClose,
  world,
  onSave,
  onDelete,
}: WorldModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    is_root: false,
    has_episodes: false,
    ordem: 0,
  });

  useEffect(() => {
    if (world) {
      setFormData({
        nome: world.nome || "",
        descricao: world.descricao || "",
        is_root: world.is_root || false,
        has_episodes: world.has_episodes || false,
        ordem: world.ordem || 0,
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        is_root: false,
        has_episodes: false,
        ordem: 0,
      });
    }
  }, [world, isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving world:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!world?.id || !onDelete) return;
    
    if (!confirm("Tem certeza que deseja excluir este mundo? Todas as fichas associadas serão perdidas.")) {
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete(world.id);
      onClose();
    } catch (error) {
      console.error("Error deleting world:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={world ? t.world.edit : t.world.create}
      footer={
        <>
          {world && onDelete && (
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={isDeleting}
              className="mr-auto"
            >
              {t.common.delete}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {t.common.save}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t.world.name}
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Ex: Terra Média, Tatooine"
          required
          fullWidth
        />

        <Textarea
          label={t.world.description}
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Descreva este mundo..."
          fullWidth
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.has_episodes}
            onChange={(e) => setFormData({ ...formData, has_episodes: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-border-light-default dark:border-border-dark-default rounded focus:ring-primary-500"
          />
          <div>
            <span className="font-medium text-text-light-primary dark:text-dark-primary">
              Tem Episódios
            </span>
            <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
              Permite organizar fichas por episódios/capítulos
            </p>
          </div>
        </label>
      </form>
    </Modal>
  );
}
