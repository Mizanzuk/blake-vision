"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import type { Category } from "@/app/types";

interface TypesDropdownProps {
  label?: string;
  types: Category[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  onEdit?: (type: Category) => void;
  onDelete?: (slug: string, nome: string) => void;
  onCreate?: () => void;
  showAllOption?: boolean;
  allOptionLabel?: string;
}

export function TypesDropdown({
  label,
  types,
  selectedSlug,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  showAllOption = true,
  allOptionLabel = "Todos os tipos",
}: TypesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedType = types.find(t => t.slug === selectedSlug);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex items-center justify-between"
      >
        <span className="text-sm truncate">
          {selectedSlug === "" || selectedSlug === "all"
            ? allOptionLabel
            : selectedType?.label || "Selecione um tipo"}
        </span>
        <svg
          className={clsx(
            "w-4 h-4 text-text-light-tertiary dark:text-dark-tertiary transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Description */}
      {selectedType?.description && !isOpen && (
        <p className="text-xs text-text-light-tertiary dark:text-dark-tertiary">
          {selectedType.description}
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-w-[calc(20rem-2rem)] bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* All types option */}
          {showAllOption && (
            <>
              <div
                className={clsx(
                  "px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default",
                  (selectedSlug === "" || selectedSlug === "all") && "bg-primary-50 dark:bg-primary-900/20"
                )}
                onClick={() => {
                  onSelect("");
                  setIsOpen(false);
                }}
              >
                <p className={clsx(
                  "text-sm font-medium",
                  (selectedSlug === "" || selectedSlug === "all")
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-text-light-primary dark:text-dark-primary"
                )}>
                  {allOptionLabel}
                </p>
              </div>
              <div className="border-b border-border-light-default dark:border-border-dark-default" />
            </>
          )}

          {/* Type Options */}
          {types.map((type) => (
            <div
              key={type.slug}
              className={clsx(
                "group relative flex items-center justify-between px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default last:border-b-0",
                selectedSlug === type.slug && "bg-primary-50 dark:bg-primary-900/20"
              )}
              onClick={() => {
                onSelect(type.slug);
                setIsOpen(false);
              }}
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className={clsx(
                  "text-sm font-medium truncate",
                  selectedSlug === type.slug 
                    ? "text-primary-700 dark:text-primary-300" 
                    : "text-text-light-primary dark:text-dark-primary"
                )}>
                  {type.label}
                </p>
                {type.description && (
                  <p className="text-xs text-text-light-tertiary dark:text-dark-tertiary truncate mt-0.5">
                    {type.description}
                  </p>
                )}
              </div>

              {/* Hover Buttons */}
              {(onEdit || onDelete) && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(type);
                        setIsOpen(false);
                      }}
                      className="p-1.5 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors"
                      title="Editar categoria"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(type.slug, type.label);
                        setIsOpen(false);
                      }}
                      className="p-1.5 rounded hover:bg-error-light/10 dark:hover:bg-error-dark/10 text-text-light-secondary dark:text-dark-secondary hover:text-error-light dark:hover:text-error-dark transition-colors"
                      title="Deletar categoria"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Create New Option */}
          {onCreate && (
            <>
              <div className="border-b border-border-light-default dark:border-border-dark-default" />
              <button
                onClick={() => {
                  onCreate();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-primary-600 dark:text-primary-400 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar Nova Categoria
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
