'use client';

import { useEffect, useRef, ReactNode, useState } from "react";
import { clsx } from "clsx";
import type { ModalSize } from "@/app/types";
import { Button } from "./Button";

export interface ModalProps {
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
}

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
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [modalSize, setModalSize] = useState({ width: 0, height: 0 });
  const [justFinishedResizing, setJustFinishedResizing] = useState(false);

  // Reset modal size when modal closes
  useEffect(() => {
    if (!isOpen) {
      setModalSize({ width: 0, height: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeOnEscape, onClose]);

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

    const handleMouseUp = () => {
      setIsResizing(false);
      setJustFinishedResizing(true);
      setTimeout(() => setJustFinishedResizing(false), 100);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Handle backdrop click using capture phase to intercept before React
  useEffect(() => {
    if (!isOpen || !closeOnBackdrop) return;

    const handleBackdropClick = (e: Event) => {
      if (isResizing || justFinishedResizing) return;

      const target = e.target as HTMLElement;

      // Check if click is on an element that should be ignored
      if (target.closest('[data-modal-ignore="true"]')) {
        return;
      }

      // Check if click is on the modal content
      if (modalRef.current && modalRef.current.contains(target)) {
        return;
      }

      // Only close if clicking directly on the backdrop
      if (target === backdropRef.current) {
        onClose();
      }
    };

    // Use capture phase to intercept clicks before they bubble
    const backdrop = backdropRef.current;
    if (backdrop) {
      backdrop.addEventListener("click", handleBackdropClick, true);
    }

    return () => {
      if (backdrop) {
        backdrop.removeEventListener("click", handleBackdropClick, true);
      }
    };
  }, [isOpen, closeOnBackdrop, isResizing, justFinishedResizing, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-7xl",
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div
        ref={modalRef}
        className={clsx(
          "relative w-full bg-light-raised dark:bg-dark-raised rounded-2xl shadow-soft-xl animate-slide-up",
          "border border-border-light-default dark:border-border-dark-default",
          sizes[size]
        )}
        style={modalSize.width > 0 ? { width: `${modalSize.width}px`, height: `${modalSize.height}px`, maxWidth: "90vw", maxHeight: "90vh", overflow: "visible" } : { overflow: "visible" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton || headerActions) && (
          <div className={clsx(
            "flex items-start justify-between p-6",
            !noBorder && "border-b border-border-light-default dark:border-border-dark-default"
          )}>
            <div className="flex-1">
              {title && (
                <h3
                  id="modal-title"
                  className="text-xl font-bold text-text-light-primary dark:text-dark-primary"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-2 text-sm text-text-light-secondary dark:text-dark-secondary"
                >
                  {description}
                </p>
              )}
            </div>

            {headerActions && (
              <div className="ml-4 flex items-center gap-2">
                {headerActions}
              </div>
            )}

            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4"
                title="Fechar modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={clsx(
            "flex items-center justify-end gap-3 p-6",
            !noBorder && "border-t border-border-light-default dark:border-border-dark-default"
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
