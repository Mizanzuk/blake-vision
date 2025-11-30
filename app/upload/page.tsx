"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import {
  Button,
  Card,
  Loading,
} from "@/app/components/ui";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { toast } from "sonner";
import type { Universe, World } from "@/app/types";

type ExtractedEntity = {
  tipo: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  ano_diegese?: number;
  tags?: string;
};

type Category = {
  slug: string;
  label: string;
};

export default function UploadPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Data
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  const [worlds, setWorlds] = useState<World[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Upload fields
  const [unitNumber, setUnitNumber] = useState<string>("");
  const [documentName, setDocumentName] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [existingEpisodes, setExistingEpisodes] = useState<string[]>([]);
  const [showNewEpisodeInput, setShowNewEpisodeInput] = useState(false);

  // Upload state
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extraction results
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);

  // Modals
  const [showNewUniverseModal, setShowNewUniverseModal] = useState(false);
  const [newUniverseName, setNewUniverseName] = useState("");
  const [newUniverseDescription, setNewUniverseDescription] = useState("");
  const [isCreatingUniverse, setIsCreatingUniverse] = useState(false);

  const [showNewWorldModal, setShowNewWorldModal] = useState(false);
  const [newWorldName, setNewWorldName] = useState("");
  const [newWorldDescription, setNewWorldDescription] = useState("");
  const [newWorldHasEpisodes, setNewWorldHasEpisodes] = useState(true);
  const [isCreatingWorld, setIsCreatingWorld] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      loadUniverses();
      
      const saved = localStorage.getItem("selectedUniverseId");
      if (saved) {
        setSelectedUniverseId(saved);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (selectedUniverseId) {
      loadCatalogData();
    }
  }, [selectedUniverseId]);

  useEffect(() => {
    if (selectedWorldId) {
      fetchExistingEpisodes(selectedWorldId);
    }
  }, [selectedWorldId]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUniverses() {
    try {
      const response = await fetch("/api/universes");
      const data = await response.json();
      
      if (response.ok) {
        setUniverses(data.universes || []);
      }
    } catch (error) {
      console.error("Error loading universes:", error);
    }
  }

  async function loadCatalogData() {
    try {
      const response = await fetch(`/api/catalog?universeId=${selectedUniverseId}`);
      const data = await response.json();
      
      if (response.ok) {
        setWorlds(data.worlds || []);
        setCategories(data.types || []);
        // Inicializar com todas as categorias selecionadas
        setSelectedCategories((data.types || []).map((c: Category) => c.slug));
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error loading catalog:", error);
      toast.error(t.errors.network);
    }
  }

  async function fetchExistingEpisodes(worldId: string) {
    try {
      const { data } = await supabase
        .from("fichas")
        .select("episodio")
        .eq("world_id", worldId)
        .not("episodio", "is", null)
        .order("episodio", { ascending: true });
      
      if (data) {
        const episodes = Array.from(new Set(data.map(f => f.episodio).filter(Boolean)));
        setExistingEpisodes(episodes);
      }
    } catch (err) {
      console.error("Erro ao carregar episódios:", err);
    }
  }

  function handleUniverseChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "create_new_universe") {
      setShowNewUniverseModal(true);
      return;
    }
    setSelectedUniverseId(value);
    localStorage.setItem("selectedUniverseId", value);
    setSelectedWorldId("");
    setUnitNumber("");
  }

  function handleWorldChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "create_new") {
      setShowNewWorldModal(true);
      return;
    }
    setSelectedWorldId(value);
    setUnitNumber("");
    setShowNewEpisodeInput(false);
  }

  function handleEpisodeChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "new_episode") {
      setShowNewEpisodeInput(true);
      setUnitNumber("");
    } else {
      setShowNewEpisodeInput(false);
      setUnitNumber(value);
    }
  }

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsParsingFile(true);
    if (!documentName) setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao ler arquivo");
      }
      
      const data = await res.json();
      if (data.text) {
        setText(data.text);
        toast.success("Arquivo lido com sucesso!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao processar arquivo.");
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleCreateUniverse() {
    if (!newUniverseName.trim()) {
      toast.error("Dê um nome ao novo Universo.");
      return;
    }
    if (!userId) {
      toast.error("Usuário não autenticado.");
      return;
    }
    
    setIsCreatingUniverse(true);
    
    try {
      const { data: inserted, error: insertError } = await supabase
        .from("universes")
        .insert({
          nome: newUniverseName.trim(),
          descricao: newUniverseDescription.trim() || null
        })
        .select("*")
        .single();
      
      if (insertError) throw insertError;
      
      if (inserted) {
        setUniverses(prev => [...prev, inserted as Universe]);
        setSelectedUniverseId(inserted.id);
        localStorage.setItem("selectedUniverseId", inserted.id);
        setShowNewUniverseModal(false);
        setNewUniverseName("");
        setNewUniverseDescription("");
        toast.success("Novo Universo criado com sucesso.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar Universo.");
    } finally {
      setIsCreatingUniverse(false);
    }
  }

  async function handleCreateWorld() {
    if (!newWorldName.trim()) {
      toast.error("Dê um nome ao novo Mundo.");
      return;
    }
    if (!selectedUniverseId) {
      toast.error("Selecione um Universo primeiro.");
      return;
    }
    
    setIsCreatingWorld(true);
    
    try {
      const baseId = newWorldName.trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const newId = `${baseId}_${Date.now().toString().slice(-4)}`;
      
      const payload: any = {
        id: newId,
        nome: newWorldName.trim(),
        descricao: newWorldDescription.trim() || null,
        has_episodes: newWorldHasEpisodes,
        tipo: "mundo_ficcional",
        universe_id: selectedUniverseId
      };
      
      const { data, error } = await supabase
        .from("worlds")
        .insert([payload])
        .select("*");
      
      if (error) {
        console.error(error);
        toast.error("Erro ao criar novo Mundo.");
        return;
      }
      
      const inserted = (data?.[0] || null) as World | null;
      if (inserted) {
        loadCatalogData();
        setSelectedWorldId(inserted.id);
        setShowNewWorldModal(false);
        setNewWorldName("");
        setNewWorldDescription("");
        setNewWorldHasEpisodes(true);
        toast.success("Novo Mundo criado com sucesso.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao criar Mundo.");
    } finally {
      setIsCreatingWorld(false);
    }
  }

  async function handleExtractFichas() {
    if (!userId) {
      toast.error("Usuário não autenticado.");
      return;
    }
    if (!selectedUniverseId) {
      toast.error("Selecione um Universo antes de extrair fichas.");
      return;
    }
    if (!selectedWorldId) {
      toast.error("Selecione um Mundo antes de extrair fichas.");
      return;
    }
    
    const world = worlds.find(w => w.id === selectedWorldId);
    const worldHasEpisodes = world?.has_episodes !== false;
    
    if (worldHasEpisodes && !unitNumber.trim()) {
      toast.error("Informe o número do episódio/capítulo.");
      return;
    }
    if (!text.trim()) {
      toast.error("Cole um texto ou faça upload de um arquivo para extrair fichas.");
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error("Selecione pelo menos uma categoria para extrair.");
      return;
    }
    
    setIsExtracting(true);
    
    try {
      const response = await fetch("/api/lore/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          worldId: selectedWorldId,
          worldName: world?.nome || "Mundo Desconhecido",
          documentName: documentName.trim() || null,
          unitNumber,
          universeId: selectedUniverseId,
          categories: selectedCategories
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro na extração");
      }
      
      const data = await response.json();
      
      if (data.entities && data.entities.length > 0) {
        setExtractedEntities(data.entities);
        toast.success(`${data.entities.length} fichas extraídas com sucesso!`);
      } else {
        toast.warning("Nenhuma ficha foi extraída.");
      }
    } catch (err: any) {
      console.error("Erro de extração:", err);
      toast.error(err.message || "Erro ao processar extração.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSaveFichas() {
    if (extractedEntities.length === 0) {
      toast.error("Nenhuma ficha para salvar.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/lore/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fichas: extractedEntities,
          worldId: selectedWorldId,
          universeId: selectedUniverseId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar fichas");
      }
      
      const data = await response.json();
      toast.success(`${data.count || extractedEntities.length} fichas salvas com sucesso!`);
      
      // Limpar formulário
      setExtractedEntities([]);
      setText("");
      setDocumentName("");
      setUnitNumber("");
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error(err.message || "Erro ao salvar fichas.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleCategory(slug: string) {
    setSelectedCategories(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    );
  }

  function toggleAllCategories() {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.slug));
    }
  }

  function handleRemoveFicha(index: number) {
    setExtractedEntities(prev => prev.filter((_, i) => i !== index));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-base dark:bg-dark-base">
        <Loading size="lg" />
      </div>
    );
  }

  const selectedWorld = worlds.find(w => w.id === selectedWorldId);
  const worldHasEpisodes = selectedWorld?.has_episodes !== false;

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Upload de Arquivo ou Texto</h1>
            <p className="text-sm text-text-light-secondary dark:text-dark-secondary mt-1">
              Envie um roteiro (PDF, DOCX, TXT) ou cole o texto. A Lore Machine extrairá fichas automaticamente.
            </p>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>

        <Card variant="elevated" padding="lg">
          <div className="space-y-6">
            {/* Universo */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-light-tertiary dark:text-dark-tertiary mb-2">
                Universo
              </label>
              <select
                className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm"
                value={selectedUniverseId}
                onChange={handleUniverseChange}
              >
                <option value="">Selecione um universo</option>
                {universes.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
                <option value="create_new_universe">+ Novo Universo</option>
              </select>
            </div>

            {/* Mundo */}
            {selectedUniverseId && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-light-tertiary dark:text-dark-tertiary mb-2">
                  Mundo de Destino
                </label>
                <select
                  className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm"
                  value={selectedWorldId}
                  onChange={handleWorldChange}
                >
                  <option value="">Selecione um mundo</option>
                  {worlds.map(w => (
                    <option key={w.id} value={w.id}>{w.nome}</option>
                  ))}
                  <option value="create_new">+ Novo Mundo</option>
                </select>
              </div>
            )}

            {/* Episódio */}
            {selectedWorldId && worldHasEpisodes && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-light-tertiary dark:text-dark-tertiary mb-2">
                  Episódio / Capítulo #
                </label>
                {showNewEpisodeInput ? (
                  <input
                    type="text"
                    className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="Ex: 01, 02, 03..."
                  />
                ) : (
                  <select
                    className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm"
                    value={unitNumber}
                    onChange={handleEpisodeChange}
                  >
                    <option value="">Selecione ou crie novo</option>
                    {existingEpisodes.map(ep => (
                      <option key={ep} value={ep}>{ep}</option>
                    ))}
                    <option value="new_episode">+ Novo Episódio</option>
                  </select>
                )}
              </div>
            )}

            {/* Nome do Documento */}
            {selectedWorldId && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-light-tertiary dark:text-dark-tertiary mb-2">
                  Nome do Documento (Opcional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Ex.: Episódio 6 — A Geladeira"
                />
              </div>
            )}

            {/* Upload de Arquivo */}
            {selectedWorldId && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-light-tertiary dark:text-dark-tertiary mb-2">
                  Arquivo
                </label>
                <div className="border-2 border-dashed border-border-light-default dark:border-border-dark-default rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <span className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-transparent border border-border-light-default dark:border-border-dark-default hover:bg-light-raised dark:hover:bg-dark-raised transition-colors">
                      {isParsingFile ? "Processando..." : "Escolher Arquivo (PDF, DOCX, TXT)"}
                    </span>
                  </label>
                  <p className="text-xs text-text-light-tertiary dark:text-dark-tertiary mt-2">
                    Ou arraste um arquivo aqui
                  </p>
                </div>
              </div>
            )}

            {/* Texto do Episódio */}
            {selectedWorldId && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-light-tertiary dark:text-dark-tertiary mb-2">
                  Texto do Episódio / Capítulo
                </label>
                <textarea
                  className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm min-h-[200px] font-mono"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="O texto do arquivo aparecerá aqui, ou você pode colar manualmente..."
                />
              </div>
            )}

            {/* Categorias para Extrair */}
            {selectedWorldId && categories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-text-light-tertiary dark:text-dark-tertiary">
                    Categorias para Extrair
                  </label>
                  <button
                    onClick={toggleAllCategories}
                    className="text-xs text-primary-light dark:text-primary-dark hover:underline"
                  >
                    {selectedCategories.length === categories.length ? "Desmarcar Todos" : "Marcar Todos"}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(cat => (
                    <label
                      key={cat.slug}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.slug)}
                        onChange={() => toggleCategory(cat.slug)}
                        className="w-4 h-4 rounded border-border-light-default dark:border-border-dark-default"
                      />
                      <span className="text-sm">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Botão Extrair */}
            {selectedWorldId && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="primary"
                  onClick={handleExtractFichas}
                  disabled={isExtracting || isParsingFile || !text.trim()}
                  fullWidth
                >
                  {isExtracting ? "Extraindo fichas..." : "Extrair fichas"}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Fichas Sugeridas */}
        {extractedEntities.length > 0 && (
          <Card variant="default" padding="lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Fichas Sugeridas ({extractedEntities.length})
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExtractedEntities([])}
                >
                  Limpar todas
                </Button>
              </div>

              <div className="space-y-3">
                {extractedEntities.map((ficha, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-base">
                          {ficha.titulo || "(sem título)"}
                        </div>
                        <div className="text-xs uppercase tracking-wide text-text-light-tertiary dark:text-dark-tertiary mt-1">
                          {ficha.tipo || "conceito"}
                        </div>
                        {ficha.resumo && (
                          <p className="text-sm text-text-light-secondary dark:text-dark-secondary mt-2 line-clamp-2">
                            {ficha.resumo}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFicha(index)}
                        className="text-xs px-3 py-1.5 rounded-md border border-error-light text-error-light hover:bg-error-light/10"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="primary"
                  onClick={handleSaveFichas}
                  disabled={isSaving}
                  fullWidth
                >
                  {isSaving ? "Salvando fichas..." : "CONFIRMAR E SALVAR FICHAS"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modal Novo Universo */}
      {showNewUniverseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowNewUniverseModal(false)}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              handleCreateUniverse();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border border-border-light-default dark:border-border-dark-default rounded-lg p-6 bg-light-base dark:bg-dark-base space-y-4 mx-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Novo Universo</h3>
              <button
                type="button"
                onClick={() => setShowNewUniverseModal(false)}
                className="text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Nome do Universo</label>
              <input
                className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm"
                value={newUniverseName}
                onChange={(e) => setNewUniverseName(e.target.value)}
                placeholder="Ex: Antiverso"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Descrição</label>
              <textarea
                className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm min-h-[100px]"
                value={newUniverseDescription}
                onChange={(e) => setNewUniverseDescription(e.target.value)}
                placeholder="Resumo do Universo…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowNewUniverseModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreatingUniverse}
              >
                {isCreatingUniverse ? "Criando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Novo Mundo */}
      {showNewWorldModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowNewWorldModal(false)}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              handleCreateWorld();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-auto border border-border-light-default dark:border-border-dark-default rounded-lg p-6 bg-light-base dark:bg-dark-base space-y-4 mx-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Novo Mundo</h3>
              <button
                type="button"
                onClick={() => setShowNewWorldModal(false)}
                className="text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Nome</label>
              <input
                className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm"
                value={newWorldName}
                onChange={(e) => setNewWorldName(e.target.value)}
                placeholder="Ex: Arquivos Vermelhos"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Descrição</label>
              <textarea
                className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm min-h-[140px]"
                value={newWorldDescription}
                onChange={(e) => setNewWorldDescription(e.target.value)}
                placeholder="Resumo do Mundo…"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has-episodes"
                checked={newWorldHasEpisodes}
                onChange={(e) => setNewWorldHasEpisodes(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="has-episodes" className="text-sm">
                Este mundo possui episódios
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowNewWorldModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreatingWorld}
              >
                {isCreatingWorld ? "Criando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
