"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  EmptyState,
  Loading,
} from "@/app/components/ui";
import { Header } from "@/app/components/layout/Header";
import { UniverseDropdown } from "@/app/components/ui/UniverseDropdown";
import { ConfirmationModal } from "@/app/components/ui/ConfirmationModal";
import { UniverseDeleteModal } from "@/app/components/ui/UniverseDeleteModal";
import { WorldsDropdown } from "@/app/components/ui/WorldsDropdown";
import { TypesDropdown } from "@/app/components/ui/TypesDropdown";
import { EpisodesDropdown } from "@/app/components/ui/EpisodesDropdown";
// import FichaModal from "@/app/components/catalog/FichaModal"; // Substituído por NewFichaModal
import WorldModal from "@/app/components/projetos/WorldModal";
import CategoryModal from "@/app/components/catalog/CategoryModal";
import ManageCategoriesModal from "@/app/components/catalog/ManageCategoriesModal";
import { NewFichaModal } from "@/app/components/catalog/modals/NewFichaModal";
import FichaCard from "@/app/components/shared/FichaCard";
import FichaViewModal from "@/app/components/shared/FichaViewModal";
import NewConceptRuleModal from "@/app/components/shared/NewConceptRuleModal";
import ConceptRuleViewModal from "@/app/components/shared/ConceptRuleViewModal";
import BulkActionsBar from "@/app/components/catalog/BulkActionsBar";
import { exportAsText, exportAsDoc, exportAsPdf } from "@/app/lib/export/fichas";

import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { useUniverse } from "@/app/lib/contexts/UniverseContext";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";
import type { Universe, World, Ficha, Category } from "@/app/types";

