"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { CategoryDropdown } from "@/app/components/ui/CategoryDropdown";
import { GranularidadeDropdown } from "@/app/components/ui/GranularidadeDropdown";
import { EpisodioDropdown } from "@/app/components/ui/EpisodioDropdown";
import type { World, Episode, Ficha, Category } from "@/app/types";

interface NewFichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  universeId: string;
  universeName: string;
  worlds: World[];
  categories: Category[];
  onSave: (ficha: Partial<Ficha>) => Promise<void>;
  onOpenCreateCategory?: () => void;
  mode?: "create" | "edit";
  ficha?: Partial<Ficha> | null;
  preSelectedCategory?: string | null;
}

export function NewFichaModal({
  isOpen,
  onClose,
  universeId,
  universeName,
  worlds,
  categories,
  onSave,
  onOpenCreateCategory,
  mode = "create",
  ficha,
  preSelectedCategory,
}: NewFichaModalProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [formData, setFormData] = useState<any>({
    universe_id: universeId,
    world_id: "",
    episodio: null,
    titulo: "",
    resumo: "",
    descricao: "",
    conteudo: "",
    // Campos de diegese para Evento
    data_inicio: "",
    data_fim: "",
    granularidade: "",
    camada: "",
  });
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategorySlug("");
      setFormData({
        universe_id: universeId,
        world_id: "",
        episodio: null,
        titulo: "",
        resumo: "",
        descricao: "",
        conteudo: "",
        data_inicio: "",
        data_fim: "",
        granularidade: "",
        camada: "",
      });
    } else if (isOpen && mode === "create" && preSelectedCategory) {
      // Pré-selecionar categoria em modo criação
      setSelectedCategorySlug(preSelectedCategory);
    } else if (isOpen && mode === "edit" && ficha) {
      // Preencher formulário com dados da ficha em modo edição
      setSelectedCategorySlug(ficha.tipo || "");
      setFormData({
        universe_id: universeId,
        world_id: ficha.world_id || "",
        episodio: ficha.episodio || null,
        titulo: ficha.titulo || "",
        resumo: ficha.resumo || "",
        descricao: ficha.descricao || "",
        conteudo: ficha.conteudo || "",
        data_inicio: ficha.data_inicio || "",
        data_fim: ficha.data_fim || "",
        granularidade: ficha.granularidade_data || "",
        camada: ficha.camada_temporal || "",
      });
    }
  }, [isOpen, universeId, mode, ficha, preSelectedCategory]);

  // Load episodes when world changes
  useEffect(() => {
    if (!formData.world_id) {
      setEpisodes([]);
      return;
    }

    async function loadEpisodes() {
      try {
        const response = await fetch(`/api/episodes?world_id=${formData.world_id}`);
        if (response.ok) {
          const data = await response.json();
          setEpisodes(data.episodes || []);
        }
      } catch (error) {
        console.error("Error loading episodes:", error);
      }
    }

    loadEpisodes();
  }, [formData.world_id, isOpen]);

  const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);
  const selectedWorld = worlds.find(w => w.id === formData.world_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Converter episode_id para formato "numero titulo" se for UUID
      let episodioValue = formData.episodio;
      
      if (formData.episodio && typeof formData.episodio === 'string' && formData.episodio.length === 36) {
        // É um UUID, converter para "numero titulo"
        const selectedEpisode = episodes.find(ep => ep.id === formData.episodio);
        if (selectedEpisode) {
          episodioValue = `${selectedEpisode.numero} ${selectedEpisode.titulo}`;
        }
      }

      await onSave({
        ...formData,
        episodio: episodioValue,
        tipo: selectedCategorySlug,
      });
      onClose();
    } catch (error) {
      console.error("Error saving ficha:", error);
    } finally {
      setLoading(false);
    }
  }

  function getModalTitle() {
    if (!selectedCategorySlug) return mode === "edit" ? "Editar Ficha" : "Nova Ficha";
    
    // Obter nome da categoria
    const categoryName = categories.find(c => c.slug === selectedCategorySlug)?.label || selectedCategorySlug;
    
    // Capitalizar primeira letra
    const capitalizedName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    
    return capitalizedName;
  }

  function renderCategoryFields() {
    if (!selectedCategorySlug) return null;

    // Campos específicos por categoria
    switch (selectedCategorySlug) {
      case "sinopse":
        return (
          <>
            {/* Universo (somente leitura para Sinopse) */}
            <Input
              label="Universo"
              value={universeName}
              disabled
              fullWidth
            />

            {/* Mundo */}
            <WorldsDropdownSingle
              worlds={worlds}
              selectedId={formData.world_id}
              onSelect={(id) => setFormData({ ...formData, world_id: id })}
            />

            {/* Episódio */}
            <EpisodioDropdown
              episodes={episodes}
              value={formData.episodio}
              onSelect={(episodeId) => setFormData({ ...formData, episodio: episodeId })}
            />

            <Input
              label="Logline"
              value={formData.resumo}
              onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
              placeholder="Ex: Um jovem descobre que tem poderes mágicos"
              required
              fullWidth
            />
            <Textarea
              label="Sinopse"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Descreva a sinopse completa do episódio"
              required
              fullWidth
              rows={6}
            />
          </>
        );

      case "conceito":
      case "regra":
        return (
          <>
            {/* Universo (somente leitura) */}
            <Input
              label="Universo"
              value={universeName}
              disabled
              fullWidth
            />

            {/* Mundo (opcional) */}
            <WorldsDropdownSingle
              label="Mundo"
              worlds={worlds}
              selectedId={formData.world_id}
              onSelect={(id) => setFormData({ ...formData, world_id: id })}
              onCreate={() => {
                // Abre modal para criar novo mundo
                // Pode ser implementado depois
              }}
            />

            {/* Mensagem informativa */}
            {!formData.world_id && (
              <p className="text-xs font-bold text-primary-600 dark:text-primary-400">
                Este {selectedCategorySlug} será aplicado em todo o universo {universeName}
              </p>
            )}

            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder={
                selectedCategorySlug === "conceito"
                  ? "Ex: Toda experiência gera uma lição"
                  : "Ex: Ninguém pode viajar no tempo"
              }
              required
              fullWidth
            />
            <Textarea
              label="Descrição"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder={
                selectedCategorySlug === "conceito"
                  ? "Descreva o conceito fundamental que guia este universo ou mundo"
                  : "Descreva a regra que define os limites e possibilidades deste universo ou mundo"
              }
              required
              fullWidth
              rows={6}
            />
          </>
        );

      case "evento":
        return (
          <>
            {/* Universo */}
            <Input
              label="Universo"
              value={universeName}
              disabled
              fullWidth
            />

            {/* Mundo */}
            <WorldsDropdownSingle
              worlds={worlds}
              selectedId={formData.world_id}
              onSelect={(id) => setFormData({ ...formData, world_id: id })}
            />

            {/* Episódio */}
            <EpisodioDropdown
              value={formData.episodio}
              episodes={episodes || []}
              onSelect={(id) => setFormData({ ...formData, episodio: id })}
            />

            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              fullWidth
            />
            <Input
              label="Resumo"
              value={formData.resumo}
              onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
              required
              fullWidth
            />
            <Textarea
              label="Descrição"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              required
              fullWidth
              rows={6}
            />

            {/* Seção de Diegese */}
            <div className="border-t border-border-light-default dark:border-border-dark-default pt-4 mt-4">
              <h3 className="text-sm font-semibold text-text-light-primary dark:text-dark-primary mb-4">
                Detalhes de data do evento
              </h3>
              
              <div className="space-y-4">
                <Input
                  label="Data de Início"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  fullWidth
                />
                <Input
                  label="Data de Fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  fullWidth
                />
                <GranularidadeDropdown
                  value={formData.granularidade}
                  onChange={(value) => setFormData({ ...formData, granularidade: value })}
                />
              </div>
            </div>
          </>
        );

      case "personagem":
        return (
          <>
            {/* Universo */}
            <Input
              label="Universo"
              value={universeName}
              disabled
              fullWidth
            />

            {/* Mundo */}
            <WorldsDropdownSingle
              worlds={worlds}
              selectedId={formData.world_id}
              onSelect={(id) => setFormData({ ...formData, world_id: id })}
            />

            {/* Episódio */}
            <EpisodioDropdown
              value={formData.episodio}
              episodes={episodes || []}
              onSelect={(id) => setFormData({ ...formData, episodio: id })}
            />

            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              fullWidth
            />
            <Input
              label="Resumo"
              value={formData.resumo}
              onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
              required
              fullWidth
            />
            <Textarea
              label="Descrição"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              required
              fullWidth
              rows={6}
            />
          </>
        );

      default:
        return (
          <>
            {/* Universo */}
            <Input
              label="Universo"
              value={universeName}
              disabled
              fullWidth
            />

            {/* Mundo */}
            <WorldsDropdownSingle
              worlds={worlds}
              selectedId={formData.world_id}
              onSelect={(id) => setFormData({ ...formData, world_id: id })}
            />

            {/* Episódio */}
            <EpisodioDropdown
              value={formData.episodio}
              episodes={episodes || []}
              onSelect={(id) => setFormData({ ...formData, episodio: id })}
            />

            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              fullWidth
            />
            <Input
              label="Resumo"
              value={formData.resumo}
              onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
              required
              fullWidth
            />
            <Textarea
              label="Descrição"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              required
              fullWidth
              rows={6}
            />
          </>
        );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        {!selectedCategorySlug && (
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-dark-primary mb-3">
              Selecione o tipo de ficha
            </label>
            <CategoryDropdown
              categories={categories}
              selectedSlug={selectedCategorySlug}
              onSelect={setSelectedCategorySlug}
              onOpenCreateCategory={onOpenCreateCategory}
            />
          </div>
        )}

        {/* Category-specific fields */}
        {selectedCategorySlug && (
          <>
            {renderCategoryFields()}

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-6 border-t border-border-light-default dark:border-border-dark-default">
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={loading}
              >
                {mode === "edit" ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
