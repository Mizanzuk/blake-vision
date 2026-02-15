'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

interface EditEpisodeModalProps {
  isOpen: boolean;
  episodeId: string;
  episodeName: string;
  onClose: () => void;
  onSave: (episodeId: string, newName: string) => Promise<void>;
}

export default function EditEpisodeModal({
  isOpen,
  episodeId,
  episodeName,
  onClose,
  onSave,
}: EditEpisodeModalProps) {
  const [name, setName] = useState(episodeName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(episodeName);
    setError(null);
  }, [episodeName, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('O nome do episódio não pode estar vazio');
      return;
    }

    setLoading(true);
    try {
      await onSave(episodeId, name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar episódio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Episódio"
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            size="sm"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
            loading={loading}
            size="sm"
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-1.5">
            Nome do Episódio
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Digite o nome do episódio"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
