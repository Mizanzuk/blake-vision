import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light mode surfaces
        light: {
          base: "#fafaf9",       // stone-50
          raised: "#ffffff",     // white
          overlay: "#f5f5f4",    // stone-100
        },
        // Dark mode surfaces
        dark: {
          base: "#0c0a09",       // stone-950
          raised: "#1c1917",     // stone-900
          overlay: "#292524",    // stone-800
        },
        // Borders
        border: {
          light: {
            subtle: "#e7e5e4",   // stone-200
            default: "#d6d3d1",  // stone-300
            strong: "#a8a29e",   // stone-400
          },
          dark: {
            subtle: "#292524",   // stone-800
            default: "#44403c",  // stone-700
            strong: "#57534e",   // stone-600
          },
        },
        // Text colors
        text: {
          light: {
            primary: "#1c1917",    // stone-900
            secondary: "#44403c",  // stone-700
            tertiary: "#78716c",   // stone-500
            disabled: "#a8a29e",   // stone-400
          },
          dark: {
            primary: "#fafaf9",    // stone-50
            secondary: "#e7e5e4",  // stone-200
            tertiary: "#a8a29e",   // stone-400
            disabled: "#78716c",   // stone-500
          },
        },
        // Primary action color (emerald for consistency)
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        // Urizen (consultation) - emerald/cyan/blue
        urizen: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        // Urthona (creative) - purple/fuchsia/pink
        urthona: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
        // Semantic colors
        success: {
          light: "#10b981",
          dark: "#34d399",
        },
        warning: {
          light: "#f59e0b",
          dark: "#fbbf24",
        },
        error: {
          light: "#ef4444",
          dark: "#f87171",
        },
        info: {
          light: "#3b82f6",
          dark: "#60a5fa",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "var(--font-merriweather)",
          "Merriweather",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "Menlo",
          "Monaco",
          "Courier New",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],     // 10px
        xs: ["0.75rem", { lineHeight: "1rem" }],             // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }],         // 14px
        base: ["1rem", { lineHeight: "1.75rem" }],           // 16px - generous line-height for reading
        lg: ["1.125rem", { lineHeight: "1.875rem" }],        // 18px
        xl: ["1.25rem", { lineHeight: "2rem" }],             // 20px
        "2xl": ["1.5rem", { lineHeight: "2.25rem" }],        // 24px
        "3xl": ["1.875rem", { lineHeight: "2.5rem" }],       // 30px
        "4xl": ["2.25rem", { lineHeight: "2.75rem" }],       // 36px
        "5xl": ["3rem", { lineHeight: "3.5rem" }],           // 48px
      },
      spacing: {
        "0.5": "0.125rem",   // 2px
        "1": "0.25rem",      // 4px
        "1.5": "0.375rem",   // 6px
        "2": "0.5rem",       // 8px
        "2.5": "0.625rem",   // 10px
        "3": "0.75rem",      // 12px
        "3.5": "0.875rem",   // 14px
        "4": "1rem",         // 16px
        "5": "1.25rem",      // 20px
        "6": "1.5rem",       // 24px
        "7": "1.75rem",      // 28px
        "8": "2rem",         // 32px
        "9": "2.25rem",      // 36px
        "10": "2.5rem",      // 40px
        "11": "2.75rem",     // 44px
        "12": "3rem",        // 48px
        "14": "3.5rem",      // 56px
        "16": "4rem",        // 64px
        "20": "5rem",        // 80px
        "24": "6rem",        // 96px
        "28": "7rem",        // 112px
        "32": "8rem",        // 128px
      },
      maxWidth: {
        "prose": "65ch",     // Ideal line length for reading
        "prose-lg": "70ch",
        "prose-xl": "75ch",
      },
      borderRadius: {
        sm: "0.25rem",       // 4px
        DEFAULT: "0.5rem",   // 8px
        md: "0.5rem",        // 8px
        lg: "0.75rem",       // 12px
        xl: "1rem",          // 16px
        "2xl": "1.5rem",     // 24px
      },
      boxShadow: {
        "soft": "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)",
        "soft-lg": "0 4px 16px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.08)",
        "soft-xl": "0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
