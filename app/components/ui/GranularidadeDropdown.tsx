'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

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

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-text-light-secondary dark:text-text-dark-secondary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-sm text-left border rounded-lg bg-light-raised dark:bg-dark-raised border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay focus:ring-2 focus:ring-primary-500 transition-colors flex items-center justify-between"
      >
        <span>{selectedGranularidade?.label || 'Selecione a granularidade'}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[9999] w-full bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-64 overflow-y-auto top-full mt-1">
          {granularidades.map((granularidade) => (
            <button
              key={granularidade.value}
              onClick={() => {
                onSelect(granularidade.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                value === granularidade.value
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                  : 'hover:bg-light-overlay dark:hover:bg-dark-overlay'
              }`}
            >
              {granularidade.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
