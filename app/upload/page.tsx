"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import {
  Button,
  Select,
  Card,
  Loading,
  Badge,
  Input,
  Textarea,
} from "@/app/components/ui";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { toast } from "sonner";
import type { Universe, World } from "@/app/types";

type ExtractedEntity = {
  tipo: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  ano_diegese?: number;
  tags?: string;
};

export default function UploadPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseClient();

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Data
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  const [worlds, setWorlds] = useState<World[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string>("");

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Extraction results
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [showReview, setShowReview] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      loadUniverses();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedUniverseId) {
      loadWorlds();
    }
  }, [selectedUniverseId]);

  async function checkAuth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
      }
    } catch (error) {
      console.error("Error loading universes:", error);
    }
  }

  async function loadWorlds() {
    try {
      const response = await fetch(`/api/catalog?universeId=${selectedUniverseId}`);
      const data = await response.json();

      if (response.ok) {
        setWorlds(data.worlds || []);
      }
    } catch (error) {
      console.error("Error loading worlds:", error);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!validTypes.includes(file.type)) {
        toast.error("Formato não suportado. Use PDF, DOCX ou TXT");
        return;
      }

      setSelectedFile(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!validTypes.includes(file.type)) {
        toast.error("Formato não suportado. Use PDF, DOCX ou TXT");
        return;
      }

      setSelectedFile(file);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    if (!selectedUniverseId || !selectedWorldId) {
      toast.error("Selecione universo e mundo");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("universe_id", selectedUniverseId);
      formData.append("world_id", selectedWorldId);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const uploadResponse = await fetch("/api/lore/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        toast.error(uploadData.error || "Erro ao fazer upload");
        setIsUploading(false);
        return;
      }

      toast.success("Arquivo enviado! Extraindo informações...");
      setIsUploading(false);
      setIsExtracting(true);

      // Step 2: Extract entities
      const extractResponse = await fetch("/api/lore/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          file_path: uploadData.file_path,
          universe_id: selectedUniverseId,
          world_id: selectedWorldId,
        }),
      });

      const extractData = await extractResponse.json();

      if (!extractResponse.ok) {
        toast.error(extractData.error || "Erro ao extrair informações");
        setIsExtracting(false);
        return;
      }

      setExtractedEntities(extractData.entities || []);
      setShowReview(true);
      setIsExtracting(false);
      toast.success(`${extractData.count} entidades e ${extractData.relations?.length || 0} relações extraídas! Revise antes de salvar.`);
    } catch (error) {
      console.error("Error in upload:", error);
      toast.error("Erro ao processar arquivo");
      setIsUploading(false);
      setIsExtracting(false);
    }
  }

  function handleEditEntity(index: number, field: string, value: any) {
    setExtractedEntities((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleRemoveEntity(index: number) {
    setExtractedEntities((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveAll() {
    if (extractedEntities.length === 0) {
      toast.error("Nenhuma entidade para salvar");
      return;
    }

    setIsSaving(true);

    try {
      // Create fichas in batch
      const promises = extractedEntities.map(async (entity) => {
        const response = await fetch("/api/fichas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            world_id: selectedWorldId,
            tipo: entity.tipo,
            titulo: entity.titulo,
            resumo: entity.resumo,
            conteudo: entity.conteudo,
            ano_diegese: entity.ano_diegese || null,
            tags: entity.tags || null,
          }),
        });

        return response.json();
      });

      await Promise.all(promises);

      toast.success(`${extractedEntities.length} fichas criadas com sucesso!`);

      // Reset state
      setSelectedFile(null);
      setExtractedEntities([]);
      setShowReview(false);

      // Redirect to catalog
      router.push("/catalog");
    } catch (error) {
      console.error("Error saving entities:", error);
      toast.error("Erro ao salvar fichas");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <Loading fullScreen text={t.common.loading} />;
  }

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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="font-medium">{t.common.back}</span>
            </button>

            <h1 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
              {t.nav.upload}
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!showReview ? (
          <>
            {/* Universe and World Selectors */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Select
                options={[
                  { value: "", label: "Selecione um universo" },
                  ...universes.map((u) => ({ value: u.id, label: u.nome })),
                ]}
                value={selectedUniverseId}
                onChange={(e) => setSelectedUniverseId(e.target.value)}
                fullWidth
              />

              <Select
                options={[
                  { value: "", label: "Selecione um mundo" },
                  ...worlds.map((w) => ({ value: w.id, label: w.nome })),
                ]}
                value={selectedWorldId}
                onChange={(e) => setSelectedWorldId(e.target.value)}
                disabled={!selectedUniverseId}
                fullWidth
              />
            </div>

            {/* Upload Area */}
            <Card variant="elevated" padding="lg">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-border-light-default dark:border-border-dark-default rounded-xl p-12 text-center hover:border-primary-500 transition-colors"
              >
                {selectedFile ? (
                  <div>
                    <svg
                      className="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg font-semibold text-text-light-primary dark:text-dark-primary mb-2">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary mb-4">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <Button variant="ghost" onClick={() => setSelectedFile(null)}>
                      Remover arquivo
                    </Button>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="w-16 h-16 mx-auto text-text-light-tertiary dark:text-dark-tertiary mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-lg font-semibold text-text-light-primary dark:text-dark-primary mb-2">
                      Arraste um arquivo ou clique para selecionar
                    </p>
                    <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary mb-4">
                      Formatos suportados: PDF, DOCX, TXT
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input">
                      <Button variant="ghost">
                        Selecionar Arquivo
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="mt-6">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleUpload}
                    loading={isUploading || isExtracting}
                    disabled={!selectedUniverseId || !selectedWorldId}
                  >
                    {isUploading
                      ? "Enviando arquivo..."
                      : isExtracting
                      ? "Extraindo informações..."
                      : "Fazer Upload e Extrair"}
                  </Button>
                </div>
              )}
            </Card>

            {/* Instructions */}
            <Card variant="default" padding="md" className="mt-6">
              <h3 className="font-semibold text-text-light-primary dark:text-dark-primary mb-3">
                Como funciona?
              </h3>
              <ol className="space-y-2 text-sm text-text-light-secondary dark:text-dark-secondary">
                <li>1. Selecione o universo e mundo onde as fichas serão criadas</li>
                <li>2. Faça upload de um documento (PDF, DOCX ou TXT)</li>
                <li>3. A IA analisará o texto e extrairá automaticamente:</li>
                <ul className="ml-6 mt-1 space-y-1">
                  <li>• Personagens</li>
                  <li>• Locais</li>
                  <li>• Eventos</li>
                  <li>• Conceitos</li>
                  <li>• Regras</li>
                </ul>
                <li>4. Revise as entidades extraídas antes de salvar</li>
                <li>5. As fichas serão criadas automaticamente no catálogo</li>
              </ol>
            </Card>
          </>
        ) : (
          <>
            {/* Review Entities */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                    Entidades Extraídas
                  </h2>
                  <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                    Revise e edite antes de salvar
                  </p>
                </div>
                <Badge variant="primary" size="lg">
                  {extractedEntities.length} entidades
                </Badge>
              </div>

              <div className="space-y-4">
                {extractedEntities.map((entity, index) => (
                  <Card key={index} variant="elevated" padding="md">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="primary">{entity.tipo}</Badge>
                      <button
                        onClick={() => handleRemoveEntity(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <Input
                      label="Título"
                      value={entity.titulo}
                      onChange={(e) => handleEditEntity(index, "titulo", e.target.value)}
                      fullWidth
                      className="mb-3"
                    />

                    <Textarea
                      label="Resumo"
                      value={entity.resumo}
                      onChange={(e) => handleEditEntity(index, "resumo", e.target.value)}
                      fullWidth
                      className="mb-3"
                    />

                    <Textarea
                      label="Conteúdo"
                      value={entity.conteudo}
                      onChange={(e) => handleEditEntity(index, "conteudo", e.target.value)}
                      fullWidth
                      className="mb-3"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Ano Diegético"
                        type="number"
                        value={entity.ano_diegese || ""}
                        onChange={(e) =>
                          handleEditEntity(index, "ano_diegese", parseInt(e.target.value) || null)
                        }
                        fullWidth
                      />

                      <Input
                        label="Tags"
                        value={entity.tags || ""}
                        onChange={(e) => handleEditEntity(index, "tags", e.target.value)}
                        fullWidth
                      />
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowReview(false);
                    setExtractedEntities([]);
                    setSelectedFile(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSaveAll}
                  loading={isSaving}
                  disabled={extractedEntities.length === 0}
                >
                  Salvar Todas as Fichas ({extractedEntities.length})
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
