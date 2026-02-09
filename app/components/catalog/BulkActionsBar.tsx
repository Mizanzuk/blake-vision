"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/app/components/ui";
import { toast } from "sonner";

interface BulkActionsBarProps {
  selectedCount: number;
  onExport: (format: "txt" | "doc" | "pdf") => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export default function BulkActionsBar({
  selectedCount,
  onExport,
  onDelete,
  isDeleting = false,
}: BulkActionsBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao apertar Esc ou clicar fora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowExportMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="flex items-center gap-3 bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg p-4 shadow-lg">
        {/* Counter */}
        <span className="text-sm font-medium text-text-light-primary dark:text-dark-primary">
          {selectedCount} selecionada{selectedCount !== 1 ? "s" : ""}
        </span>

        {/* Divider */}
        <div className="w-px h-6 bg-border-light-default dark:bg-border-dark-default" />

        {/* Export Button with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Exportar
          </Button>

          {/* Export Dropdown Menu */}
          {showExportMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => {
                  onExport("txt");
                  setShowExportMenu(false);
                }}
                onMouseEnter={() => setHoveredOption("txt")}
                onMouseLeave={() => setHoveredOption(null)}
                className={`w-full px-4 py-2 text-sm text-text-light-primary dark:text-dark-primary transition-colors text-left ${
                  hoveredOption === "txt"
                    ? "bg-light-base dark:bg-dark-base"
                    : ""
                }`}
              >
                TXT
              </button>
              <button
                onClick={() => {
                  onExport("doc");
                  setShowExportMenu(false);
                }}
                onMouseEnter={() => setHoveredOption("doc")}
                onMouseLeave={() => setHoveredOption(null)}
                className={`w-full px-4 py-2 text-sm text-text-light-primary dark:text-dark-primary transition-colors text-left border-t border-border-light-default dark:border-border-dark-default ${
                  hoveredOption === "doc"
                    ? "bg-light-base dark:bg-dark-base"
                    : ""
                }`}
              >
                DOC
              </button>
              <button
                onClick={() => {
                  onExport("pdf");
                  setShowExportMenu(false);
                }}
                onMouseEnter={() => setHoveredOption("pdf")}
                onMouseLeave={() => setHoveredOption(null)}
                className={`w-full px-4 py-2 text-sm text-text-light-primary dark:text-dark-primary transition-colors text-left border-t border-border-light-default dark:border-border-dark-default ${
                  hoveredOption === "pdf"
                    ? "bg-light-base dark:bg-dark-base"
                    : ""
                }`}
              >
                PDF
              </button>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Apagar
        </Button>
      </div>
    </div>
  );
}
