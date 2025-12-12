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

  const getTypeColor = () => {
    return ficha.tipo === "conceito" 
      ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" 
      : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
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
        <div className="relative bg-light-raised dark:bg-dark-raised rounded-lg p-6 border border-border-light-default dark:border-border-dark-default">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor()}`}>
                  {getTypeLabel()}
                </span>
                {ficha.codigo && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {ficha.codigo}
                  </span>
                )}
                {world && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {world.nome}
                  </span>
                )}
              </div>
              
              {/* Título */}
              <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                {ficha.titulo}
              </h2>
            </div>
            
            {/* Botão de editar */}
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
              aria-label="Editar"
            >
              <PencilIcon className="w-4 h-4 text-text-light-secondary dark:text-dark-secondary hover:text-primary-600 dark:hover:text-primary-400" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Descrição (resumo) */}
        {ficha.resumo && (
          <div className="bg-light-raised dark:bg-dark-raised rounded-lg p-5 border border-border-light-default dark:border-border-dark-default">
            <h3 className="text-xs font-bold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wider mb-3">
              Descrição
            </h3>
            <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
              {ficha.resumo}
            </p>
          </div>
        )}

        {/* Conteúdo */}
        {ficha.conteudo && (
          <div className="bg-light-raised dark:bg-dark-raised rounded-lg p-5 border border-border-light-default dark:border-border-dark-default">
            <h3 className="text-xs font-bold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wider mb-3">
              Conteúdo
            </h3>
            <div className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap prose dark:prose-invert max-w-none">
              {ficha.conteudo}
            </div>
          </div>
        )}

        {/* Tags */}
        {ficha.tags && ficha.tags.trim() !== '' && (
          <div className="bg-light-raised dark:bg-dark-raised rounded-lg p-5 border border-border-light-default dark:border-border-dark-default">
            <h3 className="text-xs font-bold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wider mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {ficha.tags.split(',').map((tag, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
