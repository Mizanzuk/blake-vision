'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import type { Episode } from '@/app/types';

interface EpisodioDropdownProps {
  value?: string | null;
  selectedId?: string | null;
  episodes: Episode[] | Array<{ id: string; numero: number; titulo: string }>;
  onSelect: (id: string | null) => void;
  label?: string;
}

export function EpisodioDropdown({
  value,
  selectedId,
  episodes,
  onSelect,
  label = 'Episódio',
}: EpisodioDropdownProps) {
  const actualValue = selectedId !== undefined ? selectedId : value;
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedEpisode = Array.isArray(episodes) ? episodes.find(ep => ep.id === actualValue) : undefined;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Não fechar se clicar no botão ou no menu
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Update button rect when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonRect(rect);
    } else {
      setButtonRect(null);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-text-light-secondary dark:text-text-dark-secondary">
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full px-4 py-2 text-sm text-left border rounded-lg bg-light-raised dark:bg-dark-raised border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay focus:ring-2 focus:ring-primary-500 transition-colors flex items-center justify-between"
      >
        <span>
          {selectedEpisode
            ? `Episódio ${selectedEpisode.numero}: ${selectedEpisode.titulo}`
            : 'Nenhum episódio'}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && buttonRect && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-64 overflow-y-auto"
          style={{
            top: `${buttonRect.bottom + 8}px`,
            left: `${buttonRect.left}px`,
            width: `${buttonRect.width}px`,
            maxWidth: 'calc(20rem - 2rem)'
          }}
        >
          {/* Nenhum episódio option */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-border-light-default dark:border-border-dark-default ${
              !value
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                : 'hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-primary dark:text-dark-primary'
            }`}
          >
            Nenhum episódio
          </button>

          {/* Episodes */}
          {Array.isArray(episodes) && episodes.map((episode) => (
            <button
              key={episode.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(episode.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-border-light-default dark:border-border-dark-default last:border-b-0 ${
                value === episode.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                  : 'hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-primary dark:text-dark-primary'
              }`}
            >
              Episódio {episode.numero}: {episode.titulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
