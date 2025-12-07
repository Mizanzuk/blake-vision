"use client";

import React from 'react';
import clsx from 'clsx';

interface MobileOptionsMenuProps {
  showMobileOptionsMenu: boolean;
  setShowMobileOptionsMenu: (value: boolean) => void;
  handlePublish: () => void;
  setShowUrizen: (value: boolean) => void;
  setShowUrthona: (value: boolean) => void;
  setShowExportModal: (value: boolean) => void;
  handleDuplicate: () => void;
  setShowStatsModal: (value: boolean) => void;
  handleDelete: (id: string) => void;
  currentTextoId: string | null;
  isMetadataSaved: boolean;
}

export function MobileOptionsMenu({
  showMobileOptionsMenu,
  setShowMobileOptionsMenu,
  handlePublish,
  setShowUrizen,
  setShowUrthona,
  setShowExportModal,
  handleDuplicate,
  setShowStatsModal,
  handleDelete,
  currentTextoId,
  isMetadataSaved,
}: MobileOptionsMenuProps) {
  if (!showMobileOptionsMenu || !isMetadataSaved) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 md:hidden"
      onClick={() => setShowMobileOptionsMenu(false)}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-dark-bg-secondary shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-light-default dark:border-border-dark-default">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
              Opções
            </h3>
            <button
              onClick={() => setShowMobileOptionsMenu(false)}
              className="p-2 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* Publicar */}
            <button
              onClick={() => {
                handlePublish();
                setShowMobileOptionsMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Publicar</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tornar texto público</p>
              </div>
            </button>

            {/* Avatares */}
            <button
              onClick={() => {
                // Abrir menu de escolha de avatar
                setShowMobileOptionsMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Avatares</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Urizen e Urthona</p>
              </div>
            </button>

            {/* Exportar */}
            <button
              onClick={() => {
                setShowExportModal(true);
                setShowMobileOptionsMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Exportar</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOCX ou TXT</p>
              </div>
            </button>

            {/* Duplicar */}
            <button
              onClick={() => {
                handleDuplicate();
                setShowMobileOptionsMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Duplicar</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Criar cópia do texto</p>
              </div>
            </button>

            {/* Estatísticas */}
            <button
              onClick={() => {
                setShowStatsModal(true);
                setShowMobileOptionsMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Estatísticas</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Palavras, caracteres, etc.</p>
              </div>
            </button>

            {/* Separador */}
            <div className="my-3 border-t border-border-light-default dark:border-border-dark-default"></div>

            {/* Excluir */}
            <button
              onClick={() => {
                if (currentTextoId) handleDelete(currentTextoId);
                setShowMobileOptionsMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">Excluir texto</p>
                <p className="text-xs text-red-500 dark:text-red-500">Ação irreversível</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
