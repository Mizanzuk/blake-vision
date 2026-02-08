'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { Header } from '@/app/components/layout/Header';
import TiptapEditor from '@/components/TiptapEditor';
import { FontFamily } from '@/components/FontSelector';
import { createClient } from '@/app/lib/supabase/client';
import { toast } from 'sonner';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Input, Textarea } from '@/app/components/ui';
import WorldModal from '@/app/components/catalog/WorldModal';
import CategoryModal from '@/app/components/catalog/CategoryModal';
import { UniverseDropdown } from '@/app/components/ui';
import { WorldsDropdownSingle } from '@/app/components/ui/WorldsDropdownSingle';
import { EpisodesDropdownSingle } from '@/app/components/ui/EpisodesDropdownSingle';
import { CategoryDropdownSingle } from '@/app/components/ui/CategoryDropdownSingle';
import { MetadataModal, MobileMenu } from '@/app/components/escrita/MobileComponents';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function EscritaPageContent() {
  console.log('✅ COMPONENTE ESCRITA MONTADO - Build:', Date.now());
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  // Estados do Header
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentTextId, setCurrentTextId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'rascunho' | 'publicado'>('rascunho');
  const [isMetadataSaved, setIsMetadataSaved] = useState(false); // Controla se metadados foram salvos
  const [isMetadataLocked, setIsMetadataLocked] = useState(false); // Controla se campos estão bloqueados
  const [hasUnsavedMetadataChanges, setHasUnsavedMetadataChanges] = useState(false); // Detecta alterações
  const [savedMetadataSnapshot, setSavedMetadataSnapshot] = useState<any>(null); // Snapshot dos metadados salvos
  
  // Estado da Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"rascunhos" | "publicados">("rascunhos");
  const [rascunhos, setRascunhos] = useState<any[]>([]);
  const [publicados, setPublicados] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategorias, setFilterCategorias] = useState<string[]>([]);
  const [draggedTextoId, setDraggedTextoId] = useState<string | null>(null);
  const [dragOverTextoId, setDragOverTextoId] = useState<string | null>(null);
  
  // Estados do Editor
  const [conteudo, setConteudo] = useState("");
  const [universeId, setUniverseId] = useState<string>("");
  const [universes, setUniverses] = useState<any[]>([]); // Lista de universos disponíveis
  const [worlds, setWorlds] = useState<any[]>([]); // Lista de mundos disponíveis
  const [worldId, setWorldId] = useState<string>("");
  const [episodes, setEpisodes] = useState<any[]>([]); // Lista de episódios disponíveis
  const [episodio, setEpisodio] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]); // Lista de categorias disponíveis
  const [categoria, setCategoria] = useState<string>("");
  const [allFichas, setAllFichas] = useState<any[]>([]); // Todas as fichas do catálogo
  const [availableEpisodes, setAvailableEpisodes] = useState<string[]>([]); // Episódios filtrados por mundo
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const editorRef = useRef<any>(null);
  
  // Estados do Menu Três Pontos e Modo Foco
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showStylesDropdown, setShowStylesDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Menu mobile expansível
  const [showMetadataModal, setShowMetadataModal] = useState(false); // Modal fullscreen de metadados
  const [modoFoco, setModoFoco] = useState(false);
  const [temaFoco, setTemaFoco] = useState<'normal' | 'light' | 'dark'>('normal');
  const [focusType, setFocusType] = useState<'off' | 'sentence' | 'paragraph'>('off');
  const [menuFocoExpanded, setMenuFocoExpanded] = useState(false);
  const [menuFocoPosition, setMenuFocoPosition] = useState(() => {
    // Tentar carregar posição salva do localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('menuFocoPosition');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    // Posição inicial: mais centralizada (160px da esquerda, próximo à margem do texto)
    return { x: 160, y: 120 };
  });
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  const menuFocoRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const stylesDropdownRef = useRef<HTMLDivElement>(null);
  
  // Estados do Modal de Confirmação
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [textoToDelete, setTextoToDelete] = useState<{id: string, titulo: string} | null>(null);
  const [isDeletingTexto, setIsDeletingTexto] = useState(false);
  
  // Estado do Modal de Sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados dos Modais de Estatísticas e Exportar
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Estados dos Modais de Criação
  const [showCreateUniverseModal, setShowCreateUniverseModal] = useState(false);
  const [showCreateWorldModal, setShowCreateWorldModal] = useState(false);
  const [showCreateEpisodeModal, setShowCreateEpisodeModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [universeForm, setUniverseForm] = useState({ id: '', nome: '', descricao: '' });
  const [worldToEdit, setWorldToEdit] = useState<any>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [isSubmittingUniverse, setIsSubmittingUniverse] = useState(false);
  
  // Estados para Editar/Deletar Universo
  const [showEditUniverseModal, setShowEditUniverseModal] = useState(false);
  const [showDeleteUniverseModal, setShowDeleteUniverseModal] = useState(false);
  const [universeToDelete, setUniverseToDelete] = useState<{id: string, nome: string} | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  
  // Estados da Seleção de Texto (Bubble Menu)
  const [selectedText, setSelectedText] = useState('');
  const [selectionMenuPosition, setSelectionMenuPosition] = useState<{x: number, y: number} | null>(null);
  
  // Estados dos Agentes Flutuantes
  const [showUrthona, setShowUrthona] = useState(false);
  const [showUrizen, setShowUrizen] = useState(false);
  const [urthonaMessages, setUrthonaMessages] = useState<any[]>([]);
  const [urizenMessages, setUrizenMessages] = useState<any[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  
  // Estados para drag and drop do chat
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
  
  // Refs
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Função para obter cores baseadas no tema do modo foco
  const getFocoThemeColors = () => {
    switch (temaFoco) {
      case 'light':
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-50',
          secondary: 'bg-gray-100',
          textSecondary: 'text-gray-600'
        };
      case 'dark':
        return {
          bg: 'bg-[#0a0a0a]',           // Preto quase puro para imersão total
          text: 'text-[#e8e8e8]',        // Branco suave, não cansa
          border: 'border-[#2a2a2a]',    // Borda sutil
          hover: 'hover:bg-[#1a1a1a]',   // Hover discreto
          secondary: 'bg-[#1a1a1a]',     // Fundo secundário
          textSecondary: 'text-[#b8b8b8]' // Texto secundário legível
        };
      case 'normal':
      default:
        return {
          bg: 'bg-light-base dark:bg-dark-base',
          text: 'text-text-light-primary dark:text-dark-primary',
          border: 'border-border-light-default dark:border-border-dark-default',
          hover: 'hover:bg-light-overlay dark:hover:bg-dark-overlay',
          secondary: 'bg-light-overlay dark:bg-dark-overlay',
          textSecondary: 'text-text-light-secondary dark:text-dark-secondary'
        };
    }
  };
  
  // Handle mouse move para drag and drop
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
        const newHeight = Math.max(300, resizeStart.height + (e.clientY - resizeStart.y));
        setChatSize({ width: newWidth, height: newHeight });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);
  
  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [urthonaMessages, urizenMessages]);
  
  // Auto-resize do textarea do chat quando assistantInput mudar
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      const newHeight = Math.min(chatInputRef.current.scrollHeight, 96);
      chatInputRef.current.style.height = `${newHeight}px`;
    }
  }, [assistantInput]);
  
  // Detectar alterações nos metadados
  useEffect(() => {
    if (!isMetadataLocked && savedMetadataSnapshot) {
      const hasChanges = 
        titulo !== savedMetadataSnapshot.titulo ||
        universeId !== savedMetadataSnapshot.universeId;
      
      setHasUnsavedMetadataChanges(hasChanges);
    }
  }, [titulo, universeId, isMetadataLocked, savedMetadataSnapshot]);
  
  // Auto-save a cada 30 segundos (apenas para textos RASCUNHO abertos)
  // DESABILITADO quando metadados estão expandidos para evitar fechar durante edição
  // DESABILITADO para textos publicados (não devem ser editados automaticamente)
  useEffect(() => {
    if (!conteudo || !currentTextId || isHeaderExpanded || currentStatus !== 'rascunho') return;
    
    const autoSaveInterval = setInterval(() => {
      handleSave(true); // true = auto-save silencioso
    }, 30000); // 30 segundos
    
    return () => clearInterval(autoSaveInterval);
  }, [conteudo, currentTextId, isHeaderExpanded, currentStatus]);
  
  // Fechar modais com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSuccessModal) {
          setShowSuccessModal(false);
        } else if (showDeleteConfirm && !isDeletingTexto) {
          setShowDeleteConfirm(false);
          setTextoToDelete(null);
        }
      }
    };
    
    if (showDeleteConfirm || showSuccessModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDeleteConfirm, showSuccessModal, isDeletingTexto]);
  
  // Fechar menu de opções ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
      if (stylesDropdownRef.current && !stylesDropdownRef.current.contains(event.target as Node)) {
        setShowStylesDropdown(false);
      }
    };
    
    if (showOptionsMenu || showStylesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptionsMenu, showStylesDropdown]);
  
  // ESC hierárquico: chat > menu > modo foco
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Prioridade 1: Fechar chat se estiver aberto
        if (showUrthona || showUrizen) {
          event.preventDefault();
          event.stopPropagation();
          setShowUrthona(false);
          setShowUrizen(false);
          return;
        }
        
        // Prioridade 2: Recolher menu se estiver expandido (apenas no modo foco)
        if (modoFoco && menuFocoExpanded) {
          event.preventDefault();
          event.stopPropagation();
          setMenuFocoExpanded(false);
          return;
        }
        
        // Prioridade 3: Sair do modo foco
        if (modoFoco) {
          event.preventDefault();
          event.stopPropagation();
          setModoFoco(false);
          // Sair de tela cheia se estiver
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          return;
        }
      }
    };
    
    if (showUrthona || showUrizen || modoFoco) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showUrthona, showUrizen, modoFoco, menuFocoExpanded]);
  
  // Drag do menu flutuante no modo foco
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingMenu) {
        setMenuFocoPosition({
          x: e.clientX - 100, // Offset para centralizar no cursor
          y: e.clientY - 20
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDraggingMenu(false);
      // Salvar posição no localStorage quando soltar o menu
      if (typeof window !== 'undefined') {
        localStorage.setItem('menuFocoPosition', JSON.stringify(menuFocoPosition));
      }
    };
    
    if (isDraggingMenu) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingMenu]);
  
  // Debug: Monitorar mudanças no fontFamily
  useEffect(() => {
    console.log('[DEBUG] fontFamily mudou para:', fontFamily);
  }, [fontFamily]);

  // Carregar lista de textos e universos ao montar componente
  useEffect(() => {
    loadTextos();
    loadUniversesAndWorlds();
  }, []);

  // Load selected universe from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("selectedUniverseId");
    if (saved) {
      setUniverseId(saved);
    }
  }, []);

  // Listen for universe changes from other pages
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "selectedUniverseId" && event.newValue) {
        console.log("🔄 Universo sincronizado de outra página:", event.newValue);
        setUniverseId(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  // Save selected universe to localStorage when it changes
  useEffect(() => {
    if (universeId) {
      localStorage.setItem("selectedUniverseId", universeId);
    }
  }, [universeId]);
  
  // Event listeners para modal de metadados
  useEffect(() => {
    const handleOpenModal = () => setShowMetadataModal(true);
    const handleUnlock = () => setIsMetadataLocked(false);
    
    window.addEventListener('openMetadataModal', handleOpenModal);
    window.addEventListener('unlockMetadata', handleUnlock);
    
    return () => {
      window.removeEventListener('openMetadataModal', handleOpenModal);
      window.removeEventListener('unlockMetadata', handleUnlock);
    };
  }, []);
  
  // Carregar texto específico da URL
  useEffect(() => {
    const textoId = searchParams.get("id");
    if (textoId && textoId !== currentTextId) {
      loadTexto(textoId);
    } else if (!textoId && currentTextId) {
      // Limpar estado quando navega para /escrita sem id
      handleNewTexto();
    }
  }, [searchParams, currentTextId]);
  
  // Função para carregar texto do banco
  const loadTexto = async (id: string) => {
    try {
      const response = await fetch(`/api/textos?id=${id}`);
      const data = await response.json();
      
      if (response.ok && data.texto) {
        const texto = data.texto;
        console.log('=== loadTexto DEBUG ===');
        console.log('texto.id:', texto.id);
        console.log('texto.universe_id:', texto.universe_id);
        console.log('texto.titulo:', texto.titulo);
        
        setCurrentTextId(texto.id);
        setTitulo(texto.titulo || "");
        setConteudo(texto.conteudo || "");
        setUniverseId(texto.universe_id || "");
        setCurrentStatus(texto.status || 'rascunho');
        setLastSaved(new Date(texto.updated_at));
        
        // Marcar metadados como salvos e bloquear se o texto já existe
        if (texto.universe_id) {
          console.log('Marcando isMetadataSaved = true e isMetadataLocked = true');
          setIsMetadataSaved(true);
          setIsMetadataLocked(true);
          setIsHeaderExpanded(false); // Começar colapsado para textos existentes
          
          // Salvar snapshot dos metadados
          setSavedMetadataSnapshot({
            titulo: texto.titulo || "",
            universeId: texto.universe_id || ""
          });
        } else {
          console.log('universe_id vazio, isMetadataSaved = false');
          setIsMetadataSaved(false);
          setIsMetadataLocked(false);
        }
      } else {
        toast.error("Erro ao carregar texto");
      }
    } catch (error) {
      console.error("Erro ao carregar texto:", error);
      toast.error("Erro ao carregar texto");
    }
  };
  
  // Função para carregar lista de textos
  const loadTextos = async () => {
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
    }
  };
  
  // Função para carregar universos e mundos
  const loadUniversesAndWorlds = async () => {
    try {
      // Carregar universos
      const universesRes = await fetch("/api/universes");
      const universesData = await universesRes.json();
      if (universesRes.ok && universesData.universes) {
        setUniverses(universesData.universes);
      }

      // Carregar mundos
      const worldsRes = await fetch("/api/worlds");
      const worldsData = await worldsRes.json();
      if (worldsRes.ok && worldsData.worlds) {
        setWorlds(worldsData.worlds);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };
  
  // Carregar fichas e categorias quando universeId muda
  useEffect(() => {
    if (universeId) {
      // Carregar fichas do catálogo
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

  // Função para selecionar texto da lista
  const handleSelectTexto = (texto: any) => {
    router.push(`/escrita?id=${texto.id}`);
  };
  
  // Função para criar novo texto
  const handleNewTexto = () => {
    setCurrentTextId(null);
    setTitulo("");
    setConteudo("");
    setUniverseId("");
    setWorldId("");
    setEpisodio("");
    setCategoria("");
    setIsMetadataSaved(false);
    setIsMetadataLocked(false);
    setIsHeaderExpanded(true);
    setSavedMetadataSnapshot(null);
    setHasUnsavedMetadataChanges(false);
    router.push("/escrita");
  };
  
  // Função para lidar com seleção de texto
  const handleTextSelect = (text: string, position: { x: number; y: number }) => {
    setSelectedText(text);
    setSelectionMenuPosition(position);
  };
  

  
  // Função para duplicar texto
  const handleDuplicate = async () => {
    if (!currentTextId) {
      toast.error("Nenhum texto selecionado para duplicar");
      return;
    }

    try {
      const response = await fetch(`/api/textos?id=${currentTextId}`);
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
  };
  
  // Função para exportar texto
  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
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
  };
  
  // Função para abrir modal de confirmação de delete
  const handleDelete = (id: string, titulo: string) => {
    setTextoToDelete({ id, titulo });
    setShowDeleteConfirm(true);
  };
  
  // Função para deletar texto do menu três pontinhos
  const handleDeleteCurrentTexto = () => {
    if (currentTextId && titulo) {
      handleDelete(currentTextId, titulo);
    } else {
      toast.error("Nenhum texto selecionado para excluir");
    }
  };
  
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
  
  // Função para confirmar delete
  const confirmDelete = async () => {
    if (!textoToDelete) return;
    
    setIsDeletingTexto(true);
    
    try {
      const response = await fetch(`/api/textos?id=${textoToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Se é o texto atual, limpar editor
        if (textoToDelete.id === currentTextId) {
          handleNewTexto();
        }
        
        loadTextos();
        setShowDeleteConfirm(false);
        setTextoToDelete(null);
        setSuccessMessage('Texto apagado com sucesso!');
        setShowSuccessModal(true);
      } else {
        toast.error('Erro ao deletar texto');
      }
    } catch (error) {
      console.error("Erro ao deletar texto:", error);
      toast.error('Erro ao deletar texto');
    } finally {
      setIsDeletingTexto(false);
    }
  };
  
  // Função para editar título
  const handleEditTitle = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Novo título:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    try {
      const response = await fetch(`/api/textos?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, titulo: newTitle }),
      });

      if (response.ok) {
        toast.success("Título atualizado!");
        
        // Se é o texto atual, atualizar no editor
        if (id === currentTextId) {
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
  };
  
  // Função para download do texto
  const handleDownload = (texto: any) => {
    const blob = new Blob([texto.conteudo], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${texto.titulo || "texto"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Função para entrar no modo foco com tela cheia
  const enterModoFoco = async () => {
    setModoFoco(true);
    setMenuFocoExpanded(false);
    
    // Entrar em tela cheia
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.log('Erro ao entrar em tela cheia:', err);
    }
  };
  
  // Funções de drag and drop
  const handleDragStart = (id: string) => {
    setDraggedTextoId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedTextoId !== id) {
      setDragOverTextoId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedTextoId(null);
    setDragOverTextoId(null);
  };
  
  // Helper functions para categorias
  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      "personagem": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      "local": "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      "objeto": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
      "evento": "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
      "conceito": "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
    };
    return colors[categoria] || "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
  };

  const getCategoryLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      "personagem": "Personagem",
      "local": "Local",
      "objeto": "Objeto",
      "evento": "Evento",
      "conceito": "Conceito",
    };
    return labels[categoria] || categoria;
  };
  
  // Filtrar textos
  const textos = activeTab === "rascunhos" ? rascunhos : publicados;
  const filteredTextos = textos.filter(texto => {
    // Filtro de busca
    if (searchQuery && !texto.titulo.toLowerCase().includes(searchQuery.toLowerCase())) {
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
  
  // Handlers
  const handleSave = async (autoSave = false, overrideStatus?: string) => {
    console.log('🚀🚀🚀 HANDLE SAVE EXECUTADO! 🚀🚀🚀');
    console.log('📊 Estado atual:', { titulo, conteudo: conteudo.substring(0, 50), currentTextId, autoSave });
    
    if (!titulo.trim()) {
      if (!autoSave) toast.error("Por favor, adicione um título");
      return;
    }

    setIsSaving(true);

    try {
      const body = {
        id: currentTextId,
        titulo,
        conteudo,
        universe_id: universeId || null,
        world_id: null,
        episodio: null,
        categoria: null,
        status: overrideStatus || currentStatus, // Usar override se fornecido, senão preservar status atual
      };

      let response;
      if (currentTextId) {
        // Atualizar texto existente
        response = await fetch(`/api/textos?id=${currentTextId}`, {
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
          toast.success(currentTextId ? "Texto atualizado!" : "Texto criado!");
        }
        setLastSaved(new Date());
        
        // Atualizar currentStatus com o valor retornado pela API
        if (data.texto && data.texto.status) {
          setCurrentStatus(data.texto.status);
        }
        
        // Marcar metadados como salvos e bloquear se universeId existe
        if (universeId) {
          setIsMetadataSaved(true);
          setIsMetadataLocked(true);
          setIsHeaderExpanded(false); // Colapsar cabeçalho
          
          // Salvar snapshot dos metadados e resetar flag de alterações
          setSavedMetadataSnapshot({ titulo, universeId });
          setHasUnsavedMetadataChanges(false);
        }
        
        // Se é novo texto, atualizar ID e URL
        if (!currentTextId && data.texto) {
          setCurrentTextId(data.texto.id);
          router.push(`/escrita?id=${data.texto.id}`);
        }
        
        // Recarregar lista de textos
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
  };
  
  const handlePublish = async () => {
    try {
      // Salvar o texto com status publicado
      await handleSave(false, 'publicado');
      
      // Se não tem ID do texto, não pode publicar
      if (!currentTextId) {
        toast.error('Salve o texto antes de publicar');
        return;
      }
      
      // Recarregar lista de textos
      loadTextos();
      
      // Atualizar status local
      setCurrentStatus('publicado');
      
      // Mudar para aba de publicados
      setActiveTab('publicados');
      
      toast.success('Texto publicado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao publicar:', error);
      toast.error('Erro ao publicar texto');
    }
  };
  
  const handleMoveToRascunhos = async () => {
    try {
      if (!currentTextId) {
        toast.error('Nenhum texto selecionado');
        return;
      }
      
      // Atualizar status para rascunho
      const response = await fetch('/api/textos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentTextId,
          status: 'rascunho'
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao mover para rascunhos');
      }
      
      const { texto } = await response.json();
      
      // Remover da lista de publicados
      setPublicados(prev => prev.filter(t => t.id !== currentTextId));
      
      // Adicionar na lista de rascunhos
      setRascunhos(prev => [texto, ...prev]);
      
      // Atualizar status local
      setCurrentStatus('rascunho');
      
      // Mudar para aba de rascunhos
      setActiveTab('rascunhos');
      
      toast.success('Texto movido para rascunhos!');
      
    } catch (error) {
      console.error('Erro ao mover para rascunhos:', error);
      toast.error('Erro ao mover para rascunhos');
    }
  };
  
  const handleUpload = () => {
    if (!currentTextId) {
      toast.error('Nenhum texto selecionado');
      return;
    }
    
    // Extrair texto puro do HTML
    const plainText = conteudo.replace(/<[^>]*>/g, '');
    
    // Construir URL com query params
    const params = new URLSearchParams();
    params.set('text', plainText);
    params.set('documentName', titulo);
    if (universeId) params.set('universeId', universeId);
    if (worldId) params.set('worldId', worldId);
    if (episodio) params.set('unitNumber', episodio);
    
    // Redirecionar para página de upload
    router.push(`/upload?${params.toString()}`);
  };
  
  const handleAssistantMessage = async (agent: 'urthona' | 'urizen') => {
    if (!assistantInput.trim()) return;
    
    const messages = agent === 'urthona' ? urthonaMessages : urizenMessages;
    const setMessages = agent === 'urthona' ? setUrthonaMessages : setUrizenMessages;
    
    // Adicionar mensagem do usuário
    const newUserMessage = { role: 'user' as const, content: assistantInput };
    setMessages([...messages, newUserMessage]);
    setAssistantInput('');
    
    // Chamar API do assistente
    setIsAssistantLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          mode: agent === 'urthona' ? 'criativo' : 'consulta',
          universeId: universeId || null,
          textContent: conteudo,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao conversar com assistente');
      }
      
      // Ler resposta em streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          assistantMessage += chunk;
          
          // Atualizar mensagem progressivamente
          setMessages([...messages, newUserMessage, {
            role: 'assistant',
            content: assistantMessage,
          }]);
        }
        
        // Detectar e aplicar EDIT_CONTENT (apenas para Urthona)
        if (agent === 'urthona' && assistantMessage.includes('```EDIT_CONTENT')) {
          const editMatch = assistantMessage.match(/```EDIT_CONTENT\s*([\s\S]*?)```/);
          if (editMatch && editMatch[1]) {
            const newContent = editMatch[1].trim();
            setConteudo(newContent);
            console.log('Texto atualizado por Urthona!');
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao chamar assistente:', error);
      setMessages([...messages, newUserMessage, { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem.' 
      }]);
    } finally {
      setIsAssistantLoading(false);
    }
  };
  
  // Funções de criação
  const handleCreateUniverse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!universeForm.nome.trim()) {
      toast.error('Nome do universo é obrigatório');
      return;
    }
    
    setIsSubmittingUniverse(true);
    try {
      const response = await fetch('/api/universes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(universeForm),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success('Universo criado!');
        setUniverses([...universes, data.universe]);
        setUniverseId(data.universe.id);
        setShowCreateUniverseModal(false);
        setUniverseForm({ id: '', nome: '', descricao: '' });
        // Recarregar mundos
        const worldsRes = await fetch('/api/worlds');
        const worldsData = await worldsRes.json();
        if (worldsRes.ok && worldsData.worlds) {
          setWorlds(worldsData.worlds);
        }
      } else {
        toast.error(data.error || 'Erro ao criar universo');
      }
    } catch (error) {
      toast.error('Erro ao criar universo');
    } finally {
      setIsSubmittingUniverse(false);
    }
  };
  
  const handleEditUniverse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!universeForm.nome.trim()) {
      toast.error('Nome do universo é obrigatório');
      return;
    }
    
    setIsSubmittingUniverse(true);
    try {
      const response = await fetch(`/api/universes/${universeForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: universeForm.nome, descricao: universeForm.descricao }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success('Universo atualizado!');
        setUniverses(universes.map(u => u.id === universeForm.id ? data.universe : u));
        setShowEditUniverseModal(false);
        setUniverseForm({ id: '', nome: '', descricao: '' });
      } else {
        toast.error(data.error || 'Erro ao atualizar universo');
      }
    } catch (error) {
      toast.error('Erro ao atualizar universo');
    } finally {
      setIsSubmittingUniverse(false);
    }
  };
  
  function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { num1, num2, answer: num1 + num2 };
  }
  
  function promptDeleteUniverse(universeId: string, universeName: string) {
    const captcha = generateCaptcha();
    setCaptchaQuestion(captcha);
    setCaptchaAnswer('');
    setUniverseToDelete({ id: universeId, nome: universeName });
    setShowDeleteUniverseModal(true);
  }
  
  async function confirmDeleteUniverse() {
    if (!universeToDelete) return;
    
    if (parseInt(captchaAnswer) !== captchaQuestion.answer) {
      toast.error('Resposta incorreta. Tente novamente.');
      return;
    }
    
    try {
      const response = await fetch(`/api/universes/${universeToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Universo deletado!');
        setUniverses(universes.filter(u => u.id !== universeToDelete.id));
        if (universeId === universeToDelete.id) {
          setUniverseId('');
        }
        setShowDeleteUniverseModal(false);
        setUniverseToDelete(null);
        setCaptchaAnswer('');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar universo');
      }
    } catch (error) {
      toast.error('Erro ao deletar universo');
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
          setWorldId(data.world.id);
        }
        setShowCreateWorldModal(false);
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
    setShowCreateWorldModal(true);
  };

  async function handleDeleteWorld(id: string) {
    try {
      const response = await fetch(`/api/worlds?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Mundo deletado');
        if (worldId === id) {
          setWorldId('');
        }
        // Recarregar mundos
        const worldsRes = await fetch('/api/worlds');
        const worldsData = await worldsRes.json();
        if (worldsRes.ok && worldsData.worlds) {
          setWorlds(worldsData.worlds);
        }
        setShowCreateWorldModal(false);
        setWorldToEdit(null);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar mundo');
      }
    } catch (error) {
      console.error('Error deleting world:', error);
      toast.error('Erro de rede ao deletar mundo');
    }
  }
  
  // Função removida - Episódios agora são criados na página Projetos
  
  const handleSaveCategory = async (categoryData: any) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...categoryData, universe_id: universeId }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success('Categoria criada!');
        // Recarregar categorias
        const categoriesRes = await fetch(`/api/categories?universe_id=${universeId}`);
        const categoriesData = await categoriesRes.json();
        if (categoriesRes.ok && categoriesData.categories) {
          setCategories(categoriesData.categories);
        }
        setCategoria(data.category.slug);
        setShowCreateCategoryModal(false);
        setCategoryToEdit(null);
      } else {
        toast.error(data.error || 'Erro ao criar categoria');
      }
    } catch (error) {
      toast.error('Erro ao criar categoria');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-light-base dark:bg-dark-base flex flex-col">
      <Header showNav={true} currentPage="escrita" title={titulo || "Sem título"} editorRef={editorRef} />

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* COLUNA A - Sidebar (Biblioteca de Textos) */}
        {isSidebarOpen && (
          <>
          {/* Backdrop (mobile only) */}
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="w-[250px] h-screen bg-light-raised dark:bg-dark-raised overflow-y-auto md:relative fixed inset-y-0 left-0 z-40 md:z-auto flex flex-col">
            {/* Header da Sidebar */}
            <div className="p-4">
              <div className="flex items-center justify-end mb-3">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="hidden md:block p-1.5 rounded-lg text-text-light-tertiary hover:text-text-light-secondary hover:bg-light-overlay dark:text-dark-tertiary dark:hover:text-dark-secondary dark:hover:bg-dark-overlay transition-colors"
                  title="Fechar barra lateral"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleNewTexto}
                className="w-full px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm font-medium"
              >
                + Novo Texto
              </button>
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
            </div>

            {/* Lista de Textos */}
            <div className="flex-1 overflow-y-auto p-4">
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
                          currentTextId === texto.id
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
                            handleDelete(texto.id, texto.titulo);
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
          </>
        )}

        {/* Botões laterais (quando sidebar colapsada) */}
        {!isSidebarOpen && (
          <div className="w-12 bg-light-raised dark:bg-dark-raised flex flex-col items-center pt-3 gap-3 flex-shrink-0 fixed left-0 top-16 h-[calc(100vh-4rem)] md:relative md:top-0 md:h-auto">
            {/* Botão lápis (abrir sidebar) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors rounded-lg"
              title="Abrir barra lateral"
            >
              <svg className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            
            {/* Botão três pontos horizontais (menu de ferramentas) - só aparece no mobile */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors rounded-lg md:hidden"
              title="Ferramentas"
            >
              <svg className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="6" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="18" cy="12" r="1.5" />
              </svg>
            </button>
          </div>
        )}

        {/* COLUNA B - Conteúdo Principal (6 Linhas) */}
        <main className="flex-1 flex flex-col overflow-hidden">
          
          {/* LINHA 1: Grid 3 colunas - Vazio (A1) + Modo Foco (B1) + Avatares (C1) */}
          <div className="h-16 grid grid-cols-[48px_1fr_48px] gap-0 items-center px-4 flex-shrink-0 max-w-[768px] mx-auto w-full">
            {/* Célula A1 - Vazia */}
            <div></div>
            
            {/* Célula B1 - Modo Foco (esquerda) + Avatares (direita) - só em rascunhos */}
            <div className="flex justify-between items-center max-w-[672px]">
              {currentStatus === 'rascunho' && (
                <>
                  <button 
                    onClick={enterModoFoco}
                    className="hidden md:inline-flex px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm font-medium items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    Modo Foco
                  </button>
                  
                  <div className="hidden md:flex gap-3">
                <button
                  onClick={() => {
                    setShowUrizen(!showUrizen);
                    if (!showUrizen) setShowUrthona(false);
                  }}
                  className={`w-10 h-10 rounded-full transition-all ${
                    showUrizen ? 'ring-2 ring-[#5B7C8D] opacity-100' : 'opacity-50 hover:opacity-100 hover:ring-2 hover:ring-[#5B7C8D]'
                  }`}
                  title="Urizen (Consulta)"
                >
                  <img src="/urizen-avatar.png" alt="Urizen" className="w-full h-full rounded-full object-cover" />
                </button>
                <button
                  onClick={() => {
                    setShowUrthona(!showUrthona);
                    if (!showUrthona) setShowUrizen(false);
                  }}
                  className={`w-10 h-10 rounded-full transition-all ${
                    showUrthona ? 'ring-2 ring-[#C85A54] opacity-100' : 'opacity-50 hover:opacity-100 hover:ring-2 hover:ring-[#C85A54]'
                  }`}
                  title="Urthona (Criativo)"
                >
                  <img src="/urthona-avatar.png" alt="Urthona" className="w-full h-full rounded-full object-cover" />
                </button>
              </div>
                </>
              )}
            </div>
            
            {/* Célula C1 - Vazia */}
            <div></div>
          </div>

          {/* LINHA 2: Grid 3 colunas - Botão Colapsar (A2) + Título (B2) + Menu (C2) */}
          <div className="h-12 hidden md:grid grid-cols-[48px_1fr_48px] gap-0 items-center px-4 flex-shrink-0 max-w-[768px] mx-auto w-full">
            {/* Célula A2 - Botão Colapsar (só desktop, não aparece em publicados) */}
            {currentStatus === 'rascunho' ? (
              <button
                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                className="hidden md:block text-xl hover:opacity-70 transition-opacity text-text-light-secondary dark:text-dark-secondary"
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
            ) : (
              <div></div>
            )}
            
            {/* Célula B2 - Título + Três Pontos */}
            <div className="flex justify-between items-center max-w-[672px]">
              <h2 
                onClick={() => {
                  // No mobile, abre modal de metadados
                  if (window.innerWidth < 768) {
                    setShowMetadataModal(true);
                  }
                }}
                className="text-lg font-semibold text-text-light-primary dark:text-dark-primary truncate cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis max-w-full md:cursor-default"
              >
                {titulo || "Sem título"}
              </h2>
              
              <div className="relative hidden md:block" ref={optionsMenuRef}>
              <button 
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="text-xl hover:opacity-70 transition-opacity text-text-light-secondary dark:text-dark-secondary"
              >
                ⋮
              </button>
              
              {/* Dropdown Menu */}
              {showOptionsMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-light-base dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default z-50">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleDuplicate();
                        setShowOptionsMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
                    >
                      <svg className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-text-light-primary dark:text-dark-primary">Duplicar</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowStatsModal(true);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
                    >
                      <svg className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-sm text-text-light-primary dark:text-dark-primary">Estatísticas</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowExportModal(true);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
                    >
                      <svg className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="text-sm text-text-light-primary dark:text-dark-primary">Exportar</span>
                    </button>
                    
                    <div className="border-t border-border-light-default dark:border-border-dark-default my-2"></div>
                    
                    <button
                      onClick={() => {
                        handleDeleteCurrentTexto();
                        setShowOptionsMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-sm text-red-600 dark:text-red-400">Excluir texto</span>
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
            
            {/* Célula C2 - Vazia */}
            <div></div>
          </div>


          {/* LINHA 3: Metadados (Condicional - sempre visível em publicados) */}
          {(isHeaderExpanded || currentStatus === 'publicado') && (
            <div className="grid grid-cols-[48px_1fr_48px] gap-0 px-4 py-4 flex-shrink-0 max-w-[768px] mx-auto w-full">
              <div></div>
              <div className="space-y-4 max-w-[672px]">
              {/* Botão de editar (só aparece quando está bloqueado e é rascunho) */}
              {isMetadataLocked && currentStatus === 'rascunho' && (
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
              )}
              
              {/* Campo de título (só em rascunhos) */}
              {currentStatus === 'rascunho' && (
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
              )}

              {/* Metadados Grid */}
              <div className="grid grid-cols-4 gap-4">
                <UniverseDropdown
                  label="UNIVERSO"
                  universes={universes}
                  selectedId={universeId}
                  onSelect={(id) => {
                    setUniverseId(id);
                  }}
                  onEdit={(universe) => {
                    setUniverseForm({ id: universe.id, nome: universe.nome, descricao: universe.descricao || '' });
                    setShowEditUniverseModal(true);
                  }}
                  onDelete={promptDeleteUniverse}
                  onCreate={() => setShowCreateUniverseModal(true)}
                  disabled={isMetadataLocked}
                />
                <WorldsDropdownSingle
                  label="MUNDO"
                  worlds={worlds.filter(w => w.universe_id === universeId)}
                  selectedId={worldId}
                  onSelect={setWorldId}
                  onEdit={handleEditWorld}
                  onDelete={handleDeleteWorld}
                  disabled={isMetadataLocked}
                  onCreate={() => {
                    setWorldToEdit(null);
                    setShowCreateWorldModal(true);
                  }}
                />

                <EpisodesDropdownSingle
                  label="EPISÓDIO"
                  episodes={availableEpisodes}
                  selectedEpisode={episodio}
                  onSelect={setEpisodio}
                  onCreate={() => setShowCreateEpisodeModal(true)}
                  disabled={!worldId || isMetadataLocked}
                />

                <CategoryDropdownSingle
                  label="CATEGORIA"
                  categories={categories}
                  selectedCategory={categoria}
                  onSelect={setCategoria}
                  onCreate={() => {
                    setCategoryToEdit(null);
                    setShowCreateCategoryModal(true);
                  }}
                  worldId={worldId}
                  disabled={!universeId || isMetadataLocked}
                />
              </div>
              
              {/* Botões Cancelar e Salvar (só aparecem quando está editando) */}
              {!isMetadataLocked && (
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    onClick={() => {
                      // Reverter para valores salvos
                      if (savedMetadataSnapshot) {
                        setTitulo(savedMetadataSnapshot.titulo);
                        setUniverseId(savedMetadataSnapshot.universeId);
                        setWorldId(savedMetadataSnapshot.worldId);
                        setEpisodio(savedMetadataSnapshot.episodio);
                        setCategoria(savedMetadataSnapshot.categoria);
                      }
                      setIsHeaderExpanded(false);
                      setHasUnsavedMetadataChanges(false);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleSave(false)}
                    disabled={isSaving || !titulo.trim() || !universeId}
                    variant="primary"
                    size="sm"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Metadados'}
                  </Button>
                </div>
              )}
              </div>
              <div></div>
            </div>
          )}

          {/* LINHA 4: Grid 3 colunas - Vazio (A4) + Toolbar (B4) + Vazio (C4) */}
          <div className="h-12 grid grid-cols-[48px_1fr_48px] gap-0 items-center px-4 flex-shrink-0 max-w-[768px] mx-auto w-full">
            {/* Célula A4 - Vazia */}
            <div></div>
            
            {/* Célula B4 - Toolbar (só desktop e rascunhos) */}
            <div className="hidden md:flex items-center gap-4">
              {currentStatus === 'rascunho' && (
              <>
              <button 
                onClick={() => editorRef.current?.chain().focus().toggleBold().run()}
                className="text-sm font-medium hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary"
              >
                B
              </button>
              <button 
                onClick={() => editorRef.current?.chain().focus().toggleItalic().run()}
                className="text-sm font-medium hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary italic"
              >
                I
              </button>
              <div className="relative" ref={stylesDropdownRef}>
                <button 
                  onClick={() => setShowStylesDropdown(!showStylesDropdown)}
                  className="text-sm font-medium hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary"
                >
                  Aa
                </button>
                {showStylesDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-light-base dark:bg-dark-base border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg py-2 z-50 min-w-[120px]">
                    <button
                      onClick={() => {
                        setFontFamily('serif');
                        setShowStylesDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors font-serif ${
                        fontFamily === 'serif' ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-text-light-primary dark:text-dark-primary'
                      }`}
                    >
                      Serif
                    </button>
                    <button
                      onClick={() => {
                        setFontFamily('sans');
                        setShowStylesDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors font-sans ${
                        fontFamily === 'sans' ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-text-light-primary dark:text-dark-primary'
                      }`}
                    >
                      Sans
                    </button>
                    <button
                      onClick={() => {
                        console.log('[DEBUG] Botão Mono clicado! Estado atual:', fontFamily);
                        setFontFamily('mono');
                        console.log('[DEBUG] setFontFamily("mono") chamado');
                        setShowStylesDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors font-mono ${
                        fontFamily === 'mono' ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-text-light-primary dark:text-dark-primary'
                      }`}
                    >
                      Mono
                    </button>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
            
            {/* Célula C4 - Vazia */}
            <div></div>
          </div>

          {/* LINHA 5: Grid 3 colunas - Vazio (A5) + Editor (B5) + Vazio (C5) */}
          <div className="flex-1 grid grid-cols-[48px_1fr_48px] gap-0 px-4 py-6 pb-24 max-w-[768px] mx-auto w-full overflow-hidden">
            {/* Célula A5 - Vazia */}
            <div></div>
            
            {/* Célula B5 - Editor */}
            <div className={clsx(
              "max-w-[672px] h-full overflow-y-auto",
              fontFamily === 'serif' && 'font-serif',
              fontFamily === 'sans' && 'font-sans',
              fontFamily === 'mono' && 'font-mono'
            )}>
            <TiptapEditor
              value={conteudo}
              onChange={(value) => setConteudo(value)}
              placeholder="Escreva seu texto aqui..."
              className="w-full min-h-[400px]"
              showToolbar={false}
              editorRef={editorRef}
              fontFamily={fontFamily}
              onFontChange={(font) => setFontFamily(font)}
              onTextSelect={handleTextSelect}
              editable={currentStatus !== 'publicado'}
            />
            </div>
            
            {/* Célula C5 - Vazia */}
            <div></div>
          </div>

          {/* LINHA 6: Grid 3 colunas - Vazio (A6) + Botões (B6) + Vazio (C6) */}
          <footer className="fixed bottom-0 bg-light-base dark:bg-dark-base py-4 z-10" style={{ left: isSidebarOpen ? '250px' : '48px', right: 0 }}>
        <div className="grid grid-cols-[48px_1fr_48px] gap-0 px-4 max-w-[768px] mx-auto w-full">
          {/* Célula A6 - Vazia */}
          <div></div>
          
          {/* Célula B6 - Botões (só desktop) */}
          <div className="flex justify-start">
            <div className="hidden md:flex max-w-[672px] w-full gap-3 justify-end">
              {currentStatus === 'rascunho' ? (
                // Botões para rascunhos
                <>
                  <button 
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-sm bg-light-overlay dark:bg-dark-overlay text-text-light-primary dark:text-dark-primary rounded hover:opacity-80 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-sm bg-primary-600 dark:bg-primary-500 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Publicar
                  </button>
                </>
              ) : (
                // Botões para publicados
                <>
                  <button 
                    onClick={handleMoveToRascunhos}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-sm bg-light-overlay dark:bg-dark-overlay text-text-light-primary dark:text-dark-primary rounded hover:opacity-80 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move para rascunho de novo"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-sm bg-primary-600 dark:bg-primary-500 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Enviar para extração"
                  >
                    Upload
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Célula C6 - Vazia */}
          <div></div>
        </div>
      </footer>
        </main>
      </div>

      {/* Chat Lateral com Assistentes */}
      {(showUrthona || showUrizen) && (
        <div 
          ref={chatRef}
          className={clsx(
            "fixed overflow-hidden flex flex-col shadow-2xl border",
            "inset-0 md:inset-auto md:rounded-lg",
            modoFoco ? getFocoThemeColors().bg : "bg-light-base dark:bg-dark-base",
            modoFoco ? getFocoThemeColors().border : "border-border-light-default dark:border-border-dark-default"
          )}
          style={{
            left: window.innerWidth >= 768 ? (chatPosition.x || 'auto') : 0,
            top: window.innerWidth >= 768 ? (chatPosition.y || 80) : 0,
            right: window.innerWidth >= 768 ? (chatPosition.x ? 'auto' : 16) : 0,
            bottom: window.innerWidth < 768 ? 0 : 'auto',
            width: window.innerWidth >= 768 ? `${chatSize.width}px` : '100%',
            height: window.innerWidth >= 768 ? `${chatSize.height}px` : '100%',
            zIndex: 1000,
            cursor: window.innerWidth >= 768 && isDragging ? 'grabbing' : 'default'
          }}
        >
          <div className="flex flex-col h-full px-4 pt-4 pb-4">
            {/* Header do Chat (Draggable apenas no desktop) */}
            <div 
              className="flex justify-between items-center mb-4 pb-4 md:cursor-grab md:active:cursor-grabbing"
              onMouseDown={(e) => {
                if (window.innerWidth < 768) return; // Desabilitar drag no mobile
                setIsDragging(true);
                setDragStart({
                  x: e.clientX - (chatPosition.x || (window.innerWidth - chatSize.width - 16)),
                  y: e.clientY - (chatPosition.y || 80)
                });
              }}
            >
              <div>
                <h3 className={clsx(
                  "font-semibold",
                  modoFoco ? getFocoThemeColors().text : "text-text-light-primary dark:text-dark-primary"
                )}>
                  {showUrthona ? "Urthona" : "Urizen"}
                </h3>
                <p className={clsx(
                  "text-xs",
                  modoFoco ? getFocoThemeColors().textSecondary : "text-text-light-tertiary dark:text-dark-tertiary"
                )}>
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
                      "max-w-[85%] px-4 py-2 rounded-lg",
                      msg.role === "user"
                        ? "bg-primary-600 dark:bg-primary-500 text-white"
                        : modoFoco
                        ? clsx(getFocoThemeColors().secondary, getFocoThemeColors().text)
                        : "bg-light-overlay dark:bg-dark-overlay text-text-light-primary dark:text-dark-primary"
                    )}
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, href, children, ...props }) => {
                              // Interceptar links /ficha/[slug]
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
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
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
                className={clsx(
                  "flex-1 px-4 py-2 rounded-lg border outline-none focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 resize-none max-h-24 overflow-y-auto text-sm",
                  modoFoco ? clsx(getFocoThemeColors().secondary, getFocoThemeColors().text, getFocoThemeColors().border) : "border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-dark-tertiary"
                )}
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
                className="px-4 py-2 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 disabled:bg-primary-300 dark:disabled:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0"
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
        </div>
      )}
      
      {/* Modo Foco - Fullscreen */}
      {/* Modo Foco - Fullscreen Redesenhado */}
      {modoFoco && (
        <div className={clsx(
          "fixed inset-0 z-50 flex flex-col",
          getFocoThemeColors().bg
        )}>
          
          {/* Menu Flutuante */}
          <div
            ref={menuFocoRef}
            style={{
              position: 'fixed',
              left: `${menuFocoPosition.x}px`,
              top: `${menuFocoPosition.y}px`,
              zIndex: 100
            }}
            className={clsx(
              "transition-all duration-300",
              menuFocoExpanded ? "w-64" : "w-12"
            )}
          >
            {menuFocoExpanded ? (
              // Menu Expandido
              <div className={clsx(
                "rounded-lg shadow-lg border p-4 space-y-3",
                getFocoThemeColors().bg,
                getFocoThemeColors().border
              )}>
                {/* Header com título e botão colapsar */}
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h2 
                    className={clsx(
                      "text-sm font-semibold flex-1 cursor-move line-clamp-2",
                      getFocoThemeColors().text
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsDraggingMenu(true);
                    }}
                    title="Arrastar menu"
                  >
                    {titulo || "Sem título"}
                  </h2>
                  <button
                    onClick={() => setMenuFocoExpanded(false)}
                    className={clsx(
                      "p-1 rounded transition-colors",
                      getFocoThemeColors().hover
                    )}
                    title="Recolher menu (ESC)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Botões de Formatação */}
                <div className="flex gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => editorRef.current?.chain().focus().toggleBold().run()}
                    className={clsx(
                      "px-3 py-1.5 text-sm font-bold rounded transition-colors",
                      getFocoThemeColors().secondary,
                      getFocoThemeColors().text,
                      getFocoThemeColors().hover
                    )}
                    title="Negrito"
                  >
                    B
                  </button>
                  <button
                    onClick={() => editorRef.current?.chain().focus().toggleItalic().run()}
                    className={clsx(
                      "px-3 py-1.5 text-sm italic rounded transition-colors",
                      getFocoThemeColors().secondary,
                      getFocoThemeColors().text,
                      getFocoThemeColors().hover
                    )}
                    title="Itálico"
                  >
                    I
                  </button>
                  <button
                    onClick={() => setShowStylesDropdown(!showStylesDropdown)}
                    className={clsx(
                      "px-3 py-1.5 text-sm rounded transition-colors",
                      getFocoThemeColors().secondary,
                      getFocoThemeColors().text,
                      getFocoThemeColors().hover
                    )}
                    title="Estilos"
                  >
                    Aa
                  </button>
                  <button
                    onClick={() => setFocusType(focusType === 'paragraph' ? 'off' : 'paragraph')}
                    className={clsx(
                      "px-2 py-1 text-xs rounded transition-colors font-medium leading-tight flex-1 flex flex-col items-center justify-center",
                      focusType === 'paragraph'
                        ? "bg-primary-600 text-white"
                        : clsx(getFocoThemeColors().secondary, getFocoThemeColors().text, getFocoThemeColors().hover)
                    )}
                    title="Destacar apenas o parágrafo atual"
                  >
                    <span>{focusType === 'paragraph' ? '✓ ' : ''}Foco</span>
                    <span>Parágrafo</span>
                  </button>
                </div>
                
                {/* Modos de Cor */}
                <div className="space-y-2">
                  <button
                    onClick={() => setTemaFoco('normal')}
                    className={clsx(
                      "w-full px-3 py-2 text-sm rounded transition-colors text-left",
                      temaFoco === 'normal'
                        ? "bg-primary-600 text-white"
                        : clsx(getFocoThemeColors().secondary, getFocoThemeColors().text, getFocoThemeColors().hover)
                    )}
                  >
                    Modo Normal
                  </button>
                  <button
                    onClick={() => setTemaFoco('light')}
                    className={clsx(
                      "w-full px-3 py-2 text-sm rounded transition-colors text-left",
                      temaFoco === 'light'
                        ? "bg-primary-600 text-white"
                        : clsx(getFocoThemeColors().secondary, getFocoThemeColors().text, getFocoThemeColors().hover)
                    )}
                  >
                    Modo Branco
                  </button>
                  <button
                    onClick={() => setTemaFoco('dark')}
                    className={clsx(
                      "w-full px-3 py-2 text-sm rounded transition-colors text-left",
                      temaFoco === 'dark'
                        ? "bg-primary-600 text-white"
                        : clsx(getFocoThemeColors().secondary, getFocoThemeColors().text, getFocoThemeColors().hover)
                    )}
                  >
                    Modo Preto
                  </button>
                </div>
                
                {/* Avatares dos Assistentes */}
                <div className="flex gap-3 justify-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowUrizen(!showUrizen);
                      if (!showUrizen) setShowUrthona(false);
                    }}
                    className={`w-10 h-10 rounded-full transition-all ${
                      showUrizen ? 'ring-2 ring-[#5B7C8D] opacity-100' : 'opacity-50 hover:opacity-100 hover:ring-2 hover:ring-[#5B7C8D]'
                    }`}
                    title="Urizen (Consulta)"
                  >
                    <img src="/urizen-avatar.png" alt="Urizen" className="w-full h-full rounded-full" />
                  </button>
                  <button
                    onClick={() => {
                      setShowUrthona(!showUrthona);
                      if (!showUrthona) setShowUrizen(false);
                    }}
                    className={`w-10 h-10 rounded-full transition-all ${
                      showUrthona ? 'ring-2 ring-[#C85A54] opacity-100' : 'opacity-50 hover:opacity-100 hover:ring-2 hover:ring-[#C85A54]'
                    }`}
                    title="Urthona (Criativo)"
                  >
                    <img src="/urthona-avatar.png" alt="Urthona" className="w-full h-full rounded-full" />
                  </button>
                </div>
                
                {/* Botão Salvar */}
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className={clsx(
                    "w-full px-4 py-2 text-sm rounded transition-colors font-medium",
                    "bg-primary-600 hover:bg-primary-700 text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
                
                {/* Botão Sair */}
                <button
                  onClick={() => {
                    setModoFoco(false);
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    }
                  }}
                  className="w-full px-4 py-2 text-sm rounded transition-colors font-medium bg-red-500 hover:bg-red-600 text-white"
                >
                  Sair
                </button>
              </div>
            ) : (
              // Botão Sanduíche (Menu Recolhido)
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingMenu(true);
                }}
                onClick={(e) => {
                  if (!isDraggingMenu) {
                    setMenuFocoExpanded(true);
                  }
                }}
                className={clsx(
                  "w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-move",
                  "bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                )}
                title="Expandir menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Editor Centralizado com Margem Superior */}
          <div className="flex-1 overflow-y-auto">
            <div className={clsx(
              'max-w-4xl mx-auto px-16 pt-24 pb-12',
              fontFamily === 'serif' && 'font-serif',
              fontFamily === 'sans' && 'font-sans',
              fontFamily === 'mono' && 'font-mono'
            )}>
              <TiptapEditor
                value={conteudo}
                onChange={(value) => setConteudo(value)}
                placeholder="Escreva seu texto aqui..."
                className={clsx(
                  "w-full min-h-[calc(100vh-12rem)] bg-transparent border-none",
                  getFocoThemeColors().text
                )}
                showToolbar={false}
                editorRef={editorRef}
                fontFamily={fontFamily}
                onFontChange={(font) => setFontFamily(font)}
                onTextSelect={handleTextSelect}
                focusType={focusType}
                isFocusMode={modoFoco}
                editable={currentStatus !== 'publicado'}
              />
            </div>
          </div>
          

        </div>
      )}
      
      {/* Modal de Confirmação de Delete */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in"
          onClick={() => {
            if (!isDeletingTexto) {
              setShowDeleteConfirm(false);
              setTextoToDelete(null);
            }
          }}
        >
          <div
            className="relative w-full max-w-md bg-light-raised dark:bg-dark-raised rounded-2xl shadow-soft-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header sem borda e sem botão X */}
            <div className="p-5 pb-3">
              <h3 className="text-xl font-bold text-text-light-primary dark:text-dark-primary">
                Apagar texto
              </h3>
              <p className="mt-1 text-sm text-text-light-tertiary dark:text-dark-tertiary">
                Tem certeza que deseja apagar "{textoToDelete?.titulo}"?
              </p>
            </div>
            
            {/* Footer sem borda e sem espaço extra */}
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTextoToDelete(null);
                }} 
                disabled={isDeletingTexto}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDelete}
                loading={isDeletingTexto}
              >
                Apagar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-light-raised dark:bg-dark-raised rounded-2xl shadow-soft-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header sem borda e sem ícone */}
            <div className="p-5 pb-3">
              <p className="text-base font-medium text-text-light-primary dark:text-dark-primary">
                {successMessage}
              </p>
            </div>
            
            {/* Footer sem borda e sem espaço extra */}
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Estatísticas */}
      {showStatsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in"
          onClick={() => setShowStatsModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-light-raised dark:bg-dark-raised rounded-2xl shadow-soft-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 pb-3 border-b border-border-light-default dark:border-border-dark-default">
              <h3 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
                Estatísticas do Texto
              </h3>
            </div>
            
            {/* Conteúdo */}
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-light-secondary dark:text-dark-secondary">Palavras:</span>
                <span className="font-semibold text-text-light-primary dark:text-dark-primary">
                  {(() => {
                    const plainText = conteudo.replace(/<[^>]*>/g, '').trim();
                    return plainText.split(/\s+/).filter(w => w.length > 0).length;
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-light-secondary dark:text-dark-secondary">Caracteres (com espaços):</span>
                <span className="font-semibold text-text-light-primary dark:text-dark-primary">
                  {conteudo.replace(/<[^>]*>/g, '').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-light-secondary dark:text-dark-secondary">Caracteres (sem espaços):</span>
                <span className="font-semibold text-text-light-primary dark:text-dark-primary">
                  {conteudo.replace(/<[^>]*>/g, '').replace(/\s/g, '').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-light-secondary dark:text-dark-secondary">Parágrafos:</span>
                <span className="font-semibold text-text-light-primary dark:text-dark-primary">
                  {(() => {
                    const paragraphs = conteudo.match(/<p[^>]*>[\s\S]*?<\/p>/g);
                    return paragraphs ? paragraphs.filter(p => p.replace(/<[^>]*>/g, '').trim().length > 0).length : 0;
                  })()}
                </span>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowStatsModal(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Exportar */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-light-raised dark:bg-dark-raised rounded-2xl shadow-soft-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 pb-3 border-b border-border-light-default dark:border-border-dark-default">
              <h3 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
                Exportar Texto
              </h3>
            </div>
            
            {/* Conteúdo */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-text-light-secondary dark:text-dark-secondary mb-4">
                Escolha o formato de exportação:
              </p>
              
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors rounded-lg border border-border-light-default dark:border-border-dark-default"
              >
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <path d="M14 2v6h6" />
                </svg>
                <div>
                  <div className="font-medium text-text-light-primary dark:text-dark-primary">PDF</div>
                  <div className="text-xs text-text-light-tertiary dark:text-dark-tertiary">Documento portátil</div>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('docx')}
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors rounded-lg border border-border-light-default dark:border-border-dark-default"
              >
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <path d="M14 2v6h6" />
                </svg>
                <div>
                  <div className="font-medium text-text-light-primary dark:text-dark-primary">DOCX</div>
                  <div className="text-xs text-text-light-tertiary dark:text-dark-tertiary">Microsoft Word</div>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('txt')}
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors rounded-lg border border-border-light-default dark:border-border-dark-default"
              >
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <path d="M14 2v6h6" />
                </svg>
                <div>
                  <div className="font-medium text-text-light-primary dark:text-dark-primary">TXT</div>
                  <div className="text-xs text-text-light-tertiary dark:text-dark-tertiary">Texto simples</div>
                </div>
              </button>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowExportModal(false)}
              >
                Cancelar
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
              top: `${selectionMenuPosition.y - 80}px`, // 80px acima da seleção
              transform: 'translateX(-50%)'
            }}
          >
            <div className="flex flex-col">
              {/* Botões de Formatação - Só Mobile */}
              <div className="md:hidden flex items-center justify-center gap-2 p-2 border-b border-border-light-default dark:border-border-dark-default">
                <button
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.chain().focus().toggleBold().run();
                    }
                    setSelectionMenuPosition(null);
                    setSelectedText("");
                  }}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold rounded bg-light-overlay dark:bg-dark-overlay hover:bg-light-base dark:hover:bg-dark-base text-text-light-primary dark:text-dark-primary transition-colors"
                  title="Negrito"
                >
                  B
                </button>
                <button
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.chain().focus().toggleItalic().run();
                    }
                    setSelectionMenuPosition(null);
                    setSelectedText("");
                  }}
                  className="w-8 h-8 flex items-center justify-center text-sm italic rounded bg-light-overlay dark:bg-dark-overlay hover:bg-light-base dark:hover:bg-dark-base text-text-light-primary dark:text-dark-primary transition-colors"
                  title="Itálico"
                >
                  I
                </button>
              </div>
              
              {/* Assistentes de IA */}
              <div className="flex items-center justify-center gap-3 p-3">
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
      
      {/* Modal de Criar Universo */}
      <Modal
        isOpen={showCreateUniverseModal}
        onClose={() => {
          setShowCreateUniverseModal(false);
          setUniverseForm({ id: '', nome: '', descricao: '' });
        }}
        title="Criar Novo Universo"
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCreateUniverseModal(false);
                setUniverseForm({ id: '', nome: '', descricao: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreateUniverse}
              loading={isSubmittingUniverse}
            >
              Criar
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateUniverse} className="space-y-4">
          <Input
            label="Nome"
            value={universeForm.nome}
            onChange={(e) => setUniverseForm({ ...universeForm, nome: e.target.value })}
            placeholder="Ex: Meu Universo Épico"
            required
          />
          <Textarea
            label="Descrição"
            value={universeForm.descricao}
            onChange={(e) => setUniverseForm({ ...universeForm, descricao: e.target.value })}
            placeholder="Descreva seu universo..."
            rows={4}
          />
        </form>
      </Modal>
      
      {/* Modal de Editar Universo */}
      <Modal
        isOpen={showEditUniverseModal}
        onClose={() => {
          setShowEditUniverseModal(false);
          setUniverseForm({ id: '', nome: '', descricao: '' });
        }}
        title="Editar Universo"
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowEditUniverseModal(false);
                setUniverseForm({ id: '', nome: '', descricao: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleEditUniverse}
              loading={isSubmittingUniverse}
            >
              Salvar
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditUniverse} className="space-y-4">
          <Input
            label="Nome"
            value={universeForm.nome}
            onChange={(e) => setUniverseForm({ ...universeForm, nome: e.target.value })}
            placeholder="Ex: Meu Universo Épico"
            required
          />
          <Textarea
            label="Descrição"
            value={universeForm.descricao}
            onChange={(e) => setUniverseForm({ ...universeForm, descricao: e.target.value })}
            placeholder="Descreva seu universo..."
            rows={4}
          />
        </form>
      </Modal>
      
      {/* Modal de Deletar Universo */}
      <Modal
        isOpen={showDeleteUniverseModal}
        onClose={() => {
          setShowDeleteUniverseModal(false);
          setUniverseToDelete(null);
          setCaptchaAnswer('');
        }}
        title="Deletar Universo"
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowDeleteUniverseModal(false);
                setUniverseToDelete(null);
                setCaptchaAnswer('');
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={confirmDeleteUniverse}
            >
              Deletar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
            Tem certeza que deseja deletar o universo <strong>{universeToDelete?.nome}</strong>?
          </p>
          <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
            Esta ação não pode ser desfeita.
          </p>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-light-secondary dark:text-dark-secondary">
              Para confirmar, resolva: {captchaQuestion.num1} + {captchaQuestion.num2} = ?
            </label>
            <Input
              type="number"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="Digite a resposta"
              required
            />
          </div>
        </div>
      </Modal>
      
      {/* Modal de Criar Mundo */}
      <WorldModal
        isOpen={showCreateWorldModal}
        onClose={() => {
          setShowCreateWorldModal(false);
          setWorldToEdit(null);
        }}
        world={worldToEdit}
        onSave={handleSaveWorld}
        onDelete={handleDeleteWorld}
      />
      
      {/* Modal de Criar Episódio - Redirecionamento */}
      <Modal
        isOpen={showCreateEpisodeModal}
        onClose={() => {
          setShowCreateEpisodeModal(false);
        }}
        title="Criar Episódios"
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCreateEpisodeModal(false);
              }}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                window.location.href = '/projetos';
              }}
            >
              Ir para Projetos
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-text-light-secondary dark:text-dark-secondary">
            Episódios agora são criados na página <strong>Projetos</strong>, onde você pode:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-text-light-tertiary dark:text-dark-tertiary">
            <li>Criar e organizar episódios por mundo</li>
            <li>Adicionar título, logline e sinopse</li>
            <li>Gerenciar a estrutura completa do seu projeto</li>
          </ul>
          <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
            Após criar o episódio em Projetos, você poderá selecioná-lo aqui na Escrita.
          </p>
        </div>
      </Modal>
      
      {/* Modal de Criar Categoria */}
      <CategoryModal
        isOpen={showCreateCategoryModal}
        onClose={() => {
          setShowCreateCategoryModal(false);
          setCategoryToEdit(null);
        }}
        category={categoryToEdit}
        onSave={handleSaveCategory}
      />
      
      {/* Componentes Mobile */}
      <MetadataModal
        show={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
        titulo={titulo}
        setTitulo={setTitulo}
        universes={universes}
        universeId={universeId}
        setUniverseId={setUniverseId}
        worlds={worlds}
        worldId={worldId}
        setWorldId={setWorldId}
        availableEpisodes={availableEpisodes}
        episodio={episodio}
        setEpisodio={setEpisodio}
        categories={categories}
        categoria={categoria}
        setCategoria={setCategoria}
        onSave={() => handleSave(false)}
        isMetadataLocked={isMetadataLocked}
        setShowEditUniverseModal={setShowEditUniverseModal}
        setUniverseForm={setUniverseForm}
        promptDeleteUniverse={promptDeleteUniverse}
        setShowCreateUniverseModal={setShowCreateUniverseModal}
        setWorldToEdit={setWorldToEdit}
        setShowCreateWorldModal={setShowCreateWorldModal}
        setShowCreateEpisodeModal={setShowCreateEpisodeModal}
        setCategoryToEdit={setCategoryToEdit}
        setShowCreateCategoryModal={setShowCreateCategoryModal}
      />
      
      <MobileMenu
        show={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        showUrizen={showUrizen}
        setShowUrizen={setShowUrizen}
        showUrthona={showUrthona}
        setShowUrthona={setShowUrthona}
        editorRef={editorRef}
        showStylesDropdown={showStylesDropdown}
        setShowStylesDropdown={setShowStylesDropdown}
        setShowStatsModal={setShowStatsModal}
        setShowExportModal={setShowExportModal}
        handleSave={handleSave}
        handlePublish={handlePublish}
        isSaving={isSaving}
        handleDuplicate={handleDuplicate}
        handleDeleteCurrentTexto={handleDeleteCurrentTexto}
      />
    </div>
    </>
  );
}

export default function EscritaPage() {
  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <EscritaPageContent />
    </React.Suspense>
  );
}
