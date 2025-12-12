"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-light-base dark:bg-dark-base rounded-xl shadow-2xl w-full max-w-md mx-4 border border-border-light-default dark:border-border-dark-default overflow-hidden">
        {/* Header com ícone de alerta */}
        <div className="bg-red-50 dark:bg-red-900/20 p-6 border-b border-red-100 dark:border-red-900/40">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed">
            {message}
          </p>
          
          {itemName && (
            <div className="bg-light-raised dark:bg-dark-raised rounded-lg p-4 border border-border-light-default dark:border-border-dark-default">
              <p className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary mb-1">
                Item a ser excluído:
              </p>
              <p className="text-base font-semibold text-text-light-primary dark:text-dark-primary">
                {itemName}
              </p>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-900/40">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
              ⚠️ Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-light-raised dark:bg-dark-raised px-6 py-4 border-t border-border-light-default dark:border-border-dark-default flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-text-light-primary dark:text-dark-primary bg-light-base dark:bg-dark-base hover:bg-light-hover dark:hover:bg-dark-hover border border-border-light-default dark:border-border-dark-default rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors shadow-sm"
          >
            Excluir Permanentemente
          </button>
        </div>
      </div>
    </div>
  );
}
