"use client";

import { Toaster as SonnerToaster } from "sonner";
import { usePreferences } from "@/app/lib/stores/preferences";

export function Toaster() {
  const theme = usePreferences((state) => state.theme);

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      expand={false}
      richColors={false}
      closeButton
      visibleToasts={1}
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#2B2420' : '#FFFFFF',
          color: theme === 'dark' ? '#F5F1E8' : '#2B1810',
          border: `1px solid ${theme === 'dark' ? '#4D443D' : '#E8E4DB'}`,
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontFamily: 'var(--font-geist-sans), Inter, system-ui',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          minWidth: '320px',
          maxWidth: '480px',
        },
        classNames: {
          toast: "font-sans blake-toast",
          title: "font-medium",
          description: "text-sm opacity-90",
          success: "blake-toast-success",
          error: "blake-toast-error",
          warning: "blake-toast-warning",
          info: "blake-toast-info",
        },
      }}
    />
  );
}
