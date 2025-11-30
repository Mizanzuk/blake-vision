"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input } from "@/app/components/ui";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { clsx } from "clsx";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: "Primeiros Passos",
    question: "O que é o Blake Vision?",
    answer: "Blake Vision é uma plataforma avançada para gerenciar universos ficcionais complexos. Ela permite organizar personagens, locais, eventos, conceitos e suas relações de forma estruturada, além de contar com agentes de IA para consultar e criar narrativas.",
  },
  {
    category: "Primeiros Passos",
    question: "Como criar meu primeiro universo?",
    answer: "Na página inicial (Chat), clique no dropdown de universos e selecione '+ Criar Universo'. Preencha o nome e descrição do seu universo. Automaticamente serão criados um mundo raiz e categorias padrão (Personagem, Local, Evento, Conceito, Regra, Roteiro).",
  },
  {
    category: "Primeiros Passos",
    question: "Qual a diferença entre Universo e Mundo?",
    answer: "Um Universo é o container principal (ex: 'Star Wars'). Dentro dele, você cria Mundos que representam diferentes histórias, séries, livros ou contextos (ex: 'Trilogia Original', 'Mandaloriano'). O Mundo 'Global' armazena regras que se aplicam a todo o universo.",
  },
  {
    category: "Funcionalidades",
    question: "O que são Fichas?",
    answer: "Fichas são as entidades do seu universo: personagens, locais, eventos, conceitos, regras ou roteiros. Cada ficha tem título, resumo, conteúdo completo, tags, imagens e pode ter relações com outras fichas.",
  },
  {
    category: "Funcionalidades",
    question: "Como funcionam os códigos únicos?",
    answer: "Cada ficha pode ter um código único gerado automaticamente com base no prefixo da categoria (ex: PER-001 para personagens, LOC-042 para locais). Isso facilita referências cruzadas e organização.",
  },
  {
    category: "Funcionalidades",
    question: "O que é a Timeline?",
    answer: "A Timeline visualiza cronologicamente todas as fichas que possuem datas (ano diegético, data de início/fim). É útil para acompanhar a ordem dos eventos no seu universo.",
  },
  {
    category: "Funcionalidades",
    question: "Como funciona o Upload de documentos?",
    answer: "Você pode fazer upload de PDFs, DOCX ou TXT. Nossa IA extrai automaticamente personagens, locais, eventos, conceitos e as relações entre eles. Você revisa e edita antes de salvar no seu universo.",
  },
  {
    category: "Agentes de IA",
    question: "Quem é Urizen?",
    answer: "Urizen é o agente de Consulta. Ele responde perguntas APENAS com base em fatos estabelecidos no seu universo. Use-o para verificar informações, identificar inconsistências e consultar o lore de forma precisa.",
  },
  {
    category: "Agentes de IA",
    question: "Quem é Urthona?",
    answer: "Urthona é o agente Criativo. Ele pode criar novas narrativas, expandir histórias e sugerir ideias, sempre respeitando as regras estabelecidas no seu universo. Use-o para brainstorming e desenvolvimento criativo.",
  },
  {
    category: "Agentes de IA",
    question: "Como os agentes usam meu lore?",
    answer: "Ambos os agentes utilizam RAG (Retrieval-Augmented Generation). Quando você faz uma pergunta, o sistema busca as fichas mais relevantes no seu universo e as fornece como contexto para a IA, garantindo respostas precisas e contextualizadas.",
  },
  {
    category: "Agentes de IA",
    question: "O que são Regras Globais?",
    answer: "Regras Globais são fichas do tipo 'Regra' ou 'Conceito' armazenadas no Mundo Global. Elas se aplicam a TODOS os mundos e histórias do universo. Os agentes sempre respeitam essas regras ao responder.",
  },
  {
    category: "Organização",
    question: "O que são Categorias?",
    answer: "Categorias definem os tipos de fichas (Personagem, Local, Evento, etc.). Você pode criar categorias customizadas e definir prefixos para códigos. Cada universo tem suas próprias categorias.",
  },
  {
    category: "Organização",
    question: "Como funcionam os Episódios?",
    answer: "Mundos podem ter episódios ativados. Isso permite organizar fichas por episódios específicos (ex: 'Episódio 1', 'Capítulo 5'). Útil para séries, livros ou roteiros divididos em partes.",
  },
  {
    category: "Organização",
    question: "O que são Relações?",
    answer: "Relações conectam fichas entre si (ex: 'João é pai de Maria', 'Castelo está localizado em Reino'). Existem dezenas de tipos de relações pré-definidas (familiares, sociais, profissionais, espaciais, narrativas).",
  },
  {
    category: "Organização",
    question: "Como funcionam as Tags?",
    answer: "Tags são palavras-chave separadas por vírgula que você adiciona às fichas. Elas facilitam buscas e filtros. Ex: 'magia, dragão, profecia' para um evento mágico.",
  },
  {
    category: "Recursos Avançados",
    question: "O que é busca vetorial (RAG)?",
    answer: "Cada ficha é convertida em um 'embedding' (representação matemática do significado). Quando você faz uma pergunta, o sistema encontra as fichas semanticamente mais relevantes, mesmo que não contenham as palavras exatas da pergunta.",
  },
  {
    category: "Recursos Avançados",
    question: "Posso usar imagens?",
    answer: "Sim! Cada ficha pode ter uma imagem de capa e um álbum com múltiplas imagens. As imagens são armazenadas no Supabase Storage e podem ser visualizadas no catálogo.",
  },
  {
    category: "Recursos Avançados",
    question: "Como funciona o autocomplete de menções?",
    answer: "Ao digitar '@' no campo de conteúdo de uma ficha, aparece uma lista de outras fichas do universo. Isso facilita criar referências cruzadas e links entre fichas.",
  },
  {
    category: "Recursos Avançados",
    question: "Posso exportar meus dados?",
    answer: "Atualmente não há função de exportação automática, mas todos os seus dados estão no Supabase e podem ser acessados via SQL. Planejamos adicionar exportação em formatos como JSON, Markdown e PDF no futuro.",
  },
  {
    category: "Conta e Configurações",
    question: "Como alterar tema (claro/escuro)?",
    answer: "Clique no ícone de sol/lua no canto superior direito de qualquer página. Sua preferência é salva automaticamente.",
  },
  {
    category: "Conta e Configurações",
    question: "Como mudar o idioma?",
    answer: "Clique no botão de idioma (PT/EN) no canto superior direito. O Blake Vision suporta Português Brasileiro e Inglês.",
  },
  {
    category: "Conta e Configurações",
    question: "Como editar meu perfil?",
    answer: "Clique no ícone de perfil no canto superior direito e selecione 'Perfil'. Lá você pode alterar nome, email, senha e preferências.",
  },
  {
    category: "Conta e Configurações",
    question: "Meus dados estão seguros?",
    answer: "Sim! Utilizamos Supabase para autenticação e armazenamento. Todos os dados são criptografados e isolados por usuário. Apenas você tem acesso ao seu universo.",
  },
];

