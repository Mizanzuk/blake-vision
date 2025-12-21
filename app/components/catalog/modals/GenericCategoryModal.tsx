"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Textarea, Select, Button, MentionTextarea } from "@/app/components/ui";
import { toast } from "sonner";
import type { World, Ficha, Category } from "@/app/types";
import ImageAlbum, { ImageItem } from "./ImageAlbum";

interface Episode {
  id: string;
  numero: number;
  titulo: string;
}

interface GenericCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ficha: Partial<Ficha> | null;
  worlds: World[];
  category: Category;
  onSave: (ficha: any) => Promise<void>;
  onDelete?: (fichaId: string) => Promise<void>;
}

export default function GenericCategoryModal({
  isOpen,
  onClose,
  ficha,
  worlds,
  category,
  onSave,
  onDelete,
}: GenericCategoryModalProps) {
  // Garantir que worlds seja sempre um array
  const safeWorlds = worlds || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    world_id: "",
    tipo: category.slug,
    titulo: "",
    resumo: "",
    conteudo: "",
    episodio: "",
    episode_id: null,
    imagem_url: "",
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [showNewEpisodeInput, setShowNewEpisodeInput] = useState(false);
  const [newEpisode, setNewEpisode] = useState("");

  useEffect(() => {
    if (ficha) {
      setFormData({
        ...ficha,
        tipo: category.slug,
        episodio: ficha.episodio || "",
      });
      // TODO: Carregar imagens do álbum se existirem
    } else {
      setFormData({
        world_id: safeWorlds.length > 0 ? safeWorlds[0].id : "",
        tipo: category.slug,
        titulo: "",
        resumo: "",
        conteudo: "",
        episodio: "",
        episode_id: null,
        imagem_url: "",
      });
      setImages([]);
    }
  }, [ficha, isOpen, worlds, category.slug]);

  useEffect(() => {
    async function loadEpisodes() {
      if (!formData.world_id) {
        setEpisodes([]);
        return;
      }

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

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  async function handleAddEpisode() {
    if (!newEpisode.trim()) return;

    try {
      const response = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          world_id: formData.world_id,
          titulo: newEpisode,
        }),
      });

      if (response.ok) {
        const newEp = await response.json();
        setEpisodes([...episodes, newEp]);
        setFormData((prev: any) => ({
          ...prev,
          episode_id: newEp.id,
          episodio: String(newEp.numero),
        }));
        setNewEpisode("");
        setShowNewEpisodeInput(false);
        toast.success("Episódio criado com sucesso!");
      }
    } catch (error) {
      console.error("Error creating episode:", error);
      toast.error("Erro ao criar episódio");
    }
  }

  async function handleGenerateDescription() {
    if (!formData.titulo.trim()) {
      toast.error("Digite um título primeiro");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: formData.titulo,
          tipo: category.slug,
        }),
      });

      if (response.ok) {
        const { description } = await response.json();
        setFormData((prev: any) => ({ ...prev, resumo: description }));
        toast.success("Descrição gerada com sucesso!");
      } else {
        toast.error("Erro ao gerar descrição");
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Erro ao gerar descrição");
    } finally {
      setIsGeneratingDescription(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    
    setIsSubmitting(true);
    try {
      // TODO: Upload de imagens para Supabase Storage
      const principalImage = images.find((img) => img.isPrincipal);
      
      const dataToSave = {
        ...formData,
        episode_id: formData.episode_id || null,
        episodio: formData.episodio || null,
        imagem_url: principalImage?.url || formData.imagem_url || null,
        // TODO: Salvar álbum completo em campo separado
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Error saving ficha:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!ficha?.id || !onDelete) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir ${ficha.titulo ? `"${ficha.titulo}"` : "esta ficha"}? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(ficha.id);
      toast.success("Ficha excluída com sucesso!");
      onClose();
    } catch (error) {
      console.error("Error deleting ficha:", error);
      toast.error("Erro ao excluir ficha");
    } finally {
      setIsDeleting(false);
    }
  }

  const selectedWorld = worlds.find(w => w.id === formData.world_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ficha ? `Editar ${category.label}` : `Nov${category.label.endsWith('a') ? 'a' : 'o'} ${category.label}`}
      size="xl"
      footer={
        <>
          <div className="flex-1">
            {ficha?.id && onDelete && (
              <Button
                size="sm"
                variant="danger"
                onClick={handleDelete}
                loading={isDeleting}
              >
                Excluir
              </Button>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Salvar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mundo */}
        <Select
          label="Mundo"
          options={safeWorlds.map(w => ({ value: w.id, label: w.nome }))}
          value={formData.world_id}
          onChange={(e) => handleChange("world_id", e.target.value)}
          required
          fullWidth
        />

        {/* Episódio */}
        {selectedWorld?.has_episodes && (
          <div>
            <Select
              label="Episódio"
              options={[
                { value: "", label: "Nenhum episódio" },
                ...(episodes || []).map(e => ({ value: e.id, label: `Episódio ${e.numero}: ${e.titulo}` })),
                { value: "__new__", label: "+ Novo Episódio" },
              ]}
              value={formData.episode_id || ""}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setShowNewEpisodeInput(true);
                } else if (e.target.value) {
                  const selectedEpisode = episodes.find(ep => ep.id === e.target.value);
                  if (selectedEpisode) {
                    setFormData((prev: any) => ({
                      ...prev,
                      episode_id: selectedEpisode.id,
                      episodio: String(selectedEpisode.numero)
                    }));
                  }
                } else {
                  setFormData((prev: any) => ({
                    ...prev,
                    episode_id: null,
                    episodio: ""
                  }));
                }
              }}
              fullWidth
            />
            
            {showNewEpisodeInput && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Nome do episódio"
                  value={newEpisode}
                  onChange={(e) => setNewEpisode(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddEpisode}
                >
                  Adicionar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewEpisodeInput(false);
                    setNewEpisode("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Título */}
        <Input
          label="Título"
          value={formData.titulo}
          onChange={(e) => handleChange("titulo", e.target.value)}
          placeholder={`Digite o título ${category.label.toLowerCase()}`}
          required
          fullWidth
        />

        {/* Resumo com botão de gerar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              Resumo
            </label>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerateDescription}
              loading={isGeneratingDescription}
              type="button"
            >
              ✨ Gerar com IA
            </Button>
          </div>
          <Textarea
            value={formData.resumo}
            onChange={(e) => handleChange("resumo", e.target.value)}
            placeholder={`Breve descrição ${category.label.toLowerCase()}`}
            fullWidth
          />
        </div>

        {/* Descrição */}
        <MentionTextarea
          label="Descrição"
          value={formData.conteudo}
          onChange={(value) => handleChange("conteudo", value)}
          placeholder={`Escreva a descrição completa ${category.label.toLowerCase()}...`}
          fullWidth
        />

        {/* Álbum de Imagens */}
        <div className="border-t border-border-light-default dark:border-border-dark-default pt-4 mt-4">
          <ImageAlbum
            images={images}
            onChange={setImages}
          />
        </div>
      </form>
    </Modal>
  );
}
