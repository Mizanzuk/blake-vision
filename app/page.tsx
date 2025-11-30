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
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { toast } from "sonner";
import { clsx } from "clsx";
import type { ChatMessage, ChatMode, ChatSession, Universe } from "@/app/types";

const SESSION_STORAGE_KEY = "blake-vision-sessions-v1";
const MAX_MESSAGES_PER_SESSION = 32;
const MAX_SESSIONS = 40;

const PERSONAS = {
  consulta: {
    nome: "Urizen",
    titulo: "A Lei (Consulta)",
    intro: "Eu sou Urizen, a Lei deste universo. Minha função é garantir a coerência dos Registros. O que você quer analisar hoje?",
    styles: {
      color: "text-cyan-200",
      bg: "bg-cyan-900/20",
      header: "bg-gradient-to-tr from-cyan-600 via-emerald-500 to-blue-500",
      button: "bg-cyan-500/20 border-cyan-400 text-cyan-200 hover:bg-cyan-500/30",
      badge: "urizen" as const,
    }
  },
  criativo: {
    nome: "Urthona",
    titulo: "O Fluxo (Criativo)",
    intro: "Eu sou Urthona, o Forjador. Minha forja está pronta para criar e expandir as narrativas. Qual a próxima história?",
    styles: {
      color: "text-purple-100",
      bg: "bg-purple-900/30",
      header: "bg-gradient-to-tr from-fuchsia-600 via-purple-500 to-pink-500",
      button: "bg-purple-600/30 border-purple-400 text-purple-100 hover:bg-purple-600/40",
      badge: "urthona" as const,
    }
  }
};

