"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Button, Select } from "@/app/components/ui";
import type { Ficha, Universe, World } from "@/app/types";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";

interface ConceptRuleModalProps {
  item: Ficha | null;
  tipo: "conceito" | "regra";
  universes: Universe[];
  worlds: World[];
  preSelectedUniverseId?: string;
  preSelectedWorldId?: string;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function ConceptRuleModal({
  item,
  tipo,
  universes,
  worlds,
  preSelectedUniverseId = "",
  preSelectedWorldId = "",
  onSave,
  onDelete,
  onClose,
}: ConceptRuleModalProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>(preSelectedUniverseId);
  const [selectedWorldId, setSelectedWorldId] = useState<string>(preSelectedWorldId);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [filteredWorlds, setFilteredWorlds] = useState<World[]>([]);

  useEffect(() => {
    if (item) {
      setSelectedUniverseId(item.universe_id || "");
      setSelectedWorldId(item.world_id || "");
      setTitulo(item.titulo || "");
      setDescricao(item.descricao || item.resumo || "");
    } else {
      setSelectedUniverseId(preSelectedUniverseId);
      setSelectedWorldId(preSelectedWorldId);
      setTitulo("");
      setDescricao("");
    }
    setHasChanges(false);
  }, [item, preSelectedUniverseId, preSelectedWorldId]);

  useEffect(() => {
    if (selectedUniverseId) {
      const worldsForUniverse = worlds.filter(w => w.universe_id === selectedUniverseId && !w.is_root);
      setFilteredWorlds(worldsForUniverse);
    } else {
      setFilteredWorlds([]);
      setSelectedWorldId("");
    }
  }, [selectedUniverseId, worlds]);

  function handleChange() {
    setHasChanges(true);
  }

  async function handleClose() {
    if (hasChanges) {
      const confirmed = await confirm({
        title: "Alterações Não Salvas",
        message: "Você tem alterações não salvas. Deseja realmente fechar sem salvar?",
        confirmText: "Fechar sem Salvar",
        cancelText: "Continuar Editando",
        variant: "danger"
      });
      if (!confirmed) return;
    }
    onClose();
  }

  function handleSave() {
    // Validation
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
      episodio: null, // Conceitos e Regras não pertencem a episódios específicos
    };

    onSave(itemData);
    setHasChanges(false);
  }

  async function handleDelete() {
    if (!item?.id || !onDelete) return;

    const confirmed = await confirm({
      title: `Confirmar Exclusão de ${tipo === 'conceito' ? 'Conceito' : 'Regra'}`,
      message: `Tem certeza que deseja deletar este ${tipo}? Esta ação não pode ser desfeita.`,
      confirmText: "Deletar",
      cancelText: "Cancelar",
      variant: "danger"
    });

    if (confirmed) {
      onDelete(item.id);
    }
  }

  const getScopeMessage = () => {
    if (!selectedUniverseId) {
      return null;
    }

    const universe = universes.find(u => u.id === selectedUniverseId);
    const universeName = universe?.nome || "universo";

    if (selectedWorldId) {
      const world = filteredWorlds.find(w => w.id === selectedWorldId);
      const worldName = world?.nome || "mundo";
      return `ℹ️ Esse ${tipo} será aplicado no mundo ${worldName}`;
    }

    return `ℹ️ Esse ${tipo} será aplicado em todo o universo ${universeName}`;
  };

  const modalTitle = item 
    ? `Editar ${tipo === "conceito" ? "Conceito" : "Regra"}`
    : `Novo ${tipo === "conceito" ? "Conceito" : "Regra"}`;

  return (
    <>
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={modalTitle}
      size="lg"
    >
      <div className="space-y-4">
        {/* Universo */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Universo <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedUniverseId}
            onChange={(e) => {
              setSelectedUniverseId(e.target.value);
              setSelectedWorldId("");
              handleChange();
            }}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Selecione um Universo</option>
            {universes.map((universe) => (
              <option key={universe.id} value={universe.id}>
                {universe.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Mundo */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mundo
          </label>
          <select
            value={selectedWorldId}
            onChange={(e) => {
              setSelectedWorldId(e.target.value);
              handleChange();
            }}
            disabled={!selectedUniverseId || filteredWorlds.length === 0}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Selecione um Mundo</option>
            {filteredWorlds.map((world) => (
              <option key={world.id} value={world.id}>
                {world.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Scope Message */}
        {getScopeMessage() && (
          <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {getScopeMessage()}
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4" />

        {/* Título */}
        <Input
          label="Título"
          type="text"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            handleChange();
          }}
          placeholder={tipo === "conceito" ? "Ex: Toda experiência gera uma lição" : "Ex: A cada episódio, uma pista diferente"}
          required
          fullWidth
        />

        {/* Descrição */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição <span className="text-red-500">*</span>
          </label>
          <textarea
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
              handleChange();
            }}
            placeholder={tipo === "conceito" 
              ? "Descreva o conceito fundamental que guia este universo ou mundo"
              : "Descreva a regra ou mecânica que deve ser seguida"
            }
            rows={6}
            required
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div>
            {item && onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
    <ConfirmDialog />
    </>
  );
}
