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
import FichaModal from "@/app/components/catalog/FichaModal";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { toast } from "sonner";
import type { Universe, World, Category, Ficha } from "@/app/types";

type ViewMode = "list" | "decade" | "year" | "month";

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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  
  // Modal
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);

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
        const eventsWithDates = (data.entities || []).filter((f: Ficha) => 
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
    setSelectedUniverseId(value);
    localStorage.setItem("selectedUniverseId", value);
  }

  function handleEditFicha(ficha: Ficha) {
    setSelectedFicha(ficha);
    setShowFichaModal(true);
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
  const groupedEvents = viewMode === "list" ? { "all": filteredEvents } : groupEventsByPeriod(filteredEvents, viewMode);
  const groupKeys = Object.keys(groupedEvents).sort((a, b) => {
    if (viewMode === "list") return 0;
    
    // Extract numeric value for sorting
    const numA = parseInt(a.replace(/\D/g, ''));
    const numB = parseInt(b.replace(/\D/g, ''));
    return numA - numB;
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-light-base dark:bg-dark-base">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      {/* Header */}
      <header className="border-b border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                }
              >
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/catalog")}
              >
                Catálogo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/upload")}
              >
                Upload
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
              Timeline
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile")}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                Perfil
              </Button>
            </div>
          </div>

          {/* Universe Selector */}
          <div className="mb-4">
            <Select
              value={selectedUniverseId}
              onChange={(e) => handleUniverseChange(e.target.value)}
              fullWidth
            >
              <option value="">Selecione um universo</option>
              {universes.map(universe => (
                <option key={universe.id} value={universe.id}>
                  {universe.nome}
                </option>
              ))}
            </Select>
          </div>

          {/* Filters */}
          {selectedUniverseId && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
              />
              
              <Select
                value={selectedWorldId}
                onChange={(e) => setSelectedWorldId(e.target.value)}
                fullWidth
              >
                <option value="">Todos os mundos</option>
                {worlds.map(world => (
                  <option key={world.id} value={world.id}>
                    {world.nome}
                  </option>
                ))}
              </Select>

              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                fullWidth
              >
                <option value="">Todos os tipos</option>
                {categories.map(cat => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </option>
                ))}
              </Select>

              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                fullWidth
              >
                <option value="list">Lista</option>
                <option value="decade">Por Década</option>
                <option value="year">Por Ano</option>
                <option value="month">Por Mês</option>
              </Select>
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
                {viewMode !== "list" && (
                  <div className="sticky top-0 z-10 bg-light-base dark:bg-dark-base py-2">
                    <h2 className="text-3xl font-bold text-text-light-primary dark:text-dark-primary">
                      {groupKey}
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-primary-500 to-primary-300 rounded-full mt-2" />
                  </div>
                )}

                {/* Events in Group */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 via-primary-400 to-primary-300" />

                  {/* Events */}
                  <div className="space-y-8">
                    {groupedEvents[groupKey].map((event, index) => {
                      const world = worlds.find(w => w.id === event.world_id);
                      const category = categories.find(c => c.slug === event.tipo);
                      const year = event.ano_diegese || (event.data_inicio ? parseInt(event.data_inicio.split('-')[0]) : null);

                      return (
                        <div key={event.id} className="relative pl-20">
                          {/* Year Circle */}
                          <div className="absolute left-0 w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-lg">
                            {year}
                          </div>

                          {/* Event Card */}
                          <Card
                            variant="outlined"
                            padding="lg"
                            hoverable
                            onClick={() => handleEditFicha(event)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
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

                                <h3 className="text-xl font-bold text-text-light-primary dark:text-dark-primary mb-2">
                                  {event.titulo}
                                </h3>

                                {event.resumo && (
                                  <p className="text-sm text-text-light-secondary dark:text-dark-secondary mb-3">
                                    {event.resumo}
                                  </p>
                                )}

                                {event.descricao_data && (
                                  <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary mb-3">
                                    📅 {event.descricao_data}
                                  </p>
                                )}

                                {event.tags && event.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {(typeof event.tags === 'string' ? event.tags.split(',').map(t => t.trim()) : event.tags).slice(0, 3).map((tag, i) => (
                                      <span
                                        key={i}
                                        className="text-xs px-2 py-1 rounded-full bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default text-text-light-tertiary dark:text-dark-tertiary"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {(typeof event.tags === 'string' ? event.tags.split(',').length : event.tags.length) > 3 && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default text-text-light-tertiary dark:text-dark-tertiary">
                                        +{(typeof event.tags === 'string' ? event.tags.split(',').length : event.tags.length) - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                                Clique para editar
                              </div>
                            </div>
                          </Card>
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
          onClose={() => {
            setShowFichaModal(false);
            setSelectedFicha(null);
          }}
          onSave={handleSaveFicha}
          onDelete={handleDeleteFicha}
          ficha={selectedFicha}
          worlds={worlds}
          categories={categories}
        />
      )}
    </div>
  );
}
