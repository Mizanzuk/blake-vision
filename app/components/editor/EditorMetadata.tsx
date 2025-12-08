"use client";

import React from 'react';
import clsx from 'clsx';
import { EditorRow, EditorRowColumn } from './EditorPageLayout';
import { UniverseDropdown } from '@/app/components/ui';
import { WorldsDropdownSingle } from '@/app/components/ui/WorldsDropdownSingle';
import { EpisodesDropdownSingle } from '@/app/components/ui/EpisodesDropdownSingle';
import { CategoryDropdownSingle } from '@/app/components/ui/CategoryDropdownSingle';
import { Button } from '@/app/components/ui';
import type { Universe, World, Category } from '@/app/types';

interface EditorMetadataProps {
  isExpanded: boolean;
  isLocked: boolean;
  hasUnsavedChanges: boolean;
  titulo: string;
  universeId: string;
  worldId: string;
  episodio: string;
  categoria: string;
  onTituloChange: (value: string) => void;
  onUniverseChange: (id: string) => void;
  onWorldChange: (id: string) => void;
  onEpisodioChange: (value: string) => void;
  onCategoriaChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  universes: Universe[];
  worlds: World[];
  availableEpisodes: string[];
  categories: Category[];
  isSaving: boolean;
}

/**
 * EditorMetadata - Linha 3 do grid (Metadados colapsáveis)
 * 
 * Estrutura:
 * - Coluna A: Vazio
 * - Coluna B: Campos de metadados (TÍTULO, UNIVERSO, MUNDO, EPISÓDIO, CATEGORIA)
 * - Coluna C: Vazio
 * 
 * Esta linha desaparece quando o título não está expandido
 */
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
  isSaving,
}: EditorMetadataProps) {
  
  if (!isExpanded) {
    return null;
  }

  return (
    <EditorRow className="py-4 px-0 flex-col lg:flex-row">
      {/* COLUNA A - Vazio */}
      <EditorRowColumn column="A"></EditorRowColumn>

      {/* COLUNA B - Metadados */}
      <EditorRowColumn column="B" className="space-y-4 w-full">
        {/* Título */}
        <div>
          <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-1.5">
            TÍTULO
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => onTituloChange(e.target.value)}
            disabled={isLocked}
            placeholder="Digite o título do texto..."
            className={clsx(
              "w-full px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default",
              "bg-light-raised dark:bg-dark-raised",
              "text-text-light-primary dark:text-dark-primary",
              "placeholder-text-light-tertiary dark:placeholder-dark-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-primary-500",
              isLocked && "opacity-60 cursor-not-allowed"
            )}
          />
        </div>

        {/* Metadados Grid */}
        <div className="grid grid-cols-4 gap-4">
          <UniverseDropdown
            label="UNIVERSO"
            universes={universes}
            selectedId={universeId}
            onSelect={onUniverseChange}
            onCreate={() => {}}
            disabled={isLocked}
          />

          <WorldsDropdownSingle
            label="MUNDO"
            worlds={worlds}
            selectedId={worldId}
            onSelect={onWorldChange}
            disabled={isLocked || !universeId}
            onCreate={() => {}}
          />

          <EpisodesDropdownSingle
            label="EPISÓDIO"
            episodes={availableEpisodes}
            selectedEpisode={episodio}
            onSelect={onEpisodioChange}
            onCreate={() => {}}
            disabled={isLocked || !worldId}
          />

          <CategoryDropdownSingle
            label="CATEGORIA"
            categories={categories}
            selectedCategory={categoria}
            onSelect={onCategoriaChange}
            worldId={worldId}
            disabled={isLocked || !universeId}
          />
        </div>

        {/* Botões de Ação */}
        {!isLocked && (
          <div className="flex gap-2 justify-end pt-2">
            <Button
              onClick={onCancel}
              variant="secondary"
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              variant="primary"
              size="sm"
              disabled={isSaving || !titulo.trim() || !universeId}
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}

        {isLocked && hasUnsavedChanges && (
          <div className="flex gap-2 justify-end pt-2">
            <Button
              onClick={onEdit}
              variant="primary"
              size="sm"
            >
              Editar
            </Button>
          </div>
        )}
      </EditorRowColumn>

      {/* COLUNA C - Vazio */}
      <EditorRowColumn column="C"></EditorRowColumn>
    </EditorRow>
  );
}
