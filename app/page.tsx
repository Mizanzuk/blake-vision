"use client";

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import {
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Modal,
  Card,
  EmptyState,
  Loading,
  ThemeToggle,
  LocaleToggle,
} from "@/app/components/ui";
import { UniverseDropdown } from "@/app/components/ui/UniverseDropdown";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { toast } from "sonner";
import { clsx } from "clsx";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FichaViewModal from "@/app/components/shared/FichaViewModal";
import type { ChatMessage, ChatMode, ChatSession, Universe, Ficha } from "@/app/types";
import { loadChatSessions, saveChatSession, deleteChatSession } from "@/app/lib/chat-sessions";

const SESSION_STORAGE_KEY = "blake-vision-sessions-v1";
const MAX_MESSAGES_PER_SESSION = 32;
const MAX_SESSIONS = 40;

const PERSONAS = {
  consulta: {
    nome: "Urizen",
    titulo: "A Lei (Consulta)",
    intro: "Eu sou Urizen, a Lei deste universo. Minha função é garantir a coerência dos Registros. O que você quer analisar hoje?",
    styles: {
      color: "text-[#5B7C8D] dark:text-[#7B9CAD]",
      bg: "bg-[#5B7C8D]/15 dark:bg-[#5B7C8D]/25",
      header: "bg-[#5B7C8D]/90 dark:bg-[#5B7C8D]/90",
      button: "bg-[#5B7C8D]/20 border-[#5B7C8D] text-[#5B7C8D] dark:text-[#7B9CAD] hover:bg-[#5B7C8D]/30",
      badge: "urizen" as const,
    }
  },
  criativo: {
    nome: "Urthona",
    titulo: "O Fluxo (Criativo)",
    intro: "Eu sou Urthona, o Forjador. Minha forja está pronta para criar e expandir as narrativas. Qual a próxima história?",
    styles: {
      color: "text-[#C85A54] dark:text-[#D87A74]",
      bg: "bg-[#C85A54]/15 dark:bg-[#C85A54]/25",
      header: "bg-[#C85A54]/90 dark:bg-[#C85A54]/90",
      button: "bg-[#C85A54]/20 border-[#C85A54] text-[#C85A54] dark:text-[#D87A74] hover:bg-[#C85A54]/30",
      badge: "urthona" as const,
    }
  }
};

function createIntroMessage(mode: ChatMode): ChatMessage {
  const persona = PERSONAS[mode];
  if (!persona) throw new Error(`Invalid mode: ${mode}`);
  return {
    id: "intro",
    role: "assistant",
    content: persona.intro,
  };
}

