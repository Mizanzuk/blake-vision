"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { clsx } from "clsx";

interface DropdownOption {
  id: string;
  label: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

interface CustomDropdownProps {
  value?: string | null;
  options: DropdownOption[];
  onSelect: (id: string | null) => void;
  label?: string;
  onCreateNew?: () => void;
  placeholder?: string;
}

export function CustomDropdown({
  value,
  options,
  onSelect,
  label,
  onCreateNew,
  placeholder = "Selecione uma opção",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

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

  const handleSelect = (id: string | null) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-text-light-secondary dark:text-text-dark-secondary">
          {label}
        </label>
      )}

      <div className="relative w-full">
        <button
          data-modal-ignore="true"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="inline-flex justify-between w-full rounded-lg border border-border-light-default dark:border-border-dark-default px-4 py-2 bg-light-raised dark:bg-dark-raised text-sm font-medium text-text-light-primary dark:text-dark-primary hover:bg-light-overlay dark:hover:bg-dark-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
        >
          <span>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon
            className={clsx(
              "ml-2 -mr-1 h-5 w-5 text-text-light-tertiary dark:text-dark-tertiary transition-transform",
              isOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div
            data-modal-ignore="true"
            className="absolute right-0 mt-2 w-full origin-top-right divide-y divide-border-light-default dark:divide-border-dark-default rounded-md bg-light-raised dark:bg-dark-raised shadow-lg ring-1 ring-black/5 z-[9999]"
          >
            <div className="px-1 py-1">
              <button
                onClick={() => handleSelect(null)}
                className={clsx(
                  "group flex w-full items-center rounded-md px-2 py-2 text-sm",
                  value === null
                    ? "bg-primary-500 text-white"
                    : "text-text-light-primary dark:text-dark-primary hover:bg-light-overlay dark:hover:bg-dark-overlay"
                )}
              >
                Nenhuma opção
              </button>
            </div>

            {options.length > 0 && (
              <div className="px-1 py-1">
                {options.map((option) => (
                  <div
                    key={option.id}
                    onMouseEnter={() => setHoveredId(option.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="relative"
                  >
                    <button
                      onClick={() => handleSelect(option.id)}
                      className={clsx(
                        "group flex w-full items-center rounded-md px-2 py-2 text-sm",
                        value === option.id
                          ? "bg-primary-500 text-white"
                          : "text-text-light-primary dark:text-dark-primary hover:bg-light-overlay dark:hover:bg-dark-overlay"
                      )}
                    >
                      {option.label}
                    </button>

                    {hoveredId === option.id && (option.onEdit || option.onDelete) && (
                      <div className="absolute right-0 top-0 flex gap-1 pr-2">
                        {option.onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              option.onEdit?.();
                            }}
                            className="p-1 rounded hover:bg-primary-500/20"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {option.onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              option.onDelete?.();
                            }}
                            className="p-1 rounded hover:bg-red-500/20"
                            title="Deletar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {onCreateNew && (
              <div className="px-1 py-1">
                <button
                  data-modal-ignore="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateNew();
                    setIsOpen(false);
                  }}
                  className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-light-overlay dark:hover:bg-dark-overlay"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Novo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
