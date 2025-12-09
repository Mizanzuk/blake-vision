'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { Header } from '@/app/components/layout/Header';
import TiptapEditor from '@/components/TiptapEditor';
import { FontFamily } from '@/components/FontSelector';
import { createClient } from '@/app/lib/supabase/client';
import { toast, Toaster } from 'sonner';
import { Modal } from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { UniverseDropdown } from '@/app/components/ui';
import { WorldsDropdownSingle } from '@/app/components/ui/WorldsDropdownSingle';
import { EpisodesDropdownSingle } from '@/app/components/ui/EpisodesDropdownSingle';
import { CategoryDropdownSingle } from '@/app/components/ui/CategoryDropdownSingle';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function EscritaPageContent() {
  console.log('✅ COMPONENTE ESCRITA MONTADO - Build:', Date.now());
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  // Estados do Header
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentTextId, setCurrentTextId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('A Noite do Cão Misterioso (Cópia)');
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
  const [conteudo, setConteudo] = useState("Em uma pequena cidade cercada por densas florestas, viviam dois amigos inseparáveis: Lucas e Pedro. Os dois eram conhecidos por suas aventuras noturnas, onde exploravam os arredores da cidade à procura de mistérios e lendas urbanas para desvendar. Teste.\n\nCerta noite, enquanto caminhavam por uma trilha pouco iluminada na floresta, Lucas e Pedro começaram a ouvir um som baixo e gutural. Curiosos, seguiram o ruído até que, entre as sombras das árvores, avistaram uma figura enorme e peluda. A luz da lua cheia iluminou a criatura, revelando olhos brilhantes e um corpo imponente. O susto foi imediato: ambos acreditaram estar diante de um lobisomem! Sem pensar duas vezes, os amigos correram de volta para a cidade, o coração disparado e a mente cheia de imagens sombrias. Ao chegarem, contaram a todos sobre o encontro sobrenatural. A notícia se espalhou rapidamente, e em pouco tempo, a cidade estava em alvoroço com a história do \"lobisomem da floresta\". No entanto, a curiosidade dos amigos não os deixava em paz. No dia seguinte, decidiram investigar a área à luz do dia. Armados com lanternas e coragem renovada, voltaram à floresta. Ao chegarem ao local do avistamento, encontraram pegadas enormes no solo. Seguiram as pistas pelas os levaram até uma clareira onde, para sua surpresa, encontraram um cachorro gigantesco, de pelagem escura e olhos penetrantes. O cachorro, embora imponente, era dócil. Aproximando-se devagar, os amigos descobriram que ele usava uma coleira com uma medalha, onde estava escrito o nome de seu dono. Compreendendo o mal-entendido, Lucas e Pedro riceberam que Max era o cachorro perdido de um fazendeiro da região, famoso por possuir uma presença intimidadora. Compreendendo o mal-entendido, Lucas e Pedro voltaram à cidade com Max, explicando a verdadeira história ao fazendeiro e aos moradores. O alívio tomou conta de todos, e o susto da noite anterior se transformou em uma divertida anedota para a comunidade. A partir daquele dia, Max se tornou uma mascote local, e Lucas e Pedro continuaram suas aventuras, agora prontos para desvendar qualquer mistério que a noite pudesse trazer. **\"Moral da História:\"** Às vezes, o que nos assusta no escuro se revela inofensivo à luz do dia. A coragem de enfrentar nossos medos pode transformar monstros em amigos.");
  const [universeId, setUniverseId] = useState<string>("");
  const [universes, setUniverses] = useState<any[]>([]); // Lista de universos disponíveis
  const [worlds, setWorlds] = useState<any[]>([]); // Lista de mundos disponíveis
  const [worldId, setWorldId] = useState<string>("");
  const [episodes, setEpisodes] = useState<any[]>([]); // Lista de episódios disponíveis
  const [episodio, setEpisodio] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]); // Lista de categorias disponíveis
  const [categoria, setCategoria] = useState<string>("Texto Livre");
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const editorRef = useRef<any>(null);
  
  // Estados do Menu Três Pontos e Modo Foco
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showStylesDropdown, setShowStylesDropdown] = useState(false);
  const [modoFoco, setModoFoco] = useState(false);
  const [temaFoco, setTemaFoco] = useState<'light' | 'dark'>('light');
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const stylesDropdownRef = useRef<HTMLDivElement>(null);
  
  // Estados do Modal de Confirmação
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [textoToDelete, setTextoToDelete] = useState<{id: string, titulo: string} | null>(null);
  const [isDeletingTexto, setIsDeletingTexto] = useState(false);
  
  // Estado do Modal de Sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
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
  
  // Auto-save a cada 30 segundos (apenas se já tiver ID do texto)
  useEffect(() => {
    if (!conteudo || !currentTextId) return;
    
    const autoSaveInterval = setInterval(() => {
      handleSave(true); // true = auto-save silencioso
    }, 30000); // 30 segundos
    
    return () => clearInterval(autoSaveInterval);
  }, [conteudo, currentTextId]);
  
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
  
  // Carregar lista de textos e universos ao montar componente
  useEffect(() => {
    loadTextos();
    loadUniversesAndWorlds();
  }, []);
  
  // Carregar texto específico da URL
  useEffect(() => {
    const textoId = searchParams.get("id");
    if (textoId && !currentTextId) {
      loadTexto(textoId);
    }
  }, [searchParams]);
  
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
  
  // Função para carregar universos
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

      // Carregar episódios
      const episodesRes = await fetch("/api/episodes");
      const episodesData = await episodesRes.json();
      if (episodesRes.ok && episodesData.episodes) {
        setEpisodes(episodesData.episodes);
      }

      // Carregar categorias
      const categoriesRes = await fetch("/api/categories");
      const categoriesData = await categoriesRes.json();
      if (categoriesRes.ok && categoriesData.categories) {
        setCategories(categoriesData.categories);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };
  
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
    setIsMetadataSaved(false);
    router.push("/escrita");
  };
  
  // Função para lidar com seleção de texto
  const handleTextSelect = (text: string, position: { x: number; y: number }) => {
    setSelectedText(text);
    setSelectionMenuPosition(position);
  };
  

  
  // Função para abrir modal de confirmação de delete
  const handleDelete = (id: string, titulo: string) => {
    setTextoToDelete({ id, titulo });
    setShowDeleteConfirm(true);
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
  const handleSave = async (autoSave: boolean = false) => {
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
        status: 'rascunho',
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
    await handleSave();
    // TODO: Implementar lógica de publicação
    toast.success('Texto publicado!');
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

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-light-base dark:bg-dark-base flex flex-col">
      <Header showNav={true} currentPage="escrita" />

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* COLUNA A - Sidebar (Biblioteca de Textos) */}
        {isSidebarOpen && (
          <aside className="w-[250px] h-screen bg-light-raised dark:bg-dark-raised overflow-y-auto md:relative fixed inset-y-0 left-0 z-40 md:z-auto flex flex-col">
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
        )}

        {/* Botão de expandir sidebar (quando colapsada) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-12 border-r border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised flex items-center justify-center hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex-shrink-0"
            title="Abrir barra lateral"
          >
            <svg className="w-5 h-5 text-text-light-secondary dark:text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        )}

        {/* COLUNA B - Conteúdo Principal (6 Linhas) */}
        <main className="flex-1 flex flex-col overflow-hidden">
          
          {/* LINHA 1: Grid 3 colunas - Vazio (A1) + Modo Foco (B1) + Avatares (C1) */}
          <div className="h-16 border-b border-border-light-default dark:border-border-dark-default grid grid-cols-[48px_1fr_48px] gap-0 items-center px-4 flex-shrink-0 max-w-[1328px] mx-auto w-full">
            {/* Célula A1 - Vazia */}
            <div></div>
            
            {/* Célula B1 - Modo Foco (esquerda) + Avatares (direita) */}
            <div className="flex justify-between items-center max-w-[672px]">
              <button 
                onClick={() => setModoFoco(true)}
                className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-full hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm font-medium inline-flex items-center gap-2"
              >
                👁 Modo Foco
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUrizen(!showUrizen);
                    if (!showUrizen) setShowUrthona(false);
                  }}
                  className="w-10 h-10 rounded-full hover:ring-2 hover:ring-[#5B7C8D] transition-all"
                  title="Urizen (Consulta)"
                >
                  <img src="/urizen-avatar.png" alt="Urizen" className="w-full h-full rounded-full object-cover" />
                </button>
                <button
                  onClick={() => {
                    setShowUrthona(!showUrthona);
                    if (!showUrthona) setShowUrizen(false);
                  }}
                  className="w-10 h-10 rounded-full hover:ring-2 hover:ring-[#C85A54] transition-all"
                  title="Urthona (Criativo)"
                >
                  <img src="/urthona-avatar.png" alt="Urthona" className="w-full h-full rounded-full object-cover" />
                </button>
              </div>
            </div>
            
            {/* Célula C1 - Vazia */}
            <div></div>
          </div>

          {/* LINHA 2: Grid 3 colunas - Botão Colapsar (A2) + Título (B2) + Menu (C2) */}
          <div className="h-12 border-b border-border-light-default dark:border-border-dark-default grid grid-cols-[48px_1fr_48px] gap-0 items-center px-4 flex-shrink-0 max-w-[1328px] mx-auto w-full">
            {/* Célula A2 - Botão Colapsar */}
            <button
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className="text-xl hover:opacity-70 transition-opacity text-text-light-secondary dark:text-dark-secondary"
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
            
            {/* Célula B2 - Título + Três Pontos */}
            <div className="flex justify-between items-center max-w-[672px]">
              <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary truncate">
                A Noite do Cão Misterioso (Cópia)
              </h2>
              
              <div className="relative" ref={optionsMenuRef}>
              <button 
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="text-xl hover:opacity-70 transition-opacity text-text-light-secondary dark:text-dark-secondary"
              >
                ⋮
              </button>
              
              {/* Dropdown Menu */}
              {showOptionsMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default z-50">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        console.log('Duplicar texto');
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
                        console.log('Ver estatísticas');
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
                        console.log('Exportar texto');
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
                        // TODO: Implementar exclusão
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

          {/* LINHA 3: Metadados (Condicional) */}
          {isHeaderExpanded && (
            <div className="border-b border-border-light-default dark:border-border-dark-default grid grid-cols-[48px_1fr_48px] gap-0 px-4 py-4 flex-shrink-0 max-w-[1328px] mx-auto w-full">
              <div></div>
              <div className="space-y-4 max-w-[672px]">
              {/* Botão de editar (só aparece quando está bloqueado) */}
              {isMetadataLocked && (
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

              {/* Metadados Grid */}
              <div className="grid grid-cols-4 gap-4">
                <UniverseDropdown
                  label="UNIVERSO"
                  universes={universes}
                  selectedId={universeId}
                  onSelect={(id) => {
                    setUniverseId(id);
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
                  episodes={episodes.filter(e => e.world_id === worldId)}
                  selectedEpisode={episodio}
                  onSelect={setEpisodio}
                  onCreate={() => {
                    console.log("Criar novo episódio");
                  }}
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
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => handleSave(false)}
                    disabled={isSaving || !titulo.trim() || !universeId}
                    variant="primary"
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
          <div className="h-12 border-b border-border-light-default dark:border-border-dark-default grid grid-cols-[48px_1fr_48px] gap-0 items-center px-4 flex-shrink-0 max-w-[1328px] mx-auto w-full">
            {/* Célula A4 - Vazia */}
            <div></div>
            
            {/* Célula B4 - Toolbar */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => editorRef.current?.chain().focus().toggleBold().run()}
                className="text-sm font-medium hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary"
              >
                B
              </button>
              <button 
                onClick={() => editorRef.current?.chain().focus().toggleItalic().run()}
                className="text-sm font-medium hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary"
              >
                /
              </button>
              <div className="relative" ref={stylesDropdownRef}>
                <button 
                  onClick={() => setShowStylesDropdown(!showStylesDropdown)}
                  className="text-sm font-medium hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary"
                >
                  Aa ▼
                </button>
                {showStylesDropdown && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg py-2 z-50 min-w-[120px]">
                    <button
                      onClick={() => {
                        setFontFamily('serif');
                        setShowStylesDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors ${
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
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors ${
                        fontFamily === 'sans' ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-text-light-primary dark:text-dark-primary'
                      }`}
                    >
                      Sans
                    </button>
                    <button
                      onClick={() => {
                        setFontFamily('mono');
                        setShowStylesDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors ${
                        fontFamily === 'mono' ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-text-light-primary dark:text-dark-primary'
                      }`}
                    >
                      Mono
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Célula C4 - Vazia */}
            <div></div>
          </div>

          {/* LINHA 5: Grid 3 colunas - Vazio (A5) + Editor (B5) + Vazio (C5) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-[48px_1fr_48px] gap-0 px-4 py-6 max-w-[1328px] mx-auto w-full">
            {/* Célula A5 - Vazia */}
            <div></div>
            
            {/* Célula B5 - Editor */}
            <div className="max-w-[672px]">
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
            />
            </div>
            
            {/* Célula C5 - Vazia */}
            <div></div>
          </div>

          {/* LINHA 6: Grid 3 colunas - Vazio (A6) + Botões (B6) + Vazio (C6) */}
          <footer className="border-t border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base py-4 flex-shrink-0 max-w-[1328px] mx-auto w-full">
        <div className="grid grid-cols-[48px_1fr_48px] gap-0 px-4 max-w-[1328px] mx-auto w-full">
          {/* Célula A6 - Vazia */}
          <div></div>
          
          {/* Célula B6 - Botões */}
          <div className="flex justify-start">
            <div className="max-w-[672px] w-full flex gap-3 justify-end">
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
          className="fixed bg-light-base dark:bg-dark-base overflow-hidden flex flex-col shadow-2xl rounded-lg border border-border-light-default dark:border-border-dark-default"
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
          <div className="flex flex-col h-full px-4 pt-4 pb-4">
            {/* Header do Chat (Draggable) */}
            <div 
              className="flex justify-between items-center mb-4 pb-4 cursor-grab active:cursor-grabbing border-b border-border-light-default dark:border-border-dark-default"
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
                      "max-w-[85%] px-4 py-2 rounded-lg",
                      msg.role === "user"
                        ? "bg-primary-600 dark:bg-primary-500 text-white"
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
            <div className="flex gap-2 items-end pt-4 border-t border-border-light-default dark:border-border-dark-default">
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
                className="flex-1 px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-dark-tertiary outline-none focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 resize-none max-h-24 overflow-y-auto text-sm"
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
      {modoFoco && (
        <div className={clsx(
          "fixed inset-0 z-50 flex flex-col",
          temaFoco === 'light' ? 'bg-white' : 'bg-gray-900'
        )}>
          {/* Header do Modo Foco */}
          <div className={clsx(
            "flex justify-between items-center px-8 py-4 border-b",
            temaFoco === 'light' ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900'
          )}>
            <h1 className={clsx(
              "text-2xl font-bold",
              temaFoco === 'light' ? 'text-gray-900' : 'text-white'
            )}>
              A Noite do Cão Misterioso (Cópia)
            </h1>
            
            <div className="flex items-center gap-4">
              {/* Controles de Tema */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTemaFoco('light')}
                  className={clsx(
                    "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                    temaFoco === 'light'
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  )}
                  title="Modo Branco"
                >
                  ☀️ Branco
                </button>
                <button
                  onClick={() => setTemaFoco('dark')}
                  className={clsx(
                    "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                    temaFoco === 'dark'
                      ? "bg-primary-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  )}
                  title="Modo Preto"
                >
                  🌙 Preto
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
                onClick={() => setModoFoco(false)}
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
              <div className={`max-w-4xl mx-auto px-16 py-12 font-${fontFamily}`}>
                <TiptapEditor
                  value={conteudo}
                  onChange={(value) => setConteudo(value)}
                  placeholder="Escreva seu texto aqui..."
                  className={clsx(
                    "w-full min-h-[calc(100vh-12rem)] bg-transparent border-none",
                    temaFoco === 'light' ? 'text-gray-900' : 'text-white'
                  )}
                  showToolbar={false}
                  editorRef={editorRef}
                  fontFamily={fontFamily}
                  onFontChange={(font) => setFontFamily(font)}
                  onTextSelect={handleTextSelect}
                />
              </div>
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
