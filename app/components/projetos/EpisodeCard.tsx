"use client";

import { Card, Badge } from "@/app/components/ui";
import type { Ficha } from "@/app/types";

interface EpisodeCardProps {
  episode: Ficha;
  onClick: () => void;
}

export default function EpisodeCard({ episode, onClick }: EpisodeCardProps) {
  return (
    <Card
      variant="outlined"
      padding="lg"
      hoverable
      onClick={onClick}
      className="cursor-pointer h-full flex flex-col"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        {episode.numero_episodio && (
          <Badge variant="primary" size="sm">
            Ep. {episode.numero_episodio}
          </Badge>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {episode.titulo}
      </h3>

      {episode.logline && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
          {episode.logline}
        </p>
      )}

      {episode.resumo && (
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 flex-1">
          {episode.resumo}
        </p>
      )}
    </Card>
  );
}
