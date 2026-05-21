'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Fingerprint, Mail, Sparkles, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDemoAccess = () => {
    localStorage.setItem('psique_demo_mode', 'true');
    toast.success('Acesso de teste ativado.');
    router.push('/');
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    // Simulação de chamada WebAuthn/Biometria para testes
    // Em produção, isso integraria com o provedor de Passkeys
    setTimeout(() => {
      handleDemoAccess();
      setLoading(false);
    }, 1500);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Lógica simplificada de login por e-mail para testes
    if (email) {
      handleDemoAccess();
    } else {
      toast.error('Insira um e-mail válido.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorativo Suave */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain scale-150" />
      </div>

      <div className="w-full max-w-[400px] space-y-12 text-center z-10">
        
        {/* Mandala Principal */}
        <div className="relative mx-auto w-40 h-40 md:w-48 md:h-48 animate-in fade-in zoom-in duration-1000">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#D4B982]/30 shadow-[0_20px_50px_rgba(212,185,130,0.2)] bg-white flex items-center justify-center p-2">
                <img 
                    src="/assets/brand/mandala-login.png" 
                    alt="Psiquê Oráculo" 
                    className="w-full h-full object-contain"
                />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-gold/10">
                <Sparkles size={20} className="text-gold" />
            </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-serif text-[#A08149] tracking-[0.3em] uppercase">Psiquê Oráculo</h2>
          <p className="text-[#2C2420]/40 text-xs tracking-widest font-bold">CONECTE SUA ESSÊNCIA AO CAMPO</p>
        </div>

        {/* Área de Acesso Minimalista */}
        <div className="space-y-6">
          
          {/* Botão Biometria em Destaque */}
          <button
            onClick={handleBiometricLogin}
            disabled={loading}
            className="w-full py-6 bg-white border-2 border-gold/20 rounded-[32px] flex flex-col items-center justify-center gap-3 shadow-xl hover:border-gold/40 hover:scale-[1.02] active:scale-95 transition-all group group-disabled:opacity-50"
          >
            <div className={`p-4 rounded-full ${loading ? 'bg-gold/10' : 'bg-gold/5 group-hover:bg-gold/10'} transition-colors`}>
                <Fingerprint size={40} className={loading ? 'text-gold animate-pulse' : 'text-gold'} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/60">Entrar com Digital</span>
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-gold/10" />
            <span className="text-[9px] font-bold text-gold/30 uppercase tracking-widest">ou e-mail</span>
            <div className="h-[1px] flex-1 bg-gold/10" />
          </div>

          {/* Login por E-mail Simples */}
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
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-gold/10 focus:border-gold/30 outline-none transition-all text-xs font-bold tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#008B8B] to-[#006666] text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-lg hover:shadow-turquesa/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={16} /> Prosseguir
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
