"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface EpisodesDropdownProps {
  label?: string;
  episodes: string[];
  selectedEpisodes: string[];
  onToggle: (episode: string) => void;
  onCreate?: () => void;
}

export function EpisodesDropdown({
  label,
  episodes,
  selectedEpisodes,
  onToggle,
  onCreate,
}: EpisodesDropdownProps) {
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

  const getButtonText = () => {
    if (selectedEpisodes.length === 0) {
      return "Todos os episódios";
    }
    if (selectedEpisodes.length === 1) {
      return selectedEpisodes[0];
    }
    return `${selectedEpisodes.length} episódios selecionados`;
  };

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-medium text-text-light-secondary dark:text-dark-secondary">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex items-center justify-between"
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
          {/* All episodes option */}
          <div
            className={clsx(
              "px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default flex items-center gap-2",
              selectedEpisodes.length === 0 && "bg-primary-50 dark:bg-primary-900/20"
            )}
            onClick={() => {
              // Clear all selections
              selectedEpisodes.forEach(ep => onToggle(ep));
            }}
          >
            <input
              type="checkbox"
              checked={selectedEpisodes.length === 0}
              onChange={() => {}}
              className="w-4 h-4 rounded border-border-light-default dark:border-border-dark-default text-primary-600 focus:ring-primary-500"
            />
            <p className={clsx(
              "text-sm font-medium",
              selectedEpisodes.length === 0
                ? "text-primary-700 dark:text-primary-300"
                : "text-text-light-primary dark:text-dark-primary"
            )}>
              Todos os episódios
            </p>
          </div>

          {/* Episode Options */}
          {episodes.map((episode) => {
            const isSelected = selectedEpisodes.includes(episode);
            
            return (
              <div
                key={episode}
                className={clsx(
                  "px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default flex items-center gap-2 last:border-b-0",
                  isSelected && "bg-primary-50 dark:bg-primary-900/20"
                )}
                onClick={() => onToggle(episode)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 rounded border-border-light-default dark:border-border-dark-default text-primary-600 focus:ring-primary-500"
                />
                <p className={clsx(
                  "text-sm font-medium truncate",
                  isSelected 
                    ? "text-primary-700 dark:text-primary-300" 
                    : "text-text-light-primary dark:text-dark-primary"
                )}>
                  {episode}
                </p>
              </div>
            );
          })}

          {/* Create New Episode Option */}
          {onCreate && (
            <>
              <div className="border-b border-border-light-default dark:border-border-dark-default" />
              <button
                onClick={() => {
                  onCreate();
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
