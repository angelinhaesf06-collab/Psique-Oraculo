'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Mic, Type, Camera, LayoutGrid, CheckCircle2, ChevronLeft, Heart, Briefcase, DollarSign, Activity, Users, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ButterflyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12,16c0,0-1,2-3,2s-3-2-3-2s-1-4,3-4s3,4,3,4M12,16c0,0,1,2,3,2s3-2,3-2s1-4-3-4s-3,4-3,4 M12,8c0,0-1-2-3-2S6,8,6,8s-1,4,3,4s3-4,3-4M12,8c0,0,1-2,3-2s3,2,3,2s1,4-3,4s-3-4-3-4" />
  </svg>
);

const WingsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11,6c0,0-4-1-7,3s0,9,0,9s5,0,7-5s0-7,0-7 M13,6c0,0,4-1,7,3s0,9,0,9s-5,0-7-5s0-7,0-7" />
  </svg>
);

const TEMAS = [
  { label: 'Amigos', icon: ButterflyIcon, color: 'from-[#4A2D1A] via-[#7B4B2A] to-[#A06E45]' },
  { label: 'Amor', icon: ButterflyIcon, color: 'from-[#8B5E5E] via-[#B17D7D] to-[#D4A5A5]' },
  { label: 'Dinheiro', icon: ButterflyIcon, color: 'from-[#8C6D2E] via-[#B8860B] to-[#DAA520]' },
  { label: 'Saúde', icon: WingsIcon, color: 'from-[#5D2E17] via-[#8B4513] to-[#CD853F]' },
  { label: 'Trabalho', icon: ButterflyIcon, color: 'from-[#8B733D] via-[#C5A059] to-[#E5C78B]' },
];

