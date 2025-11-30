import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, Locale } from "@/app/types";

interface PreferencesState {
  theme: Theme;
  locale: Locale;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      locale: "pt-BR",
      
      setTheme: (theme) => {
        set({ theme });
        // Update document class
        if (typeof window !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
      
      setLocale: (locale) => set({ locale }),
      
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        get().setTheme(newTheme);
      },
    }),
    {
      name: "blake-vision-preferences",
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state && typeof window !== "undefined") {
          if (state.theme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
    }
  )
);
