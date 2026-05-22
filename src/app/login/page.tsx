'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Fingerprint, Mail, Sparkles, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDemoAccess = () => {
    if (!nome) {
      toast.error('Por favor, diga-nos o seu nome.');
      return;
    }
    localStorage.setItem('psique_demo_mode', 'true');
    localStorage.setItem('psique_user_name', nome);
    toast.success(`Bem-vinda, ${nome}!`);
    router.push('/');
  };

  const handleBiometricLogin = async () => {
    if (!nome) {
      toast.error('Por favor, preencha seu nome antes.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      handleDemoAccess();
      setLoading(false);
    }, 1500);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    handleDemoAccess();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-start md:justify-center p-6 relative">
      
      {/* Header com Ícone Centralizado e Fixo */}
      <div className="fixed top-4 md:top-6 left-0 right-0 flex justify-center items-center z-50 pointer-events-none">
        <div className="w-16 h-16 md:w-28 md:h-28 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden border-2 border-gold/30 pointer-events-auto">
          <img src="/assets/brand/icon-512.png" alt="Icon" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Background Mandala Estática e Fixa */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[900px] md:h-[900px] opacity-[0.05] pointer-events-none z-0">
         <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="w-full max-w-[400px] space-y-10 text-center z-10">
        
        <div className="space-y-2 pt-12 md:pt-0">
          <h2 className="text-4xl md:text-5xl font-serif text-[#A08149] tracking-tight" style={{ fontFamily: 'var(--font-great-vibes)' }}>Psiquê Oráculo</h2>
          <p className="text-[#2C2420]/40 text-[10px] tracking-[0.4em] font-bold uppercase">Sintonize sua Essência</p>
        </div>

        {/* Área de Acesso Minimalista */}
        <div className="space-y-6">
          
          <div className="space-y-3">
             <input
                type="text"
                placeholder="SEU NOME"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-white border border-gold/10 focus:border-gold/30 outline-none transition-all text-xs font-bold tracking-widest text-center uppercase"
              />
          </div>

          {/* Botão Biometria */}
          <button
            onClick={handleBiometricLogin}
            disabled={loading}
            className="w-full py-5 bg-white border-2 border-gold/20 rounded-[32px] flex flex-col items-center justify-center gap-3 shadow-xl hover:border-gold/40 hover:scale-[1.02] active:scale-95 transition-all group disabled:opacity-50"
          >
            <div className={`p-3 rounded-full ${loading ? 'bg-gold/10' : 'bg-gold/5 group-hover:bg-gold/10'} transition-colors`}>
                <Fingerprint size={32} className={loading ? 'text-gold animate-pulse' : 'text-gold'} strokeWidth={1.5} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gold/60">Entrar com Digital</span>
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-gold/10" />
            <span className="text-[8px] font-bold text-gold/30 uppercase tracking-widest">ou por e-mail</span>
            <div className="h-[1px] flex-1 bg-gold/10" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/40">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="SEU E-MAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-gold/10 focus:border-gold/30 outline-none transition-all text-xs font-bold tracking-widest uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#008B8B] to-[#006666] text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={16} /> Abrir Portal
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <div className="pt-8">
            <p className="text-[9px] font-medium text-gold/20 tracking-[0.5em] uppercase">Luxo • Misticismo • Psicologia</p>
        </div>
      </div>
    </div>
  );
}
