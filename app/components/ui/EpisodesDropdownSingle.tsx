"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface Episode {
  id: string;
  numero: string;
  titulo: string;
}

interface EpisodesDropdownSingleProps {
  label?: string;
  episodes: Episode[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate?: () => void;
  disabled?: boolean;
}

export function EpisodesDropdownSingle({
  label,
  episodes,
  selectedId,
  onSelect,
  onCreate,
  disabled = false,
}: EpisodesDropdownSingleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedEpisode = episodes.find(ep => ep.id === selectedId);

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

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          "w-full px-4 py-2 text-left rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary transition-colors flex items-center justify-between",
          disabled 
            ? "opacity-50 cursor-not-allowed" 
            : "hover:bg-light-overlay dark:hover:bg-dark-overlay cursor-pointer"
        )}
      >
        <span className="text-sm truncate">
          {selectedEpisode 
            ? `${selectedEpisode.numero}. ${selectedEpisode.titulo}` 
            : "Selecione um episódio"}
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
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-w-[calc(20rem-2rem)] bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Empty Option */}
          <div
            className={clsx(
              "px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default",
              selectedId === "" && "bg-primary-50 dark:bg-primary-900/20"
            )}
            onClick={() => {
              onSelect("");
              setIsOpen(false);
            }}
          >
            <p className={clsx(
              "text-sm font-medium",
              selectedId === "" 
                ? "text-primary-700 dark:text-primary-300" 
                : "text-text-light-tertiary dark:text-dark-tertiary"
            )}>
              Selecione um episódio
            </p>
          </div>

          {/* Episode Options */}
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className={clsx(
                "px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default last:border-b-0",
                selectedId === episode.id && "bg-primary-50 dark:bg-primary-900/20"
              )}
              onClick={() => {
                onSelect(episode.id);
                setIsOpen(false);
              }}
            >
              <p className={clsx(
                "text-sm font-medium truncate",
                selectedId === episode.id 
                  ? "text-primary-700 dark:text-primary-300" 
                  : "text-text-light-primary dark:text-dark-primary"
              )}>
                {episode.numero}. {episode.titulo}
              </p>
            </div>
          ))}

          {/* Create New Episode Option */}
          {onCreate && (
            <button
              onClick={() => {
                onCreate();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-primary-600 dark:text-primary-400 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex items-center gap-2 border-t border-border-light-default dark:border-border-dark-default"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Episódio
            </button>
          )}
        </div>
      )}
    </div>
  );
}
