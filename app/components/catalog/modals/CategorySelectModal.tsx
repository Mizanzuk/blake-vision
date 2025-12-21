"use client";

import { useState } from "react";
import { Modal, Button } from "@/app/components/ui";
import type { Category } from "@/app/types";

interface CategorySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory: (categorySlug: string) => void;
  onCreateCategory: () => void;
}

export default function CategorySelectModal({
  isOpen,
  onClose,
  categories,
  onSelectCategory,
  onCreateCategory,
}: CategorySelectModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleSelect = () => {
    if (selectedCategory) {
      onSelectCategory(selectedCategory);
      onClose();
    }
  };

  const handleCreateCategory = () => {
    onCreateCategory();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selecionar Categoria"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Escolha uma categoria para criar uma nova ficha
        </p>

        {/* Lista de categorias */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => setSelectedCategory(category.slug)}
              className={`
                w-full text-left px-4 py-3 rounded-lg border transition-all
                ${
                  selectedCategory === category.slug
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-border-light-default dark:border-border-dark-default hover:border-primary-300 dark:hover:border-primary-700"
                }
              `}
            >
              <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                {category.label}
              </div>
              {category.description && (
                <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  {category.description}
                </div>
              )}
            </button>
          ))}

          {/* Botão de criar nova categoria */}
          <button
            onClick={handleCreateCategory}
            className="
              w-full text-left px-4 py-3 rounded-lg border border-dashed
              border-border-light-default dark:border-border-dark-default
              hover:border-primary-500 dark:hover:border-primary-500
              hover:bg-light-overlay dark:hover:bg-dark-overlay
              transition-all
            "
          >
            <div className="flex items-center gap-2 text-primary-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Nova Categoria</span>
            </div>
          </button>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border-light-default dark:border-border-dark-default">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSelect}
            disabled={!selectedCategory}
          >
            Continuar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
