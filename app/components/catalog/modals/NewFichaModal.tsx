"use client";

import { useState, useEffect } from "react";
import { CustomModal as Modal } from "@/app/components/ui/CustomModal";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { CategoryDropdown } from "@/app/components/ui/CategoryDropdown";
import { GranularidadeDropdown } from "@/app/components/ui/GranularidadeDropdown";
import { CustomDropdown } from "@/app/components/ui/CustomDropdown";

import EditEpisodeModal from "@/app/components/shared/EditEpisodeModal";
import NewEpisodeModal from "@/app/components/shared/NewEpisodeModal";
import { SimpleModal } from "@/app/components/shared/SimpleModal";
import type { World, Ficha, Category } from "@/app/types";
import { getSupabaseClient } from "@/app/lib/supabase/client";

interface Episode {
  id: string;
  numero: number;
  titulo: string;
  world_id: string;
}

interface NewFichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  universeId: string;
  universeName: string;
  mode?: "create" | "edit";
  fichaId?: string;
  onFichaCreated?: () => void;
}

export default function NewFichaModal({
  isOpen,
  onClose,
  universeId,
  universeName,
  mode = "create",
  fichaId,
  onFichaCreated,
}: NewFichaModalProps) {
  const [formData, setFormData] = useState({
    categoria: "Sinopse",
    universe_id: universeId,
    world_id: "",
    titulo: "",
    resumo: "",
    conteudo: "",
    granularidade: "Crescente",
    episode_id: null as string | null,
  });

  const [worlds, setWorlds] = useState<World[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableEpisodes, setAvailableEpisodes] = useState<Episode[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [isCreatingEpisode, setIsCreatingEpisode] = useState(false);
  const [isEditingEpisode, setIsEditingEpisode] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [editingEpisodeName, setEditingEpisodeName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEpisodeId, setDeletingEpisodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseClient();

  // Fetch worlds on mount
  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        const { data } = await supabase
          .from("worlds")
          .select("*")
          .eq("universe_id", universeId);
        if (data) setWorlds(data);
      } catch (err) {
        console.error("Erro ao buscar mundos:", err);
      }
    };
    if (isOpen) fetchWorlds();
  }, [isOpen, universeId]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await supabase.from("categories").select("*");
        if (data) setCategories(data);
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
      }
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  // Fetch episodes when world changes
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!formData.world_id) {
        setAvailableEpisodes([]);
        return;
      }
      try {
        const { data } = await supabase
          .from("episodes")
          .select("*")
          .eq("world_id", formData.world_id)
          .order("numero", { ascending: true });
        if (data) setAvailableEpisodes(data);
      } catch (err) {
        console.error("Erro ao buscar episódios:", err);
      }
    };
    fetchEpisodes();
  }, [formData.world_id]);

  const handleCreateFicha = async () => {
    if (!formData.titulo.trim()) {
      alert("Por favor, preencha o título");
      return;
    }

    setLoading(true);
    try {
      if (mode === "create") {
        const { error } = await supabase.from("fichas").insert([
          {
            categoria: formData.categoria,
            universe_id: formData.universe_id,
            world_id: formData.world_id,
            titulo: formData.titulo,
            resumo: formData.resumo,
            conteudo: formData.conteudo,
            granularidade: formData.granularidade,
            episode_id: formData.episode_id,
          },
        ]);

        if (error) throw error;
        onFichaCreated?.();
        onClose();
      }
    } catch (err) {
      console.error("Erro ao criar ficha:", err);
      alert("Erro ao criar ficha");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEpisode = async () => {
    if (!deletingEpisodeId) return;

    try {
      const { error } = await supabase
        .from("episodes")
        .delete()
        .eq("id", deletingEpisodeId);

      if (error) throw error;

      // Update the available episodes list
      setAvailableEpisodes(
        availableEpisodes.filter((ep) => ep.id !== deletingEpisodeId)
      );

      // Clear selection if the deleted episode was selected
      if (selectedEpisodeId === deletingEpisodeId) {
        setSelectedEpisodeId(null);
        setFormData({
          ...formData,
          episode_id: null,
        });
      }

      setShowDeleteConfirm(false);
      setDeletingEpisodeId(null);
    } catch (err) {
      console.error("Erro ao deletar episódio:", err);
      alert("Erro ao deletar episódio");
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={mode === "create" ? "Nova Ficha" : "Editar Ficha"}
        closeOnEscape={!isCreatingEpisode}
        closeOnBackdrop={!isCreatingEpisode}
      >
        {/* Categoria */}
        <div className="w-full">
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
            CATEGORIA
          </label>
          <Select
            value={formData.categoria}
            onChange={(e) =>
              setFormData({ ...formData, categoria: e.target.value })
            }
            options={categories.map((cat) => ({
              label: cat.label,
              value: cat.label,
            }))}
          />
        </div>

        {/* Universo */}
        <div className="w-full">
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
            UNIVERSO
          </label>
          <Input
            type="text"
            value={universeName}
            disabled
            placeholder="Universo"
          />
        </div>

        {/* Mundo */}
        <div className="w-full">
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
            MUNDO
          </label>
          <Select
            value={formData.world_id}
            onChange={(e) => {
              setFormData({ ...formData, world_id: e.target.value });
              setSelectedEpisodeId(null);
              setFormData((prev) => ({ ...prev, episode_id: null }));
            }}
            options={worlds.map((world) => ({
              label: world.nome,
              value: world.id,
            }))}
            placeholder="Selecione um Mundo"
          />
        </div>

        {/* Episódio (novo sistema com UUID) */}
        {formData.world_id && (
          <CustomDropdown
            label="EPISÓDIO"
            options={availableEpisodes.map((ep) => ({
              id: ep.id,
              label: `Episódio ${ep.numero}: ${ep.titulo}`,
              onEdit: () => {
                setEditingEpisodeId(ep.id);
                setEditingEpisodeName(`${ep.numero}: ${ep.titulo}`);
                setIsEditingEpisode(true);
              },
              onDelete: () => {
                setDeletingEpisodeId(ep.id);
                setShowDeleteConfirm(true);
              },
            }))}
            value={selectedEpisodeId || ""}
            onSelect={(episodeId) => {
              setSelectedEpisodeId(episodeId || null);
              setFormData({
                ...formData,
                episode_id: episodeId || null,
              });
            }}
            onCreateNew={() => {
              setIsCreatingEpisode(true);
            }}
            placeholder="Nenhum episódio"
          />
        )}

        {/* Título */}
        <div className="w-full">
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
            TÍTULO
          </label>
          <Input
            type="text"
            placeholder="Digite o título..."
            value={formData.titulo}
            onChange={(e) =>
              setFormData({ ...formData, titulo: e.target.value })
            }
          />
        </div>

        {/* Resumo */}
        <div className="w-full">
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
            RESUMO
          </label>
          <Textarea
            placeholder="Digite o resumo..."
            value={formData.resumo}
            onChange={(e) =>
              setFormData({ ...formData, resumo: e.target.value })
            }
          />
        </div>

        {/* Conteúdo */}
        <div className="w-full">
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
            CONTEÚDO
          </label>
          <Textarea
            placeholder="Digite o conteúdo..."
            value={formData.conteudo}
            onChange={(e) =>
              setFormData({ ...formData, conteudo: e.target.value })
            }
          />
        </div>

        {/* Granularidade */}
        <div className="w-full">
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
            GRANULARIDADE
          </label>
          <GranularidadeDropdown
            value={formData.granularidade}
            onSelect={(value) =>
              setFormData({ ...formData, granularidade: value })
            }
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateFicha}
            disabled={loading}
            className="bg-primary-500 hover:bg-primary-600"
          >
            {mode === "create" ? "Criar Ficha" : "Salvar Alterações"}
          </Button>
        </div>
      </Modal>

      {/* New Episode Modal */}
      <NewEpisodeModal
        isOpen={isCreatingEpisode}
        onClose={() => setIsCreatingEpisode(false)}
        worldId={formData.world_id}
        universeId={universeId}
        onSave={async (episodeId) => {
          setSelectedEpisodeId(episodeId);
          setFormData({
            ...formData,
            episode_id: episodeId,
          });
          setIsCreatingEpisode(false);
        }}
      />

      {/* Edit Episode Modal */}
      {isEditingEpisode && editingEpisodeId && (
        <EditEpisodeModal
          isOpen={isEditingEpisode}
          onClose={() => setIsEditingEpisode(false)}
          episodeId={editingEpisodeId}
          episodeName={editingEpisodeName}
          onEpisodeUpdated={() => {
            // Refresh episodes
            const fetchEpisodes = async () => {
              if (!formData.world_id) return;
              try {
                const { data } = await supabase
                  .from("episodes")
                  .select("*")
                  .eq("world_id", formData.world_id)
                  .order("numero", { ascending: true });
                if (data) setAvailableEpisodes(data);
              } catch (err) {
                console.error("Erro ao buscar episódios:", err);
              }
            };
            fetchEpisodes();
            setIsEditingEpisode(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <SimpleModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingEpisodeId(null);
        }}
        title="Confirmar Deleção"
      >
        <div className="space-y-4">
          <p className="text-text-light-primary dark:text-dark-primary">
            Tem certeza que deseja deletar este episódio?
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingEpisodeId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteEpisode}
              className="bg-red-500 hover:bg-red-600"
            >
              Deletar
            </Button>
          </div>
        </div>
      </SimpleModal>
    </>
  );
}
