'use client';

import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface GranularidadeDropdownProps {
  value: string;
  onSelect: (value: string) => void;
  label?: string;
  required?: boolean;
}

export function GranularidadeDropdown({
  value,
  onSelect,
  label = 'Granularidade',
  required = false,
}: GranularidadeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const granularidades = [
    { value: 'ano', label: 'Ano' },
    { value: 'mes', label: 'Mês' },
    { value: 'dia', label: 'Dia' },
    { value: 'hora', label: 'Hora' },
  ];

  const selectedGranularidade = granularidades.find(g => g.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getButtonText = () => {
    if (!value) {
      return 'Selecione a granularidade';
    }
    return selectedGranularidade?.label || 'Selecione a granularidade';
  };

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-medium text-text-light-secondary dark:text-dark-secondary">
          {label}
          {required && <span className="text-error-light dark:text-error-dark ml-1">*</span>}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full px-4 py-2 text-left rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary transition-colors flex items-center justify-between",
          "hover:bg-light-overlay dark:hover:bg-dark-overlay"
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-w-[calc(20rem-2rem)] bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Placeholder Option */}
          <div
            className={clsx(
              "flex items-center px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default",
              !value && "bg-primary-50 dark:bg-primary-900/20"
            )}
            onClick={() => {
              onSelect('');
              setIsOpen(false);
            }}
          >
            <p className={clsx(
              "text-sm font-medium",
              !value
                ? "text-primary-700 dark:text-primary-300"
                : "text-text-light-secondary dark:text-dark-secondary"
            )}>
              Selecione a granularidade
            </p>
          </div>

          {/* Granularidade Options */}
          {granularidades.map((granularidade) => (
            <div
              key={granularidade.value}
              className={clsx(
                "flex items-center px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default last:border-b-0",
                value === granularidade.value && "bg-primary-50 dark:bg-primary-900/20"
              )}
              onClick={() => {
                onSelect(granularidade.value);
                setIsOpen(false);
              }}
            >
              <p className={clsx(
                "text-sm font-medium",
                value === granularidade.value
                  ? "text-primary-700 dark:text-primary-300"
                  : "text-text-light-primary dark:text-dark-primary"
              )}>
                {granularidade.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
