'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Fingerprint, Mail, Lock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import DecorationOverlay from '../DecorationOverlay';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBiometricLogin = async () => {
    try {
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      if (!isNative) {
        toast.error('Biometria disponível apenas no aplicativo.');
        return;
      }

      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        toast.error('Biometria não configurada neste aparelho.');
        return;
      }

      setLoading(true);
      await NativeBiometric.verifyIdentity({
        reason: "Acesse seu Oráculo Particular",
        title: "Autenticação Biométrica",
        subtitle: "Sintonize sua identidade",
        description: "Use sua digital ou reconhecimento facial",
      });

      // Se passou da biometria, busca credenciais salvas no dispositivo
      const credentials = await NativeBiometric.getCredentials({
        server: "com.angela.psiqueoraculo",
      });

      if (credentials && credentials.username && credentials.password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: credentials.username,
          password: credentials.password,
        });

        if (!error) {
          toast.success('Portal aberto via Biometria!');
          router.push('/');
        } else {
          toast.error('Suas credenciais biométricas expiraram. Faça login manual.');
        }
      } else {
        toast.info('Nenhuma conta vinculada. Faça login com e-mail e senha uma vez para salvar a digital.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Acesso biométrico cancelado ou falhou.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error('Preencha e-mail e senha para sintonizar.');
      return;
    }
    
    setLoading(true);
    try {
      // Tenta login primeiro
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (signInError) {
        // Se falhar o login, tenta criar a conta silenciosamente
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: senha,
        });
        
        if (signUpError) {
           // Se a criação falhar porque o e-mail já existe, a senha do login estava incorreta.
           if (signUpError.message.includes('already registered')) {
              throw new Error('Senha incorreta para esta alma.');
           }
           // Outros erros de criação (senha fraca, email inválido)
           throw signUpError;
        }

        // Se signUp teve sucesso:
        toast.success('Alma registrada! Portal aberto.');
        await saveCredentials(email, senha);
        router.push('/');
        return;
      }

      // Se signIn teve sucesso:
      toast.success('Portal Aberto!');
      await saveCredentials(email, senha);
      router.push('/');
    } catch (error: any) {
      console.error("Erro Geral no Login:", error);
      toast.error(`Falha no Portal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async (userEmail: string, userPass: string) => {
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      if (isNative) {
         try {
           const result = await NativeBiometric.isAvailable();
           if (result.isAvailable) {
              await NativeBiometric.setCredentials({
                username: userEmail,
                password: userPass,
                server: "com.angela.psiqueoraculo",
              });
           }
         } catch (e) {
           console.log("Não foi possível salvar biometria silenciosamente.", e);
         }
      }
      localStorage.setItem('psique_user_name', userEmail.split('@')[0]);
  };

  return (
    <div className="h-[100dvh] w-full bg-transparent flex flex-col items-center relative overflow-hidden">
      <DecorationOverlay />
      
      <div className="relative z-10 w-full max-w-[340px] h-full flex flex-col items-center justify-between px-6 py-8 text-center">
        
        <div className="flex flex-col items-center gap-6 w-full pt-4">
          {/* Logo/Mandala Superior */}
          <div className="w-24 h-24 md:w-32 md:h-32 animate-in zoom-in duration-1000 p-2 shrink-0">
            <img src="/assets/brand/mandala-login.png" alt="Mandala" className="w-full h-full object-contain animate-spin-slow image-render-sharp" />
          </div>

          <div className="flex flex-col gap-1 drop-shadow-md">
            <h1 className="text-4xl md:text-5xl font-serif text-[#C4A484] leading-tight">
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
        </div>

        <div className="w-full space-y-4 pb-4">
          <button
            onClick={handleBiometricLogin}
            disabled={loading}
            className="w-full h-16 bg-white border-2 border-[#E5D9C3] rounded-[24px] flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <Fingerprint className="w-6 h-6 text-[#C4A484]" strokeWidth={1.5} />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#8B735B]">Entrar com Digital</span>
          </button>

          <div className="flex items-center gap-4 py-1 opacity-30">
            <div className="h-[0.5px] flex-1 bg-[#8B735B]" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#5C4D3C]">Ou use Email</span>
            <div className="h-[0.5px] flex-1 bg-[#8B735B]" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3">
             <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4A484]" />
                <input
                  type="email"
                  placeholder="SEU E-MAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-[#FDFBF7]/90 backdrop-blur-md rounded-xl border border-[#E5D9C3] pl-10 pr-4 text-[10px] font-bold tracking-widest uppercase focus:border-[#C4A484] outline-none transition-colors text-[#5C4D3C] placeholder:text-[#8B735B]/50"
                />
             </div>
             <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4A484]" />
                <input
                  type="password"
                  placeholder="SUA SENHA"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full h-12 bg-[#FDFBF7]/90 backdrop-blur-md rounded-xl border border-[#E5D9C3] pl-10 pr-4 text-[10px] font-bold tracking-widest uppercase focus:border-[#C4A484] outline-none transition-colors text-[#5C4D3C] placeholder:text-[#8B735B]/50"
                />
             </div>
             
             <button
                type="submit"
                disabled={loading}
                className="w-full h-14 mt-2 bg-gradient-to-br from-[#4A3B28] via-[#2C2420] to-[#1A1614] text-white rounded-[24px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                <Sparkles className="w-4 h-4 text-[#C4A484] group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C4A484]">Sintonizar</span>
             </button>
          </form>
        </div>

        <div className="mt-4">
          <p className="text-[8px] font-bold text-[#C4A484]/40 tracking-[0.5em] uppercase">
            Luxo • Misticismo • Psicologia
          </p>
        </div>
      </div>
    </div>
  );
}
