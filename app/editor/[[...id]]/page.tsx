"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Header } from "@/app/components/layout/Header";
import { Button, Input, Select, Loading, UniverseDropdown, WorldsDropdown } from "@/app/components/ui";
import { toast } from "sonner";

interface Universe {
  id: string;
  nome: string;
}

interface World {
  id: string;
  nome: string;
  universe_id: string;
}

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const textoId = params.id?.[0];
  const supabase = getSupabaseClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showUrthona, setShowUrthona] = useState(false);
  const [showUrizen, setShowUrizen] = useState(false);
  
  // Dados do texto
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [universeId, setUniverseId] = useState("");
  const [worldId, setWorldId] = useState("");
  const [episodio, setEpisodio] = useState("");
  const [status, setStatus] = useState<"rascunho" | "publicado">("rascunho");
  
  // Dados para selects
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [filteredWorlds, setFilteredWorlds] = useState<World[]>([]);

  // Chat com assistentes
  const [urthonaMessages, setUrthonaMessages] = useState<any[]>([]);
  const [urizenMessages, setUrizenMessages] = useState<any[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadUniversesAndWorlds();
      if (textoId) {
        loadTexto();
      }
    }
  }, [isLoading, textoId]);

  useEffect(() => {
    if (universeId) {
      const filtered = worlds.filter(w => w.universe_id === universeId);
      setFilteredWorlds(filtered);
    } else {
      setFilteredWorlds([]);
    }
  }, [universeId, worlds]);

  // Auto-save a cada 30 segundos
  useEffect(() => {
    if (!textoId || !titulo || !conteudo) return;
    
    const interval = setInterval(() => {
      handleSave(true); // silent save
    }, 30000);

    return () => clearInterval(interval);
  }, [titulo, conteudo, universeId, worldId, episodio, status]);

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

  async function loadUniversesAndWorlds() {
    try {
      const [universesRes, worldsRes] = await Promise.all([
        fetch("/api/universes"),
        fetch("/api/worlds"),
      ]);

      const universesData = await universesRes.json();
      const worldsData = await worldsRes.json();

      if (universesRes.ok) {
        setUniverses(universesData.universes || []);
      }

      if (worldsRes.ok) {
        setWorlds(worldsData.worlds || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  async function loadTexto() {
    try {
      const response = await fetch(`/api/textos?id=${textoId}`);
      const data = await response.json();

      if (response.ok && data.texto) {
        const texto = data.texto;
        setTitulo(texto.titulo);
        setConteudo(texto.conteudo);
        setUniverseId(texto.universe_id || "");
        setWorldId(texto.world_id || "");
        setEpisodio(texto.episodio || "");
        setStatus(texto.status);
      } else {
        toast.error("Texto não encontrado");
        router.push("/biblioteca");
      }
    } catch (error) {
      console.error("Erro ao carregar texto:", error);
      toast.error("Erro ao carregar texto");
    }
  }

  async function handleSave(silent = false) {
    if (!titulo.trim() || !conteudo.trim()) {
      if (!silent) {
        toast.error("Título e conteúdo são obrigatórios");
      }
      return;
    }

    setIsSaving(true);

    try {
      const method = textoId ? "PUT" : "POST";
      const body = textoId
        ? { id: textoId, titulo, conteudo, universe_id: universeId || null, world_id: worldId || null, episodio, status }
        : { titulo, conteudo, universe_id: universeId || null, world_id: worldId || null, episodio, status };

      const response = await fetch("/api/textos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (!silent) {
          toast.success("Texto salvo com sucesso");
        }
        
        // Se é novo texto, redirecionar para edição
        if (!textoId && data.texto) {
          router.push(`/editor/${data.texto.id}`);
        }
      } else {
        if (!silent) {
          toast.error(data.error || "Erro ao salvar texto");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar texto:", error);
      if (!silent) {
        toast.error("Erro ao salvar texto");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    // Salvar com status publicado
    setIsSaving(true);
    try {
      const method = textoId ? "PUT" : "POST";
      const body: any = {
        titulo,
        conteudo,
        universe_id: universeId || null,
        world_id: worldId || null,
        episodio: episodio || null,
        status: "publicado", // Forçar status publicado
      };

      if (textoId) {
        body.id = textoId;
      }

      const response = await fetch("/api/textos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Erro ao publicar texto");
        return;
      }

      const data = await response.json();
      
      setStatus("publicado");
      toast.success("Texto publicado com sucesso!");
      
      // Se for novo texto, redirecionar para URL com ID
      if (!textoId && data.texto?.id) {
        router.push(`/editor/${data.texto.id}`);
      } else {
        router.push("/biblioteca");
      }
    } catch (error) {
      console.error("Erro ao publicar:", error);
      toast.error("Erro ao publicar texto");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendToUpload() {
    if (!textoId) {
      toast.error("Salve o texto antes de enviar para upload");
      return;
    }

    // Redirecionar para upload com dados preenchidos
    const params = new URLSearchParams({
      texto: conteudo,
      universe_id: universeId || "",
      world_id: worldId || "",
      episodio: episodio || "",
      auto_extract: "true",
    });

    router.push(`/upload?${params.toString()}`);
  }

  async function handleAssistantMessage(mode: "urthona" | "urizen") {
    if (!assistantInput.trim()) return;

    setIsAssistantLoading(true);
    const messages = mode === "urthona" ? urthonaMessages : urizenMessages;
    const setMessages = mode === "urthona" ? setUrthonaMessages : setUrizenMessages;

    const newUserMessage = {
      role: "user",
      content: assistantInput,
    };

    setMessages([...messages, newUserMessage]);
    setAssistantInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          mode: mode === "urthona" ? "criativo" : "consulta",
          universeId: universeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(errorData.error || "Erro ao conversar com assistente");
        setIsAssistantLoading(false);
        return;
      }

      // Ler stream de resposta
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (!reader) {
        toast.error("Erro ao ler resposta do assistente");
        setIsAssistantLoading(false);
        return;
      }

      // Adicionar mensagem do assistente vazia (será preenchida progressivamente)
      const assistantMessageObj = {
        role: "assistant" as const,
        content: "",
      };
      setMessages([...messages, newUserMessage, assistantMessageObj]);

      // Ler chunks do stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;

        // Atualizar mensagem progressivamente
        setMessages([...messages, newUserMessage, {
          role: "assistant",
          content: assistantMessage,
        }]);
      }

    } catch (error: any) {
      console.error("Erro ao conversar com assistente:", error);
      toast.error(error.message || "Erro ao conversar com assistente");
    } finally {
      setIsAssistantLoading(false);
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header showNav={true} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor principal */}
          <div className="lg:col-span-2 space-y-4">
            <Input
              label="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título do texto..."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UniverseDropdown
                label="Universo"
                universes={universes}
                selectedId={universeId}
                onSelect={(id) => {
                  setUniverseId(id);
                  setWorldId("");
                }}
              />

              <WorldsDropdown
                label="Mundo"
                worlds={filteredWorlds}
                selectedId={worldId}
                onSelect={setWorldId}
                disabled={!universeId}
                placeholder={!universeId ? "Selecione um universo primeiro" : "Selecione um mundo"}
              />

              <Input
                label="Episódio"
                value={episodio}
                onChange={(e) => setEpisodio(e.target.value)}
                placeholder="Ex: EP01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo
              </label>
              <textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Escreva seu texto aqui..."
                className="w-full h-[500px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C1666B] focus:border-transparent resize-none font-mono text-sm"
              />
            </div>
            
            {/* Avatares e Botões */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {/* Avatares dos Agentes */}
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button
                    onClick={() => setShowUrthona(!showUrthona)}
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 hover:border-[#C1666B] transition-colors"
                  >
                    <img
                      src="/urthona-avatar.png"
                      alt="Urthona"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23C1666B" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="20" font-weight="bold"%3EU%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Urthona (Criativo)
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
                
                <div className="relative group">
                  <button
                    onClick={() => setShowUrizen(!showUrizen)}
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 hover:border-[#C1666B] transition-colors"
                  >
                    <img
                      src="/urizen-avatar.png"
                      alt="Urizen"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%234A5568" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="20" font-weight="bold"%3EU%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Urizen (Analítico)
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => router.push("/biblioteca")}>
                  Voltar
                </Button>
                <Button variant="secondary" onClick={() => handleSave()} disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
                {status === "rascunho" && (
                  <Button onClick={handlePublish}>
                    Publicar
                  </Button>
                )}
                {status === "publicado" && (
                  <Button onClick={handleSendToUpload}>
                    Enviar para Upload
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Assistentes */}
          <div className="space-y-4">
            <Button
              variant="secondary"
              onClick={() => setShowUrthona(!showUrthona)}
              className="w-full"
            >
              {showUrthona ? "Fechar" : "Abrir"} Urthona (Criativo)
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowUrizen(!showUrizen)}
              className="w-full"
            >
              {showUrizen ? "Fechar" : "Abrir"} Urizen (Analítico)
            </Button>

            {(showUrthona || showUrizen) && (
              <div className="bg-white rounded-lg shadow-md p-4 max-h-[600px] flex flex-col">
                <h3 className="font-semibold mb-4">
                  {showUrthona ? "Urthona" : "Urizen"}
                </h3>
                
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {(showUrthona ? urthonaMessages : urizenMessages).map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-gray-100 ml-4"
                          : "bg-[#C1666B] text-white mr-4"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAssistantMessage(showUrthona ? "urthona" : "urizen");
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C1666B] focus:border-transparent"
                    disabled={isAssistantLoading}
                  />
                  <Button
                    onClick={() => handleAssistantMessage(showUrthona ? "urthona" : "urizen")}
                    disabled={isAssistantLoading}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
