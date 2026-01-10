"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { CategoryDropdown } from "@/app/components/ui/CategoryDropdown";
import type { World, Episode, Ficha, Category } from "@/app/types";

interface NewFichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  universeId: string;
  universeName: string;
  worlds: World[];
  categories: Category[];
  onSave: (ficha: Partial<Ficha>) => Promise<void>;
}

export function NewFichaModal({
  isOpen,
  onClose,
  universeId,
  universeName,
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
        episode_id: null,
        titulo: "",
        resumo: "",
        descricao: "",
        data_inicio: "",
        data_fim: "",
        granularidade: "",
        camada: "",
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

  function getModalTitle() {
    if (!selectedCategorySlug) return "Nova Ficha";
    
    switch (selectedCategorySlug) {
      case "sinopse":
        return "Nova Sinopse";
      case "conceito":
        return "Novo Conceito";
      case "regra":
        return "Nova Regra";
      case "evento":
        return "Novo Evento";
      case "local":
        return "Novo Local";
      case "personagem":
        return "Novo Personagem";
      case "roteiro":
        return "Novo Roteiro";
      default:
        return `Nova Ficha de ${selectedCategory?.label || ""}`;
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
            <Select
              label="Mundo"
              value={formData.world_id}
              onChange={(e) => setFormData({ ...formData, world_id: e.target.value })}
              fullWidth
            >
              <option value="">Selecione um Mundo</option>
              {worlds.map(w => (
                <option key={w.id} value={w.id}>{w.nome}</option>
              ))}
            </Select>

            {/* Episódio */}
            <Select
              label="Episódio"
              value={formData.episode_id || ""}
              onChange={(e) => setFormData({ ...formData, episode_id: e.target.value || null })}
              required
              fullWidth
            >
              <option value="">Selecione um episódio</option>
              {(episodes || []).map(ep => (
                <option key={ep.id} value={ep.id}>
                  Episódio {ep.numero}: {ep.titulo}
                </option>
              ))}
            </Select>

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

            {/* Mundo (opcional) */}
            <Select
              label="Mundo"
              value={formData.world_id}
              onChange={(e) => setFormData({ ...formData, world_id: e.target.value })}
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
                {(episodes || []).map(ep => (
                  <option key={ep.id} value={ep.id}>
                    Episódio {ep.numero}: {ep.titulo}
                  </option>
                ))}
              </Select>
            )}

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
                <Select
                  label="Granularidade"
                  value={formData.granularidade}
                  onChange={(e) => setFormData({ ...formData, granularidade: e.target.value })}
                  fullWidth
                >
                  <option value="">Selecione a granularidade</option>
                  <option value="ano">Ano</option>
                  <option value="mes">Mês</option>
                  <option value="dia">Dia</option>
                  <option value="hora">Hora</option>
                </Select>
                <Input
                  label="Camada (opcional)"
                  value={formData.camada}
                  onChange={(e) => setFormData({ ...formData, camada: e.target.value })}
                  placeholder="Ex: Presente, Passado, Futuro"
                  fullWidth
                />
              </div>
            </div>
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
                {(episodes || []).map(ep => (
                  <option key={ep.id} value={ep.id}>
                    Episódio {ep.numero}: {ep.titulo}
                  </option>
                ))}
              </Select>
            )}

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

            {/* TODO: Álbum de imagens */}
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
                {(episodes || []).map(ep => (
                  <option key={ep.id} value={ep.id}>
                    Episódio {ep.numero}: {ep.titulo}
                  </option>
                ))}
              </Select>
            )}

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
                {(episodes || []).map(ep => (
                  <option key={ep.id} value={ep.id}>
                    Episódio {ep.numero}: {ep.titulo}
                  </option>
                ))}
              </Select>
            )}

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
      title={getModalTitle()}
      size="sm"
      noBorder={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropdown de Categoria (só aparece se nenhuma categoria foi selecionada) */}
        {!selectedCategorySlug && (
          <CategoryDropdown
            label="Categoria"
            categories={categories}
            selectedSlug={selectedCategorySlug}
            onSelect={setSelectedCategorySlug}
          />
        )}

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
