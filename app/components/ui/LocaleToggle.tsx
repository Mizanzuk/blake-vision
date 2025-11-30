"use client";

import { usePreferences } from "@/app/lib/stores/preferences";
import { useTranslation } from "@/app/lib/hooks/useTranslation";
import { clsx } from "clsx";
import type { Locale } from "@/app/types";

export interface LocaleToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function LocaleToggle({ className, showLabel = false }: LocaleToggleProps) {
  const { locale, setLocale } = usePreferences();
  const { t } = useTranslation();

  const toggleLocale = () => {
    const newLocale: Locale = locale === "pt-BR" ? "en-US" : "pt-BR";
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLocale}
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
        "text-text-light-secondary hover:text-text-light-primary hover:bg-light-overlay",
        "dark:text-dark-secondary dark:hover:text-dark-primary dark:hover:bg-dark-overlay",
        className
      )}
      aria-label={`Mudar idioma / Change language`}
      title={`Mudar idioma / Change language`}
    >
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
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      {showLabel ? (
        <span>{t.locale[locale]}</span>
      ) : (
        <span className="uppercase">{locale === "pt-BR" ? "PT" : "EN"}</span>
      )}
    </button>
  );
}
