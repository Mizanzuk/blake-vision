'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import type { Episode } from '@/app/types';

interface EpisodioDropdownProps {
  value: string | null;
  episodes: Episode[];
  onSelect: (id: string | null) => void;
  label?: string;
}

export function EpisodioDropdown({
  value,
  episodes,
  onSelect,
  label = 'Episódio',
}: EpisodioDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isOpeningRef = useRef(false);

  const selectedEpisode = Array.isArray(episodes) ? episodes.find(ep => ep.id === value) : undefined;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Ignore the click that opened the dropdown
      if (isOpeningRef.current) {
        isOpeningRef.current = false;
        return;
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Use setTimeout to ensure the listener is added after the click event
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-text-light-secondary dark:text-text-dark-secondary">
          {label}
        </label>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          isOpeningRef.current = true;
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

      {isOpen && (
        <div className="absolute z-[9999] w-full bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-64 overflow-y-auto top-full mt-1">
          {/* Nenhum episódio option */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              !value
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                : 'hover:bg-light-overlay dark:hover:bg-dark-overlay'
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
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                value === episode.id
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                  : 'hover:bg-light-overlay dark:hover:bg-dark-overlay'
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
