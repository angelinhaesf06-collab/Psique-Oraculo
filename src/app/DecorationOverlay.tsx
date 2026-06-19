'use client';

import { Sparkles, Moon, Sun, Heart } from 'lucide-react';

export default function DecorationOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Mandala de fundo - marca d'água sutil */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.12]">
        <div className="w-[85vw] max-w-[400px] aspect-square flex items-center justify-center">
          <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow image-render-sharp" />
        </div>
      </div>

      {/* Astros - Sol e Lua */}
      <div className="absolute top-[10%] left-[15%] text-gold/5">
        <Sun className="w-12 h-12" strokeWidth={0.5} />
      </div>
      <div className="absolute bottom-[15%] right-[20%] text-gold/5">
        <Moon className="w-10 h-10" strokeWidth={0.5} />
      </div>

      {/* Corações Sutis */}
      <div className="absolute top-1/2 left-[5%] text-gold/10 opacity-40">
        <Heart className="w-4 h-4" fill="currentColor" />
      </div>
      <div className="absolute top-1/3 right-[10%] text-gold/10 opacity-30">
        <Heart className="w-6 h-6" fill="currentColor" />
      </div>

      {/* Brilhos Espalhados */}
      <div className="absolute top-1/4 left-1/4 text-gold/20"><Sparkles size={12} /></div>
      <div className="absolute bottom-1/4 right-1/4 text-gold/20"><Sparkles size={14} /></div>
      <div className="absolute top-2/3 left-1/2 text-gold/10"><Sparkles size={10} /></div>
    </div>
  );
}
