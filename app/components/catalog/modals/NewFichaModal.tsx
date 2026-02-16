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
import { EpisodioDropdown } from "@/app/components/ui/EpisodioDropdown";

import EditEpisodeModal from "@/app/components/shared/EditEpisodeModal";
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
  onOpenCreateEpisode?: (worldId: string, universeId: string) => void;
  onEditEpisode?: (episodeId: string, episodeName: string) => void;
  onDeleteEpisode?: (episodeId: string) => Promise<void>;
  onEpisodeCreated?: (newEpisodeId: string) => void;
  lastCreatedEpisodeId?: string | null;
  episodeCreationTrigger?: number;
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
  onOpenCreateEpisode,
  onEditEpisode,
  onDeleteEpisode,
  onEpisodeCreated,
  lastCreatedEpisodeId,
  episodeCreationTrigger,
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
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [editingEpisodeName, setEditingEpisodeName] = useState<string>("");

  // Atualizar categorias locais quando as props mudam
  useEffect(() => {
    if (categories && categories.length > 0) {
      setLocalCategories(categories);
    }
  }, [categories]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategorySlug("");
      setEditingEpisodeId(null);
      setEditingEpisodeName("");
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
      // Encontrar o slug da categoria que corresponde ao tipo
      const matchingCategory = categories.find(
        c => c.slug === ficha.tipo || c.label?.toLowerCase() === ficha.tipo?.toLowerCase()
      );
      // Se encontrou a categoria, use o slug; senão, use o tipo como fallback
      // O tipo vem em minúsculas da IA (ex: "personagem", "conceito", "local", etc)
      const categorySlug = matchingCategory?.slug || ficha.tipo || "";
      setSelectedCategorySlug(categorySlug);
      setSelectedEpisodeId(ficha.episode_id || null);
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
  }, [isOpen, universeId, mode, ficha, preSelectedCategory, categories, isOpen]);
  
  // Carregar categorias quando o modal é aberto
  useEffect(() => {
    async function loadCategoriesIfNeeded() {
      if (isOpen && universeId && categories.length === 0) {
        try {
          const response = await fetch(`/api/categories?universeId=${universeId}`);
          if (response.ok) {
            const data = await response.json();
            // As categorias serão passadas via props, então não precisamos fazer nada aqui
            // Este useEffect é apenas para garantir que as categorias sejam carregadas
          }
        } catch (error) {
          console.error('Error loading categories:', error);
        }
      }
    }
    loadCategoriesIfNeeded();
  }, [isOpen, universeId]);
  
  // Quando as categorias são carregadas após o modal ser aberto, atualizar o selectedCategorySlug
  useEffect(() => {
    if (isOpen && mode === "edit" && ficha && categories.length > 0) {
      const matchingCategory = categories.find(
        c => c.slug === ficha.tipo || c.label?.toLowerCase() === ficha.tipo?.toLowerCase()
      );
      if (matchingCategory) {
        setSelectedCategorySlug(matchingCategory.slug);
      } else if (ficha.tipo) {
        // Se nao encontrou, use o tipo como fallback
        setSelectedCategorySlug(ficha.tipo);
      }
    }
  }, [categories, isOpen, mode, ficha]);
  


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
  }, [formData.world_id, isOpen, episodeCreationTrigger]);

  // Handle newly created episode
  useEffect(() => {
    if (lastCreatedEpisodeId && formData.world_id && episodeCreationTrigger) {
      // Reload episodes first
      const loadAndSelect = async () => {
        try {
          const response = await fetch(`/api/episodes?world_id=${formData.world_id}`);
          if (response.ok) {
            const data = await response.json();
            const episodes = data.episodes || [];
            episodes.sort((a: Episode, b: Episode) => a.numero - b.numero);
            setAvailableEpisodes(episodes);
          }
        } catch (error) {
          console.error("Error reloading episodes:", error);
        }
        
        // Then select the new episode
        setSelectedEpisodeId(lastCreatedEpisodeId);
        setFormData((prev: any) => ({
          ...prev,
          episode_id: lastCreatedEpisodeId,
        }));
      };
      
      loadAndSelect();
    }
  }, [lastCreatedEpisodeId, episodeCreationTrigger, formData.world_id]);

  const handleEpisodeCreated = async (newEpisodeId: string) => {
    if (formData.world_id) {
      try {
        const response = await fetch(`/api/episodes?world_id=${formData.world_id}`);
        if (response.ok) {
          const data = await response.json();
          const episodes = data.episodes || [];
          episodes.sort((a: Episode, b: Episode) => a.numero - b.numero);
          setAvailableEpisodes(episodes);
          
          setSelectedEpisodeId(newEpisodeId);
          setFormData((prev: any) => ({
            ...prev,
            episode_id: newEpisodeId,
          }));
        }
      } catch (error) {
        console.error("Error reloading episodes:", error);
      }
    }
    
    if (onEpisodeCreated) {
      onEpisodeCreated(newEpisodeId);
    }
  };

  const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);
  const selectedWorld = worlds.find(w => w.id === formData.world_id);
  const selectedEpisode = Array.isArray(availableEpisodes) ? availableEpisodes.find(e => e.id === formData.episode_id) : undefined;

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
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Nova Ficha" : "Editar Ficha"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Categoria */}
        <div>
          <CategoryDropdown
            label="CATEGORIA"
            categories={localCategories}
            selectedSlug={selectedCategorySlug}
            onSelect={setSelectedCategorySlug}
            onCreateNew={onOpenCreateCategory}
          />
        </div>

        {/* Universo (read-only) */}
        <div>
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
            UNIVERSO
          </label>
          <div className="px-4 py-2 bg-light-raised dark:bg-dark-raised rounded-lg border border-border-light-default dark:border-border-dark-default text-sm text-text-light-primary dark:text-dark-primary">
            {universeName}
          </div>
        </div>

        {/* Mundo */}
        <div>
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
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
        {formData.world_id && (
          <EpisodioDropdown
            label="EPISÓDIO"
            episodes={availableEpisodes.map(ep => ({
              id: ep.id,
              numero: ep.numero,
              titulo: ep.titulo,
            }))}
            selectedId={selectedEpisodeId || ""}
            onSelect={(episodeId) => {
              setSelectedEpisodeId(episodeId || null);
              setFormData({
                ...formData,
                episode_id: episodeId || null,
              });
            }}
            onCreate={(worldId, universeId) => {
              onOpenCreateEpisode?.(worldId, universeId);
            }}
            onEpisodeCreated={handleEpisodeCreated}
            worldId={formData.world_id}
            universeId={formData.universe_id}
            onEdit={(episodeId, episodeName) => {
              setEditingEpisodeId(episodeId);
              setEditingEpisodeName(episodeName);
            }}
              onDelete={onDeleteEpisode}
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
            className="w-full"
          />
        </div>

        {/* Resumo */}
        <div>
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
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
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
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
                <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
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
                <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
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
                <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
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
                <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
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

      <EditEpisodeModal
        isOpen={editingEpisodeId !== null}
        episodeId={editingEpisodeId || ""}
        episodeName={editingEpisodeName}
        onClose={() => {
          setEditingEpisodeId(null);
          setEditingEpisodeName("");
        }}
        onSave={async (episodeId, newNumber, newTitle) => {
          try {
            const response = await fetch(`/api/episodes`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: episodeId, titulo: newTitle }),
            });
            if (!response.ok) throw new Error("Erro ao salvar episodio");
            
            if (formData.world_id) {
              const episodesResponse = await fetch(
                `/api/episodes?world_id=${formData.world_id}`
              );
              if (episodesResponse.ok) {
                const data = await episodesResponse.json();
                setAvailableEpisodes(data.episodes || []);
              }
            }
          } catch (error) {
            console.error("Erro ao salvar episodio:", error);
            throw error;
          }
        }}
      />
    </Modal>
    </>
  );
}
