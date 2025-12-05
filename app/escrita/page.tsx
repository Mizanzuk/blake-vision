"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Header } from "@/app/components/layout/Header";
import { Button, Card, Badge, EmptyState, Loading } from "@/app/components/ui";
import { UniverseDropdown } from "@/app/components/ui";
import { WorldsDropdownSingle } from "@/app/components/ui/WorldsDropdownSingle";
import { EpisodesDropdownSingle } from "@/app/components/ui/EpisodesDropdownSingle";
import { CategoryDropdownSingle } from "@/app/components/ui/CategoryDropdownSingle";
import { TypesDropdown } from "@/app/components/ui/TypesDropdown";
import { NewEpisodeModal } from "@/app/components/modals/NewEpisodeModal";
import { toast } from "sonner";
import type { Universe, World, Category } from "@/app/types";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

function EscritaPageContent() {
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
  const [filterCategorias, setFilterCategorias] = useState<string[]>([]);
  
  // Estados do Editor
  const [currentTextoId, setCurrentTextoId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [universeId, setUniverseId] = useState<string>("");
  const [worldId, setWorldId] = useState<string>("");
  const [episodio, setEpisodio] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [status, setStatus] = useState<"rascunho" | "publicado">("rascunho");
  const [isMetadataLocked, setIsMetadataLocked] = useState(false);
  const [isMetadataSaved, setIsMetadataSaved] = useState(false); // Controla se metadados foram salvos
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true); // Controla expansão do cabeçalho
  const [hasUnsavedMetadataChanges, setHasUnsavedMetadataChanges] = useState(false); // Controla se há alterações não salvas
  const [savedMetadataSnapshot, setSavedMetadataSnapshot] = useState<any>(null); // Snapshot dos metadados salvos
  
  // Detectar alterações nos metadados
  useEffect(() => {
    if (!isMetadataLocked && savedMetadataSnapshot) {
      const hasChanges = 
        titulo !== savedMetadataSnapshot.titulo ||
        universeId !== savedMetadataSnapshot.universeId ||
        worldId !== savedMetadataSnapshot.worldId ||
        episodio !== savedMetadataSnapshot.episodio ||
        categoria !== savedMetadataSnapshot.categoria;
      
      setHasUnsavedMetadataChanges(hasChanges);
    }
  }, [titulo, universeId, worldId, episodio, categoria, isMetadataLocked, savedMetadataSnapshot]);
  
  // Estados de dados
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [availableEpisodes, setAvailableEpisodes] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allFichas, setAllFichas] = useState<any[]>([]);
  
  // Categorias únicas dos textos (para filtro)
  const textoCategorias = React.useMemo(() => {
    const allTextos = [...rascunhos, ...publicados];
    const uniqueCategories = new Set(allTextos.map(t => t.categoria).filter(Boolean));
    const categoriasList = Array.from(uniqueCategories).map(slug => ({
      slug: slug!,
      label: getCategoryLabel(slug!),
      universe_id: "",
      user_id: "",
      created_at: ""
    }));
    
    // Adicionar "Texto Livre" se houver textos sem categoria
    const hasTextoLivre = allTextos.some(t => !t.categoria);
    if (hasTextoLivre) {
      categoriasList.push({
        slug: "texto-livre",
        label: "Texto Livre",
        universe_id: "",
        user_id: "",
        created_at: ""
      });
    }
    
    return categoriasList;
  }, [rascunhos, publicados, categories]);

  // Estados de modais
  const [showNewEpisodeModal, setShowNewEpisodeModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  
  // Estado da sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Estados do chat com assistentes
  const [showUrthona, setShowUrthona] = useState(false);
  const [showUrizen, setShowUrizen] = useState(false);
  const [urthonaMessages, setUrthonaMessages] = useState<any[]>([]);
  const [urizenMessages, setUrizenMessages] = useState<any[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  // Estados para drag and drop
  const [draggedTextoId, setDraggedTextoId] = useState<string | null>(null);
  const [dragOverTextoId, setDragOverTextoId] = useState<string | null>(null);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    // Bloquear metadados ao carregar texto existente salvo
    setIsMetadataLocked(true);
    setIsMetadataSaved(true);
    setIsHeaderExpanded(false); // Começar colapsado para textos existentes
    
    // Atualizar URL
    router.push(`/escrita?id=${texto.id}`);
  }

  // Função para salvar apenas metadados (primeiro save)
  async function handleSaveMetadata() {
    if (!titulo.trim()) {
      toast.error("Por favor, adicione um título");
      return;
    }
    
    if (!universeId) {
      toast.error("Por favor, selecione um universo");
      return;
    }

    setIsSaving(true);

    try {
      const body = {
        titulo,
        conteudo: "", // Conteúdo vazio no primeiro save
        universe_id: universeId,
        world_id: worldId || null,
        episodio: episodio || null,
        categoria: categoria || null,
        status: "rascunho",
      };

      const response = await fetch("/api/textos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Metadados salvos! Agora você pode escrever.");
        
        // Atualizar ID do texto
        if (data.texto) {
          setCurrentTextoId(data.texto.id);
          router.push(`/escrita?id=${data.texto.id}`);
        }
        
        // Marcar metadados como salvos e bloquear
        setIsMetadataSaved(true);
        setIsMetadataLocked(true);
        setIsHeaderExpanded(false); // Colapsar cabeçalho
        
        // Salvar snapshot dos metadados e resetar flag de alterações
        setSavedMetadataSnapshot({ titulo, universeId, worldId, episodio, categoria });
        setHasUnsavedMetadataChanges(false);
        
        // Recarregar lista
        loadTextos();
      } else {
        toast.error(data.error || "Erro ao salvar metadados");
      }
    } catch (error) {
      console.error("Erro ao salvar metadados:", error);
      toast.error("Erro ao salvar metadados");
    } finally {
      setIsSaving(false);
    }
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
    
    // Resetar estados de controle
    setIsMetadataLocked(false);
    setIsMetadataSaved(false);
    setIsHeaderExpanded(true);
    
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
        
        // Bloquear metadados após salvar
        setIsMetadataLocked(true);
        
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

  async function handleEditTitle(id: string, currentTitle: string) {
    const newTitle = prompt("Digite o novo título:", currentTitle);
    
    if (!newTitle || newTitle === currentTitle) {
      return;
    }

    try {
      const response = await fetch(`/api/textos?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: newTitle }),
      });

      if (response.ok) {
        toast.success("Título atualizado com sucesso");
        
        // Se é o texto atual, atualizar no editor
        if (id === currentTextoId) {
          setTitulo(newTitle);
        }
        
        loadTextos();
      } else {
        toast.error("Erro ao atualizar título");
      }
    } catch (error) {
      console.error("Erro ao atualizar título:", error);
      toast.error("Erro ao atualizar título");
    }
  }

  function handleDownload(texto: Texto) {
    // Criar conteúdo do arquivo
    const content = `TÍTULO: ${texto.titulo}\n\nCONTEÚDO:\n${texto.conteudo}`;
    
    // Criar blob e URL
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    // Criar link temporário e clicar
    const link = document.createElement("a");
    link.href = url;
    link.download = `${texto.titulo || "texto"}.txt`;
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Download iniciado");
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

  // Handlers para drag and drop
  function handleDragStart(textoId: string) {
    setDraggedTextoId(textoId);
  }

  function handleDragOver(e: React.DragEvent, textoId: string) {
    e.preventDefault();
    setDragOverTextoId(textoId);
  }

  function handleDragEnd() {
    if (!draggedTextoId || !dragOverTextoId || draggedTextoId === dragOverTextoId) {
      setDraggedTextoId(null);
      setDragOverTextoId(null);
      return;
    }

    // Reordenar lista
    const currentList = activeTab === "rascunhos" ? rascunhos : publicados;
    const draggedIndex = currentList.findIndex(t => t.id === draggedTextoId);
    const targetIndex = currentList.findIndex(t => t.id === dragOverTextoId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newList = [...currentList];
    const [removed] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, removed);

    if (activeTab === "rascunhos") {
      setRascunhos(newList);
    } else {
      setPublicados(newList);
    }

    setDraggedTextoId(null);
    setDragOverTextoId(null);
  }

  // Função para conversar com assistentes
  async function handleAssistantMessage(mode: "urthona" | "urizen") {
    if (!assistantInput.trim()) return;

    setIsAssistantLoading(true);
    const messages = mode === "urthona" ? urthonaMessages : urizenMessages;
    const setMessages = mode === "urthona" ? setUrthonaMessages : setUrizenMessages;

    const newUserMessage = {
      role: "user",
      content: assistantInput,
    };

    setMessages([...messages, newUserMessage]);
    setAssistantInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          mode: mode === "urthona" ? "criativo" : "consulta",
          universeId: universeId,
          textContent: conteudo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(errorData.error || "Erro ao conversar com assistente");
        setIsAssistantLoading(false);
        return;
      }

      // Ler stream de resposta
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (!reader) {
        toast.error("Erro ao ler resposta do assistente");
        setIsAssistantLoading(false);
        return;
      }

      // Adicionar mensagem do assistente vazia
      const assistantMessageObj = {
        role: "assistant" as const,
        content: "",
      };
      setMessages([...messages, newUserMessage, assistantMessageObj]);

      // Ler chunks do stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;

        // Atualizar mensagem progressivamente
        setMessages([...messages, newUserMessage, {
          role: "assistant",
          content: assistantMessage,
        }]);
      }

      // Detectar e aplicar EDIT_CONTENT (apenas para Urthona)
      if (mode === "urthona" && assistantMessage.includes('```EDIT_CONTENT')) {
        const editMatch = assistantMessage.match(/```EDIT_CONTENT\s*([\s\S]*?)```/);
        if (editMatch && editMatch[1]) {
          const newContent = editMatch[1].trim();
          setConteudo(newContent);
          toast.success("Texto atualizado por Urthona!");
        }
      }

    } catch (error: any) {
      console.error("Erro ao conversar com assistente:", error);
      toast.error(error.message || "Erro ao conversar com assistente");
    } finally {
      setIsAssistantLoading(false);
    }
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
    
    // Filtro de categorias (múltipla seleção)
    if (filterCategorias.length > 0) {
      // Se "texto-livre" estiver selecionado, incluir textos sem categoria
      if (filterCategorias.includes("texto-livre") && !texto.categoria) {
        return true;
      }
      // Caso contrário, verificar se a categoria do texto está na lista
      if (!filterCategorias.includes(texto.categoria || "")) {
        return false;
      }
    }
    
    return true;
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      <Header showNav={true} currentPage="escrita" />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Lista de Textos */}
        {isSidebarOpen && (
        <aside className="w-[250px] bg-light-raised dark:bg-dark-raised overflow-y-auto md:relative fixed inset-y-0 left-0 z-40 md:z-auto">
          {/* Header da Sidebar */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-light-primary dark:text-dark-primary">Blake Vision</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-text-light-tertiary hover:text-text-light-secondary hover:bg-light-overlay dark:text-dark-tertiary dark:hover:text-dark-secondary dark:hover:bg-dark-overlay transition-colors"
                title="Fechar barra lateral"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <Button
              onClick={handleNewTexto}
              className="w-full"
              variant="primary"
              size="sm"
            >
              + Novo Texto
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex">
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
          <div className="p-4 space-y-3">
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
            <div className="relative z-50">
              <TypesDropdown
                types={textoCategorias}
                selectedSlugs={filterCategorias}
                onToggle={(slug) => {
                  setFilterCategorias(prev => 
                    prev.includes(slug) 
                      ? prev.filter(s => s !== slug)
                      : [...prev, slug]
                  );
                }}
              />
            </div>
          </div>

          {/* Lista de Textos */}
          <div className="p-4">
            {filteredTextos.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                  {searchQuery || filterCategorias.length > 0
                    ? "Nenhum texto encontrado"
                    : activeTab === "rascunhos"
                    ? "Nenhum rascunho ainda"
                    : "Nenhum texto publicado"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTextos.map(texto => (
                  <div key={texto.id} className="relative">
                    {/* Linha indicadora de drag and drop */}
                    {dragOverTextoId === texto.id && draggedTextoId !== texto.id && (
                      <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 z-10" />
                    )}
                    
                    <div
                      draggable
                      onDragStart={() => handleDragStart(texto.id)}
                      onDragOver={(e) => handleDragOver(e, texto.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleSelectTexto(texto)}
                      className={clsx(
                        "group relative flex flex-col gap-2 px-3 py-2 rounded-lg cursor-move transition-colors",
                        currentTextoId === texto.id
                          ? "bg-[#E8E4DB] dark:bg-primary-900/30 text-text-light-primary dark:text-dark-primary"
                          : "bg-transparent dark:bg-transparent text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay",
                        draggedTextoId === texto.id && "opacity-50"
                      )}
                    >
                    {/* Badge na primeira linha */}
                    <div className="flex items-center">
                      {texto.categoria ? (
                        <span className={clsx(
                          "inline-block px-2 py-0.5 text-[10px] font-medium rounded flex-shrink-0",
                          getCategoryColor(texto.categoria)
                        )}>
                          {getCategoryLabel(texto.categoria)}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded flex-shrink-0 bg-text-light-tertiary/20 dark:bg-dark-tertiary/20 text-text-light-secondary dark:text-dark-secondary">
                          Texto Livre
                        </span>
                      )}
                    </div>
                    
                    {/* Título na segunda linha */}
                    <div className="text-xs line-clamp-3">
                      {texto.titulo || "Sem título"}
                    </div>
                    
                    {/* Botões com gradiente (aparecem no hover) */}
                    <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2 pl-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[#E8E4DB] via-[#E8E4DB]/95 to-transparent dark:from-primary-900/30 dark:via-primary-900/30 dark:to-transparent">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTitle(texto.id, texto.titulo);
                        }}
                        className="p-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary"
                        title="Editar Título"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(texto);
                        }}
                        className="p-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary"
                        title="Download"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(texto.id);
                        }}
                        className="p-1 rounded hover:bg-error-light/10 text-error-light"
                        title="Apagar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
        )}

        {/* Barra de ícones mobile (quando sidebar fechada) */}
        {!isSidebarOpen && (
          <div className="md:hidden fixed left-0 top-0 h-full w-12 bg-light-raised dark:bg-dark-raised flex flex-col items-center pt-4 gap-3 z-40">
            {/* Botão Menu (Sanduíche) */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
              title="Abrir menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Divisor */}
            <div className="w-6 h-px bg-border-light-default dark:bg-border-dark-default" />

            {/* Botão Lápis (Abrir Sidebar de Textos) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
              title="Abrir barra lateral"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}

        {/* Botão de expandir sidebar desktop (quando colapsada) */}
        {!isSidebarOpen && (
          <div className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-12 bg-light-raised dark:bg-dark-raised flex-col items-center pt-48 gap-3 z-40">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
              title="Abrir barra lateral"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}

        {/* Container flex para Editor + Chat */}
        <div className={clsx(
          "flex-1 flex overflow-hidden transition-all duration-300",
          !isSidebarOpen && "ml-12 md:ml-12"
        )}>
          {/* Editor Principal */}
          <main className={clsx(
            "overflow-y-auto transition-all duration-300",
            (showUrthona || showUrizen) ? "flex-1" : "w-full"
          )}>
          <div className="max-w-4xl mx-auto p-8">
            <div className="space-y-6">
              {/* Agentes */}
              <div className="flex gap-4 justify-end">
                {/* Urthona - Criativo */}
                <div 
                  onClick={() => {
                    setShowUrthona(!showUrthona);
                    if (!showUrthona) setShowUrizen(false);
                  }}
                  className="relative group cursor-pointer"
                  title="Urthona (Criativo)"
                >
                  <img 
                    src="/urthona-avatar.png" 
                    alt="Urthona" 
                    className={clsx(
                      "w-12 h-12 rounded-full transition-all",
                      showUrthona ? "ring-4 ring-[#C85A54]" : "hover:ring-2 hover:ring-[#C85A54]/50"
                    )}
                  />
                </div>

                {/* Urizen - Consulta */}
                <div 
                  onClick={() => {
                    setShowUrizen(!showUrizen);
                    if (!showUrizen) setShowUrthona(false);
                  }}
                  className="relative group cursor-pointer"
                  title="Urizen (Consulta)"
                >
                  <img 
                    src="/urizen-avatar.png" 
                    alt="Urizen" 
                    className={clsx(
                      "w-12 h-12 rounded-full transition-all",
                      showUrizen ? "ring-4 ring-[#5B7C8D]" : "hover:ring-2 hover:ring-[#5B7C8D]/50"
                    )}
                  />
                </div>
              </div>

              {/* Cabeçalho Colasável (quando metadados foram salvos) */}
              {isMetadataSaved ? (
                <div>
                  {/* Linha colapsada com título */}
                  <div className="flex items-center gap-3">
                    {/* Botão de expandir/colapsar */}
                    <button
                      onClick={() => {
                        if (isHeaderExpanded && hasUnsavedMetadataChanges) {
                          // Mostrar modal de confirmação
                          setShowUnsavedChangesModal(true);
                        } else {
                          setIsHeaderExpanded(!isHeaderExpanded);
                        }
                      }}
                      className="p-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary transition-colors"
                      title={isHeaderExpanded ? "Colapsar" : "Expandir"}
                    >
                      <svg 
                        className={clsx(
                          "w-5 h-5 transition-transform",
                          isHeaderExpanded && "rotate-90"
                        )} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Título */}
                    <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary flex-1">
                      {titulo || "Sem título"}
                    </h2>
                  </div>

                  {/* Metadados expandidos */}
                  {isHeaderExpanded && (
                    <div className="mt-4 space-y-4">
                      {/* Botão de editar (só aparece quando expandido) */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => setIsMetadataLocked(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="Editar metadados"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Editar
                        </button>
                      </div>

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
                          disabled={isMetadataLocked}
                          className="w-full px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
                          disabled={isMetadataLocked}
                        />

                        <WorldsDropdownSingle
                          label="MUNDO"
                          worlds={worlds.filter(w => w.universe_id === universeId)}
                          selectedId={worldId}
                          onSelect={(id) => setWorldId(id)}
                          disabled={!universeId || isMetadataLocked}
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
                          disabled={!worldId || isMetadataLocked}
                        />

                        <CategoryDropdownSingle
                          label="CATEGORIA"
                          categories={categories}
                          selectedCategory={categoria}
                          onSelect={setCategoria}
                          worldId={worldId}
                          disabled={!universeId || isMetadataLocked}
                        />
                      </div>

                      {/* Botão Salvar (só aparece quando está editando) */}
                      {!isMetadataLocked && (
                        <div className="flex justify-center">
                          <Button
                            onClick={handleSaveMetadata}
                            disabled={isSaving || !titulo.trim() || !universeId}
                            variant="primary"
                            size="sm"
                          >
                            {isSaving ? "Salvando..." : "Salvar"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Formulário inicial de metadados (antes de salvar)
                <div className="space-y-4">
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
                </div>
              )}

              {/* Botão Salvar Metadados (apenas quando não foram salvos ainda) */}
              {!isMetadataSaved && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleSaveMetadata}
                    disabled={isSaving || !titulo.trim() || !universeId}
                    variant="primary"
                    size="sm"
                  >
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              )}

              {/* Conteúdo (só aparece após salvar metadados) */}
              {isMetadataSaved && (
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
              )}

              {/* Ações (só aparecem após salvar metadados) */}
              {isMetadataSaved && (
                <div className="flex justify-between items-center pt-4">
                  {/* Botão Excluir à esquerda */}
                  <Button
                    onClick={() => currentTextoId && handleDelete(currentTextoId)}
                    variant="secondary"
                    size="sm"
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Excluir
                  </Button>

                  {/* Botões Salvar e Publicar à direita */}
                  <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !titulo.trim()}
                    variant="secondary"
                    size="sm"
                  >
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>

                  <Button
                    onClick={handlePublish}
                    disabled={isSaving || !titulo.trim()}
                    variant="primary"
                    size="sm"
                  >
                    Publicar
                  </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Chat Lateral com Assistentes */}
        {(showUrthona || showUrizen) && (
          <div className="w-96 border-l border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base overflow-hidden flex flex-col">
            <div ref={chatRef} className="flex flex-col h-full p-4">
              {/* Header do Chat */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border-light-default dark:border-border-dark-default">
                <div>
                  <h3 className="font-semibold text-text-light-primary dark:text-dark-primary">
                    {showUrthona ? "Urthona" : "Urizen"}
                  </h3>
                  <p className="text-xs text-text-light-tertiary dark:text-dark-tertiary">
                    {showUrthona ? "Criativo" : "Consulta"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUrthona(false);
                    setShowUrizen(false);
                  }}
                  className="text-text-light-tertiary hover:text-text-light-primary dark:text-dark-tertiary dark:hover:text-dark-primary transition-colors p-2 rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay"
                  title="Fechar"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
                {(showUrthona ? urthonaMessages : urizenMessages).map((msg, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "relative group px-4 py-3 rounded-lg text-sm",
                      msg.role === "user"
                        ? "bg-light-raised dark:bg-dark-raised ml-4"
                        : (showUrthona ? "bg-[#C85A54]" : "bg-[#5B7C8D]") + " text-white mr-4"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="flex gap-2 items-end pt-4 border-t border-border-light-default dark:border-border-dark-default">
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAssistantMessage(showUrthona ? "urthona" : "urizen");
                    }
                  }}
                  placeholder="Mensagem..."
                  className="flex-1 px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  disabled={isAssistantLoading}
                />
                <button
                  onClick={() => handleAssistantMessage(showUrthona ? "urthona" : "urizen")}
                  disabled={!assistantInput.trim() || isAssistantLoading}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 dark:disabled:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                >
                  {isAssistantLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>



      {/* Menu Mobile Drawer */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[9997] md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Drawer */}
          <div className="fixed inset-y-0 left-0 w-64 bg-[#F5F1E8] dark:bg-dark-raised border-r border-border-light-default dark:border-border-dark-default z-[9998] md:hidden">
            <div className="p-4 space-y-2">
              <a
                href="/"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
              >
                Home
              </a>
              <a
                href="/projetos"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
              >
                Projetos
              </a>
              <a
                href="/catalog"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
              >
                Catálogo
              </a>
              <a
                href="/escrita"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-colors"
              >
                Escrita
              </a>
              <a
                href="/timeline"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
              >
                Timeline
              </a>
              <a
                href="/upload"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
              >
                Upload
              </a>
              <a
                href="/faq"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
              >
                FAQ
              </a>
            </div>
          </div>
        </>
      )}

      {/* Modal de Novo Episódio */}
      <NewEpisodeModal
        isOpen={showNewEpisodeModal}
        onClose={() => setShowNewEpisodeModal(false)}
        onSave={handleCreateNewEpisode}
      />

      {/* Modal de Alterações Não Salvas */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-light-raised dark:bg-dark-raised rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary mb-2">
              Alterações não salvas
            </h3>
            <p className="text-text-light-secondary dark:text-dark-secondary mb-6">
              Você tem alterações não salvas nos metadados. O que deseja fazer?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowUnsavedChangesModal(false)}
                variant="secondary"
                size="sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Descartar alterações - restaurar snapshot
                  if (savedMetadataSnapshot) {
                    setTitulo(savedMetadataSnapshot.titulo);
                    setUniverseId(savedMetadataSnapshot.universeId);
                    setWorldId(savedMetadataSnapshot.worldId);
                    setEpisodio(savedMetadataSnapshot.episodio);
                    setCategoria(savedMetadataSnapshot.categoria);
                  }
                  setIsMetadataLocked(true);
                  setHasUnsavedMetadataChanges(false);
                  setIsHeaderExpanded(false);
                  setShowUnsavedChangesModal(false);
                }}
                variant="secondary"
                size="sm"
              >
                Descartar
              </Button>
              <Button
                onClick={() => {
                  handleSaveMetadata();
                  setShowUnsavedChangesModal(false);
                }}
                variant="primary"
                size="sm"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EscritaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-light-base dark:bg-dark-base flex items-center justify-center"><div className="text-text-light-secondary dark:text-dark-secondary">Carregando...</div></div>}>
      <EscritaPageContent />
    </Suspense>
  );
}
