// Componentes Mobile para a página Escrita
import React from 'react';
import clsx from 'clsx';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui';
import { UniverseDropdown } from '@/app/components/ui';
import { WorldsDropdownSingle } from '@/app/components/ui/WorldsDropdownSingle';
import { EpisodesDropdownSingle } from '@/app/components/ui/EpisodesDropdownSingle';
import { CategoryDropdownSingle } from '@/app/components/ui/CategoryDropdownSingle';

// Props para MetadataModal
interface MetadataModalProps {
  show: boolean;
  onClose: () => void;
  titulo: string;
  setTitulo: (value: string) => void;
  universes: any[];
  universeId: string;
  setUniverseId: (value: string) => void;
  worlds: any[];
  worldId: string;
  setWorldId: (value: string) => void;
  availableEpisodes: string[];
  episodio: string;
  setEpisodio: (value: string) => void;
  categories: any[];
  categoria: string;
  setCategoria: (value: string) => void;
  onSave: () => void;
  isMetadataLocked: boolean;
  setShowEditUniverseModal: (value: boolean) => void;
  setUniverseForm: (value: any) => void;
  promptDeleteUniverse: (universeId: string, universeName: string) => void;
  setShowCreateUniverseModal: (value: boolean) => void;
  setWorldToEdit: (value: any) => void;
  setShowCreateWorldModal: (value: boolean) => void;
  setShowCreateEpisodeModal: (value: boolean) => void;
  setCategoryToEdit: (value: any) => void;
  setShowCreateCategoryModal: (value: boolean) => void;
}

