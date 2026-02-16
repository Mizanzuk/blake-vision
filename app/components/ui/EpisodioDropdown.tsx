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
  onCreate?: (worldId: string, universeId: string) => void;
  worldId?: string;
  universeId?: string;
  onEdit?: (episodeId: string, episodeName: string) => void;
  onDelete?: (episodeId: string) => Promise<void>;
  onEpisodeCreated?: (newEpisodeId: string) => void;
}

export function EpisodioDropdown({
  value,
  selectedId,
  episodes,
  onSelect,
  label = 'Episódio',
  onCreate,
  worldId,
  universeId,
  onEdit,
  onDelete,
  onEpisodeCreated,
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
              !actualValue
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                : 'hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-primary dark:text-dark-primary'
            }`}
          >
            Nenhum episódio
          </button>

          {/* Episodes */}
          {Array.isArray(episodes) && episodes.map((episode) => (
            <div
              key={episode.id}
              className="group relative w-full border-b border-border-light-default dark:border-border-dark-default last:border-b-0"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(episode.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  actualValue === episode.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                    : 'hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-primary dark:text-dark-primary'
                } flex items-center justify-between`}
              >
                <span>Episódio {episode.numero}: {episode.titulo}</span>
                {(onEdit || onDelete) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onEdit(episode.id, `Episódio ${episode.numero}: ${episode.titulo}`);
                          // NÃO fechar o dropdown - deixar aberto para o usuário continuar
                        }}
                        className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded transition-colors"
                        title="Editar episódio"
                      >
                        <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onDelete(episode.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Deletar episódio"
                      >
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </button>
            </div>
          ))}

          {/* Create New Episode Option */}
          {onCreate && (
            <>
              <div className="border-b border-border-light-default dark:border-border-dark-default" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCreate && worldId && universeId) {
                    onCreate(worldId, universeId);
                  }
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-primary-600 dark:text-primary-400 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Novo Episódio
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
