'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Fingerprint, Mail, LogIn, Loader2 } from 'lucide-react';
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
    if (!email) {
      handleDemoAccess();
      return;
    }

    setLoading(true);
    try {
      // Nota: Para biometria funcionar com Supabase, geralmente precisamos de senha.
      // Aqui usaremos Magic Link como solicitado originalmente, mas avisaremos sobre vínculo.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      toast.success('Portal solicitado! Verifique seu e-mail.');
      
      // Salvar flag para sugerir biometria no próximo acesso
      localStorage.setItem('psique_pending_biometric', 'true');
      localStorage.setItem('psique_user_email', email);

    } catch (error: any) {
      toast.error(`Falha: ${error.message}`);
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

      {/* Header com Ícone Protagonista */}
      <div className="fixed top-8 md:top-12 left-0 right-0 flex justify-center items-center z-50 pointer-events-none">
        <div className="w-32 h-32 md:w-56 md:h-56 bg-white rounded-full flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden border-2 border-gold/30 pointer-events-auto animate-in zoom-in duration-1000">
          <img src="/assets/brand/icon-512.png" alt="Icon" className="w-full h-full object-cover scale-110" />
        </div>
      </div>

      <div className="w-full max-w-[320px] space-y-4 md:space-y-10 text-center z-10 pt-24 md:pt-40 flex flex-col items-center">
        
        <div className="space-y-1 pt-12 md:pt-24">
          <h2 className="text-5xl md:text-8xl font-serif text-[#A08149] leading-tight" style={{ fontFamily: 'var(--font-great-vibes)' }}>Psiquê Oráculo</h2>
          <p className="text-[#2C2420]/60 text-[10px] tracking-[0.4em] font-bold uppercase">Seu oráculo de bolso</p>
          <p className="text-[#2C2420]/20 text-[8px] tracking-[0.2em] font-medium uppercase mt-1">Sintonize sua Essência</p>
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
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#008B8B] to-[#006666] text-white rounded-xl font-bold text-[9px] uppercase tracking-[0.3em] shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />} 
              {loading ? 'Sintonizando...' : 'Abrir Portal'}
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
