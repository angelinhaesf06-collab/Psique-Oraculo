'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsOfUse() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2420] p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gold font-bold uppercase text-[10px] tracking-widest hover:opacity-70 transition-all"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        <header className="space-y-2 border-b border-gold/10 pb-6">
          <h1 className="text-4xl md:text-6xl font-serif text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
            Termos de Uso
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">Psiquê Oráculo • Diretrizes da Alma</p>
        </header>

        <section className="space-y-6 text-sm leading-relaxed opacity-80">
          <p>
            Ao utilizar o <strong>Psiquê Oráculo</strong>, você concorda com os seguintes termos e condições:
          </p>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gold uppercase tracking-widest">1. Propósito do Aplicativo</h2>
            <p>
              O Psiquê Oráculo é uma ferramenta de autoconhecimento, apoio terapêutico e entretenimento místico. As orientações arquetípicas geradas pela Inteligência Artificial não substituem aconselhamento médico, psicológico, jurídico ou financeiro profissional.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gold uppercase tracking-widest">2. Uso Responsável</h2>
            <p>
              Você deve utilizar o aplicativo de forma ética e responsável. Não é permitido utilizar a ferramenta para promover ódio, violência ou qualquer atividade ilegal.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gold uppercase tracking-widest">3. Assinaturas e Créditos</h2>
            <p>
              O plano gratuito oferece 3 créditos iniciais. O plano Premium anual desbloqueia 5 leituras diárias e recursos adicionais. Cancelamentos de assinaturas seguem as regras da loja de aplicativos (Google Play Store).
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gold uppercase tracking-widest">4. Limitação de Responsabilidade</h2>
            <p>
              O Psiquê Oráculo não se responsabiliza pelas decisões tomadas pelo usuário com base nas leituras realizadas. O livre-arbítrio é o pilar central de toda jornada espiritual.
            </p>
          </div>

          <div className="space-y-4 pt-8 border-t border-gold/10 text-[10px] uppercase tracking-widest text-center">
            <p>Última atualização: Maio de 2026</p>
            <p>Psiquê Oráculo - Sintonize sua Essência</p>
          </div>
        </section>
      </div>
    </div>
  );
}
