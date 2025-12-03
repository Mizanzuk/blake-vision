"use client";

import { clsx } from "clsx";
import type { Ficha } from "@/app/types";

interface FichaCardProps {
  ficha: Ficha;
  onClick: () => void;
}

export default function FichaCard({ ficha, onClick }: FichaCardProps) {
  const getTypeLabel = () => {
    switch (ficha.tipo) {
      case "episodio":
        return "EP";
      case "conceito":
        return "CON";
      case "regra":
        return "REG";
      default:
        return ficha.tipo?.substring(0, 3).toUpperCase() || "???";
    }
  };

  const getTypeColor = () => {
    switch (ficha.tipo) {
      case "episodio":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "conceito":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
      case "regra":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
    }
  };

  const getTitle = () => {
    if (ficha.tipo === "episodio" && ficha.numero_episodio) {
      return `${ficha.numero_episodio}. ${ficha.titulo}`;
    }
    return ficha.titulo;
  };

  const getDescription = () => {
    if (ficha.tipo === "episodio") {
      // Para episódios: mostrar logline + sinopse
      const logline = ficha.conteudo || "";
      const sinopse = ficha.resumo || "";
      
      if (logline && sinopse) {
        return `${logline}\n${sinopse}`;
      }
      return logline || sinopse;
    }
    return ficha.descricao || ficha.resumo;
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Type Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={clsx(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
          getTypeColor()
        )}>
          {getTypeLabel()}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-text-light-primary dark:text-dark-primary mb-2 line-clamp-2">
        {getTitle()}
      </h3>

      {/* Description */}
      {getDescription() && (
        <p className="text-sm text-text-light-secondary dark:text-dark-secondary line-clamp-3">
          {getDescription()}
        </p>
      )}

      {/* Hover indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4 text-text-light-tertiary dark:text-dark-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    </div>
  );
}
