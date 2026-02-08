import type { Metadata } from "next";
import { Inter, Merriweather, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import Script from 'next/script';
import "./styles/globals.css";
import { Toaster } from "./components/ui";
import { UniverseProvider } from "./lib/contexts/UniverseContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blake Vision - Narrative Universe Management",
  description: "Advanced platform for managing complex fictional universes with AI-powered assistance",
  keywords: ["writing", "narrative", "worldbuilding", "AI", "lore management"],
  authors: [{ name: "Blake Vision" }],
  creator: "Blake Vision",
  publisher: "Blake Vision",
  metadataBase: new URL("https://blake.vision"),
  openGraph: {
    title: "Blake Vision",
    description: "Advanced platform for managing complex fictional universes",
    url: "https://blake.vision",
    siteName: "Blake Vision",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blake Vision",
    description: "Advanced platform for managing complex fictional universes",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${merriweather.variable} ${sourceSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <UniverseProvider>
          {children}
        </UniverseProvider>
        <Toaster />
        <Script src="/focus-mode.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
