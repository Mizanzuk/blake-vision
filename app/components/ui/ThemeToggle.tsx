"use client";

import { usePreferences } from "@/app/lib/stores/preferences";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { clsx } from "clsx";

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "dropdown";
}

export function ThemeToggle({ className, showLabel = false, variant = "default" }: ThemeToggleProps) {
  const { theme, toggleTheme } = usePreferences();
  const { t } = useTranslation();

  if (variant === "dropdown") {
    return (
      <button
        onClick={toggleTheme}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay transition-colors"
      >
        {theme === "dark" ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
        <span>{theme === "dark" ? "Modo Diurno" : "Modo Noturno"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        "inline-flex items-center gap-2 p-2 rounded-lg transition-colors",
        "text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay",
        "dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay",
        className
      )}
      aria-label={t.theme.toggle}
      title={t.theme.toggle}
    >
      {theme === "dark" ? (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === "dark" ? t.theme.light : t.theme.dark}
        </span>
      )}
    </button>
  );
}
