"use client";

import React, { useEffect } from 'react';

interface ExportModalProps {
  showExportModal: boolean;
  setShowExportModal: (value: boolean) => void;
  handleExport: (format: 'pdf' | 'docx' | 'txt') => void;
}

export function ExportModal({
  showExportModal,
  setShowExportModal,
  handleExport,
}: ExportModalProps) {
  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExportModal) {
        setShowExportModal(false);
      }
    };
    
    if (showExportModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showExportModal, setShowExportModal]);
  
  if (!showExportModal) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={() => setShowExportModal(false)}
    >
      <div 
        className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light-default dark:border-border-dark-default">
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
            Exportar Texto
          </h3>
          <button
            onClick={() => setShowExportModal(false)}
            className="p-1 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Escolha o formato para exportar seu texto:
          </p>

          {/* PDF */}
          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">PDF</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Documento portátil (recomendado)</p>
            </div>
          </button>

          {/* DOCX */}
          <button
            onClick={() => handleExport('docx')}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">DOCX</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Microsoft Word</p>
            </div>
          </button>

          {/* TXT */}
          <button
            onClick={() => handleExport('txt')}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">TXT</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Texto simples</p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-light-default dark:border-border-dark-default">
          <button
            onClick={() => setShowExportModal(false)}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
