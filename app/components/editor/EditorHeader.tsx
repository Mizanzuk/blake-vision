"use client";

import React from 'react';
import clsx from 'clsx';

interface EditorHeaderProps {
  // Modo Foco
  isMetadataSaved: boolean;
  enterFocusMode: () => void;
  
  // Título e Metadados
  titulo: string;
  isHeaderExpanded: boolean;
  setIsHeaderExpanded: (value: boolean) => void;
  hasUnsavedMetadataChanges: boolean;
  setShowUnsavedChangesModal: (value: boolean) => void;
  
  // Avatares
  showUrizen: boolean;
  showUrthona: boolean;
  setShowUrizen: (value: boolean) => void;
  setShowUrthona: (value: boolean) => void;
  
  // Menu de Opções
  showOptionsMenu: boolean;
  setShowOptionsMenu: (value: boolean) => void;
  setShowStatsModal: (value: boolean) => void;
  setShowExportModal: (value: boolean) => void;
  handleDuplicate: () => void;
  handleDelete: (id: string) => void;
  currentTextoId: string | null;
  
  // Editor
  editorRef: React.RefObject<any>;
}

export function EditorHeader({
  isMetadataSaved,
  enterFocusMode,
  titulo,
  isHeaderExpanded,
  setIsHeaderExpanded,
  hasUnsavedMetadataChanges,
  setShowUnsavedChangesModal,
  showUrizen,
  showUrthona,
  setShowUrizen,
  setShowUrthona,
  showOptionsMenu,
  setShowOptionsMenu,
  setShowStatsModal,
  setShowExportModal,
  handleDuplicate,
  handleDelete,
  currentTextoId,
  editorRef,
}: EditorHeaderProps) {
  
  const toggleBold = () => {
    if (editorRef.current) {
      editorRef.current.chain().focus().toggleBold().run();
    }
  };
  
  const toggleItalic = () => {
    if (editorRef.current) {
      editorRef.current.chain().focus().toggleItalic().run();
    }
  };
  
  const isBoldActive = () => editorRef.current?.isActive?.('bold') || false;
  const isItalicActive = () => editorRef.current?.isActive?.('italic') || false;
  
  return (
    <div className="sticky top-0 z-20 bg-light-base dark:bg-dark-base">
      {/* Container principal com max-w-[1328px] */}
      <div className="max-w-[1328px] mx-auto px-8">
        {/* Linha 1: Modo Foco + Avatares + Três Pontinhos */}
        <div className="flex items-center justify-between py-4">
          {/* Esquerda: Modo Foco */}
          <button
            onClick={enterFocusMode}
            disabled={!isMetadataSaved}
            className={clsx(
              "hidden md:flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300",
              isMetadataSaved
                ? "bg-primary-500 hover:bg-primary-600 text-white cursor-pointer"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50"
            )}
            title={isMetadataSaved ? "Ativar Modo Foco (Fullscreen)" : "Crie um texto para usar o Modo Foco"}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Modo Foco</span>
          </button>
          
          {/* Direita: Avatares + Três Pontinhos */}
          <div className="flex items-center gap-3">
            {/* Avatares dos Agentes */}
            <div className="flex gap-4 items-center">
              {showUrizen ? (
                <>
                  {/* Urthona - Inativo */}
                  <div 
                    onClick={() => {
                      if (!isMetadataSaved) return;
                      setShowUrthona(!showUrthona);
                      if (!showUrthona) setShowUrizen(false);
                    }}
                    className={clsx(
                      "relative group transition-all duration-300",
                      isMetadataSaved ? "cursor-pointer" : "cursor-not-allowed",
                      "opacity-30"
                    )}
                    title={isMetadataSaved ? "Urthona (Criativo)" : "Crie um texto para usar Urthona e Urizen"}
                  >
                    <img 
                      src="/urthona-avatar.png" 
                      alt="Urthona" 
                      className={clsx(
                        "w-12 h-12 rounded-full transition-all",
                        !isMetadataSaved && "opacity-30",
                        isMetadataSaved && "hover:ring-2 hover:ring-[#C85A54]/50"
                      )}
                    />
                  </div>
                  {/* Urizen - Ativo */}
                  <div 
                    onClick={() => {
                      if (!isMetadataSaved) return;
                      setShowUrizen(!showUrizen);
                      if (!showUrizen) setShowUrthona(false);
                    }}
                    className={clsx(
                      "relative group transition-all duration-300",
                      isMetadataSaved ? "cursor-pointer" : "cursor-not-allowed"
                    )}
                    title={isMetadataSaved ? "Urizen (Consulta)" : "Crie um texto para usar Urthona e Urizen"}
                  >
                    <img 
                      src="/urizen-avatar.png" 
                      alt="Urizen" 
                      className={clsx(
                        "w-12 h-12 rounded-full transition-all",
                        !isMetadataSaved && "opacity-30",
                        isMetadataSaved && "ring-4 ring-[#5B7C8D]"
                      )}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Urizen - Inativo */}
                  <div 
                    onClick={() => {
                      if (!isMetadataSaved) return;
                      setShowUrizen(!showUrizen);
                      if (!showUrizen) setShowUrthona(false);
                    }}
                    className={clsx(
                      "relative group transition-all duration-300",
                      isMetadataSaved ? "cursor-pointer" : "cursor-not-allowed",
                      !showUrthona && !showUrizen && "opacity-100",
                      showUrthona && "opacity-30"
                    )}
                    title={isMetadataSaved ? "Urizen (Consulta)" : "Crie um texto para usar Urthona e Urizen"}
                  >
                    <img 
                      src="/urizen-avatar.png" 
                      alt="Urizen" 
                      className={clsx(
                        "w-12 h-12 rounded-full transition-all",
                        !isMetadataSaved && "opacity-30",
                        isMetadataSaved && !showUrthona && "hover:ring-2 hover:ring-[#5B7C8D]/50"
                      )}
                    />
                  </div>
                  {/* Urthona - Ativo ou Padrão */}
                  <div 
                    onClick={() => {
                      if (!isMetadataSaved) return;
                      setShowUrthona(!showUrthona);
                      if (!showUrthona) setShowUrizen(false);
                    }}
                    className={clsx(
                      "relative group transition-all duration-300",
                      isMetadataSaved ? "cursor-pointer" : "cursor-not-allowed"
                    )}
                    title={isMetadataSaved ? "Urthona (Criativo)" : "Crie um texto para usar Urthona e Urizen"}
                  >
                    <img 
                      src="/urthona-avatar.png" 
                      alt="Urthona" 
                      className={clsx(
                        "w-12 h-12 rounded-full transition-all",
                        !isMetadataSaved && "opacity-30",
                        isMetadataSaved && (showUrthona ? "ring-4 ring-[#C85A54]" : "hover:ring-2 hover:ring-[#C85A54]/50")
                      )}
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* Três Pontinhos (fora da moldura) */}
            {isMetadataSaved && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="p-2 rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors"
                  title="Opções"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showOptionsMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-dark-bg-secondary border border-border-light-default dark:border-border-dark-default z-50">
                    <div className="py-2">
                      {/* Exportar */}
                      <button
                        onClick={() => {
                          setShowExportModal(true);
                          setShowOptionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-gray-200">Exportar</span>
                      </button>

                      {/* Duplicar */}
                      <button
                        onClick={() => {
                          handleDuplicate();
                          setShowOptionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-gray-200">Duplicar</span>
                      </button>

                      {/* Estatísticas */}
                      <button
                        onClick={() => {
                          setShowStatsModal(true);
                          setShowOptionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-sm text-gray-700 dark:text-gray-200">Estatísticas</span>
                      </button>

                      {/* Separador */}
                      <div className="my-2 border-t border-border-light-default dark:border-border-dark-default"></div>

                      {/* Excluir */}
                      <button
                        onClick={() => {
                          if (currentTextoId) handleDelete(currentTextoId);
                          setShowOptionsMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-sm text-red-600 dark:text-red-400">Excluir texto</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Linha 2: Título + B/I (dentro do max-w-4xl) */}
      {isMetadataSaved && (
        <div className="max-w-4xl mx-auto px-8 pb-4">
          <div className="flex items-center gap-3 mb-3">
            {/* Botão de expandir/colapsar */}
            <button
              onClick={() => {
                if (isHeaderExpanded && hasUnsavedMetadataChanges) {
                  setShowUnsavedChangesModal(true);
                } else {
                  setIsHeaderExpanded(!isHeaderExpanded);
                }
              }}
              className="p-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary transition-colors"
              title={isHeaderExpanded ? "Colapsar" : "Expandir"}
            >
              <svg 
                className={clsx(
                  "w-5 h-5 transition-transform",
                  isHeaderExpanded && "rotate-90"
                )} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Título */}
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary flex-1">
              {titulo || "Sem título"}
            </h2>
          </div>
          
          {/* Botões B e I */}
          <div className="flex gap-2">
            <button
              onClick={toggleBold}
              className={clsx(
                "w-8 h-8 rounded border transition-colors font-bold",
                isBoldActive()
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
              )}
              title="Negrito"
            >
              B
            </button>
            <button
              onClick={toggleItalic}
              className={clsx(
                "w-8 h-8 rounded border transition-colors italic font-serif",
                isItalicActive()
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
              )}
              title="Itálico"
            >
              I
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
