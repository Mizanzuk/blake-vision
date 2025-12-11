"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface TipoOption {
  value: string;
  label: string;
}

interface TipoDropdownProps {
  label?: string;
  selectedTipos: string[];
  onToggle: (tipo: string) => void;
}

const TIPO_OPTIONS: TipoOption[] = [
  { value: "conceito", label: "Conceitos" },
  { value: "regra", label: "Regras" },
];

export default function TipoDropdown({
  label = "TIPO",
  selectedTipos,
  onToggle,
}: TipoDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const getDisplayText = () => {
    if (selectedTipos.length === 0) {
      return "Todos os tipos";
    }
    if (selectedTipos.length === TIPO_OPTIONS.length) {
      return "Todos os tipos";
    }
    if (selectedTipos.length === 1) {
      const option = TIPO_OPTIONS.find(o => o.value === selectedTipos[0]);
      return option?.label || "Todos os tipos";
    }
    return `${selectedTipos.length} tipos selecionados`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full px-4 py-2 text-sm text-left border rounded-lg transition-colors flex items-center justify-between",
          "border-border-light-default dark:border-border-dark-default",
          "bg-light-raised dark:bg-dark-raised",
          "text-text-light-primary dark:text-dark-primary",
          "hover:bg-light-overlay dark:hover:bg-dark-overlay",
          "focus:outline-none focus:ring-2 focus:ring-primary-500"
        )}
      >
        <span className="truncate">{getDisplayText()}</span>
        <svg
          className={clsx(
            "ml-2 h-4 w-4 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {TIPO_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={clsx(
                  "flex items-center px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default last:border-b-0",
                  selectedTipos.includes(option.value) && "bg-primary-50 dark:bg-primary-900/20"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(option.value);
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTipos.includes(option.value)}
                  onChange={() => {}}
                  className="mr-3 h-4 w-4 rounded border-border-light-default dark:border-border-dark-default text-primary-600 focus:ring-primary-500"
                />
                <span className={clsx(
                  "text-sm font-medium",
                  selectedTipos.includes(option.value)
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-text-light-primary dark:text-dark-primary"
                )}>
                  {option.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
