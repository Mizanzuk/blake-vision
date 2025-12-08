"use client";

import React from 'react';
import clsx from 'clsx';

interface EditorTitleRowProps {
  titulo: string;
  isExpanded: boolean;
  hasUnsavedChanges: boolean;
  onToggleExpand: () => void;
  onConfirmCollapse?: () => void;
  showConfirmModal?: boolean;
}

/**
 * EditorTitleRow - Componente para a linha 2 do grid
 * Contém o botão de colapsar/expandir (Coluna A) e o título (Coluna B)
 */
export function EditorTitleRow({
  titulo,
  isExpanded,
  hasUnsavedChanges,
  onToggleExpand,
  onConfirmCollapse,
  showConfirmModal = false
}: EditorTitleRowProps) {
  
  const handleClick = () => {
    if (isExpanded && hasUnsavedChanges) {
      // Se há alterações não salvas, mostrar modal de confirmação
      if (onConfirmCollapse) {
        onConfirmCollapse();
      }
    } else {
      // Caso contrário, apenas colapsar/expandir
      onToggleExpand();
    }
  };

  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center w-full py-4 border-b border-border-light-default dark:border-border-dark-default">
      {/* COLUNA A - Botão de Colapsar/Expandir */}
      <div className="w-16 md:w-20 flex items-center justify-center">
        <button
          onClick={handleClick}
          className="p-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary transition-colors"
          title={isExpanded ? "Colapsar metadados" : "Expandir metadados"}
        >
          <svg 
            className={clsx(
              "w-5 h-5 transition-transform",
              isExpanded && "rotate-90"
            )} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* COLUNA B - Título */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary truncate">
          {titulo || "Sem título"}
        </h2>
      </div>

      {/* COLUNA C - Espaço vazio */}
      <div className="w-16 md:w-20" />
    </div>
  );
}
