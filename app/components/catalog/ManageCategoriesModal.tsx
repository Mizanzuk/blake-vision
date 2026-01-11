'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui';
import { toast } from 'sonner';
import DeleteConfirmModal from '@/app/components/shared/DeleteConfirmModal';
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
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryPrefix, setNewCategoryPrefix] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [justFinishedResizing, setJustFinishedResizing] = useState(false);
  const [modalSize, setModalSize] = useState({ width: 800, height: 600 }); // Default size
  const [initialModalSize, setInitialModalSize] = useState({ width: 0, height: 0 });
  const [hasMeasured, setHasMeasured] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset selected category when opening modal
      setSelectedCategory(null);
      setIsEditing(false);
      setEditDescription('');
      setHasMeasured(false); // Reset measurement flag
      loadCategories();
    }
  }, [isOpen, universeId]);

  // Fechar modal ao pressionar Esc
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Redimensionamento do modal
  useEffect(() => {
    if (!isOpen || !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!modalRef.current) return;
      const rect = modalRef.current.getBoundingClientRect();
      const newWidth = Math.max(500, e.clientX - rect.left);
      const newHeight = Math.max(400, e.clientY - rect.top);
      setModalSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
      setJustFinishedResizing(true);
      setTimeout(() => setJustFinishedResizing(false), 100);
    };

    document.addEventListener('mousemove', handleMouseMove, { capture: true });
    document.addEventListener('mouseup', handleMouseUp, { capture: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleMouseUp, { capture: true });
    };
  }, [isOpen, isResizing]);

  // Armazenar tamanho inicial do modal
  useEffect(() => {
    if (isOpen && modalRef.current && !hasMeasured) {
      // Use requestAnimationFrame para garantir que o DOM foi renderizado
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const rect = modalRef.current.getBoundingClientRect();
          // Se o tamanho foi capturado corretamente, use-o; caso contrário, mantenha o padrão
          if (rect.width > 100 && rect.height > 100) {
            setInitialModalSize({ width: rect.width, height: rect.height });
            setModalSize({ width: rect.width, height: rect.height });
          }
          setHasMeasured(true);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasMeasured]);

  // Reset hasMeasured quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      setHasMeasured(false);
      setInitialModalSize({ width: 0, height: 0 });
    }
  }, [isOpen]);

  // Reset modal size and selected category when modal closes
  useEffect(() => {
    if (!isOpen) {
      setModalSize({ width: 0, height: 0 });
      setInitialModalSize({ width: 0, height: 0 });
      setSelectedCategory(null);
      setIsEditing(false);
      setEditDescription('');
    }
  }, [isOpen]);

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
    // Manter o tamanho do modal ao voltar para a lista
    if (initialModalSize.width > 0) {
      setModalSize(initialModalSize);
    }
  }

  async function handleSaveDescription() {
    if (!selectedCategory) {
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
        const data = await response.json();
        toast.error(data.error || 'Erro ao atualizar categoria');
        return;
      }

      toast.success('Categoria atualizada com sucesso!');
      setIsEditing(false);
      
      setSelectedCategory({
        ...selectedCategory,
        description: editDescription,
      });
      
      loadCategories();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast.error('Erro ao atualizar categoria');
    }
  }

  async function handleGenerateWithAI() {
    if (!selectedCategory) {
      return;
    }

    try {
      setIsLoading(true);
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
        const data = await response.json();
        toast.error(data.error || 'Erro ao gerar descrição');
        return;
      }

      const data = await response.json();
      const newDescription = editDescription 
        ? `${editDescription}\n\n${data.description}`
        : data.description;
      
      setEditDescription(newDescription);
      toast.success('Descrição gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      toast.error('Erro ao gerar descrição');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDeleteClick() {
    if (!selectedCategory || isBaseCategory(selectedCategory.slug)) return;
    setShowDeleteConfirm(true);
  }

  async function handleDeleteCategory() {
    if (!selectedCategory || isBaseCategory(selectedCategory.slug)) return;

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

  function handleStartCreating() {
    setIsCreating(true);
    setNewCategoryName('');
    setNewCategorySlug('');
    setNewCategoryPrefix('');
    setNewCategoryDescription('');
  }

  function handleCancelCreating() {
    setIsCreating(false);
    setNewCategoryName('');
    setNewCategorySlug('');
    setNewCategoryPrefix('');
    setNewCategoryDescription('');
  }

  // Auto-generate slug from name
  function generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  // Auto-generate prefix from name (first 3 letters, uppercase)
  function generatePrefixFromName(name: string): string {
    return name
      .trim()
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^\w]/g, '');
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }
    if (!newCategorySlug.trim()) {
      toast.error('Slug da categoria é obrigatório');
      return;
    }
    if (!newCategoryPrefix.trim()) {
      toast.error('Prefixo da categoria é obrigatório');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universe_id: universeId,
          label: newCategoryName.trim(),
          slug: newCategorySlug.trim().toLowerCase(),
          prefix: newCategoryPrefix.trim().toUpperCase(),
          description: newCategoryDescription.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Erro ao criar categoria');
        return;
      }

      toast.success('Categoria criada com sucesso!');
      handleCancelCreating();
      loadCategories();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateDescriptionForNewCategory() {
    if (!newCategoryName.trim()) {
      toast.error('Preencha o nome da categoria primeiro');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: newCategoryName,
          categorySlug: newCategorySlug || generateSlugFromName(newCategoryName),
          existingDescription: newCategoryDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Erro ao gerar descrição');
        return;
      }

      const data = await response.json();
      const newDescription = newCategoryDescription 
        ? `${newCategoryDescription}\n\n${data.description}`
        : data.description;
      
      setNewCategoryDescription(newDescription);
      toast.success('Descrição gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar descrição:', error);
      toast.error('Erro ao gerar descrição');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!isResizing && !justFinishedResizing && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-light-raised dark:bg-dark-raised rounded-lg shadow-lg overflow-hidden flex flex-col relative transition-all"
        style={{ 
          width: `${modalSize.width}px`, 
          height: `${modalSize.height}px`, 
          maxWidth: '90vw', 
          maxHeight: '90vh', 
          overflow: 'visible',
          minWidth: '500px',
          minHeight: '400px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - sem border */}
        <div className="flex justify-between items-center px-6 py-3">
          <h2 className="text-xl font-semibold">Gerenciar Categorias</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Fechar (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {isCreating ? (
            <CreateCategoryView
              newCategoryName={newCategoryName}
              newCategorySlug={newCategorySlug}
              newCategoryPrefix={newCategoryPrefix}
              newCategoryDescription={newCategoryDescription}
              isLoading={isLoading}
              onNameChange={(value) => {
                setNewCategoryName(value);
                // Auto-generate slug and prefix
                if (!newCategorySlug || newCategorySlug === generateSlugFromName(newCategoryName)) {
                  setNewCategorySlug(generateSlugFromName(value));
                }
                if (!newCategoryPrefix || newCategoryPrefix === generatePrefixFromName(newCategoryName)) {
                  setNewCategoryPrefix(generatePrefixFromName(value));
                }
              }}
              onSlugChange={setNewCategorySlug}
              onPrefixChange={setNewCategoryPrefix}
              onDescriptionChange={setNewCategoryDescription}
              onCancel={handleCancelCreating}
              onCreate={handleCreateCategory}
              onGenerateWithAI={handleGenerateDescriptionForNewCategory}
            />
          ) : !selectedCategory ? (
            <CategoryListView
              categories={categories}
              isLoading={isLoading}
              onSelectCategory={handleSelectCategory}
              onCreateNew={handleStartCreating}
            />
          ) : (
            <CategoryDetailView
              category={selectedCategory}
              isEditing={isEditing}
              editDescription={editDescription}
              isLoading={isLoading}
              isBaseCategory={isBaseCategory(selectedCategory.slug)}
              onBack={handleBackToList}
              onEdit={() => setIsEditing(true)}
              onCancelEdit={() => {
                setIsEditing(false);
                setEditDescription(selectedCategory.description || '');
              }}
              onSave={handleSaveDescription}
              onDelete={handleDeleteClick}
              onDescriptionChange={setEditDescription}
              onGenerateWithAI={handleGenerateWithAI}
            />
          )}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
          }}
        >
          <svg
            className="absolute bottom-1 right-1 w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="14" y1="14" x2="14" y2="10" />
            <line x1="14" y1="14" x2="10" y2="14" />
            <line x1="14" y1="8" x2="8" y2="14" />
          </svg>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Categoria"
        message={`Tem certeza que deseja apagar a categoria? Todas as fichas desta categoria serão deletadas permanentemente.`}
        itemName={selectedCategory?.label}
        onConfirm={handleDeleteCategory}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

interface CreateCategoryViewProps {
  newCategoryName: string;
  newCategorySlug: string;
  newCategoryPrefix: string;
  newCategoryDescription: string;
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onPrefixChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onCreate: () => void;
  onGenerateWithAI: () => void;
}

function CreateCategoryView({
  newCategoryName,
  newCategorySlug,
  newCategoryPrefix,
  newCategoryDescription,
  isLoading,
  onNameChange,
  onSlugChange,
  onPrefixChange,
  onDescriptionChange,
  onCancel,
  onCreate,
  onGenerateWithAI,
}: CreateCategoryViewProps) {
  return (
    <div className="w-full flex flex-col">
      {/* Back Button */}
      <div className="flex gap-2 px-6 py-3">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          ← Voltar
        </Button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-light-raised dark:bg-dark-raised text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-400"
              placeholder="Nome da categoria"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              Slug
            </label>
            <input
              type="text"
              value={newCategorySlug}
              onChange={(e) => onSlugChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-light-raised dark:bg-dark-raised text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-400"
              placeholder="slug-da-categoria"
            />
            <p className="text-xs text-gray-500 mt-1">
              Gerado automaticamente a partir do nome
            </p>
          </div>

          {/* Prefixo */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              Prefixo
            </label>
            <input
              type="text"
              value={newCategoryPrefix}
              onChange={(e) => onPrefixChange(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-light-raised dark:bg-dark-raised text-gray-900 dark:text-gray-100 focus:outline-none focus:border-red-400"
              placeholder="CAT"
              maxLength={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo 3 caracteres, gerado automaticamente
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              Descrição
            </label>
            <textarea
              value={newCategoryDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[200px] bg-light-raised dark:bg-dark-raised text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 focus:border-red-400"
              placeholder="Descrição da categoria"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4 justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={onGenerateWithAI}
              disabled={isLoading}
            >
              {isLoading ? 'Gerando...' : 'Gerar com IA'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="primary"
               onClick={onCreate}
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryListViewProps {
  categories: Category[];
  isLoading: boolean;
  onSelectCategory: (category: Category) => void;
  onCreateNew: () => void;
}

function CategoryListView({
  categories,
  isLoading,
  onSelectCategory,
  onCreateNew,
}: CategoryListViewProps) {
  return (
    <div className="w-full flex flex-col">
      <div className="p-6">
        <Button
          size="sm"
          variant="primary"
          onClick={onCreateNew}
        >
          + Nova Categoria
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-500">Carregando categorias...</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-500">Nenhuma categoria encontrada</div>
        ) : (
          categories.map((category) => (
            <div
              key={category.slug}
              onClick={() => onSelectCategory(category)}
              className="p-4 border rounded-lg cursor-pointer bg-light-raised dark:bg-dark-raised hover:shadow-md transition-shadow"
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {category.label}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {category.description ? category.description.substring(0, 100) + '...' : 'Sem descrição'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface CategoryDetailViewProps {
  category: Category;
  isEditing: boolean;
  editDescription: string;
  isLoading: boolean;
  isBaseCategory: boolean;
  onBack: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onDescriptionChange: (value: string) => void;
  onGenerateWithAI: () => void;
}

function CategoryDetailView({
  category,
  isEditing,
  editDescription,
  isLoading,
  isBaseCategory,
  onBack,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onDescriptionChange,
  onGenerateWithAI,
}: CategoryDetailViewProps) {
  return (
    <div className="w-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          {/* Nome (não editável) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={category.label}
              disabled
              className="w-full px-0 py-2 bg-transparent text-gray-900 dark:text-gray-100 disabled:opacity-100"
            />
          </div>

          {/* Slug (não editável) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              Slug
            </label>
            <input
              type="text"
              value={category.slug}
              disabled
              className="w-full px-0 py-2 bg-transparent text-gray-900 dark:text-gray-100 disabled:opacity-100"
            />
          </div>

          {/* Prefix (não editável) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              Prefixo
            </label>
            <input
              type="text"
              value={category.prefix || ''}
              disabled
              className="w-full px-0 py-2 bg-transparent text-gray-900 dark:text-gray-100 disabled:opacity-100"
            />
          </div>

          {/* Descrição (editável) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
              Descrição
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              disabled={!isEditing}
              className={`w-full px-3 py-2 rounded-lg min-h-[200px] bg-light-raised dark:bg-dark-raised text-gray-900 dark:text-gray-100 transition-all ${
                isEditing
                  ? 'border border-gray-300 focus:border-red-400 focus:outline-none focus:ring-0'
                  : 'border border-transparent'
              }`}
              placeholder="Descrição da categoria..."
            />
          </div>

          {/* Botões de edição/ação - alinhados à direita abaixo da descrição */}
          <div className="flex gap-2 pt-4 justify-between">
            <Button
              size="sm"
              variant="ghost"
              onClick={onBack}
            >
              ← Voltar
            </Button>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onEdit}
                  >
                    Editar
                  </Button>
                  {!isBaseCategory && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={onDelete}
                    >
                      Apagar
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancelEdit}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onGenerateWithAI}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Gerando...' : 'Gerar com IA'}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={onSave}
                  >
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

interface CreateCategoryViewProps {
  newCategoryName: string;
  newCategorySlug: string;
  newCategoryPrefix: string;
  newCategoryDescription: string;
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onPrefixChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onCreate: () => void;
  onGenerateWithAI: () => void;
}


interface CategoryListViewProps {
  categories: Category[];
  isLoading: boolean;
  onSelectCategory: (category: Category) => void;
  onCreateNew: () => void;
}


// Utility functions
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

function generatePrefixFromName(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .substring(0, 3);
}
