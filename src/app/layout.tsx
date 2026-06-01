import type { Metadata, Viewport } from "next";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import DecorationOverlay from "./DecorationOverlay";

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
      <body className={`${montserrat.variable} ${cormorant.variable} antialiased font-sans text-foreground relative min-h-[100dvh] bg-[#FDFBF7] flex justify-center`}>
        <div className="w-full max-w-md min-h-[100dvh] relative flex flex-col bg-transparent shadow-[0_0_100px_rgba(0,0,0,0.05)]">
          <DecorationOverlay />
          <Toaster position="top-center" richColors />
          <div className="relative z-10 flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

