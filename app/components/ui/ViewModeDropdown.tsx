"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface ViewModeDropdownProps {
  label?: string;
  value: "agrupado" | "lista";
  onChange: (value: "agrupado" | "lista") => void;
}

export function ViewModeDropdown({
  label,
  value,
  onChange,
}: ViewModeDropdownProps) {
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

  const options = [
    { value: "agrupado" as const, label: "Agrupado" },
    { value: "lista" as const, label: "Lista" },
  ];

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-medium text-text-light-secondary dark:text-dark-secondary">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "w-full px-3 py-2 text-left rounded-lg border transition-colors",
            "bg-light-raised dark:bg-dark-raised",
            "border-border-light-default dark:border-border-dark-default",
            "hover:bg-light-overlay dark:hover:bg-dark-overlay",
            "focus:outline-none focus:ring-2 focus:ring-primary-500",
            "flex items-center justify-between gap-2"
          )}
        >
          <span className="text-sm text-text-light-primary dark:text-dark-primary">
            {selectedOption?.label}
          </span>
          <svg
            className={clsx(
              "w-4 h-4 transition-transform text-text-light-secondary dark:text-dark-secondary",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2",
                  "hover:bg-light-overlay dark:hover:bg-dark-overlay",
                  value === option.value && "bg-primary-50 dark:bg-primary-900/20"
                )}
              >
                {/* Checkbox */}
                <div
                  className={clsx(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                    value === option.value
                      ? "bg-primary-500 border-primary-500"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                >
                  {value === option.value && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-text-light-primary dark:text-dark-primary">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