export function MetadataModal({
  show,
  onClose,
  titulo,
  setTitulo,
  universes,
  universeId,
  setUniverseId,
  worlds,
  worldId,
  setWorldId,
  availableEpisodes,
  episodio,
  setEpisodio,
  categories,
  categoria,
  setCategoria,
  onSave,
  isMetadataLocked,
  setShowEditUniverseModal,
  setUniverseForm,
  promptDeleteUniverse,
  setShowCreateUniverseModal,
  setWorldToEdit,
  setShowCreateWorldModal,
  setShowCreateEpisodeModal,
  setCategoryToEdit,
  setShowCreateCategoryModal,
}: MetadataModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-light-base dark:bg-dark-base overflow-y-auto md:hidden">
      <div className="min-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-dark-primary">
            Metadados do Texto
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Formulário de Metadados */}
        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-light-primary dark:text-dark-primary">
              Título
            </label>
            <Input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título do texto..."
              disabled={isMetadataLocked}
            />
          </div>
          
          {/* Universo */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-light-primary dark:text-dark-primary">
              Universo
            </label>
            <UniverseDropdown
              label=""
              universes={universes}
              selectedId={universeId}
              onSelect={(id) => setUniverseId(id)}
              onEdit={(universe) => {
                setUniverseForm({ id: universe.id, nome: universe.nome, descricao: universe.descricao || '' });
                setShowEditUniverseModal(true);
              }}
              onDelete={promptDeleteUniverse}
              onCreate={() => setShowCreateUniverseModal(true)}
              disabled={isMetadataLocked}
            />
          </div>
          
          {/* Mundo */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-light-primary dark:text-dark-primary">
              Mundo
            </label>
            <WorldsDropdownSingle
              label=""
              worlds={worlds.filter(w => w.universe_id === universeId)}
              selectedId={worldId}
              onSelect={(id) => setWorldId(id)}
              disabled={!universeId || isMetadataLocked}
              onCreate={() => {
                setWorldToEdit(null);
                setShowCreateWorldModal(true);
              }}
            />
          </div>
          
          {/* Episódio */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-light-primary dark:text-dark-primary">
              Episódio
            </label>
            <EpisodesDropdownSingle
              label=""
              episodes={availableEpisodes}
              selectedEpisode={episodio}
              onSelect={setEpisodio}
              onCreate={() => setShowCreateEpisodeModal(true)}
              disabled={!worldId || isMetadataLocked}
            />
          </div>
          
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-light-primary dark:text-dark-primary">
              Categoria
            </label>
            <CategoryDropdownSingle
              label=""
              categories={categories}
              selectedCategory={categoria}
              onSelect={setCategoria}
              onCreate={() => {
                setCategoryToEdit(null);
                setShowCreateCategoryModal(true);
              }}
              worldId={worldId}
              disabled={!universeId || isMetadataLocked}
            />
          </div>
          
          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onSave();
                onClose();
              }}
              variant="primary"
              className="flex-1"
            >
              Salvar Metadados
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Props para MobileMenu
interface MobileMenuProps {
  show: boolean;
  onClose: () => void;
  showUrizen: boolean;
  setShowUrizen: (value: boolean) => void;
  showUrthona: boolean;
  setShowUrthona: (value: boolean) => void;
  editorRef: any;
  showStylesDropdown: boolean;
  setShowStylesDropdown: (value: boolean) => void;
  setShowStatsModal: (value: boolean) => void;
  setShowExportModal: (value: boolean) => void;
  handleSave: () => void;
  handlePublish: () => void;
  isSaving: boolean;
}

export function MobileMenu({
  show,
  onClose,
  showUrizen,
  setShowUrizen,
  showUrthona,
  setShowUrthona,
  editorRef,
  showStylesDropdown,
  setShowStylesDropdown,
  setShowStatsModal,
  setShowExportModal,
  handleSave,
  handlePublish,
  isSaving,
}: MobileMenuProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-light-raised dark:bg-dark-raised border-t border-border-light-default dark:border-border-dark-default md:hidden shadow-2xl">
      <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
        {/* Avatares */}
        <div className="flex gap-3 justify-center pb-3 border-b border-border-light-subtle dark:border-border-dark-subtle">
          <button
            onClick={() => {
              setShowUrizen(!showUrizen);
              if (!showUrizen) setShowUrthona(false);
              onClose();
            }}
            className={clsx(
              "w-12 h-12 rounded-full transition-all",
              showUrizen ? 'ring-2 ring-[#5B7C8D] opacity-100' : 'opacity-50 hover:opacity-100'
            )}
            title="Urizen (Consulta)"
          >
            <img src="/urizen-avatar.png" alt="Urizen" className="w-full h-full rounded-full object-cover" />
          </button>
          <button
            onClick={() => {
              setShowUrthona(!showUrthona);
              if (!showUrthona) setShowUrizen(false);
              onClose();
            }}
            className={clsx(
              "w-12 h-12 rounded-full transition-all",
              showUrthona ? 'ring-2 ring-[#C85A54] opacity-100' : 'opacity-50 hover:opacity-100'
            )}
            title="Urthona (Criativo)"
          >
            <img src="/urthona-avatar.png" alt="Urthona" className="w-full h-full rounded-full object-cover" />
          </button>
        </div>
        
        {/* Formatação */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              editorRef.current?.chain().focus().toggleBold().run();
            }}
            className="flex-1 px-4 py-2 text-sm font-bold rounded bg-light-overlay dark:bg-dark-overlay hover:bg-light-base dark:hover:bg-dark-base text-text-light-primary dark:text-dark-primary transition-colors"
          >
            B
          </button>
          <button
            onClick={() => {
              editorRef.current?.chain().focus().toggleItalic().run();
            }}
            className="flex-1 px-4 py-2 text-sm italic rounded bg-light-overlay dark:bg-dark-overlay hover:bg-light-base dark:hover:bg-dark-base text-text-light-primary dark:text-dark-primary transition-colors"
          >
            I
          </button>
          <button
            onClick={() => setShowStylesDropdown(!showStylesDropdown)}
            className="flex-1 px-4 py-2 text-sm rounded bg-light-overlay dark:bg-dark-overlay hover:bg-light-base dark:hover:bg-dark-base text-text-light-primary dark:text-dark-primary transition-colors"
          >
            Aa
          </button>
        </div>
        
        {/* Opções do menu três pontos verticais */}
        <div className="space-y-2 pt-3 border-t border-border-light-subtle dark:border-border-dark-subtle">
          <button
            onClick={() => {
              setShowStatsModal(true);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-primary dark:text-dark-primary transition-colors"
          >
            📊 Estatísticas
          </button>
          <button
            onClick={() => {
              setShowExportModal(true);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-primary dark:text-dark-primary transition-colors"
          >
            📥 Exportar
          </button>
        </div>
        
        {/* Ações */}
        <div className="flex gap-3 pt-3">
          <button
            onClick={() => {
              handleSave();
              onClose();
            }}
            disabled={isSaving}
            className="flex-1 px-4 py-3 rounded bg-light-overlay dark:bg-dark-overlay hover:bg-light-base dark:hover:bg-dark-base font-medium text-text-light-primary dark:text-dark-primary transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => {
              handlePublish();
              onClose();
            }}
            className="flex-1 px-4 py-3 rounded bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 font-medium transition-colors"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
