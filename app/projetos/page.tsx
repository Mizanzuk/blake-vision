"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { useUniverse } from "@/app/lib/contexts/UniverseContext";
import { Header } from "@/app/components/layout/Header";
import { Button, Loading, EmptyState } from "@/app/components/ui";
import { UniverseDropdown } from "@/app/components/ui/UniverseDropdown";
import { ConfirmationModal } from "@/app/components/ui/ConfirmationModal";
import { UniverseDeleteModal } from "@/app/components/ui/UniverseDeleteModal";
import { useConfirm } from "@/hooks/useConfirm";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";

import { NewFichaModal } from "@/app/components/catalog/modals/NewFichaModal";
import WorldModal from "@/app/components/projetos/WorldModal";
import EpisodeModal from "@/app/components/projetos/EpisodeModal";
import FichaCard from "@/app/components/shared/FichaCard";
import FichaViewModal from "@/app/components/shared/FichaViewModal";
import { CategoryDropdown } from "@/app/components/ui/CategoryDropdown";
import OrdenacaoDropdown from "@/app/components/projetos/OrdenacaoDropdown";
import TipoDropdown from "@/app/components/projetos/TipoDropdown";
import type { Universe, World, Ficha, Category } from "@/app/types";
import { toast } from "sonner";



export default function ProjetosPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [isLoading, setIsLoading] = useState(true);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [allWorlds, setAllWorlds] = useState<World[]>([]);
  const { selectedUniverseId, setSelectedUniverseId } = useUniverse();
  const [selectedWorldId, setSelectedWorldId] = useState<string>("");
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [ordenacao, setOrdenacao] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Modals
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<any | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDangerous: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [fichaToDelete, setFichaToDelete] = useState<Ficha | null>(null);
  const [viewingFicha, setViewingFicha] = useState<Ficha | null>(null);
  const [showNewUniverseModal, setShowNewUniverseModal] = useState(false);
  const [newUniverseName, setNewUniverseName] = useState("");
  const [newUniverseDescription, setNewUniverseDescription] = useState("");
  const [isCreatingUniverse, setIsCreatingUniverse] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [showEditUniverseModal, setShowEditUniverseModal] = useState(false);
  const [preSelectedCategory, setPreSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function loadCategories() {
    if (!selectedUniverseId) return;
    try {
      const response = await fetch(`/api/categories?universeId=${selectedUniverseId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  useEffect(() => {
    loadUniverses();
    loadAllWorlds();
    
    const savedWorld = localStorage.getItem("selectedWorldId");
    if (savedWorld) {
      setSelectedWorldId(savedWorld);
    }
  }, []);

  // Universe changes are now handled by UniverseContext
  useEffect(() => {
    if (selectedUniverseId) {
      loadWorlds();
      loadCategories();
    } else {
      setWorlds([]);
      setSelectedWorldId("");
      setFichas([]);
      setCategories([]);
    }
  }, [selectedUniverseId]);

  useEffect(() => {
    if (selectedUniverseId) {
      loadFichas();
    } else {
      setFichas([]);
    }
  }, [selectedUniverseId, selectedWorldId, selectedTipos, ordenacao]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
    } catch (error) {
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

  async function loadAllWorlds() {
    try {
      const response = await fetch("/api/worlds");
      const data = await response.json();
      
      if (response.ok) {
        setAllWorlds(data.worlds || []);
      }
    } catch (error) {
      console.error("Error loading all worlds:", error);
    }
  }

  async function loadWorlds() {
    try {
      const response = await fetch(`/api/worlds?universeId=${selectedUniverseId}`);
      const data = await response.json();
      
      if (response.ok) {
        setWorlds(data.worlds || []);
      }
    } catch (error) {
      console.error("Error loading worlds:", error);
    }
  }

  async function loadFichas() {
    try {
      let url = `/api/catalog?universeId=${selectedUniverseId}`;
      
      if (selectedWorldId) {
        url += `&worldId=${selectedWorldId}`;
      }
      
      if (selectedTipos.length > 0) {
        url += `&tipo=${selectedTipos.join(',')}`;
      } else {
        // Load conceitos, regras e sinopses
        url += `&tipo=conceito,regra,sinopse`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        // Sort by type and then by title/episode
        const sortedFichas = (data.fichas || []).sort((a: Ficha, b: Ficha) => {
          // First sort by type
          const typeOrder = { sinopse: 1, conceito: 2, regra: 3 };
          const typeA = typeOrder[a.tipo as keyof typeof typeOrder] || 999;
          const typeB = typeOrder[b.tipo as keyof typeof typeOrder] || 999;
          
          if (typeA !== typeB) {
            return typeA - typeB;
          }
          
          // For sinopses, sort by episode number
          if (a.tipo === "sinopse" && b.tipo === "sinopse") {
            const numA = parseInt(a.episodio || "0");
            const numB = parseInt(b.episodio || "0");
            return numA - numB;
          }
          
          // Otherwise by title
          return (a.titulo || "").localeCompare(b.titulo || "");
        });
        setFichas(sortedFichas);
      }
    } catch (error) {
      console.error("Error loading fichas:", error);
    }
  }

  function handleUniverseChange(universeId: string) {
    setSelectedUniverseId(universeId);
    localStorage.setItem("selectedUniverseId", universeId);
    setSelectedWorldId("");
    localStorage.removeItem("selectedWorldId");
  }

  function openCreateUniverseModal() {
    setSelectedUniverse(null);
    setNewUniverseName("");
    setNewUniverseDescription("");
    setShowNewUniverseModal(true);
  }

  function handleEditUniverse(universe: Universe) {
    setSelectedUniverse(universe);
    setNewUniverseName(universe.nome);
    setNewUniverseDescription(universe.descricao || "");
    setShowEditUniverseModal(true);
  }

  async function handleDeleteUniverse(id: string, name: string) {
    const confirmed = await confirm({
      title: "Deletar Universo",
      message: `Tem certeza que deseja deletar o universo "${name}"? Esta ação não pode ser desfeita.`,
      confirmText: "Deletar",
      cancelText: "Cancelar",
      variant: "danger"
    });
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("universes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setUniverses(prev => prev.filter(u => u.id !== id));
      if (selectedUniverseId === id) {
        setSelectedUniverseId("");
        localStorage.removeItem("selectedUniverseId");
      }
      toast.success("Universo deletado com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar universo.");
    }
  }

  async function handleUpdateUniverse() {
    if (!newUniverseName.trim()) {
      toast.error("Dê um nome ao universo.");
      return;
    }
    
    if (!selectedUniverse) return;
    
    setIsCreatingUniverse(true);
    
    try {
      const { data: updated, error: updateError } = await supabase
        .from("universes")
        .update({
          nome: newUniverseName.trim(),
          descricao: newUniverseDescription.trim() || null
        })
        .eq("id", selectedUniverse.id)
        .select("*")
        .single();
      
      if (updateError) throw updateError;
      
      if (updated) {
        setUniverses(prev => prev.map(u => u.id === selectedUniverse.id ? (updated as Universe) : u));
        toast.success("Universo atualizado com sucesso.");
      }
      
      setShowEditUniverseModal(false);
      setSelectedUniverse(null);
      setNewUniverseName("");
      setNewUniverseDescription("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar universo.");
    } finally {
      setIsCreatingUniverse(false);
    }
  }

  async function handleCreateUniverse() {
    if (!newUniverseName.trim()) {
      toast.error("Dê um nome ao universo.");
      return;
    }
    
    setIsCreatingUniverse(true);
    
    try {
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
        toast.success("Novo Universo criado com sucesso.");
      }
      
      setShowNewUniverseModal(false);
      setNewUniverseName("");
      setNewUniverseDescription("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar universo.");
    } finally {
      setIsCreatingUniverse(false);
    }
  }

  function handleWorldChange(worldId: string) {
    setSelectedWorldId(worldId);
    if (worldId) {
      localStorage.setItem("selectedWorldId", worldId);
    } else {
      localStorage.removeItem("selectedWorldId");
    }
  }

  function handleTipoToggle(tipo: string) {
    setSelectedTipos(prev => {
      if (prev.includes(tipo)) {
        return prev.filter(t => t !== tipo);
      } else {
        return [...prev, tipo];
      }
    });
  }



  function handleNewFicha(tipo: "sinopse" | "conceito" | "regra") {
    if (!selectedUniverseId) {
      toast.error("Selecione um universo antes de criar");
      return;
    }
    
    setPreSelectedCategory(tipo);
    setSelectedFicha(null);
    setShowFichaModal(true);
  }

  function handleViewFicha(ficha: Ficha) {
    setViewingFicha(ficha);
    setShowViewModal(true);
  }

  function handleEditFromView() {
    if (!viewingFicha) return;
    
    setShowViewModal(false);
    
    if (viewingFicha.tipo === "sinopse" || viewingFicha.tipo === "conceito" || viewingFicha.tipo === "regra") {
      setPreSelectedCategory(viewingFicha.tipo);
      setSelectedFicha(viewingFicha);
      setShowFichaModal(true);
    }
  }

  function handleCloseViewModal() {
    setShowViewModal(false);
    setViewingFicha(null);
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
      const method = fichaData.id ? "PUT" : "POST";
      const response = await fetch("/api/fichas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fichaData),
      });

      const data = await response.json();

      if (response.ok) {
        const action = fichaData.id ? "atualizado" : "criado";
        const tipoLabel = fichaData.tipo === "sinopse" ? "Sinopse" : fichaData.tipo === "conceito" ? "Conceito" : "Regra";
        toast.success(`${tipoLabel} ${action}`);
        await loadFichas();
        setShowFichaModal(false);
        setSelectedFicha(null);
        setPreSelectedCategory(null);
      } else {
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Error saving ficha:", error);
      toast.error("Erro de rede ao salvar");
    }
  }

  function promptDeleteFicha(ficha: Ficha) {
    setFichaToDelete(ficha);
    setConfirmationModal({
      isOpen: true,
      title: "Deletar Item",
      message: `Tem certeza que deseja deletar "${ficha.titulo}"? Esta ação não pode ser desfeita.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/fichas?id=${ficha.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            toast.success("Item deletado");
            await loadFichas();
            setShowFichaModal(false);
            setSelectedFicha(null);
            setPreSelectedCategory(null);
            setConfirmationModal(null);
            setFichaToDelete(null);
          } else {
            const data = await response.json();
            toast.error(data.error || "Erro ao deletar");
          }
        } catch (error) {
          console.error("Error deleting ficha:", error);
          toast.error("Erro de rede ao deletar");
        }
      },
    });
  }

  async function handleDeleteFicha(id: string) {
    const ficha = fichas.find(f => f.id === id);
    if (ficha) {
      promptDeleteFicha(ficha);
    }
  }



  function handleNewWorld() {
    if (!selectedUniverseId) {
      toast.error("Selecione um universo antes de criar um mundo");
      return;
    }
    setSelectedWorld(null);
    setShowWorldModal(true);
  }

  function handleEditWorld(world: World) {
    setSelectedWorld(world);
    setShowWorldModal(true);
  }

  async function handleSaveWorld(worldData: any) {
    try {
      const method = worldData.id ? "PUT" : "POST";
      const response = await fetch("/api/worlds", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(worldData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(worldData.id ? "Mundo atualizado" : "Mundo criado");
        await loadWorlds();
        await loadAllWorlds();
        setShowWorldModal(false);
        setSelectedWorld(null);
      } else {
        toast.error(data.error || "Erro ao salvar mundo");
      }
    } catch (error) {
      console.error("Error saving world:", error);
      toast.error("Erro de rede ao salvar mundo");
    }
  }

  async function handleSaveEpisode(episodeData: any) {
    try {
      const method = episodeData.id ? "PUT" : "POST";
      const response = await fetch("/api/episodes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(episodeData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(episodeData.id ? "Episódio atualizado" : "Episódio criado");
        await loadFichas(); // Recarregar fichas para mostrar novo episódio
        setShowEpisodeModal(false);
        setSelectedEpisode(null);
      } else {
        toast.error(data.error || "Erro ao salvar episódio");
      }
    } catch (error) {
      console.error("Error saving episode:", error);
      toast.error("Erro de rede ao salvar episódio");
    }
  }

  async function handleDeleteEpisode(id: string) {
    try {
      const response = await fetch(`/api/episodes?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Episódio deletado");
        await loadFichas();
        setShowEpisodeModal(false);
        setSelectedEpisode(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao deletar episódio");
      }
    } catch (error) {
      console.error("Error deleting episode:", error);
      toast.error("Erro de rede ao deletar episódio");
    }
  }

  function promptDeleteWorld(world: World) {
    setConfirmationModal({
      isOpen: true,
      title: "Deletar Mundo",
      message: `Tem certeza que deseja deletar "${world.nome}"? Esta ação não pode ser desfeita.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/worlds?id=${world.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            toast.success("Mundo deletado");
            if (selectedWorldId === world.id) {
              setSelectedWorldId("");
            }
            await loadWorlds();
            await loadAllWorlds();
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
  }

  async function handleDeleteWorld(id: string) {
    const world = allWorlds.find(w => w.id === id);
    if (world) {
      promptDeleteWorld(world);
    }
  }

  // Remover restrição - botão sempre habilitado

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-light-base dark:bg-dark-base">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      <Header showNav={true} currentPage="projetos" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleNewFicha("sinopse")}
            fullWidth
          >
            + Nova Sinopse
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleNewFicha("conceito")}
            disabled={!selectedUniverseId}
            title={!selectedUniverseId ? "Selecione um universo primeiro" : ""}
            fullWidth
          >
            + Novo Conceito
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleNewFicha("regra")}
            disabled={!selectedUniverseId}
            title={!selectedUniverseId ? "Selecione um universo primeiro" : ""}
            fullWidth
          >
            + Nova Regra
          </Button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <UniverseDropdown
            label="UNIVERSO"
            universes={universes}
            selectedId={selectedUniverseId}
            onSelect={handleUniverseChange}
            onEdit={handleEditUniverse}
            onDelete={handleDeleteUniverse}
            onCreate={openCreateUniverseModal}
          />

          <WorldsDropdownSingle
            label="MUNDOS"
            worlds={worlds}
            selectedId={selectedWorldId}
            onSelect={handleWorldChange}
            onEdit={handleEditWorld}
            onDelete={handleDeleteWorld}
            onCreate={handleNewWorld}
            disabled={!selectedUniverseId}
          />

          <TipoDropdown
            label="TIPO"
            selectedTipos={selectedTipos}
            onToggle={handleTipoToggle}
          />

          <OrdenacaoDropdown
            label="ORDENAÇÃO"
            value={ordenacao}
            onChange={setOrdenacao}
          />
        </div>

        {/* Search and Info Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          {/* Search Input */}
          <div className="relative flex-1 w-full max-w-md">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-light-tertiary dark:text-dark-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>
          
          {/* Item Count and Clear Filters */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised">
              <span className="text-sm text-text-light-tertiary dark:text-dark-tertiary whitespace-nowrap">
              {(() => {
                const filteredFichas = fichas.filter(f => {
                  const matchesSearch = searchQuery === "" || 
                    f.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    f.resumo?.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesTipo = selectedTipos.length === 0 || selectedTipos.includes(f.tipo);
                  return matchesSearch && matchesTipo;
                });
                const total = filteredFichas.length;
                return `${total} ${total === 1 ? 'item encontrado' : 'itens encontrados'}`;
              })()}
              </span>
            </div>
            
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTipos([]);
                setOrdenacao("asc");
              }}
              className="px-3 py-2 text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors whitespace-nowrap"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {/* Content */}
        {!selectedUniverseId ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            title="Selecione um Universo"
            description="Escolha um universo para visualizar e gerenciar seus projetos"
          />
        ) : fichas.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title="Nenhum Item Cadastrado"
            description="Crie episódios, conceitos ou regras para começar a planejar seu projeto"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Renderizar todas as fichas (sinopses, conceitos, regras) */}
            {fichas
              .filter(f => {
                const matchesSearch = searchQuery === "" || 
                  f.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  f.resumo?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesSearch;
              })
              .map((ficha) => {
                // Encontrar o nome do mundo se a ficha pertence a um mundo específico
                const worldName = ficha.world_id 
                  ? allWorlds.find(w => w.id === ficha.world_id)?.nome 
                  : undefined;
                
                return (
                  <FichaCard
                    key={ficha.id}
                    ficha={ficha}
                    onClick={() => handleViewFicha(ficha)}
                    worldName={worldName}
                  />
                );
              })}
          </div>
        )}
      </div>



      {/* Concept/Rule Modal */}
      {/* Ficha Modal */}
      <NewFichaModal
        isOpen={showFichaModal}
        onClose={() => {
          setShowFichaModal(false);
          setSelectedFicha(null);
          setPreSelectedCategory(null);
          if (viewingFicha) {
            setShowViewModal(true);
          }
        }}
        universeId={selectedUniverseId}
        universeName={universes.find(u => u.id === selectedUniverseId)?.nome || ""}
        worlds={allWorlds}
        categories={categories.filter(c => ["sinopse", "conceito", "regra"].includes(c.slug))}
        onSave={handleSaveFicha}
        onOpenCreateEpisode={() => setShowEpisodeModal(true)}
        onEditEpisode={(episodeId, episodeName) => {
          console.log('Edit episode:', episodeId, episodeName);
        }}
        onDeleteEpisode={async (episodeId) => {
          try {
            const response = await fetch(`/api/episodes?id=${episodeId}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              await loadFichas();
            } else {
              const data = await response.json();
              throw new Error(data.error || 'Failed to delete episode');
            }
          } catch (error) {
            console.error('Error deleting episode:', error);
            throw error;
          }
        }}
        mode={selectedFicha ? "edit" : "create"}
        ficha={selectedFicha}
        preSelectedCategory={preSelectedCategory}
      />

      {/* World Modal */}
      {showWorldModal && (
        <WorldModal
          world={selectedWorld}
          universeId={selectedUniverseId}
          onSave={handleSaveWorld}
          onDelete={handleDeleteWorld}
          onClose={() => {
            setShowWorldModal(false);
            setSelectedWorld(null);
          }}
        />
      )}

      {/* Episode Modal */}
      {showEpisodeModal && (
        <EpisodeModal
          episode={selectedEpisode}
          worldId={selectedWorldId!}
          onSave={handleSaveEpisode}
          onDelete={handleDeleteEpisode}
          onClose={() => {
            setShowEpisodeModal(false);
            setSelectedEpisode(null);
          }}
        />
      )}

      {/* View Modal - Unified */}
      {showViewModal && viewingFicha && (
        <FichaViewModal
          isOpen={showViewModal}
          ficha={viewingFicha}
          onClose={handleCloseViewModal}
          onEdit={handleEditFromView}
          onNext={handleNextFicha}
          onPrevious={handlePreviousFicha}
          hasNext={viewingFicha ? fichas.findIndex(f => f.id === viewingFicha.id) < fichas.length - 1 : false}
          hasPrevious={viewingFicha ? fichas.findIndex(f => f.id === viewingFicha.id) > 0 : false}
          currentIndex={viewingFicha ? fichas.findIndex(f => f.id === viewingFicha.id) : undefined}
          totalCount={fichas.length}
          worldName={viewingFicha?.world_id ? worlds.find(w => w.id === viewingFicha.world_id)?.nome : undefined}
        />
      )}

      {/* Modal de Novo Universo */}
      {(showNewUniverseModal || showEditUniverseModal) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setShowNewUniverseModal(false);
            setShowEditUniverseModal(false);
          }}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              selectedUniverse ? handleUpdateUniverse() : handleCreateUniverse();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border border-border-light-default dark:border-border-dark-default rounded-lg p-6 bg-light-base dark:bg-dark-base space-y-4 mx-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{selectedUniverse ? "Editar Universo" : "Novo Universo"}</h3>
              <button
                type="button"
                onClick={() => {
                  setShowNewUniverseModal(false);
                  setShowEditUniverseModal(false);
                }}
                className="text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Nome do Universo</label>
              <input
                type="text"
                value={newUniverseName}
                onChange={(e) => setNewUniverseName(e.target.value)}
                placeholder="Ex: Antiverso"
                className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm"
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
                onClick={() => {
                  setShowNewUniverseModal(false);
                  setShowEditUniverseModal(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                type="submit"
                variant="primary"
                disabled={isCreatingUniverse}
              >
                {isCreatingUniverse ? (selectedUniverse ? "Salvando..." : "Criando...") : (selectedUniverse ? "Salvar Universo" : "Criar Universo")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Confirmação */}
      {confirmationModal && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          title={confirmationModal.title}
          message={confirmationModal.message}
          isDangerous={confirmationModal.isDangerous}
          onConfirm={confirmationModal.onConfirm}
          onCancel={() => setConfirmationModal(null)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}
