'use client';

import { useState, useRef } from 'react';
import { Sparkles, Mic, Type, Camera, LayoutGrid, CheckCircle2, ChevronLeft, Heart, Briefcase, DollarSign, Activity, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const TEMAS = [
  { label: 'Amigos', icon: Users, color: 'bg-blue-50 text-blue-500' },
  { label: 'Amor', icon: Heart, color: 'bg-rose-50 text-rose-500' },
  { label: 'Dinheiro', icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
  { label: 'Saúde', icon: Activity, color: 'bg-emerald-50 text-emerald-500' },
  { label: 'Trabalho', icon: Briefcase, color: 'bg-indigo-50 text-indigo-500' },
];

export default function OraculoJornada() {
  const [passo, setPasso] = useState(0); // Começa na seleção de oráculo
  const [tipoOraculo, setTipoOraculo] = useState('');
  const [tema, setTema] = useState('');
  const [desabafo, setDesabafo] = useState('');
  const [isGravando, setIsGravando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Lógica de Saudação Dinâmica
  const getSaudacao = () => {
    const hora = new Date().getHours();
    const nome = "Angela"; 
    if (hora >= 6 && hora < 12) return `Bom dia, ${nome}.`;
    if (hora >= 12 && hora < 18) return `Boa tarde, ${nome}.`;
    return `Boa noite, ${nome}.`;
  };

  const nextPasso = () => setPasso(passo + 1);
  const prevPasso = () => setPasso(passo - 1);

  const handleLeitura = async (tipo: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/oracle/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoOraculo,
          tipoLeitura: tipo,
          tema,
          pergunta: desabafo,
        })
      });
      const data = await res.json();
      setResultado(data);
      setPasso(4); 
    } catch (error) {
      toast.error('Erro ao conectar com o oráculo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-foreground font-sans p-6 md:p-12 flex flex-col items-center justify-center">
      
      {/* Header Fixo */}
      <div className="fixed top-8 left-8 right-8 flex justify-between items-center">
        {passo > 0 && (
          <button onClick={prevPasso} className="text-gold flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <ChevronLeft size={16} /> Voltar
          </button>
        )}
        <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-white shadow-lg ml-auto overflow-hidden border-2 border-gold/50">
          <img 
            src="/assets/brand/icon-raw.avif" 
            alt="Psiquê Ícone" 
            className="w-full h-full object-cover scale-125 brightness-110 sepia-[0.3] hue-rotate-[10deg] saturate-150"
          />
        </div>
      </div>

      <div className="max-w-2xl w-full space-y-12">
        
        {/* PASSO 0: ESCOLHA SEU ORÁCULO (Novo Design) */}
        {passo === 0 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="text-center space-y-4">
              <p className="text-xl font-light text-foreground/60 tracking-tight">
                {getSaudacao()}
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-gold leading-tight tracking-tight">
                Escolha seu <span className="italic font-light text-foreground">Oráculo</span>
              </h2>
            </div>

            <div className="space-y-6">
              {/* Card Tarô */}
              <button 
                onClick={() => { setTipoOraculo('Tarô'); nextPasso(); }}
                className="w-full relative overflow-hidden h-48 rounded-[32px] group transition-all hover:scale-[1.02] shadow-xl shadow-orange-900/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                <div className="relative h-full p-8 flex flex-col justify-center items-center text-center text-white pb-12">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">78 Arcanos (Maiores e Menores)</span>
                  <h3 className="text-3xl font-bold mb-2">Tarô</h3>
                  <p className="text-sm opacity-80 italic">Revelações profundas sobre sua jornada</p>
                  <div className="absolute top-1/2 right-8 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md group-hover:bg-white/30 transition-all hidden md:flex">
                    <ChevronLeft className="rotate-180" size={20} />
                  </div>
                </div>
              </button>

              {/* Card Baralho Cigano */}
              <button 
                onClick={() => { setTipoOraculo('Baralho Cigano'); nextPasso(); }}
                className="w-full relative overflow-hidden h-48 rounded-[32px] group transition-all hover:scale-[1.02] shadow-xl shadow-ruby/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-ruby to-rose-500 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                <div className="relative h-full p-8 flex flex-col justify-center items-center text-center text-white pb-12">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Lenormand</span>
                  <h3 className="text-3xl font-bold mb-2">Baralho Cigano</h3>
                  <p className="text-sm opacity-80 italic">Orientações práticas para seu dia a dia</p>
                  <div className="absolute top-1/2 right-8 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md group-hover:bg-white/30 transition-all hidden md:flex">
                    <ChevronLeft className="rotate-180" size={20} />
                  </div>
                </div>
              </button>

              {/* Card Anjos */}
              <button 
                onClick={() => { setTipoOraculo('Tarô dos Anjos'); nextPasso(); }}
                className="w-full relative overflow-hidden h-48 rounded-[32px] group transition-all hover:scale-[1.02] shadow-xl shadow-blue-900/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-500 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                <div className="relative h-full p-8 flex flex-col justify-center items-center text-center text-white pb-12">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Mensagens Celestiais</span>
                  <h3 className="text-3xl font-bold mb-2">Cartas dos Anjos</h3>
                  <p className="text-sm opacity-80 italic">Luz e proteção dos anjos guardiões</p>
                  <div className="absolute top-1/2 right-8 -translate-y-1/2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md group-hover:bg-white/30 transition-all hidden md:flex">
                    <ChevronLeft className="rotate-180" size={20} />
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PASSO 1: SELEÇÃO DE TEMA */}
        {passo === 1 && (
          <div className="text-center space-y-16 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foreground/80 leading-tight">
                Olá, Angela. <br />
                O que o seu coração <br />
                precisa entender <span className="text-gold font-bold italic">hoje?</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4 justify-center items-start">
              {TEMAS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => { setTema(t.label); nextPasso(); }}
                  className="flex flex-col items-center gap-4 group transition-all"
                >
                  <div className={`w-20 h-20 md:w-16 md:h-16 rounded-[24px] flex items-center justify-center transition-all shadow-sm group-hover:shadow-xl group-hover:scale-110 ${t.color}`}>
                    <t.icon size={28} className="md:size-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 group-hover:text-gold transition-colors">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 2: DESABAFO */}
        {passo === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={prevPasso} className="text-gold/60 hover:text-gold flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <ChevronLeft size={14} /> Mudar Tema ({tema})
            </button>
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-light">Abra o seu <span className="text-gold font-bold">coração</span></h2>
              <p className="text-foreground/40 italic text-sm">Conte-me o que está acontecendo ou faça sua pergunta.</p>
            </div>
            
            <div className="relative bg-white rounded-[32px] border border-gold/10 p-6 shadow-sm focus-within:ring-2 ring-gold/20 transition-all">
              <textarea
                value={desabafo}
                onChange={(e) => setDesabafo(e.target.value)}
                placeholder="Ex: Estou me sentindo confusa sobre meu relacionamento..."
                className="w-full h-40 bg-transparent border-none focus:outline-none resize-none text-lg"
              />
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gold/5">
                <button 
                  onMouseDown={() => setIsGravando(true)}
                  onMouseUp={() => { setIsGravando(false); toast.success('Áudio capturado (Simulação)'); }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isGravando ? 'bg-ruby text-white scale-95' : 'bg-gold/5 text-gold hover:bg-gold/10'}`}
                >
                  <Mic size={16} /> {isGravando ? 'Gravando...' : 'Segure para falar'}
                </button>
                <button 
                  onClick={nextPasso}
                  disabled={!desabafo && !isGravando}
                  className="bg-gold text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gold/20 disabled:opacity-30"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3: MÉTODO DE LEITURA */}
        {passo === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-light">Escolha o <span className="text-gold font-bold">Método</span></h2>
              <p className="text-foreground/40 italic text-sm">Como deseja que o oráculo se manifeste?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => handleLeitura('foto')}
                className="flex items-center gap-6 bg-white border border-gold/10 p-6 rounded-[32px] hover:border-gold/40 hover:shadow-xl transition-all group text-left"
              >
                <div className="w-16 h-16 bg-gold/5 rounded-2xl flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                  <Camera size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Tirar Foto</h4>
                  <p className="text-sm text-foreground/40">Leitura física da sua própria mesa</p>
                </div>
              </button>

              <button 
                onClick={() => handleLeitura('completa')}
                className="flex items-center gap-6 bg-white border border-gold/10 p-6 rounded-[32px] hover:border-gold/40 hover:shadow-xl transition-all group text-left"
              >
                <div className="w-16 h-16 bg-ruby/5 rounded-2xl flex items-center justify-center text-ruby group-hover:bg-ruby group-hover:text-white transition-all">
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Tiragem Virtual Completa</h4>
                  <p className="text-sm text-foreground/40">3 cartas: Situação, Caminho e Resultado</p>
                </div>
              </button>

              <button 
                onClick={() => handleLeitura('sim_nao')}
                className="flex items-center gap-6 bg-white border border-gold/10 p-6 rounded-[32px] hover:border-gold/40 hover:shadow-xl transition-all group text-left"
              >
                <div className="w-16 h-16 bg-blue-400/5 rounded-2xl flex items-center justify-center text-blue-400 group-hover:bg-blue-400 group-hover:text-white transition-all">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Sim ou Não</h4>
                  <p className="text-sm text-foreground/40">Resposta direta e rápida</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PASSO 4: RESULTADO (Simples por enquanto) */}
        {passo === 4 && resultado && (
          <div className="animate-in fade-in zoom-in-95 duration-700 space-y-8 pb-20">
            <div className="text-center space-y-4">
              <div className="inline-block px-4 py-1 bg-gold/10 rounded-full text-[10px] font-black text-gold uppercase tracking-[0.2em]">
                {resultado.oraculo_utilizado} • {resultado.tema}
              </div>
              <h2 className="text-4xl font-light">Sua <span className="font-bold text-gold">Revelação</span></h2>
            </div>

            <div className="bg-white rounded-[48px] border border-gold/10 p-10 shadow-2xl shadow-gold/5 space-y-8">
              {resultado.situacao_atual ? (
                // Layout 3 Cartas
                <div className="space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <CardResult title="Situação Atual" data={resultado.situacao_atual} />
                      <CardResult title="Caminho/Ação" data={resultado.caminho_acao} />
                      <CardResult title="Resultado" data={resultado.resultado_conselho} />
                   </div>
                   <div className="bg-gold/5 p-8 rounded-[32px] border border-gold/10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gold mb-4">Aconselhamento Profundo</h4>
                      <p className="text-lg leading-relaxed italic">"{resultado.conselho_final}"</p>
                   </div>
                </div>
              ) : (
                // Layout Simples
                <div className="space-y-8 text-center">
                  <div className="w-32 h-48 bg-gold/5 border-2 border-gold/20 rounded-2xl mx-auto flex items-center justify-center italic text-gold/40">
                    {resultado.elemento_identificado}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gold">{resultado.veredito}</h3>
                    <p className="text-lg leading-relaxed">{resultado.previsao}</p>
                    <p className="text-lg font-medium text-foreground/60">{resultado.conselho}</p>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-gold/5 text-center">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-gold/40">
                  {resultado.complemento_terapeutico}
                </p>
              </div>
            </div>

            <button 
              onClick={() => { setPasso(1); setResultado(null); setDesabafo(''); }}
              className="w-full py-6 rounded-full text-[10px] font-black uppercase tracking-widest text-gold border border-gold/20 hover:bg-gold/5 transition-all"
            >
              Nova Consulta
            </button>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-cream/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold animate-pulse">Consultando os astros...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CardResult({ title, data }: { title: string, data: any }) {
  return (
    <div className="bg-cream/50 p-6 rounded-[32px] border border-gold/5 space-y-4">
      <h5 className="text-[8px] font-black uppercase tracking-widest text-foreground/40 text-center">{title}</h5>
      <div className="aspect-[2/3] bg-white border border-gold/10 rounded-xl flex items-center justify-center text-center p-4 text-xs font-bold text-gold shadow-inner">
        {data.carta}
      </div>
      <p className="text-xs leading-relaxed text-foreground/70">{data.interpretacao}</p>
    </div>
  );
}
