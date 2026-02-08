"use client";

import { useEffect } from "react";
import { clsx } from "clsx";
import { Button } from "./Button";
import { Input } from "./Input";

interface UniverseDeleteModalProps {
  isOpen: boolean;
  universeName: string;
  captchaQuestion: { num1: number; num2: number; answer: number };
  captchaAnswer: string;
  isLoading?: boolean;
  onCaptchaChange: (answer: string) => void;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function UniverseDeleteModal({
  isOpen,
  universeName,
  captchaQuestion,
  captchaAnswer,
  isLoading = false,
  onCaptchaChange,
  onConfirm,
  onCancel,
}: UniverseDeleteModalProps) {
  // Fechar modal com ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-light-raised dark:bg-dark-raised rounded-lg shadow-lg max-w-sm w-full border border-border-light-default dark:border-border-dark-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border-light-default dark:border-border-dark-default">
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
              Confirmar Exclusão
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            <div>
              <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
                Tem certeza que deseja deletar o universo{" "}
                <strong className="text-text-light-primary dark:text-dark-primary">
                  "{universeName}"
                </strong>
                ?
              </p>
              <p className="text-xs text-text-light-tertiary dark:text-dark-tertiary mt-1">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            {/* Captcha */}
            <div className="p-3 bg-light-overlay dark:bg-dark-overlay rounded-lg border border-border-light-default dark:border-border-dark-default">
              <p className="text-xs font-medium text-text-light-primary dark:text-dark-primary mb-2">
                Para confirmar, resolva esta operação:
              </p>
              <p className="text-base font-bold text-primary-600 dark:text-primary-400 mb-3">
                {captchaQuestion.num1} + {captchaQuestion.num2} = ?
              </p>
              <Input
                type="number"
                value={captchaAnswer}
                onChange={(e) => onCaptchaChange(e.target.value)}
                placeholder="Digite a resposta"
                fullWidth
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-light-default dark:border-border-dark-default flex gap-2 justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={onConfirm}
              disabled={isLoading}
              loading={isLoading}
            >
              Deletar Universo
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
