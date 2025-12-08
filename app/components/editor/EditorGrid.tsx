"use client";

import React from 'react';
import clsx from 'clsx';

interface EditorGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * EditorGrid - Componente que fornece o layout em grid 6x3 para a página de Escrita
 * 
 * Estrutura:
 * - Coluna A (esquerda): Margem com botão de colapsar na linha 2
 * - Coluna B (centro): Conteúdo principal (Modo Foco, Título, Metadados, Editor, Botões)
 * - Coluna C (direita): Margem com menu na linha 1
 * 
 * Linhas:
 * 1. Modo Foco | Avatares | Menu (três pontinhos)
 * 2. Botão colapsar | Título | -
 * 3. - | Metadados | - (Condicional)
 * 4. - | Toolbar (B, I, Aa) | -
 * 5. - | Editor de Texto | -
 * 6. - | Botões Salvar/Publicar | -
 */
export function EditorGrid({ children, className }: EditorGridProps) {
  return (
    <div className={clsx(
      "w-full h-full",
      className
    )}>
      {/* Container principal com grid 3 colunas */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-0 w-full h-full">
        {/* Coluna A - Margem Esquerda */}
        <div className="w-16 md:w-20 flex-shrink-0 bg-transparent" />
        
        {/* Coluna B - Conteúdo Principal */}
        <div className="flex flex-col w-full max-w-4xl mx-auto px-4 md:px-8 py-8">
          {children}
        </div>
        
        {/* Coluna C - Margem Direita */}
        <div className="w-16 md:w-20 flex-shrink-0 bg-transparent" />
      </div>
    </div>
  );
}

/**
 * EditorGridRow - Componente para organizar conteúdo em linhas do grid
 */
interface EditorGridRowProps {
  children: React.ReactNode;
  className?: string;
  columnA?: React.ReactNode;
  columnB: React.ReactNode;
  columnC?: React.ReactNode;
}

export function EditorGridRow({
  columnA,
  columnB,
  columnC,
  className
}: EditorGridRowProps) {
  return (
    <div className={clsx(
      "grid grid-cols-[auto_1fr_auto] gap-4 w-full items-center",
      className
    )}>
      {/* Coluna A */}
      <div className="w-16 md:w-20 flex items-center justify-center">
        {columnA}
      </div>
      
      {/* Coluna B */}
      <div className="flex-1 min-w-0">
        {columnB}
      </div>
      
      {/* Coluna C */}
      <div className="w-16 md:w-20 flex items-center justify-center">
        {columnC}
      </div>
    </div>
  );
}

/**
 * EditorGridSection - Componente para seções que ocupam apenas a coluna B
 */
interface EditorGridSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function EditorGridSection({ children, className }: EditorGridSectionProps) {
  return (
    <div className={clsx(
      "col-start-2 col-end-3 w-full",
      className
    )}>
      {children}
    </div>
  );
}
