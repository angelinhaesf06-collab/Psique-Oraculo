'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import DecorationOverlay from '../DecorationOverlay';

export default function LoginPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
          options: {
            data: {
              full_name: nome || email.split('@')[0],
            }
          }
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
        const userFullName = nome || email.split('@')[0];
        toast.success('Alma registrada! Portal aberto.');
        await saveCredentials(userFullName);
        router.push('/');
        return;
      }

      // Se signIn teve sucesso:
      const userFullName = nome || signInData.user?.user_metadata?.full_name || email.split('@')[0];
      toast.success('Portal Aberto!');
      await saveCredentials(userFullName);
      router.push('/');
    } catch (error: any) {
      console.error("Erro Geral no Login:", error);
      toast.error(`Falha no Portal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async (userName: string) => {
      localStorage.setItem('psique_user_name', userName);
  };

  return (
    <div className="h-screen w-full bg-[#FDFBF7] flex flex-col items-center relative overflow-hidden">
      <DecorationOverlay />
      
      <div className="relative z-10 w-full max-w-[340px] h-full flex flex-col items-center justify-center px-6 pb-12 text-center pt-[calc(env(safe-area-inset-top)+20px)]">
        
        {/* Ícone Superior - Layout Unificado Web/App */}
        <div className="flex justify-center z-20 pointer-events-none mb-10">
          <div className="w-20 h-20 flex-none">
            <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow image-render-sharp" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full mb-12">
          <div className="flex flex-col gap-2 items-center">
            <h1 className="text-4xl md:text-5xl font-serif text-[#C4A484] leading-tight text-center drop-shadow-sm">
              Psiquê Oráculo
            </h1>
            <h2 className="text-[10px] md:text-xs font-sans font-bold tracking-[0.4em] text-[#8B735B] uppercase text-center">
              Seu Oráculo de Bolso
            </h2>
          </div>
        </div>

        <div className="w-full space-y-5">
          <form onSubmit={handleEmailLogin} className="space-y-5">
             <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4A484]" />
                <input
                  type="text"
                  placeholder="COMO DEVEMOS TE CHAMAR?"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full h-12 bg-[#FDFBF7]/40 backdrop-blur-md rounded-xl border border-[#E5D9C3] pl-10 pr-4 text-[10px] font-bold tracking-widest uppercase focus:border-[#C4A484] outline-none transition-colors text-[#5C4D3C] placeholder:text-[#8B735B]/50"
                />
             </div>
             <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4A484]" />
                <input
                  type="email"
                  placeholder="SEU E-MAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-[#FDFBF7]/40 backdrop-blur-md rounded-xl border border-[#E5D9C3] pl-10 pr-4 text-[10px] font-bold tracking-widest uppercase focus:border-[#C4A484] outline-none transition-colors text-[#5C4D3C] placeholder:text-[#8B735B]/50"
                />
             </div>
             <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4A484]" />
                <input
                  type="password"
                  placeholder="SUA SENHA"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full h-12 bg-[#FDFBF7]/40 backdrop-blur-md rounded-xl border border-[#E5D9C3] pl-10 pr-4 text-[10px] font-bold tracking-widest uppercase focus:border-[#C4A484] outline-none transition-colors text-[#5C4D3C] placeholder:text-[#8B735B]/50"
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

        <div className="mt-auto pb-4">
          <p className="text-[8px] font-bold text-[#C4A484]/40 tracking-[0.5em] uppercase">
            Luxo • Misticismo • Psicologia
          </p>
        </div>
      </div>
    </div>
  );
}
