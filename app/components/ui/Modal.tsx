"use client";

import { Fragment, useEffect, useRef, ReactNode, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { clsx } from "clsx";
import type { ModalSize } from "@/app/types";
import { Button } from "./Button";

export type ModalProps = {
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

export function Modal({
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
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [modalSize, setModalSize] = useState({ width: 0, height: 0 });
  const [justFinishedResizing, setJustFinishedResizing] = useState(false);

  // Reset modal size when modal closes
  useEffect(() => {
    if (!isOpen) {
      setModalSize({ width: 0, height: 0 });
    }
  }, [isOpen]);

  // Resize functionality
  useEffect(() => {
    if (!isOpen || !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!modalRef.current) return;
      const rect = modalRef.current.getBoundingClientRect();
      const newWidth = Math.max(500, e.clientX - rect.left);
      const newHeight = Math.max(400, e.clientY - rect.top);
      setModalSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
      setJustFinishedResizing(true);
      // Reset the flag after a short delay to allow backdrop clicks again
      setTimeout(() => setJustFinishedResizing(false), 100);
    };

    document.addEventListener("mousemove", handleMouseMove, { capture: true });
    document.addEventListener("mouseup", handleMouseUp, { capture: true });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, { capture: true });
      document.removeEventListener("mouseup", handleMouseUp, { capture: true });
    };
  }, [isOpen, isResizing]);

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-7xl",
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Don't close if clicking on interactive elements or if the click target is not the backdrop itself
    if (closeOnBackdrop && !isResizing && !justFinishedResizing && e.target === e.currentTarget) {
      // Check if the click target is an interactive element
      const target = e.target as HTMLElement;
      if (target.closest('button, input, textarea, select, [role="button"], [role="dialog"]')) {
        return;
      }
      // Check if the click is from a data-modal-ignore element (like dropdown menus)
      if (target.closest('[data-modal-ignore="true"]')) {
        return;
      }
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        static
        onClose={closeOnEscape ? onClose : () => {}}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                ref={modalRef}
                className={clsx(
                  "relative w-full transform rounded-2xl bg-light-raised dark:bg-dark-raised p-6 text-left align-middle shadow-soft-xl transition-all",
                  "border border-border-light-default dark:border-border-dark-default",
                  sizes[size]
                )}
                style={modalSize.width > 0 ? { width: `${modalSize.width}px`, height: `${modalSize.height}px`, maxWidth: "90vw", maxHeight: "90vh", overflow: "visible" } : { overflow: "visible" }}
                onClick={(e) => e.stopPropagation()}
              >
                {(title || showCloseButton || headerActions) && (
                  <div className={clsx(
                    "flex items-start justify-between",
                    !noBorder && "border-b border-border-light-default dark:border-border-dark-default pb-4 mb-4"
                  )}>
                    <div className="flex-1">
                      {title && (
                        <Dialog.Title
                          as="h3"
                          className="text-xl font-bold text-text-light-primary dark:text-dark-primary"
                        >
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <p className="mt-1 text-sm text-text-light-tertiary dark:text-dark-tertiary">
                          {description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {headerActions}
                      {showCloseButton && (
                        <button
                          onClick={onClose}
                          className="p-1 rounded-lg text-text-light-tertiary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-tertiary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
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
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 140px)' }}>
                  {children}
                </div>

                {footer && (
                  <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border-light-default dark:border-border-dark-default">
                    {footer}
                  </div>
                )}

                {/* Resize Handle */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group z-10"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResizing(true);
                  }}
                >
                  <svg
                    className="absolute bottom-1 right-1 w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="14" y1="14" x2="14" y2="10" />
                    <line x1="14" y1="14" x2="10" y2="14" />
                    <line x1="14" y1="8" x2="8" y2="14" />
                  </svg>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Componente auxiliar para confirmação
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmVariant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading} size="sm">
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={isLoading}
            size="sm"
          >
            {confirmText}
          </Button>
        </>
      }
    />
  );
}
