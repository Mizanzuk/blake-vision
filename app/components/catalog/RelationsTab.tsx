"use client";

import { useState, useEffect } from "react";
import { Button, Input, Select, Badge, EmptyState, Loading } from "@/app/components/ui";
import { toast } from "sonner";

interface Relation {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: string;
  description: string | null;
  target_ficha: {
    id: string;
    titulo: string;
    tipo: string;
    slug: string;
  };
}

interface RelationsTabProps {
  fichaId: string;
}

const RELATION_TYPES = [
  { value: "amigo_de", label: "é amigo de" },
  { value: "inimigo_de", label: "é inimigo de" },
  { value: "pai_de", label: "é pai/mãe de" },
  { value: "filho_de", label: "é filho/filha de" },
  { value: "irmao_de", label: "é irmão/irmã de" },
  { value: "casado_com", label: "é casado com" },
  { value: "trabalha_em", label: "trabalha em" },
  { value: "mora_em", label: "mora em" },
  { value: "nasceu_em", label: "nasceu em" },
  { value: "pertence_a", label: "pertence a" },
  { value: "lider_de", label: "é líder de" },
  { value: "membro_de", label: "é membro de" },
  { value: "criador_de", label: "é criador de" },
  { value: "aconteceu_em", label: "aconteceu em" },
  { value: "participou_de", label: "participou de" },
  { value: "causou", label: "causou" },
  { value: "foi_causado_por", label: "foi causado por" },
  { value: "relacionado_a", label: "está relacionado a" },
];

export default function RelationsTab({ fichaId }: RelationsTabProps) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Search for target ficha
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // New relation form
  const [newRelation, setNewRelation] = useState({
    target_id: "",
    target_titulo: "",
    relation_type: "relacionado_a",
    description: "",
  });

  useEffect(() => {
    loadRelations();
  }, [fichaId]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchFichas();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  async function loadRelations() {
    try {
      const response = await fetch(`/api/relations?fichaId=${fichaId}`);
      const data = await response.json();
      
      if (response.ok) {
        setRelations(data.relations || []);
      }
    } catch (error) {
      console.error("Error loading relations:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function searchFichas() {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/fichas?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter out current ficha
        const filtered = (data.fichas || []).filter((f: any) => f.id !== fichaId);
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Error searching fichas:", error);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAddRelation() {
    if (!newRelation.target_id || !newRelation.relation_type) {
      toast.error("Selecione uma ficha e um tipo de relação");
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch("/api/relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_id: fichaId,
          target_id: newRelation.target_id,
          relation_type: newRelation.relation_type,
          description: newRelation.description || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Relação criada com sucesso!");
        await loadRelations();
        setShowAddForm(false);
        setNewRelation({
          target_id: "",
          target_titulo: "",
          relation_type: "relacionado_a",
          description: "",
        });
        setSearchTerm("");
        setSearchResults([]);
      } else {
        toast.error(data.error || "Erro ao criar relação");
      }
    } catch (error) {
      console.error("Error adding relation:", error);
      toast.error("Erro ao criar relação");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteRelation(relationId: string) {
    const confirmed = window.confirm("Tem certeza que deseja remover esta relação?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/relations?id=${relationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Relação removida com sucesso!");
        await loadRelations();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao remover relação");
      }
    } catch (error) {
      console.error("Error deleting relation:", error);
      toast.error("Erro ao remover relação");
    }
  }

  function selectFicha(ficha: any) {
    setNewRelation({
      ...newRelation,
      target_id: ficha.id,
      target_titulo: ficha.titulo,
    });
    setSearchTerm(ficha.titulo);
    setSearchResults([]);
  }

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Relation Button */}
      {!showAddForm && (
        <Button
          variant="primary"
          onClick={() => setShowAddForm(true)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Adicionar Relação
        </Button>
      )}

      {/* Add Relation Form */}
      {showAddForm && (
        <div className="bg-light-raised dark:bg-dark-raised p-6 rounded-lg border border-border-light-default dark:border-border-dark-default">
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary mb-4">
            Nova Relação
          </h3>

          <div className="space-y-4">
            {/* Search Ficha */}
            <div className="relative">
              <Input
                label="Buscar Ficha"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome da ficha..."
                fullWidth
                disabled={!!newRelation.target_id}
              />
              
              {isSearching && (
                <div className="absolute right-3 top-10">
                  <Loading size="sm" />
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((ficha) => (
                    <button
                      key={ficha.id}
                      onClick={() => selectFicha(ficha)}
                      className="w-full px-4 py-3 text-left hover:bg-light-base dark:hover:bg-dark-base transition-colors border-b border-border-light-default dark:border-border-dark-default last:border-b-0"
                    >
                      <div className="font-semibold text-text-light-primary dark:text-dark-primary">
                        {ficha.titulo}
                      </div>
                      <div className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                        {ficha.tipo} • {ficha.slug}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {newRelation.target_id && (
              <>
                {/* Relation Type */}
                <Select
                  label="Tipo de Relação"
                  value={newRelation.relation_type}
                  onChange={(e) => setNewRelation({ ...newRelation, relation_type: e.target.value })}
                  options={RELATION_TYPES}
                  fullWidth
                />

                {/* Description */}
                <Input
                  label="Descrição (opcional)"
                  value={newRelation.description}
                  onChange={(e) => setNewRelation({ ...newRelation, description: e.target.value })}
                  placeholder="Ex: desde a infância, durante a guerra..."
                  fullWidth
                />

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewRelation({
                        target_id: "",
                        target_titulo: "",
                        relation_type: "relacionado_a",
                        description: "",
                      });
                      setSearchTerm("");
                      setSearchResults([]);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAddRelation}
                    loading={isAdding}
                  >
                    Adicionar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Relations List */}
      {relations.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          }
          title="Nenhuma Relação"
          description="Esta ficha ainda não possui relações com outras fichas"
        />
      ) : (
        <div className="space-y-3">
          {relations.map((relation) => {
            const relationType = RELATION_TYPES.find(rt => rt.value === relation.relation_type);
            
            return (
              <div
                key={relation.id}
                className="bg-light-raised dark:bg-dark-raised p-4 rounded-lg border border-border-light-default dark:border-border-dark-default hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="primary" size="sm">
                        {relationType?.label || relation.relation_type}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {relation.target_ficha.tipo}
                      </Badge>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary mb-1">
                      {relation.target_ficha.titulo}
                    </h4>
                    
                    {relation.description && (
                      <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
                        {relation.description}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRelation(relation.id)}
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  >
                    Remover
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
