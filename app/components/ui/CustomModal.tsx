"use client";

import { Fragment, useEffect, useRef, ReactNode } from "react";
import { clsx } from "clsx";
import type { ModalSize } from "@/app/types";

export type CustomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children?: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  headerActions?: ReactNode;
  noBorder?: boolean;
};

export function CustomModal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  headerActions,
  noBorder = false,
}: CustomModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const sizeClasses: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-4xl",
    full: "max-w-7xl",
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && isOpen && e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, closeOnEscape, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          className={clsx(
            "pointer-events-auto relative w-full mx-4 rounded-lg bg-light-raised dark:bg-dark-raised shadow-xl transition-all duration-300",
            sizeClasses[size],
            !noBorder && "border border-border-light-default dark:border-border-dark-default"
          )}
        >
          {/* Header */}
          {(title || showCloseButton || headerActions) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light-default dark:border-border-dark-default">
              <div className="flex-1">
                {title && (
                  <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {headerActions}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-light-overlay dark:hover:bg-dark-overlay rounded-lg transition-colors"
                    aria-label="Fechar modal"
                  >
                    <svg
                      className="w-6 h-6"
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
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-border-light-default dark:border-border-dark-default flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
}
