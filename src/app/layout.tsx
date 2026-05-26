import type { Metadata, Viewport } from "next";
import { Montserrat, Cinzel, Lora } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import DecorationOverlay from "./DecorationOverlay";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "Psiquê Oráculo",
  description: "Aconselhamento terapêutico e autoconhecimento.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Psiquê Oráculo",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FDFBF7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Permite zoom mas mantém o padrão nítido
  viewportFit: "cover", // Essencial para apps em tela cheia (APK)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} ${cinzel.variable} ${lora.variable} antialiased font-sans text-foreground relative min-h-[100dvh] overflow-x-hidden`}>
        <DecorationOverlay />
        <Toaster position="top-center" richColors />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}

