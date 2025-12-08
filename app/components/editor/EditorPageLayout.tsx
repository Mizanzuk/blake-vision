"use client";

import React from 'react';
import clsx from 'clsx';

interface EditorPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * EditorPageLayout - Componente que fornece o layout grid 6x3 para a página Escrita
 * 
 * Estrutura:
 * - 6 linhas
 * - 3 colunas (A: margem esquerda, B: conteúdo, C: margem direita)
 * 
 * Linhas:
 * 1. Header (Modo Foco, Avatares, Menu)
 * 2. Título com botão de colapsar
 * 3. Metadados (condicional - desaparece quando não colapsado)
 * 4. Toolbar de formatação
 * 5. Editor de texto
 * 6. Botões Salvar/Publicar
 */
export function EditorPageLayout({ children, className }: EditorPageLayoutProps) {
  return (
    <div className={clsx(
      "w-full min-h-screen",
      className
    )}>
      {/* Container principal com grid 3 colunas */}
      <div className="w-full grid grid-cols-[auto_1fr_auto] gap-0 lg:gap-8">
        {/* COLUNA A - Margem Esquerda */}
        <div className="hidden lg:block w-0 lg:w-12" />

        {/* COLUNA B - Conteúdo Principal */}
        <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8 min-h-full">
          {children}
        </div>

        {/* COLUNA C - Margem Direita */}
        <div className="hidden lg:block w-0 lg:w-12" />
      </div>
    </div>
  );
}

/**
 * EditorRow - Componente para cada linha do grid
 * Mantém a estrutura 3 colunas dentro de cada linha
 */
interface EditorRowProps {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
}

export function EditorRow({ children, className, noBorder = false }: EditorRowProps) {
  return (
    <div className={clsx(
      "grid grid-cols-[auto_1fr_auto] gap-0 lg:gap-8 w-full items-center",
      !noBorder && "border-b border-border-light-default dark:border-border-dark-default",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * EditorRowColumn - Componente para cada coluna dentro de uma linha
 */
interface EditorRowColumnProps {
  children?: React.ReactNode;
  column: 'A' | 'B' | 'C';
  className?: string;
}

export function EditorRowColumn({ children, column, className }: EditorRowColumnProps) {
  const columnClasses = {
    'A': 'hidden lg:block w-0 lg:w-12 flex-shrink-0',
    'B': 'flex-1 min-w-0 w-full',
    'C': 'hidden lg:block w-0 lg:w-12 flex-shrink-0'
  };

  return (
    <div className={clsx(columnClasses[column], className)}>
      {children}
    </div>
  );
}
