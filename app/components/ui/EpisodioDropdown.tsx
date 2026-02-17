'use client';

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { ConfirmDialog } from '@/app/components/ui/Modal';
import type { Episode } from '@/app/types';
import { clsx } from 'clsx';

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
  onEpisodeDeleted?: (deletedEpisodeId: string) => void;
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
  onEpisodeDeleted,
}: EpisodioDropdownProps) {
  const actualValue = selectedId !== undefined ? selectedId : value;
  const selectedEpisode = Array.isArray(episodes) ? episodes.find(ep => ep.id === actualValue) : undefined;
  
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<{ id: string; numero: number; titulo: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (episode: { id: string; numero: number; titulo: string }) => {
    setEpisodeToDelete(episode);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!episodeToDelete || !onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(episodeToDelete.id);
      
      // Remove from selected if it was selected
      if (selectedId === episodeToDelete.id) {
        onSelect(null);
      }
      
      // Notify parent that episode was deleted
      if (onEpisodeDeleted) {
        onEpisodeDeleted(episodeToDelete.id);
      }
      
      setConfirmDeleteOpen(false);
      setEpisodeToDelete(null);
    } catch (error) {
      console.error("Erro ao deletar episódio:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-text-light-secondary dark:text-text-dark-secondary">
            {label}
          </label>
        )}

        <Menu as="div" className="relative inline-block text-left w-full">
          <div>
            <Menu.Button 
              data-modal-ignore="true"
              className="inline-flex justify-between w-full rounded-lg border border-border-light-default dark:border-border-dark-default px-4 py-2 bg-light-raised dark:bg-dark-raised text-sm font-medium text-text-light-primary dark:text-dark-primary hover:bg-light-overlay dark:hover:bg-dark-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
            >
              <span>
                {selectedEpisode
                  ? `Episódio ${selectedEpisode.numero}: ${selectedEpisode.titulo}`
                  : 'Nenhum episódio'}
              </span>
              <ChevronDownIcon
                className="ml-2 -mr-1 h-5 w-5 text-text-light-tertiary dark:text-dark-tertiary"
                aria-hidden="true"
              />
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items 
              data-modal-ignore="true"
              className="absolute right-0 mt-2 w-full origin-top-right divide-y divide-border-light-default dark:divide-border-dark-default rounded-md bg-light-raised dark:bg-dark-raised shadow-lg ring-1 ring-black/5 focus:outline-none z-[9999]"
            >
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onSelect(null)}
                      className={clsx(
                        'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                        active ? 'bg-primary-500 text-white' : 'text-text-light-primary dark:text-dark-primary',
                      )}
                    >
                      Nenhum episódio
                    </button>
                  )}
                </Menu.Item>
                {Array.isArray(episodes) && episodes.map((episode) => (
                  <Menu.Item key={episode.id}>
                    {({ active }) => (
                      <div className="flex items-center justify-between w-full group">
                        <button
                          onClick={() => onSelect(episode.id)}
                          className={clsx(
                            'group flex flex-1 items-center rounded-md px-2 py-2 text-sm',
                            active ? 'bg-primary-500 text-white' : 'text-text-light-primary dark:text-dark-primary',
                          )}
                        >
                          <span>Episódio {episode.numero}: {episode.titulo}</span>
                        </button>
                        {(onEdit || onDelete) && (
                          <div className="flex gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  onEdit(episode.id, `Episódio ${episode.numero}: ${episode.titulo}`);
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteClick(episode);
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
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </div>
              {onCreate && worldId && universeId && (
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onCreate(worldId, universeId)}
                        className={clsx(
                          'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                          active ? 'bg-primary-500 text-white' : 'text-primary-600 dark:text-primary-400',
                        )}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Novo Episódio
                      </button>
                    )}
                  </Menu.Item>
                </div>
              )}
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Confirm Delete Dialog */}
      {episodeToDelete && (
        <ConfirmDialog
          isOpen={confirmDeleteOpen}
          onClose={() => {
            setConfirmDeleteOpen(false);
            setEpisodeToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Deletar Episódio"
          description={`Tem certeza que deseja deletar o Episódio ${episodeToDelete.numero}: ${episodeToDelete.titulo}? Esta ação não pode ser desfeita.`}
          confirmText="Deletar"
          cancelText="Cancelar"
          confirmVariant="danger"
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
