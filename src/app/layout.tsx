import type { Metadata, Viewport } from "next";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import DecorationOverlay from "./DecorationOverlay";
import CapgoReady from "./CapgoReady";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
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
      <body className={`${montserrat.variable} ${cormorant.variable} antialiased font-sans text-foreground relative min-h-screen bg-[#FDFBF7] flex justify-center`}>
        <div className="w-full max-w-md relative flex flex-col min-h-screen overflow-hidden">
          <CapgoReady />
          <DecorationOverlay />
          <Toaster position="top-center" richColors />
          <div className="relative z-10 flex-1 flex flex-col overflow-hidden bg-transparent">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

