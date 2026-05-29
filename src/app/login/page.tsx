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
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pisiqueoraculo.com.br';
      console.log("Iniciando login para:", email, "em", baseUrl);
      const password = 'psique-oraculo-guest';
      
      if (email) {
        // 1. Garantir que o usuário exista e esteja confirmado via API Admin
        const apiUrl = `${baseUrl}/api/auth/quick-access`;
        
        console.log("Chamando Portal em:", apiUrl);

        const quickRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, nome: nome || "Consulente" })
        }).catch(err => {
          console.error("Erro de rede no fetch do Login:", err);
          throw new Error("Erro de conexão com o servidor. Verifique sua internet.");
        });

        if (!quickRes.ok) {
          const quickText = await quickRes.text();
          console.error("Erro na API Quick Access (Texto):", quickText);
          
          let errorMsg = "Falha na sintonização inicial.";
          try {
            const quickErr = JSON.parse(quickText);
            errorMsg = quickErr.error || errorMsg;
          } catch (e) {
            console.error("Resposta não é JSON válida:", quickText);
          }
          
          console.error("Erro na API Quick Access:", errorMsg);
          // Se a API falhar, tentamos o modo demo como último recurso para não travar o usuário
          if (email === 'visitante@psique.com' || email === 'teste@psique.com') {
            console.warn("API falhou, entrando em modo Demo.");
            handleDemoAccess();
            return;
          }
          throw new Error(errorMsg);
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
      const detail = error.message || "Erro desconhecido";
      toast.error(`Falha no Portal: ${detail}`);
      // Alerta extra para APK depuração
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNative) {
        alert("Erro de Conexão: " + detail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#FDFBF7] flex flex-col items-center relative overflow-hidden">
      
      <div className="relative z-10 w-full max-w-[340px] h-full flex flex-col items-center justify-between px-6 py-10 text-center">
        
        {/* Logo/Mandala Superior */}
        <div className="w-24 h-24 md:w-32 md:h-32 animate-in zoom-in duration-1000">
          <img src="/assets/brand/mandala-login.png" alt="Mandala" className="w-full h-full object-contain animate-spin-slow" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-6xl font-serif text-[#C4A484] leading-tight">
            Psiquê Oráculo
          </h1>
          <div className="space-y-1">
            <h2 className="text-[10px] md:text-xs font-sans font-bold tracking-[0.4em] text-[#8B735B] uppercase">
              Seu oráculo de bolso
            </h2>
            <p className="text-[8px] font-sans font-medium tracking-[0.2em] text-[#C4A484]/60 uppercase">
              Sintonize sua Essência
            </p>
          </div>
        </div>

        <div className="w-full space-y-4">
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
            className="w-full h-16 bg-white border-2 border-[#E5D9C3] rounded-[24px] flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <Fingerprint className="w-6 h-6 text-[#C4A484]" strokeWidth={1.5} />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8B735B]/60">Entrar com Digital</span>
          </button>

          <div className="flex items-center gap-4 py-1 opacity-30">
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
            className="w-full h-16 bg-gradient-to-br from-[#4A3B28] via-[#2C2420] to-[#1A1614] text-white rounded-[28px] shadow-2xl active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <Sparkles className="w-5 h-5 text-[#C4A484] group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C4A484]">Acesso Teste ✨</span>
          </button>

          <div className="pt-2">
             <input
                type="email"
                placeholder="SEU E-MAIL (OPCIONAL)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-[#E5D9C3] pb-2 text-[9px] font-bold tracking-[0.2em] text-center uppercase focus:border-[#C4A484] outline-none"
              />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[8px] font-bold text-[#C4A484]/30 tracking-[0.5em] uppercase">
            Luxo • Misticismo • Psicologia
          </p>
        </div>
      </div>
    </div>
  );
}
