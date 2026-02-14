'use client';

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { CategoryDropdown } from "@/app/components/ui/CategoryDropdown";
import { GranularidadeDropdown } from "@/app/components/ui/GranularidadeDropdown";
import type { World, Ficha, Category } from "@/app/types";
import { getSupabaseClient } from "@/app/lib/supabase/client";

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
  const [availableEpisodes, setAvailableEpisodes] = useState<string[]>([]);
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
      setAvailableEpisodes([]);
      return;
    }

    async function loadEpisodes() {
      try {
        const supabase = getSupabaseClient();
        
        // Buscar fichas do tipo "sinopse" que representam episódios
        const { data: sinopseFichas, error } = await supabase
          .from('fichas')
          .select('titulo')
          .eq('world_id', formData.world_id)
          .eq('tipo', 'sinopse')
          .order('titulo', { ascending: true });

        if (error) {
          console.error("Error loading episodes:", error);
          return;
        }

        // Extrair títulos das sinopses como episódios disponíveis
        const episodes = (sinopseFichas || [])
          .map(f => f.titulo)
          .filter((titulo): titulo is string => !!titulo);

        setAvailableEpisodes(episodes);
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
      await onSave({
        ...formData,
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

            {/* Episódio - Dropdown simples com string */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-text-light-secondary dark:text-text-dark-secondary">
                Episódio
              </label>
              <select
                value={formData.episodio || ""}
                onChange={(e) => setFormData({ ...formData, episodio: e.target.value || null })}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-light-raised dark:bg-dark-raised border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option value="">Nenhum episódio</option>
                {availableEpisodes.map((ep) => (
                  <option key={ep} value={ep}>
                    {ep}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Logline"
              value={formData.resumo}
              onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
              placeholder="Ex: Um jovem descobre que tem poderes mágicos"
              required
              fullWidth
            />

            <Textarea
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição detalhada da sinopse"
              required
              fullWidth
            />

            <Textarea
              label="Conteúdo"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Conteúdo completo da sinopse"
              fullWidth
            />
          </>
        );

      case "evento":
        return (
          <>
            <Input
              label="Universo"
              value={universeName}
              disabled
              fullWidth
            />

            <WorldsDropdownSingle
              worlds={worlds}
              selectedId={formData.world_id}
              onSelect={(id) => setFormData({ ...formData, world_id: id })}
            />

            {/* Episódio - Dropdown simples com string */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-text-light-secondary dark:text-text-dark-secondary">
                Episódio
              </label>
              <select
                value={formData.episodio || ""}
                onChange={(e) => setFormData({ ...formData, episodio: e.target.value || null })}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-light-raised dark:bg-dark-raised border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option value="">Nenhum episódio</option>
                {availableEpisodes.map((ep) => (
                  <option key={ep} value={ep}>
                    {ep}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: A Descoberta"
              required
              fullWidth
            />

            <Input
              label="Resumo"
              value={formData.resumo}
              onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
              placeholder="Breve resumo do evento"
              required
              fullWidth
            />

            <Textarea
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição detalhada do evento"
              fullWidth
            />

            <Input
              label="Data Início"
              type="date"
              value={formData.data_inicio}
              onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              fullWidth
            />

            <Input
              label="Data Fim"
              type="date"
              value={formData.data_fim}
              onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              fullWidth
            />

            <GranularidadeDropdown
              value={formData.granularidade}
              onChange={(value) => setFormData({ ...formData, granularidade: value })}
            />
          </>
        );

      default:
        // Campos genéricos para outras categorias
        return (
          <>
            <Input
              label="Universo"
              value={universeName}
              disabled
              fullWidth
            />

            <WorldsDropdownSingle
              worlds={worlds}
              selectedId={formData.world_id}
              onSelect={(id) => setFormData({ ...formData, world_id: id })}
            />

            {/* Episódio - Dropdown simples com string */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-text-light-secondary dark:text-text-dark-secondary">
                Episódio
              </label>
              <select
                value={formData.episodio || ""}
                onChange={(e) => setFormData({ ...formData, episodio: e.target.value || null })}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 text-sm border rounded-lg bg-light-raised dark:bg-dark-raised border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option value="">Nenhum episódio</option>
                {availableEpisodes.map((ep) => (
                  <option key={ep} value={ep}>
                    {ep}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título da ficha"
              required
              fullWidth
            />

            <Input
              label="Resumo"
              value={formData.resumo}
              onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
              placeholder="Breve resumo"
              fullWidth
            />

            <Textarea
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição detalhada"
              fullWidth
            />

            <Textarea
              label="Conteúdo"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Conteúdo completo"
              fullWidth
            />
          </>
        );
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selection */}
        {!selectedCategorySlug && (
          <CategoryDropdown
            categories={categories}
            selectedSlug={selectedCategorySlug}
            onSelect={setSelectedCategorySlug}
            onOpenCreateCategory={onOpenCreateCategory}
          />
        )}

        {/* Category-specific fields */}
        {renderCategoryFields()}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCategorySlug || !formData.titulo}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
