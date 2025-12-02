"use client";

import { useState, useEffect, FormEvent } from "react";
import { Modal, Input, Textarea, Button } from "@/app/components/ui";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { toast } from "sonner";
import type { Category } from "@/app/types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Partial<Category> | null;
  onSave: (category: any) => Promise<void>;
  onDelete?: (slug: string) => Promise<void>;
}

export default function CategoryModal({
  isOpen,
  onClose,
  category,
  onSave,
  onDelete,
}: CategoryModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  const [formData, setFormData] = useState({
    slug: "",
    label: "",
    prefix: "",
    description: "",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        slug: category.slug || "",
        label: category.label || "",
        prefix: category.prefix || "",
        description: category.description || "",
      });
    } else {
      setFormData({
        slug: "",
        label: "",
        prefix: "",
        description: "",
      });
    }
  }, [category, isOpen]);

  function handleLabelChange(label: string) {
    setFormData({ ...formData, label });
    
    // Auto-generate slug from label (only for new categories)
    if (!category) {
      const slug = label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      setFormData(prev => ({ ...prev, slug }));
      
      // Auto-generate prefix from label
      const prefix = label
        .toUpperCase()
        .split(" ")
        .map(word => word[0])
        .join("")
        .slice(0, 3);
      setFormData(prev => ({ ...prev, prefix }));
    }
  }

  async function handleGenerateDescription() {
    if (!formData.label) {
      toast.error("Digite um nome para a categoria primeiro");
      return;
    }

    setIsGeneratingDescription(true);

    try {
      const response = await fetch("/api/categories/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.label,
          prefixo: formData.prefix,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ ...formData, description: data.description });
        toast.success("Descrição gerada com IA!");
      } else {
        toast.error(data.error || "Erro ao gerar descrição");
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Erro ao gerar descrição");
    } finally {
      setIsGeneratingDescription(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!formData.slug.trim()) {
      toast.error("Slug é obrigatório");
      return;
    }
    if (!formData.label.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!category?.slug || !onDelete) return;
    
    if (!confirm("Tem certeza que deseja excluir esta categoria? Fichas com este tipo ficarão sem categoria.")) {
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete(category.slug);
      onClose();
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "Editar Categoria" : "Nova Categoria"}
      footer={
        <>
          {category && onDelete && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleDelete}
              loading={isDeleting}
              className="mr-auto"
            >
              {t.common.delete}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            {t.common.save}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome"
          value={formData.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Ex: Personagem, Local, Evento"
          required
          fullWidth
        />

        {/* Slug field - only show when creating new category */}
        {!category && (
          <Input
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="personagem"
            required
            fullWidth
            helperText="Identificador único (gerado automaticamente)"
          />
        )}

        <Input
          label="Prefixo"
          value={formData.prefix}
          onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
          placeholder="PER"
          fullWidth
          maxLength={3}
          helperText="3 letras para códigos (ex: PER-001)"
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text-light-secondary dark:text-dark-secondary">
              Descrição
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateDescription}
              loading={isGeneratingDescription}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            >
              Gerar com IA
            </Button>
          </div>
          
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição para guiar a extração automática de lore..."
            fullWidth
            helperText="Descreva o que define esta categoria para ajudar a IA a extrair fichas corretamente"
          />
        </div>
      </form>
    </Modal>
  );
}
