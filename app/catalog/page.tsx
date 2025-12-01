"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  EmptyState,
  Loading,
} from "@/app/components/ui";
import { Header } from "@/app/components/layout/Header";
import { UniverseDropdown } from "@/app/components/ui/UniverseDropdown";
import { WorldsDropdown } from "@/app/components/ui/WorldsDropdown";
import { TypesDropdown } from "@/app/components/ui/TypesDropdown";
import FichaModal from "@/app/components/catalog/FichaModal";
import WorldModal from "@/app/components/catalog/WorldModal";
import CategoryModal from "@/app/components/catalog/CategoryModal";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { toast } from "sonner";
import type { Universe, World, Ficha, Category } from "@/app/types";

// Sortable Card Component
interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  isDragging?: boolean;
}

function SortableCard({ id, children, isDragging }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function CatalogPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Data
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("");
  const [worlds, setWorlds] = useState<World[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorldIds, setSelectedWorldIds] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [showWorldFilter, setShowWorldFilter] = useState(false);
  
  // Multiple selection
  const [selectedFichaIds, setSelectedFichaIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Drag and drop
  const [customOrder, setCustomOrder] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Modals
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showNewUniverseModal, setShowNewUniverseModal] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState<Universe | null>(null);
  const [newUniverseName, setNewUniverseName] = useState("");
  const [newUniverseDescription, setNewUniverseDescription] = useState("");
  const [isCreatingUniverse, setIsCreatingUniverse] = useState(false);
  
  // Selected items for editing
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      loadUniverses();
      
      const saved = localStorage.getItem("selectedUniverseId");
      if (saved) {
        setSelectedUniverseId(saved);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (selectedUniverseId) {
      loadCatalogData();
      loadCustomOrder();
    }
  }, [selectedUniverseId]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
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

  async function loadCatalogData() {
    try {
      const response = await fetch(`/api/catalog?universeId=${selectedUniverseId}`);
      const data = await response.json();
      
      if (response.ok) {
        setWorlds(data.worlds || []);
        setCategories(data.types || []);
        setFichas(data.fichas || []);
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error loading catalog:", error);
      toast.error(t.errors.network);
    }
  }

  function handleUniverseChange(universeId: string) {
    if (universeId === "create_new_universe") {
      setShowNewUniverseModal(true);
      return;
    }
    setSelectedUniverseId(universeId);
    localStorage.setItem("selectedUniverseId", universeId);
    setSelectedWorldIds([]);
    setSelectedType("");
    setSelectedEpisode("");
  }

  async function handleCreateUniverse() {
    if (!newUniverseName.trim()) {
      toast.error("Dê um nome ao universo.");
      return;
    }
    if (!userId) {
      toast.error("Usuário não autenticado.");
      return;
    }
    
    setIsCreatingUniverse(true);
    
    try {
      if (editingUniverse) {
        // Update existing universe
        const { data: updated, error: updateError } = await supabase
          .from("universes")
          .update({
            nome: newUniverseName.trim(),
            descricao: newUniverseDescription.trim() || null
          })
          .eq("id", editingUniverse.id)
          .select("*")
          .single();
        
        if (updateError) throw updateError;
        
        if (updated) {
          setUniverses(prev => prev.map(u => u.id === editingUniverse.id ? updated as Universe : u));
          toast.success("Universo atualizado com sucesso.");
        }
      } else {
        // Create new universe
        const { data: inserted, error: insertError } = await supabase
          .from("universes")
          .insert({
            nome: newUniverseName.trim(),
            descricao: newUniverseDescription.trim() || null
          })
          .select("*")
          .single();
        
        if (insertError) throw insertError;
        
        if (inserted) {
          setUniverses(prev => [...prev, inserted as Universe]);
          setSelectedUniverseId(inserted.id);
          localStorage.setItem("selectedUniverseId", inserted.id);
          toast.success("Novo Universo criado com sucesso.");
        }
      }
      
      setShowNewUniverseModal(false);
      setEditingUniverse(null);
      setNewUniverseName("");
      setNewUniverseDescription("");
    } catch (err) {
      console.error(err);
      toast.error(editingUniverse ? "Erro ao atualizar universo." : "Erro ao criar universo.");
    } finally {
      setIsCreatingUniverse(false);
    }
  }

  function openCreateUniverseModal() {
    setEditingUniverse(null);
    setNewUniverseName("");
    setNewUniverseDescription("");
    setShowNewUniverseModal(true);
  }

  function openEditUniverseModal(universe: Universe) {
    setEditingUniverse(universe);
    setNewUniverseName(universe.nome);
    setNewUniverseDescription(universe.descricao || "");
    setShowNewUniverseModal(true);
  }

  async function handleDeleteUniverse(universeId: string, universeName: string) {
    if (!confirm(`Tem certeza que deseja deletar o universo "${universeName}"? Todos os mundos e fichas associados serão deletados também.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("universes")
        .delete()
        .eq("id", universeId);

      if (error) throw error;

      setUniverses(prev => prev.filter(u => u.id !== universeId));
      if (selectedUniverseId === universeId) {
        setSelectedUniverseId("");
        localStorage.removeItem("selectedUniverseId");
      }
      toast.success("Universo deletado com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar universo.");
    }
  }

  // Ficha functions
  function openNewFichaModal() {
    setSelectedFicha(null);
    setShowFichaModal(true);
  }

  function openEditFichaModal(ficha: Ficha) {
    setSelectedFicha(ficha);
    setShowFichaModal(true);
  }

  async function handleSaveFicha(fichaData: any) {
    try {
      const url = selectedFicha ? "/api/fichas" : "/api/fichas";
      const method = selectedFicha ? "PUT" : "POST";
      
      const dataToSend = selectedFicha 
        ? { ...fichaData, id: selectedFicha.id }
        : fichaData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(selectedFicha ? t.success.updated : t.success.created);
        loadCatalogData();
        setShowFichaModal(false);
        setSelectedFicha(null);
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error saving ficha:", error);
      toast.error(t.errors.network);
    }
  }

  async function handleDeleteFicha(fichaId: string) {
    try {
      const response = await fetch(`/api/fichas?id=${fichaId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t.success.deleted);
        loadCatalogData();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error deleting ficha:", error);
      toast.error(t.errors.network);
    }
  }

  // World functions
  function openNewWorldModal() {
    setSelectedWorld(null);
    setShowWorldModal(true);
  }

  function openEditWorldModal(world: World) {
    setSelectedWorld(world);
    setShowWorldModal(true);
  }

  async function handleSaveWorld(worldData: any) {
    try {
      const url = "/api/worlds";
      const method = selectedWorld ? "PUT" : "POST";
      
      const dataToSend = selectedWorld 
        ? { ...worldData, id: selectedWorld.id }
        : { ...worldData, universe_id: selectedUniverseId };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(selectedWorld ? t.success.updated : t.success.created);
        loadCatalogData();
        setShowWorldModal(false);
        setSelectedWorld(null);
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error saving world:", error);
      toast.error(t.errors.network);
    }
  }

  async function handleDeleteWorld(worldId: string) {
    try {
      const response = await fetch(`/api/worlds?id=${worldId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t.success.deleted);
        loadCatalogData();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error deleting world:", error);
      toast.error(t.errors.network);
    }
  }

  // Drag and drop functions
  async function loadCustomOrder() {
    if (!selectedUniverseId) return;
    
    try {
      const response = await fetch(`/api/card-order?universe_id=${selectedUniverseId}`);
      if (response.ok) {
        const data = await response.json();
        const orderMap: Record<string, number> = {};
        data.orders.forEach((item: { ficha_id: string; custom_order: number }) => {
          orderMap[item.ficha_id] = item.custom_order;
        });
        setCustomOrder(orderMap);
      }
    } catch (error) {
      console.error("Error loading custom order:", error);
    }
  }

  async function saveCustomOrder(fichaIds: string[]) {
    if (!selectedUniverseId) return;
    
    try {
      const response = await fetch("/api/card-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universe_id: selectedUniverseId,
          ficha_orders: fichaIds,
        }),
      });
      
      if (response.ok) {
        toast.success("Ordem salva com sucesso!");
      }
    } catch (error) {
      console.error("Error saving custom order:", error);
      toast.error("Erro ao salvar ordem.");
    }
  }

  async function resetCustomOrder() {
    if (!selectedUniverseId) return;
    
    if (!confirm("Tem certeza que deseja resetar a ordem das fichas?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/card-order?universe_id=${selectedUniverseId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setCustomOrder({});
        toast.success("Ordem resetada com sucesso!");
      }
    } catch (error) {
      console.error("Error resetting custom order:", error);
      toast.error("Erro ao resetar ordem.");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setIsDragging(false);
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = sortedFichas.findIndex(f => f.id === active.id);
    const newIndex = sortedFichas.findIndex(f => f.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sortedFichas, oldIndex, newIndex);
      const newCustomOrder: Record<string, number> = {};
      newOrder.forEach((ficha, index) => {
        newCustomOrder[ficha.id] = index;
      });
      setCustomOrder(newCustomOrder);
      
      // Save order to backend
      saveCustomOrder(newOrder.map(f => f.id));
    }
  }

  // Category functions
  function openNewCategoryModal() {
    setSelectedCategory(null);
    setShowCategoryModal(true);
  }

  function openEditCategoryModal(category: Category) {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  }

  async function handleSaveCategory(categoryData: any) {
    try {
      const url = "/api/categories";
      const method = selectedCategory ? "PUT" : "POST";
      
      const dataToSend = selectedCategory 
        ? { ...categoryData, universe_id: selectedUniverseId }
        : { ...categoryData, universe_id: selectedUniverseId };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(selectedCategory ? t.success.updated : t.success.created);
        loadCatalogData();
        setShowCategoryModal(false);
        setSelectedCategory(null);
      } else {
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(t.errors.network);
    }
  }

  async function handleDeleteCategory(slug: string) {
    try {
      const response = await fetch(`/api/categories?universe_id=${selectedUniverseId}&slug=${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t.success.deleted);
        loadCatalogData();
      } else {
        const data = await response.json();
        toast.error(data.error || t.errors.generic);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(t.errors.network);
    }
  }

  // Filter fichas
  const filteredFichas = fichas.filter(ficha => {
    if (searchTerm && !ficha.titulo.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedWorldIds.length > 0 && !selectedWorldIds.includes(ficha.world_id)) {
      return false;
    }
    if (selectedType && ficha.tipo !== selectedType) {
      return false;
    }
    if (selectedEpisode && ficha.episodio !== selectedEpisode) {
      return false;
    }
    return true;
  });

  // Sort fichas by custom order
  const sortedFichas = [...filteredFichas].sort((a, b) => {
    const orderA = customOrder[a.id];
    const orderB = customOrder[b.id];
    
    // If both have custom order, sort by order
    if (orderA !== undefined && orderB !== undefined) {
      return orderA - orderB;
    }
    
    // If only A has custom order, A comes first
    if (orderA !== undefined) return -1;
    
    // If only B has custom order, B comes first
    if (orderB !== undefined) return 1;
    
    // If neither has custom order, maintain original order
    return 0;
  });

  // Toggle world selection
  const toggleWorldSelection = (worldId: string) => {
    setSelectedWorldIds(prev => 
      prev.includes(worldId) 
        ? prev.filter(id => id !== worldId)
        : [...prev, worldId]
    );
  };

  // Get unique episodes
  const episodes = Array.from(new Set(fichas.filter(f => f.episodio).map(f => f.episodio)));

  if (isLoading) {
    return <Loading fullScreen text={t.common.loading} />;
  }

  return (
    <div className="min-h-screen bg-light-base dark:bg-dark-base">
      <Header showNav={true} />
      
      {/* Actions Bar */}
      <div className="border-b border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowManageCategoriesModal(true)}
              disabled={!selectedUniverseId}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            >
              Categorias
            </Button>
            
            <Button
              variant="primary"
              onClick={openNewFichaModal}
              disabled={!selectedUniverseId}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t.ficha.create}
            </Button>
            
            {Object.keys(customOrder).length > 0 && (
              <Button
                variant="ghost"
                onClick={resetCustomOrder}
                disabled={!selectedUniverseId}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                Resetar Ordem
              </Button>
            )}
            
            <Button
              variant={isSelectionMode ? "secondary" : "ghost"}
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedFichaIds([]);
              }}
              disabled={!selectedUniverseId || fichas.length === 0}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            >
              {isSelectionMode ? "Cancelar Seleção" : "Selecionar Múltiplas"}
            </Button>
          </div>
        </div>
        
        {/* Selection Actions Bar */}
        {isSelectionMode && selectedFichaIds.length > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {selectedFichaIds.length} {selectedFichaIds.length === 1 ? "ficha selecionada" : "fichas selecionadas"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Export selected fichas
                    const selectedFichas = fichas.filter(f => selectedFichaIds.includes(f.id));
                    const dataStr = JSON.stringify(selectedFichas, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `fichas_${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    toast.success(`${selectedFichaIds.length} fichas exportadas`);
                  }}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  }
                >
                  Exportar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (confirm(`Tem certeza que deseja apagar ${selectedFichaIds.length} fichas?`)) {
                      for (const id of selectedFichaIds) {
                        await handleDeleteFicha(id);
                      }
                      setSelectedFichaIds([]);
                      setIsSelectionMode(false);
                      toast.success(`${selectedFichaIds.length} fichas apagadas`);
                    }
                  }}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  Apagar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Universe and Worlds Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <UniverseDropdown
            label="Universo"
            universes={universes}
            selectedId={selectedUniverseId}
            onSelect={setSelectedUniverseId}
            onEdit={openEditUniverseModal}
            onDelete={handleDeleteUniverse}
            onCreate={openCreateUniverseModal}
          />
          
          <WorldsDropdown
            label="Mundos"
            worlds={worlds}
            selectedIds={selectedWorldIds}
            onToggle={toggleWorldSelection}
            onEdit={openEditWorldModal}
            onDelete={handleDeleteWorld}
            onCreate={openNewWorldModal}
            disabled={!selectedUniverseId}
          />
        </div>

        {selectedUniverseId ? (
          <>

            {/* Filters */}
            <Card variant="elevated" padding="md" className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder={t.common.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                
                <TypesDropdown
                  types={categories}
                  selectedSlug={selectedType}
                  onSelect={setSelectedType}
                  showAllOption={true}
                  allOptionLabel="Todos os tipos"
                />
                
                <Select
                  options={[
                    { value: "", label: "Todos os episódios" },
                    ...episodes.map(e => ({ value: e!, label: e! })),
                  ]}
                  value={selectedEpisode}
                  onChange={(e) => setSelectedEpisode(e.target.value)}
                />
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                  {filteredFichas.length} {filteredFichas.length === 1 ? "ficha encontrada" : "fichas encontradas"}
                  {selectedWorldIds.length > 0 && (
                    <span className="ml-2 text-primary-500">
                      ({selectedWorldIds.length} {selectedWorldIds.length === 1 ? "mundo selecionado" : "mundos selecionados"})
                    </span>
                  )}
                </p>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedWorldIds([]);
                    setSelectedType("");
                    setSelectedEpisode("");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            </Card>

            {/* Fichas Grid */}
            {filteredFichas.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title={t.ficha.noFichas}
                description={t.ficha.createFirst}
                action={
                  <Button variant="primary" onClick={openNewFichaModal}>
                    {t.ficha.create}
                  </Button>
                }
              />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragStart={() => setIsDragging(true)}
              >
                <SortableContext
                  items={sortedFichas.map(f => f.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedFichas.map(ficha => (
                      <SortableCard key={ficha.id} id={ficha.id} isDragging={isDragging}>
                  <Card
                    key={ficha.id}
                    variant="elevated"
                    padding="md"
                    hoverable
                    className={`cursor-pointer group relative ${isSelectionMode && selectedFichaIds.includes(ficha.id) ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    {/* Checkbox for selection mode */}
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2 z-50">
                        <input
                          type="checkbox"
                          checked={selectedFichaIds.includes(ficha.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (selectedFichaIds.includes(ficha.id)) {
                              setSelectedFichaIds(selectedFichaIds.filter(id => id !== ficha.id));
                            } else {
                              setSelectedFichaIds([...selectedFichaIds, ficha.id]);
                            }
                          }}
                          className="w-5 h-5 rounded border-border-light-default dark:border-border-dark-default text-primary-500 focus:ring-primary-500 cursor-pointer"
                        />
                      </div>
                    )}
                    
                    {/* Action buttons - visible on hover (hidden in selection mode) */}
                    {!isSelectionMode && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditFichaModal(ficha);
                        }}
                        className="p-2 rounded-lg bg-white dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default hover:border-primary-500 hover:text-primary-500 transition-colors shadow-soft"
                        title="Editar ficha"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Tem certeza que deseja apagar a ficha "${ficha.titulo}"?`)) {
                            handleDeleteFicha(ficha.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-white dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default hover:border-error-light hover:text-error-light transition-colors shadow-soft"
                        title="Apagar ficha"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      </div>
                    )}

                    <div onClick={() => !isSelectionMode && openEditFichaModal(ficha)}>
                      {ficha.imagem_capa && (
                        <img
                          src={ficha.imagem_capa}
                          alt={ficha.titulo}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-text-light-primary dark:text-dark-primary flex-1">
                          {ficha.titulo}
                        </h3>
                        {ficha.codigo && (
                          <Badge variant="default" size="sm">
                            {ficha.codigo}
                          </Badge>
                        )}
                      </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="primary" size="sm">
                        {categories.find(c => c.slug === ficha.tipo)?.label || ficha.tipo}
                      </Badge>
                      {ficha.ano_diegese && (
                        <Badge variant="default" size="sm">
                          {ficha.ano_diegese}
                        </Badge>
                      )}
                    </div>
                    
                      {ficha.resumo && (
                        <p className="text-sm text-text-light-secondary dark:text-dark-secondary line-clamp-3">
                          {ficha.resumo}
                        </p>
                      )}
                    </div>
                  </Card>
                      </SortableCard>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </>
        ) : (
          <EmptyState
            icon={
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title={t.universe.noUniverses}
            description="Selecione um universo para visualizar o catálogo"
          />
        )}
      </div>

      {/* Modals */}
      <FichaModal
        isOpen={showFichaModal}
        onClose={() => {
          setShowFichaModal(false);
          setSelectedFicha(null);
        }}
        ficha={selectedFicha}
        worlds={worlds}
        categories={categories}
        onSave={handleSaveFicha}
        onDelete={selectedFicha ? handleDeleteFicha : undefined}
      />

      <WorldModal
        isOpen={showWorldModal}
        onClose={() => {
          setShowWorldModal(false);
          setSelectedWorld(null);
        }}
        world={selectedWorld}
        onSave={handleSaveWorld}
        onDelete={selectedWorld ? handleDeleteWorld : undefined}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSave={handleSaveCategory}
        onDelete={selectedCategory ? handleDeleteCategory : undefined}
      />

      {/* Manage Categories Modal */}
      {showManageCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-light-raised dark:bg-dark-raised rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-light-primary dark:text-dark-primary">
                Gerenciar Categorias
              </h2>
              <button
                onClick={() => setShowManageCategoriesModal(false)}
                className="p-2 rounded-lg hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setShowManageCategoriesModal(false);
                openNewCategoryModal();
              }}
              className="mb-4"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nova Categoria
            </Button>

            <div className="space-y-2">
              {categories.map(category => (
                <div
                  key={category.slug}
                  className="flex items-center justify-between p-4 rounded-lg bg-light-base dark:bg-dark-base border border-border-light-default dark:border-border-dark-default"
                >
                  <div>
                    <h3 className="font-semibold text-text-light-primary dark:text-dark-primary">
                      {category.label}
                    </h3>
                    <p className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                      {category.slug} {category.prefix && `• ${category.prefix}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowManageCategoriesModal(false);
                      openEditCategoryModal(category);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Universo */}
      {showNewUniverseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowNewUniverseModal(false)}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              handleCreateUniverse();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border border-border-light-default dark:border-border-dark-default rounded-lg p-6 bg-light-base dark:bg-dark-base space-y-4 mx-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingUniverse ? "Editar Universo" : "Novo Universo"}</h3>
              <button
                type="button"
                onClick={() => setShowNewUniverseModal(false)}
                className="text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Nome do Universo</label>
              <Input
                value={newUniverseName}
                onChange={(e) => setNewUniverseName(e.target.value)}
                placeholder="Ex: Antiverso"
                fullWidth
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Descrição</label>
              <textarea
                className="w-full rounded-md bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default px-3 py-2 text-sm min-h-[100px]"
                value={newUniverseDescription}
                onChange={(e) => setNewUniverseDescription(e.target.value)}
                placeholder="Resumo do Universo…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowNewUniverseModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreatingUniverse}
              >
                {isCreatingUniverse ? (editingUniverse ? "Salvando..." : "Criando...") : "Salvar"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
