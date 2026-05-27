'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl md:text-6xl font-serif text-gold">
            Privacidade da Alma
          </h1>

          <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40">Psiquê Oráculo • Proteção e Luz</p>
        </header>

        <section className="space-y-6 text-sm leading-relaxed opacity-80">
          <p>
            A sua privacidade é sagrada para nós. Esta Política de Privacidade descreve como o <strong>Psiquê Oráculo</strong> coleta, usa e protege suas informações ao utilizar nosso aplicativo.
          </p>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gold uppercase tracking-widest">1. Coleta de Dados</h2>
            <p>
              Coletamos apenas as informações necessárias para proporcionar uma experiência mística e personalizada:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>E-mail:</strong> Utilizado exclusivamente para autenticação via Supabase e garantir o acesso aos seus créditos e histórico.</li>
              <li><strong>Nome:</strong> Usado para personalizar as leituras da Inteligência Artificial.</li>
              <li><strong>Conteúdo de Consulta:</strong> Suas perguntas, áudios e fotos são processados pela Inteligência Artificial do Google Gemini para gerar sua leitura e são armazenados de forma privada em seu histórico.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gold uppercase tracking-widest">2. Uso das Informações</h2>
            <p>
              Suas informações são utilizadas para:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Gerar interpretações personalizadas e íntimas.</li>
              <li>Manter seu histórico de consultas para consultas futuras.</li>
              <li>Gerenciar seu limite de créditos e assinaturas.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gold uppercase tracking-widest">3. Segurança dos Dados</h2>
            <p>
              Utilizamos a infraestrutura do <strong>Supabase</strong> e <strong>Google Cloud</strong> para garantir que seus dados estejam criptografados e protegidos contra acessos não autorizados. Não vendemos ou compartilhamos seus dados com terceiros para fins publicitários.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gold uppercase tracking-widest">4. Direitos do Usuário</h2>
            <p>
              Você tem o direito de, a qualquer momento, solicitar a exclusão de sua conta e de todos os dados associados através do e-mail de suporte: <strong>angelinhaesf06@gmail.com</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gold uppercase tracking-widest">5. Contato e Transparência</h2>
            <p>
              Esta política é mantida por <strong>psiqueoraculo.com.br</strong>. Para qualquer dúvida sobre a privacidade de sua alma e seus dados, entre em contato:
            </p>
            <p className="font-bold text-gold">angelinhaesf06@gmail.com</p>
          </div>

          <div className="space-y-4 pt-8 border-t border-gold/10 text-[10px] uppercase tracking-widest text-center">
            <p>Última atualização: 22 de Maio de 2026</p>
            <p>© 2026 Psiquê Oráculo • psiqueoraculo.com.br</p>
          </div>
        </section>
      </div>
    </div>
  );
}
