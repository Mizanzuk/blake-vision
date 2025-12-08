'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase/client';
import { Loading } from '@/app/components/ui';
import { UniverseDropdown } from '@/app/components/ui';
import { WorldsDropdownSingle } from '@/app/components/ui/WorldsDropdownSingle';
import { EpisodesDropdownSingle } from '@/app/components/ui/EpisodesDropdownSingle';
import { CategoryDropdownSingle } from '@/app/components/ui/CategoryDropdownSingle';
import TiptapEditor from '@/components/TiptapEditor';
import type { Universe, World, Category } from '@/app/types';

interface Texto {
  id: string;
  titulo: string;
  conteudo: string;
  universo_id: string;
  mundo_id: string;
  episodio: string;
  categoria: string;
  criado_em: string;
  atualizado_em: string;
  usuario_id: string;
  publicado: boolean;
}

export default function EscritaPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTextoId, setCurrentTextoId] = useState<string | null>(null);
  
  // Estados do Editor
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [universeId, setUniverseId] = useState('');
  const [worldId, setWorldId] = useState('');
  const [episodio, setEpisodio] = useState('');
  const [categoria, setCategoria] = useState('');
  
  // Estados de Dados
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [textoCategorias, setTextoCategorias] = useState<Category[]>([]);
  const [textos, setTextos] = useState<Texto[]>([]);
  
  // Estados de UI
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [hasUnsavedMetadataChanges, setHasUnsavedMetadataChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Estados para Avatares
  const [showUrizen, setShowUrizen] = useState(false);
  const [showUrthona, setShowUrthona] = useState(false);
  
  // Estados para Modo Foco
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusType, setFocusType] = useState<'off' | 'sentence' | 'paragraph'>('off');
  const [typewriterMode, setTypewriterMode] = useState(false);
  
  // Refs
  const editorRef = useRef<any>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

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
  }, [isFocusMode, focusType]);

  // Carregar dados iniciais
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      setUser(authUser);
      loadData();
    };
    
    checkAuth();
  }, [router, supabase.auth]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar universos
      const { data: universesData } = await supabase
        .from('universes')
        .select('*')
        .eq('usuario_id', user?.id || '');
      
      if (universesData) setUniverses(universesData);
      
      // Carregar mundos
      const { data: worldsData } = await supabase
        .from('worlds')
        .select('*');
      
      if (worldsData) setWorlds(worldsData);
      
      // Carregar categorias
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesData) setTextoCategorias(categoriesData);
      
      // Carregar textos
      const { data: textosData } = await supabase
        .from('textos')
        .select('*')
        .eq('usuario_id', user?.id || '')
        .order('atualizado_em', { ascending: false });
      
      if (textosData) setTextos(textosData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMetadata = async () => {
    try {
      if (!currentTextoId) return;
      
      await supabase
        .from('textos')
        .update({
          universo_id: universeId,
          mundo_id: worldId,
          episodio,
          categoria,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', currentTextoId);
      
      setHasUnsavedMetadataChanges(false);
    } catch (error) {
      console.error('Erro ao salvar metadados:', error);
    }
  };

  const handleSaveText = async () => {
    try {
      if (!currentTextoId) return;
      
      await supabase
        .from('textos')
        .update({
          titulo,
          conteudo,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', currentTextoId);
      
    } catch (error) {
      console.error('Erro ao salvar texto:', error);
    }
  };

  const handlePublish = async () => {
    try {
      if (!currentTextoId) return;
      
      await supabase
        .from('textos')
        .update({
          publicado: true,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', currentTextoId);
      
    } catch (error) {
      console.error('Erro ao publicar:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase
        .from('textos')
        .delete()
        .eq('id', id);
      
      if (currentTextoId === id) {
        setCurrentTextoId(null);
        setTitulo('');
        setConteudo('');
      }
      
      loadData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
      {/* SIDEBAR - Biblioteca de Textos (Placeholder) */}

      {/* GRID 6x3 */}
      <div className="flex-1 flex flex-col">
        
        {/* COLUNA A (Margem Esquerda) */}
        <div className="w-12 bg-light-bg-secondary dark:bg-dark-bg-secondary hidden lg:block" />

        {/* COLUNA B (Conteúdo Principal) */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 md:px-8">
          
          {/* LINHA 1: Modo Foco + Avatares */}
          <div className="py-4 border-b border-border-light-default dark:border-border-dark-default flex items-center justify-between">
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors text-sm font-medium"
            >
              👁 Modo Foco
            </button>
            
            <div className="flex gap-2">
              {showUrizen && (
                <img
                  src="/avatars/urizen.jpg"
                  alt="Urizen"
                  className="w-8 h-8 rounded-full"
                />
              )}
              {showUrthona && (
                <img
                  src="/avatars/urthona.jpg"
                  alt="Urthona"
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          </div>

          {/* LINHA 2: Título + Botão Colapsar + Menu */}
          <div className="py-3 border-b border-border-light-default dark:border-border-dark-default flex items-center gap-3">
            <button
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className="text-xl hover:opacity-70 transition-opacity"
            >
              {isHeaderExpanded ? '▼' : '▶'}
            </button>
            
            <h2 className="flex-1 text-lg font-semibold text-text-light-primary dark:text-dark-primary">
              {titulo || 'Sem Título'}
            </h2>
            
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="text-xl hover:opacity-70 transition-opacity"
            >
              ⋮
            </button>
          </div>

          {/* LINHA 3: Metadados (Condicional) */}
          {isHeaderExpanded && (
            <div className="space-y-4 py-4 border-b border-border-light-default dark:border-border-dark-default">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">
                  TITULO
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    setHasUnsavedMetadataChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-border-light-default dark:border-border-dark-default rounded bg-light-bg-primary dark:bg-dark-bg-primary text-text-light-primary dark:text-dark-primary"
                  placeholder="Título do texto"
                />
              </div>

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
                    episodes={['T1', 'T2', 'T3']}
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
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Salvar Metadados
              </button>
            </div>
          )}

          {/* LINHA 4: Toolbar de Edição */}
          <div className="py-3 border-b border-border-light-default dark:border-border-dark-default flex items-center gap-2">
            <button className="px-3 py-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors text-sm font-medium">
              B
            </button>
            <button className="px-3 py-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors text-sm font-medium italic">
              /
            </button>
            <button className="px-3 py-1 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors text-sm font-medium">
              Aa ▼
            </button>
          </div>

          {/* LINHA 5: Conteúdo do Editor (Scrollável) */}
          <div className="flex-1 py-6 overflow-y-auto">
            <TiptapEditor
              value={conteudo}
              onChange={setConteudo}
              placeholder="Comece a escrever..."
              editorRef={editorRef}
              focusType={focusType}
              isFocusMode={isFocusMode}
              typewriterMode={typewriterMode}
            />
          </div>
        </div>

        {/* COLUNA C (Margem Direita) */}
        <div className="w-12 bg-light-bg-secondary dark:bg-dark-bg-secondary hidden lg:block" />
      </div>

      {/* LINHA 6: Footer Fixo */}
      <div className="fixed bottom-0 left-0 right-0 py-6 border-t border-border-light-default dark:border-border-dark-default bg-light-bg-primary dark:bg-dark-bg-primary flex justify-center gap-3">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 flex gap-3">
          <button
            onClick={handleSaveText}
            className="px-6 py-2 bg-light-overlay dark:bg-dark-overlay text-text-light-primary dark:text-dark-primary rounded hover:opacity-80 transition-opacity font-medium"
          >
            Salvar
          </button>
          <button
            onClick={handlePublish}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors font-medium"
          >
            Publicar
          </button>
        </div>
      </div>

      {/* Padding para o footer fixo */}
      <div className="h-24" />
    </div>
  );
}
