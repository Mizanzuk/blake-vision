'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui';
import { toast } from 'sonner';
import type { Category } from '@/app/types';

const BASE_CATEGORIES = ['conceito', 'evento', 'local', 'personagem', 'regra', 'roteiro', 'sinopse'];

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  universeId: string;
  onCategoryDeleted?: () => void;
}

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  universeId,
  onCategoryDeleted,
}: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, universeId]);

  async function loadCategories() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/catalog?universeId=${universeId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCategories(data.types || []);
      } else {
        toast.error('Erro ao carregar categorias');
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setIsLoading(false);
    }
  }

  function isBaseCategory(slug: string): boolean {
    return BASE_CATEGORIES.includes(slug);
  }

  function handleSelectCategory(category: Category) {
    setSelectedCategory(category);
    setEditDescription(category.description || '');
    setIsEditing(false);
  }

  function handleBackToList() {
    setSelectedCategory(null);
    setIsEditing(false);
  }

  async function handleSaveDescription() {
    console.log('[DEBUG] handleSaveDescription called');
    console.log('[DEBUG] selectedCategory:', selectedCategory);
    console.log('[DEBUG] universeId:', universeId);
    console.log('[DEBUG] editDescription length:', editDescription.length);
    if (!selectedCategory) {
      console.log('[DEBUG] No selectedCategory');
      return;
    }

    try {
      const response = await fetch(`/api/categories/${selectedCategory.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universe_id: universeId,
          description: editDescription,
        }),
      });

      if (!response.ok) {
        console.log('[DEBUG] Response not OK:', response.status);
        const data = await response.json();
        console.log('[DEBUG] Error data:', data);
        toast.error(data.error || 'Erro ao atualizar categoria');
        return;
      }
      console.log('[DEBUG] Response OK');

      console.log('[DEBUG] Showing success toast');
      toast.success('Categoria atualizada com sucesso!');
      setIsEditing(false);
      
      // Atualizar a categoria na lista
      setSelectedCategory({
        ...selectedCategory,
        description: editDescription,
      });
      
      // Recarregar categorias
      loadCategories();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast.error('Erro ao atualizar categoria');
    }
  }

  async function handleGenerateWithAI() {
    console.log('handleGenerateWithAI called');
    if (!selectedCategory) {
      console.log('No selectedCategory');
      return;
    }

    try {
      console.log('Starting AI generation...');
      setIsLoading(true);
      console.log('Making fetch request to /api/generate-description');
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: selectedCategory.label,
          categorySlug: selectedCategory.slug,
          existingDescription: editDescription,
        }),
      });

      if (!response.ok) {
        console.log('Response not OK:', response.status);
        const data = await response.json();
        console.log('Error data:', data);
        toast.error(data.error || 'Erro ao gerar descrição');
        return;
      }

      console.log('Response OK, parsing JSON...');
      const data = await response.json();
      console.log('Received description length:', data.description.length);
      // Complementar a descrição existente
      const newDescription = editDescription 
        ? `${editDescription}\n\n${data.description}`
        : data.description;
      
      console.log('New description length:', newDescription.length);
      console.log('Setting edit description...');
      setEditDescription(newDescription);
      console.log('Toast success');
      toast.success('Descrição gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      toast.error('Erro ao gerar descrição');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteCategory() {
    if (!selectedCategory || isBaseCategory(selectedCategory.slug)) return;

    // Confirmar exclusão
    const confirmed = window.confirm(
      `Tem certeza que deseja apagar a categoria "${selectedCategory.label}"? Todas as fichas desta categoria serão deletadas.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/categories/${selectedCategory.slug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universe_id: universeId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar categoria');
        return;
      }

      toast.success('Categoria deletada com sucesso!');
      handleBackToList();
      loadCategories();
      onCategoryDeleted?.();
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      toast.error('Erro ao deletar categoria');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Gerenciar Categorias</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {!selectedCategory ? (
            // Lista de categorias
            <div className="w-full flex flex-col">
              <div className="p-6 border-b">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    // TODO: Abrir modal de criar nova categoria
                    toast.info('Funcionalidade em desenvolvimento');
                  }}
                >
                  + Nova Categoria
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {isLoading ? (
                  <div className="text-center text-gray-500">Carregando categorias...</div>
                ) : categories.length === 0 ? (
                  <div className="text-center text-gray-500">Nenhuma categoria encontrada</div>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.slug}
                      onClick={() => handleSelectCategory(category)}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-semibold text-gray-900">{category.label}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {category.description ? category.description.substring(0, 100) + '...' : 'Sem descrição'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Detalhes da categoria
            <div className="w-full flex flex-col">
              {/* Buttons */}
              <div className="flex gap-2 p-6 border-b">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleBackToList}
                >
                  ← Voltar
                </Button>
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                )}
                {!isBaseCategory(selectedCategory.slug) && !isEditing && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteCategory}
                  >
                    Apagar
                  </Button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Nome (não editável) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={selectedCategory.label}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* Slug (não editável) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={selectedCategory.slug}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* Prefix (não editável) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prefixo
                    </label>
                    <input
                      type="text"
                      value={selectedCategory.prefix || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* Descrição (editável) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[200px] disabled:bg-gray-50 disabled:text-gray-600"
                      placeholder="Descrição da categoria..."
                    />
                  </div>

                  {/* Botões de edição */}
                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false);
                          setEditDescription(selectedCategory.description || '');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleSaveDescription}
                      >
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleGenerateWithAI}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Gerando...' : 'Gerar com IA'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
