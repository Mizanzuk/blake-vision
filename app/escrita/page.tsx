"use client";

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
  
  // Estados para modal de ficha
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [fichaData, setFichaData] = useState<any>(null);
  const [loadingFicha, setLoadingFicha] = useState(false);
  
  // Estados do Modo Foco
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusType, setFocusType] = useState<'off' | 'sentence' | 'paragraph'>('off');
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // Focus Mode - JavaScript inline
  useEffect(() => {
    console.log('[Focus Mode] useEffect executado, focusType:', focusType);
    
    function updateFocus() {
      console.log('[Focus Mode] updateFocus chamado');
      const proseMirror = document.querySelector('.ProseMirror');
      if (!proseMirror) return;
      
      // Remove all focus classes
      proseMirror.querySelectorAll('.focus-active, .focus-dimmed').forEach((el: Element) => {
        el.classList.remove('focus-active', 'focus-dimmed');
      });
      
      if (focusType === 'off') return;
      
      // Get all paragraphs
      const paragraphs = Array.from(proseMirror.querySelectorAll('p'));
      
      // Find current paragraph
      let currentParagraph = null;
      const selection = window.getSelection();
      
      if (selection && selection.anchorNode) {
        let node: Node | null = selection.anchorNode;
        while (node && node !== proseMirror) {
          if (node.nodeName === 'P') {
            currentParagraph = node as HTMLElement;
            break;
          }
          node = node.parentNode;
        }
      }
      
      if (!currentParagraph && paragraphs.length > 0) {
        currentParagraph = paragraphs[0] as HTMLElement;
      }
      
      if (!currentParagraph) return;
      
      // Apply focus classes
      paragraphs.forEach(p => {
        if (p === currentParagraph) {
          p.classList.add('focus-active');
        } else {
          p.classList.add('focus-dimmed');
        }
      });
    }
    
    updateFocus();
    
    // Listen to selection changes
    const handleSelectionChange = () => {
      if (focusType !== 'off') {
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
  const loadedTextoIdRef = useRef<string | null>(null); // Rastrear qual texto já foi carregado

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
    
    // CORREÇÃO: Evitar carregamento duplicado usando ref
    if (textoId && !isLoading && textoId !== loadedTextoIdRef.current) {
      console.log('[DEBUG] Chamando loadTexto... (primeira vez para este ID)');
      loadedTextoIdRef.current = textoId; // Marcar como carregado
      try {
        loadTexto(textoId);
      } catch (error) {
        console.error('[DEBUG] ERRO no useEffect ao chamar loadTexto:', error);
        loadedTextoIdRef.current = null; // Resetar em caso de erro
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
        // Saiu do fullscreen, desativar modo foco
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
        handleSave(true); // true = auto-save silencioso
      }, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [isFocusMode, conteudo, currentTextoId]);

  // Modo Foco: Atalhos de teclado
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!isFocusMode) return;
      
      // ESC: Lógica hierárquica - fechar chat primeiro, depois modo foco
      if (e.key === 'Escape') {
        if (showUrthona || showUrizen) {
          // Se há chat aberto, fechar o chat
          setShowUrthona(false);
          setShowUrizen(false);
        } else {
          // Se não há chat aberto, sair do modo foco
          exitFocusMode();
        }
        return;
      }
      
      // Ctrl+Shift+F: Toggle sentence focus
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setFocusType(prev => prev === 'sentence' ? 'off' : 'sentence');
        return;
      }
      
      // Ctrl+Shift+P: Toggle paragraph focus
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setFocusType(prev => prev === 'paragraph' ? 'off' : 'paragraph');
        return;
      }
      
      // Ctrl+Shift+T: Toggle typewriter mode
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setTypewriterMode(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isFocusMode, showUrthona, showUrizen]);

  // Funções do Modo Foco
  async function enterFocusMode() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
        setIsFocusMode(true);
      }
    } catch (error) {
      console.error('Erro ao entrar em fullscreen:', error);
      toast.error('Não foi possível ativar o modo fullscreen');
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
      console.error('Erro ao sair do fullscreen:', error);
    }
  }

  // Funções de highlighting para Modo Foco
  function getCurrentSentence(text: string, position: number): { start: number; end: number } {
    // Encontrar início da sentença (após ., !, ? ou início do texto)
    let start = position;
    while (start > 0 && !/[.!?]\s/.test(text.substring(start - 2, start))) {
      start--;
    }
    // Pular espaços após pontuação
    while (start < text.length && /\s/.test(text[start])) {
      start++;
    }

    // Encontrar fim da sentença
    let end = position;
    while (end < text.length && !/[.!?]/.test(text[end])) {
      end++;
    }
    if (end < text.length) end++; // Incluir pontuação

    return { start, end };
  }

  function getCurrentParagraph(text: string, position: number): { start: number; end: number } {
    // Encontrar início do parágrafo (após \n\n ou início do texto)
    let start = position;
    while (start > 0 && text.substring(start - 2, start) !== '\n\n') {
      start--;
    }
    // Pular quebras de linha
    while (start < text.length && text[start] === '\n') {
      start++;
    }

    // Encontrar fim do parágrafo
    let end = position;
    while (end < text.length - 1 && text.substring(end, end + 2) !== '\n\n') {
      end++;
    }

    return { start, end };
  }

  function applyFocusHighlight(textarea: HTMLTextAreaElement) {
    if (!isFocusMode || focusType === 'off') return;

    const position = textarea.selectionStart;
    const text = textarea.value;
    
    let range: { start: number; end: number };
    if (focusType === 'sentence') {
      range = getCurrentSentence(text, position);
    } else {
      range = getCurrentParagraph(text, position);
    }

    // Aplicar efeito visual usando CSS (implementação simplificada)
    // Em uma implementação completa, usaríamos um editor rico como CodeMirror ou ProseMirror
    // Por enquanto, o efeito será aplicado via CSS no textarea
  }

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
    console.log('[DEBUG] loadTexto iniciado, ID:', id);
    try {
      console.log('[DEBUG] Fazendo fetch da API...');
      const response = await fetch(`/api/textos?id=${id}`);
      console.log('[DEBUG] Response recebida:', response.status);
      const data = await response.json();
      console.log('[DEBUG] Data parseada:', data);
      
      if (response.ok && data.texto) {
        const texto = data.texto;
        
        // CORREÇÃO: Setar conteúdo PRIMEIRO com flushSync para garantir que está pronto
        // antes de mostrar o editor (isMetadataSaved = true)
        console.log('[DEBUG] Setando conteúdo, tamanho:', (texto.conteudo || '').length);
        flushSync(() => {
          setConteudo(texto.conteudo || "");
        });
        console.log('[DEBUG] Conteúdo setado com sucesso (flushSync)');
        
        // Depois setar todos os outros estados de uma vez
        flushSync(() => {
          setCurrentTextoId(texto.id);
          setTitulo(texto.titulo || "");
          setUniverseId(texto.universe_id || "");
          setWorldId(texto.world_id || "");
          setEpisodio(texto.episodio || "");
          setCategoria(texto.categoria || "");
          setStatus(texto.status || "rascunho");
          
          // Configurar estados de controle
          setIsMetadataLocked(true);
          setIsMetadataSaved(true); // ← Isso monta o TiptapEditor
          setIsHeaderExpanded(false);
          
          // Salvar snapshot dos metadados
          setSavedMetadataSnapshot({
            titulo: texto.titulo || "",
            universeId: texto.universe_id || "",
            worldId: texto.world_id || "",
            episodio: texto.episodio || "",
            categoria: texto.categoria || ""
          });
        });
      }
    } catch (error) {
      console.error('[DEBUG] ERRO CAPTURADO em loadTexto:', error);
      console.error('[DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('[DEBUG] Mensagem:', error instanceof Error ? error.message : String(error));
      toast.error("Erro ao carregar texto");
    }
  }

  function handleSelectTexto(texto: Texto) {
    // Resetar ref para permitir carregamento do novo texto
    loadedTextoIdRef.current = texto.id;
    
    // CORREÇÃO: Setar conteúdo primeiro, depois mostrar editor
    flushSync(() => {
      setConteudo(texto.conteudo || "");
    });
    
    flushSync(() => {
      setCurrentTextoId(texto.id);
      setTitulo(texto.titulo || "");
      setUniverseId(texto.universe_id || "");
      setWorldId(texto.world_id || "");
      setEpisodio(texto.episodio || "");
      setCategoria(texto.categoria || "");
      setStatus(texto.status || "rascunho");
      
      // Bloquear metadados ao carregar texto existente salvo
      setIsMetadataLocked(true);
      setIsMetadataSaved(true);
      setIsHeaderExpanded(false); // Começar colapsado para textos existentes
      
      // Salvar snapshot dos metadados
      setSavedMetadataSnapshot({
        titulo: texto.titulo || "",
        universeId: texto.universe_id || "",
        worldId: texto.world_id || "",
        episodio: texto.episodio || "",
        categoria: texto.categoria || ""
      });
    });
    
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
    setHasUnsavedMetadataChanges(false);
    
    // Limpar snapshot
    setSavedMetadataSnapshot({
      titulo: "",
      universeId: "",
      worldId: "",
      episodio: "",
      categoria: ""
    });
    
    // Limpar URL
    router.push("/escrita");
  }

  async function handleSave(autoSave: boolean = false) {
    if (!titulo.trim()) {
      if (!autoSave) toast.error("Por favor, adicione um título");
      return;
    }

    setIsSaving(true);

    try {
      const body = {
        id: currentTextoId,
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
        if (!autoSave) {
          toast.success(currentTextoId ? "Texto atualizado!" : "Texto criado!");
        } else {
          setLastSaveTime(new Date());
        }
        
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

  // Função para duplicar texto
  async function handleDuplicate() {
    if (!currentTextoId) {
      toast.error("Nenhum texto selecionado para duplicar");
      return;
    }

    try {
      const response = await fetch(`/api/textos?id=${currentTextoId}`);
      const data = await response.json();

      if (response.ok && data.texto) {
        const duplicatedTexto = {
          ...data.texto,
          id: undefined,
          titulo: `${data.texto.titulo} (Cópia)`,
          status: "rascunho" as const,
        };

        const createResponse = await fetch("/api/textos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(duplicatedTexto),
        });

        const createData = await createResponse.json();

        if (createResponse.ok) {
          toast.success("Texto duplicado com sucesso!");
          loadTextos();
          router.push(`/escrita?id=${createData.texto.id}`);
        } else {
          toast.error(createData.error || "Erro ao duplicar texto");
        }
      } else {
        toast.error("Erro ao carregar texto para duplicar");
      }
    } catch (error) {
      console.error("Erro ao duplicar texto:", error);
      toast.error("Erro ao duplicar texto");
    }
  }

  // Função para exportar texto
  async function handleExport(format: 'pdf' | 'docx' | 'txt') {
    if (!titulo.trim() || !conteudo.trim()) {
      toast.error("Texto vazio não pode ser exportado");
      return;
    }

    try {
      if (format === 'txt') {
        // Exportar como TXT (direto no navegador)
        const blob = new Blob([`${titulo}\n\n${conteudo}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${titulo}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Texto exportado como TXT!");
      } else if (format === 'pdf' || format === 'docx') {
        // Exportar via API
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo,
            conteudo,
            format,
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${titulo}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(`Texto exportado como ${format.toUpperCase()}!`);
        } else {
          toast.error(`Erro ao exportar como ${format.toUpperCase()}`);
        }
      }
    } catch (error) {
      console.error("Erro ao exportar texto:", error);
      toast.error("Erro ao exportar texto");
    }

    setShowExportModal(false);
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

  // Função para buscar e exibir ficha no modal
  async function handleFichaClick(fichaSlug: string) {
    setLoadingFicha(true);
    setShowFichaModal(true);
    
    try {
      const response = await fetch(`/api/fichas/${fichaSlug}`);
      if (!response.ok) {
        toast.error("Ficha não encontrada");
        setShowFichaModal(false);
        return;
      }
      
      const data = await response.json();
      // A API retorna { ficha: {...} }
      setFichaData(data.ficha);
    } catch (error) {
      console.error("Erro ao buscar ficha:", error);
      toast.error("Erro ao carregar ficha");
      setShowFichaModal(false);
    } finally {
      setLoadingFicha(false);
    }
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            
            {/* Botão Opções (Três Pontinhos) */}
            {isMetadataSaved && (
              <button
                onClick={() => setShowMobileOptionsMenu(true)}
                className="p-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
                title="Opções"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Botão de expandir sidebar desktop (quando colapsada) */}
        {!isSidebarOpen && (
          <div className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-12 bg-light-raised dark:bg-dark-raised flex-col items-center pt-4 gap-3 z-40">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
              title="Abrir barra lateral"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        )}

        {/* Container flex para Editor + Chat */}
        <div className={clsx(
          "flex-1 flex gap-6 overflow-hidden transition-all duration-300 max-w-[1328px] mx-auto",
          !isSidebarOpen && "ml-12 md:ml-12"
        )}>
          {/* Editor Principal */}
          <main className="overflow-y-auto transition-all duration-300 w-full pb-24">
            {/* NOVO HEADER FIXO */}
            {isMetadataSaved && (
              <EditorHeader
                isMetadataSaved={isMetadataSaved}
                enterFocusMode={enterFocusMode}
                titulo={titulo}
                isHeaderExpanded={isHeaderExpanded}
                setIsHeaderExpanded={setIsHeaderExpanded}
                hasUnsavedMetadataChanges={hasUnsavedMetadataChanges}
                setShowUnsavedChangesModal={setShowUnsavedChangesModal}
                showUrizen={showUrizen}
                showUrthona={showUrthona}
                setShowUrizen={setShowUrizen}
                setShowUrthona={setShowUrthona}
                showOptionsMenu={showOptionsMenu}
                setShowOptionsMenu={setShowOptionsMenu}
                setShowStatsModal={setShowStatsModal}
                setShowExportModal={setShowExportModal}
                handleDuplicate={handleDuplicate}
                handleDelete={handleDelete}
                currentTextoId={currentTextoId}
                editorRef={editorRef}
              />
            )}
            
            <div className="max-w-4xl mx-auto px-8 py-8 min-h-full">
            <div className="space-y-6 pb-3">
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
                      <div className="grid grid-cols-4 gap-4 mt-6">
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
                  <div className="grid grid-cols-4 gap-4 mt-6">
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
                <div className="-mt-4">
                  <TiptapEditor
                    value={conteudo}
                    onChange={(value) => setConteudo(value)}
                    placeholder="Escreva seu texto aqui..."
                    className="w-full min-h-[400px] rounded-lg"
                    onTextSelect={(text, position) => {
                      setSelectedText(text);
                      setSelectionMenuPosition(position);
                    }}
                    showToolbar={false}
                    editorRef={editorRef}
                  />
                </div>
              )}

              {/* FABs removidos - agora usando EditorFooter component */}
            </div>
          </div>
        </main>
        
        {/* NOVO FOOTER FIXO */}
        {isMetadataSaved && (
          <EditorFooter
            isSaving={isSaving}
            titulo={titulo}
            handleSave={handleSave}
            handlePublish={handlePublish}
          />
        )}
        
        {/* MODAL DE EXPORTAÇÃO */}
        <ExportModal
          showExportModal={showExportModal}
          setShowExportModal={setShowExportModal}
          handleExport={handleExport}
        />
        
        {/* MENU MOBILE DE OPÇÕES */}
        <MobileOptionsMenu
          showMobileOptionsMenu={showMobileOptionsMenu}
          setShowMobileOptionsMenu={setShowMobileOptionsMenu}
          handlePublish={handlePublish}
          setShowUrizen={setShowUrizen}
          setShowUrthona={setShowUrthona}
          setShowExportModal={setShowExportModal}
          handleDuplicate={handleDuplicate}
          setShowStatsModal={setShowStatsModal}
          handleDelete={handleDelete}
          currentTextoId={currentTextoId}
          isMetadataSaved={isMetadataSaved}
        />

        {/* Chat Lateral com Assistentes */}
        {(showUrthona || showUrizen) && (
          <div 
            className="fixed bg-light-base dark:bg-dark-base overflow-hidden flex flex-col shadow-2xl rounded-lg border border-gray-300 dark:border-gray-600"
            style={{
              left: chatPosition.x || 'auto',
              top: chatPosition.y || 80,
              right: chatPosition.x ? 'auto' : 16,
              width: `${chatSize.width}px`,
              height: `${chatSize.height}px`,
              zIndex: 1000,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
          >
            <div ref={chatRef} className="flex flex-col h-full px-4 pt-4 pb-4">
              {/* Header do Chat (Draggable) */}
              <div 
                className="flex justify-between items-center mb-4 pb-4 cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                  setIsDragging(true);
                  setDragStart({
                    x: e.clientX - (chatPosition.x || (window.innerWidth - chatSize.width - 16)),
                    y: e.clientY - (chatPosition.y || 80)
                  });
                }}
              >
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
                      "flex gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={clsx(
                        "max-w-3xl rounded-2xl px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-primary-600 dark:bg-primary-500 text-white"
                          : "bg-transparent border border-border-light-default dark:border-border-dark-default text-text-light-secondary dark:text-dark-secondary"
                      )}
                    >
                      <div 
                        className={clsx(
                          "prose prose-sm max-w-none [&>*:last-child]:mb-0",
                          msg.role === "user" 
                            ? "prose-invert" 
                            : "prose-stone dark:prose-invert"
                        )}
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6'
                        }}
                      >
                        {msg.role === "assistant" ? (
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ node, href, children, ...props }) => {
                                // Interceptar links que apontam para fichas
                                if (href && href.startsWith('/ficha/')) {
                                  const fichaSlug = href.replace('/ficha/', '');
                                  return (
                                    <a
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleFichaClick(fichaSlug);
                                      }}
                                      className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                                      {...props}
                                    >
                                      {children}
                                    </a>
                                  );
                                }
                                
                                // FALLBACK: Links vazios com texto (ex: [Joaquim]())
                                // Tentar usar o texto como slug
                                if (!href || href === '' || href === '#') {
                                  const childText = typeof children === 'string' ? children : 
                                    (Array.isArray(children) && typeof children[0] === 'string' ? children[0] : '');
                                  
                                  if (childText) {
                                    // Converter texto para slug (minúsculas, espaços para hífens)
                                    const fichaSlug = childText.toLowerCase()
                                      .normalize('NFD')
                                      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                                      .replace(/\s+/g, '-') // Espaços para hífens
                                      .replace(/[^a-z0-9-]/g, ''); // Remove caracteres especiais
                                    
                                    return (
                                      <a
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleFichaClick(fichaSlug);
                                        }}
                                        className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                                        {...props}
                                      >
                                        {children}
                                      </a>
                                    );
                                  }
                                }
                                
                                // Links normais abrem em nova aba
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 dark:text-primary-400 hover:underline"
                                    {...props}
                                  >
                                    {children}
                                  </a>
                                );
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="flex gap-2 items-end pt-4">
                <textarea
                  ref={chatInputRef}
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAssistantMessage(showUrthona ? "urthona" : "urizen");
                    }
                  }}
                  placeholder="Mensagem..."
                  rows={1}
                  className="flex-1 px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-dark-tertiary outline-none focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 resize-none max-h-24 overflow-y-auto"
                  disabled={isAssistantLoading}
                  style={{
                    fontSize: '14px',
                    height: 'auto',
                    minHeight: '40px',
                    maxHeight: '96px',
                    boxShadow: 'none'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    const newHeight = Math.min(target.scrollHeight, 96);
                    target.style.height = `${newHeight}px`;
                  }}
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
            
            {/* Resize Handle */}
            <div
              className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsResizing(true);
                setResizeStart({
                  x: e.clientX,
                  y: e.clientY,
                  width: chatSize.width,
                  height: chatSize.height
                });
              }}
              title="Redimensionar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15l-6 6M21 9l-12 12" strokeLinecap="round" />
              </svg>
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

      {/* Menu Flutuante de Seleção de Texto */}
      {selectionMenuPosition && selectedText && (
        <>
          {/* Backdrop invisível para fechar o menu */}
          <div
            className="fixed inset-0 z-[9990]"
            onClick={() => {
              setSelectionMenuPosition(null);
              setSelectedText("");
            }}
          />
          
          {/* Menu */}
          <div
            className="fixed z-[9991] bg-light-base dark:bg-dark-base rounded-lg shadow-md border border-border-light-default dark:border-border-dark-default overflow-hidden"
            style={{
              left: `${selectionMenuPosition.x}px`,
              top: `${selectionMenuPosition.y - 60}px`, // 60px acima da seleção
              transform: 'translateX(-50%)'
            }}
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-center gap-3 p-2">
                {/* Avatar Urthona */}
                <button
                  onClick={() => {
                    if (!isMetadataSaved) return;
                    setShowUrthona(true);
                    setShowUrizen(false);
                    // Preencher o campo de input com o trecho selecionado
                    setAssistantInput(`Sobre o trecho "${selectedText}", me diga: `);
                    setSelectionMenuPosition(null);
                    setSelectedText("");
                  }}
                  disabled={!isMetadataSaved}
                  className={clsx(
                    "w-10 h-10 rounded-full transition-all",
                    isMetadataSaved
                      ? "hover:scale-110 cursor-pointer"
                      : "opacity-30 cursor-not-allowed"
                  )}
                  title={isMetadataSaved ? "Perguntar para Urthona" : "Crie um texto primeiro"}
                >
                  <img
                    src="/urthona-avatar.png"
                    alt="Urthona"
                    className="w-full h-full rounded-full object-cover"
                  />
                </button>
                
                {/* Avatar Urizen */}
                <button
                  onClick={() => {
                    if (!isMetadataSaved) return;
                    setShowUrizen(true);
                    setShowUrthona(false);
                    // Preencher o campo de input com o trecho selecionado
                    setAssistantInput(`Sobre o trecho "${selectedText}", me diga: `);
                    setSelectionMenuPosition(null);
                    setSelectedText("");
                  }}
                  disabled={!isMetadataSaved}
                  className={clsx(
                    "w-10 h-10 rounded-full transition-all",
                    isMetadataSaved
                      ? "hover:scale-110 cursor-pointer"
                      : "opacity-30 cursor-not-allowed"
                  )}
                  title={isMetadataSaved ? "Perguntar para Urizen" : "Crie um texto primeiro"}
                >
                  <img
                    src="/urizen-avatar.png"
                    alt="Urizen"
                    className="w-full h-full rounded-full object-cover"
                  />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modo Foco - Fullscreen */}
      {isFocusMode && (
        <div className="fixed inset-0 z-50 bg-light-base dark:bg-dark-base flex flex-col">
          {/* Header do Modo Foco */}
          <div className="flex justify-between items-center px-8 py-4 border-b border-border-light-default dark:border-border-dark-default">
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
              {titulo || "Sem título"}
            </h1>
            
            <div className="flex items-center gap-4">
              {/* Indicador de Auto-save */}
              {lastSaveTime && (
                <div className="text-xs text-text-light-tertiary dark:text-dark-tertiary">
                  Salvo {lastSaveTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              
              {/* Controles de Foco */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFocusType(prev => prev === 'sentence' ? 'off' : 'sentence')}
                  className={clsx(
                    "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                    focusType === 'sentence'
                      ? "bg-primary-500 text-white"
                      : "bg-light-overlay dark:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary hover:bg-light-raised dark:hover:bg-dark-raised"
                  )}
                  title="Foco em Sentença (Ctrl+Shift+F)"
                >
                  Sentença
                </button>
                <button
                  onClick={() => setFocusType(prev => prev === 'paragraph' ? 'off' : 'paragraph')}
                  className={clsx(
                    "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                    focusType === 'paragraph'
                      ? "bg-primary-500 text-white"
                      : "bg-light-overlay dark:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary hover:bg-light-raised dark:hover:bg-dark-raised"
                  )}
                  title="Foco em Parágrafo (Ctrl+Shift+P)"
                >
                  Parágrafo
                </button>
                <button
                  onClick={() => setTypewriterMode(prev => !prev)}
                  className={clsx(
                    "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                    typewriterMode
                      ? "bg-primary-500 text-white"
                      : "bg-light-overlay dark:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary hover:bg-light-raised dark:hover:bg-dark-raised"
                  )}
                  title="Modo Máquina de Escrever (Ctrl+Shift+T)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              {/* Avatares dos Assistentes */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUrthona(!showUrthona);
                    if (!showUrthona) setShowUrizen(false);
                  }}
                  className="w-10 h-10 rounded-full hover:ring-2 hover:ring-[#C85A54] transition-all"
                  title="Urthona (Criativo)"
                >
                  <img src="/urthona-avatar.png" alt="Urthona" className="w-full h-full rounded-full" />
                </button>
                <button
                  onClick={() => {
                    setShowUrizen(!showUrizen);
                    if (!showUrizen) setShowUrthona(false);
                  }}
                  className="w-10 h-10 rounded-full hover:ring-2 hover:ring-[#5B7C8D] transition-all"
                  title="Urizen (Consulta)"
                >
                  <img src="/urizen-avatar.png" alt="Urizen" className="w-full h-full rounded-full" />
                </button>
              </div>
              
              {/* Botão Sair */}
              <button
                onClick={exitFocusMode}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                title="Sair do Modo Foco (ESC)"
              >
                Sair
              </button>
            </div>
          </div>
          
          {/* Editor em Fullscreen */}
          <div className="flex-1 flex overflow-hidden">
            {/* Área do Editor */}
            <div className={clsx(
              "flex-1 overflow-y-auto transition-all duration-300",
              (showUrthona || showUrizen) ? "mr-96" : ""
            )}>
              <div className="max-w-4xl mx-auto px-16 py-12">
                <TiptapEditor
                  value={conteudo}
                  onChange={(value) => setConteudo(value)}
                  placeholder="Escreva seu texto aqui..."
                  className={clsx(
                    "w-full min-h-[calc(100vh-12rem)] bg-transparent border-none",
                    typewriterMode && "typewriter-mode"
                  )}
                  onTextSelect={(text, position) => {
                    setSelectedText(text);
                    setSelectionMenuPosition(position);
                  }}
                  focusType={focusType}
                  typewriterMode={typewriterMode}
                  isFocusMode={true}
                  showToolbar={false}
                />
              </div>
            </div>
            
            {/* Chat Lateral com Assistentes no Modo Foco */}
            {(showUrthona || showUrizen) && (
              <div className="w-96 h-full bg-light-raised dark:bg-dark-raised border-l border-border-light-default dark:border-border-dark-default overflow-hidden flex flex-col">
                <div className="flex flex-col h-full px-4 pt-4 pb-32">
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          "flex gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={clsx(
                            "max-w-[85%] px-4 py-2 rounded-lg",
                            msg.role === "user"
                              ? "bg-primary-500 text-white"
                              : "bg-light-overlay dark:bg-dark-overlay text-text-light-primary dark:text-dark-primary"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input */}
                  <div className="fixed bottom-0 right-0 w-96 p-4 bg-light-raised dark:bg-dark-raised border-t border-border-light-default dark:border-border-dark-default">
                    <div className="flex gap-2">
                      <textarea
                        value={assistantInput}
                        onChange={(e) => setAssistantInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAssistantMessage(showUrthona ? "urthona" : "urizen");
                          }
                        }}
                        placeholder="Mensagem..."
                        rows={1}
                        className="flex-1 px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-dark-tertiary outline-none focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 text-sm resize-none max-h-24 overflow-y-auto"
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          const newHeight = Math.min(target.scrollHeight, 96);
                          target.style.height = `${newHeight}px`;
                        }}
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
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de Ficha */}
      {showFichaModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]"
          onClick={() => setShowFichaModal(false)}
        >
          <div 
            className="bg-light-base dark:bg-dark-base rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingFicha ? (
              <div className="flex items-center justify-center py-24">
                <svg className="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : fichaData ? (
              <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  {/* Header com badge de tipo e botão fechar */}
                  <div className="flex items-start justify-between border-b border-border-light-default dark:border-border-dark-default pb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="primary" size="sm">
                          {fichaData.tipo === 'episodio' ? 'Episódio' :
                           fichaData.tipo === 'personagem' ? 'Personagem' :
                           fichaData.tipo === 'local' ? 'Local' :
                           fichaData.tipo === 'evento' ? 'Evento' :
                           fichaData.tipo === 'conceito' ? 'Conceito' :
                           fichaData.tipo === 'regra' ? 'Regra' :
                           fichaData.tipo === 'objeto' ? 'Objeto' :
                           fichaData.tipo}
                        </Badge>
                        {fichaData.codigo && (
                          <Badge variant="default" size="sm">
                            {fichaData.codigo}
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                        {fichaData.titulo || fichaData.nome || 'Sem título'}
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowFichaModal(false)}
                      className="p-2 rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
                      aria-label="Fechar"
                    >
                      <svg className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Imagem de capa */}
                  {fichaData.imagem_capa && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={fichaData.imagem_capa}
                        alt={fichaData.titulo}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}

                  {/* Resumo */}
                  {fichaData.resumo && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                        Resumo
                      </h3>
                      <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
                        {fichaData.resumo}
                      </p>
                    </div>
                  )}

                  {/* Descrição */}
                  {fichaData.descricao && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                        Descrição
                      </h3>
                      <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
                        {fichaData.descricao}
                      </p>
                    </div>
                  )}

                  {/* Conteúdo */}
                  {fichaData.conteudo && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                        Conteúdo
                      </h3>
                      <p className="text-base text-text-light-primary dark:text-dark-primary leading-relaxed whitespace-pre-wrap">
                        {fichaData.conteudo}
                      </p>
                    </div>
                  )}

                  {/* Ano Diegese */}
                  {fichaData.ano_diegese && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                        Ano Diegese
                      </h3>
                      <p className="text-base text-text-light-primary dark:text-dark-primary">
                        {fichaData.ano_diegese}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {fichaData.tags && fichaData.tags.trim() !== '' && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-light-secondary dark:text-dark-secondary uppercase tracking-wide mb-2">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {fichaData.tags.split(',').map((tag: string, index: number) => (
                          <Badge key={index} variant="default" size="sm">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botão Abrir ficha no Catálogo */}
                  <div className="pt-4 border-t border-border-light-default dark:border-border-dark-default">
                    <a
                      href={`/catalog?ficha=${fichaData.slug || fichaData.titulo?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      Abrir ficha no Catálogo
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-light-tertiary dark:text-dark-tertiary">
                Ficha não encontrada
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Estatísticas */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-light-default dark:border-border-dark-default">
              <h2 className="text-xl font-semibold text-text-light-primary dark:text-dark-primary">Estatísticas do Texto</h2>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              {/* Palavras */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Palavras</span>
                </div>
                <span className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                  {conteudo.trim() ? conteudo.trim().split(/\s+/).length : 0}
                </span>
              </div>

              {/* Caracteres */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Caracteres</span>
                </div>
                <span className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                  {conteudo.length}
                </span>
              </div>

              {/* Parágrafos */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Parágrafos</span>
                </div>
                <span className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                  {conteudo.trim() ? conteudo.trim().split(/\n\n+/).filter(p => p.trim()).length : 0}
                </span>
              </div>

              {/* Tempo de Leitura */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-light-bg-tertiary dark:bg-dark-bg-tertiary">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Tempo de Leitura</span>
                </div>
                <span className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                  {Math.ceil((conteudo.trim() ? conteudo.trim().split(/\s+/).length : 0) / 200)} min
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border-light-default dark:border-border-dark-default">
              <button
                onClick={() => setShowStatsModal(false)}
                className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
              >
                Fechar
              </button>
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
