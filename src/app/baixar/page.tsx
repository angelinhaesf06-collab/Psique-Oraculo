import type { Metadata } from "next";

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.psiqueoraculo";

export const metadata: Metadata = {
  title: "Psiquê Oráculo — Tarô, Baralho Cigano e Anjos no seu celular",
  description:
    "Faça leituras de Tarô, Baralho Cigano e Tarô dos Anjos com acolhimento e clareza. Pergunte por voz ou texto. Comece com leituras grátis. Baixe agora.",
  openGraph: {
    title: "Psiquê Oráculo — Seu oráculo de bolso",
    description:
      "Tarô, Baralho Cigano e Tarô dos Anjos com acolhimento e clareza. Comece grátis.",
    images: ["/assets/brand/feature-graphic.png"],
    type: "website",
  },
};

function CTA({ label = "Baixar grátis na Google Play" }: { label?: string }) {
  return (
    <a
      href={PLAY_URL}
      className="inline-flex items-center justify-center gap-3 px-8 py-5 rounded-full bg-gradient-to-br from-[#4A3B28] to-[#1A1614] text-white text-[13px] font-black uppercase tracking-[0.25em] shadow-2xl active:scale-95 transition-all"
    >
      {label}
    </a>
  );
}

export default function BaixarPage() {
  const oraculos = [
    { nome: "Tarô Clássico", desc: "A jornada épica da alma — amor, trabalho, dinheiro e saúde." },
    { nome: "Baralho Cigano", desc: "Respostas claras e objetivas para suas dúvidas." },
    { nome: "Tarô dos Anjos", desc: "Amparo celestial, salmos e rituais angelicais." },
  ];
  const passos = [
    { n: "1", t: "Escolha seu oráculo", d: "Tarô, Cigano ou Anjos." },
    { n: "2", t: "Abra o coração", d: "Pergunte por voz ou texto." },
    { n: "3", t: "Receba sua leitura", d: "Com clareza e acolhimento." },
  ];
  const beneficios = [
    "Presságio do Dia com uma carta",
    "Mensagem do dia como lembrete",
    "Acolhimento psicológico em cada leitura",
    "Mantras, salmos, banhos e simpatias",
    "Leitura por voz ou texto",
    "Seu histórico guardado",
  ];

  return (
    <main className="w-full bg-[#FDFBF7] text-[#4A3B28] h-[100dvh] overflow-y-auto">
      <div className="max-w-[560px] mx-auto px-6 py-12 flex flex-col items-center text-center">

        {/* Hero */}
        <div className="w-24 h-24 rounded-[26px] overflow-hidden border border-[#E5D9C3] shadow-lg mb-6">
          <img src="/assets/brand/icon-512.png" alt="Psiquê Oráculo" className="w-full h-full object-cover" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#C4A484] mb-3">Psiquê Oráculo</span>
        <h1 className="text-4xl md:text-5xl font-serif text-[#4A3B28] leading-tight mb-4">
          Uma pergunta no coração?<br />As cartas respondem. 🔮
        </h1>
        <p className="text-base text-[#8B735B] leading-relaxed max-w-[440px] mb-8">
          Faça sua leitura de Tarô, Baralho Cigano ou Tarô dos Anjos a qualquer hora, com sensibilidade e acolhimento. Comece com <span className="font-bold text-[#4A3B28]">leituras grátis</span>.
        </p>
        <CTA />
        <p className="text-[11px] text-[#8B735B]/60 uppercase tracking-widest mt-4">Grátis para começar · Android</p>

        {/* Mockup do app */}
        <div className="mt-12 w-[250px] rounded-[42px] border-[7px] border-[#2C2420] bg-[#2C2420] shadow-2xl overflow-hidden">
          <img src="/assets/lp/tela-oraculos.jpg" alt="Tela do app Psiquê Oráculo" className="w-full block" />
        </div>

        {/* Vídeo */}
        <div className="w-full mt-14 flex flex-col items-center">
          <h2 className="text-2xl font-serif text-[#C4A484] mb-5">Veja o Psiquê em ação</h2>
          <video
            src="/assets/lp/video.mp4"
            controls
            playsInline
            preload="none"
            poster="/assets/lp/tela-oraculos.jpg"
            className="w-full max-w-[300px] rounded-[28px] border border-[#E5D9C3] shadow-xl bg-black"
          />
        </div>

        {/* Oráculos */}
        <div className="w-full mt-16">
          <h2 className="text-2xl font-serif text-[#C4A484] mb-6">Três oráculos, infinitas respostas</h2>
          <div className="flex flex-col gap-3">
            {oraculos.map((o) => (
              <div key={o.nome} className="bg-white rounded-[24px] border border-[#E5D9C3] p-5 text-left shadow-sm">
                <p className="text-[13px] font-black uppercase tracking-widest text-[#8B735B]">{o.nome}</p>
                <p className="text-sm text-[#5C4D3C] leading-relaxed mt-1">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Como funciona */}
        <div className="w-full mt-16">
          <h2 className="text-2xl font-serif text-[#C4A484] mb-6">Simples assim</h2>
          <div className="flex flex-col gap-4">
            {passos.map((p) => (
              <div key={p.n} className="flex items-center gap-4 text-left">
                <div className="w-11 h-11 rounded-full bg-[#C4A484]/15 border border-[#C4A484]/30 flex items-center justify-center text-[#C4A484] font-serif text-xl shrink-0">{p.n}</div>
                <div>
                  <p className="text-[14px] font-bold text-[#4A3B28]">{p.t}</p>
                  <p className="text-[13px] text-[#8B735B]">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mockup do resultado */}
        <div className="w-full mt-16 flex flex-col items-center">
          <h2 className="text-2xl font-serif text-[#C4A484] mb-6">Uma leitura que acolhe</h2>
          <div className="w-[250px] rounded-[42px] border-[7px] border-[#2C2420] bg-[#2C2420] shadow-2xl overflow-hidden">
            <img src="/assets/lp/tela-resultado.jpg" alt="Exemplo de leitura no Psiquê Oráculo" className="w-full block" />
          </div>
        </div>

        {/* Benefícios */}
        <div className="w-full mt-16">
          <h2 className="text-2xl font-serif text-[#C4A484] mb-6">Mais que cartas</h2>
          <div className="grid grid-cols-1 gap-2.5">
            {beneficios.map((b) => (
              <div key={b} className="flex items-center gap-3 bg-white/60 rounded-2xl border border-[#E5D9C3] px-4 py-3 text-left">
                <span className="text-[#48BB78] text-lg shrink-0">✓</span>
                <span className="text-[13px] font-medium text-[#5C4D3C]">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="w-full mt-16 bg-[#2C2420] rounded-[32px] p-10 flex flex-col items-center">
          <p className="text-2xl font-serif text-[#E5D9C3] mb-2">Comece sua jornada hoje ✨</p>
          <p className="text-sm text-white/70 mb-8">Suas primeiras leituras são grátis.</p>
          <CTA />
        </div>

        {/* Rodapé */}
        <footer className="w-full mt-14 pt-8 border-t border-[#E5D9C3] flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-[#8B735B]/70">
            <a href="/privacy" className="hover:text-[#C4A484]">Privacidade</a>
            <a href="/terms" className="hover:text-[#C4A484]">Termos</a>
            <a href="mailto:angelinhaesf06@gmail.com" className="hover:text-[#C4A484]">Suporte</a>
          </div>
          <p className="text-[10px] text-[#8B735B]/50">Psiquê Oráculo — ferramenta de autoconhecimento e entretenimento.</p>
        </footer>
      </div>
    </main>
  );
}
