"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Button } from "@/app/components/ui";
import { UniverseDropdown } from "@/app/components/ui/UniverseDropdown";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import type { Ficha, Universe, World } from "@/app/types";
import { toast } from "sonner";

interface EpisodeModalProps {
  episode: Ficha | null;
  worldId?: string;
  universeId?: string;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function EpisodeModal({
  episode,
  worldId,
  universeId,
  onSave,
  onDelete,
  onClose,
}: EpisodeModalProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [numeroEpisodio, setNumeroEpisodio] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [logline, setLogline] = useState("");
  const [sinopse, setSinopse] = useState("");
  
  // Universo e Mundo
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  const [selectedWorldId, setSelectedWorldId] = useState<string>("");

  useEffect(() => {
    loadUniverses();
  }, []);

  useEffect(() => {
    if (episode) {
      setNumeroEpisodio(episode.episodio?.toString() || "");
      setTitulo(episode.titulo || "");
      setLogline(episode.conteudo || "");
      setSinopse(episode.resumo || "");
      
      // Set universe and world from episode
      if (episode.world_id) {
        setSelectedWorldId(episode.world_id);
        // Load the world to get universe_id
        loadWorldUniverse(episode.world_id);
      }
    } else {
      setNumeroEpisodio("");
      setTitulo("");
      setLogline("");
      setSinopse("");
      
      // Use pre-selected values if provided
      if (universeId) {
        setSelectedUniverseId(universeId);
      }
      if (worldId) {
        setSelectedWorldId(worldId);
      }
    }
    setHasChanges(false);
  }, [episode, universeId, worldId]);

  useEffect(() => {
    if (selectedUniverseId) {
      loadWorlds(selectedUniverseId);
    } else {
      setWorlds([]);
      setSelectedWorldId("");
    }
  }, [selectedUniverseId]);

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

  async function loadWorlds(universeId: string) {
    try {
      const response = await fetch(`/api/worlds?universeId=${universeId}`);
      const data = await response.json();
      
      if (response.ok) {
        setWorlds(data.worlds || []);
      }
    } catch (error) {
      console.error("Error loading worlds:", error);
    }
  }

  async function loadWorldUniverse(worldId: string) {
    try {
      const response = await fetch(`/api/worlds`);
      const data = await response.json();
      
      if (response.ok && data.worlds) {
        const world = data.worlds.find((w: World) => w.id === worldId);
        if (world) {
          setSelectedUniverseId(world.universe_id);
        }
      }
    } catch (error) {
      console.error("Error loading world universe:", error);
    }
  }

  function handleChange() {
    setHasChanges(true);
  }

  function handleClose() {
    if (hasChanges) {
      const confirmed = window.confirm(
        "Você tem alterações não salvas. Deseja realmente fechar sem salvar?"
      );
      if (!confirmed) return;
    }
    onClose();
  }

  async function handleSave() {
    // Validation - Universe and World are required
    if (!selectedUniverseId) {
      toast.error("Selecione um universo");
      return;
    }

    if (!selectedWorldId) {
      toast.error("Selecione um mundo");
      return;
    }

    // Check if world has episodes enabled
    const world = worlds.find(w => w.id === selectedWorldId);
    if (world && !world.has_episodes && !world.tem_episodios) {
      toast.error("Este mundo não permite episódios. Edite o mundo para habilitar.");
      return;
    }

    // Validation - All fields are required
    if (!numeroEpisodio.trim()) {
      toast.error("Número do episódio é obrigatório");
      return;
    }

    // Validação numérica
    const episodeNumber = parseInt(numeroEpisodio);
    if (isNaN(episodeNumber) || episodeNumber <= 0) {
      toast.error("Número do episódio deve ser um número válido maior que zero");
      return;
    }

    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!logline.trim()) {
      toast.error("Logline é obrigatória");
      return;
    }

    if (!sinopse.trim()) {
      toast.error("Sinopse é obrigatória");
      return;
    }

    // Verificar se já existe episódio com esse número no mesmo mundo
    try {
      const response = await fetch(`/api/catalog?worldId=${selectedWorldId}&tipo=episodio`);
      const data = await response.json();
      
      if (response.ok && data.fichas) {
        const duplicateEpisode = data.fichas.find((f: any) => 
          (f.episodio === numeroEpisodio || f.numero_episodio === episodeNumber) && f.id !== episode?.id
        );
        
        if (duplicateEpisode) {
          toast.error(`Já existe um episódio ${episodeNumber} neste mundo`);
          return;
        }
      }
    } catch (error) {
      console.error("Error checking duplicate episodes:", error);
      toast.error("Erro ao verificar episódios duplicados");
      return;
    }

    const episodeData = {
      id: episode?.id,
      world_id: selectedWorldId,
      tipo: "episodio",
      episodio: numeroEpisodio,
      titulo: titulo.trim(),
      resumo: sinopse.trim(),
      conteudo: logline.trim(),
    };

    onSave(episodeData);
    setHasChanges(false);
  }

  function handleDelete() {
    if (!episode?.id) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja deletar este episódio? Esta ação não pode ser desfeita."
    );

    if (confirmed) {
      onDelete(episode.id);
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={episode ? "Editar Episódio" : "Novo Episódio"}
      size="lg"
    >
      <div className="space-y-4">
        {/* Universo e Mundo */}
        <div className="grid grid-cols-2 gap-4">
          <UniverseDropdown
            label="UNIVERSO"
            universes={universes}
            selectedId={selectedUniverseId}
            onSelect={(id) => {
              setSelectedUniverseId(id);
              handleChange();
            }}
          />

          <WorldsDropdownSingle
            label="MUNDOS"
            worlds={worlds}
            selectedId={selectedWorldId}
            onSelect={(id) => {
              setSelectedWorldId(id);
              handleChange();
            }}
            onEdit={() => {}} // No modal, não permitimos editar mundos
            onDelete={() => {}} // No modal, não permitimos deletar mundos
            onCreate={() => {}} // No modal, não permitimos criar mundos
            disabled={!selectedUniverseId}
          />
        </div>

        {/* Número do Episódio */}
        <Input
          label="Número do Episódio"
          type="number"
          value={numeroEpisodio}
          onChange={(e) => {
            // Aceitar apenas números
            const value = e.target.value;
            if (value === "" || /^\d+$/.test(value)) {
              setNumeroEpisodio(value);
              handleChange();
            }
          }}
          placeholder="Ex: 1, 2, 3"
          required
          fullWidth
          min="1"
        />

        {/* Título */}
        <Input
          label="Título do Episódio"
          type="text"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            handleChange();
          }}
          placeholder="Ex: O Início da Jornada"
          required
          fullWidth
        />

        {/* Logline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Logline <span className="text-red-500">*</span>
          </label>
          <textarea
            value={logline}
            onChange={(e) => {
              setLogline(e.target.value);
              handleChange();
            }}
            placeholder="Frase curta que descreve o conflito central"
            rows={2}
            required
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Sinopse */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sinopse <span className="text-red-500">*</span>
          </label>
          <textarea
            value={sinopse}
            onChange={(e) => {
              setSinopse(e.target.value);
              handleChange();
            }}
            placeholder="Um resumo curto da história, apresentando o protagonista, o conflito, o contexto e o gancho da trama."
            rows={6}
            required
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {episode && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
