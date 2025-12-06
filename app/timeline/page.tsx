"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ViewModeDropdown } from "@/app/components/ui/ViewModeDropdown";
import FichaModal from "@/app/components/catalog/FichaModal";
import FichaViewModal from "@/app/components/shared/FichaViewModal";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { toast } from "sonner";
import type { Universe, World, Category, Ficha } from "@/app/types";

type ViewMode = "list" | "decade" | "year" | "month";
type DisplayMode = "agrupado" | "lista";

interface GroupedEvents {
  [key: string]: Ficha[];
}

export default function TimelinePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  const [events, setEvents] = useState<Ficha[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorldId, setSelectedWorldId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("decade");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("agrupado");
  
  // Modal
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingFicha, setViewingFicha] = useState<Ficha | null>(null);
  
  // Cards expansion
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [showNewUniverseModal, setShowNewUniverseModal] = useState(false);
  const [newUniverseName, setNewUniverseName] = useState("");
  const [newUniverseDescription, setNewUniverseDescription] = useState("");
  const [isCreatingUniverse, setIsCreatingUniverse] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    loadUniverses();
    
    const saved = localStorage.getItem("selectedUniverseId");
    if (saved) {
      setSelectedUniverseId(saved);
    }
  }, []);

  useEffect(() => {
    if (selectedUniverseId) {
      loadTimelineData();
    }
  }, [selectedUniverseId]);

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

  async function loadTimelineData() {
    try {
      const response = await fetch(`/api/catalog?universeId=${selectedUniverseId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter only events with dates
        const eventsWithDates = (data.fichas || []).filter((f: Ficha) => 
          f.ano_diegese || f.data_inicio
        );
        
        // Sort by year
        eventsWithDates.sort((a: Ficha, b: Ficha) => {
          const yearA = a.ano_diegese || (a.data_inicio ? parseInt(a.data_inicio.split('-')[0]) : 0);
          const yearB = b.ano_diegese || (b.data_inicio ? parseInt(b.data_inicio.split('-')[0]) : 0);
          return yearA - yearB;
        });
        
        setEvents(eventsWithDates);
        setWorlds(data.worlds || []);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error loading timeline:", error);
    }
  }

  function handleUniverseChange(value: string) {
    if (value === "create_new_universe") {
      setShowNewUniverseModal(true);
      return;
    }
    setSelectedUniverseId(value);
    localStorage.setItem("selectedUniverseId", value);
  }

  async function handleCreateUniverse() {
    if (!newUniverseName.trim()) {
      toast.error("Dê um nome ao novo Universo.");
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
        setShowNewUniverseModal(false);
        setNewUniverseName("");
        setNewUniverseDescription("");
        toast.success("Novo Universo criado com sucesso.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar Universo.");
    } finally {
      setIsCreatingUniverse(false);
    }
  }

  function handleEditFicha(ficha: Ficha) {
    setSelectedFicha(ficha);
    setShowFichaModal(true);
  }

  function openViewFichaModal(ficha: Ficha) {
    setViewingFicha(ficha);
    setShowViewModal(true);
  }

  function handleEditFromView() {
    if (!viewingFicha) return;
    setShowViewModal(false);
    const fichaToEdit = viewingFicha;
    setViewingFicha(null);
    handleEditFicha(fichaToEdit);
  }

  function handleCloseViewModal() {
    setShowViewModal(false);
    setViewingFicha(null);
  }

  function toggleCardExpansion(fichaId: string) {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fichaId)) {
        newSet.delete(fichaId);
      } else {
        newSet.add(fichaId);
      }
      return newSet;
    });
  }

  function toggleAllCards() {
    if (allExpanded) {
      setExpandedCards(new Set());
      setAllExpanded(false);
    } else {
      const allIds = new Set(events.map(e => e.id));
      setExpandedCards(allIds);
      setAllExpanded(true);
    }
  }

  function handleNextFicha() {
    if (!viewingFicha) return;
    const currentIndex = events.findIndex(e => e.id === viewingFicha.id);
    if (currentIndex < events.length - 1) {
      setViewingFicha(events[currentIndex + 1]);
    }
  }

  function handlePreviousFicha() {
    if (!viewingFicha) return;
    const currentIndex = events.findIndex(e => e.id === viewingFicha.id);
    if (currentIndex > 0) {
      setViewingFicha(events[currentIndex - 1]);
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
        toast.success(fichaData.id ? t.success.updated : t.success.created);
        await loadTimelineData();
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

  async function handleDeleteFicha(id: string) {
    try {
      const response = await fetch(`/api/fichas?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t.success.deleted);
        await loadTimelineData();
        setShowFichaModal(false);
        setSelectedFicha(null);
      } else {
        const data = await response.json();
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error deleting ficha:", error);
      toast.error(t.errors.network);
    }
  }

  // Group events by period
  function groupEventsByPeriod(events: Ficha[], mode: ViewMode): GroupedEvents {
    const grouped: GroupedEvents = {};

    events.forEach(event => {
      const year = event.ano_diegese || (event.data_inicio ? parseInt(event.data_inicio.split('-')[0]) : 0);
      
      let key: string;
      
      if (mode === "decade") {
        const decade = Math.floor(year / 10) * 10;
        key = `${decade}s`;
      } else if (mode === "year") {
        key = year.toString();
      } else if (mode === "month") {
        if (event.data_inicio) {
          const [y, m] = event.data_inicio.split('-');
          const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
          key = `${monthNames[parseInt(m) - 1]} ${y}`;
        } else {
          key = year.toString();
        }
      } else {
        key = "all";
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });

    return grouped;
  }

  // Filter events
  const filteredEvents = events.filter(event => {
    if (searchTerm && !event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !event.resumo?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedWorldId && event.world_id !== selectedWorldId) {
      return false;
    }
    if (selectedType && event.tipo !== selectedType) {
      return false;
    }
    return true;
  });

  // Group if needed
  const groupedEvents = displayMode === "agrupado" 
    ? groupEventsByPeriod(filteredEvents, viewMode)
    : { all: filteredEvents };
  
  const groupKeys = Object.keys(groupedEvents);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-light-base dark:bg-dark-base">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      <Header showNav={true} currentPage="timeline" />
      
      {/* Header */}
      <header className="bg-light-raised dark:bg-dark-raised">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">

          </div>

          {/* Dropdowns e Busca na mesma linha */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <UniverseDropdown
              label="UNIVERSO"
              universes={universes}
              selectedId={selectedUniverseId}
              onSelect={(id) => handleUniverseChange(id)}
              onCreate={() => setShowNewUniverseModal(true)}
            />
            
            <WorldsDropdown
              label="MUNDOS"
              worlds={worlds}
              selectedIds={selectedWorldId ? [selectedWorldId] : []}
              onToggle={(id) => setSelectedWorldId(id)}
              onEdit={() => {}}
              onDelete={() => {}}
              onCreate={() => {}}
              disabled={!selectedUniverseId}
            />
            
            <ViewModeDropdown
              label="VISUALIZAÇÃO"
              value={displayMode}
              onChange={(value) => setDisplayMode(value)}
            />
            
            <Input
              label="BUSCAR"
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              disabled={!selectedUniverseId}
            />
          </div>

          {/* Botão Expandir/Recolher Tudo */}
          {selectedUniverseId && displayMode === "agrupado" && filteredEvents.length > 0 && (
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleAllCards}
              >
                {allExpanded ? "Recolher tudo" : "Expandir tudo"}
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!selectedUniverseId ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Selecione um Universo"
            description="Escolha um universo para visualizar sua timeline de eventos"
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="Nenhum Evento Encontrado"
            description="Não há eventos com datas neste universo ou que correspondam aos filtros"
          />
        ) : (
          <div className="space-y-8">
            {/* Results Counter */}
            <div className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
              {filteredEvents.length} {filteredEvents.length === 1 ? "evento encontrado" : "eventos encontrados"}
              {viewMode !== "list" && ` • Agrupados por ${viewMode === "decade" ? "década" : viewMode === "year" ? "ano" : "mês"}`}
            </div>

            {/* Timeline */}
            {groupKeys.map(groupKey => (
              <div key={groupKey} className="space-y-6">
                {/* Group Header */}
                {displayMode === "agrupado" && (
                  <div className="sticky top-0 z-10 bg-light-base dark:bg-dark-base py-2">
                    <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                      {groupKey}
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-primary-500 to-primary-300 rounded-full mt-2" />
                  </div>
                )}

                {/* Events in Group */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-primary-400 to-primary-300" />

                  {/* Events */}
                  <div className="space-y-8">
                    {groupedEvents[groupKey].map((event, index) => {
                      const world = worlds.find(w => w.id === event.world_id);
                      const category = categories.find(c => c.slug === event.tipo);
                      const year = event.ano_diegese || (event.data_inicio ? parseInt(event.data_inicio.split('-')[0]) : null);

                      const isExpanded = displayMode === "lista" || expandedCards.has(event.id);
                      
                      return (
                        <div key={event.id} className="relative pl-12 group flex items-start">
                          {/* Year Circle - 50% menor, centralizado com card */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {year}
                          </div>

                          {/* Event Card - Lighter version */}
                          <div className="flex-1">
                            {/* Área clicável para toggle - Primeira linha + Título + Data */}
                            <div 
                              className="py-2 px-3 rounded-lg hover:bg-light-raised dark:hover:bg-dark-raised transition-colors cursor-pointer"
                              onClick={() => displayMode === "agrupado" ? toggleCardExpansion(event.id) : openViewFichaModal(event)}
                            >
                              {/* Primeira linha: Seta + Badges */}
                              <div className="flex items-center gap-2">
                                {/* Arrow - sempre visível, à esquerda */}
                                <div className="flex-shrink-0">
                                  <svg 
                                    className="w-4 h-4 text-text-light-secondary dark:text-dark-secondary"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                                
                                {/* Badges */}
                                {category && (
                                  <Badge variant="primary" size="sm">
                                    {category.label}
                                  </Badge>
                                )}
                                {world && (
                                  <Badge variant="default" size="sm">
                                    {world.nome}
                                  </Badge>
                                )}
                              </div>

                              {/* Título - com recuo */}
                              <h3 className="text-base text-text-light-primary dark:text-dark-primary group-hover:underline ml-6 mt-1">
                                {event.titulo}
                              </h3>
                              
                              {/* Data - com recuo */}
                              {year && (
                                <p className="text-sm text-gray-500 ml-6">
                                  {year}
                                </p>
                              )}
                            </div>

                          {/* Conteúdo - visível quando expandido */}
                          {isExpanded && displayMode === "agrupado" && (
                            <div 
                              className="mt-2 cursor-pointer space-y-2 ml-6"
                              onClick={() => openViewFichaModal(event)}
                            >
                                {event.resumo && (
                                  <p className="text-sm text-text-light-secondary dark:text-dark-secondary hover:underline">
                                    {event.resumo}
                                  </p>
                                )}

                                {event.descricao_data && (
                                  <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                                    📅 {event.descricao_data}
                                  </p>
                                )}

                                {event.tags && typeof event.tags === 'string' && event.tags.length > 0 && (() => {
                                  const tagsArray = event.tags.split(',').map(t => t.trim()).filter(t => t);
                                  return tagsArray.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {tagsArray.slice(0, 3).map((tag, i) => (
                                        <span
                                          key={i}
                                          className="text-xs px-2 py-1 rounded-full bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default text-text-light-tertiary dark:text-dark-tertiary"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                      {tagsArray.length > 3 && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default text-text-light-tertiary dark:text-dark-tertiary">
                                          +{tagsArray.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Ficha Modal */}
      {showFichaModal && (
        <FichaModal
          isOpen={showFichaModal}
          ficha={selectedFicha}
          worlds={worlds}
          categories={categories}
          onClose={() => {
            setShowFichaModal(false);
            setSelectedFicha(null);
          }}
          onSave={handleSaveFicha}
          onDelete={handleDeleteFicha}
        />
      )}

      {/* View Modal */}
      {showViewModal && viewingFicha && (
        <FichaViewModal
          isOpen={showViewModal}
          ficha={viewingFicha}
          onClose={handleCloseViewModal}
          onEdit={handleEditFromView}
          onNext={handleNextFicha}
          onPrevious={handlePreviousFicha}
          hasNext={events.findIndex(e => e.id === viewingFicha.id) < events.length - 1}
          hasPrevious={events.findIndex(e => e.id === viewingFicha.id) > 0}
        />
      )}

      {/* Create Universe Modal */}
      {showNewUniverseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-light-raised dark:bg-dark-raised rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-text-light-primary dark:text-dark-primary mb-4">
              Criar Novo Universo
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-dark-secondary mb-1">
                  Nome do Universo *
                </label>
                <input
                  type="text"
                  value={newUniverseName}
                  onChange={(e) => setNewUniverseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary"
                  placeholder="Ex: Terra-616"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-dark-secondary mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newUniverseDescription}
                  onChange={(e) => setNewUniverseDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary"
                  placeholder="Descrição breve do universo"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewUniverseModal(false);
                  setNewUniverseName("");
                  setNewUniverseDescription("");
                }}
                fullWidth
                disabled={isCreatingUniverse}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateUniverse}
                fullWidth
                disabled={isCreatingUniverse || !newUniverseName.trim()}
              >
                {isCreatingUniverse ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
