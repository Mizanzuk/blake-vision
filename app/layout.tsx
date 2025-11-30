import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./styles/globals.css";
import { Toaster } from "./components/ui";

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
        className={`${inter.variable} ${merriweather.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
