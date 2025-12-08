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
  
  // Estados de UI
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [focusType, setFocusType] = useState<'paragraph' | 'sentence' | 'word' | 'off'>('off');
  const [showUrizen, setShowUrizen] = useState(false);
  const [showUrthona, setShowUrthona] = useState(false);
  const [hasUnsavedMetadataChanges, setHasUnsavedMetadataChanges] = useState(false);
  
  // Estados de dados
  const [textos, setTextos] = useState<Texto[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [textoCategorias, setTextoCategorias] = useState<Category[]>([]);
  
  const editorRef = useRef<any>(null);

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

  const handleSaveText = async () => {
    if (!user) return;
    
    try {
      if (currentTextoId) {
        await supabase
          .from('textos')
          .update({
            titulo,
            conteudo,
            universo_id: universeId,
            mundo_id: worldId,
            episodio,
            categoria,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', currentTextoId);
      } else {
        await supabase
          .from('textos')
          .insert({
            titulo,
            conteudo,
            universo_id: universeId,
            mundo_id: worldId,
            episodio,
            categoria,
            usuario_id: user.id,
            publicado: false,
          });
      }
      
      setHasUnsavedMetadataChanges(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handlePublish = async () => {
    if (!currentTextoId) return;
    
    try {
      await supabase
        .from('textos')
        .update({ publicado: true })
        .eq('id', currentTextoId);
      
      loadData();
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
    <div className="flex flex-col h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
      {/* HEADER - Menu de Topo */}
      <header className="border-b border-border-light-default dark:border-border-dark-default bg-light-bg-primary dark:bg-dark-bg-primary">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-text-light-primary dark:text-dark-primary">Blake Vision</h1>
            <nav className="hidden md:flex gap-6">
              <a href="/" className="text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary">Home</a>
              <a href="/projetos" className="text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary">Projetos</a>
              <a href="/catalogo" className="text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary">Catálogo</a>
              <a href="/escrita" className="text-sm font-semibold text-primary">Escrita</a>
              <a href="/timeline" className="text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary">Timeline</a>
              <a href="/upload" className="text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary">Upload</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <a href="#faq" className="text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary">FAQ</a>
            <button className="w-8 h-8 rounded-full bg-light-overlay dark:bg-dark-overlay flex items-center justify-center">👤</button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR - Biblioteca de Textos */}
        <aside className="w-64 border-r border-border-light-default dark:border-border-dark-default bg-light-bg-secondary dark:bg-dark-bg-secondary overflow-y-auto hidden lg:block">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-text-light-primary dark:text-dark-primary mb-4">Meus Textos</h2>
            <div className="space-y-2">
              {textos.map((texto) => (
                <button
                  key={texto.id}
                  onClick={() => {
                    setCurrentTextoId(texto.id);
                    setTitulo(texto.titulo);
                    setConteudo(texto.conteudo);
                    setUniverseId(texto.universo_id);
                    setWorldId(texto.mundo_id);
                    setEpisodio(texto.episodio);
                    setCategoria(texto.categoria);
                    setIsHeaderExpanded(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    currentTextoId === texto.id
                      ? 'bg-primary text-white'
                      : 'text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay'
                  }`}
                >
                  {texto.titulo || 'Sem Título'}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* GRID 6x3 - Estrutura Principal */}
        <div className="flex-1 flex flex-col relative">
          
          {/* LINHA 1: Modo Foco + Avatares */}
          <div className="py-4 border-b border-border-light-default dark:border-border-dark-default flex items-center justify-between px-4 md:px-8">
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

          {/* LINHA 2: Título + Botão Colapsar (A2) + Menu (C1) */}
          <div className="py-3 border-b border-border-light-default dark:border-border-dark-default flex items-center relative">
            
            {/* Célula A2 - Botão Colapsar (Flutuante para esquerda) */}
            <button
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className="absolute -left-12 text-xl hover:opacity-70 transition-opacity"
            >
              {isHeaderExpanded ? '▼' : '▶'}
            </button>
            
            {/* Célula B2 - Título (Centro) */}
            <div className="flex-1 px-4 md:px-8">
              <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
                {titulo || 'Sem Título'}
              </h2>
            </div>
            
            {/* Célula C1 - Três Pontinhos (Flutuante para direita) */}
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="absolute -right-12 text-xl hover:opacity-70 transition-opacity"
            >
              ⋮
            </button>
          </div>

          {/* LINHA 3: Metadados (Condicional) */}
          {isHeaderExpanded && (
            <div className="space-y-4 py-4 border-b border-border-light-default dark:border-border-dark-default px-4 md:px-8">
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
                    worlds={worlds}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Episódio</label>
                  <EpisodesDropdownSingle
                    selectedId={episodio}
                    onSelect={setEpisodio}
                    episodes={[]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-light-secondary dark:text-dark-secondary">Categoria</label>
                  <CategoryDropdownSingle
                    selectedId={categoria}
                    onSelect={setCategoria}
                    categories={textoCategorias}
                  />
                </div>
              </div>
            </div>
          )}

          {/* LINHA 4: Toolbar de Edição */}
          <div className="py-3 border-b border-border-light-default dark:border-border-dark-default flex items-center gap-4 px-4 md:px-8">
            <button className="text-sm font-medium hover:opacity-70 transition-opacity">B</button>
            <button className="text-sm font-medium hover:opacity-70 transition-opacity">/</button>
            <button className="text-sm font-medium hover:opacity-70 transition-opacity">Aa ▼</button>
          </div>

          {/* LINHA 5: Conteúdo do Editor (Scrollável) */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
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

        {/* COLUNA C - Agentes (Sidebar Direita) */}
        <aside className="w-64 border-l border-border-light-default dark:border-border-dark-default bg-light-bg-secondary dark:bg-dark-bg-secondary overflow-y-auto hidden lg:block">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-text-light-primary dark:text-dark-primary mb-4">Agentes</h2>
            
            {/* Urizen */}
            <button
              onClick={() => setShowUrizen(!showUrizen)}
              className="w-full text-left p-3 rounded border border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors mb-3"
            >
              <div className="flex items-center gap-2">
                <img src="/avatars/urizen.jpg" alt="Urizen" className="w-6 h-6 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-text-light-primary dark:text-dark-primary">Urizen</p>
                  <p className="text-xs text-text-light-secondary dark:text-dark-secondary">A Lei</p>
                </div>
              </div>
            </button>
            
            {/* Urthona */}
            <button
              onClick={() => setShowUrthona(!showUrthona)}
              className="w-full text-left p-3 rounded border border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
            >
              <div className="flex items-center gap-2">
                <img src="/avatars/urthona.jpg" alt="Urthona" className="w-6 h-6 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-text-light-primary dark:text-dark-primary">Urthona</p>
                  <p className="text-xs text-text-light-secondary dark:text-dark-secondary">O Fluxo</p>
                </div>
              </div>
            </button>
          </div>
        </aside>
      </div>

      {/* LINHA 6: Footer Fixo */}
      <footer className="border-t border-border-light-default dark:border-border-dark-default bg-light-bg-primary dark:bg-dark-bg-primary py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-end gap-3">
          <button
            onClick={handleSaveText}
            className="px-6 py-2 bg-light-overlay dark:bg-dark-overlay text-text-light-primary dark:text-dark-primary rounded hover:opacity-80 transition-opacity font-medium"
          >
            Salvar
          </button>
          <button
            onClick={handlePublish}
            className="px-6 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors font-medium"
          >
            Publicar
          </button>
        </div>
      </footer>
    </div>
  );
}
