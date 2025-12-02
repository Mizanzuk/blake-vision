"use client";

import { useEffect, useRef, useState } from "react";

interface ResizableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  minWidth?: number;
  minHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
}

export function ResizableModal({
  isOpen,
  onClose,
  title,
  children,
  minWidth = 400,
  minHeight = 300,
  defaultWidth = 600,
  defaultHeight = 500,
}: ResizableModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !modalRef.current) return;

      const rect = modalRef.current.getBoundingClientRect();
      const newWidth = Math.max(minWidth, e.clientX - rect.left);
      const newHeight = Math.max(minHeight, e.clientY - rect.top);

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minWidth, minHeight]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl overflow-hidden"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          maxWidth: "90vw",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* Content */}
        <div className="overflow-y-auto" style={{ height: `calc(100% - 64px)` }}>
          {children}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        >
          <svg
            className="absolute bottom-0 right-0 w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M14 14L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 14L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 8L8 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