export default function FAQPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const categories = Array.from(new Set(faqData.map(item => item.category)));

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      {/* Header */}
      <header className="border-b border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">{t.common.back}</span>
            </button>
            
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
              {t.nav.faq}
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-text-light-primary dark:text-dark-primary mb-4">
            {t.faq.title}
          </h2>
          <p className="text-lg text-text-light-tertiary dark:text-dark-tertiary">
            {t.faq.subtitle}
          </p>
        </div>

        {/* Search */}
        <div className="mb-12">
          <Input
            placeholder={t.faq.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            inputSize="lg"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* FAQ Items */}
        {categories.map(category => {
          const categoryItems = filteredFAQ.filter(item => item.category === category);
          
          if (categoryItems.length === 0) return null;
          
          return (
            <div key={category} className="mb-12">
              <h3 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary mb-6">
                {category}
              </h3>
              
              <div className="space-y-3">
                {categoryItems.map((item, index) => {
                  const globalIndex = faqData.indexOf(item);
                  const isExpanded = expandedIndex === globalIndex;
                  
                  return (
                    <Card
                      key={globalIndex}
                      variant="elevated"
                      padding="none"
                      className="overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
                      >
                        <span className="font-semibold text-text-light-primary dark:text-dark-primary pr-4">
                          {item.question}
                        </span>
                        <svg
                          className={clsx(
                            "w-5 h-5 text-text-light-tertiary dark:text-dark-tertiary transition-transform flex-shrink-0",
                            isExpanded && "transform rotate-180"
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-6 pb-4 text-text-light-secondary dark:text-dark-secondary border-t border-border-light-default dark:border-border-dark-default pt-4">
                          {item.answer}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredFAQ.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-24 h-24 mx-auto text-text-light-tertiary dark:text-dark-tertiary opacity-50 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg text-text-light-tertiary dark:text-dark-tertiary">
              Nenhuma pergunta encontrada
            </p>
          </div>
        )}

        {/* Contact Card */}
        <Card variant="outlined" padding="lg" className="mt-12">
          <div className="text-center">
            <h3 className="text-xl font-bold text-text-light-primary dark:text-dark-primary mb-2">
              Ainda tem dúvidas?
            </h3>
            <p className="text-text-light-tertiary dark:text-dark-tertiary mb-6">
              Entre em contato conosco e teremos prazer em ajudar
            </p>
            <a
              href="https://help.manus.im"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Entrar em contato
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
