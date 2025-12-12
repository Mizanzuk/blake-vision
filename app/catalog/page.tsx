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
import WorldModal from "@/app/components/catalog/WorldModal";
import CategoryModal from "@/app/components/catalog/CategoryModal";
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

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      loadUniverses();
      
      const saved = localStorage.getItem("selectedUniverseId");
      if (saved) {
        setSelectedUniverseId(saved);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (selectedUniverseId) {
      loadCatalogData();
    }
  }, [selectedUniverseId]);

  // Abrir modal de ficha via parâmetro URL
  useEffect(() => {
    const fichaSlug = searchParams.get('ficha');
    if (fichaSlug && fichas.length > 0 && !showViewModal) {
      // Buscar ficha pelo slug
      const ficha = fichas.find(f => {
        const slug = f.titulo?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
        return slug === fichaSlug;
      });
      
      if (ficha) {
        openViewFichaModal(ficha);
      }
    }
  }, [searchParams, fichas, showViewModal]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUniverses() {
    try {
      const response = await fetch("/api/universes");
      const data = await response.json();
      
      if (response.ok) {
        setUniverses(data.universes || []);
      }
    } catch (error) {
      console.error("Error loading universes:", error);
    }
  }

  async function loadCatalogData() {
    try {
      const response = await fetch(`/api/catalog?universeId=${selectedUniverseId}`);
      const data = await response.json();
      
      if (response.ok) {
        setWorlds(data.worlds || []);
        
        // Adicionar categoria "Sinopse" se houver episodes
        const sinopseCategory: Category = {
          slug: "sinopse",
          universe_id: selectedUniverseId,
          user_id: userId || "",
          label: "Sinopse",
          description: "Sinopses de episódios do universo narrativo",
          prefix: "SIN",
          created_at: new Date().toISOString(),
        };
        const categoriesWithSinopse = [
          sinopseCategory,
          ...(data.types || [])
        ];
        setCategories(categoriesWithSinopse);
        
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

  // Função removida: sinopses agora são fichas tipo 'sinopse'

  function handleUniverseChange(universeId: string) {
    if (universeId === "create_new_universe") {
      setShowNewUniverseModal(true);
      return;
    }
    setSelectedUniverseId(universeId);
    localStorage.setItem("selectedUniverseId", universeId);
    setSelectedWorldIds([]);
    setSelectedTypes([]);
    setSelectedEpisodes([]);
  }

  async function createDefaultSinopseCategory(universeId: string) {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universe_id: universeId,
          slug: "sinopse",
          label: "Sinopse",
          description: "Sinopses de episódios do universo narrativo",
          prefix: "SIN",
        }),
      });
      
      if (!response.ok) {
        console.error("Erro ao criar categoria Sinopse padrão");
      }
    } catch (error) {
      console.error("Erro ao criar categoria Sinopse:", error);
    }
  }

  async function handleCreateUniverse() {
    if (!newUniverseName.trim()) {
      toast.error("Dê um nome ao universo.");
      return;
    }
    if (!userId) {
      toast.error("Usuário não autenticado.");
      return;
    }
    
    setIsCreatingUniverse(true);
    
    try {
      if (editingUniverse) {
        // Update existing universe
        const { data: updated, error: updateError } = await supabase
          .from("universes")
          .update({
            nome: newUniverseName.trim(),
            descricao: newUniverseDescription.trim() || null
          })
          .eq("id", editingUniverse.id)
          .select("*")
          .single();
        
        if (updateError) throw updateError;
        
        if (updated) {
          setUniverses(prev => prev.map(u => u.id === editingUniverse.id ? updated as Universe : u));
          toast.success("Universo atualizado com sucesso.");
        }
      } else {
        // Create new universe
        const { data: inserted, error: insertError } = await supabase
          .from("universes")
          .insert({
            nome: newUniverseName.trim(),
            descricao: newUniverseDescription.trim() || null
          })
          .select("*")
          .single();
        
        if (insertError) throw insertError;
        
        if (inserted) {
          setUniverses(prev => [...prev, inserted as Universe]);
          setSelectedUniverseId(inserted.id);
          localStorage.setItem("selectedUniverseId", inserted.id);
          
          // Criar categoria Sinopse padrão
          await createDefaultSinopseCategory(inserted.id);
          
          toast.success("Novo Universo criado com sucesso.");
        }
      }
      
      setShowNewUniverseModal(false);
      setEditingUniverse(null);
      setNewUniverseName("");
      setNewUniverseDescription("");
    } catch (err) {
      console.error(err);
      toast.error(editingUniverse ? "Erro ao atualizar universo." : "Erro ao criar universo.");
    } finally {
      setIsCreatingUniverse(false);
    }
  }

  function openCreateUniverseModal() {
    setEditingUniverse(null);
    setNewUniverseName("");
    setNewUniverseDescription("");
    setShowNewUniverseModal(true);
  }

  function openEditUniverseModal(universe: Universe) {
    setEditingUniverse(universe);
    setNewUniverseName(universe.nome);
    setNewUniverseDescription(universe.descricao || "");
    setShowNewUniverseModal(true);
  }

  async function handleDeleteUniverse(universeId: string, universeName: string) {
    const confirmed = await confirm({
      title: "Confirmar Exclusão de Universo",
      message: `Tem certeza que deseja deletar o universo "${universeName}"? Todos os mundos e fichas associados serão deletados também. Esta ação não pode ser desfeita.`,
      confirmText: "Deletar Universo",
      cancelText: "Cancelar",
      variant: "danger"
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("universes")
        .delete()
        .eq("id", universeId);

      if (error) throw error;

      setUniverses(prev => prev.filter(u => u.id !== universeId));
      if (selectedUniverseId === universeId) {
        setSelectedUniverseId("");
        localStorage.removeItem("selectedUniverseId");
      }
      toast.success("Universo deletado com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar universo.");
    }
  }

  // Ficha functions
  function openNewFichaModal() {
    setSelectedFicha(null);
    setShowFichaModal(true);
  }

  function openViewFichaModal(ficha: Ficha) {
    setViewingFicha(ficha);
    setShowViewModal(true);
  }

  function handleEditFromView() {
    if (!viewingFicha) return;
    
    setShowViewModal(false);
    
    // Usar modal específico baseado no tipo
    if (viewingFicha.tipo === "conceito" || viewingFicha.tipo === "regra") {
      setSelectedFicha(viewingFicha);
      setShowFichaModal(true);
    } else {
      setSelectedFicha(viewingFicha);
      setShowFichaModal(true);
    }
  }

  function handleCloseViewModal() {
    setShowViewModal(false);
    setViewingFicha(null);
    
    // Remover parâmetro 'ficha' da URL para evitar reabrir o modal
    const url = new URL(window.location.href);
    url.searchParams.delete('ficha');
    window.history.replaceState({}, '', url.toString());
  }

  function handleNextFicha() {
    if (!viewingFicha) return;
    const currentIndex = fichas.findIndex(f => f.id === viewingFicha.id);
    if (currentIndex < fichas.length - 1) {
      setViewingFicha(fichas[currentIndex + 1]);
    }
  }

  function handlePreviousFicha() {
    if (!viewingFicha) return;
    const currentIndex = fichas.findIndex(f => f.id === viewingFicha.id);
    if (currentIndex > 0) {
      setViewingFicha(fichas[currentIndex - 1]);
    }
  }

  async function handleSaveFicha(fichaData: any) {
    try {
      const url = selectedFicha ? "/api/fichas" : "/api/fichas";
      const method = selectedFicha ? "PUT" : "POST";
      
      const dataToSend = selectedFicha 
        ? { ...fichaData, id: selectedFicha.id }
        : fichaData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(selectedFicha ? t.success.updated : t.success.created);
        loadCatalogData();
        setShowFichaModal(false);
        setSelectedFicha(null);
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error saving ficha:", error);
      toast.error(t.errors.network);
    }
  }

  async function handleDeleteFicha(fichaId: string) {
    try {
      const response = await fetch(`/api/fichas?id=${fichaId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t.success.deleted);
        loadCatalogData();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error deleting ficha:", error);
      toast.error(t.errors.network);
    }
  }

  // World functions
  function openNewWorldModal() {
    setSelectedWorld(null);
    setShowWorldModal(true);
  }

  function openEditWorldModal(world: World) {
    setSelectedWorld(world);
    setShowWorldModal(true);
  }

  async function handleSaveWorld(worldData: any) {
    try {
      const url = "/api/worlds";
      const method = selectedWorld ? "PUT" : "POST";
      
      const dataToSend = selectedWorld 
        ? { ...worldData, id: selectedWorld.id }
        : { ...worldData, universe_id: selectedUniverseId };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(selectedWorld ? t.success.updated : t.success.created);
        loadCatalogData();
        setShowWorldModal(false);
        setSelectedWorld(null);
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error saving world:", error);
      toast.error(t.errors.network);
    }
  }

  async function handleDeleteWorld(worldId: string) {
    try {
      const response = await fetch(`/api/worlds?id=${worldId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t.success.deleted);
        loadCatalogData();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error deleting world:", error);
      toast.error(t.errors.network);
    }
  }

  // Category functions
  function openNewCategoryModal() {
    setSelectedCategory(null);
    setShowCategoryModal(true);
  }

  function openEditCategoryModal(category: Category) {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  }

  async function handleSaveCategory(categoryData: any) {
    try {
      const url = "/api/categories";
      const method = selectedCategory ? "PUT" : "POST";
      
      const dataToSend = selectedCategory 
        ? { ...categoryData, universe_id: selectedUniverseId }
        : { ...categoryData, universe_id: selectedUniverseId };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(selectedCategory ? t.success.updated : t.success.created);
        loadCatalogData();
        setShowCategoryModal(false);
        setSelectedCategory(null);
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(t.errors.network);
    }
  }

  async function handleDeleteCategory(slug: string) {
    try {
      const response = await fetch(`/api/categories?universe_id=${selectedUniverseId}&slug=${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t.success.deleted);
        loadCatalogData();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(t.errors.network);
    }
  }

  // Filter fichas
  const filteredFichas = fichas.filter(ficha => {
    if (searchTerm && !ficha.titulo.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedWorldIds.length > 0 && !selectedWorldIds.includes(ficha.world_id)) {
      return false;
    }
    if (selectedTypes.length > 0 && !selectedTypes.includes(ficha.tipo)) {
      return false;
    }
    if (selectedEpisodes.length > 0 && ficha.episodio && !selectedEpisodes.includes(ficha.episodio)) {
      return false;
    }
    return true;
  });

  // Sinopses agora são fichas tipo 'sinopse'
  const totalItems = filteredFichas.length;

  // Use filtered fichas directly (no custom ordering)
  const sortedFichas = filteredFichas;

  // Toggle world selection
  const toggleWorldSelection = (worldId: string) => {
    setSelectedWorldIds(prev => 
      prev.includes(worldId) 
        ? prev.filter(id => id !== worldId)
        : [...prev, worldId]
    );
  };

  // Get unique episode numbers from fichas (sinopses agora são fichas tipo 'sinopse')
  const episodeNumbersFromFichas = fichas.filter(f => f.episodio).map(f => f.episodio);
  const uniqueEpisodeNumbers = Array.from(new Set(episodeNumbersFromFichas));

  if (isLoading) {
    return <Loading fullScreen text={t.common.loading} />;
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      <Header showNav={true} currentPage="catalog" />
      


      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* All Dropdowns in one row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <UniverseDropdown
            label="UNIVERSO"
            universes={universes}
            selectedId={selectedUniverseId}
            onSelect={setSelectedUniverseId}
            onEdit={openEditUniverseModal}
            onDelete={handleDeleteUniverse}
            onCreate={openCreateUniverseModal}
          />
          
          <WorldsDropdown
            label="MUNDOS"
            worlds={worlds}
            selectedIds={selectedWorldIds}
            onToggle={toggleWorldSelection}
            onEdit={openEditWorldModal}
            onDelete={handleDeleteWorld}
            onCreate={openNewWorldModal}
            disabled={!selectedUniverseId}
          />
          
          <TypesDropdown
            label="CATEGORIAS"
            types={categories}
            selectedSlugs={selectedTypes}
            onToggle={(slug) => {
              setSelectedTypes(prev => 
                prev.includes(slug) 
                  ? prev.filter(s => s !== slug)
                  : [...prev, slug]
              );
            }}
            onEdit={(category) => {
              setSelectedCategory(category);
              setShowCategoryModal(true);
            }}
            onDelete={async (slug, nome) => {
              const confirmed = await confirm({
                title: "Confirmar Exclusão de Categoria",
                message: `Tem certeza que deseja apagar a categoria "${nome}"? Esta ação não pode ser desfeita.`,
                confirmText: "Deletar",
                cancelText: "Cancelar",
                variant: "danger"
              });
              if (confirmed) {
                handleDeleteCategory(slug);
              }
            }}
            onCreate={() => setShowManageCategoriesModal(true)}
          />
          
          <EpisodesDropdown
            label="EPISÓDIOS"
            episodes={uniqueEpisodeNumbers.filter(e => e) as string[]}
            selectedEpisodes={selectedEpisodes}
            onToggle={(episode) => {
              setSelectedEpisodes(prev => 
                prev.includes(episode) 
                  ? prev.filter(e => e !== episode)
                  : [...prev, episode]
              );
            }}
            onCreate={() => {
              const episodeName = prompt("Nome do novo episódio:");
              if (episodeName) {
                // TODO: Implementar criação de episódio no banco
                alert("Funcionalidade em desenvolvimento");
              }
            }}
          />
        </div>

        {selectedUniverseId ? (
          <>
            {/* Search, Counter and Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
              {/* Search Input */}
              <div className="relative flex-1 w-full max-w-md">
                <Input
                  placeholder={t.common.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
              
              {/* Item Count and Clear Filters */}
              <div className="flex items-center gap-4">
                {/* Results Counter Box */}
                <div className="px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised">
                  <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary whitespace-nowrap">
                    {totalItems} {totalItems === 1 ? "item encontrado" : "itens encontrados"}
                  </p>
                </div>
                
                {/* Clear Filters Button */}
                <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedWorldIds([]);
                  setSelectedTypes([]);
                  setSelectedEpisodes([]);
                }}
                className="px-3 py-2 text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors whitespace-nowrap"
              >
                Limpar filtros
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mb-6">
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
                  setSelectedFichaIds([]);
                }}
                disabled={!selectedUniverseId || fichas.length === 0}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              >
                {isSelectionMode ? "Cancelar Seleção" : "Selecionar"}
              </Button>
              
              <Button
                size="sm"
                variant="primary"
                onClick={openNewFichaModal}
                disabled={!selectedUniverseId}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                {t.ficha.create}
              </Button>
            </div>

            {/* Selection Actions Bar - Above fichas grid */}
            {isSelectionMode && selectedFichaIds.length > 0 && (
              <div className="mb-6 px-6 py-4 rounded-lg border border-border-light-default dark:border-border-dark-default bg-primary-50 dark:bg-primary-900/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {selectedFichaIds.length} {selectedFichaIds.length === 1 ? "ficha selecionada" : "fichas selecionadas"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Export selected fichas
                        const selectedFichas = fichas.filter(f => selectedFichaIds.includes(f.id));
                        const dataStr = JSON.stringify(selectedFichas, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `fichas_${new Date().toISOString().split('T')[0]}.json`;
                        link.click();
                        toast.success(`${selectedFichaIds.length} fichas exportadas`);
                      }}
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      }
                    >
                      Exportar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Confirmar Exclusão Múltipla",
                          message: `Tem certeza que deseja apagar ${selectedFichaIds.length} fichas? Esta ação não pode ser desfeita.`,
                          confirmText: "Deletar Todas",
                          cancelText: "Cancelar",
                          variant: "danger"
                        });
                        if (confirmed) {
                          for (const id of selectedFichaIds) {
                            await handleDeleteFicha(id);
                          }
                          setSelectedFichaIds([]);
                          setIsSelectionMode(false);
                          toast.success(`${selectedFichaIds.length} fichas apagadas`);
                        }
                      }}
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      }
                    >
                      Apagar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Fichas Grid */}
            {totalItems === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title={t.ficha.noFichas}
                description={t.ficha.createFirst}
                action={
                  <Button variant="primary" onClick={openNewFichaModal}>
                    {t.ficha.create}
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Fichas */}
                {sortedFichas.map(ficha => (
                  <div key={ficha.id} className={`relative ${isSelectionMode && selectedFichaIds.includes(ficha.id) ? 'ring-2 ring-primary-500 rounded-lg' : ''}`}>
                    {/* Checkbox for selection mode */}
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2 z-50">
                        <input
                          type="checkbox"
                          checked={selectedFichaIds.includes(ficha.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (selectedFichaIds.includes(ficha.id)) {
                              setSelectedFichaIds(selectedFichaIds.filter(id => id !== ficha.id));
                            } else {
                              setSelectedFichaIds([...selectedFichaIds, ficha.id]);
                            }
                          }}
                          className="w-5 h-5 rounded border-border-light-default dark:border-border-dark-default text-primary-500 focus:ring-primary-500 cursor-pointer"
                        />
                      </div>
                    )}
                    <FichaCard
                      ficha={ficha}
                      onClick={() => !isSelectionMode && openViewFichaModal(ficha)}
                      worldName={ficha.world_id ? worlds.find(w => w.id === ficha.world_id)?.nome : undefined}
                    />
                  </div>
                ))}

              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title={t.universe.noUniverses}
            description="Selecione um universo para visualizar o catálogo"
          />
        )}
      </div>

      {/* Modals */}
      {/* Modal para Conceitos e Regras */}
      <NewConceptRuleModal
        isOpen={showFichaModal && selectedFicha !== null && (selectedFicha.tipo === "conceito" || selectedFicha.tipo === "regra")}
        item={selectedFicha}
        tipo={(selectedFicha?.tipo as "conceito" | "regra") || "conceito"}
        universes={universes}
        worlds={worlds}
        onSave={handleSaveFicha}
        onDelete={handleDeleteFicha}
        onClose={() => {
          setShowFichaModal(false);
          setSelectedFicha(null);
        }}
      />

      {/* Modal para outras categorias */}
      {showFichaModal && (!selectedFicha || (selectedFicha.tipo !== "conceito" && selectedFicha.tipo !== "regra")) && (
        <FichaModal
          isOpen={showFichaModal}
          onClose={() => {
            setShowFichaModal(false);
            setSelectedFicha(null);
          }}
          ficha={selectedFicha}
          worlds={worlds}
          categories={categories}
          onSave={handleSaveFicha}
          onDelete={selectedFicha ? handleDeleteFicha : undefined}
        />
      )}

      <WorldModal
        isOpen={showWorldModal}
        onClose={() => {
          setShowWorldModal(false);
          setSelectedWorld(null);
        }}
        world={selectedWorld}
        onSave={handleSaveWorld}
        onDelete={selectedWorld ? handleDeleteWorld : undefined}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSave={handleSaveCategory}
        onDelete={selectedCategory ? handleDeleteCategory : undefined}
      />

      {/* View Modal - Conceitos e Regras */}
      {showViewModal && viewingFicha && (viewingFicha.tipo === "conceito" || viewingFicha.tipo === "regra") && (
        <ConceptRuleViewModal
          ficha={viewingFicha}
          universes={universes}
          worlds={worlds}
          onClose={handleCloseViewModal}
          onEdit={handleEditFromView}
        />
      )}

      {/* View Modal - Outras fichas */}
      {showViewModal && viewingFicha && viewingFicha.tipo !== "conceito" && viewingFicha.tipo !== "regra" && (
        <FichaViewModal
          isOpen={showViewModal}
          onClose={handleCloseViewModal}
          ficha={viewingFicha}
          onEdit={handleEditFromView}
          onNext={handleNextFicha}
          onPrevious={handlePreviousFicha}
          hasNext={viewingFicha ? fichas.findIndex(f => f.id === viewingFicha.id) < fichas.length - 1 : false}
          hasPrevious={viewingFicha ? fichas.findIndex(f => f.id === viewingFicha.id) > 0 : false}
        />
      )}

      {/* Manage Categories Modal */}
      {showManageCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-light-raised dark:bg-dark-raised rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                Gerenciar Categorias
              </h2>
              <button
                onClick={() => setShowManageCategoriesModal(false)}
                className="p-2 rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setShowManageCategoriesModal(false);
                openNewCategoryModal();
              }}
              className="mb-4"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nova Categoria
            </Button>

            <div className="space-y-2">
              {categories.map(category => (
                <div
                  key={category.slug}
                  className="flex items-center justify-between p-4 rounded-lg bg-light-base dark:bg-dark-base border border-border-light-default dark:border-border-dark-default"
                >
                  <div>
                    <h3 className="font-semibold text-text-light-primary dark:text-dark-primary">
                      {category.label}
                    </h3>
                    <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                      {category.slug} {category.prefix && `• ${category.prefix}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowManageCategoriesModal(false);
                      openEditCategoryModal(category);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Universo */}
      {showNewUniverseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowNewUniverseModal(false)}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              handleCreateUniverse();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border border-border-light-default dark:border-border-dark-default rounded-lg p-6 bg-light-base dark:bg-dark-base space-y-4 mx-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingUniverse ? "Editar Universo" : "Novo Universo"}</h3>
              <button
                type="button"
                onClick={() => setShowNewUniverseModal(false)}
                className="text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Nome do Universo</label>
              <Input
                value={newUniverseName}
                onChange={(e) => setNewUniverseName(e.target.value)}
                placeholder="Ex: Antiverso"
                fullWidth
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Descrição</label>
              <textarea
                className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm min-h-[100px]"
                value={newUniverseDescription}
                onChange={(e) => setNewUniverseDescription(e.target.value)}
                placeholder="Resumo do Universo…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => setShowNewUniverseModal(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                type="submit"
                variant="primary"
                disabled={isCreatingUniverse}
              >
                {isCreatingUniverse ? (editingUniverse ? "Salvando..." : "Criando...") : "Salvar"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de confirmação */}
      <ConfirmDialog />
    </div>
  );
}

// Componente principal com Suspense
export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light-base dark:bg-dark-base flex items-center justify-center">
        <Loading size="lg" />
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
