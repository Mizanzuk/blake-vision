"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Header } from "@/app/components/layout/Header";
import { Button, Loading, EmptyState } from "@/app/components/ui";
import { UniverseDropdown } from "@/app/components/ui/UniverseDropdown";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import EpisodeModal from "@/app/components/projetos/EpisodeModal";
import ConceptRuleModal from "@/app/components/projetos/ConceptRuleModal";
import WorldModal from "@/app/components/projetos/WorldModal";
import FichaCard from "@/app/components/shared/FichaCard";
import FichaViewModal from "@/app/components/shared/FichaViewModal";
import TipoDropdown from "@/app/components/projetos/TipoDropdown";
import OrdenacaoDropdown from "@/app/components/projetos/OrdenacaoDropdown";
import type { Universe, World, Ficha } from "@/app/types";
import { toast } from "sonner";



export default function ProjetosPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [isLoading, setIsLoading] = useState(true);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [allWorlds, setAllWorlds] = useState<World[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  const [selectedWorldId, setSelectedWorldId] = useState<string>("");
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [ordenacao, setOrdenacao] = useState<"asc" | "desc">("asc");
  
  // Modals
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [showConceptRuleModal, setShowConceptRuleModal] = useState(false);
  const [conceptRuleType, setConceptRuleType] = useState<"conceito" | "regra">("conceito");
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingFicha, setViewingFicha] = useState<Ficha | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    loadUniverses();
    loadAllWorlds();
    
    const savedUniverse = localStorage.getItem("selectedUniverseId");
    if (savedUniverse) {
      setSelectedUniverseId(savedUniverse);
    }
    
    const savedWorld = localStorage.getItem("selectedWorldId");
    if (savedWorld) {
      setSelectedWorldId(savedWorld);
    }
  }, []);

  useEffect(() => {
    if (selectedUniverseId) {
      loadWorlds();
    } else {
      setWorlds([]);
      setSelectedWorldId("");
      setFichas([]);
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
        // Load episodios, conceitos, and regras
        url += `&tipo=episodio,conceito,regra`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        // Sort by type and then by episode number or title
        const sortedFichas = (data.fichas || []).sort((a: Ficha, b: Ficha) => {
          // First sort by type
          const typeOrder = { episodio: 1, conceito: 2, regra: 3 };
          const typeA = typeOrder[a.tipo as keyof typeof typeOrder] || 999;
          const typeB = typeOrder[b.tipo as keyof typeof typeOrder] || 999;
          
          if (typeA !== typeB) {
            return typeA - typeB;
          }
          
          // Then by episode number for episodes
          if (a.tipo === "episodio" && b.tipo === "episodio") {
            const numA = a.numero_episodio || 0;
            const numB = b.numero_episodio || 0;
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

  function handleNewEpisode() {
    // Não há mais pré-requisito - o usuário pode escolher universo e mundo no modal
    setSelectedFicha(null);
    setShowEpisodeModal(true);
  }

  function handleNewConceptRule(tipo: "conceito" | "regra") {
    if (!selectedUniverseId) {
      toast.error("Selecione um universo antes de criar");
      return;
    }
    
    setConceptRuleType(tipo);
    setSelectedFicha(null);
    setShowConceptRuleModal(true);
  }

  function handleViewFicha(ficha: Ficha) {
    setViewingFicha(ficha);
    setShowViewModal(true);
  }

  function handleEditFromView() {
    if (!viewingFicha) return;
    
    setShowViewModal(false);
    
    if (viewingFicha.tipo === "episodio") {
      setSelectedFicha(viewingFicha);
      setShowEpisodeModal(true);
    } else if (viewingFicha.tipo === "conceito" || viewingFicha.tipo === "regra") {
      setConceptRuleType(viewingFicha.tipo);
      setSelectedFicha(viewingFicha);
      setShowConceptRuleModal(true);
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
        const tipoLabel = fichaData.tipo === "episodio" ? "Episódio" : fichaData.tipo === "conceito" ? "Conceito" : "Regra";
        toast.success(`${tipoLabel} ${action}`);
        await loadFichas();
        setShowEpisodeModal(false);
        setShowConceptRuleModal(false);
        setSelectedFicha(null);
      } else {
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Error saving ficha:", error);
      toast.error("Erro de rede ao salvar");
    }
  }

  async function handleDeleteFicha(id: string) {
    try {
      const response = await fetch(`/api/fichas?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Item deletado");
        await loadFichas();
        setShowEpisodeModal(false);
        setShowConceptRuleModal(false);
        setSelectedFicha(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao deletar");
      }
    } catch (error) {
      console.error("Error deleting ficha:", error);
      toast.error("Erro de rede ao deletar");
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
        const action = episodeData.id ? "atualizado" : "criado";
        toast.success(`Episódio ${action}`);
        await loadFichas();
        setShowEpisodeModal(false);
        setSelectedFicha(null);
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
        setSelectedFicha(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao deletar episódio");
      }
    } catch (error) {
      console.error("Error deleting episode:", error);
      toast.error("Erro de rede ao deletar episódio");
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

  async function handleDeleteWorld(id: string) {
    try {
      const response = await fetch(`/api/worlds?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Mundo deletado");
        if (selectedWorldId === id) {
          setSelectedWorldId("");
        }
        await loadWorlds();
        await loadAllWorlds();
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

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <UniverseDropdown
            label="UNIVERSO"
            universes={universes}
            selectedId={selectedUniverseId}
            onSelect={handleUniverseChange}
            onCreate={loadUniverses}
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

        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            variant="primary"
            size="sm"
            onClick={handleNewEpisode}
            fullWidth
          >
            + Novo Episódio
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleNewConceptRule("conceito")}
            disabled={!selectedUniverseId}
            title={!selectedUniverseId ? "Selecione um universo primeiro" : ""}
            fullWidth
          >
            + Novo Conceito
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleNewConceptRule("regra")}
            disabled={!selectedUniverseId}
            title={!selectedUniverseId ? "Selecione um universo primeiro" : ""}
            fullWidth
          >
            + Nova Regra
          </Button>
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
          <div className="space-y-8">
            {/* Agrupar episódios por mundo */}
            {(() => {
              // Separar episódios de outros tipos
              const episodios = fichas.filter(f => f.tipo === "episodio");
              const outros = fichas.filter(f => f.tipo !== "episodio");
              
              // Agrupar episódios por mundo
              const episodiosPorMundo = episodios.reduce((acc, ep) => {
                const worldId = ep.world_id;
                if (!acc[worldId]) {
                  acc[worldId] = [];
                }
                acc[worldId].push(ep);
                return acc;
              }, {} as Record<string, Ficha[]>);
              
              // Ordenar episódios dentro de cada mundo
              Object.keys(episodiosPorMundo).forEach(worldId => {
                episodiosPorMundo[worldId].sort((a, b) => {
                  const numA = parseInt(a.episodio || "0");
                  const numB = parseInt(b.episodio || "0");
                  return ordenacao === "asc" ? numA - numB : numB - numA;
                });
              });
              
              return (
                <>
                  {/* Renderizar episódios agrupados por mundo */}
                  {Object.entries(episodiosPorMundo).map(([worldId, worldEpisodes]) => {
                    const world = allWorlds.find(w => w.id === worldId);
                    return (
                      <div key={worldId}>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          {world?.nome || "Mundo Desconhecido"}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {worldEpisodes.map((ficha) => (
                            <FichaCard
                              key={ficha.id}
                              ficha={ficha}
                              onClick={() => handleViewFicha(ficha)}
                              withIndent={true}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Renderizar conceitos e regras */}
                  {outros.length > 0 && (
                    <div>
                      {episodios.length > 0 && (
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Conceitos e Regras
                        </h2>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {outros.map((ficha) => (
                          <FichaCard
                            key={ficha.id}
                            ficha={ficha}
                            onClick={() => handleViewFicha(ficha)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Episode Modal */}
      {showEpisodeModal && (
        <EpisodeModal
          episode={selectedFicha}
          worldId={selectedWorldId}
          universeId={selectedUniverseId}
          onSave={handleSaveEpisode}
          onDelete={handleDeleteEpisode}
          onClose={() => {
            setShowEpisodeModal(false);
            setSelectedFicha(null);
          }}
        />
      )}

      {/* Concept/Rule Modal */}
      {showConceptRuleModal && (
        <ConceptRuleModal
          item={selectedFicha}
          tipo={conceptRuleType}
          universes={universes}
          worlds={allWorlds}
          preSelectedUniverseId={selectedUniverseId}
          preSelectedWorldId={selectedWorldId}
          onSave={handleSaveFicha}
          onDelete={handleDeleteFicha}
          onClose={() => {
            setShowConceptRuleModal(false);
            setSelectedFicha(null);
          }}
        />
      )}

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

      {/* View Modal */}
      <FichaViewModal
        isOpen={showViewModal}
        ficha={viewingFicha}
        onClose={handleCloseViewModal}
        onEdit={handleEditFromView}
        onNext={handleNextFicha}
        onPrevious={handlePreviousFicha}
        hasNext={viewingFicha ? fichas.findIndex(f => f.id === viewingFicha.id) < fichas.length - 1 : false}
        hasPrevious={viewingFicha ? fichas.findIndex(f => f.id === viewingFicha.id) > 0 : false}
      />
    </div>
  );
}
