'use client';

import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Header } from '@/app/components/layout/Header';
import TiptapEditor from '@/components/TiptapEditor';
import { FontFamily } from '@/components/FontSelector';
import { createClient } from '@/app/lib/supabase/client';

function EscritaPageContent() {
  const supabase = createClient();
  
  // Estados do Header
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentTextId, setCurrentTextId] = useState<string | null>(null);
  
  // Estado da Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Estados do Editor
  const [conteudo, setConteudo] = useState("Em uma pequena cidade cercada por densas florestas, viviam dois amigos inseparáveis: Lucas e Pedro. Os dois eram conhecidos por suas aventuras noturnas, onde exploravam os arredores da cidade à procura de mistérios e lendas urbanas para desvendar. Teste.\n\nCerta noite, enquanto caminhavam por uma trilha pouco iluminada na floresta, Lucas e Pedro começaram a ouvir um som baixo e gutural. Curiosos, seguiram o ruído até que, entre as sombras das árvores, avistaram uma figura enorme e peluda. A luz da lua cheia iluminou a criatura, revelando olhos brilhantes e um corpo imponente. O susto foi imediato: ambos acreditaram estar diante de um lobisomem! Sem pensar duas vezes, os amigos correram de volta para a cidade, o coração disparado e a mente cheia de imagens sombrias. Ao chegarem, contaram a todos sobre o encontro sobrenatural. A notícia se espalhou rapidamente, e em pouco tempo, a cidade estava em alvoroço com a história do \"lobisomem da floresta\". No entanto, a curiosidade dos amigos não os deixava em paz. No dia seguinte, decidiram investigar a área à luz do dia. Armados com lanternas e coragem renovada, voltaram à floresta. Ao chegarem ao local do avistamento, encontraram pegadas enormes no solo. Seguiram as pistas pelas os levaram até uma clareira onde, para sua surpresa, encontraram um cachorro gigantesco, de pelagem escura e olhos penetrantes. O cachorro, embora imponente, era dócil. Aproximando-se devagar, os amigos descobriram que ele usava uma coleira com uma medalha, onde estava escrito o nome de seu dono. Compreendendo o mal-entendido, Lucas e Pedro riceberam que Max era o cachorro perdido de um fazendeiro da região, famoso por possuir uma presença intimidadora. Compreendendo o mal-entendido, Lucas e Pedro voltaram à cidade com Max, explicando a verdadeira história ao fazendeiro e aos moradores. O alívio tomou conta de todos, e o susto da noite anterior se transformou em uma divertida anedota para a comunidade. A partir daquele dia, Max se tornou uma mascote local, e Lucas e Pedro continuaram suas aventuras, agora prontos para desvendar qualquer mistério que a noite pudesse trazer. **\"Moral da História:\"** Às vezes, o que nos assusta no escuro se revela inofensivo à luz do dia. A coragem de enfrentar nossos medos pode transformar monstros em amigos.");
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const editorRef = useRef<any>(null);
  
  // Estados do Menu Três Pontos e Modo Foco
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showStylesDropdown, setShowStylesDropdown] = useState(false);
  const [modoFoco, setModoFoco] = useState(false);
  const [temaFoco, setTemaFoco] = useState<'light' | 'dark'>('light');
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const stylesDropdownRef = useRef<HTMLDivElement>(null);
  
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
  
  // Auto-save a cada 30 segundos
  useEffect(() => {
    if (!conteudo) return;
    
    const autoSaveInterval = setInterval(() => {
      console.log('[Auto-save] Salvando automaticamente...');
      handleSave();
    }, 30000); // 30 segundos
    
    return () => clearInterval(autoSaveInterval);
  }, [conteudo]);
  
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
  
  // Handlers
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Pegar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Você precisa estar logado para salvar');
        return;
      }
      
      const textData = {
        titulo: 'A Noite do Cão Misterioso (Cópia)', // TODO: pegar do estado
        conteudo: conteudo,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      
      if (currentTextId) {
        // Atualizar texto existente
        const { error } = await supabase
          .from('texts')
          .update(textData)
          .eq('id', currentTextId);
        
        if (error) throw error;
      } else {
        // Criar novo texto
        const { data, error } = await supabase
          .from('texts')
          .insert([{ ...textData, created_at: new Date().toISOString() }])
          .select()
          .single();
        
        if (error) throw error;
        if (data) setCurrentTextId(data.id);
      }
      
      setLastSaved(new Date());
      console.log('Texto salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar o texto');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePublish = async () => {
    await handleSave();
    // TODO: Implementar lógica de publicação
    alert('Texto publicado!');
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
          universeId: null, // TODO: pegar do estado quando implementar
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
    <div className="min-h-screen bg-light-base dark:bg-dark-base flex flex-col">
      <Header showNav={true} currentPage="escrita" />

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* COLUNA A - Sidebar (Biblioteca de Textos) */}
        {isSidebarOpen && (
          <aside className="w-[250px] bg-light-raised dark:bg-dark-raised overflow-y-auto border-r border-border-light-default dark:border-border-dark-default flex flex-col flex-shrink-0">
            {/* Header da Sidebar */}
            <div className="p-4 border-b border-border-light-default dark:border-border-dark-default">
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
              <button className="w-full px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-full hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-sm font-medium">
                + Novo Texto
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-light-default dark:border-border-dark-default">
              <button className="flex-1 px-4 py-3 text-sm font-medium text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 transition-colors">
                Rascunhos (1)
              </button>
              <button className="flex-1 px-4 py-3 text-sm font-medium text-text-light-tertiary dark:text-dark-tertiary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors">
                Publicados (0)
              </button>
            </div>

            {/* Filtros */}
            <div className="p-4 space-y-3 border-b border-border-light-default dark:border-border-dark-default">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar textos..."
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
              <select className="w-full px-3 py-2 text-sm rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-base dark:bg-dark-base text-text-light-primary dark:text-dark-primary">
                <option>Todos os tipos</option>
              </select>
            </div>

            {/* Lista de Textos */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="px-3 py-1 text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase">Texto Livre</div>
              <button className="w-full text-left px-3 py-2 rounded text-sm bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
                A Noite do Cão Misterioso
              </button>
              <button className="w-full text-left px-3 py-2 rounded text-sm text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors">
                O Segredo da Floresta
              </button>
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
                        if (confirm('Tem certeza que deseja excluir este texto?')) {
                          console.log('Excluir texto');
                        }
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
              <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-1.5">
                  TÍTULO
                </label>
                <input
                  type="text"
                  defaultValue="A Noite do Cão Misterioso (Cópia)"
                  className="w-full px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary placeholder-text-light-tertiary dark:placeholder-dark-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Metadados Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-1.5">
                    UNIVERSO
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>U1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-1.5">
                    MUNDO
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>T1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-1.5">
                    EPISÓDIO
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>T3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-dark-secondary mb-1.5">
                    CATEGORIA
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option>Texto Livre</option>
                  </select>
                </div>
              </div>
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
                onClick={handleSave}
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
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EscritaPage() {
  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <EscritaPageContent />
    </React.Suspense>
  );
}
