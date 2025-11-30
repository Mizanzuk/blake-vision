"use client";

import { Toaster as SonnerToaster } from "sonner";
import { usePreferences } from "@/app/lib/stores/preferences";

export function Toaster() {
  const theme = usePreferences((state) => state.theme);

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-sans",
          title: "font-medium",
          description: "text-sm opacity-90",
        },
      }}
    />
  );
}
