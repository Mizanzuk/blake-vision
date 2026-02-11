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

interface EditFichaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  ficha: Partial<Ficha> | null;
  universeId: string;
  universeName: string;
  worldId: string;
  episodeId: string | null;
  worlds: World[];
  categories: Category[];
  onSave: (ficha: Partial<Ficha>) => Promise<void>;
  onOpenCreateCategory?: () => void;
}

export function EditFichaUploadModal({
  isOpen,
  onClose,
  ficha,
  universeId,
  universeName,
  worldId,
  episodeId,
  worlds,
  categories,
  onSave,
  onOpenCreateCategory,
}: EditFichaUploadModalProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [formData, setFormData] = useState<any>({
    universe_id: universeId,
    world_id: worldId,
    episode_id: episodeId,
    titulo: "",
    resumo: "",
    descricao: "",
    tags: "",
    // Campos de diegese para Evento
    data_inicio: "",
    data_fim: "",
    granularidade: "",
    camada: "",
  });
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);

  // Initialize form when modal opens or ficha changes
  useEffect(() => {
    if (isOpen && ficha) {
      setSelectedCategorySlug(ficha.category_slug || "");
      setFormData({
        universe_id: universeId,
        world_id: worldId || ficha.world_id || "",
        episode_id: episodeId || ficha.episode_id || null,
        titulo: ficha.titulo || "",
        resumo: ficha.resumo || "",
        descricao: ficha.descricao || "",
        tags: ficha.tags?.join(", ") || "",
        data_inicio: ficha.data_inicio || "",
        data_fim: ficha.data_fim || "",
        granularidade: ficha.granularidade || "",
        camada: ficha.camada || "",
      });
    }
  }, [isOpen, ficha, universeId, worldId, episodeId]);

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
  }, [formData.world_id]);

  const selectedCategory = categories.find(c => c.slug === selectedCategorySlug);
  const selectedWorld = worlds.find(w => w.id === formData.world_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      await onSave({
        ...ficha,
        ...formData,
        category_slug: selectedCategorySlug,
        tags: tagsArray,
      });
      onClose();
    } catch (error) {
      console.error("Error saving ficha:", error);
    } finally {
      setLoading(false);
    }
  }

  function getModalTitle() {
    if (!selectedCategorySlug) return "Editar Ficha";
    
    switch (selectedCategorySlug) {
      case "sinopse":
        return "Editar Sinopse";
      case "conceito":
        return "Editar Conceito";
      case "regra":
        return "Editar Regra";
      case "evento":
        return "Editar Evento";
      case "local":
        return "Editar Local";
      case "personagem":
        return "Editar Personagem";
      case "roteiro":
        return "Editar Roteiro";
      default:
        return `Editar Ficha de ${selectedCategory?.label || ""}`;
    }
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
              value={formData.episode_id}
              onSelect={(episodeId) => setFormData({ ...formData, episode_id: episodeId })}
            />

            <Input
              label="Logline"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Um jovem descobre que tem poderes mágicos"
              required
              fullWidth
            />
            <Textarea
              label="Sinopse"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
              value={formData.episode_id}
              episodes={episodes || []}
              onSelect={(id) => setFormData({ ...formData, episode_id: id })}
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
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
                  onSelect={(value) => setFormData({ ...formData, granularidade: value })}
                  required
                />
                <Input
                  label="Camada (opcional)"
                  value={formData.camada}
                  onChange={(e) => setFormData({ ...formData, camada: e.target.value })}
                  placeholder="Ex: Presente, Passado, Futuro"
                  fullWidth
                />
              </div>
            </div>

            {/* Tags */}
            <Input
              label="Tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Ex: ação, drama, mistério (separadas por vírgula)"
              fullWidth
            />
          </>
        );

      case "local":
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
              value={formData.episode_id}
              episodes={episodes || []}
              onSelect={(id) => setFormData({ ...formData, episode_id: id })}
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
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
              fullWidth
              rows={6}
            />

            {/* Tags */}
            <Input
              label="Tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Ex: importante, secundário, etc (separadas por vírgula)"
              fullWidth
            />
          </>
        );

      case "roteiro":
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
              value={formData.episode_id}
              episodes={episodes || []}
              onSelect={(id) => setFormData({ ...formData, episode_id: id })}
            />

            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              fullWidth
            />
            <Textarea
              label="Conteúdo do Roteiro"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
              fullWidth
              rows={12}
            />
          </>
        );

      default:
        // Categoria customizada
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
              value={formData.episode_id}
              episodes={episodes || []}
              onSelect={(id) => setFormData({ ...formData, episode_id: id })}
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
              fullWidth
            />
            <Textarea
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
              fullWidth
              rows={6}
            />

            {/* Tags */}
            <Input
              label="Tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Ex: tag1, tag2, tag3 (separadas por vírgula)"
              fullWidth
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
      size="sm"
      noBorder={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropdown de Categoria - sempre visível para edição */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-text-light-primary dark:text-dark-primary">
            Categoria
          </label>
          <select
            value={selectedCategorySlug}
            onChange={(e) => setSelectedCategorySlug(e.target.value)}
            className="flex-1 px-3 py-2 border border-border-light-default dark:border-border-dark-default rounded-md bg-white dark:bg-dark-secondary text-text-light-primary dark:text-dark-primary"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
            <option value="__new__">+ Nova Categoria</option>
          </select>
        </div>

        {/* Campos específicos da categoria */}
        {renderCategoryFields()}

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} size="sm">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!selectedCategorySlug || loading}
            size="sm"
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
