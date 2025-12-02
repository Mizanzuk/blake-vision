"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Header } from "@/app/components/layout/Header";
import { Button, Loading, EmptyState } from "@/app/components/ui";
import { UniverseDropdown } from "@/app/components/ui/UniverseDropdown";
import { WorldsDropdown } from "@/app/components/ui/WorldsDropdown";
import EpisodeModal from "@/app/components/projetos/EpisodeModal";
import EpisodeCard from "@/app/components/projetos/EpisodeCard";
import type { Universe, World, Ficha } from "@/app/types";
import { toast } from "sonner";

export default function ProjetosPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [isLoading, setIsLoading] = useState(true);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  const [selectedWorldId, setSelectedWorldId] = useState<string>("");
  const [episodes, setEpisodes] = useState<Ficha[]>([]);
  
  // Modal
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Ficha | null>(null);

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
      loadWorlds();
    } else {
      setWorlds([]);
      setSelectedWorldId("");
      setEpisodes([]);
    }
  }, [selectedUniverseId]);

  useEffect(() => {
    if (selectedWorldId) {
      loadEpisodes();
    } else {
      setEpisodes([]);
    }
  }, [selectedWorldId]);

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

  async function loadEpisodes() {
    try {
      const response = await fetch(
        `/api/catalog?universeId=${selectedUniverseId}&worldId=${selectedWorldId}&tipo=episodio`
      );
      const data = await response.json();
      
      if (response.ok) {
        // Sort by episode number
        const sortedEpisodes = (data.fichas || []).sort((a: Ficha, b: Ficha) => {
          const numA = a.numero_episodio || 0;
          const numB = b.numero_episodio || 0;
          return numA - numB;
        });
        setEpisodes(sortedEpisodes);
      }
    } catch (error) {
      console.error("Error loading episodes:", error);
    }
  }

  function handleUniverseChange(universeId: string) {
    setSelectedUniverseId(universeId);
    localStorage.setItem("selectedUniverseId", universeId);
    setSelectedWorldId("");
  }

  function handleWorldChange(worldId: string) {
    setSelectedWorldId(worldId);
  }

  function handleNewEpisode() {
    if (!selectedUniverseId || !selectedWorldId) {
      toast.error("Selecione um universo e um mundo antes de criar um episódio");
      return;
    }
    
    setSelectedEpisode(null);
    setShowEpisodeModal(true);
  }

  function handleEditEpisode(episode: Ficha) {
    setSelectedEpisode(episode);
    setShowEpisodeModal(true);
  }

  async function handleSaveEpisode(episodeData: any) {
    try {
      const method = episodeData.id ? "PUT" : "POST";
      const response = await fetch("/api/fichas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...episodeData,
          universe_id: selectedUniverseId,
          world_id: selectedWorldId,
          tipo: "episodio",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(episodeData.id ? "Episódio atualizado" : "Episódio criado");
        await loadEpisodes();
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
      const response = await fetch(`/api/fichas?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Episódio deletado");
        await loadEpisodes();
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

  const canCreateEpisode = selectedUniverseId && selectedWorldId;

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Projetos</h1>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <UniverseDropdown
            label="UNIVERSO"
            universes={universes}
            selectedId={selectedUniverseId}
            onSelect={handleUniverseChange}
            onCreate={loadUniverses}
          />

          <WorldsDropdown
            label="MUNDOS"
            worlds={worlds}
            selectedIds={selectedWorldId ? [selectedWorldId] : []}
            onToggle={handleWorldChange}
            onEdit={() => {}}
            onDelete={() => {}}
            onCreate={loadWorlds}
            disabled={!selectedUniverseId}
          />

          <div className="flex items-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleNewEpisode}
              disabled={!canCreateEpisode}
              title={!canCreateEpisode ? "Selecione um universo e um mundo primeiro" : ""}
              fullWidth
            >
              + Novo Episódio
            </Button>
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
            description="Escolha um universo para visualizar seus projetos de episódios"
          />
        ) : !selectedWorldId ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Selecione um Mundo"
            description="Escolha um mundo para visualizar e gerenciar seus episódios"
          />
        ) : episodes.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title="Nenhum Episódio Cadastrado"
            description="Clique em '+ Novo Episódio' para começar a planejar sua história"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {episodes.map((episode) => (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                onClick={() => handleEditEpisode(episode)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Episode Modal */}
      {showEpisodeModal && (
        <EpisodeModal
          episode={selectedEpisode}
          worldId={selectedWorldId}
          onSave={handleSaveEpisode}
          onDelete={handleDeleteEpisode}
          onClose={() => {
            setShowEpisodeModal(false);
            setSelectedEpisode(null);
          }}
        />
      )}
    </div>
  );
}
