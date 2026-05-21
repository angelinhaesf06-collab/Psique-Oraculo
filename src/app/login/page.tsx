'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Eye, Mail, Sparkles, Moon, Sun, Key } from 'lucide-react';

const FeatherIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="15" />
  </svg>
);

const KeyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM12 7l.343-.343a4 4 0 1 1 5.657 5.657L17 13.343M11 10.343l2 2m-3-1l2 2" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) toast.error(error.message);
    else window.location.href = '/';
    setLoading(false);
  };

  const handleDemoAccess = () => {
    localStorage.setItem('psique_demo_mode', 'true');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#F5F2EA] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      <div className="w-full max-w-[440px] space-y-6 md:space-y-8 text-center z-10">
        
        {/* Mandala como Ícone Superior - Cores Vivas e Vibrantes */}
        <div className="relative mx-auto w-32 h-32 md:w-56 md:h-56 mb-2 md:mb-4 animate-in fade-in zoom-in duration-1000">
            <div className="w-full h-full rounded-full overflow-hidden border-2 md:border-4 border-[#D4B982]/40 shadow-[0_20px_50px_rgba(212,185,130,0.3)] bg-white flex items-center justify-center">
                <img
                    src="/assets/brand/mandala-login.png"
                    alt="Psiquê Mandala"
                    className="w-full h-full object-cover"
                />            </div>
        </div>

        {/* Link Rápido de Teste */}
        <div className="pb-2 md:pb-4">
            <button 
                onClick={handleDemoAccess}
                className="px-6 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-gold hover:text-white transition-all shadow-sm"
            >
                Link Rápido (Entrar agora)
            </button>
        </div>

        {/* Inputs Ornamentados */}
        <div className="space-y-4 pt-2 md:pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Campo E-mail */}
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#2C2420] opacity-80">
                <FeatherIcon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <input
                type="email"
                placeholder="SEU E-MAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-14 md:pl-16 pr-6 py-4 md:py-5 rounded-2xl bg-white border-2 border-[#D4B982]/40 focus:border-[#D4B982] outline-none transition-all text-[#2C2420] text-base md:text-lg font-medium tracking-widest placeholder:text-[#2C2420]/30 shadow-sm"
              />
            </div>

            {/* Campo Senha */}
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#2C2420] opacity-80">
                <KeyIcon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="SUA SENHA"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-14 md:pl-16 pr-12 md:pr-14 py-4 md:py-5 rounded-2xl bg-white border-2 border-[#D4B982]/40 focus:border-[#D4B982] outline-none transition-all text-[#2C2420] text-base md:text-lg font-medium tracking-widest placeholder:text-[#2C2420]/30 shadow-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-[#2C2420]/40 hover:text-[#2C2420] transition-colors"
              >
                <Eye size={20} />
              </button>
            </div>

            {/* Link Esqueceu Senha */}
            <div className="flex justify-end pr-2">
               <button type="button" className="text-[#A08149] text-xs md:text-sm font-medium underline underline-offset-4 decoration-[#A08149]/30 hover:decoration-[#A08149]">
                  Esqueceu sua senha?
               </button>
            </div>

            {/* Botão Entrar */}
            <div className="pt-4 md:pt-6">
                <button
                type="submit"
                disabled={loading}
                className="w-full py-4 md:py-5 bg-gradient-to-r from-[#008B8B] to-[#006666] text-white rounded-[24px] md:rounded-[32px] font-bold text-base md:text-lg uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-[0_10px_25px_rgba(0,102,102,0.3)] hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50"
                >
                {loading ? 'Entrando...' : 'ENTRAR NO ORÁCULO'}
                </button>
            </div>
          </form>

          {/* Social Login Section */}
          <div className="pt-6 md:pt-10 space-y-4 md:space-y-6">
            <div className="flex items-center gap-4 justify-center">
              <div className="h-[1px] w-8 md:w-12 bg-[#A08149]/20" />
              <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-[#A08149]/60">ou conecte-se com</span>
              <div className="h-[1px] w-8 md:w-12 bg-[#A08149]/20" />
            </div>

            <div className="flex items-center justify-center gap-6 md:gap-10">
                <button className="text-[#A08149]/60 hover:text-[#A08149] transition-all">
                    <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.224 1.224-3.136 2.52-6.528 2.52-5.32 0-9.624-4.304-9.624-9.624s4.304-9.624 9.624-9.624c2.88 0 5.032 1.136 6.592 2.616l2.32-2.32C18.664 1.256 15.8 0 12.48 0 6.312 0 1.296 5.016 1.296 11.184s5.016 11.184 11.184 11.184c3.392 0 5.968-1.12 7.968-3.2 2.072-2.072 2.728-4.968 2.728-7.312 0-.704-.064-1.376-.184-1.936l-10.512.016z"/></svg>
                </button>
                <button className="text-[#A08149]/60 hover:text-[#A08149] transition-all">
                    <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-2.415-2.828 0-1.927 1.572-3.123 3.018-3.123 1.056 0 2.214.654 2.214 1.884 0 1.23-.96 2.153-2.14 2.153-.346 0-.67-.09-.96-.237l-.022.016c.365.807 1.096 1.488 2.305 1.488 1.99 0 3.255-1.63 3.255-3.64 0-2.03-1.64-3.522-3.87-3.522-2.525 0-4.437 1.846-4.437 4.295 0 2.235 1.594 4.17 3.524 4.17.653 0 1.24-.19 1.7-.514l-.004-.002a4.4 4.4 0 0 1-2.168.652z"/></svg>
                </button>
                <button className="text-[#A08149]/60 hover:text-[#A08149] transition-all">
                    <Sun className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
                </button>
            </div>
          </div>
        </div>

        {/* Logo Rodapé */}
        <div className="pt-10 md:pt-16 pb-6 md:pb-8">
            <h2 className="text-2xl md:text-3xl font-serif text-[#A08149] tracking-[0.3em] md:tracking-[0.4em] opacity-80" style={{ fontFamily: 'serif' }}>
              PSIQUEORÁCULO
            </h2>
        </div>

        {/* Botão de Demo (Apenas para desenvolvimento/teste) */}
        <div className="pt-4">
            <button 
                onClick={handleDemoAccess}
                className="text-[9px] font-black uppercase tracking-[0.5em] text-[#A08149]/20 hover:text-[#A08149]/40 transition-all"
            >
                Acesso de Visitante
            </button>
        </div>
      </div>
    </div>
  );
}
