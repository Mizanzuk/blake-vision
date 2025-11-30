"use client";

import { useEffect } from "react";
import { usePreferences } from "@/app/lib/stores/preferences";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = usePreferences((state) => state.theme);

  useEffect(() => {
    // Apply theme on mount and when it changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return <>{children}</>;
}
