'use client';

import { useState, useEffect, useRef } from 'react';
import './FontSelector.css';

export type FontFamily = 'serif' | 'sans' | 'mono';

interface FontSelectorProps {
  value: FontFamily;
  onChange: (font: FontFamily) => void;
}

const fontOptions = [
  { value: 'serif' as FontFamily, label: 'Serif' },
  { value: 'sans' as FontFamily, label: 'Sans' },
  { value: 'mono' as FontFamily, label: 'Mono' },
];

export default function FontSelector({ value, onChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (font: FontFamily) => {
    onChange(font);
    setIsOpen(false);
  };

  return (
    <div className="font-selector" ref={dropdownRef}>
      <button
        type="button"
        className="font-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Selecionar tipografia"
        aria-expanded={isOpen}
      >
        Aa ▾
      </button>

      {isOpen && (
        <div className="font-dropdown">
          {fontOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`font-option ${value === option.value ? 'active' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
