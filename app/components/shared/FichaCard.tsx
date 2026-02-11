"use client";

import clsx from "clsx";
import type { Ficha } from "@/app/types";

interface FichaCardProps {
  ficha: Ficha;
  onClick: () => void;
  withIndent?: boolean; // Para recuo em episódios na página Projetos
  worldName?: string; // Nome do mundo (se a ficha pertence a um mundo específico)
  isSelectionMode?: boolean; // Se está em modo de seleção múltipla
  isSelected?: boolean; // Se a ficha está selecionada
  onSelect?: (fichaId: string) => void; // Callback quando a ficha é selecionada
}

export default function FichaCard({ ficha, onClick, withIndent = false, worldName, isSelectionMode = false, isSelected = false, onSelect }: FichaCardProps) {
  
  const getTypeColor = () => {
    const colors: Record<string, string> = {
      episodio: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      personagem: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      local: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      evento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      conceito: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      regra: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      objeto: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      sinopse: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return colors[ficha.tipo] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      episodio: "EP",
      personagem: "Personagem",
      local: "Local",
      evento: "Evento",
      conceito: "Conceito",
      regra: "Regra",
      objeto: "Objeto",
      sinopse: "Sinopse",
    };
    return labels[ficha.tipo] || ficha.tipo.toUpperCase();
  };

  const getTitle = () => {
    if ((ficha.tipo === "episodio" || ficha.tipo === "sinopse") && ficha.episodio) {
      return `${ficha.episodio} ${ficha.titulo}`;
    }
    return ficha.titulo;
  };

  const renderEpisodeCard = () => (
    <>
      {/* Type Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={clsx(
            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
            getTypeColor()
          )}>
            {getTypeLabel()}
          </span>
          {worldName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {worldName}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-text-light-primary dark:text-dark-primary mb-2 line-clamp-1">
        {getTitle()}
      </h3>

      {/* Logline */}
      {ficha.resumo && (
        <p className={clsx(
          "text-sm italic text-text-light-secondary dark:text-dark-secondary line-clamp-1 mb-1",
          withIndent && "pl-6"
        )}>
          {ficha.resumo}
        </p>
      )}

      {/* Sinopse */}
      {ficha.conteudo && (
        <p className={clsx(
          "text-sm text-text-light-secondary dark:text-dark-secondary line-clamp-2",
          withIndent && "pl-6"
        )}>
          {ficha.conteudo}
        </p>
      )}
    </>
  );

  const renderDefaultCard = () => (
    <>
      {/* Type Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={clsx(
            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
            getTypeColor()
          )}>
            {getTypeLabel()}
          </span>
          {worldName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {worldName}
            </span>
          )}
        </div>
        {ficha.codigo && (
          <span className="text-xs text-text-light-secondary dark:text-dark-secondary">
            {ficha.codigo}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-text-light-primary dark:text-dark-primary mb-2 line-clamp-1">
        {ficha.titulo}
      </h3>

      {/* Description/Resumo */}
      {(ficha.resumo || ficha.descricao) && (
        <p className="text-sm text-text-light-secondary dark:text-dark-secondary line-clamp-3">
          {ficha.resumo || ficha.descricao}
        </p>
      )}
    </>
  );

  const handleClick = () => {
    if (isSelectionMode && onSelect) {
      onSelect(ficha.id);
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "group relative border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer h-48 flex flex-col",
        "bg-light-raised dark:bg-dark-raised border-border-light-default dark:border-border-dark-default",
        isSelectionMode && isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
      )}
    >
      {/* Checkbox em modo de seleção */}
      {isSelectionMode && (
        <div className="absolute top-2 right-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect?.(ficha.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-border-light-default dark:border-border-dark-default cursor-pointer"
          />
        </div>
      )}
      {(ficha.tipo === "episodio" || ficha.tipo === "sinopse") ? renderEpisodeCard() : renderDefaultCard()}
    </div>
  );
}