export default function OraculoJornada() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [passo, setPasso] = useState(0); // Começa na seleção de oráculo
  const [tipoOraculo, setTipoOraculo] = useState('');
  const [tema, setTema] = useState('');
  const [desabafo, setDesabafo] = useState('');
  const [isGravando, setIsGravando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const isDemo = localStorage.getItem('psique_demo_mode') === 'true';
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !isDemo) {
        router.push('/login');
      } else if (session) {
        setUser(session.user);
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem('psique_demo_mode');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getSaudacao = () => {
    const hora = new Date().getHours();
    const nome = user?.user_metadata?.full_name?.split(' ')[0] || "Angela"; 
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

  // if (!user) return null; 

  return (
    <div className="min-h-screen bg-oracle-image text-foreground font-sans p-6 md:p-12 flex flex-col items-center justify-center">
      
      {/* Header Fixo */}
      <div className="fixed top-8 left-8 right-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          {passo > 0 && (
            <button onClick={prevPasso} className="text-gold flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <ChevronLeft size={16} /> Voltar
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <button 
            onClick={handleLogout}
            className="text-gold/40 hover:text-gold transition-colors p-2"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
          <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-white shadow-lg overflow-hidden border-2 border-gold/50">
            <img 
              src="/assets/brand/icon-512.png" 
              alt="Psiquê Ícone" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl w-full space-y-12">
        
        {/* PASSO 0: ESCOLHA SEU ORÁCULO */}
        {passo === 0 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="text-center space-y-2">
              <p className="text-3xl font-script text-gold/80 leading-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                {getSaudacao()}
              </p>
              <h2 className="text-3xl font-medium text-foreground/80 tracking-tight">
                Escolha seu Oráculo
              </h2>
            </div>

            <div className="space-y-6">
              {[
                { id: 'Tarô', tag: '78 ARCANOS', title: 'Tarô', desc: 'Revelações profundas', pattern: 'opacity-10' },
                { id: 'Baralho Cigano', tag: 'LENORMAND', title: 'Baralho Cigano', desc: 'Orientações práticas', pattern: 'opacity-20' },
                { id: 'Tarô dos Anjos', tag: 'CELESTIAIS', title: 'Cartas dos Anjos', desc: 'Luz e proteção', pattern: 'opacity-10' }
              ].map((oracle) => (
                <button 
                  key={oracle.id}
                  onClick={() => { setTipoOraculo(oracle.id); nextPasso(); }}
                  className="w-full relative overflow-hidden bg-[#F5F2EA] rounded-[32px] border border-gold/10 p-8 text-left group transition-all hover:scale-[1.02] shadow-sm hover:shadow-md"
                >
                  <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] ${oracle.pattern} pointer-events-none`} />
                  <div className="relative flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">{oracle.tag}</span>
                      <h3 className="text-3xl font-bold text-foreground/80">{oracle.title}</h3>
                      <p className="text-sm text-foreground/50">{oracle.desc}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all shadow-sm">
                      <ChevronLeft className="rotate-180" size={20} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 1: SELEÇÃO DE TEMA */}
        {passo === 1 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-700 relative">
            <div className="absolute -top-24 -right-10 opacity-30 animate-pulse transition-all">
               <div className="relative">
                  <Sparkles className="text-gold w-16 h-16" />
                  <div className="absolute -top-2 -right-2 text-[24px]">🧚</div>
               </div>
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-medium text-foreground leading-tight tracking-tight px-4">
                O que o seu coração <br />
                precisa entender hoje?
              </h2>
              <p className="text-lg text-foreground/60 font-medium">Escolha uma área para focar:</p>
            </div>
            
            <div className="flex flex-col gap-5 w-full max-w-md mx-auto">
              {TEMAS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => { setTema(t.label); nextPasso(); }}
                  className={`w-full h-20 rounded-2xl bg-gradient-to-r ${t.color} p-[1px] shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden`}
                >
                  <div className="w-full h-full bg-black/5 group-hover:bg-transparent transition-colors flex items-center justify-center relative">
                    <div className="flex items-center gap-6">
                      <t.icon className="w-12 h-12 text-white drop-shadow-2xl" />
                      <span className="text-4xl font-bold text-white drop-shadow-2xl tracking-tighter">{t.label}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 2: DESABAFO */}
        {passo === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 relative">
            <button onClick={prevPasso} className="text-gold/60 hover:text-gold flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <ChevronLeft size={14} /> Mudar Tema ({tema})
            </button>
            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-serif text-gold tracking-tight" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                Abra o seu coração
              </h2>
              <p className="text-foreground/50 italic text-sm">O inconsciente se revela através das palavras.</p>
            </div>
            <div className="relative group mx-auto max-w-xl">
              <div className="relative bg-[#FDFBF7] rounded-[40px] border border-gold/10 p-8 shadow-xl overflow-hidden">
                <textarea
                  value={desabafo}
                  onChange={(e) => setDesabafo(e.target.value)}
                  placeholder="Escreva aqui sua dúvida mais profunda..."
                  className="relative w-full h-48 bg-transparent border-none focus:outline-none resize-none text-xl font-light text-foreground/80 leading-relaxed z-10"
                />
                <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-6 border-t border-gold/5 gap-4 relative z-10">
                  <button 
                    onMouseDown={() => setIsGravando(true)}
                    onMouseUp={() => { setIsGravando(false); toast.success('Sua voz foi ouvida.'); }}
                    className={`flex items-center gap-3 px-8 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${isGravando ? 'bg-ruby text-white scale-95' : 'bg-gold/5 text-gold hover:bg-gold/10 border border-gold/10'}`}
                  >
                    <Mic size={18} /> {isGravando ? 'Ouvindo...' : 'Segure para Falar'}
                  </button>
                  <button 
                    onClick={nextPasso}
                    disabled={!desabafo && !isGravando}
                    className="w-full md:w-auto bg-gold text-white px-12 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:scale-[1.05] transition-all disabled:opacity-30"
                  >
                    Prosseguir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3: MÉTODO */}
        {passo === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-serif text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                Consulte o Invisível
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
              {[
                { id: 'foto', icon: Camera, title: 'Tirar Foto', desc: 'Leitura física', color: 'bg-gold' },
                { id: 'completa', icon: LayoutGrid, title: 'Tiragem Virtual', desc: 'Sincronicidade de 3 Arcanos', color: 'bg-ruby' },
                { id: 'sim_nao', icon: CheckCircle2, title: 'Sim ou Não', desc: 'Direcionamento rápido', color: 'bg-blue-400' }
              ].map((m) => (
                <button 
                  key={m.id}
                  onClick={() => handleLeitura(m.id)}
                  className="flex items-center gap-6 bg-white border border-gold/10 p-6 rounded-[32px] hover:border-gold/40 hover:shadow-2xl transition-all group text-left"
                >
                  <div className={`w-16 h-16 ${m.color}/5 rounded-2xl flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all`}>
                    <m.icon size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-foreground/80">{m.title}</h4>
                    <p className="text-sm text-foreground/40">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 4: RESULTADO */}
        {passo === 4 && resultado && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 space-y-12 pb-24 max-w-4xl mx-auto text-center">
            <div className="space-y-6">
              <div className="inline-block px-6 py-2 bg-gold/10 rounded-full text-[11px] font-black text-gold uppercase tracking-[0.3em] border border-gold/20">
                {resultado.oraculo_utilizado} • {resultado.tema}
              </div>
              <h2 className="text-5xl md:text-6xl font-serif text-gold leading-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                Sua Revelação
              </h2>
            </div>

            {resultado.situacao_atual ? (
              <div className="space-y-16">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <CardResult title="O Presente" data={resultado.situacao_atual} index={1} />
                    <CardResult title="O Caminho" data={resultado.caminho_acao} index={2} />
                    <CardResult title="A Síntese" data={resultado.resultado_conselho} index={3} />
                 </div>
                 <div className="relative p-10 rounded-[56px] bg-white border border-gold/10 shadow-2xl">
                    <p className="text-2xl md:text-3xl leading-relaxed text-foreground/80 font-light italic">
                      "{resultado.conselho_final}"
                    </p>
                    {resultado.salmo_recomendado && <p className="mt-6 text-sm font-bold text-gold/60">{resultado.salmo_recomendado}</p>}
                 </div>
              </div>
            ) : (
              <div className="bg-white rounded-[56px] border border-gold/10 p-12 shadow-2xl">
                <h3 className="text-4xl font-bold text-gold mb-4">{resultado.veredito}</h3>
                <p className="text-xl leading-relaxed text-foreground/70 font-light mb-6">{resultado.previsao}</p>
                <div className="bg-gold/5 p-6 rounded-3xl border border-gold/10 italic text-lg">"{resultado.conselho}"</div>
              </div>
            )}

            <div className="space-y-8">
              {resultado.complemento_terapeutico && (
                <p className="text-sm font-black uppercase tracking-[0.4em] text-gold/30 max-w-md mx-auto animate-pulse">
                  {resultado.complemento_terapeutico}
                </p>
              )}
              <button 
                onClick={() => { setPasso(1); setResultado(null); setDesabafo(''); }}
                className="px-12 py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.3em] text-gold border border-gold/20 hover:bg-gold hover:text-white transition-all shadow-lg shadow-gold/5"
              >
                Nova Jornada
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-cream/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 border-t-2 border-gold rounded-full animate-spin"></div>
            <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold animate-pulse">Consultando o Campo Arquetípico</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CardResult({ title, data, index }: { title: string, data: any, index: number }) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-backwards" style={{ animationDelay: `${index * 200}ms` }}>
      <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/30 text-center">{title}</h5>
      <div className="relative h-full bg-[#FDFBF7] rounded-[24px] border-2 border-gold/20 p-2 shadow-xl hover:scale-[1.02] transition-all duration-700">
        <div className="h-full border border-gold/10 rounded-[18px] flex flex-col overflow-hidden">
          <div className="h-2/3 bg-gradient-to-b from-[#F5F2EA] to-white flex flex-col items-center justify-center p-6 text-center">
             <span className="text-gold font-bold text-xl uppercase tracking-tighter drop-shadow-sm">{data.carta}</span>
          </div>
          <div className="h-1/3 bg-white p-5 flex items-center justify-center text-center">
             <p className="text-[11px] leading-relaxed text-foreground/60 italic font-medium">{data.interpretacao}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
