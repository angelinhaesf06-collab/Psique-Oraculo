'use client';

import { useState } from 'react';
import { ChevronLeft, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteAccount() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui simulamos o envio, ou você pode integrar com um serviço de e-mail/webhook futuramente.
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2420] p-6 md:p-12 font-sans">
      <div className="max-w-2xl mx-auto space-y-8 text-center">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] tracking-widest hover:opacity-70 transition-all mx-auto"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        <header className="space-y-2 border-b border-gold/10 pb-6">
          <div className="w-16 h-16 bg-ruby/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-ruby" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-gold">
            Excluir Conta
          </h1>

          <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">Psiquê Oráculo • Respeito à sua Jornada</p>
        </header>

        {!submitted ? (
          <div className="space-y-6 text-sm leading-relaxed opacity-80 text-left bg-white p-8 rounded-[32px] border border-gold/10 shadow-xl">
            <p>
              Entendemos que ciclos se encerram. Se você deseja excluir sua conta e todos os dados associados (e-mail, histórico de leituras e créditos) do <strong>Psiquê Oráculo</strong>, utilize o portal abaixo.
            </p>

            <div className="bg-ruby/5 p-4 rounded-2xl border border-ruby/10 space-y-2">
              <h2 className="font-bold text-ruby uppercase text-xs">Atenção: Ação Irreversível</h2>
              <p className="text-[11px]">Ao confirmar a exclusão, seu acesso será removido imediatamente e todos os seus registros de alma (consultas e bônus) serão apagados permanentemente de nossos servidores.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60">E-mail Cadastrado no App</label>
                <input 
                  type="email" 
                  required 
                  placeholder="exemplo@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#FDFBF7] border border-gold/10 focus:border-gold/30 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60">Motivo (Opcional)</label>
                <textarea 
                  placeholder="Conte-nos por que deseja sair..."
                  className="w-full px-4 py-3 rounded-xl bg-[#FDFBF7] border border-gold/10 focus:border-gold/30 outline-none h-24 resize-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-ruby text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Send size={14} /> Solicitar Exclusão Definitiva
              </button>
            </form>

            <p className="text-[10px] text-center opacity-40 italic">
              Sua solicitação será processada em até 48 horas úteis.
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-in zoom-in duration-500 bg-white p-12 rounded-[32px] border border-gold/10 shadow-xl">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#2C2420]">Solicitação Recebida</h2>
              <p className="text-sm opacity-60">Sua essência e dados serão removidos de nossos portais em breve. Agradecemos por ter compartilhado sua jornada conosco.</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="text-gold font-bold uppercase text-[10px] tracking-widest border border-gold/20 px-8 py-3 rounded-full hover:bg-gold/5"
            >
              Voltar ao Início
            </button>
          </div>
        )}

        <div className="pt-8 text-[10px] uppercase tracking-widest opacity-40">
          <p>© 2026 Psiquê Oráculo • psiqueoraculo.com.br</p>
        </div>
      </div>
    </div>
  );
}
