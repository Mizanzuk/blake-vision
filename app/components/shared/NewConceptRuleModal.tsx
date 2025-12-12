"use client";
// Force recompile: 2025-12-12T00:18:30Z

import { useState, useEffect } from "react";
import type { Ficha, Universe, World } from "@/app/types";
import { toast } from "sonner";

interface NewConceptRuleModalProps {
  isOpen: boolean;
  item: Ficha | null;
  tipo: "conceito" | "regra";
  universes: Universe[];
  worlds: World[];
  preSelectedUniverseId?: string;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function NewConceptRuleModal({
  isOpen,
  item,
  tipo,
  universes,
  worlds,
  preSelectedUniverseId = "",
  onSave,
  onDelete,
  onClose,
}: NewConceptRuleModalProps) {
  const [selectedUniverseId, setSelectedUniverseId] = useState(preSelectedUniverseId);
  const [selectedWorldId, setSelectedWorldId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  // Carregar dados do item ao editar
  useEffect(() => {
    if (item) {
      setSelectedUniverseId(item.universe_id || "");
      setSelectedWorldId(item.world_id || "");
      setTitulo(item.titulo || "");
      setDescricao(item.descricao || "");
    } else {
      setSelectedUniverseId(preSelectedUniverseId);
      setSelectedWorldId("");
      setTitulo("");
      setDescricao("");
    }
  }, [item, preSelectedUniverseId]);

  // Filtrar mundos do universo selecionado
  const filteredWorlds = worlds.filter(w => w.universe_id === selectedUniverseId);

  function handleSave() {
    console.log("[NewConceptRuleModal] Salvando...", { selectedUniverseId, titulo, descricao });

    // Validações
    if (!selectedUniverseId) {
      toast.error("Selecione um universo");
      return;
    }

    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!descricao.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }

    const itemData = {
      id: item?.id,
      universe_id: selectedUniverseId,
      world_id: selectedWorldId || null,
      tipo,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      episodio: null,
    };

    console.log("[NewConceptRuleModal] Dados a salvar:", itemData);
    onSave(itemData);
  }

  async function handleDelete() {
    if (!item?.id || !onDelete) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja deletar este ${tipo}? Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      onDelete(item.id);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            🚀 VERSÃO NOVA - {item ? `Editar ${tipo === "conceito" ? "Conceito" : "Regra"}` : `Novo ${tipo === "conceito" ? "Conceito" : "Regra"}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Universo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Universo <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedUniverseId}
              onChange={(e) => {
                setSelectedUniverseId(e.target.value);
                setSelectedWorldId(""); // Reset mundo ao mudar universo
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecione um Universo</option>
              {universes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Mundo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mundo
            </label>
            <select
              value={selectedWorldId}
              onChange={(e) => setSelectedWorldId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={!selectedUniverseId}
            >
              <option value="">Selecione um Mundo</option>
              {filteredWorlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.nome}
                </option>
              ))}
            </select>
            {selectedUniverseId && !selectedWorldId && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                ℹ️ Esse {tipo} será aplicado em todo o universo {universes.find(u => u.id === selectedUniverseId)?.nome}
              </p>
            )}
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={`Ex: ${tipo === "conceito" ? "Toda experiência gera uma lição" : "Ninguém pode viajar no tempo"}`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={`Descreva ${tipo === "conceito" ? "o conceito fundamental que guia este universo ou mundo" : "a regra que define os limites e possibilidades deste universo ou mundo"}`}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            {item && onDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
