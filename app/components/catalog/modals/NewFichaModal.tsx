"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { World, Episode, Ficha, Category } from "@/app/types";

interface NewFichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  universeId: string;
  worlds: World[];
  categories: Category[];
  onSave: (ficha: Partial<Ficha>) => Promise<void>;
}

export function NewFichaModal({
  isOpen,
  onClose,
  universeId,
  worlds,
  categories,
  onSave,
}: NewFichaModalProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [formData, setFormData] = useState<any>({
    universe_id: universeId,
    world_id: "",
    episode_id: null,
    titulo: "",
    resumo: "",
    descricao: "",
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
        episode_id: null,
        titulo: "",
        resumo: "",
        descricao: "",
      });
    }
  }, [isOpen, universeId]);

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
          setEpisodes(data);
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
      await onSave({
        ...formData,
        category_slug: selectedCategorySlug,
      });
      onClose();
    } catch (error) {
      console.error("Error saving ficha:", error);
    } finally {
      setLoading(false);
    }
  }

  function renderCategoryFields() {
    if (!selectedCategorySlug) return null;

    // Campos comuns para todas as categorias
    const commonFields = (
      <>
        {/* Mundo */}
        <Select
          label="Mundo"
          value={formData.world_id}
          onChange={(e) => setFormData({ ...formData, world_id: e.target.value })}
          required
          fullWidth
        >
          <option value="">Selecione um mundo</option>
          {worlds.map(w => (
            <option key={w.id} value={w.id}>{w.nome}</option>
          ))}
        </Select>

        {/* Episódio (se o mundo tiver episódios) */}
        {selectedWorld?.has_episodes && (
          <Select
            label="Episódio"
            value={formData.episode_id || ""}
            onChange={(e) => setFormData({ ...formData, episode_id: e.target.value || null })}
            fullWidth
          >
            <option value="">Nenhum episódio</option>
            {episodes.map(ep => (
              <option key={ep.id} value={ep.id}>
                Episódio {ep.numero}: {ep.titulo}
              </option>
            ))}
          </Select>
        )}
      </>
    );

    // Campos específicos por categoria
    switch (selectedCategorySlug) {
      case "sinopse":
        return (
          <>
            {commonFields}
            <Input
              label="Logline"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
              fullWidth
            />
            <Textarea
              label="Sinopse"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
            {commonFields}
            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
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
          </>
        );

      case "evento":
      case "local":
      case "personagem":
        return (
          <>
            {commonFields}
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
          </>
        );

      case "roteiro":
        return (
          <>
            {commonFields}
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
            {commonFields}
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
          </>
        );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Ficha"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropdown de Categoria */}
        <Select
          label="Categoria"
          value={selectedCategorySlug}
          onChange={(e) => setSelectedCategorySlug(e.target.value)}
          required
          fullWidth
        >
          <option value="">Selecione uma categoria</option>
          {categories.map(cat => (
            <option key={cat.slug} value={cat.slug}>
              {cat.label}
            </option>
          ))}
          <option value="__new__">+ Criar Nova Categoria</option>
        </Select>

        {/* Campos específicos da categoria */}
        {renderCategoryFields()}

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!selectedCategorySlug || loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
