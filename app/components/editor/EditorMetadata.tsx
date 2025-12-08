"use client";

import React from 'react';
import clsx from 'clsx';
import { Button } from '@/app/components/ui';
import { UniverseDropdown } from '@/app/components/ui';
import { WorldsDropdownSingle } from '@/app/components/ui/WorldsDropdownSingle';
import { EpisodesDropdownSingle } from '@/app/components/ui/EpisodesDropdownSingle';
import { CategoryDropdownSingle } from '@/app/components/ui/CategoryDropdownSingle';
import type { Universe, World, Category } from '@/app/types';

interface EditorMetadataProps {
  // Estado
  isExpanded: boolean;
  isLocked: boolean;
  hasUnsavedChanges: boolean;
  
  // Metadados
  titulo: string;
  universeId: string;
  worldId: string;
  episodio: string;
  categoria: string;
  
  // Handlers
  onTituloChange: (value: string) => void;
  onUniverseChange: (id: string) => void;
  onWorldChange: (id: string) => void;
  onEpisodioChange: (value: string) => void;
  onCategoriaChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel?: () => void;
  
  // Dados
  universes: Universe[];
  worlds: World[];
  availableEpisodes: string[];
  categories: Category[];
  
  // Estados
  isSaving?: boolean;
}

export function EditorMetadata({
  isExpanded,
  isLocked,
  hasUnsavedChanges,
  titulo,
  universeId,
  worldId,
  episodio,
  categoria,
  onTituloChange,
  onUniverseChange,
  onWorldChange,
  onEpisodioChange,
  onCategoriaChange,
  onEdit,
  onSave,
  onCancel,
  universes,
  worlds,
  availableEpisodes,
  categories,
  isSaving = false
}: EditorMetadataProps) {
  
  if (!isExpanded) {
    return null;
  }

  return (
    <div className="space-y-4 py-4 border-t border-border-light-default dark:border-border-dark-default">
      {/* Botão de editar (só aparece quando expandido e bloqueado) */}
      {isLocked && (
        <div className="flex justify-end">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            title="Editar metadados"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar
          </button>
        </div>
      )}

      {/* Título */}
      <div>
        <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-1.5">
          TÍTULO
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          placeholder="Digite o título do texto..."
          disabled={isLocked}
          className="w-full px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Metadados - Grid 4 colunas */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <UniverseDropdown
          label="UNIVERSO"
          universes={universes}
          selectedId={universeId}
          onSelect={(id) => {
            onUniverseChange(id);
            onWorldChange("");
          }}
          onCreate={() => {
            console.log("Criar novo universo");
          }}
          disabled={isLocked}
        />

        <WorldsDropdownSingle
          label="MUNDO"
          worlds={worlds.filter(w => w.universe_id === universeId)}
          selectedId={worldId}
          onSelect={onWorldChange}
          disabled={!universeId || isLocked}
          onCreate={() => {
            console.log("Criar novo mundo");
          }}
        />

        <EpisodesDropdownSingle
          label="EPISÓDIO"
          episodes={availableEpisodes}
          selectedEpisode={episodio}
          onSelect={onEpisodioChange}
          onCreate={() => {
            console.log("Criar novo episódio");
          }}
          disabled={!worldId || isLocked}
        />

        <CategoryDropdownSingle
          label="CATEGORIA"
          categories={categories}
          selectedCategory={categoria}
          onSelect={onCategoriaChange}
          worldId={worldId}
          disabled={!universeId || isLocked}
        />
      </div>

      {/* Botões de ação (só aparecem quando está editando) */}
      {!isLocked && (
        <div className="flex justify-center gap-3 pt-4">
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              size="sm"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={onSave}
            disabled={isSaving || !titulo.trim() || !universeId}
            variant="primary"
            size="sm"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      )}
    </div>
  );
}
