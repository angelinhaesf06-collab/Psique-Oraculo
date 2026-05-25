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
      console.log("Iniciando login para:", email);
      const password = 'psique-oraculo-guest';
      
      if (email) {
        // 1. Garantir que o usuário exista e esteja confirmado via API Admin
        const quickRes = await fetch('/api/auth/quick-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, nome: nome || "Consulente" })
        });

        if (!quickRes.ok) {
          const quickErr = await quickRes.json();
          console.error("Erro na API Quick Access:", quickErr);
          // Se a API falhar, tentamos o modo demo como último recurso para não travar o usuário
          if (email === 'visitante@psique.com' || email === 'teste@psique.com') {
            console.warn("API falhou, entrando em modo Demo.");
            handleDemoAccess();
            return;
          }
          throw new Error(quickErr.error || "Falha na sintonização inicial.");
        }

        // 2. Agora faz o login normal
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error("Erro no signInWithPassword:", signInError);
          // Fallback para modo demo se o login falhar no teste
          if (email === 'visitante@psique.com') {
            handleDemoAccess();
            return;
          }
          throw signInError;
        }

        toast.success('Portal Aberto!');
        router.push('/');
      } else {
        // Login Anônimo / Demo
        handleDemoAccess();
      }
    } catch (error: any) {
      console.error("Erro Geral no Login:", error);
      toast.error(`Falha no Portal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#FDFBF7] flex flex-col items-center relative overflow-hidden">
      
      {/* Mandala Centralizada de Fundo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
        <img src="/assets/brand/mandala-login.png" alt="" className="w-[150%] max-w-none animate-spin-slow" />
      </div>

      <div className="relative z-10 w-full max-w-[340px] flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        
        {/* Logo/Mandala Superior */}
        <div className="w-32 h-32 md:w-40 md:h-40 mb-8 animate-in zoom-in duration-1000">
          <img src="/assets/brand/mandala-login.png" alt="Mandala" className="w-full h-full object-contain animate-spin-slow" />
        </div>

        <div className="mb-10">
          <h1 className="text-5xl md:text-7xl font-serif text-[#C4A484] italic mb-2" style={{ fontFamily: 'var(--font-great-vibes)' }}>
            Psiquê Oráculo
          </h1>
          <h2 className="text-[10px] md:text-xs font-bold tracking-[0.4em] text-[#8B735B] uppercase mb-1">
            Seu oráculo de bolso
          </h2>
          <p className="text-[8px] font-medium tracking-[0.2em] text-[#C4A484]/60 uppercase">
            Sintonize sua Essência
          </p>
        </div>

        <div className="w-full space-y-4 mb-12">
          <input
            type="text"
            placeholder="SEU NOME"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full h-12 bg-white rounded-xl border border-[#E5D9C3] px-6 text-[10px] font-bold tracking-widest text-center uppercase focus:border-[#C4A484] outline-none transition-colors"
          />

          <button
            onClick={handleBiometricLogin}
            disabled={loading}
            className="w-full h-20 bg-white border-2 border-[#E5D9C3] rounded-[24px] flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <Fingerprint className="w-7 h-7 text-[#C4A484]" strokeWidth={1.5} />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8B735B]/60">Entrar com Digital</span>
          </button>

          <div className="flex items-center gap-4 py-2 opacity-30">
            <div className="h-[0.5px] flex-1 bg-[#8B735B]" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Entrada</span>
            <div className="h-[0.5px] flex-1 bg-[#8B735B]" />
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
            className="w-full h-20 bg-gradient-to-br from-[#4A3B28] via-[#2C2420] to-[#1A1614] text-white rounded-[28px] shadow-2xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <Sparkles className="w-6 h-6 text-[#C4A484] group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#C4A484]">Acesso Teste ✨</span>
          </button>

          <div className="pt-4 space-y-4">
             <p className="text-[8px] font-bold text-[#8B735B]/40 uppercase tracking-widest">Ou use seu e-mail para salvar histórico</p>
             <input
                type="email"
                placeholder="SEU E-MAIL (OPCIONAL)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-[#E5D9C3] pb-2 text-[9px] font-bold tracking-[0.2em] text-center uppercase focus:border-[#C4A484] outline-none"
              />
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-[8px] font-bold text-[#C4A484]/30 tracking-[0.5em] uppercase">
            Luxo • Misticismo • Psicologia
          </p>
        </div>
      </div>
    </div>
  );
}
