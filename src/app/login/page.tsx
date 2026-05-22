'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Fingerprint, Mail, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDemoAccess = () => {
    if (!nome) {
      toast.error('Diga-nos seu nome.');
      return;
    }
    localStorage.setItem('psique_demo_mode', 'true');
    localStorage.setItem('psique_user_name', nome);
    toast.success(`Bem-vinda!`);
    router.push('/');
  };

  const handleBiometricLogin = async () => {
    if (!nome) {
      toast.error('Preencha seu nome.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      handleDemoAccess();
      setLoading(false);
    }, 1200);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    handleDemoAccess();
  };

  return (
    <div className="h-[100dvh] w-full bg-[#FDFBF7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Mandala Estática */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[900px] md:h-[900px] opacity-[0.06]">
           <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Header com Ícone Perfeito */}
      <div className="fixed top-6 md:top-10 left-0 right-0 flex justify-center items-center z-50 pointer-events-none">
        <div className="w-24 h-24 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center shadow-[0_15px_50px_rgba(0,0,0,0.15)] overflow-hidden border-2 border-gold/20 pointer-events-auto">
          <img src="/assets/brand/icon-512.png" alt="Icon" className="w-full h-full object-cover scale-110" />
        </div>
      </div>

      <div className="w-full max-w-[320px] space-y-4 md:space-y-10 text-center z-10 pt-20 md:pt-32 flex flex-col items-center">
        
        <div className="space-y-1 pt-8 md:pt-20">
          <h2 className="text-4xl md:text-6xl font-serif text-[#A08149] leading-tight" style={{ fontFamily: 'var(--font-great-vibes)' }}>Psiquê Oráculo</h2>
          <p className="text-[#2C2420]/40 text-[10px] tracking-[0.4em] font-bold uppercase">Sintonize sua Essência</p>
        </div>

        <div className="w-full space-y-3 md:space-y-6">
           <input
              type="text"
              placeholder="SEU NOME"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-gold/10 focus:border-gold/30 outline-none text-[10px] font-bold tracking-widest text-center uppercase"
            />

          <button
            onClick={handleBiometricLogin}
            disabled={loading}
            className="w-full py-2.5 bg-white border-2 border-gold/20 rounded-[20px] flex flex-col items-center justify-center gap-1 shadow-lg hover:scale-[1.02] active:scale-95 transition-all group disabled:opacity-50"
          >
            <Fingerprint size={24} className={loading ? 'text-gold animate-pulse' : 'text-gold'} strokeWidth={1.5} />
            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-gold/60">Entrar com Digital</span>
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-[1px] flex-1 bg-gold/10" />
            <span className="text-[7px] font-bold text-gold/30 uppercase tracking-widest leading-none">ou e-mail</span>
            <div className="h-[1px] flex-1 bg-gold/10" />
          </div>

          <form onSubmit={handleEmailLogin} className="w-full space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30 w-4 h-4" />
              <input
                type="email"
                placeholder="SEU E-MAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gold/10 focus:border-gold/30 outline-none text-[10px] font-bold tracking-widest uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#008B8B] to-[#006666] text-white rounded-xl font-bold text-[9px] uppercase tracking-[0.3em] shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={14} /> Abrir Portal
            </button>
          </form>
        </div>

        <div className="pt-6">
            <p className="text-[7px] font-medium text-gold/20 tracking-[0.4em] uppercase leading-none">Luxo • Misticismo • Psicologia</p>
        </div>
      </div>
    </div>
  );
}
