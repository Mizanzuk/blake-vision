"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { Loading } from "./Loading";

interface Mention {
  id: string;
  titulo: string;
  tipo: string;
  slug: string;
}

export interface MentionTextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  fullWidth?: boolean;
  helpText?: string;
  error?: string;
  required?: boolean;
}

export function MentionTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  fullWidth = false,
  helpText,
  error,
  required = false,
}: MentionTextareaProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mentionSearch.length >= 2) {
      searchMentions(mentionSearch);
    } else {
      setMentions([]);
      setShowMentions(false);
    }
  }, [mentionSearch]);

  async function searchMentions(search: string) {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/fichas?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      
      if (response.ok) {
        setMentions(data.fichas || []);
        setShowMentions(data.fichas?.length > 0);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error("Error searching mentions:", error);
    } finally {
      setIsSearching(false);
    }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(newCursorPosition);

    // Check if user typed @
    const textBeforeCursor = newValue.slice(0, newCursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(atIndex + 1);
      
      // Check if there's a space after @
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionSearch(textAfterAt);
      } else {
        setShowMentions(false);
        setMentionSearch("");
      }
    } else {
      setShowMentions(false);
      setMentionSearch("");
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!showMentions || mentions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % mentions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + mentions.length) % mentions.length);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      insertMention(mentions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowMentions(false);
      setMentionSearch("");
    }
  }

  function insertMention(mention: Mention) {
    if (!textareaRef.current) return;

    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    const newValue = 
      value.slice(0, atIndex) + 
      `@${mention.titulo}` + 
      textAfterCursor;
    
    onChange(newValue);
    
    // Set cursor position after mention
    const newCursorPos = atIndex + mention.titulo.length + 1;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);

    setShowMentions(false);
    setMentionSearch("");
  }

  function handleClickOutside(e: MouseEvent) {
    if (
      mentionsRef.current &&
      !mentionsRef.current.contains(e.target as Node) &&
      textareaRef.current &&
      !textareaRef.current.contains(e.target as Node)
    ) {
      setShowMentions(false);
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label className="block text-xs font-medium text-text-light-primary dark:text-dark-primary mb-2">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`
            w-full px-4 py-3 rounded-lg
            bg-light-raised dark:bg-dark-raised
            border ${
              error
                ? "border-danger-500"
                : "border-border-light-default dark:border-border-dark-default"
            }
            text-text-light-primary dark:text-dark-primary
            placeholder:text-text-light-tertiary dark:placeholder:text-dark-tertiary
            focus:outline-none focus:border-primary-500
            transition-all duration-200
            resize-y
            font-sans
          `}
        />

        {/* Mentions Dropdown */}
        {showMentions && (
          <div
            ref={mentionsRef}
            className="absolute z-50 w-full mt-1 bg-light-raised dark:bg-dark-raised border border-border-light-default dark:border-border-dark-default rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {isSearching ? (
              <div className="px-4 py-3 flex items-center justify-center">
                <Loading size="sm" />
                <span className="ml-2 text-sm text-text-light-tertiary dark:text-dark-tertiary">
                  Buscando...
                </span>
              </div>
            ) : mentions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-light-tertiary dark:text-dark-tertiary text-center">
                Nenhuma ficha encontrada
              </div>
            ) : (
              mentions.map((mention, index) => (
                <button
                  key={mention.id}
                  onClick={() => insertMention(mention)}
                  className={`
                    w-full px-4 py-3 text-left transition-colors
                    border-b border-border-light-default dark:border-border-dark-default last:border-b-0
                    ${
                      index === selectedIndex
                        ? "bg-primary-500/10"
                        : "hover:bg-light-base dark:hover:bg-dark-base"
                    }
                  `}
                >
                  <div className="font-semibold text-text-light-primary dark:text-dark-primary">
                    {mention.titulo}
                  </div>
                  <div className="text-sm text-text-light-tertiary dark:text-dark-tertiary">
                    {mention.tipo} • {mention.slug}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {helpText && !error && (
        <p className="mt-2 text-sm text-text-light-tertiary dark:text-dark-tertiary">
          {helpText}
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}
