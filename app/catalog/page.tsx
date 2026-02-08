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
import { WorldsDropdown } from "@/app/components/ui/WorldsDropdown";
import { TypesDropdown } from "@/app/components/ui/TypesDropdown";
import { EpisodesDropdown } from "@/app/components/ui/EpisodesDropdown";
import FichaModal from "@/app/components/catalog/FichaModal";
import WorldModal from "@/app/components/projetos/WorldModal";
import CategoryModal from "@/app/components/catalog/CategoryModal";
import ManageCategoriesModal from "@/app/components/catalog/ManageCategoriesModal";
import { NewFichaModal } from "@/app/components/catalog/modals/NewFichaModal";
import FichaCard from "@/app/components/shared/FichaCard";
import FichaViewModal from "@/app/components/shared/FichaViewModal";
import NewConceptRuleModal from "@/app/components/shared/NewConceptRuleModal";
import ConceptRuleViewModal from "@/app/components/shared/ConceptRuleViewModal";

import { useTranslation } from "@/app/lib/hooks/useTranslation";
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
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  const [worlds, setWorlds] = useState<World[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  // Estado episodes removido - sinopses agora são fichas
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorldIds, setSelectedWorldIds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [showWorldFilter, setShowWorldFilter] = useState(false);
  
  // Multiple selection
  const [selectedFichaIds, setSelectedFichaIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Modals
  const [showNewFichaModal, setShowNewFichaModal] = useState(false);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showNewUniverseModal, setShowNewUniverseModal] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState<Universe | null>(null);
  const [newUniverseName, setNewUniverseName] = useState("");
  const [newUniverseDescription, setNewUniverseDescription] = useState("");
  const [isCreatingUniverse, setIsCreatingUniverse] = useState(false);
  
  // Selected items for editing
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingFicha, setViewingFicha] = useState<Ficha | null>(null);
  
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
        }
      }
    };
    
    if (showNewUniverseModal || showManageCategoriesModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showNewUniverseModal, showManageCategoriesModal, isCreatingUniverse]);

  // Load universes on mount
  useEffect(() => {
    loadUniverses();
  }, []);

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
        
        // Set first universe as default
        if (data.universes && data.universes.length > 0) {
          setSelectedUniverseId(data.universes[0].id);
        }
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
        
        // Sinopses agora são fichas tipo 'sinopse', não precisamos carregar episodes separadamente
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error loading catalog:", error);
      toast.error(t.errors.network);
    }
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
    if (selectedEpisodes.length > 0 && (!ficha.episodio || !selectedEpisodes.includes(ficha.episodio))) {
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

  // Get unique episode numbers from fichas filtered by selected world
  // If no world is selected, show all episodes; if a world is selected, show only episodes from that world
  const episodeNumbersFromFichas = (fichas || [])
    .filter(f => {
      // Se nenhum mundo está selecionado, mostrar todos os episódios
      if (selectedWorldIds.length === 0) {
        return !!f.episodio;
      }
      // Se um mundo está selecionado, mostrar apenas episódios desse mundo
      return f.episodio && selectedWorldIds.includes(f.world_id);
    })
    .map(f => f.episodio);
  const uniqueEpisodeNumbers = Array.from(new Set(episodeNumbersFromFichas)).filter((ep): ep is string => !!ep);

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
              variant={showWorldFilter ? "secondary" : "ghost"}
              onClick={() => setShowWorldFilter(!showWorldFilter)}
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
                const confirmed = window.confirm(
                  `Tem certeza que deseja deletar "${name}"?`
                );
                
                if (!confirmed) return;
                
                (async () => {
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
                  }
                })();
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
            />
          </div>

          <div>
            <label className="text-sm font-medium text-light-text dark:text-dark-text mb-2 block">
              Episódios
            </label>
            <EpisodesDropdown
              episodes={uniqueEpisodeNumbers}
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
      />

      <FichaModal
        isOpen={showFichaModal}
        onClose={() => {
          setShowFichaModal(false);
          setSelectedFicha(null);
        }}
        ficha={selectedFicha}
        worlds={worlds}
        categories={categories}
        onSave={async () => {
          loadCatalogData();
          setShowFichaModal(false);
          setSelectedFicha(null);
        }}
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
            try {
              const response = await fetch(`/api/worlds/${id}`, {
                method: "DELETE",
              });

              if (response.ok) {
                toast.success("Mundo deletado com sucesso");
                loadCatalogData();
                setShowWorldModal(false);
                setSelectedWorld(null);
              } else {
                const data = await response.json();
                toast.error(data.error || "Erro ao deletar mundo");
              }
            } catch (error) {
              console.error("Error deleting world:", error);
              toast.error("Erro de rede ao deletar mundo");
            }
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
        onClose={() => setShowManageCategoriesModal(false)}
        universeId={selectedUniverseId}
        onCategoryDeleted={loadCatalogData}
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
