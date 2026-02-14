'use client';

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { CategoryDropdown } from "@/app/components/ui/CategoryDropdown";
import { GranularidadeDropdown } from "@/app/components/ui/GranularidadeDropdown";
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
  worlds: World[];
  categories: Category[];
  onSave: (ficha: Partial<Ficha>) => Promise<void>;
  onOpenCreateCategory?: () => void;
  mode?: "create" | "edit";
  ficha?: Partial<Ficha> | null;
  preSelectedCategory?: string | null;
}

export function NewFichaModal({
  isOpen,
  onClose,
  universeId,
  universeName,
  worlds,
  categories,
  onSave,
  onOpenCreateCategory,
  mode = "create",
  ficha,
  preSelectedCategory,
}: NewFichaModalProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [formData, setFormData] = useState<any>({
    universe_id: universeId,
    world_id: "",
    episode_id: null, // Changed from episodio (string) to episode_id (UUID)
    titulo: "",
    resumo: "",
    descricao: "",
    conteudo: "",
    // Campos de diegese para Evento
    data_inicio: "",
    data_fim: "",
    granularidade: "",
    camada: "",
  });
  const [availableEpisodes, setAvailableEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategorySlug("");
      setFormData({
        universe_id: universeId,
        world_id: "",
        episode_id: null,
        titulo: "",
        resumo: "",
        descricao: "",
        conteudo: "",
        data_inicio: "",
        data_fim: "",
        granularidade: "",
        camada: "",
      });
    } else if (isOpen && mode === "create" && preSelectedCategory) {
      // Pré-selecionar categoria em modo criação
      setSelectedCategorySlug(preSelectedCategory);
    } else if (isOpen && mode === "edit" && ficha) {
      // Preencher formulário com dados da ficha em modo edição
      setSelectedCategorySlug(ficha.tipo || "");
      setFormData({
        universe_id: universeId,
        world_id: ficha.world_id || "",
        episode_id: ficha.episode_id || null, // Changed from episodio
        titulo: ficha.titulo || "",
        resumo: ficha.resumo || "",
        descricao: ficha.descricao || "",
        conteudo: ficha.conteudo || "",
        data_inicio: ficha.data_inicio || "",
        data_fim: ficha.data_fim || "",
        granularidade: ficha.granularidade_data || "",
        camada: ficha.camada_temporal || "",
      });
    }
  }, [isOpen, universeId, mode, ficha, preSelectedCategory]);

  // Load episodes when world changes
  useEffect(() => {
    if (!formData.world_id) {
      setAvailableEpisodes([]);
      return;
    }

    async function loadEpisodes() {
      try {
        const response = await fetch(`/api/episodes?world_id=${formData.world_id}`);
        
        if (!response.ok) {
          console.error("Error loading episodes:", response.statusText);
          return;
        }

        const data = await response.json();
        const episodes = data.episodes || [];
        
        // Sort by numero (ascending)
        episodes.sort((a: Episode, b: Episode) => a.numero - b.numero);
        
        setAvailableEpisodes(episodes);
      } catch (error) {
        console.error("Error loading episodes:", error);
      }
    }

    loadEpisodes();
  }, [formData.world_id, isOpen]);

  const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);
  const selectedWorld = worlds.find(w => w.id === formData.world_id);
  const selectedEpisode = availableEpisodes.find(e => e.id === formData.episode_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        ...formData,
        tipo: selectedCategorySlug,
      });
      onClose();
    } catch (error) {
      console.error("Error saving ficha:", error);
      alert("Erro ao salvar ficha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Nova Ficha" : "Editar Ficha"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Categoria */}
        <CategoryDropdown
          categories={categories}
          selectedSlug={selectedCategorySlug}
          onSelect={setSelectedCategorySlug}
          onCreateNew={onOpenCreateCategory}
        />

        {/* Universo (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            UNIVERSO
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded border border-gray-300 text-gray-700">
            {universeName}
          </div>
        </div>

        {/* Mundo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MUNDO
          </label>
          <WorldsDropdownSingle
            worlds={worlds}
            selectedId={formData.world_id}
            onSelect={(worldId) =>
              setFormData({ ...formData, world_id: worldId, episode_id: null })
            }
          />
        </div>

        {/* Episódio (novo sistema com UUID) */}
        {availableEpisodes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              EPISÓDIO
            </label>
            <div className="relative">
              <select
                value={formData.episode_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    episode_id: e.target.value || null,
                  })
                }
                className="w-full px-4 py-2 text-left rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary transition-colors appearance-none cursor-pointer hover:bg-light-overlay dark:hover:bg-dark-overlay focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Nenhum episódio</option>
                {availableEpisodes.map((episode) => (
                  <option key={episode.id} value={episode.id}>
                    {episode.numero} {episode.titulo}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light-tertiary dark:text-dark-tertiary pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RESUMO
          </label>
          <Textarea
            placeholder="Digite o resumo..."
            value={formData.resumo}
            onChange={(e) =>
              setFormData({ ...formData, resumo: e.target.value })
            }
            rows={2}
          />
        </div>

        {/* Conteúdo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CONTEÚDO
          </label>
          <Textarea
            placeholder="Digite o conteúdo..."
            value={formData.conteudo}
            onChange={(e) =>
              setFormData({ ...formData, conteudo: e.target.value })
            }
            rows={4}
          />
        </div>

        {/* Campos de Diegese para Evento */}
        {selectedCategory?.slug === "evento" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DATA INÍCIO
                </label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, data_inicio: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DATA FIM
                </label>
                <Input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) =>
                    setFormData({ ...formData, data_fim: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GRANULARIDADE
                </label>
                <GranularidadeDropdown
                  value={formData.granularidade}
                  onSelect={(granularidade) =>
                    setFormData({ ...formData, granularidade })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CAMADA TEMPORAL
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Passado, Presente, Futuro"
                  value={formData.camada}
                  onChange={(e) =>
                    setFormData({ ...formData, camada: e.target.value })
                  }
                />
              </div>
            </div>
          </>
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
            disabled={loading || !selectedCategorySlug || !formData.titulo}
          >
            {loading ? "Salvando..." : mode === "create" ? "Criar Ficha" : "Atualizar Ficha"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
