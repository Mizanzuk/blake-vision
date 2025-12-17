"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "@/app/types";

interface TypesDropdownProps {
  label?: string;
  types: Category[];
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
  onEdit?: (type: Category) => void;
  onDelete?: (slug: string, nome: string) => void;
  onCreate?: () => void;
  onReorder?: (types: Category[]) => void;
}

// Sortable Item Component
interface SortableTypeItemProps {
  type: Category;
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
  onEdit?: (type: Category) => void;
  onDelete?: (slug: string, nome: string) => void;
  setIsOpen: (open: boolean) => void;
}

function SortableTypeItem({
  type,
  selectedSlugs,
  onToggle,
  onEdit,
  onDelete,
  setIsOpen,
}: SortableTypeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: type.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative flex items-center px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-move border-b border-border-light-default dark:border-border-dark-default last:border-b-0",
        selectedSlugs.includes(type.slug) && "bg-primary-50 dark:bg-primary-900/20"
      )}
      {...attributes}
      {...listeners}
    >
      <div
        className="flex items-center flex-1 min-w-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(type.slug);
        }}
      >
        <input
          type="checkbox"
          checked={selectedSlugs.includes(type.slug)}
          onChange={() => {}}
          className="mr-3 h-4 w-4 rounded border-border-light-default dark:border-border-dark-default text-primary-600 focus:ring-primary-500"
        />
        <div className="flex-1 min-w-0 pr-2">
          <p className={clsx(
            "text-sm font-medium truncate",
            selectedSlugs.includes(type.slug)
              ? "text-primary-700 dark:text-primary-300"
              : "text-text-light-primary dark:text-dark-primary"
          )}>
            {type.label}
          </p>
        </div>
      </div>

      {/* Hover Buttons */}
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(type);
                setIsOpen(false);
              }}
              className="p-1.5 rounded hover:bg-light-overlay dark:hover:bg-dark-overlay text-text-light-secondary dark:text-dark-secondary hover:text-text-light-primary dark:hover:text-dark-primary transition-colors"
              title="Editar categoria"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {/* Apenas mostrar botão deletar para categorias customizadas (user_id != null) */}
          {onDelete && type.user_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(type.slug, type.label);
                setIsOpen(false);
              }}
              className="p-1.5 rounded hover:bg-error-light/10 dark:hover:bg-error-dark/10 text-text-light-secondary dark:text-dark-secondary hover:text-error-light dark:hover:text-error-dark transition-colors"
              title="Deletar categoria"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TypesDropdown({
  label,
  types,
  selectedSlugs,
  onToggle,
  onEdit,
  onDelete,
  onCreate,
  onReorder,
}: TypesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localTypes, setLocalTypes] = useState<Category[]>(types);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  // Update local types when prop changes
  useEffect(() => {
    setLocalTypes(types);
  }, [types]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    setLocalTypes((items) => {
      const oldIndex = items.findIndex(t => t.slug === active.id);
      const newIndex = items.findIndex(t => t.slug === over.id);
      
      const newOrder = arrayMove(items, oldIndex, newIndex);
      
      if (onReorder) {
        onReorder(newOrder);
      }
      
      return newOrder;
    });
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const getButtonText = () => {
    if (selectedSlugs.length === 0) {
      return "Todos os tipos";
    }
    if (selectedSlugs.length === 1) {
      const type = types.find(t => t.slug === selectedSlugs[0]);
      return type?.label || "1 tipo selecionado";
    }
    return `${selectedSlugs.length} tipos selecionados`;
  };

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-medium text-text-light-secondary dark:text-dark-secondary">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left rounded-lg border border-border-light-default dark:border-border-dark-default bg-light-raised dark:bg-dark-raised text-text-light-primary dark:text-dark-primary hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex items-center justify-between"
      >
        <span className="text-sm truncate">
          {getButtonText()}
        </span>
        <svg
          className={clsx(
            "w-4 h-4 text-text-light-tertiary dark:text-dark-tertiary transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-w-[calc(20rem-2rem)] bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* All types option */}
          <div
            className={clsx(
              "px-3 py-2 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors cursor-pointer border-b border-border-light-default dark:border-border-dark-default flex items-center gap-2",
              selectedSlugs.length === 0 && "bg-primary-50 dark:bg-primary-900/20"
            )}
            onClick={() => {
              // Clear all selections
              selectedSlugs.forEach(slug => onToggle(slug));
            }}
          >
            <input
              type="checkbox"
              checked={selectedSlugs.length === 0}
              onChange={() => {}}
              className="w-4 h-4 rounded border-border-light-default dark:border-border-dark-default text-primary-600 focus:ring-primary-500"
            />
            <p className={clsx(
              "text-sm font-medium",
              selectedSlugs.length === 0
                ? "text-primary-700 dark:text-primary-300"
                : "text-text-light-primary dark:text-dark-primary"
            )}>
              Todos os tipos
            </p>
          </div>

          {/* Type Options with Drag and Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localTypes.map(t => t.slug)}
              strategy={verticalListSortingStrategy}
            >
              {localTypes.map((type) => (
                <SortableTypeItem
                  key={type.slug}
                  type={type}
                  selectedSlugs={selectedSlugs}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  setIsOpen={setIsOpen}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Create New Option */}
          {onCreate && (
            <>
              <div className="border-b border-border-light-default dark:border-border-dark-default" />
              <button
                onClick={() => {
                  onCreate();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-primary-600 dark:text-primary-400 hover:bg-light-overlay dark:hover:bg-dark-overlay transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar Nova Categoria
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
