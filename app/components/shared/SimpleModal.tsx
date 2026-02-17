"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function SimpleModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: SimpleModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`relative w-full ${sizeClasses[size]} bg-light-raised dark:bg-dark-raised rounded-2xl shadow-soft-xl border border-border-light-default dark:border-border-dark-default p-6 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title) && (
          <div className="flex items-start justify-between border-b border-border-light-default dark:border-border-dark-default pb-4 mb-4">
            <div className="flex-1">
              {title && (
                <h3 className="text-xl font-bold text-text-light-primary dark:text-dark-primary">
                  {title}
                </h3>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-text-light-tertiary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-tertiary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors ml-4"
              aria-label="Fechar modal"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="mt-2">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 flex justify-end gap-2 border-t border-border-light-default dark:border-border-dark-default pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
