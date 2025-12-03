import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from '@/components/layout';
import { PWAProvider } from "@/components/pwa/PWAProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nexo - Jogos de Palavras",
    template: "%s | Nexo"
  },
  description: "Plataforma de jogos de palavras em português. Palavras cruzadas, sopa de letras e mais! Desafios diários e leaderboards competitivas.",
  keywords: ["palavras cruzadas", "sopa de letras", "jogos de palavras", "português", "PT-PT", "desafio diário", "leaderboard", "PWA"],
  authors: [{ name: "Nexo" }],
  creator: "Nexo",
  publisher: "Nexo",
  
  // PWA Configuration
  applicationName: "Nexo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexo",
    startupImage: [
      {
        url: "/icons/apple-touch-icon.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  
  // Format detection - prevent iOS from styling phone numbers
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "Nexo",
    title: "Nexo - Jogos de Palavras",
    description: "Plataforma de jogos de palavras em português. Palavras cruzadas, sopa de letras e mais!",
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Nexo - Jogos de Palavras",
    description: "Plataforma de jogos de palavras em português.",
  },
  
  // Icons - handled by manifest.ts
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  
  // Other
  category: "games",
  classification: "Games",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#030014" },
    { media: "(prefers-color-scheme: dark)", color: "#030014" }
  ],
  colorScheme: "dark",
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        {/* PWA meta tags */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nexo" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        
        {/* Disable tap highlight on mobile */}
        <meta name="msapplication-TileColor" content="#030014" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <PWAProvider>
            {children}
          </PWAProvider>
        </Providers>
      </body>
    </html>
  );
}
