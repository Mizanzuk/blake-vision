"use client";

import React from 'react';
import clsx from 'clsx';
import { EditorRow, EditorRowColumn } from './EditorPageLayout';

interface EditorTitleRowProps {
  titulo: string;
  isExpanded: boolean;
  hasUnsavedChanges: boolean;
  onToggleExpand: () => void;
  onConfirmCollapse?: () => void;
}

/**
 * EditorTitleRow - Linha 2 do grid (Título + Botão colapsar)
 * 
 * Estrutura:
 * - Coluna A: Botão de colapsar/expandir (▼)
 * - Coluna B: Título do texto
 * - Coluna C: Vazio
 */
export function EditorTitleRow({
  titulo,
  isExpanded,
  hasUnsavedChanges,
  onToggleExpand,
  onConfirmCollapse,
}: EditorTitleRowProps) {
  
  const handleClick = () => {
    if (isExpanded && hasUnsavedChanges && onConfirmCollapse) {
      onConfirmCollapse();
    } else {
      onToggleExpand();
    }
  };

  return (
    <EditorRow className="py-3 px-0">
      {/* COLUNA A - Botão Colapsar */}
      <EditorRowColumn column="A" className="flex items-center justify-center">
        <button
          onClick={handleClick}
          className="p-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary transition-colors"
          title={isExpanded ? "Colapsar metadados" : "Expandir metadados"}
          aria-label={isExpanded ? "Colapsar metadados" : "Expandir metadados"}
        >
          <svg 
            className={clsx(
              "w-5 h-5 transition-transform duration-200",
              isExpanded && "rotate-90"
            )} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </EditorRowColumn>

      {/* COLUNA B - Título */}
      <EditorRowColumn column="B" className="flex-1 min-w-0 px-0">
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary truncate">
          {titulo || "Sem título"}
        </h2>
      </EditorRowColumn>

      {/* COLUNA C - Vazio */}
      <EditorRowColumn column="C" />
    </EditorRow>
  );
}
