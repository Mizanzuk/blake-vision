"use client";

import { Modal, Badge, Button } from "@/app/components/ui";
import type { Ficha, Universe, World } from "@/app/types";
import { PencilIcon } from "@heroicons/react/24/outline";

interface ConceptRuleViewModalProps {
  ficha: Ficha;
  universes: Universe[];
  worlds: World[];
  onClose: () => void;
  onEdit: () => void;
}

export default function ConceptRuleViewModal({
  ficha,
  universes,
  worlds,
  onClose,
  onEdit,
}: ConceptRuleViewModalProps) {
  
  const universe = universes.find(u => u.id === ficha.universe_id);
  const world = worlds.find(w => w.id === ficha.world_id);
  
  const getTypeLabel = () => {
    return ficha.tipo === "conceito" ? "Conceito" : "Regra";
  };

  const getScope = () => {
    if (world) {
      return `Mundo: ${world.nome}`;
    }
    if (universe) {
      return `Universo: ${universe.nome}`;
    }
    return "";
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-light-default dark:border-border-dark-default pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="primary" size="sm">
                {getTypeLabel()}
              </Badge>
              {ficha.codigo && (
                <Badge variant="default" size="sm">
                  {ficha.codigo}
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary mb-2">
              {ficha.titulo}
            </h2>
            {getScope() && (
              <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
                {getScope()}
              </p>
            )}
          </div>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
            aria-label="Editar"
          >
            <PencilIcon className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" />
          </button>
        </div>

        {/* Descrição */}
        {ficha.descricao && (
          <div>
            <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
              Descrição
            </h3>
            <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
              {ficha.descricao}
            </p>
          </div>
        )}

        {/* Tags */}
        {ficha.tags && ficha.tags.trim() !== '' && (
          <div>
            <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {ficha.tags.split(',').map((tag, index) => (
                <Badge key={index} variant="default" size="sm">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
