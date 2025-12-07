"use client";

import React from 'react';
import clsx from 'clsx';

interface EditorFooterProps {
  isSaving: boolean;
  titulo: string;
  handleSave: (autoSave: boolean) => void;
  handlePublish: () => void;
}

export function EditorFooter({
  isSaving,
  titulo,
  handleSave,
  handlePublish,
}: EditorFooterProps) {
  return (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-20 bg-light-base dark:bg-dark-base border-t border-border-light-default dark:border-border-dark-default">
      <div className="max-w-4xl mx-auto px-8 py-4">
        <div className="flex justify-end gap-3">
          {/* Botão Salvar */}
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving || !titulo.trim()}
            className={clsx(
              "px-6 py-2.5 rounded-lg transition-all duration-300 shadow-md font-medium",
              isSaving || !titulo.trim()
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-white dark:bg-dark-bg-secondary text-gray-700 dark:text-gray-200 hover:shadow-lg cursor-pointer border border-gray-300 dark:border-gray-600"
            )}
            title="Salvar (Ctrl+S)"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>

          {/* Botão Publicar */}
          <button
            onClick={handlePublish}
            disabled={isSaving || !titulo.trim()}
            className={clsx(
              "px-6 py-2.5 rounded-lg transition-all duration-300 shadow-md font-medium",
              isSaving || !titulo.trim()
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-primary-500 hover:bg-primary-600 text-white hover:shadow-lg cursor-pointer"
            )}
            title="Publicar"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
