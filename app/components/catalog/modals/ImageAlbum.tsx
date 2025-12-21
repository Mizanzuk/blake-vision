"use client";

import { useState, useRef } from "react";
import { Button } from "@/app/components/ui";
import { toast } from "sonner";

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  isPrincipal: boolean;
}

interface ImageAlbumProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export default function ImageAlbum({
  images,
  onChange,
  maxImages = 10,
}: ImageAlbumProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    
    if (images.length + newFiles.length > maxImages) {
      toast.error(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    const newImages: ImageItem[] = newFiles.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file,
      isPrincipal: images.length === 0 && index === 0, // Primeira imagem é principal
    }));

    onChange([...images, ...newImages]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    
    // Se removeu a imagem principal e ainda há imagens, tornar a primeira como principal
    if (updatedImages.length > 0 && !updatedImages.some((img) => img.isPrincipal)) {
      updatedImages[0].isPrincipal = true;
    }
    
    onChange(updatedImages);
  };

  const handleSetPrincipal = (id: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrincipal: img.id === id,
    }));
    onChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          Álbum de Imagens
        </label>
        <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${
            isDragging
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
              : "border-border-light-default dark:border-border-dark-default hover:border-primary-300 dark:hover:border-primary-700"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-text-light-tertiary dark:text-text-dark-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Arraste imagens aqui ou
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Selecionar Arquivos
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`
                relative group rounded-lg overflow-hidden border-2 transition-all
                ${
                  image.isPrincipal
                    ? "border-primary-500 ring-2 ring-primary-500/20"
                    : "border-border-light-default dark:border-border-dark-default"
                }
              `}
            >
              <div className="aspect-square">
                <img
                  src={image.url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrincipal && (
                  <button
                    onClick={() => handleSetPrincipal(image.id)}
                    className="p-2 bg-white/90 dark:bg-dark-raised/90 rounded-lg hover:bg-white dark:hover:bg-dark-raised transition-colors"
                    title="Definir como principal"
                    type="button"
                  >
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="p-2 bg-white/90 dark:bg-dark-raised/90 rounded-lg hover:bg-white dark:hover:bg-dark-raised transition-colors"
                  title="Remover imagem"
                  type="button"
                >
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Badge de imagem principal */}
              {image.isPrincipal && (
                <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { ImageItem };