// Componente interno que usa searchParams
function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const supabase = getSupabaseClient();
  const { confirm, ConfirmDialog } = useConfirm();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Data
  const [universes, setUniverses] = useState<Universe[]>([]);
  const { selectedUniverseId, setSelectedUniverseId } = useUniverse();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [episodeMap, setEpisodeMap] = useState<{[key: string]: string}>({}); // Mapa de episode_id para nome
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorldIds, setSelectedWorldIds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [showWorldFilter, setShowWorldFilter] = useState(false);
  
  // Multiple selection
  const [selectedFichaIds, setSelectedFichaIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Modals
  const [showNewFichaModal, setShowNewFichaModal] = useState(false);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [startCreateCategoryDirectly, setStartCreateCategoryDirectly] = useState(false);
  const [showNewUniverseModal, setShowNewUniverseModal] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState<Universe | null>(null);
  const [newUniverseName, setNewUniverseName] = useState("");
  const [newUniverseDescription, setNewUniverseDescription] = useState("");
  const [isCreatingUniverse, setIsCreatingUniverse] = useState(false);
  
  // Confirmation modals
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    isDangerous?: boolean;
  } | null>(null);
  const [showDeleteUniverseModal, setShowDeleteUniverseModal] = useState(false);
  const [universeToDelete, setUniverseToDelete] = useState<{id: string, nome: string} | null>(null);
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  
  // Selected items for editing
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingFicha, setViewingFicha] = useState<Ficha | null>(null);
  
  // Helper functions
  function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { num1, num2, answer: num1 + num2 };
  }

  function handleEditUniverse(universe: Universe) {
    setEditingUniverse(universe);
    setNewUniverseName(universe.nome);
    setNewUniverseDescription(universe.descricao || "");
    setShowNewUniverseModal(true);
  }

  function openCreateCategoryDirectly() {
    setStartCreateCategoryDirectly(true);
    setShowManageCategoriesModal(true);
  }

  function promptDeleteUniverse(universeId: string, universeName: string) {
    const captcha = generateCaptcha();
    setCaptchaQuestion(captcha);
    setCaptchaAnswer("");
    setUniverseToDelete({ id: universeId, nome: universeName });
    setShowDeleteUniverseModal(true);
  }

  async function confirmDeleteUniverse() {
    if (!universeToDelete) return;
    
    if (parseInt(captchaAnswer) !== captchaQuestion.answer) {
      toast.error("Resposta incorreta. Tente novamente.");
      return;
    }

    try {
      const response = await fetch(`/api/universes?id=${universeToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Universo deletado com sucesso");
        setUniverses(universes.filter(u => u.id !== universeToDelete.id));
        if (selectedUniverseId === universeToDelete.id) {
          setSelectedUniverseId("");
          localStorage.removeItem("selectedUniverseId");
        }
        setShowDeleteUniverseModal(false);
        setUniverseToDelete(null);
        setCaptchaAnswer("");
        loadCatalogData();
      } else {
        toast.error(data.error || "Erro ao deletar universo");
      }
    } catch (error) {
      console.error("Error deleting universe:", error);
      toast.error("Erro ao deletar universo");
    }
  }

  // Fechar modais com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNewUniverseModal && !isCreatingUniverse) {
          setShowNewUniverseModal(false);
          setNewUniverseName('');
          setNewUniverseDescription('');
        } else if (showManageCategoriesModal) {
          setShowManageCategoriesModal(false);
        } else if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedFichaIds([]);
        }
      }
    };
    
    if (showNewUniverseModal || showManageCategoriesModal || isSelectionMode) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showNewUniverseModal, showManageCategoriesModal, isCreatingUniverse, isSelectionMode]);

  // Load universes on mount
  useEffect(() => {
    loadUniverses();
  }, []);

  // Set default universe if not already set
  useEffect(() => {
    if (!selectedUniverseId && universes.length > 0) {
      setSelectedUniverseId(universes[0].id);
    }
  }, [universes, selectedUniverseId, setSelectedUniverseId]);

  // Universe is now managed by UniverseContext

  // Load catalog data when universe changes
  useEffect(() => {
    if (selectedUniverseId) {
      loadCatalogData();
    }
  }, [selectedUniverseId]);

  async function loadUniverses() {
    try {
      const response = await fetch("/api/universes");
      const data = await response.json();
      
      if (response.ok) {
        setUniverses(data.universes || []);
        // Don't set default here - let the other useEffect handle it
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error loading universes:", error);
      toast.error(t.errors.network);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCatalogData() {
    try {
      const response = await fetch(`/api/catalog?universeId=${selectedUniverseId}`);
      const data = await response.json();
      
      if (response.ok) {
        setWorlds(data.worlds || []);
        setCategories(data.types || []);
        
        setFichas(data.fichas || []);
        
        // Carregar episódios para criar mapa de episode_id para nome
        try {
          const episodesResponse = await fetch(`/api/episodes`);
          if (episodesResponse.ok) {
            const episodesData = await episodesResponse.json();
            const map: {[key: string]: string} = {};
            (episodesData.episodes || []).forEach((ep: any) => {
              if (ep.numero && ep.titulo) {
                map[ep.id] = `Episódio ${ep.numero} - ${ep.titulo}`;
              }
            });
            setEpisodeMap(map);
          }
        } catch (error) {
          console.error("Error loading episodes:", error);
        }
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error loading catalog:", error);
      toast.error(t.errors.network);
    }
  }

  // Get unique episode IDs from fichas filtered by selected world
  const episodeIdsFromFichas = (fichas || [])
    .filter(f => {
      if (selectedWorldIds.length === 0) {
        return !!f.episode_id;
      }
      return f.episode_id && selectedWorldIds.includes(f.world_id);
    })
    .map(f => f.episode_id);
  const uniqueEpisodeIds = Array.from(new Set(episodeIdsFromFichas)).filter((ep): ep is string => !!ep);
  
  // Mapear episode IDs para nomes formatados (para exibição)
  const episodeNames = uniqueEpisodeIds.map(id => episodeMap[id] || `Episódio ${id}`);
  
  // Criar mapa de nome para ID para o filtro funcionar corretamente
  const episodeNameToIdMap: {[key: string]: string} = {};
  uniqueEpisodeIds.forEach(id => {
    const name = episodeMap[id] || `Episódio ${id}`;
    episodeNameToIdMap[name] = id;
  });
  
  // Converter selectedEpisodes de nomes para IDs para filtro correto
  const selectedEpisodeIds = selectedEpisodes.map(name => episodeNameToIdMap[name] || name).filter(Boolean);
  
  // Debug
  if (selectedEpisodes.length > 0) {
    console.log('DEBUG - selectedEpisodes:', selectedEpisodes);
    console.log('DEBUG - episodeMap:', episodeMap);
    console.log('DEBUG - episodeNameToIdMap:', episodeNameToIdMap);
    console.log('DEBUG - selectedEpisodeIds:', selectedEpisodeIds);
    console.log('DEBUG - fichas count:', fichas.length);
    console.log('DEBUG - fichas with episode_id:', fichas.filter(f => f.episode_id).length);
  }

  // Filter fichas based on selected filters
  const filteredFichas = (fichas || []).filter(ficha => {
    // Search filter
    if (searchTerm && !ficha.titulo?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // World filter
    if (selectedWorldIds.length > 0 && !selectedWorldIds.includes(ficha.world_id)) {
      return false;
    }

    // Type filter
    if (selectedTypes.length > 0 && !selectedTypes.includes(ficha.tipo)) {
      return false;
    }

    // Episode filter
    if (selectedEpisodeIds.length > 0 && (!ficha.episode_id || !selectedEpisodeIds.includes(ficha.episode_id))) {
      return false;
    }

    return true;
  });

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedWorldIds([]);
    setSelectedTypes([]);
    setSelectedEpisodes([]);
  };

  // Toggle type selection
  const toggleTypeSelection = (typeSlug: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeSlug)
        ? prev.filter(t => t !== typeSlug)
        : [...prev, typeSlug]
    );
  };

  // Toggle episode selection
  const toggleEpisodeSelection = (episode: string) => {
    setSelectedEpisodes(prev =>
      prev.includes(episode)
        ? prev.filter(e => e !== episode)
        : [...prev, episode]
    );
  };

  // Toggle world selection
  const toggleWorldSelection = (worldId: string) => {
    setSelectedWorldIds(prev => 
      prev.includes(worldId) 
        ? prev.filter(id => id !== worldId)
        : [...prev, worldId]
    );
  };

  // Bulk export fichas
  const handleBulkExport = async (format: "txt" | "doc" | "pdf") => {
    try {
      const selectedFichas = fichas.filter(f => selectedFichaIds.includes(f.id));
      
      if (selectedFichas.length === 0) {
        toast.error("Nenhuma ficha selecionada");
        return;
      }

      if (format === "txt") {
        exportAsText(selectedFichas);
        toast.success(`${selectedFichas.length} ficha(s) exportada(s) como TXT`);
      } else if (format === "doc") {
        exportAsDoc(selectedFichas);
        toast.success(`${selectedFichas.length} ficha(s) exportada(s) como DOC`);
      } else if (format === "pdf") {
        await exportAsPdf(selectedFichas);
        toast.success(`${selectedFichas.length} ficha(s) exportada(s) como PDF`);
      }
    } catch (error) {
      console.error("Error exporting fichas:", error);
      toast.error("Erro ao exportar fichas");
    }
  };

  // Bulk delete fichas
  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: "Confirmar Exclusao em Massa",
      message: `Tem certeza que deseja excluir ${selectedFichaIds.length} ficha(s)? Esta acao nao pode ser desfeita.`,
      confirmText: "Deletar",
      cancelText: "Cancelar",
      variant: "danger"
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const fichaId of selectedFichaIds) {
        try {
          const response = await fetch(`/api/fichas/${fichaId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} ficha(s) excluida(s) com sucesso`);
        loadCatalogData();
        setSelectedFichaIds([]);
        setIsSelectionMode(false);
      }

      if (errorCount > 0) {
        toast.error(`Erro ao excluir ${errorCount} ficha(s)`);
      }
    } catch (error) {
      console.error("Error deleting fichas:", error);
      toast.error("Erro ao excluir fichas");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text={t.common.loading} />;
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      <Header showNav={true} currentPage="catalog" />
      


      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with buttons */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowNewFichaModal(true)}
              disabled={!selectedUniverseId}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t.ficha.create}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowManageCategoriesModal(true)}
              disabled={!selectedUniverseId}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            >
              Categorias
            </Button>
            
            <Button
              size="sm"
              variant={isSelectionMode ? "secondary" : "ghost"}
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) {
                  setSelectedFichaIds([]);
                }
              }}
              disabled={!selectedUniverseId}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            >
              Selecionar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="text-sm font-medium text-light-text dark:text-dark-text mb-2 block">
              Universo
            </label>
            <UniverseDropdown
              universes={universes}
              selectedId={selectedUniverseId}
              onSelect={setSelectedUniverseId}
              onEdit={handleEditUniverse}
              onDelete={promptDeleteUniverse}
              onCreate={() => {
                setEditingUniverse(null);
                setNewUniverseName("");
                setNewUniverseDescription("");
                setShowNewUniverseModal(true);
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-light-text dark:text-dark-text mb-2 block">
              Mundos
            </label>
            <WorldsDropdown
              worlds={worlds}
              selectedIds={selectedWorldIds}
              onToggle={toggleWorldSelection}
              onEdit={(world) => {
                setSelectedWorld(world);
                setShowWorldModal(true);
              }}
onDelete={(id, name) => {
                setConfirmationModal({
                  isOpen: true,
                  title: "Deletar Mundo",
                  message: `Tem certeza que deseja deletar "${name}"? Esta ação não pode ser desfeita.`,
                  isDangerous: true,
                  onConfirm: async () => {
                    try {
                      const response = await fetch(`/api/worlds?id=${id}`, {
                        method: 'DELETE',
                      });
                      if (response.ok) {
                        toast.success('Mundo deletado com sucesso');
                        loadCatalogData();
                      } else {
                        toast.error('Erro ao deletar mundo');
                      }
                    } catch (error) {
                      toast.error('Erro ao deletar mundo');
                    } finally {
                      setConfirmationModal(null);
                    }
                  },
                });
              }}
              onCreate={() => {
                setSelectedWorld(null);
                setShowWorldModal(true);
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-light-text dark:text-dark-text mb-2 block">
              Categorias
            </label>
            <TypesDropdown
              types={categories}
              selectedSlugs={selectedTypes}
              onToggle={toggleTypeSelection}
              onCreate={() => {
                setStartCreateCategoryDirectly(true);
                setShowManageCategoriesModal(true);
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-light-text dark:text-dark-text mb-2 block">
              Episódios
            </label>
            <EpisodesDropdown
              episodes={episodeNames}
              selectedEpisodes={selectedEpisodes}
              onToggle={toggleEpisodeSelection}
            />
          </div>
        </div>

        {/* Search and clear filters */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t.common.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors whitespace-nowrap"
          >
            Limpar filtros
          </button>
        </div>

        {/* Results count */}
        <div className="mb-6 text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {filteredFichas.length} itens encontrados
        </div>

        {/* Cards grid */}
        {filteredFichas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFichas.map((ficha) => (
              <FichaCard
                key={ficha.id}
                ficha={ficha}
                isSelectionMode={isSelectionMode}
                isSelected={selectedFichaIds.includes(ficha.id)}
                onSelect={(fichaId) => {
                  setSelectedFichaIds((prev) =>
                    prev.includes(fichaId)
                      ? prev.filter((id) => id !== fichaId)
                      : [...prev, fichaId]
                  );
                }}
                onClick={() => {
                  setViewingFicha(ficha);
                  setShowViewModal(true);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum resultado encontrado"
            description="Tente ajustar seus filtros para encontrar o que procura."
          />
        )}
      </div>

      {/* Bulk Actions Bar */}
      {isSelectionMode && selectedFichaIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedFichaIds.length}
          onExport={handleBulkExport}
          onDelete={handleBulkDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* Modals */}
      <NewFichaModal
        isOpen={showNewFichaModal}
        onClose={() => setShowNewFichaModal(false)}
        onSave={async () => {
          loadCatalogData();
          setShowNewFichaModal(false);
        }}
        universeId={selectedUniverseId}
        universeName={universes.find(u => u.id === selectedUniverseId)?.nome || ''}
        worlds={worlds}
        categories={categories}
        onOpenCreateCategory={openCreateCategoryDirectly}
      />

      <NewFichaModal
        isOpen={showFichaModal}
        onClose={() => {
          setShowFichaModal(false);
          setSelectedFicha(null);
        }}
        mode="edit"
        ficha={selectedFicha}
        universeId={selectedUniverseId}
        universeName={universes.find(u => u.id === selectedUniverseId)?.nome || ''}
        worlds={worlds}
        categories={categories}
        onSave={async (fichaData) => {
          try {
            const response = await fetch(`/api/fichas/${selectedFicha?.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(fichaData),
            });
            if (response.ok) {
              toast.success("Ficha atualizada com sucesso");
              loadCatalogData();
              setShowFichaModal(false);
              setSelectedFicha(null);
            } else {
              const data = await response.json();
              toast.error(data.error || "Erro ao atualizar ficha");
            }
          } catch (error) {
            console.error("Error saving ficha:", error);
            toast.error("Erro de rede ao atualizar ficha");
          }
        }}
        onOpenCreateCategory={() => setShowCategoryModal(true)}
      />

      {showWorldModal && (
        <WorldModal
          world={selectedWorld}
          universeId={selectedUniverseId}
          onSave={async (worldData) => {
            try {
              const method = worldData.id ? "PUT" : "POST";
              console.log('[CATALOG] Salvando mundo:', { method, worldData });
              const response = await fetch("/api/worlds", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(worldData),
              });

              const data = await response.json();
              console.log('[CATALOG] Resposta da API:', { status: response.status, data });

              if (response.ok) {
                toast.success(worldData.id ? "Mundo atualizado" : "Mundo criado");
                loadCatalogData();
                setShowWorldModal(false);
                setSelectedWorld(null);
              } else {
                toast.error(data.error || "Erro ao salvar mundo");
              }
            } catch (error) {
              console.error("Error saving world:", error);
              toast.error("Erro de rede ao salvar mundo");
            }
          }}
          onDelete={async (id) => {
            if (!selectedWorld) return;
            setConfirmationModal({
              isOpen: true,
              title: "Deletar Mundo",
              message: `Tem certeza que deseja deletar "${selectedWorld.nome}"? Esta ação não pode ser desfeita.`,
              isDangerous: true,
              onConfirm: async () => {
                try {
                  const response = await fetch(`/api/worlds/${id}`, {
                    method: "DELETE",
                  });

                  if (response.ok) {
                    toast.success("Mundo deletado com sucesso");
                    loadCatalogData();
                    setShowWorldModal(false);
                    setSelectedWorld(null);
                    setConfirmationModal(null);
                  } else {
                    const data = await response.json();
                    toast.error(data.error || "Erro ao deletar mundo");
                  }
                } catch (error) {
                  console.error("Error deleting world:", error);
                  toast.error("Erro de rede ao deletar mundo");
                }
              },
            });
          }}
          onClose={() => {
            setShowWorldModal(false);
            setSelectedWorld(null);
          }}
        />
      )}

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        category={null}
        onSave={async (categoryData) => {
          try {
            console.log('[DEBUG] Salvando categoria:', categoryData);
            console.log('[DEBUG] selectedUniverseId:', selectedUniverseId);
            const response = await fetch('/api/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                universe_id: selectedUniverseId,
                ...categoryData,
              }),
            });
            console.log('[DEBUG] Response status:', response.status);
            const responseData = await response.json();
            console.log('[DEBUG] Response data:', responseData);
            if (!response.ok) {
              toast.error(responseData.error || 'Erro ao criar categoria');
              return;
            }

            toast.success('Categoria criada com sucesso!');
            setShowCategoryModal(false);
            loadCatalogData();
          } catch (error: any) {
            console.error('[DEBUG] Erro ao salvar categoria:', error);
            toast.error(error?.message || 'Erro ao criar categoria');
          }
        }}
      />

      <ManageCategoriesModal
        isOpen={showManageCategoriesModal}
        onClose={() => {
          setShowManageCategoriesModal(false);
          setStartCreateCategoryDirectly(false);
        }}
        universeId={selectedUniverseId}
        onCategoryDeleted={loadCatalogData}
        startWithCreating={startCreateCategoryDirectly}
      />

      <FichaViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingFicha(null);
        }}
        ficha={viewingFicha}
        onEdit={() => {
          setSelectedFicha(viewingFicha);
          setShowViewModal(false);
          setShowFichaModal(true);
        }}
      />

      <ConfirmDialog />

      {/* Confirmation Modal */}
      {confirmationModal && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          title={confirmationModal.title}
          message={confirmationModal.message}
          isDangerous={confirmationModal.isDangerous}
          confirmText="Deletar"
          cancelText="Cancelar"
          onConfirm={confirmationModal.onConfirm}
          onCancel={() => setConfirmationModal(null)}
        />
      )}

      {/* Delete Universe Modal with Captcha */}
      <UniverseDeleteModal
        isOpen={showDeleteUniverseModal}
        universeName={universeToDelete?.nome || ""}
        captchaQuestion={captchaQuestion}
        captchaAnswer={captchaAnswer}
        onCaptchaChange={setCaptchaAnswer}
        onConfirm={confirmDeleteUniverse}
        onCancel={() => {
          setShowDeleteUniverseModal(false);
          setUniverseToDelete(null);
          setCaptchaAnswer("");
        }}
      />
    </div>
  );
}

// Wrapper component with Suspense
export default function Catalog() {
  return (
    <Suspense fallback={<Loading fullScreen />}>
      <CatalogContent />
    </Suspense>
  );
}