function buildTitleFromQuestion(text: string): string {
  const words = text.trim().split(/\s+/).slice(0, 5);
  return words.join(" ") + (text.split(/\s+/).length > 5 ? "..." : "");
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  
  // Universes
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  
  // Universe modals
  const [showCreateUniverseModal, setShowCreateUniverseModal] = useState(false);
  const [showEditUniverseModal, setShowEditUniverseModal] = useState(false);
  const [showDeleteUniverseModal, setShowDeleteUniverseModal] = useState(false);
  const [universeToDelete, setUniverseToDelete] = useState<{id: string, nome: string} | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const [universeForm, setUniverseForm] = useState({ id: "", nome: "", descricao: "" });
  const [isSubmittingUniverse, setIsSubmittingUniverse] = useState(false);
  
  // Chat sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState("");
  
  // Ficha modal state
  const [viewingFicha, setViewingFicha] = useState<Ficha | null>(null);
  const [showFichaModal, setShowFichaModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      loadUniverses();
      loadSessions();
      
      // Load selected universe from localStorage
      const saved = localStorage.getItem("selectedUniverseId");
      if (saved) {
        setSelectedUniverseId(saved);
      }
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeSessionId, sessions]);

  // Auto-save active session when messages change
  useEffect(() => {
    if (activeSessionId && userId) {
      const activeSession = sessions.find(s => s.id === activeSessionId);
      if (activeSession) {
        saveChatSession(supabase, activeSession, userId).catch(err => {
          console.error("Error auto-saving session:", err);
        });
      }
    }
  }, [sessions, activeSessionId, userId, supabase]);

  // Close profile dropdown on Esc key
  useEffect(() => {
    function handleEscape(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && showProfileDropdown) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProfileDropdown]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      
      // Usar nome completo do user_metadata ou email como fallback
      const nome = user.user_metadata?.full_name || user.user_metadata?.nome || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
      setUserName(nome);
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
        const loadedUniverses = data.universes || [];
        setUniverses(loadedUniverses);
        // Item 4: Se não houver universos, mostrar modal obrigatório
        if (loadedUniverses.length === 0) {
          setShowCreateUniverseModal(true);
        }
      } else {
        toast.error(t.errors.generic);
      }
    } catch (error) {
      console.error("Error loading universes:", error);
      toast.error(t.errors.network);
    }
  }

  async function loadSessions() {
    try {
      const loadedSessions = await loadChatSessions(supabase);
      setSessions(loadedSessions || []);
    } catch (e) {
      console.error("Error loading sessions:", e);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleOpenFicha(fichaId: string) {
    try {
      const { data, error } = await supabase
        .from('fichas')
        .select('*')
        .eq('id', fichaId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setViewingFicha(data as Ficha);
        setShowFichaModal(true);
      }
    } catch (error) {
      console.error('Error loading ficha:', error);
      toast.error('Erro ao carregar ficha');
    }
  }

  function handleUniverseChange(universeId: string) {
    setSelectedUniverseId(universeId);
    localStorage.setItem("selectedUniverseId", universeId);
  }

  async function handleCreateUniverse(e: FormEvent) {
    e.preventDefault();
    setIsSubmittingUniverse(true);

    try {
      const response = await fetch("/api/universes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: universeForm.nome,
          descricao: universeForm.descricao,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t.success.created);
        setUniverses([data.universe, ...universes]);
        setSelectedUniverseId(data.universe.id);
        localStorage.setItem("selectedUniverseId", data.universe.id);
        setShowCreateUniverseModal(false);
        setUniverseForm({ id: "", nome: "", descricao: "" });
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error creating universe:", error);
      toast.error(t.errors.network);
    } finally {
      setIsSubmittingUniverse(false);
    }
  }

  async function handleEditUniverse(e: FormEvent) {
    e.preventDefault();
    setIsSubmittingUniverse(true);

    try {
      const response = await fetch("/api/universes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(universeForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t.success.updated);
        setUniverses(universes.map(u => u.id === data.universe.id ? data.universe : u));
        setShowEditUniverseModal(false);
        setUniverseForm({ id: "", nome: "", descricao: "" });
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error updating universe:", error);
      toast.error(t.errors.network);
    } finally {
      setIsSubmittingUniverse(false);
    }
  }

  function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { num1, num2, answer: num1 + num2 };
  }

  function promptDeleteUniverse(universeId: string, universeName: string) {
    const captcha = generateCaptcha();
    setCaptchaQuestion(captcha);
    setCaptchaAnswer("");
    setUniverseToDelete({ id: universeId, nome: universeName });
    setShowDeleteUniverseModal(true);
  }

  async function confirmDeleteUniverse() {
    if (!universeToDelete) return;
    
    if (parseInt(captchaAnswer) !== captchaQuestion.answer) {
      toast.error("Resposta incorreta. Tente novamente.");
      return;
    }

    try {
      const response = await fetch(`/api/universes?id=${universeToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Universo deletado com sucesso");
        setUniverses(universes.filter(u => u.id !== universeToDelete.id));
        if (selectedUniverseId === universeToDelete.id) {
          setSelectedUniverseId("");
          localStorage.removeItem("selectedUniverseId");
        }
        setShowDeleteUniverseModal(false);
        setUniverseToDelete(null);
        setCaptchaAnswer("");
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error deleting universe:", error);
      toast.error(t.errors.network);
    }
  }

  async function startNewSession(mode: ChatMode) {
    if (!userId) {
      toast.error("Erro: usuário não autenticado");
      return;
    }

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: t.chat.newChat,
      mode,
      createdAt: Date.now(),
      messages: [createIntroMessage(mode)],
      universeId: selectedUniverseId || undefined,
    };

    // Save to database
    const success = await saveChatSession(supabase, newSession, userId);
    if (!success) {
      toast.error("Erro ao criar nova conversa");
      return;
    }

    // Use functional form to ensure we have the latest sessions state
    setSessions(prevSessions => [newSession, ...prevSessions].slice(0, MAX_SESSIONS));
    setActiveSessionId(newSession.id);
    setShowModeSelector(false);
    inputRef.current?.focus();
  }

  function handleCopyMessage(content: string) {
    navigator.clipboard.writeText(content).then(() => {
      toast.success("Resposta copiada para a área de transferência");
    }).catch(() => {
      toast.error("Erro ao copiar resposta");
    });
  }

  function handleTextToSpeech(text: string) {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Seu navegador não suporta leitura de texto");
    }
  }

  async function handleSendToEditor(content: string) {
    try {
      const response = await fetch("/api/textos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: "Texto do Chat - " + new Date().toLocaleDateString("pt-BR"),
          conteudo: content,
          universe_id: selectedUniverseId || null,
          status: "rascunho",
        }),
      });

      const data = await response.json();

      if (response.ok && data.texto) {
        toast.success("Texto enviado para o Editor!");
        router.push(`/editor/${data.texto.id}`);
      } else {
        toast.error("Erro ao enviar para o Editor");
      }
    } catch (error) {
      console.error("Erro ao enviar para editor:", error);
      toast.error("Erro ao enviar para o Editor");
    }
  }

  function handleClearHistory() {
    if (!activeSessionId) return;
    
    const confirmed = confirm("Tem certeza que deseja limpar o histórico desta conversa? Esta ação não pode ser desfeita.");
    if (!confirmed) return;

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const clearedSession = {
      ...currentSession,
      messages: [createIntroMessage(currentSession.mode)],
    };

    setSessions(prevSessions => prevSessions.map(s => s.id === activeSessionId ? clearedSession : s));
    toast.success("Histórico limpo com sucesso");
  }

  function handleExportConversation() {
    if (!activeSessionId) return;

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const persona = PERSONAS[currentSession.mode];
    if (!persona) return;
    const date = new Date(currentSession.createdAt).toLocaleString('pt-BR');
    
    let markdown = `# ${currentSession.title}\n\n`;
    markdown += `**Modo:** ${persona.nome} - ${persona.titulo}\n`;
    markdown += `**Data:** ${date}\n`;
    if (currentSession.universeId) {
      const universe = universes.find(u => u.id === currentSession.universeId);
      if (universe) {
        markdown += `**Universo:** ${universe.nome}\n`;
      }
    }
    markdown += `\n---\n\n`;

    currentSession.messages.forEach((message, index) => {
      if (message.id === "intro") return; // Skip intro message
      
      const role = message.role === "user" ? "Você" : persona.nome;
      markdown += `### ${role}\n\n${message.content}\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Conversa exportada com sucesso");
  }

  async function handleSendMessage(e?: FormEvent) {
    if (e) e.preventDefault();
    
    if (!input.trim() || isSending) return;
    
    if (!activeSessionId) {
      setShowModeSelector(true);
      return;
    }

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    // Update session with user message
    const updatedMessages = [...currentSession.messages, userMessage];
    const updatedSession = {
      ...currentSession,
      messages: updatedMessages,
      title: currentSession.messages.length === 1 
        ? buildTitleFromQuestion(input) 
        : currentSession.title,
    };

    setSessions(prevSessions => prevSessions.map(s => s.id === activeSessionId ? updatedSession : s));
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          mode: currentSession.mode,
          universeId: currentSession.universeId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || t.errors.generic);
        return;
      }

      // Process stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      // Create assistant message placeholder
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      };

      // Add empty assistant message
      setSessions(prevSessions => prevSessions.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...updatedMessages, assistantMessage] }
          : s
      ));

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Update message with accumulated content
          setSessions(prevSessions => prevSessions.map(s => {
            if (s.id !== activeSessionId) return s;
            return {
              ...s,
              messages: s.messages.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: accumulatedContent }
                  : m
              )
            };
          }));
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t.errors.network);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  async function deleteSession(sessionId: string) {
    const session = sessions.find(s => s.id === sessionId);
    const confirmed = confirm(`Tem certeza que deseja deletar a conversa "${session?.title || 'Nova Conversa'}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    
    // Delete from database
    const success = await deleteChatSession(supabase, sessionId);
    if (!success) {
      toast.error("Erro ao deletar conversa");
      return;
    }
    
    // Update local state
    setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
    
    toast.success("Conversa deletada com sucesso");
  }
  
  function startEditingSession(sessionId: string, currentTitle: string) {
    setEditingSessionId(sessionId);
    setEditingSessionTitle(currentTitle);
  }
  
  function saveSessionTitle() {
    if (editingSessionId && editingSessionTitle.trim()) {
      setSessions(prevSessions => prevSessions.map(s => 
        s.id === editingSessionId 
          ? { ...s, title: editingSessionTitle.trim() }
          : s
      ));
      setEditingSessionId(null);
      setEditingSessionTitle("");
    }
  }
  
  function cancelEditingSession() {
    setEditingSessionId(null);
    setEditingSessionTitle("");
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const persona = activeSession ? PERSONAS[activeSession.mode] : null;

  if (isLoading) {
    return <Loading fullScreen text={t.common.loading} />;
  }

  return (
    <div className="flex h-screen bg-light-base dark:bg-dark-base">
      {/* Sidebar */}
      <aside className={clsx(
        "border-r border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised flex flex-col transition-all duration-300 overflow-hidden",
        "fixed md:relative inset-y-0 left-0 z-50",
        isSidebarOpen ? "w-80" : "w-0 border-r-0"
      )}>
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-text-light-primary dark:text-dark-primary">
              Blake Vision
            </h1>
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

          {/* Universe Dropdown - Moved to top */}
          <UniverseDropdown
            label={t.universe.title.toUpperCase()}
            universes={universes}
            selectedId={selectedUniverseId}
            onSelect={handleUniverseChange}
            onEdit={(universe) => {
              setUniverseForm({ id: universe.id, nome: universe.nome, descricao: universe.descricao || "" });
              setShowEditUniverseModal(true);
            }}
            onDelete={promptDeleteUniverse}
            onCreate={() => setShowCreateUniverseModal(true)}
          />
        </div>



        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <button
            onClick={() => router.push("/projetos")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Projetos
          </button>
          
          <button
            onClick={() => router.push("/catalog")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {t.nav.catalog}
          </button>
          
          <button
            onClick={() => router.push("/editor")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editor
          </button>
          
          <button
            onClick={() => router.push("/biblioteca")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Biblioteca
          </button>
          
          <button
            onClick={() => router.push("/timeline")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.nav.timeline}
          </button>
          
          <button
            onClick={() => router.push("/upload")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {t.nav.upload}
          </button>
          
          <button
            onClick={() => router.push("/faq")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.nav.faq}
          </button>
        </nav>

        {/* New Chat Button - Moved after navigation */}
        <div className="p-4">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => setShowModeSelector(true)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {t.chat.newChat}
          </Button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-text-light-tertiary dark:text-dark-tertiary uppercase tracking-wide mb-3">
            {t.chat.history}
          </h3>
          
          {sessions.length === 0 ? (
            <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary text-center py-8">
              {t.chat.noHistory}
            </p>
          ) : (
            <div className="space-y-1">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={clsx(
                    "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border",
                    activeSessionId === session.id
                      ? "bg-[#FAFAF8] dark:bg-primary-900/30 text-text-light-primary dark:text-dark-primary border-border-light-strong dark:border-border-dark-strong"
                      : "bg-transparent dark:bg-transparent text-text-light-secondary dark:text-dark-secondary border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay"
                  )}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <Badge variant={PERSONAS[session.mode].styles.badge} size="sm" className="w-[70px] justify-center flex-shrink-0">
                    {session.mode === 'consulta' ? 'Consulta' : 'Criativo'}
                  </Badge>
                  {editingSessionId === session.id ? (
                    <input
                      type="text"
                      value={editingSessionTitle}
                      onChange={(e) => setEditingSessionTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveSessionTitle();
                        if (e.key === 'Escape') cancelEditingSession();
                      }}
                      onBlur={saveSessionTitle}
                      autoFocus
                      className="flex-1 text-sm px-2 py-1 rounded bg-light-overlay dark:bg-dark-overlay border border-border-light-default dark:border-border-dark-default"
                    />
                  ) : (
                    <span className="flex-1 text-sm line-clamp-2">{session.title}</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingSession(session.id, session.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary-light/10 text-primary-light transition-opacity"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const prevSessionId = activeSessionId;
                      setActiveSessionId(session.id);
                      setTimeout(() => {
                        handleExportConversation();
                        setActiveSessionId(prevSessionId);
                      }, 0);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary-light/10 text-primary-light transition-opacity"
                    title="Exportar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error-light/10 text-error-light transition-opacity"
                    title="Apagar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer with Profile Dropdown */}
        <div className="p-4 border-t border-border-light-default dark:border-border-dark-default">
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium truncate">{userName || "Usuário"}</span>
              <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            
            {showProfileDropdown && (
              <>
                {/* Backdrop - fecha ao clicar fora */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileDropdown(false)}
                />
                
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    router.push('/profile');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Perfil
                </button>
                
                <ThemeToggle variant="dropdown" />
                
                <div className="border-t border-border-light-default dark:border-border-dark-default" />
                
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error-light hover:bg-error-light/10 dark:text-error-light transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair da conta
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Icons (when closed) - ChatGPT style */}
      {!isSidebarOpen && (
        <div className="fixed left-0 top-0 h-full w-12 bg-light-raised dark:bg-dark-raised border-r border-border-light-default dark:border-border-dark-default flex flex-col items-center py-4 gap-3 z-50">
          {/* Expand Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
            title="Abrir barra lateral"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-6 h-px bg-border-light-default dark:bg-border-dark-default" />

          {/* New Chat Icon */}
          <button
            onClick={() => setShowModeSelector(true)}
            className="p-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
            title="Nova Conversa"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Chat Area */}
      <main className={clsx(
        "flex-1 flex flex-col transition-all duration-300",
        !isSidebarOpen && "ml-12"
      )}>
        {activeSession ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeSession.messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={clsx(
                    "group flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={`/${activeSession.mode === 'consulta' ? 'urizen' : 'urthona'}-avatar.png`}
                          alt={activeSession.mode === 'consulta' ? 'Urizen' : 'Urthona'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-text-light-tertiary dark:text-dark-tertiary">
                        {activeSession.mode === 'consulta' ? 'Urizen' : 'Urthona'}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={clsx(
                      "relative max-w-3xl rounded-2xl px-6 py-4",
                      message.role === "user"
                        ? "bg-primary-600 dark:bg-primary-500 text-white"
                        : "bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default"
                    )}
                  >
                    <div className={clsx(
                      "prose prose-sm max-w-none [&>*:last-child]:mb-0",
                      message.role === "user" 
                        ? "prose-invert" 
                        : "prose-stone dark:prose-invert"
                    )}>
                      {message.role === "assistant" ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          urlTransform={(url) => url} // Permitir todos os protocolos, incluindo ficha:
                          components={{
                            a: ({ node, href, children, ...props }) => {
                              // Detectar links de fichas (formato: ficha:ID)
                              if (href?.startsWith('ficha:')) {
                                const fichaId = href.replace('ficha:', '');
                                return (
                                  <button
                                    onClick={() => handleOpenFicha(fichaId)}
                                    className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer font-medium"
                                  >
                                    {children}
                                  </button>
                                );
                              }
                              // Links normais
                              return (
                                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                  {children}
                                </a>
                              );
                            }
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                    
                    {/* Action Buttons (only for assistant messages, on hover) */}
                    {message.role === "assistant" && message.id !== "intro" && (
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-4 right-6 flex gap-1">
                        <button
                          onClick={() => handleTextToSpeech(message.content)}
                          className="p-1.5 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-tertiary dark:text-dark-tertiary hover:text-text-light-primary dark:hover:text-dark-primary transition-all"
                          title="Ler em voz alta"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleCopyMessage(message.content)}
                          className="p-1.5 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-tertiary dark:text-dark-tertiary hover:text-text-light-primary dark:hover:text-dark-primary transition-all"
                          title="Copiar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleSendToEditor(message.content)}
                          className="p-1.5 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-tertiary dark:text-dark-tertiary hover:text-text-light-primary dark:hover:text-dark-primary transition-all"
                          title="Enviar para Editor"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>


                </div>
              ))}
              
              {isSending && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={activeSession?.mode === 'consulta' ? '/urizen-avatar.png' : '/urthona-avatar.png'}
                      alt={persona?.nome || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-2xl px-6 py-4">
                    <Loading size="sm" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                <div className="flex gap-3 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Auto-resize
                      e.target.style.height = 'auto';
                      const lineHeight = 24; // ~1.5rem
                      const maxLines = 10;
                      const newHeight = Math.min(e.target.scrollHeight, lineHeight * maxLines);
                      e.target.style.height = newHeight + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t.chat.placeholder}
                    rows={1}
                    disabled={isSending}
                    className="flex-1 px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none overflow-y-auto"
                    style={{ minHeight: '40px', maxHeight: '240px', lineHeight: '24px' }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isSending}
                    className="px-4 h-10 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 dark:disabled:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    {isSending ? (
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
                <p className="text-xs text-text-light-tertiary dark:text-dark-tertiary mt-2">
                  Pressione Enter para enviar, Shift+Enter para nova linha
                </p>
              </form>
            </div>
          </>
        ) : (
          universes.length > 0 ? (
            // Mostrar seleção de agentes quando há universos
            <div className="flex items-start justify-center h-full p-6 pt-16">
              <div className="max-w-4xl w-full">
                <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary text-center mb-8">
                  Selecione o modo
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card
                    variant="outlined"
                    padding="lg"
                    hoverable
                    onClick={() => startNewSession("consulta")}
                    className="cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full mb-4 overflow-hidden border-2 border-primary-300">
                      <img src="/urizen-avatar.png" alt="Urizen" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xl font-bold text-text-light-primary dark:text-dark-primary mb-2">
                      {PERSONAS.consulta.nome}
                    </h3>
                    <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary mb-4">
                      {PERSONAS.consulta.titulo}
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
                      Consulte fatos estabelecidos, verifique consistências e analise seu universo com precisão.
                    </p>
                  </Card>

                  <Card
                    variant="outlined"
                    padding="lg"
                    hoverable
                    onClick={() => startNewSession("criativo")}
                    className="cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full mb-4 overflow-hidden border-2 border-primary-300">
                      <img src="/urthona-avatar.png" alt="Urthona" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xl font-bold text-text-light-primary dark:text-dark-primary mb-2">
                      {PERSONAS.criativo.nome}
                    </h3>
                    <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary mb-4">
                      {PERSONAS.criativo.titulo}
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
                      Crie e expanda narrativas, gere novas histórias e enriqueça seu universo com coerência.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            // Mostrar empty state quando não há universos
            <EmptyState
              icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title="Bem-vindo ao Blake Vision"
              description="Crie seu primeiro universo para começar"
              action={
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowCreateUniverseModal(true)}
                >
                  Criar Universo
                </Button>
              }
            />
          )
        )}
      </main>

      {/* Mode Selector Modal */}
      <Modal
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        title={t.chat.selectMode}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Card
            variant="outlined"
            padding="lg"
            hoverable
            onClick={() => startNewSession("consulta")}
            className="cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full mb-4 overflow-hidden border-2 border-primary-300">
              <img src="/urizen-avatar.png" alt="Urizen" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-text-light-primary dark:text-dark-primary mb-2">
              {PERSONAS.consulta.nome}
            </h3>
            <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary mb-4">
              {PERSONAS.consulta.titulo}
            </p>
            <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
              Consulte fatos estabelecidos, verifique consistências e analise seu universo com precisão.
            </p>
          </Card>

          <Card
            variant="outlined"
            padding="lg"
            hoverable
            onClick={() => startNewSession("criativo")}
            className="cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full mb-4 overflow-hidden border-2 border-primary-300">
              <img src="/urthona-avatar.png" alt="Urthona" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-text-light-primary dark:text-dark-primary mb-2">
              {PERSONAS.criativo.nome}
            </h3>
            <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary mb-4">
              {PERSONAS.criativo.titulo}
            </p>
            <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
              Crie e expanda narrativas, gere novas histórias e enriqueça seu universo com coerência.
            </p>
          </Card>
        </div>
      </Modal>

      {/* Create Universe Modal */}
      <Modal
        isOpen={showCreateUniverseModal}
        onClose={() => {
          setShowCreateUniverseModal(false);
          setUniverseForm({ id: "", nome: "", descricao: "" });
        }}
        title={t.universe.create}
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCreateUniverseModal(false);
                setUniverseForm({ id: "", nome: "", descricao: "" });
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreateUniverse}
              loading={isSubmittingUniverse}
            >
              {t.common.create}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateUniverse} className="space-y-4">
          <Input
            label={t.universe.name}
            value={universeForm.nome}
            onChange={(e) => setUniverseForm({ ...universeForm, nome: e.target.value })}
            placeholder="Ex: Meu Universo Épico"
            required
            fullWidth
          />
          <Textarea
            label={t.universe.description}
            value={universeForm.descricao}
            onChange={(e) => setUniverseForm({ ...universeForm, descricao: e.target.value })}
            placeholder="Descreva seu universo..."
            fullWidth
          />
        </form>
      </Modal>

      {/* Edit Universe Modal */}
      <Modal
        isOpen={showEditUniverseModal}
        onClose={() => {
          setShowEditUniverseModal(false);
          setUniverseForm({ id: "", nome: "", descricao: "" });
        }}
        title={t.universe.edit}
        footer={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowEditUniverseModal(false);
                setUniverseForm({ id: "", nome: "", descricao: "" });
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleEditUniverse}
              loading={isSubmittingUniverse}
            >
              {t.common.save}
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditUniverse} className="space-y-4">
          <Input
            label={t.universe.name}
            value={universeForm.nome}
            onChange={(e) => setUniverseForm({ ...universeForm, nome: e.target.value })}
            required
            fullWidth
          />
          <Textarea
            label={t.universe.description}
            value={universeForm.descricao}
            onChange={(e) => setUniverseForm({ ...universeForm, descricao: e.target.value })}
            fullWidth
          />
        </form>
      </Modal>

      {/* Delete Universe Modal with Captcha */}
      <Modal
        isOpen={showDeleteUniverseModal}
        onClose={() => {
          setShowDeleteUniverseModal(false);
          setUniverseToDelete(null);
          setCaptchaAnswer("");
        }}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-light-secondary dark:text-dark-secondary">
            Tem certeza que deseja deletar o universo <strong>"{universeToDelete?.nome}"</strong>?
          </p>
          <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
            Esta ação não pode ser desfeita.
          </p>
          
          {/* Captcha */}
          <div className="p-4 bg-light-overlay dark:bg-dark-overlay rounded-lg border border-border-light-default dark:border-border-dark-default">
            <p className="text-sm font-medium text-text-light-primary dark:text-dark-primary mb-2">
              Para confirmar, resolva esta operação:
            </p>
            <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-3">
              {captchaQuestion.num1} + {captchaQuestion.num2} = ?
            </p>
            <Input
              type="number"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              placeholder="Digite a resposta"
              fullWidth
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowDeleteUniverseModal(false);
                setUniverseToDelete(null);
                setCaptchaAnswer("");
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={confirmDeleteUniverse}
            >
              Deletar Universo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ficha View Modal */}
      <FichaViewModal
        isOpen={showFichaModal}
        onClose={() => {
          setShowFichaModal(false);
          setViewingFicha(null);
        }}
        onEdit={() => {
          // Navegar para o editor com a ficha
          if (viewingFicha) {
            router.push(`/editor/${viewingFicha.id}`);
          }
        }}
        ficha={viewingFicha}
      />
    </div>
  );
}
