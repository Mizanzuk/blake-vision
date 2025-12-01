"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { TopNav } from "@/app/components/TopNav";
import { Button, Input, Select, Loading } from "@/app/components/ui";
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
    setStatus("publicado");
    await handleSave();
    toast.success("Texto publicado com sucesso!");
    router.push("/biblioteca");
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
          mode,
          context: {
            titulo,
            conteudo,
            universe_id: universeId,
            world_id: worldId,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.message) {
        setMessages([...messages, newUserMessage, {
          role: "assistant",
          content: data.message,
        }]);
      } else {
        toast.error("Erro ao conversar com assistente");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao conversar com assistente");
    } finally {
      setIsAssistantLoading(false);
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Editor</h1>
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
              <Select
                label="Universo"
                value={universeId}
                onChange={(e) => {
                  setUniverseId(e.target.value);
                  setWorldId("");
                }}
              >
                <option value="">Selecione...</option>
                {universes.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </Select>

              <Select
                label="Mundo"
                value={worldId}
                onChange={(e) => setWorldId(e.target.value)}
                disabled={!universeId}
              >
                <option value="">Selecione...</option>
                {filteredWorlds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nome}
                  </option>
                ))}
              </Select>

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
