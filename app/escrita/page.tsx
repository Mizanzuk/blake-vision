
'use client';

import React, { useState } from 'react';

export default function EscritaPage() {
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

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
              <button className="w-full text-left px-3 py-2 rounded text-sm bg-primary text-white">A Noite do Cão Misterioso</button>
              <button className="w-full text-left px-3 py-2 rounded text-sm text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay">O Segredo da Floresta</button>
            </div>
          </div>
        </aside>

        {/* GRID 6x3 - Estrutura Principal */}
        <div className="flex-1 flex flex-col relative">
          
          {/* LINHA 1: Modo Foco + Avatares */}
          <div className="py-4 border-b border-border-light-default dark:border-border-dark-default flex items-center justify-between px-4 md:px-8">
            <button className="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors text-sm font-medium">
              👁 Modo Foco
            </button>
            
            <div className="flex gap-2">
              <img src="/avatars/urizen.jpg" alt="Urizen" className="w-8 h-8 rounded-full" />
              <img src="/avatars/urthona.jpg" alt="Urthona" className="w-8 h-8 rounded-full" />
            </div>
          </div>

          {/* LINHA 2: Título + Botão Colapsar (A2) + Menu (C1) */}
          <div className="py-3 border-b border-border-light-default dark:border-border-dark-default flex items-center relative px-4 md:px-8">
            
            {/* Célula A2 - Botão Colapsar (Flutuante para esquerda) */}
            <button
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className="absolute left-0 -translate-x-full pr-2 text-xl hover:opacity-70 transition-opacity"
            >
              {isHeaderExpanded ? '▼' : '▶'}
            </button>
            
            {/* Célula B2 - Título (Centro) */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
                A Noite do Cão Misterioso (Cópia)
              </h2>
            </div>
            
            {/* Célula C1 - Três Pontinhos (Flutuante para direita) */}
            <button className="absolute right-0 translate-x-full pl-2 text-xl hover:opacity-70 transition-opacity">
              ⋮
            </button>
          </div>

          {/* LINHA 3: Metadados (Condicional) */}
          {isHeaderExpanded && (
            <div className="space-y-4 py-4 border-b border-border-light-default dark:border-border-dark-default px-4 md:px-8">
              <p>Metadados aqui...</p>
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
            <p>Conteúdo do editor aqui...</p>
          </div>
        </div>

        {/* COLUNA C - Agentes (Sidebar Direita) */}
        <aside className="w-64 border-l border-border-light-default dark:border-border-dark-default bg-light-bg-secondary dark:bg-dark-bg-secondary overflow-y-auto hidden lg:block">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-text-light-primary dark:text-dark-primary mb-4">Agentes</h2>
            
            {/* Urizen */}
            <button className="w-full text-left p-3 rounded border border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors mb-3">
              <div className="flex items-center gap-2">
                <img src="/avatars/urizen.jpg" alt="Urizen" className="w-6 h-6 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-text-light-primary dark:text-dark-primary">Urizen</p>
                  <p className="text-xs text-text-light-secondary dark:text-dark-secondary">A Lei</p>
                </div>
              </div>
            </button>
            
            {/* Urthona */}
            <button className="w-full text-left p-3 rounded border border-border-light-default dark:border-border-dark-default hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors">
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
          <button className="px-6 py-2 bg-light-overlay dark:bg-dark-overlay text-text-light-primary dark:text-dark-primary rounded hover:opacity-80 transition-opacity font-medium">
            Salvar
          </button>
          <button className="px-6 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors font-medium">
            Publicar
          </button>
        </div>
      </footer>
    </div>
  );
}
