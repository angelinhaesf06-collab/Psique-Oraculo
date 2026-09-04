'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Lock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import DecorationOverlay from '../DecorationOverlay';

export default function ResetPasswordPage() {
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [temSessao, setTemSessao] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Ao abrir o link do e-mail, o Supabase lê o token da URL e cria uma sessão
    // de recuperação (evento PASSWORD_RECOVERY). Ouvimos esse evento e também
    // conferimos a sessão diretamente, cobrindo os dois momentos.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setTemSessao(true);
        setVerificando(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setTemSessao(true);
        setVerificando(false);
      }
    });

    // Rede de segurança: se em alguns segundos o token não foi reconhecido,
    // paramos o "carregando" e mostramos o formulário mesmo assim.
    const timer = setTimeout(() => setVerificando(false), 3500);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha || senha.length < 6) {
      toast.error('A nova senha precisa ter ao menos 6 caracteres.');
      return;
    }
    if (senha !== confirma) {
      toast.error('As senhas não conferem. Digite a mesma nas duas.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      toast.success('Senha alterada com sucesso! Portal reaberto. ✨');
      router.push('/');
    } catch (error: any) {
      console.error('Erro ao trocar a senha:', error);
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('session') || msg.includes('missing') || msg.includes('expired')) {
        toast.error('Seu link de recuperação expirou. Volte ao login e peça um novo. 💫');
      } else {
        toast.error(`Não consegui alterar: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#FDFBF7] flex flex-col items-center relative overflow-hidden">
      <DecorationOverlay />

      <div className="relative z-10 w-full max-w-[340px] h-full flex flex-col items-center justify-center px-6 pb-12 text-center pt-[calc(env(safe-area-inset-top)+20px)]">

        <div className="flex justify-center z-20 pointer-events-none mb-10">
          <div className="w-20 h-20 flex-none">
            <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow image-render-sharp" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 w-full mb-10">
          <h1 className="text-3xl md:text-4xl font-serif text-[#C4A484] leading-tight text-center drop-shadow-sm">
            Nova Senha
          </h1>
          <h2 className="text-[10px] md:text-xs font-sans font-bold tracking-[0.3em] text-[#8B735B] uppercase text-center leading-relaxed">
            Defina uma nova senha para sua alma
          </h2>
        </div>

        {verificando ? (
          <div className="flex flex-col items-center gap-3 text-[#8B735B]">
            <Sparkles className="w-6 h-6 text-[#C4A484] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Sintonizando o portal...</span>
          </div>
        ) : (
          <div className="w-full space-y-5">
            {!temSessao && (
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8B735B]/70 leading-relaxed px-2">
                Se você chegou por engano, abra o link enviado ao seu e-mail. Se der erro ao salvar, peça um novo link na tela de login.
              </p>
            )}
            <form onSubmit={handleTrocarSenha} className="space-y-5">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4A484]" />
                <input
                  type="password"
                  placeholder="NOVA SENHA"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full h-12 bg-[#FDFBF7]/40 backdrop-blur-md rounded-xl border border-[#E5D9C3] pl-10 pr-4 text-[10px] font-bold tracking-widest uppercase focus:border-[#C4A484] outline-none transition-colors text-[#5C4D3C] placeholder:text-[#8B735B]/50"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4A484]" />
                <input
                  type="password"
                  placeholder="CONFIRME A NOVA SENHA"
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  className="w-full h-12 bg-[#FDFBF7]/40 backdrop-blur-md rounded-xl border border-[#E5D9C3] pl-10 pr-4 text-[10px] font-bold tracking-widest uppercase focus:border-[#C4A484] outline-none transition-colors text-[#5C4D3C] placeholder:text-[#8B735B]/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 mt-2 bg-gradient-to-br from-[#4A3B28] via-[#2C2420] to-[#1A1614] text-white rounded-[24px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-60"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                <Sparkles className="w-4 h-4 text-[#C4A484] group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C4A484]">Salvar Nova Senha</span>
              </button>
            </form>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#8B735B]/70 hover:text-[#C4A484] transition-colors underline underline-offset-4"
            >
              Voltar ao login
            </button>
          </div>
        )}

        <div className="mt-auto pb-4">
          <p className="text-[8px] font-bold text-[#C4A484]/40 tracking-[0.5em] uppercase">
            Luxo • Misticismo • Psicologia
          </p>
        </div>
      </div>
    </div>
  );
}
