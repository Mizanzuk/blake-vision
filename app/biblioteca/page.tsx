"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Header } from "@/app/components/layout/Header";
import { Button, Card, Badge, EmptyState, Loading } from "@/app/components/ui";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";
import clsx from "clsx";

interface Texto {
  id: string;
  titulo: string;
  conteudo: string;
  universe_id: string | null;
  world_id: string | null;
  episodio: string | null;
  categoria: string | null;
  status: "rascunho" | "publicado";
  extraido: boolean;
  created_at: string;
  updated_at: string;
}

export default function BibliotecaPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const { confirm, ConfirmDialog } = useConfirm();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rascunhos" | "publicados">("rascunhos");
  const [rascunhos, setRascunhos] = useState<Texto[]>([]);
  const [publicados, setPublicados] = useState<Texto[]>([]);
  const [selectedTexto, setSelectedTexto] = useState<Texto | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todas");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadTextos();
    }
  }, [isLoading]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTextos() {
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
      toast.error("Erro ao carregar biblioteca");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: "Confirmar Exclusão",
      message: "Tem certeza que deseja deletar este texto? Esta ação não pode ser desfeita.",
      confirmText: "Deletar",
      cancelText: "Cancelar",
      variant: "danger"
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/textos?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Texto deletado com sucesso");
        loadTextos();
      } else {
        toast.error("Erro ao deletar texto");
      }
    } catch (error) {
      console.error("Erro ao deletar texto:", error);
      toast.error("Erro ao deletar texto");
    }
  }

  async function handleEditar(texto: Texto) {
    try {
      // Volta para rascunho
      const response = await fetch("/api/textos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: texto.id,
          status: "rascunho",
        }),
      });

      if (response.ok) {
        toast.success("Texto movido para rascunhos");
        router.push(`/editor/${texto.id}`);
      } else {
        toast.error("Erro ao editar texto");
      }
    } catch (error) {
      console.error("Erro ao editar texto:", error);
      toast.error("Erro ao editar texto");
    }
  }

  function handleEnviarParaUpload(texto: Texto) {
    const params = new URLSearchParams({
      texto: texto.conteudo,
      universe_id: texto.universe_id || "",
      world_id: texto.world_id || "",
      episodio: texto.episodio || "",
      auto_extract: "true",
    });

    router.push(`/upload?${params.toString()}`);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Funções helper para badges de categoria (mesmas cores do Catálogo)
  function getCategoryColor(categoria: string) {
    const colors: Record<string, string> = {
      episodio: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      personagem: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      local: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      evento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      conceito: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      regra: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      roteiro: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    };
    return colors[categoria.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }

  function getCategoryLabel(categoria: string) {
    const labels: Record<string, string> = {
      episodio: "Episódio",
      personagem: "Personagem",
      local: "Local",
      evento: "Evento",
      conceito: "Conceito",
      regra: "Regra",
      roteiro: "Roteiro",
    };
    return labels[categoria.toLowerCase()] || categoria;
  }

  function truncateText(text: string, maxLength: number = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  // Filtrar textos por categoria
  const textosBase = activeTab === "rascunhos" ? rascunhos : publicados;
  const textos = selectedCategoria === "todas" 
    ? textosBase
    : textosBase.filter(t => {
        if (selectedCategoria === "sem-categoria") {
          return !t.categoria;
        }
        return t.categoria === selectedCategoria;
      });

  // Extrair categorias únicas dos textos
  const categoriasUnicas = Array.from(
    new Set(
      textosBase
        .map(t => t.categoria)
        .filter((c): c is string => c !== null && c !== "")
    )
  ).sort();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header showNav={true} currentPage="escrita" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Biblioteca</h1>
          <Button onClick={() => router.push("/editor")}>
            + Novo Texto
          </Button>
        </div>

        {/* Tabs e Filtros */}
        <div className="flex items-center justify-between mb-6 border-b border-gray-300">
          <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("rascunhos")}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === "rascunhos"
                ? "text-[#C1666B] border-b-2 border-[#C1666B]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Rascunhos ({rascunhos.length})
          </button>
          <button
            onClick={() => setActiveTab("publicados")}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === "publicados"
                ? "text-[#C1666B] border-b-2 border-[#C1666B]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Publicados ({publicados.length})
          </button>
          </div>

          {/* Filtro por Categoria */}
          {categoriasUnicas.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <span className="text-sm text-gray-600">Categoria:</span>
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#C1666B] focus:border-transparent"
              >
                <option value="todas">Todas ({textosBase.length})</option>
                <option value="sem-categoria">
                  Roteiro/Texto Livre ({textosBase.filter(t => !t.categoria).length})
                </option>
                {categoriasUnicas.map(cat => (
                  <option key={cat} value={cat}>
                    🏷️ {cat} ({textosBase.filter(t => t.categoria === cat).length})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Lista de textos */}
        {textos.length === 0 ? (
          <EmptyState
            title={`Nenhum texto ${activeTab === "rascunhos" ? "em rascunho" : "publicado"}`}
            description={`Comece criando seu primeiro ${activeTab === "rascunhos" ? "rascunho" : "texto publicado"}`}
            action={
              <Button onClick={() => router.push("/editor")}>
                + Novo Texto
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {textos.map((texto) => (
              <Card key={texto.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div onClick={() => {
                  if (activeTab === "publicados") {
                    setSelectedTexto(texto);
                  } else {
                    router.push(`/editor/${texto.id}`);
                  }
                }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {texto.titulo}
                    </h3>
                    <div className="flex gap-2 ml-2 flex-shrink-0">
                      {activeTab === "publicados" && texto.extraido && (
                        <Badge variant="success">
                          Extração OK
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Badge de Categoria */}
                  {texto.categoria && (
                    <div className="mb-2">
                      <span className={clsx(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        getCategoryColor(texto.categoria)
                      )}>
                        {getCategoryLabel(texto.categoria)}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {truncateText(texto.conteudo)}
                  </p>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Atualizado em {formatDate(texto.updated_at)}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/editor/${texto.id}`)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(texto.id)}
                  >
                    Deletar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Visualização de Texto Publicado */}
        {selectedTexto && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTexto(null)}
          >
            <div 
              className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTexto.titulo}</h2>
                <button
                  onClick={() => setSelectedTexto(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="prose max-w-none mb-6 whitespace-pre-wrap">
                {selectedTexto.conteudo}
              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <Button 
                  variant="secondary" 
                  onClick={() => setSelectedTexto(null)}
                >
                  Fechar
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleEditar(selectedTexto)}
                >
                  Editar
                </Button>
                <Button 
                  onClick={() => handleEnviarParaUpload(selectedTexto)}
                >
                  Enviar para Upload
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação */}
      <ConfirmDialog />
    </div>
  );
}
