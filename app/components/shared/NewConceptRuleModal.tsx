"use client";
// Force recompile: 2025-12-12T00:18:30Z

import { useState, useEffect } from "react";
import type { Ficha, Universe, World } from "@/app/types";
import { toast } from "sonner";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { UniverseDropdown } from "@/app/components/ui/UniverseDropdown";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import { EpisodioDropdown } from "@/app/components/ui/EpisodioDropdown";
import { getSupabaseClient } from "@/app/lib/supabase/client";

interface Episode {
  id: string;
  numero: number;
  titulo: string;
  world_id: string;
}

interface NewConceptRuleModalProps {
  isOpen: boolean;
  item: Ficha | null;
  tipo: "conceito" | "regra";
  universes: Universe[];
  worlds: World[];
  preSelectedUniverseId?: string;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  onOpenCreateEpisode?: () => void;
}

export default function NewConceptRuleModal({
  isOpen,
  item,
  tipo,
  universes,
  worlds,
  preSelectedUniverseId = "",
  onSave,
  onDelete,
  onClose,
  onOpenCreateEpisode,
}: NewConceptRuleModalProps) {
  const [selectedUniverseId, setSelectedUniverseId] = useState(preSelectedUniverseId);
  const [selectedWorldId, setSelectedWorldId] = useState("");
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [availableEpisodes, setAvailableEpisodes] = useState<Episode[]>([]);

  // Carregar episódios quando mundo muda
  useEffect(() => {
    if (selectedWorldId) {
      const loadEpisodes = async () => {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('episodes')
          .select('id, numero, titulo, world_id')
          .eq('world_id', selectedWorldId);
        
        if (!error && data) {
          setAvailableEpisodes(data as Episode[]);
        }
      };
      loadEpisodes();
    } else {
      setAvailableEpisodes([]);
      setSelectedEpisodeId(null);
    }
  }, [selectedWorldId]);

  // Carregar dados do item ao editar
  useEffect(() => {
    if (item) {
      if (item.world_id) {
        const world = worlds.find(w => w.id === item.world_id);
        const universeId = world?.universe_id || preSelectedUniverseId;
        setSelectedUniverseId(universeId);
        setSelectedWorldId(item.world_id);
      } else {
        setSelectedUniverseId(preSelectedUniverseId || "");
        setSelectedWorldId("");
      }
      setTitulo(item.titulo || "");
      setResumo(item.resumo || "");
      setSelectedEpisodeId(item.episode_id || null);
    } else {
      setSelectedUniverseId(preSelectedUniverseId || "");
      setSelectedWorldId("");
      setTitulo("");
      setResumo("");
      setSelectedEpisodeId(null);
    }
  }, [item, preSelectedUniverseId, worlds]);

  // Fechar modal com Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filtrar mundos do universo selecionado
  const filteredWorlds = worlds.filter(w => w.universe_id === selectedUniverseId);

  function handleSave() {
    console.log("[NewConceptRuleModal] Salvando...", { selectedUniverseId, titulo, resumo });

    // Validações
    if (!selectedUniverseId) {
      toast.error("Selecione um universo");
      return;
    }

    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!resumo.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }

    // Validação de episódio é obrigatória apenas para sinopse (se aplicável)
    // Nota: tipo é "conceito" ou "regra" neste modal, sinopses são criadas em NewFichaModal

    const itemData = {
      id: item?.id,
      world_id: selectedWorldId || null,
      tipo,
      titulo: titulo.trim(),
      resumo: resumo.trim(),
      episode_id: selectedEpisodeId || null,
    };

    console.log("[NewConceptRuleModal] Dados a salvar:", itemData);
    onSave(itemData);
  }

  function handleDeleteClick() {
    setShowDeleteConfirm(true);
  }

  function handleDeleteConfirm() {
    if (!item?.id || !onDelete) return;
    setShowDeleteConfirm(false);
    onDelete(item.id);
  }

  function handleDeleteCancel() {
    setShowDeleteConfirm(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-light-base dark:bg-dark-base rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-border-light-default dark:border-border-dark-default">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised">
          <h2 className="text-xl font-bold text-text-light-primary dark:text-dark-primary">
            {item ? `Editar ${tipo === "conceito" ? "Conceito" : "Regra"}` : `Novo ${tipo === "conceito" ? "Conceito" : "Regra"}`}
          </h2>
          <button
            onClick={onClose}
            className="text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Universo */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-2">
              Universo <span className="text-red-500">*</span>
            </label>
            <UniverseDropdown
              universes={universes}
              selectedId={selectedUniverseId}
              onSelect={(id) => {
                setSelectedUniverseId(id);
                setSelectedWorldId(""); // Reset mundo ao mudar universo
              }}
            />
          </div>

          {/* Mundo */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-2">
              Mundo
            </label>
            <WorldsDropdownSingle
              worlds={filteredWorlds}
              selectedId={selectedWorldId}
              onSelect={(id) => setSelectedWorldId(id)}
              onEdit={() => {}} // No modal, não permitimos editar mundos
              onDelete={() => {}} // No modal, não permitimos deletar mundos
              onCreate={() => {}} // No modal, não permitimos criar mundos
              disabled={!selectedUniverseId}
            />
            {selectedUniverseId && !selectedWorldId && (
              <p className="mt-2 text-xs font-bold text-primary-600 dark:text-primary-400">
                Este {tipo} será aplicado em todo o universo {universes.find(u => u.id === selectedUniverseId)?.nome}
              </p>
            )}
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={`Ex: ${tipo === "conceito" ? "Toda experiência gera uma lição" : "Ninguém pode viajar no tempo"}`}
              className="w-full px-3 py-2.5 border border-border-light-default dark:border-border-dark-default rounded-lg bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder:text-text-light-secondary/50 dark:placeholder:text-dark-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Resumo */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              placeholder={`Descreva ${tipo === "conceito" ? "o conceito fundamental que guia este universo ou mundo" : "a regra que define os limites e possibilidades deste universo ou mundo"}`}
              rows={6}
              className="w-full px-3 py-2.5 border border-border-light-default dark:border-border-dark-default rounded-lg bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder:text-text-light-secondary/50 dark:placeholder:text-dark-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
            />
          </div>

          {/* Episódio */}
          {selectedWorldId && availableEpisodes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-2">
                Episódio
              </label>
              <EpisodioDropdown
                episodes={availableEpisodes}
                selectedId={selectedEpisodeId}
                onSelect={(episodeId) => setSelectedEpisodeId(episodeId || null)}
                onCreate={onOpenCreateEpisode}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised">
          <div>
            {item && onDelete && (
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-text-light-primary dark:text-dark-primary bg-light-base dark:bg-dark-base hover:bg-light-hover dark:hover:bg-dark-hover border border-border-light-default dark:border-border-dark-default rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir este ${tipo === "conceito" ? "conceito" : "regra"}?`}
        itemName={titulo}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
