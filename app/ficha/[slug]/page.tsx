"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Header } from "@/app/components/layout/Header";
import { Badge, Button, Loading } from "@/app/components/ui";
import { PencilIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import type { Ficha } from "@/app/types";

export default function FichaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supabase = getSupabaseClient();

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFicha() {
      if (!slug) return;

      try {
        setIsLoading(true);
        setError(null);

        // Buscar ficha via API
        const response = await fetch(`/api/fichas/${slug}`);
        
        if (!response.ok) {
          throw new Error('Ficha não encontrada');
        }

        const data = await response.json();
        setFicha(data.ficha);
      } catch (err: any) {
        console.error('Erro ao carregar ficha:', err);
        setError(err.message || 'Erro ao carregar ficha');
      } finally {
        setIsLoading(false);
      }
    }

    loadFicha();
  }, [slug]);

  const getTypeLabel = () => {
    if (!ficha) return '';
    const labels: Record<string, string> = {
      episodio: "Episódio",
      personagem: "Personagem",
      local: "Local",
      evento: "Evento",
      conceito: "Conceito",
      regra: "Regra",
      objeto: "Objeto",
    };
    return labels[ficha.tipo] || ficha.tipo;
  };

  const handleEdit = () => {
    router.push(`/catalog?edit=${ficha?.id}`);
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-base dark:bg-dark-base">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (error || !ficha) {
    return (
      <div className="min-h-screen bg-light-base dark:bg-dark-base">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary mb-4">
              Ficha não encontrada
            </h1>
            <p className="text-text-light-secondary dark:text-dark-secondary mb-6">
              {error || 'A ficha que você está procurando não existe ou foi removida.'}
            </p>
            <Button onClick={handleBack} variant="primary">
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Voltar
        </button>

        {/* Card da Ficha */}
        <div className="bg-light-raised dark:bg-dark-raised rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="space-y-6">
              {/* Header com badge de tipo e botão editar */}
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
                  <h1 className="text-3xl font-bold text-text-light-primary dark:text-dark-primary">
                    {ficha.titulo || 'Sem título'}
                  </h1>
                </div>
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
                  aria-label="Editar ficha"
                >
                  <PencilIcon className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" />
                </button>
              </div>

              {/* Imagem de capa */}
              {ficha.imagem_capa && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={ficha.imagem_capa}
                    alt={ficha.titulo}
                    className="w-full h-96 object-cover"
                  />
                </div>
              )}

              {/* Resumo */}
              {ficha.resumo && (
                <div>
                  <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                    Resumo
                  </h3>
                  <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
                    {ficha.resumo}
                  </p>
                </div>
              )}

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

              {/* Conteúdo */}
              {ficha.conteudo && (
                <div>
                  <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                    Conteúdo
                  </h3>
                  <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
                    {ficha.conteudo}
                  </p>
                </div>
              )}

              {/* Ano Diegese */}
              {ficha.ano_diegese && (
                <div>
                  <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                    Ano Diegese
                  </h3>
                  <p className="text-base text-text-light-primary dark:text-dark-primary">
                    {ficha.ano_diegese}
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
          </div>
        </div>
      </div>
    </div>
  );
}
