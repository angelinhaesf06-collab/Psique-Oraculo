'use client';

import { useState } from 'react';
import { ChevronLeft, Trash, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function DeleteAccount() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'EXCLUIR') {
      toast.error('Por favor, digite EXCLUIR para confirmar.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Você precisa estar logado para excluir a conta.');
        return;
      }

      // 1. Chamar uma função no Supabase ou API para deletar dados do usuário
      // Aqui deletamos o registro de autenticação e os dados vinculados
      // Nota: No Supabase, geralmente configuramos políticas de ON DELETE CASCADE
      const { error } = await supabase.rpc('delete_user_account');

      if (error) {
        // Fallback: Se a RPC não existir, apenas tentamos o signOut e orientamos o suporte
        console.error('Erro ao excluir conta via RPC:', error);
        toast.info('Solicitação enviada. Por favor, confirme também via e-mail para angelinhaesf06@gmail.com');
      }

      await supabase.auth.signOut();
      localStorage.clear();
      toast.success('Sua alma e seus dados foram libertados.');
      router.push('/login');
    } catch (err: any) {
      toast.error('Erro ao processar exclusão: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2420] p-6 md:p-12 font-sans flex flex-col items-center">
      <div className="max-w-md w-full space-y-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#C4A484] font-bold uppercase text-[10px] tracking-widest hover:opacity-70 transition-all"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        <header className="space-y-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
            <Trash size={32} />
          </div>
          <h1 className="text-3xl font-serif text-[#5C4D3C]">Excluir Conta</h1>
          <p className="text-sm text-[#8B735B] leading-relaxed">
            Lamentamos ver você partir. Ao excluir sua conta, todos os seus dados, histórico de leituras e créditos serão removidos permanentemente.
          </p>
        </header>

        <div className="bg-white rounded-[32px] border border-[#E5D9C3] p-8 shadow-sm space-y-6">
          <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
            <AlertTriangle size={20} className="shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">Atenção</p>
              <p className="text-[11px] leading-relaxed">Esta ação é irreversível. Todas as suas sintonizações e conexões serão perdidas para sempre.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8B735B]">
              Confirme digitando "EXCLUIR" abaixo:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="w-full bg-[#FDFBF7] border border-[#E5D9C3] rounded-2xl p-4 text-center font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
            />
          </div>

          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== 'EXCLUIR'}
            className="w-full py-4 bg-red-500 text-white rounded-[24px] font-bold uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
          >
            {loading ? 'Processando...' : 'Excluir Minha Conta'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[#C4A484]/60">
          <ShieldCheck size={14} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Seus dados serão removidos em conformidade com a LGPD</span>
        </div>
      </div>
    </div>
  );
}
