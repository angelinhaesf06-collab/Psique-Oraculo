'use client';

import { Sparkles, Moon, Sun, Heart } from 'lucide-react';

const FairyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C11.5 2 11 2.5 11 3C11 3.5 11.5 4 12 4C12.5 4 13 3.5 13 3C13 2.5 12.5 2 12 2M10 5C8 5 6 7 6 9C6 11 8 13 10 13C12 13 14 11 14 9C14 7 12 5 10 5M4 10C2 10 1 12 1 14C1 16 3 17 5 17C7 17 8 16 8 14C8 12 7 10 5 10M16 10C14 10 13 12 13 14C13 16 14 17 16 17C18 17 20 16 20 14C20 12 19 10 17 10M10 14C9 14 8 15 8 16C8 18 10 21 10 21H11V16C11 15 10 14 10 14M13 16V21H14C14 21 16 18 16 16C16 15 15 14 14 14C13 14 13 15 13 16Z" />
    <circle cx="12" cy="3" r="1" fill="white" opacity="0.5" />
  </svg>
);

const MandalaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
    <path d="M12 6a6 6 0 0 1 6 6M6 12a6 6 0 0 1 6-6" />
  </svg>
);

export default function DecorationOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Mandala Colorida Rotativa Global */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] translate-y-12">
        <img src="/assets/brand/mandala-login.png" alt="" className="w-[100%] max-w-none animate-spin-slow-very" />
      </div>

      {/* Fadinhas - Delicadeza */}
      <div className="absolute top-[15%] right-[5%] text-gold/10 animate-pulse transition-all duration-[5000ms]">
        <div className="relative">
          <FairyIcon className="w-16 h-16" />
          <Sparkles className="absolute -top-2 -right-2 w-4 h-4" />
        </div>
      </div>
      <div className="absolute bottom-[20%] left-[8%] text-gold/10 opacity-60">
        <FairyIcon className="w-12 h-12" />
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
