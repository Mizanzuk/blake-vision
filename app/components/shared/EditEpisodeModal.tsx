'use client';

import { useState, useEffect } from 'react';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Editar Episódio</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Episódio
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Digite o nome do episódio"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
