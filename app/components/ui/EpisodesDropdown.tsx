"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { DeleteEpisodeModal } from "@/app/components/shared/DeleteEpisodeModal";

interface EpisodesDropdownProps {
  label?: string;
  episodes: string[];
  episodeIds?: Record<string, string>; // Map of episode name to ID
  selectedEpisodes: string[];
  onToggle: (episode: string) => void;
  onCreate?: () => void;
  onEdit?: (episodeId: string, episodeName: string) => void;
  onDelete?: (episodeId: string) => Promise<void>;
}

export function EpisodesDropdown({
  label,
  episodes,
  episodeIds = {},
  selectedEpisodes,
  onToggle,
  onCreate,
  onEdit,
  onDelete,
}: EpisodesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; episodeName: string; episodeId: string }>({
    isOpen: false,
    episodeName: "",
    episodeId: "",
  });
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

  const handleDeleteConfirm = async () => {
    if (onDelete && deleteModal.episodeId) {
      await onDelete(deleteModal.episodeId);
      setDeleteModal({ isOpen: false, episodeName: "", episodeId: "" });
    }
  };

  return (
    <>
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
              const episodeId = episodeIds[episode];
              
              return (
                <div
                  key={episode}
                  className={clsx(
                    "px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors border-b border-border-light-default dark:border-border-dark-default flex items-center gap-2 last:border-b-0 group",
                    isSelected && "bg-primary-50 dark:bg-primary-900/20"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(episode)}
                    className="w-4 h-4 rounded border-border-light-default dark:border-border-dark-default text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <p className={clsx(
                    "text-sm font-medium truncate flex-1 cursor-pointer",
                    isSelected 
                      ? "text-primary-700 dark:text-primary-300" 
                      : "text-text-light-primary dark:text-dark-primary"
                  )}
                  onClick={() => onToggle(episode)}>
                    {episode}
                  </p>

                  {/* Edit and Delete buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && episodeId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(episodeId, episode);
                          setIsOpen(false);
                        }}
                        className="p-1 text-text-light-tertiary dark:text-dark-tertiary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Editar episódio"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && episodeId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ isOpen: true, episodeName: episode, episodeId });
                        }}
                        className="p-1 text-text-light-tertiary dark:text-dark-tertiary hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Deletar episódio"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
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

      {/* Delete Modal */}
      <DeleteEpisodeModal
        isOpen={deleteModal.isOpen}
        episodeName={deleteModal.episodeName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, episodeName: "", episodeId: "" })}
      />
    </>
  );
}
