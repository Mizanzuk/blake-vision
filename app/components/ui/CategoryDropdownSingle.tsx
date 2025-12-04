"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import type { Category } from "@/app/types";

interface CategoryDropdownSingleProps {
  label?: string;
  categories: Category[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  onCreate?: () => void;
  disabled?: boolean;
  worldId?: string; // Para validar categoria Episódio
}

export function CategoryDropdownSingle({
  label,
  categories,
  selectedCategory,
  onSelect,
  onCreate,
  disabled = false,
  worldId,
}: CategoryDropdownSingleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Encontrar label da categoria selecionada
  const selectedCategoryLabel = selectedCategory 
    ? categories.find(c => c.slug === selectedCategory)?.label || selectedCategory
    : null;

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-medium text-text-light-secondary dark:text-dark-secondary">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          "w-full px-4 py-2 text-left rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary transition-colors flex items-center justify-between",
          disabled 
            ? "opacity-50 cursor-not-allowed" 
            : "hover:bg-light-overlay dark:hover:bg-dark-overlay cursor-pointer"
        )}
      >
        <span className="text-sm truncate flex items-center gap-2">
          {selectedCategoryLabel ? (
            <>
              <span className="text-lg">🏷️</span>
              {selectedCategoryLabel}
            </>
          ) : (
            "Texto Livre"
          )}
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

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-w-[calc(20rem-2rem)] bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Opção padrão: Roteiro/Texto Livre */}
          <div
            className={clsx(
              "px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default",
              selectedCategory === "" && "bg-primary-50 dark:bg-primary-900/20"
            )}
            onClick={() => {
              onSelect("");
              setIsOpen(false);
            }}
          >
            <p className={clsx(
              "text-sm font-medium",
              selectedCategory === "" 
                ? "text-primary-700 dark:text-primary-300" 
                : "text-text-light-tertiary dark:text-dark-tertiary"
            )}>
              Texto Livre
            </p>
          </div>



          {/* Category Options */}
          {categories.map((category) => {
            // Categoria "Episódio" requer mundo selecionado
            const requiresWorld = category.slug === "episodio";
            const isDisabled = requiresWorld && !worldId;
            
            return (
              <div
                key={category.slug}
                className={clsx(
                  "px-3 py-2 transition-colors border-b border-border-light-default dark:border-border-dark-default last:border-b-0",
                  isDisabled 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-light-overlay dark:hover:bg-dark-overlay cursor-pointer",
                  selectedCategory === category.slug && "bg-primary-50 dark:bg-primary-900/20"
                )}
                onClick={() => {
                  if (isDisabled) {
                    alert("Essa categoria exige seleção de mundo");
                    return;
                  }
                  onSelect(category.slug);
                  setIsOpen(false);
                }}
              >
                <p className={clsx(
                  "text-sm font-medium truncate flex items-center gap-2",
                  selectedCategory === category.slug 
                    ? "text-primary-700 dark:text-primary-300" 
                    : isDisabled
                    ? "text-text-light-tertiary dark:text-dark-tertiary"
                    : "text-text-light-primary dark:text-dark-primary"
                )}>
                  <span className="text-lg">🏷️</span>
                  {category.label}
                </p>
              </div>
            );
          })}

          {/* Create New Category Option */}
          {onCreate && (
            <button
              onClick={() => {
                onCreate();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-primary-600 dark:text-primary-400 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex items-center gap-2 border-t border-border-light-default dark:border-border-dark-default"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Categoria
            </button>
          )}
        </div>
      )}
    </div>
  );
}
