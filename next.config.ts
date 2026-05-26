import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removido 'output: export' para que as APIs funcionem no Vercel.
  // Para gerar o build do Capacitor, use: NEXT_PUBLIC_EXPORT=true npm run build
  output: process.env.NEXT_PUBLIC_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
