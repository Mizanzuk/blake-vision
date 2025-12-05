"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Header } from "@/app/components/layout/Header";
import { Button, Card, Badge, EmptyState, Loading } from "@/app/components/ui";
import { UniverseDropdown } from "@/app/components/ui";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import { EpisodesDropdownSingle } from "@/app/components/ui/EpisodesDropdownSingle";
import { CategoryDropdownSingle } from "@/app/components/ui/CategoryDropdownSingle";
import { NewEpisodeModal } from "@/app/components/modals/NewEpisodeModal";
import { toast } from "sonner";
import clsx from "clsx";

interface Texto {
  id: string;
  titulo: string;
  conteudo: string;
  universe_id: string | null;
  world_id: string | null;
  episodio: string | null;
  categoria: string | null;
  status: "rascunho" | "publicado";
  extraido: boolean;
  created_at: string;
  updated_at: string;
}

interface Universe {
  id: string;
  nome: string;
  slug: string;
}

interface World {
  id: string;
  nome: string;
  slug: string;
  universe_id: string;
}

interface Category {
  slug: string;
  label: string;
  description?: string;
  prefix?: string;
}

export default function EscritaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();
  
  // Estados de autenticação e loading
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados da Biblioteca (Sidebar)
  const [activeTab, setActiveTab] = useState<"rascunhos" | "publicados">("rascunhos");
  const [rascunhos, setRascunhos] = useState<Texto[]>([]);
  const [publicados, setPublicados] = useState<Texto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUniverseId, setFilterUniverseId] = useState<string>("");
  const [filterWorldId, setFilterWorldId] = useState<string>("");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");
  
  // Estados do Editor
  const [currentTextoId, setCurrentTextoId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [universeId, setUniverseId] = useState<string>("");
  const [worldId, setWorldId] = useState<string>("");
  const [episodio, setEpisodio] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [status, setStatus] = useState<"rascunho" | "publicado">("rascunho");
  
  // Estados de dados
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [availableEpisodes, setAvailableEpisodes] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allFichas, setAllFichas] = useState<any[]>([]);
  
  // Estados de modais
  const [showNewEpisodeModal, setShowNewEpisodeModal] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carregar dados iniciais
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadTextos();
      loadUniversesAndWorlds();
    }
  }, [isLoading]);

  // Carregar texto específico da URL
  useEffect(() => {
    const textoId = searchParams.get("id");
    if (textoId && !isLoading) {
      loadTexto(textoId);
    }
  }, [searchParams, isLoading]);

  // Carregar fichas quando universo muda
  useEffect(() => {
    if (universeId) {
      fetch(`/api/catalog?universeId=${universeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.fichas) {
            setAllFichas(data.fichas);
          }
        })
        .catch(error => console.error("Erro ao carregar fichas:", error));
      
      // Carregar categorias
      fetch(`/api/categories?universeId=${universeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.categories) {
            setCategories(data.categories);
          }
        })
        .catch(error => console.error("Erro ao carregar categorias:", error));
    }
  }, [universeId]);

  // Atualizar episódios disponíveis quando mundo muda
  useEffect(() => {
    if (worldId && allFichas.length > 0) {
      const worldFichas = allFichas.filter(f => f.world_id === worldId);
      const episodes = Array.from(
        new Set(
          worldFichas
            .map(f => f.episodio)
            .filter((ep): ep is string => ep !== null && ep !== undefined)
        )
      ).sort();
      setAvailableEpisodes(episodes);
    } else {
      setAvailableEpisodes([]);
    }
  }, [worldId, allFichas]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTextos() {
    try {
      // Carregar rascunhos
      const responseRascunhos = await fetch("/api/textos?status=rascunho");
      const dataRascunhos = await responseRascunhos.json();
      if (responseRascunhos.ok) {
        setRascunhos(dataRascunhos.textos || []);
      }

      // Carregar publicados
      const responsePublicados = await fetch("/api/textos?status=publicado");
      const dataPublicados = await responsePublicados.json();
      if (responsePublicados.ok) {
        setPublicados(dataPublicados.textos || []);
      }
    } catch (error) {
      console.error("Erro ao carregar textos:", error);
      toast.error("Erro ao carregar textos");
    }
  }

  async function loadUniversesAndWorlds() {
    try {
      const response = await fetch("/api/universes");
      const data = await response.json();
      
      if (response.ok && data.universes) {
        setUniverses(data.universes);
        
        // Carregar mundos de todos os universos
        const allWorlds: World[] = [];
        for (const universe of data.universes) {
          const worldsResponse = await fetch(`/api/worlds?universeId=${universe.id}`);
          const worldsData = await worldsResponse.json();
          if (worldsResponse.ok && worldsData.worlds) {
            allWorlds.push(...worldsData.worlds);
          }
        }
        setWorlds(allWorlds);
      }
    } catch (error) {
      console.error("Erro ao carregar universos e mundos:", error);
    }
  }

  async function loadTexto(id: string) {
    try {
      const response = await fetch(`/api/textos?id=${id}`);
      const data = await response.json();
      
      if (response.ok && data.texto) {
        const texto = data.texto;
        setCurrentTextoId(texto.id);
        setTitulo(texto.titulo || "");
        setConteudo(texto.conteudo || "");
        setUniverseId(texto.universe_id || "");
        setWorldId(texto.world_id || "");
        setEpisodio(texto.episodio || "");
        setCategoria(texto.categoria || "");
        setStatus(texto.status || "rascunho");
      }
    } catch (error) {
      console.error("Erro ao carregar texto:", error);
      toast.error("Erro ao carregar texto");
    }
  }

  function handleSelectTexto(texto: Texto) {
    setCurrentTextoId(texto.id);
    setTitulo(texto.titulo || "");
    setConteudo(texto.conteudo || "");
    setUniverseId(texto.universe_id || "");
    setWorldId(texto.world_id || "");
    setEpisodio(texto.episodio || "");
    setCategoria(texto.categoria || "");
    setStatus(texto.status || "rascunho");
    
    // Atualizar URL
    router.push(`/escrita?id=${texto.id}`);
  }

  function handleNewTexto() {
    setCurrentTextoId(null);
    setTitulo("");
    setConteudo("");
    setUniverseId("");
    setWorldId("");
    setEpisodio("");
    setCategoria("");
    setStatus("rascunho");
    
    // Limpar URL
    router.push("/escrita");
  }

  async function handleSave() {
    if (!titulo.trim()) {
      toast.error("Por favor, adicione um título");
      return;
    }

    setIsSaving(true);

    try {
      const body = {
        titulo,
        conteudo,
        universe_id: universeId || null,
        world_id: worldId || null,
        episodio: episodio || null,
        categoria: categoria || null,
        status,
      };

      let response;
      if (currentTextoId) {
        // Atualizar texto existente
        response = await fetch(`/api/textos?id=${currentTextoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        // Criar novo texto
        response = await fetch("/api/textos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const data = await response.json();

      if (response.ok) {
        toast.success(currentTextoId ? "Texto atualizado!" : "Texto criado!");
        
        // Se é novo texto, atualizar ID
        if (!currentTextoId && data.texto) {
          setCurrentTextoId(data.texto.id);
          router.push(`/escrita?id=${data.texto.id}`);
        }
        
        // Recarregar lista
        loadTextos();
      } else {
        toast.error(data.error || "Erro ao salvar texto");
      }
    } catch (error) {
      console.error("Erro ao salvar texto:", error);
      toast.error("Erro ao salvar texto");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    setStatus("publicado");
    
    // Aguardar atualização do estado e salvar
    setTimeout(() => {
      handleSave();
    }, 100);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja deletar este texto?")) {
      return;
    }

    try {
      const response = await fetch(`/api/textos?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Texto deletado com sucesso");
        
        // Se é o texto atual, limpar editor
        if (id === currentTextoId) {
          handleNewTexto();
        }
        
        loadTextos();
      } else {
        toast.error("Erro ao deletar texto");
      }
    } catch (error) {
      console.error("Erro ao deletar texto:", error);
      toast.error("Erro ao deletar texto");
    }
  }

  function handleCreateNewEpisode(episodeNumber: string) {
    if (!episodeNumber.trim()) return;
    
    // Adicionar à lista se não existir
    if (!availableEpisodes.includes(episodeNumber)) {
      setAvailableEpisodes([...availableEpisodes, episodeNumber].sort());
    }
    
    // Selecionar automaticamente
    setEpisodio(episodeNumber);
    toast.success(`Episódio "${episodeNumber}" criado!`);
  }

  // Funções auxiliares para badges de categoria
  function getCategoryColor(categoria: string | null): string {
    if (!categoria) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    
    const slug = categoria.toLowerCase();
    
    switch (slug) {
      case "personagem":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "local":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "evento":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "conceito":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "regra":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "roteiro":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
      case "episodio":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  }

  function getCategoryLabel(categoria: string | null): string {
    if (!categoria) return "";
    
    const cat = categories.find(c => c.slug === categoria);
    return cat?.label || categoria;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  // Filtrar textos
  const textos = activeTab === "rascunhos" ? rascunhos : publicados;
  const filteredTextos = textos.filter(texto => {
    // Filtro de busca
    if (searchQuery && !texto.titulo.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtro de universo
    if (filterUniverseId && texto.universe_id !== filterUniverseId) {
      return false;
    }
    
    // Filtro de mundo
    if (filterWorldId && texto.world_id !== filterWorldId) {
      return false;
    }
    
    // Filtro de categoria
    if (filterCategoria !== "todas" && texto.categoria !== filterCategoria) {
      return false;
    }
    
    return true;
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      <Header currentPage="escrita" />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Lista de Textos */}
        <aside className="w-80 border-r border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised overflow-y-auto">
          {/* Header da Sidebar */}
          <div className="p-4 border-b border-border-light-default dark:border-border-dark-default">
            <Button
              onClick={handleNewTexto}
              className="w-full"
              variant="primary"
            >
              + Novo Texto
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border-light-default dark:border-border-dark-default">
            <button
              onClick={() => setActiveTab("rascunhos")}
              className={clsx(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "rascunhos"
                  ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                  : "text-text-light-tertiary dark:text-dark-tertiary hover:text-text-light-primary dark:hover:text-dark-primary"
              )}
            >
              Rascunhos ({rascunhos.length})
            </button>
            <button
              onClick={() => setActiveTab("publicados")}
              className={clsx(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "publicados"
                  ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                  : "text-text-light-tertiary dark:text-dark-tertiary hover:text-text-light-primary dark:hover:text-dark-primary"
              )}
            >
              Publicados ({publicados.length})
            </button>
          </div>

          {/* Filtros */}
          <div className="p-4 space-y-3 border-b border-border-light-default dark:border-border-dark-default">
            {/* Busca */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar textos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-9 text-sm rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-text-light-tertiary dark:text-dark-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filtro de Categoria */}
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="todas">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Lista de Textos */}
          <div className="p-2">
            {filteredTextos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                  {searchQuery || filterCategoria !== "todas"
                    ? "Nenhum texto encontrado"
                    : activeTab === "rascunhos"
                    ? "Nenhum rascunho ainda"
                    : "Nenhum texto publicado"}
                </p>
              </div>
            ) : (
              filteredTextos.map(texto => (
                <div
                  key={texto.id}
                  onClick={() => handleSelectTexto(texto)}
                  className={clsx(
                    "p-3 mb-2 rounded-lg cursor-pointer transition-colors",
                    currentTextoId === texto.id
                      ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                      : "hover:bg-light-overlay dark:hover:bg-dark-overlay"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-medium text-text-light-primary dark:text-dark-primary line-clamp-2 flex-1">
                      {texto.titulo || "Sem título"}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(texto.id);
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {texto.categoria && (
                    <div className="mb-2">
                      <span className={clsx(
                        "inline-block px-2 py-0.5 text-xs font-medium rounded",
                        getCategoryColor(texto.categoria)
                      )}>
                        {getCategoryLabel(texto.categoria)}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-xs text-text-light-tertiary dark:text-dark-tertiary">
                    Atualizado em {formatDate(texto.updated_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Editor Principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <div className="space-y-6">
              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-1.5">
                  TÍTULO
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Digite o título do texto..."
                  className="w-full px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Metadados */}
              <div className="grid grid-cols-4 gap-4">
                <UniverseDropdown
                  label="UNIVERSO"
                  universes={universes}
                  selectedId={universeId}
                  onSelect={(id) => {
                    setUniverseId(id);
                    setWorldId("");
                  }}
                  onCreate={() => {
                    console.log("Criar novo universo");
                  }}
                />

                <WorldsDropdownSingle
                  label="MUNDO"
                  worlds={worlds.filter(w => w.universe_id === universeId)}
                  selectedId={worldId}
                  onSelect={(id) => setWorldId(id)}
                  disabled={!universeId}
                  onCreate={() => {
                    console.log("Criar novo mundo");
                  }}
                />

                <EpisodesDropdownSingle
                  label="EPISÓDIO"
                  episodes={availableEpisodes}
                  selectedEpisode={episodio}
                  onSelect={setEpisodio}
                  onCreate={() => setShowNewEpisodeModal(true)}
                  disabled={!worldId}
                />

                <CategoryDropdownSingle
                  label="CATEGORIA"
                  categories={categories}
                  selectedCategory={categoria}
                  onSelect={setCategoria}
                  worldId={worldId}
                  disabled={!universeId}
                />
              </div>

              {/* Conteúdo */}
              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-1.5">
                  CONTEÚDO
                </label>
                <textarea
                  ref={textareaRef}
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Escreva seu texto aqui..."
                  className="w-full h-[calc(100vh-32rem)] px-4 py-3 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono text-sm leading-relaxed"
                />
              </div>

              {/* Ações */}
              <div className="flex justify-between items-center pt-4 border-t border-border-light-default dark:border-border-dark-default">
                <Button
                  onClick={handleNewTexto}
                  variant="secondary"
                >
                  Voltar
                </Button>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !titulo.trim()}
                    variant="secondary"
                  >
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>

                  <Button
                    onClick={handlePublish}
                    disabled={isSaving || !titulo.trim()}
                    variant="primary"
                  >
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Novo Episódio */}
      <NewEpisodeModal
        isOpen={showNewEpisodeModal}
        onClose={() => setShowNewEpisodeModal(false)}
        onCreate={handleCreateNewEpisode}
      />
    </div>
  );
}
