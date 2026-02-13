import { useEffect, useState } from "react";

interface Episode {
  id: string;
  numero: number;
  titulo: string;
  world_id: string;
  user_id: string;
  logline?: string;
  sinopse?: string;
}

/**
 * Hook para carregar episódios de um mundo e convertê-los para o formato "numero titulo"
 * Isso permite que o dropdown mostre os episódios criados na tabela episodes
 */
export function useEpisodes(worldId: string | null) {
  const [episodes, setEpisodes] = useState<string[]>([]);
  const [episodeObjects, setEpisodeObjects] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!worldId) {
      setEpisodes([]);
      setEpisodeObjects([]);
      return;
    }

    async function loadEpisodes() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/episodes?world_id=${worldId}`);
        
        if (!response.ok) {
          throw new Error("Erro ao carregar episódios");
        }

        const data = await response.json();
        const episodesList = data.episodes || [];

        // Armazenar os objetos completos
        setEpisodeObjects(episodesList);

        // Converter para formato "numero titulo"
        const formattedEpisodes = episodesList
          .sort((a: Episode, b: Episode) => a.numero - b.numero)
          .map((ep: Episode) => `${ep.numero} ${ep.titulo}`);

        setEpisodes(formattedEpisodes);
      } catch (err) {
        console.error("Erro ao carregar episódios:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setEpisodes([]);
        setEpisodeObjects([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadEpisodes();
  }, [worldId]);

  /**
   * Converte um episódio do formato "numero titulo" para o objeto completo
   */
  const getEpisodeObject = (episodeString: string): Episode | null => {
    return episodeObjects.find(ep => `${ep.numero} ${ep.titulo}` === episodeString) || null;
  };

  /**
   * Converte um episódio do formato "numero titulo" para apenas o número
   */
  const getEpisodeNumber = (episodeString: string): number | null => {
    const match = episodeString.match(/^(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  return {
    episodes,
    episodeObjects,
    isLoading,
    error,
    getEpisodeObject,
    getEpisodeNumber,
  };
}
