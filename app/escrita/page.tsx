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

      {/* GRID 6x3 - Estrutura Principal */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUNA A - Sidebar Esquerda (Biblioteca de Textos) */}
        <aside className="w-64 border-r border-border-light-default dark:border-border-dark-default bg-light-bg-secondary dark:bg-dark-bg-secondary overflow-y-auto hidden lg:flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-border-light-default dark:border-border-dark-default">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-light-primary dark:text-dark-primary">Blake Vision</h2>
              <button className="text-xs text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary">‹</button>
            </div>
            <button className="w-full px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors text-sm font-medium">
              + Novo Texto
            </button>
          </div>

          {/* Abas */}
          <div className="flex border-b border-border-light-default dark:border-border-dark-default px-4">
            <button className="px-3 py-2 text-sm font-medium text-pink-500 border-b-2 border-pink-500">Rascunhos (1)</button>
            <button className="px-3 py-2 text-sm text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary">Publicados (0)</button>
          </div>

          {/* Busca e Filtros */}
          <div className="p-4 space-y-3 border-b border-border-light-default dark:border-border-dark-default">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar textos..." 
                className="w-full px-3 py-2 text-sm border border-border-light-default dark:border-border-dark-default rounded bg-light-bg-primary dark:bg-dark-bg-primary text-text-light-primary dark:text-dark-primary placeholder-text-light-secondary dark:placeholder-dark-secondary"
              />
            </div>
            <select className="w-full px-3 py-2 text-sm border border-border-light-default dark:border-border-dark-default rounded bg-light-bg-primary dark:bg-dark-bg-primary text-text-light-primary dark:text-dark-primary">
              <option>Todos os tipos</option>
            </select>
          </div>

          {/* Lista de Textos */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="px-3 py-1 text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase">Texto Livre</div>
            <button className="w-full text-left px-3 py-2 rounded text-sm bg-pink-500 text-white hover:bg-pink-600 transition-colors">
              A Noite do Cão Misterioso
            </button>
            <button className="w-full text-left px-3 py-2 rounded text-sm text-text-light-secondary dark:text-dark-secondary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors">
              O Segredo da Floresta
            </button>
          </div>
        </aside>

        {/* COLUNA B - Conteúdo Principal (6 Linhas) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* LINHA 1: Modo Foco + Avatares */}
          <div className="h-16 border-b border-border-light-default dark:border-border-dark-default flex items-center justify-between px-8 flex-shrink-0">
            <button className="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors text-sm font-medium">
              👁 Modo Foco
            </button>
            
            <div className="flex gap-2">
              <img src="/avatars/urizen.jpg" alt="Urizen" className="w-8 h-8 rounded-full" />
              <img src="/avatars/urthona.jpg" alt="Urthona" className="w-8 h-8 rounded-full" />
            </div>
          </div>

          {/* LINHA 2: Título + Botão Colapsar (A2) + Menu (C1) */}
          <div className="h-12 border-b border-border-light-default dark:border-border-dark-default flex items-center px-8 flex-shrink-0 relative">
            {/* Célula A2 - Botão Colapsar (Flutuante para esquerda) */}
            <button
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className="absolute left-0 -translate-x-full pr-2 text-xl hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary"
            >
              {isHeaderExpanded ? '▼' : '▶'}
            </button>
            
            {/* Célula B2 - Título (Centro) */}
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary">
              A Noite do Cão Misterioso (Cópia)
            </h2>
            
            {/* Célula C1 - Três Pontinhos (Flutuante para direita) */}
            <button className="absolute right-0 translate-x-full pl-2 text-xl hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary">
              ⋮
            </button>
          </div>

          {/* LINHA 3: Metadados (Condicional) */}
          {isHeaderExpanded && (
            <div className="border-b border-border-light-default dark:border-border-dark-default px-8 py-4 flex-shrink-0 space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase">TÍTULO</label>
                <p className="text-sm text-text-light-primary dark:text-dark-primary">A Noite do Cão Misterioso (Cópia)</p>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase">UNIVERSO</label>
                  <select className="w-full mt-1 px-2 py-1 text-sm border border-border-light-default dark:border-border-dark-default rounded bg-light-bg-primary dark:bg-dark-bg-primary text-text-light-primary dark:text-dark-primary">
                    <option>U1</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase">MUNDO</label>
                  <select className="w-full mt-1 px-2 py-1 text-sm border border-border-light-default dark:border-border-dark-default rounded bg-light-bg-primary dark:bg-dark-bg-primary text-text-light-primary dark:text-dark-primary">
                    <option>T1</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase">EPISÓDIO</label>
                  <select className="w-full mt-1 px-2 py-1 text-sm border border-border-light-default dark:border-border-dark-default rounded bg-light-bg-primary dark:bg-dark-bg-primary text-text-light-primary dark:text-dark-primary">
                    <option>T3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-light-secondary dark:text-dark-secondary uppercase">CATEGORIA</label>
                  <select className="w-full mt-1 px-2 py-1 text-sm border border-border-light-default dark:border-border-dark-default rounded bg-light-bg-primary dark:bg-dark-bg-primary text-text-light-primary dark:text-dark-primary">
                    <option>Texto Livre</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* LINHA 4: Toolbar de Edição */}
          <div className="h-12 border-b border-border-light-default dark:border-border-dark-default flex items-center gap-4 px-8 flex-shrink-0">
            <button className="text-sm font-medium hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary">B</button>
            <button className="text-sm font-medium hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary">/</button>
            <button className="text-sm font-medium hover:opacity-70 transition-opacity text-text-light-primary dark:text-dark-primary">Aa ▼</button>
          </div>

          {/* LINHA 5: Conteúdo do Editor (Scrollável) */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <p className="text-text-light-primary dark:text-dark-primary leading-relaxed">
              Em uma pequena cidade cercada por densas florestas, viviam dois amigos inseparáveis: Lucas e Pedro. Os dois eram conhecidos por suas aventuras noturnas, onde exploravam os arredores da cidade à procura de mistérios e lendas urbanas para desvendar. Teste.
            </p>
            <p className="text-text-light-primary dark:text-dark-primary leading-relaxed mt-4">
              Certa noite, enquanto caminhavam por uma trilha pouco iluminada na floresta, Lucas e Pedro começaram a ouvir um som baixo e gutural. Curiosos, seguiram o ruído até que, entre as sombras das árvores, avistaram uma figura enorme e peluda. A luz da lua cheia iluminou a criatura, revelando olhos brilhantes e um corpo imponente. O susto foi imediato: ambos acreditaram estar diante de um lobisomem! Sem pensar duas vezes, os amigos correram de volta para a cidade, o coração disparado e a mente cheia de imagens sombrias. Ao chegarem, contaram a todos sobre o encontro sobrenatural. A notícia se espalhou rapidamente, e em pouco tempo, a cidade estava em alvoroço com a história do "lobisomem da floresta". No entanto, a curiosidade dos amigos não os deixava em paz. No dia seguinte, decidiram investigar a área à luz do dia. Armados com lanternas e coragem renovada, voltaram à floresta. Ao chegarem ao local do avistamento, encontraram pegadas enormes no solo. Seguiram as pistas pelas os levaram até uma clareira onde, para sua surpresa, encontraram um cachorro gigantesco, de pelagem escura e olhos penetrantes. O cachorro, embora imponente, era dócil. Aproximando-se devagar, os amigos descobriram que ele usava uma coleira com uma medalha, onde estava escrito o nome de seu dono. Compreendendo o mal-entendido, Lucas e Pedro riceberam que Max era o cachorro perdido de um fazendeiro da região, famoso por possuir uma presença intimidadora. Compreendendo o mal-entendido, Lucas e Pedro voltaram à cidade com Max, explicando a verdadeira história ao fazendeiro e aos moradores. O alívio tomou conta de todos, e o susto da noite anterior se transformou em uma divertida anedota para a comunidade. A partir daquele dia, Max se tornou uma mascote local, e Lucas e Pedro continuaram suas aventuras, agora prontos para desvendar qualquer mistério que a noite pudesse trazer. **"Moral da História:"** Às vezes, o que nos assusta no escuro se revela inofensivo à luz do dia. A coragem de enfrentar nossos medos pode transformar monstros em amigos.
            </p>
          </div>
        </div>

        {/* COLUNA C - Margem Direita (Vazia) */}
        {/* Removida - Coluna C agora é vazia */}
      </div>

      {/* LINHA 6: Footer Fixo */}
      <footer className="border-t border-border-light-default dark:border-border-dark-default bg-light-bg-primary dark:bg-dark-bg-primary py-4 flex-shrink-0">
        <div className="flex justify-end gap-3 px-8">
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
