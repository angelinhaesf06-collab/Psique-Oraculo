import type { Metadata, Viewport } from "next";
import { Montserrat, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import DecorationOverlay from "./DecorationOverlay";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} ${greatVibes.variable} antialiased font-sans text-foreground relative min-h-[100dvh] overflow-x-hidden`}>
        <DecorationOverlay />
        <Toaster position="top-center" richColors />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}

