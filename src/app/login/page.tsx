'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Fingerprint, Mail, LogIn, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { NativeBiometric } from '@capgo/capacitor-native-biometric';

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
    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        toast.error('Biometria não disponível neste aparelho.');
        return;
      }

      setLoading(true);
      await NativeBiometric.verifyIdentity({
        reason: "Acesse seu Oráculo Particular",
        title: "Autenticação Biométrica",
        subtitle: "Sintonize sua identidade",
        description: "Use sua digital ou reconhecimento facial",
      });

      // Se não lançou erro, a identidade foi verificada
      // Obter credenciais salvas (email/senha simplificados ou token)
      const credentials = await NativeBiometric.getCredentials({
        server: "com.angela.psiqueoraculo",
      });

      if (credentials) {
        const { error } = await supabase.auth.signInWithPassword({
          email: credentials.username,
          password: credentials.password,
        });

        if (!error) {
          toast.success('Portal aberto via Biometria!');
          router.push('/');
          return;
        }
      }
      
      // Se não houver credenciais salvas mas a biometria deu OK, 
      // podemos tentar o modo demo se o nome estiver preenchido
      if (nome) {
        handleDemoAccess();
      } else {
        toast.info('Biometria ok. Por favor, entre com e-mail uma vez para vincular.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Falha na Biometria.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (email) {
        const password = 'psique-oraculo-guest';
        
        // 1. Garantir que o usuário exista e esteja confirmado via API Admin
        const quickRes = await fetch('/api/auth/quick-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, nome })
        });

        if (!quickRes.ok) {
          const quickErr = await quickRes.json();
          throw new Error(quickErr.error || "Falha na sintonização inicial.");
        }

        // 2. Agora faz o login normal, que sempre funcionará pois o usuário está confirmado
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        toast.success('Portal Aberto!');
        router.push('/');
      } else {
        // Login Anônimo
        const { error } = await supabase.auth.signInAnonymously({
          options: { data: { full_name: nome || "Consulente" } }
        });
        if (error) throw error;
        
        toast.success('Entrando como Convidado...');
        router.push('/');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(`Falha no Portal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#FDFBF7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Mandala Estática */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[900px] md:h-[900px] opacity-[0.06]">
           <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>

      <div className="w-full max-w-[320px] space-y-4 md:space-y-6 text-center z-10 flex flex-col items-center overflow-y-auto max-h-screen py-8">
        
        {/* Ícone Protagonista (Agora dentro do fluxo para não cortar o nome) */}
        <div className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-full flex items-center justify-center shadow-[0_15px_45px_rgba(0,0,0,0.15)] overflow-hidden border-2 border-gold/30 animate-in zoom-in duration-1000 shrink-0">
          <img src="/assets/brand/icon-512.png" alt="Icon" className="w-full h-full object-cover scale-110" />
        </div>

        <div className="space-y-1">
          <h2 className="text-5xl md:text-7xl font-serif text-[#A08149] leading-tight" style={{ fontFamily: 'var(--font-great-vibes)' }}>Psiquê Oráculo</h2>
          <p className="text-[#2C2420]/60 text-[10px] tracking-[0.4em] font-bold uppercase">Seu oráculo de bolso</p>
          <p className="text-[#2C2420]/20 text-[8px] tracking-[0.2em] font-medium uppercase mt-1">Sintonize sua Essência</p>
        </div>

        <div className="w-full space-y-4">
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
            <span className="text-[7px] font-bold text-gold/30 uppercase tracking-widest leading-none">Entrada</span>
            <div className="h-[1px] flex-1 bg-gold/10" />
          </div>

          <button
            onClick={() => { 
              const testName = nome || 'Consulente';
              const testEmail = email || 'visitante@psique.com';
              setNome(testName);
              setEmail(testEmail);
              
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleEmailLogin(fakeEvent);
            }}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#A08149] to-[#2C2420] text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>{loading ? 'Sintonizando...' : 'ACESSO TESTE ✨'}</span>
          </button>

          <div className="space-y-2">
            <p className="text-[7px] text-gold/40 uppercase tracking-widest">Ou use seu e-mail para salvar histórico</p>
            <div className="relative max-w-[200px] mx-auto">
              <input
                type="email"
                placeholder="SEU E-MAIL (OPCIONAL)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-transparent border-b border-gold/10 focus:border-gold/30 outline-none text-[9px] font-bold tracking-widest text-center uppercase"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
            <p className="text-[7px] font-medium text-gold/20 tracking-[0.4em] uppercase leading-none">Luxo • Misticismo • Psicologia</p>
        </div>
      </div>
    </div>
  );
}
