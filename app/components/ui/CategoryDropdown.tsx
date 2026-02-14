"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import type { Category } from "@/app/types";

interface CategoryDropdownProps {
  label?: string;
  categories: Category[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  onCreateNew?: () => void;
  disabled?: boolean;
}

export function CategoryDropdown({
  label = "CATEGORIA",
  categories,
  selectedSlug,
  onSelect,
  onCreateNew,
  disabled = false,
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Update button rect when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  const getButtonText = () => {
    if (!selectedSlug) {
      return "Selecione uma categoria";
    }
    const category = categories.find(c => c.slug === selectedSlug);
    if (category?.label) {
      return category.label;
    }
    // Se nao encontrou a categoria, use o slug como fallback (em maiusculas)
    // Isso eh util quando o tipo vem da IA em minusculas (ex: "personagem")
    return selectedSlug.charAt(0).toUpperCase() + selectedSlug.slice(1);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          "w-full px-4 py-2 text-left rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary transition-colors flex items-center justify-between",
          disabled 
            ? "opacity-50 cursor-not-allowed" 
            : "hover:bg-light-overlay dark:hover:bg-dark-overlay focus:outline-none focus:ring-2 focus:ring-primary-500"
        )}
      >
        <span className="text-sm truncate">
          {getButtonText()}
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

      {/* Dropdown Menu - Using fixed positioning to escape modal overflow */}
      {isOpen && buttonRect && (
        <div 
          className="fixed z-[9999] bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-64 overflow-y-auto"
          style={{
            top: `${buttonRect.bottom + 8}px`,
            left: `${buttonRect.left}px`,
            width: `${buttonRect.width}px`,
            maxWidth: 'calc(20rem - 2rem)'
          }}
        >
          {/* Placeholder Option */}
          <div
            className={clsx(
              "flex items-center px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default",
              !selectedSlug && "bg-primary-50 dark:bg-primary-900/20"
            )}
            onClick={() => {
              onSelect("");
              setIsOpen(false);
            }}
          >
            <p className={clsx(
              "text-sm font-medium",
              !selectedSlug
                ? "text-primary-700 dark:text-primary-300"
                : "text-text-light-secondary dark:text-dark-secondary"
            )}>
              Selecione uma categoria
            </p>
          </div>

          {/* Category Options */}
          {categories.map((category) => (
            <div
              key={category.slug}
              className={clsx(
                "flex items-center px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default last:border-b-0",
                selectedSlug === category.slug && "bg-primary-50 dark:bg-primary-900/20"
              )}
              onClick={() => {
                onSelect(category.slug);
                setIsOpen(false);
              }}
            >
              <p className={clsx(
                "text-sm font-medium truncate",
                selectedSlug === category.slug
                  ? "text-primary-700 dark:text-primary-300"
                  : "text-text-light-primary dark:text-dark-primary"
              )}>
                {category.label}
              </p>
            </div>
          ))}

          {/* Create New Category Option */}
          {onCreateNew && (
            <button
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-primary-600 dark:text-primary-400 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex items-center gap-2 border-t border-border-light-default dark:border-border-dark-default"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar Nova Categoria
            </button>
          )}
        </div>
      )}
    </div>
  );
}
