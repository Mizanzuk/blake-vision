"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { useUniverse } from "@/app/lib/contexts/UniverseContext";
import {
  Button,
  Card,
  Loading,
  Select,
} from "@/app/components/ui";
import { Header } from "@/app/components/layout/Header";
import { UniverseDropdown } from "@/app/components/ui/UniverseDropdown";
import { ConfirmationModal } from "@/app/components/ui/ConfirmationModal";
import { UniverseDeleteModal } from "@/app/components/ui/UniverseDeleteModal";
import { useConfirm } from "@/hooks/useConfirm";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import { EpisodesDropdown } from "@/app/components/ui/EpisodesDropdown";
import { EpisodeCreationModal } from "@/app/components/ui/EpisodeCreationModal";
import WorldModal from "@/app/components/projetos/WorldModal";
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
  const { confirm, ConfirmDialog } = useConfirm();
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Data
  const [universes, setUniverses] = useState<Universe[]>([]);
  const { selectedUniverseId, setSelectedUniverseId } = useUniverse();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Upload fields
  const [unitNumber, setUnitNumber] = useState<string>("");
  const [episodeTitle, setEpisodeTitle] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [existingEpisodes, setExistingEpisodes] = useState<string[]>([]);
  const [showNewEpisodeInput, setShowNewEpisodeInput] = useState(false);
  const [showNewEpisodeModal, setShowNewEpisodeModal] = useState(false);
  const [episodes, setEpisodes] = useState<any[]>([]);

  // Upload state
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extraction results
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [editingFichaIndex, setEditingFichaIndex] = useState<number | null>(null);
  const [editingFichaData, setEditingFichaData] = useState<ExtractedEntity | null>(null);
  const [showEditFichaModal, setShowEditFichaModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Modals
  const [showNewUniverseModal, setShowNewUniverseModal] = useState(false);
  const [newUniverseName, setNewUniverseName] = useState("");
  const [newUniverseDescription, setNewUniverseDescription] = useState("");
  const [isCreatingUniverse, setIsCreatingUniverse] = useState(false);

  const [showNewWorldModal, setShowNewWorldModal] = useState(false);
  const [worldToEdit, setWorldToEdit] = useState<any>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDangerous?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  
  // Fechar modais com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNewUniverseModal && !isCreatingUniverse) {
          setShowNewUniverseModal(false);
          setNewUniverseName('');
          setNewUniverseDescription('');
        } else if (showNewWorldModal) {
          setShowNewWorldModal(false);
          setWorldToEdit(null);
        } else if (showEditFichaModal) {
          setShowEditFichaModal(false);
          setEditingFichaIndex(null);
          setEditingFichaData(null);
        }
      }
    };
    
    if (showNewUniverseModal || showNewWorldModal || showEditFichaModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showNewUniverseModal, showNewWorldModal, showEditFichaModal, isCreatingUniverse]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    loadUniverses();
  }, []);

  // Universe changes are now handled by UniverseContext
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

  // Preencher dados vindos do Editor via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const textoParam = params.get("texto");
    const universeParam = params.get("universe_id");
    const worldParam = params.get("world_id");
    const episodioParam = params.get("episodio");
    const autoExtract = params.get("auto_extract");

    if (textoParam) {
      setText(textoParam);
    }
    if (universeParam) {
      setSelectedUniverseId(universeParam);
    }
    if (worldParam) {
      setSelectedWorldId(worldParam);
    }
    if (episodioParam) {
      setUnitNumber(episodioParam);
    }

    // Auto-extrair se solicitado
    if (autoExtract === "true" && textoParam) {
      setTimeout(() => {
        handleExtractFichas();
      }, 1000);
    }
  }, []);

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
        .from("episodes")
        .select("id, numero, titulo")
        .eq("world_id", worldId)
        .order("numero", { ascending: true });
      
      if (data) {
        setEpisodes(data);
        const episodeStrings = data.map(e => String(e.numero));
        setExistingEpisodes(episodeStrings);
      }
    } catch (err) {
      console.error("Erro ao carregar episódios:", err);
    }
  }

  function handleEditUniverse(universe: Universe) {
    // Implementar lógica de edição de Universo
    console.log("Editar universo:", universe);
  }

  async function handleDeleteUniverse(id: string, name: string) {
    const confirmed = await confirm({
      title: "Deletar Universo",
      message: `Tem certeza que deseja deletar o universo "${name}"? Esta ação não pode ser desfeita.`,
      confirmText: "Deletar",
      cancelText: "Cancelar",
      variant: "danger"
    });
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/universes?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUniverses(prev => prev.filter(u => u.id !== id));
        if (selectedUniverseId === id) {
          setSelectedUniverseId("");
          localStorage.removeItem("selectedUniverseId");
        }
        toast.success("Universo deletado com sucesso.");
      } else {
        toast.error("Erro ao deletar universo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar universo.");
    }
  }

  function handleUniverseChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "create_new_universe") {
      setShowNewUniverseModal(true);
    } else {
      setSelectedUniverseId(value);
      setSelectedWorldId("");
      setUnitNumber("");
    }
  }

  function handleWorldChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === "create_new") {
      setShowNewWorldModal(true);
      return;
    }
    setSelectedWorldId(value);
    setUnitNumber("");
    setEpisodeTitle("");
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
        setSelectedUniverseId(inserted.id);
        setShowNewUniverseModal(false);
        setNewUniverseName("");
        setNewUniverseDescription("");
        toast.success("Novo Universo criado com sucesso.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao criar Universo.");
    } finally {
      setIsCreatingUniverse(false);
    }
  }

  const handleSaveWorld = async (worldData: any) => {
    try {
      const method = worldData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/worlds', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(worldData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(worldData.id ? 'Mundo atualizado' : 'Mundo criado');
        // Recarregar mundos
        const worldsRes = await fetch('/api/worlds');
        const worldsData = await worldsRes.json();
        if (worldsRes.ok && worldsData.worlds) {
          setWorlds(worldsData.worlds);
        }
        if (!worldData.id) {
          setSelectedWorldId(data.world.id);
        }
        setShowNewWorldModal(false);
        setWorldToEdit(null);
      } else {
        toast.error(data.error || 'Erro ao salvar mundo');
      }
    } catch (error) {
      console.error('Error saving world:', error);
      toast.error('Erro de rede ao salvar mundo');
    }
  };

  const handleEditWorld = (world: any) => {
    setWorldToEdit(world);
    setShowNewWorldModal(true);
  };

  async function handleDeleteWorld(id: string) {
    const world = worlds.find(w => w.id === id);
    if (!world) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Deletar Mundo',
      message: `Tem certeza que deseja deletar "${world.nome}"? Esta ação não pode ser desfeita.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/worlds?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            toast.success('Mundo deletado');
            if (selectedWorldId === id) {
              setSelectedWorldId('');
            }
            // Recarregar mundos
            const worldsRes = await fetch('/api/worlds');
            const worldsData = await worldsRes.json();
            if (worldsRes.ok && worldsData.worlds) {
              setWorlds(worldsData.worlds);
            }
            setShowNewWorldModal(false);
            setWorldToEdit(null);
            setConfirmationModal(null);
          } else {
            const data = await response.json();
            toast.error(data.error || 'Erro ao deletar mundo');
            setConfirmationModal(null);
          }
        } catch (error) {
          console.error('Error deleting world:', error);
          toast.error('Erro de rede ao deletar mundo');
          setConfirmationModal(null);
        }
      },
    });
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
          documentName: episodeTitle.trim() || null,
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
          unitNumber: unitNumber.trim() || null,
          documentName: episodeTitle.trim() || null,
          text: text.trim() || null,
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
      setEpisodeTitle("");
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

  const handleEditFicha = (index: number) => {
    setEditingFichaIndex(index);
    setEditingFichaData({ ...extractedEntities[index] });
    setShowEditFichaModal(true);
  };

  const handleSaveEditFicha = () => {
    if (editingFichaIndex !== null && editingFichaData) {
      const updatedEntities = [...extractedEntities];
      updatedEntities[editingFichaIndex] = editingFichaData;
      setExtractedEntities(updatedEntities);
      setShowEditFichaModal(false);
      setEditingFichaIndex(null);
      setEditingFichaData(null);
    }
  };

  const handleEditFichaChange = (field: string, value: any) => {
    if (editingFichaData) {
      setEditingFichaData({
        ...editingFichaData,
        [field]: value
      });
    }
  }

  const handleRemoveFicha = (index: number) => {
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
      <Header showNav={true} currentPage="upload" />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
            Envie um roteiro (PDF, DOCX, TXT) ou cole o texto. Urizen analisará as informações e gerará fichas automaticamente.
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <div className="space-y-6">
            {/* Universo */}
            <UniverseDropdown
              label="UNIVERSO"
              universes={universes}
              selectedId={selectedUniverseId}
              onSelect={(id) => {
                setSelectedUniverseId(id);
                setSelectedUniverseId(id);
                setSelectedWorldId("");
                setUnitNumber("");
              }}
              onEdit={handleEditUniverse}
              onDelete={handleDeleteUniverse}
              onCreate={() => setShowNewUniverseModal(true)}
            />

            {/* Mundo */}
            {selectedUniverseId && (
              <WorldsDropdownSingle
                label="MUNDO DE DESTINO"
                worlds={worlds}
                selectedId={selectedWorldId}
                onSelect={(id) => {
                  setSelectedWorldId(id);
                }}
                onEdit={handleEditWorld}
                onDelete={handleDeleteWorld}
                onCreate={() => {
                  setWorldToEdit(null);
                  setShowNewWorldModal(true);
                }}
              />
            )}

            {/* Episódio */}
            {selectedWorldId && worldHasEpisodes && (
              <EpisodesDropdown
                label="EPISÓDIOS"
                episodes={existingEpisodes.filter(e => e) as string[]}
                selectedEpisodes={unitNumber ? [unitNumber] : []}
                onToggle={(episode) => {
                  setUnitNumber(episode);
                }}
                onCreate={() => {
                  setShowNewEpisodeModal(true);
                }}
              />
            )}


            {/* Título do Episódio */}
            {selectedWorldId && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-light-tertiary dark:text-dark-tertiary mb-2">
                  Título do Episódio
                </label>
                <input
                  type="text"
                  className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm"
                  value={episodeTitle}
                  readOnly
                  placeholder="Selecione um episódio para preencher automaticamente"
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
              <div className="flex flex-col gap-3 justify-center pt-4">
                <Button
                  variant="primary"
                  onClick={handleExtractFichas}
                  disabled={isExtracting || isParsingFile || !text.trim()}
                  fullWidth
                >
                  {isExtracting ? "Extraindo fichas..." : "Extrair fichas"}
                </Button>
                {isExtracting && (
                  <div className="w-full space-y-2">
                    <style>{`
                      @keyframes slideProgress {
                        0% { transform: translateX(-100%); }
                        50% { transform: translateX(100%); }
                        100% { transform: translateX(-100%); }
                      }
                      .progress-bar-animation {
                        animation: slideProgress 1.5s ease-in-out infinite;
                      }
                    `}</style>
                    <div className="w-full bg-border-light-default dark:bg-border-dark-default rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-light to-primary-dark progress-bar-animation" style={{ width: '30%' }}></div>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
                      Processando extração de fichas...
                    </p>
                  </div>
                )}
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditFicha(index)}
                          className="text-xs px-3 py-1.5 rounded-md border border-border-light-default text-text-light-secondary hover:bg-light-raised dark:border-border-dark-default dark:text-dark-secondary dark:hover:bg-dark-raised"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleRemoveFicha(index)}
                          className="text-xs px-3 py-1.5 rounded-md border border-error-light text-error-light hover:bg-error-light/10"
                        >
                          Remover
                        </button>
                      </div>
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

      {/* Modal Editar Ficha */}
      {showEditFichaModal && editingFichaData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setShowEditFichaModal(false);
            setEditingFichaIndex(null);
            setEditingFichaData(null);
          }}
        >
          <div
            className="bg-light-base dark:bg-dark-base rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-border-light-default dark:border-border-dark-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised sticky top-0">
              <h2 className="text-xl font-bold">Editar Ficha</h2>
              <button
                onClick={() => {
                  setShowEditFichaModal(false);
                  setEditingFichaIndex(null);
                  setEditingFichaData(null);
                }}
                className="text-2xl leading-none hover:opacity-70"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">Categoria</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full px-3 py-2 rounded-md border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary text-left flex justify-between items-center"
                    >
                      <span>
                        {categories.find(c => c.slug === editingFichaData.tipo)?.label || "Selecione uma categoria"}
                      </span>
                      <span className="text-xs">▼</span>
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-md shadow-lg z-50">
                        {categories.map((cat) => (
                          <button
                            key={cat.slug}
                            onClick={() => {
                              handleEditFichaChange("tipo", cat.slug);
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-light-hover dark:hover:bg-dark-hover ${
                              editingFichaData.tipo === cat.slug
                                ? "bg-brand-primary text-white"
                                : "text-text-light-primary dark:text-dark-primary"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">Titulo</label>
                <input
                  type="text"
                  value={editingFichaData.titulo || ""}
                  onChange={(e) => handleEditFichaChange("titulo", e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary"
                  placeholder="Titulo da ficha"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">Resumo</label>
                <textarea
                  value={editingFichaData.resumo || ""}
                  onChange={(e) => handleEditFichaChange("resumo", e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary min-h-[80px]"
                  placeholder="Breve resumo em 1-2 linhas..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">Conteudo</label>
                <textarea
                  value={editingFichaData.conteudo || ""}
                  onChange={(e) => handleEditFichaChange("conteudo", e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary min-h-[150px]"
                  placeholder="Conteudo completo da ficha..."
                />
              </div>

              {editingFichaData.tags && (
                <div>
                  <label className="block text-xs font-semibold mb-2">Tags</label>
                  <input
                    type="text"
                    value={editingFichaData.tags || ""}
                    onChange={(e) => handleEditFichaChange("tags", e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary"
                    placeholder="Tags separadas por virgula"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-6 border-t border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised sticky bottom-0">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditFichaModal(false);
                  setEditingFichaIndex(null);
                  setEditingFichaData(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEditFicha}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal de Criar Mundo */}
      {showNewWorldModal && (
        <WorldModal
          world={worldToEdit}
          universeId={selectedUniverseId}
          onClose={() => {
            setShowNewWorldModal(false);
            setWorldToEdit(null);
          }}
          onSave={handleSaveWorld}
          onDelete={handleDeleteWorld}
        />
      )}
      
      {/* Modal de Confirmação */}
      {confirmationModal && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          title={confirmationModal.title}
          message={confirmationModal.message}
          isDangerous={confirmationModal.isDangerous}
          onConfirm={confirmationModal.onConfirm}
          onCancel={() => setConfirmationModal(null)}
        />
      )}

      {/* Modal de Criar Episódio */}
      <EpisodeCreationModal
        isOpen={showNewEpisodeModal}
        onClose={() => setShowNewEpisodeModal(false)}
        onSave={async (numero, titulo) => {
          try {
            const response = await fetch("/api/episodes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                world_id: selectedWorldId,
                numero,
                titulo,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Erro ao criar episódio");
            }

            toast.success("Episódio criado com sucesso!");
            setUnitNumber(String(numero));
            setEpisodeTitle(titulo);
            await fetchExistingEpisodes(selectedWorldId);
          } catch (error: any) {
            toast.error(error.message || "Erro ao criar episódio");
            throw error;
          }
        }}
        worldId={selectedWorldId}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}