function createIntroMessage(mode: ChatMode): ChatMessage {
  const persona = PERSONAS[mode];
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
  
  // Universes
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  
  // Universe modals
  const [showCreateUniverseModal, setShowCreateUniverseModal] = useState(false);
  const [showEditUniverseModal, setShowEditUniverseModal] = useState(false);
  const [universeForm, setUniverseForm] = useState({ id: "", nome: "", descricao: "" });
  const [isSubmittingUniverse, setIsSubmittingUniverse] = useState(false);
  
  // Chat sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
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

  useEffect(() => {
    // Save sessions to localStorage
    if (sessions.length > 0) {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error("Error saving sessions:", e);
      }
    }
  }, [sessions]);

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
      } else {
        toast.error(t.errors.generic);
      }
    } catch (error) {
      console.error("Error loading universes:", error);
      toast.error(t.errors.network);
    }
  }

  function loadSessions() {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSessions(parsed || []);
      }
    } catch (e) {
      console.error("Error loading sessions:", e);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  function startNewSession(mode: ChatMode) {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: t.chat.newChat,
      mode,
      createdAt: Date.now(),
      messages: [createIntroMessage(mode)],
      universeId: selectedUniverseId || undefined,
    };

    setSessions([newSession, ...sessions].slice(0, MAX_SESSIONS));
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

    setSessions(sessions.map(s => s.id === activeSessionId ? clearedSession : s));
    toast.success("Histórico limpo com sucesso");
  }

  function handleExportConversation() {
    if (!activeSessionId) return;

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    const persona = PERSONAS[currentSession.mode];
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

    setSessions(sessions.map(s => s.id === activeSessionId ? updatedSession : s));
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

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
        };

        setSessions(sessions.map(s => 
          s.id === activeSessionId 
            ? { ...s, messages: [...updatedMessages, assistantMessage] }
            : s
        ));
      } else {
        toast.error(data.error || t.errors.generic);
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

  function deleteSession(sessionId: string) {
    setSessions(sessions.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const persona = activeSession ? PERSONAS[activeSession.mode] : null;

  if (isLoading) {
    return <Loading fullScreen text={t.common.loading} />;
  }

  return (
    <div className="flex h-screen bg-light-base dark:bg-dark-base">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border-light-default dark:border-border-dark-default">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-text-light-primary dark:text-dark-primary">
              Blake Vision
            </h1>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <LocaleToggle />
              <button
                onClick={() => router.push("/profile")}
                className="p-2 rounded-lg text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
                title={t.profile.title}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={() => setShowModeSelector(true)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {t.chat.newChat}
          </Button>
        </div>

        {/* Universe Selector */}
        <div className="p-4 border-b border-border-light-default dark:border-border-dark-default">
          <Select
            label={t.universe.title}
            options={[
              { value: "", label: "Selecione um universo" },
              ...universes.map(u => ({ value: u.id, label: u.nome })),
              { value: "__new__", label: "+ " + t.universe.create },
            ]}
            value={selectedUniverseId}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                setShowCreateUniverseModal(true);
              } else {
                handleUniverseChange(e.target.value);
              }
            }}
            fullWidth
            selectSize="sm"
          />
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 border-b border-border-light-default dark:border-border-dark-default">
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
                    "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                    activeSessionId === session.id
                      ? "bg-primary-100 dark:bg-primary-900/30 text-text-light-primary dark:text-dark-primary"
                      : "text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay"
                  )}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <Badge variant={PERSONAS[session.mode].styles.badge} size="sm">
                    {PERSONAS[session.mode].nome}
                  </Badge>
                  <span className="flex-1 text-sm truncate">{session.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error-light/10 text-error-light transition-opacity"
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
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <header className={clsx(
              "p-4 border-b border-border-light-default dark:border-border-dark-default",
              persona?.styles.header
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={persona.styles.badge} size="lg">
                    {persona.nome}
                  </Badge>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {persona.titulo}
                    </h2>
                    <p className="text-sm text-white/80">
                      {activeSession.title}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportConversation}
                    className="px-3 py-2 text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2"
                    title="Exportar conversa"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exportar
                  </button>
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-2 text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2"
                    title="Limpar histórico"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Limpar
                  </button>
                </div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeSession.messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={clsx(
                    "flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      persona?.styles.bg
                    )}>
                      <span className={clsx("text-sm font-bold", persona?.styles.color)}>
                        {persona?.nome[0]}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={clsx(
                      "max-w-3xl rounded-2xl px-6 py-4",
                      message.role === "user"
                        ? "bg-primary-600 dark:bg-primary-500 text-white"
                        : "bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default"
                    )}
                  >
                    <div className={clsx(
                      "prose prose-sm max-w-none",
                      message.role === "user" 
                        ? "prose-invert" 
                        : "prose-stone dark:prose-invert"
                    )}>
                      {message.content}
                    </div>
                    
                    {/* Action Buttons (only for assistant messages) */}
                    {message.role === "assistant" && message.id !== "intro" && (
                      <div className="flex gap-2 mt-4 pt-3 border-t border-border-light-default dark:border-border-dark-default">
                        <button
                          onClick={() => handleCopyMessage(message.content)}
                          className="text-xs text-text-light-tertiary dark:text-dark-tertiary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copiar
                        </button>
                      </div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              
              {isSending && (
                <div className="flex gap-4 justify-start">
                  <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    persona?.styles.bg
                  )}>
                    <span className={clsx("text-sm font-bold", persona?.styles.color)}>
                      {persona?.nome[0]}
                    </span>
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
                <div className="flex gap-3">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.chat.placeholder}
                    resize="none"
                    className="min-h-[60px] max-h-[200px]"
                    fullWidth
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSending}
                    disabled={!input.trim()}
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    }
                  >
                    {t.chat.send}
                  </Button>
                </div>
                <p className="text-xs text-text-light-tertiary dark:text-dark-tertiary mt-2">
                  Pressione Enter para enviar, Shift+Enter para nova linha
                </p>
              </form>
            </div>
          </>
        ) : (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title="Bem-vindo ao Blake Vision"
            description="Selecione um modo de conversa para começar a interagir com os agentes de IA"
            action={
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowModeSelector(true)}
              >
                {t.chat.newChat}
              </Button>
            }
          />
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
            <div className={clsx("w-16 h-16 rounded-full mb-4 flex items-center justify-center", PERSONAS.consulta.styles.bg)}>
              <span className={clsx("text-2xl font-bold", PERSONAS.consulta.styles.color)}>U</span>
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
            <div className={clsx("w-16 h-16 rounded-full mb-4 flex items-center justify-center", PERSONAS.criativo.styles.bg)}>
              <span className={clsx("text-2xl font-bold", PERSONAS.criativo.styles.color)}>U</span>
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
              variant="ghost"
              onClick={() => {
                setShowCreateUniverseModal(false);
                setUniverseForm({ id: "", nome: "", descricao: "" });
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
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
              variant="ghost"
              onClick={() => {
                setShowEditUniverseModal(false);
                setUniverseForm({ id: "", nome: "", descricao: "" });
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
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
    </div>
  );
}
