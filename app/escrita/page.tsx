'use client';

console.log('[ESCRITA PAGE] Módulo carregado - timestamp:', Date.now());

import React, { useState, useEffect, useRef, Suspense } from "react";
import { flushSync } from "react-dom";
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
import getCaretCoordinates from "textarea-caret";
import TiptapEditor from "@/components/TiptapEditor";
import { EditorHeader } from "@/app/components/editor/EditorHeader";
import { EditorFooter } from "@/app/components/editor/EditorFooter";
import { ExportModal } from "@/app/components/modals/ExportModal";
import { MobileOptionsMenu } from "@/app/components/mobile/MobileOptionsMenu";

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
  console.log('[DEBUG EscritaPage] Componente renderizado!');
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
  const [isMetadataSaved, setIsMetadataSaved] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [hasUnsavedMetadataChanges, setHasUnsavedMetadataChanges] = useState(false);
  const [savedMetadataSnapshot, setSavedMetadataSnapshot] = useState<any>(null);
  
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
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMobileOptionsMenu, setShowMobileOptionsMenu] = useState(false);
  
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
  
  // Estados para drag and drop e resize do chat
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [chatSize, setChatSize] = useState({ width: 384, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Estados para Modo Foco
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusType, setFocusType] = useState<'off' | 'sentence' | 'paragraph'>('off');
  const [typewriterMode, setTypewriterMode] = useState(false);
  
  // Modo Foco: Atualizar focus quando focusType muda
  useEffect(() => {
    if (!isFocusMode) return;
    
    const editorContent = document.querySelector('[data-testid="editor-content"]');
    if (!editorContent) return;
    
    const paragraphs = Array.from(editorContent.querySelectorAll('p'));
    
    // Remover todas as classes de focus
    paragraphs.forEach(p => {
      p.classList.remove('focus-active', 'focus-dimmed');
    });
    
    if (focusType === 'off') return;
    
    const updateFocus = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      let currentParagraph = range.commonAncestorContainer.parentElement;
      
      while (currentParagraph && currentParagraph !== editorContent) {
        if (currentParagraph.tagName === 'P') break;
        currentParagraph = currentParagraph.parentElement;
      }
      
      if (!currentParagraph && paragraphs.length > 0) {
        currentParagraph = paragraphs[0] as HTMLElement;
      }
      
      if (!currentParagraph) return;
      
      paragraphs.forEach(p => {
        if (p === currentParagraph) {
          p.classList.add('focus-active');
        } else {
          p.classList.add('focus-dimmed');
        }
      });
    }
    
    updateFocus();
    
    const handleSelectionChange = () => {
      if ((focusType as any) !== 'off') {
        updateFocus();
      }
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [focusType]);
  
  // Estados para seleção de texto
  const [selectedText, setSelectedText] = useState("");
  const [selectionMenuPosition, setSelectionMenuPosition] = useState<{x: number, y: number} | null>(null);
  
  // Ref para controlar o editor externamente
  const editorRef = useRef<any>(null);
  const loadedTextoIdRef = useRef<string | null>(null);

  // Estados para drag and drop
  const [draggedTextoId, setDraggedTextoId] = useState<string | null>(null);
  const [dragOverTextoId, setDragOverTextoId] = useState<string | null>(null);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

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
    console.log('[DEBUG] useEffect loadTexto executado');
    const textoId = searchParams.get("id");
    console.log('[DEBUG] textoId da URL:', textoId, 'isLoading:', isLoading);
    
    if (textoId && !isLoading && textoId !== loadedTextoIdRef.current) {
      console.log('[DEBUG] Chamando loadTexto... (primeira vez para este ID)');
      loadedTextoIdRef.current = textoId;
      try {
        loadTexto(textoId);
      } catch (error) {
        console.error('[DEBUG] ERRO no useEffect ao chamar loadTexto:', error);
        loadedTextoIdRef.current = null;
      }
    } else if (textoId && textoId === loadedTextoIdRef.current) {
      console.log('[DEBUG] Texto já foi carregado, ignorando...');
    }
  }, [searchParams, isLoading]);

  // Ajustar altura do textarea do chat quando assistantInput mudar
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      const newHeight = Math.min(chatInputRef.current.scrollHeight, 96);
      chatInputRef.current.style.height = `${newHeight}px`;
    }
  }, [assistantInput]);

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

  // Scroll automático do chat quando novas mensagens chegam
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [urthonaMessages, urizenMessages]);

  // Handlers para drag and drop do chat
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setChatPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      if (isResizing) {
        const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(400, resizeStart.height + (e.clientY - resizeStart.y));
        setChatSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  // Fechar chat com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (showUrthona || showUrizen)) {
        setShowUrthona(false);
        setShowUrizen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showUrthona, showUrizen]);

  // Modo Foco: Fullscreen API
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFocusMode) {
        setIsFocusMode(false);
        setFocusType('off');
        setTypewriterMode(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFocusMode]);

  // Modo Foco: Auto-save a cada 30 segundos
  useEffect(() => {
    if (isFocusMode && conteudo && currentTextoId) {
      const interval = setInterval(() => {
        handleSave(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isFocusMode, conteudo, currentTextoId]);

  // Modo Foco: Atalhos de teclado
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!isFocusMode) return;
      
      if (e.ctrlKey && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        exitFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isFocusMode]);

  // Funções auxiliares
  function getCategoryLabel(categoria: string | null): string {
    if (!categoria) return "";
    
    const cat = categories.find(c => c.slug === categoria);
    return cat?.label || categoria;
  }

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

  // Funções de autenticação e carregamento
  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      router.push("/login");
    }
  }

  async function loadTextos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("textos")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const rascunhosData = (data || []).filter(t => t.status === "rascunho");
      const publicadosData = (data || []).filter(t => t.status === "publicado");

      setRascunhos(rascunhosData);
      setPublicados(publicadosData);
    } catch (error) {
      console.error("Erro ao carregar textos:", error);
      toast.error("Erro ao carregar textos");
    }
  }

  async function loadUniversesAndWorlds() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: universesData, error: universesError } = await supabase
        .from("universes")
        .select("*")
        .eq("user_id", user.id);

      if (universesError) throw universesError;
      setUniverses(universesData || []);

      const { data: worldsData, error: worldsError } = await supabase
        .from("worlds")
        .select("*")
        .eq("user_id", user.id);

      if (worldsError) throw worldsError;
      setWorlds(worldsData || []);
    } catch (error) {
      console.error("Erro ao carregar universos e mundos:", error);
    }
  }

  async function loadTexto(id: string) {
    try {
      const { data, error } = await supabase
        .from("textos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error("Texto não encontrado");
        return;
      }

      setCurrentTextoId(data.id);
      setTitulo(data.titulo);
      setConteudo(data.conteudo);
      setUniverseId(data.universe_id || "");
      setWorldId(data.world_id || "");
      setEpisodio(data.episodio || "");
      setCategoria(data.categoria || "");
      setStatus(data.status);
      setIsMetadataLocked(true);
      setIsMetadataSaved(true);
      setSavedMetadataSnapshot({
        titulo: data.titulo,
        universeId: data.universe_id,
        worldId: data.world_id,
        episodio: data.episodio,
        categoria: data.categoria
      });

      if (editorRef.current) {
        flushSync(() => {
          editorRef.current?.setContent(data.conteudo || "");
        });
      }
    } catch (error) {
      console.error("Erro ao carregar texto:", error);
      toast.error("Erro ao carregar texto");
    }
  }

  async function handleSaveMetadata() {
    if (!currentTextoId) {
      toast.error("Nenhum texto selecionado");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("textos")
        .update({
          titulo,
          universe_id: universeId || null,
          world_id: worldId || null,
          episodio: episodio || null,
          categoria: categoria || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentTextoId);

      if (error) throw error;

      setSavedMetadataSnapshot({
        titulo,
        universeId,
        worldId,
        episodio,
        categoria
      });

      setHasUnsavedMetadataChanges(false);
      setIsMetadataLocked(true);
      toast.success("Metadados salvos com sucesso");

      loadTextos();
    } catch (error) {
      console.error("Erro ao salvar metadados:", error);
      toast.error("Erro ao salvar metadados");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave(autoSave: boolean = false) {
    if (!currentTextoId) {
      toast.error("Nenhum texto selecionado");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("textos")
        .update({
          conteudo,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentTextoId);

      if (error) throw error;

      if (!autoSave) {
        toast.success("Texto salvo com sucesso");
      }

      loadTextos();
    } catch (error) {
      console.error("Erro ao salvar texto:", error);
      if (!autoSave) {
        toast.error("Erro ao salvar texto");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (!currentTextoId) {
      toast.error("Nenhum texto selecionado");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("textos")
        .update({
          status: "publicado",
          updated_at: new Date().toISOString()
        })
        .eq("id", currentTextoId);

      if (error) throw error;

      setStatus("publicado");
      toast.success("Texto publicado com sucesso");
      loadTextos();
    } catch (error) {
      console.error("Erro ao publicar texto:", error);
      toast.error("Erro ao publicar texto");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja deletar este texto?")) return;

    try {
      const { error } = await supabase
        .from("textos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (currentTextoId === id) {
        setCurrentTextoId(null);
        setTitulo("");
        setConteudo("");
        setUniverseId("");
        setWorldId("");
        setEpisodio("");
        setCategoria("");
      }

      toast.success("Texto deletado com sucesso");
      loadTextos();
    } catch (error) {
      console.error("Erro ao deletar texto:", error);
      toast.error("Erro ao deletar texto");
    }
  }

  async function handleDuplicate() {
    if (!currentTextoId) {
      toast.error("Nenhum texto selecionado");
      return;
    }

    try {
      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("textos")
        .insert([
          {
            user_id: user.id,
            titulo: `${titulo} (Cópia)`,
            conteudo,
            universe_id: universeId || null,
            world_id: worldId || null,
            episodio: episodio || null,
            categoria: categoria || null,
            status: "rascunho",
            extraido: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Texto duplicado com sucesso");
      loadTextos();
    } catch (error) {
      console.error("Erro ao duplicar texto:", error);
      toast.error("Erro ao duplicar texto");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport(format: 'pdf' | 'docx' | 'txt') {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          conteudo,
          format
        })
      });

      if (!response.ok) throw new Error('Erro ao exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titulo}.${format === 'pdf' ? 'pdf' : format === 'docx' ? 'docx' : 'txt'}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Arquivo exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar arquivo");
    }
  }

  async function handleEditTitle(id: string, currentTitle: string) {
    const newTitle = prompt("Novo título:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    try {
      const { error } = await supabase
        .from("textos")
        .update({ titulo: newTitle })
        .eq("id", id);

      if (error) throw error;

      if (currentTextoId === id) {
        setTitulo(newTitle);
      }

      toast.success("Título atualizado com sucesso");
      loadTextos();
    } catch (error) {
      console.error("Erro ao atualizar título:", error);
      toast.error("Erro ao atualizar título");
    }
  }

  async function handleFichaClick(fichaSlug: string) {
    try {
      const response = await fetch(`/api/fichas/${fichaSlug}`);
      if (!response.ok) throw new Error('Ficha não encontrada');
      // Aqui você pode adicionar lógica para exibir a ficha
    } catch (error) {
      console.error("Erro ao buscar ficha:", error);
      toast.error("Erro ao buscar ficha");
    }
  }

  async function handleAssistantMessage(mode: "urthona" | "urizen") {
    if (!assistantInput.trim()) return;

    try {
      setIsAssistantLoading(true);
      const messages = mode === "urthona" ? urthonaMessages : urizenMessages;
      const setMessages = mode === "urthona" ? setUrthonaMessages : setUrizenMessages;

      const newUserMessage = {
        role: "user",
        content: assistantInput
      };

      setMessages([...messages, newUserMessage]);
      setAssistantInput("");

      // Aqui você pode adicionar a chamada à API do assistente
      toast.success("Mensagem enviada");
    } catch (error) {
      console.error("Erro ao conversar com assistente:", error);
      toast.error("Erro ao conversar com assistente");
    } finally {
      setIsAssistantLoading(false);
    }
  }

  async function enterFocusMode() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        setIsFocusMode(true);
      }
    } catch (error) {
      console.error("Erro ao entrar em modo foco:", error);
      toast.error("Erro ao entrar em modo foco");
    }
  }

  async function exitFocusMode() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFocusMode(false);
      setFocusType('off');
      setTypewriterMode(false);
    } catch (error) {
      console.error("Erro ao sair do modo foco:", error);
    }
  }

  // Filtrar textos
  const textos = activeTab === "rascunhos" ? rascunhos : publicados;
  const filteredTextos = textos.filter(texto => {
    if (searchQuery && !texto.titulo.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filterUniverseId && texto.universe_id !== filterUniverseId) {
      return false;
    }
    
    if (filterWorldId && texto.world_id !== filterWorldId) {
      return false;
    }
    
    if (filterCategorias.length > 0) {
      if (filterCategorias.includes("texto-livre") && !texto.categoria) {
        return true;
      }
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
      
      {/* Grid 6x3 Layout */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-0 w-full">
        {/* COLUNA A - Margem Esquerda */}
        <div className="hidden lg:block w-12 bg-light-bg-secondary dark:bg-dark-bg-secondary" />
        
        {/* COLUNA B - Conteúdo Principal */}
        <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
          {/* LINHA 1: Modo Foco + Avatares */}
          <div className="flex items-center justify-between py-4 border-b border-border-light-default dark:border-border-dark-default">
            <button
              onClick={enterFocusMode}
              className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm"
            >
              Modo Foco
            </button>
            <div className="flex gap-2">
              {/* Avatares aqui */}
            </div>
          </div>

          {/* LINHA 2: Título com Botão Colapsar */}
          <div className="flex items-center gap-3 py-3 border-b border-border-light-default dark:border-border-dark-default">
            <button
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className="p-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
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
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary flex-1">
              {titulo || "Sem título"}
            </h2>
          </div>

          {/* LINHA 3: Metadados (aparece quando expandido) */}
          {isHeaderExpanded && (
            <div className="space-y-4 py-4 border-b border-border-light-default dark:border-border-dark-default">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Universo</label>
                  <UniverseDropdown
                    selectedId={universeId}
                    onSelect={setUniverseId}
                    universes={universes}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Mundo</label>
                  <WorldsDropdownSingle
                    selectedId={worldId}
                    onSelect={setWorldId}
                    worlds={worlds.filter(w => !universeId || w.universe_id === universeId)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Episódio</label>
                  <EpisodesDropdownSingle
                    selectedEpisode={episodio}
                    onSelect={setEpisodio}
                    episodes={availableEpisodes}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Categoria</label>
                  <CategoryDropdownSingle
                    selectedCategory={categoria}
                    onSelect={setCategoria}
                    categories={textoCategorias}
                  />
                </div>
              </div>
              <button
                onClick={handleSaveMetadata}
                disabled={!hasUnsavedMetadataChanges || isSaving}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isSaving ? "Salvando..." : "Salvar Metadados"}
              </button>
            </div>
          )}

          {/* LINHA 4: Toolbar do Editor */}
          <div className="py-3 border-b border-border-light-default dark:border-border-dark-default">
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors text-sm font-medium">B</button>
              <button className="px-3 py-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors text-sm font-medium italic">I</button>
              <button className="px-3 py-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors text-sm font-medium underline">U</button>
            </div>
          </div>

          {/* LINHA 5: Conteúdo do Editor */}
          <div className="py-6">
            <TiptapEditor
              value={conteudo}
              onChange={setConteudo}
              placeholder="Comece a escrever..."
              editorRef={editorRef}
            />
          </div>

          {/* LINHA 6: Botões Salvar/Publicar */}
          <div className="flex gap-3 py-6 border-t border-border-light-default dark:border-border-dark-default">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-6 py-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-primary dark:text-dark-primary rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Publicar
            </button>
          </div>
        </div>
        
        {/* COLUNA C - Margem Direita */}
        <div className="hidden lg:block w-12 bg-light-bg-secondary dark:bg-dark-bg-secondary" />
      </div>
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
