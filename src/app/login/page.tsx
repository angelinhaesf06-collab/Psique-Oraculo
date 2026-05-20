'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Mail, Sparkles, Moon, Sun } from 'lucide-react';
import Image from 'next/image';

const ButterflyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12,16c0,0-1,2-3,2s-3-2-3-2s-1-4,3-4s3,4,3,4M12,16c0,0,1,2,3,2s3-2,3-2s1-4-3-4s-3,4-3,4 M12,8c0,0-1-2-3-2S6,8,6,8s-1,4,3,4s3-4,3-4M12,8c0,0,1-2,3-2s3,2,3,2s1,4-3,4s-3-4-3-4" />
  </svg>
);

const MandalaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
    else toast.success('Link de login enviado!');
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className="w-full max-w-md space-y-12 text-center z-10">
        
        {/* Ícone Central */}
        <div className="relative mx-auto w-44 h-44 flex items-center justify-center">
          <div className="absolute inset-0 bg-gold/5 rounded-full blur-3xl animate-pulse" />
          <div className="relative w-full h-full rounded-full border-2 border-gold/20 overflow-hidden shadow-2xl bg-white flex items-center justify-center">
            <img 
              src="/assets/brand/icon-512.png" 
              alt="Psiquê Oráculo Logo" 
              className="w-[85%] h-[85%] object-contain" 
            />
          </div>
        </div>

        {/* Título e Subtítulo */}
        <div className="space-y-4">
          <h1 className="text-7xl md:text-8xl font-serif text-gold tracking-tighter leading-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>
            Psique
          </h1>
          <p className="text-xl md:text-2xl text-foreground/40 font-light tracking-[0.1em]">
            Seu oráculo de bolso.
          </p>
        </div>

        {/* Formulário de Login */}
        <div className="space-y-6 pt-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 group-focus-within:text-gold transition-colors" size={20} />
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/50 border border-gold/10 focus:border-gold/30 outline-none transition-all text-foreground placeholder:text-foreground/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gold text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-lg shadow-gold/10 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Entrar com E-mail'}
            </button>
          </form>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-gold/5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gold/30">Ou</span>
            <div className="h-px flex-1 bg-gold/5" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white/40 border border-gold/10 text-foreground/60 rounded-2xl font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/60 transition-all"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 opacity-50 grayscale" />
            Continuar com Google
          </button>

          <div className="pt-6">
            <button
              onClick={() => {
                localStorage.setItem('psique_demo_mode', 'true');
                window.location.href = '/';
              }}
              className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/30 hover:text-gold transition-all"
            >
              Acesso Rápido
            </button>
          </div>
        </div>

        <p className="pt-12 text-[10px] font-medium uppercase tracking-[0.3em] text-gold/20">
          Autoconhecimento & Terapia <Sparkles size={10} className="inline ml-1" />
        </p>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        .font-script {
          font-family: 'Great Vibes', cursive;
        }
      `}</style>
    </div>
  );
}
