'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Mic, Type, Camera, LayoutGrid, CheckCircle2, ChevronLeft, Heart, Briefcase, DollarSign, Activity, Users, LogOut, Sun } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { drawCards } from '@/lib/cards';

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
  { label: 'Amigos', icon: ButterflyIcon, color: 'from-[#40E0D0] via-[#00CED1] to-[#008B8B]' }, // Turquesas
  { label: 'Amor', icon: ButterflyIcon, color: 'from-[#FF6B6B] via-[#EE5253] to-[#C0392B]' }, // Vermelhos/Corais Mandala
  { label: 'Dinheiro', icon: ButterflyIcon, color: 'from-[#D4B982] via-[#C5A059] to-[#8B733D]' }, // Ouros
  { label: 'Saúde', icon: WingsIcon, color: 'from-[#20B2AA] via-[#008080] to-[#004D40]' }, // Verdes Profundos
  { label: 'Trabalho', icon: ButterflyIcon, color: 'from-[#A08149] via-[#8B733D] to-[#5C4D2B]' }, // Bronze/Terra
];

export default function OraculoJornada() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [passo, setPasso] = useState(0); 
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

  const nextPasso = () => setPasso(passo + 1);
  const prevPasso = () => setPasso(passo - 1);

  const handleLeitura = async (tipo: string) => {
    setLoading(true);
    try {
      const cartasSorteadas = tipo === 'completa' ? drawCards(tipoOraculo, 3) : drawCards(tipoOraculo, 1);
      const res = await fetch('/api/oracle/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoOraculo,
          tipoLeitura: tipo,
          tema,
          pergunta: desabafo,
          cartas: cartasSorteadas,
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(`O oráculo falhou: ${data.details || 'Tente novamente.'}`);
        setLoading(false);
        return;
      }
      setResultado(data);
      setPasso(4); 
    } catch (error) {
      toast.error('Erro ao conectar com o oráculo. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground font-sans p-4 md:p-12 flex flex-col items-center justify-center relative overflow-hidden bg-[#F5F2EA]">
      
      {/* Background Mandala Passo 0 */}
      {passo === 0 && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] opacity-[0.05] pointer-events-none z-0">
             <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" />
          </div>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
             <div className="absolute top-4 left-4 md:top-8 md:left-8 w-24 h-24 md:w-48 md:h-48 opacity-20"><svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current"><path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" /><circle cx="20" cy="20" r="3" /></svg></div>
             <div className="absolute top-4 right-4 md:top-8 md:right-8 w-24 h-24 md:w-48 md:h-48 opacity-20 rotate-90"><svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current"><path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" /></svg></div>
             <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-24 h-24 md:w-48 md:h-48 opacity-20 -rotate-90"><svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current"><path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" /></svg></div>
             <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-24 h-24 md:w-48 md:h-48 opacity-20 rotate-180"><svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current"><path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" /></svg></div>
          </div>
        </>
      )}

      {/* Header com Ícone Centralizado e Maior */}
      <div className="fixed top-6 left-0 right-0 flex justify-center items-center z-50 pointer-events-none">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden border-2 border-gold/30 pointer-events-auto">
          <img src="/assets/brand/icon-512.png" alt="Icon" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mt-16 md:mt-24">
        
        {/* PASSO 0: ESCOLHA SEU ORÁCULO */}
        {passo === 0 && (
          <div className="flex flex-col items-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
            <div className="flex flex-wrap md:flex-nowrap justify-center gap-4 md:gap-8 w-full">
              {[
                { id: 'Tarô', title: 'TARÔ', img: '/assets/decks/covers/taro.jpg', borderColor: 'border-[#E5D9C3]' },
                { id: 'Baralho Cigano', title: 'CIGANO', img: '/assets/decks/covers/cigano.jpg', borderColor: 'border-[#D4B982]' },
                { id: 'Tarô dos Anjos', title: 'ANJOS', img: '/assets/decks/covers/anjos.jpg', borderColor: 'border-[#E5D9C3]' }
              ].map((o) => (
                <button 
                  key={o.id}
                  onClick={() => { setTipoOraculo(o.id); nextPasso(); }}
                  className={`flex-1 min-w-[120px] max-w-[240px] flex flex-col items-center bg-[#FDFBF7] rounded-[24px] md:rounded-[32px] border-2 md:border-4 ${o.borderColor} p-3 md:p-5 shadow-xl transition-all hover:scale-105 active:scale-95`}
                >
                  <h3 className="text-xs md:text-base font-bold text-foreground/80 tracking-widest mb-3 md:mb-5 font-sans">{o.title}</h3>
                  <div className="w-full aspect-[3/4.2] rounded-[12px] md:rounded-[16px] overflow-hidden border border-gold/5 bg-white/50 flex items-center justify-center p-1">
                    <img 
                      src={o.img} 
                      alt={o.title} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-4 pt-4">
               <div className="flex items-center gap-6 text-gold/20">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.224 1.224-3.136 2.52-6.528 2.52-5.32 0-9.624-4.304-9.624-9.624s4.304-9.624 9.624-9.624c2.88 0 5.032 1.136 6.592 2.616l2.32-2.32C18.664 1.256 15.8 0 12.48 0 6.312 0 1.296 5.016 1.296 11.184s5.016 11.184 11.184 11.184c3.392 0 5.968-1.12 7.968-3.2 2.072-2.072 2.728-4.968 2.728-7.312 0-.704-.064-1.376-.184-1.936l-10.512.016z"/></svg>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-2.415-2.828 0-1.927 1.572-3.123 3.018-3.123 1.056 0 2.214.654 2.214 1.884 0 1.23-.96 2.153-2.14 2.153-.346 0-.67-.09-.96-.237l-.022.016c.365.807 1.096 1.488 2.305 1.488 1.99 0 3.255-1.63 3.255-3.64 0-2.03-1.64-3.522-3.87-3.522-2.525 0-4.437 1.846-4.437 4.295 0 2.235 1.594 4.17 3.524 4.17.653 0 1.24-.19 1.7-.514l-.004-.002a4.4 4.4 0 0 1-2.168.652z"/></svg>
                  <Sun className="w-6 h-6" strokeWidth={1.5} />
               </div>
               <h2 className="text-xl md:text-3xl font-bold text-[#A08149]/30 tracking-[0.4em] font-sans">PSIQUEORÁCULO</h2>
               <button onClick={handleLogout} className="mt-8 text-[9px] font-black uppercase tracking-[0.5em] text-gold/20 hover:text-gold/40 transition-colors">Encerrar Conexão</button>
            </div>
          </div>
        )}

        {/* PASSO 1: TEMA */}
        {passo === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 relative text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight px-4 font-sans">O que o seu coração<br className="hidden md:block" />precisa entender hoje?</h2>
            <div className="flex flex-col gap-4 w-full max-w-md mx-auto px-4">
              {TEMAS.map((t) => (
                <button key={t.label} onClick={() => { setTema(t.label); nextPasso(); }} className={`w-full h-16 rounded-2xl bg-gradient-to-r ${t.color} p-[1px] shadow-lg hover:scale-[1.02] transition-all group overflow-hidden`}>
                  <div className="w-full h-full bg-black/5 flex items-center justify-center gap-4">
                    <t.icon className="w-8 h-8 text-white" />
                    <span className="text-2xl font-bold text-white tracking-tighter">{t.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="pt-12">
               <button onClick={prevPasso} className="text-gold/40 hover:text-gold flex items-center justify-center gap-2 mx-auto text-[10px] font-bold uppercase tracking-widest bg-white/30 px-8 py-3 rounded-full border border-gold/5 transition-all">
                 <ChevronLeft size={14} /> Mudar Oráculo
               </button>
            </div>
          </div>
        )}

        {/* PASSO 2: PERGUNTA */}
        {passo === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 relative px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>Abra o seu coração</h2>
            <div className="relative bg-[#FDFBF7] rounded-[30px] border border-gold/10 p-6 shadow-xl max-w-xl mx-auto">
              <textarea value={desabafo} onChange={(e) => setDesabafo(e.target.value)} placeholder="Escreva aqui sua dúvida..." className="w-full h-40 bg-transparent border-none focus:outline-none text-lg font-light text-foreground/80" />
              <div className="flex flex-col md:flex-row justify-between items-center mt-4 border-t border-gold/5 pt-4 gap-4">
                <button onMouseDown={() => setIsGravando(true)} onMouseUp={() => { setIsGravando(false); toast.success('Ouvido.'); }} className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest ${isGravando ? 'bg-ruby text-white' : 'bg-gold/5 text-gold border border-gold/10'}`}><Mic size={18} /> {isGravando ? 'Ouvindo...' : 'Falar'}</button>
                <button onClick={nextPasso} disabled={!desabafo && !isGravando} className="w-full md:w-auto bg-gold text-white px-12 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg disabled:opacity-30">Prosseguir</button>
              </div>
            </div>
            <div className="pt-12">
               <button onClick={prevPasso} className="text-gold/40 hover:text-gold flex items-center justify-center gap-2 mx-auto text-[10px] font-bold uppercase tracking-widest bg-white/30 px-8 py-3 rounded-full border border-gold/5 transition-all">
                 <ChevronLeft size={14} /> Trocar Foco ({tema})
               </button>
            </div>
          </div>
        )}

        {/* PASSO 3: MÉTODO */}
        {passo === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>Consulte o Invisível</h2>
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {[
                { id: 'foto', icon: Camera, title: 'Foto', color: 'bg-gold' },
                { id: 'completa', icon: LayoutGrid, title: 'Virtual', color: 'bg-ruby' },
                { id: 'sim_nao', icon: CheckCircle2, title: 'Sim/Não', color: 'bg-blue-400' }
              ].map((m) => (
                <button key={m.id} onClick={() => handleLeitura(m.id)} className="flex-1 min-w-[120px] max-w-[180px] flex flex-col items-center gap-4 bg-white border border-gold/10 p-5 rounded-[24px] hover:shadow-2xl transition-all group">
                  <div className={`w-14 h-14 ${m.color}/5 rounded-2xl flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all`}><m.icon size={24} /></div>
                  <h4 className="font-bold text-xs md:text-sm text-foreground/80 uppercase tracking-widest">{m.title}</h4>
                </button>
              ))}
            </div>
            <div className="pt-16">
               <button onClick={prevPasso} className="text-gold/40 hover:text-gold flex items-center justify-center gap-2 mx-auto text-[10px] font-bold uppercase tracking-widest bg-white/30 px-8 py-3 rounded-full border border-gold/5 transition-all">
                 <ChevronLeft size={14} /> Refazer Pergunta
               </button>
            </div>
          </div>
        )}

        {/* PASSO 4: RESULTADO */}
        {passo === 4 && resultado && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 space-y-8 pb-24 text-center px-4">
            <div className="space-y-4">
              <div className="inline-block px-6 py-2 bg-gold/10 rounded-full text-[10px] font-bold text-gold uppercase tracking-[0.3em] border border-gold/20">{resultado.oraculo_utilizado} • {resultado.tema}</div>
              <h2 className="text-4xl md:text-6xl font-serif text-gold leading-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>Sua Revelação</h2>
            </div>
            {resultado.situacao_atual ? (
              <div className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CardResult title="Presente" data={resultado.situacao_atual} index={1} tipoOraculo={tipoOraculo} />
                    <CardResult title="Caminho" data={resultado.caminho_acao} index={2} tipoOraculo={tipoOraculo} />
                    <CardResult title="Síntese" data={resultado.resultado_conselho} index={3} tipoOraculo={tipoOraculo} />
                 </div>
                 <div className="relative p-6 md:p-10 rounded-[32px] bg-white border border-gold/10 shadow-2xl">
                    <p className="text-xl md:text-2xl leading-relaxed text-foreground/80 font-light italic font-sans">"{resultado.conselho_final}"</p>
                    {resultado.salmo_recomendado && <p className="mt-4 text-xs font-bold text-gold/60 uppercase">{resultado.salmo_recomendado}</p>}
                 </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="max-w-xs mx-auto">
                  {resultado.carta_sorteada && <CardResult title="A Resposta" data={resultado.carta_sorteada} index={0} tipoOraculo={tipoOraculo} />}
                </div>
                <div className="bg-white rounded-[32px] border border-gold/10 p-6 shadow-2xl">
                  <h3 className="text-2xl font-bold text-gold mb-4 font-sans">{resultado.veredito}</h3>
                  <p className="text-lg leading-relaxed text-foreground/70 font-light mb-6 font-sans">{resultado.previsao}</p>
                  <div className="bg-gold/5 p-4 rounded-2xl border border-gold/10 italic text-base font-sans">"{resultado.conselho}"</div>
                </div>
              </div>
            )}
            <div className="space-y-8">
              {resultado.complemento_terapeutico && <p className="text-sm font-bold uppercase tracking-[0.4em] text-[#40E0D0] animate-pulse font-sans">{resultado.complemento_terapeutico}</p>}
              <button onClick={() => { setPasso(0); setResultado(null); setDesabafo(''); }} className="px-12 py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.3em] text-gold border border-gold/20 hover:bg-gold hover:text-white transition-all shadow-lg shadow-gold/10">Novo Ciclo</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-t-2 border-gold rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold animate-pulse">Consultando o Inconsciente</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CardResult({ title, data, index, tipoOraculo }: { title: string, data: any, index: number, tipoOraculo: string }) {
  const [imageError, setImageError] = useState(false);
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos' };
  const folder = folderMap[tipoOraculo] || 'taro';
  const imagePath = `/assets/decks/${folder}/${data.card_slug}.jpg`;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 150}ms` }}>
      <h5 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground/30">{title}</h5>
      <div className="relative aspect-[3/4.5] bg-[#FDFBF7] rounded-[24px] border-[2px] border-[#D4B982]/30 p-2 shadow-xl">
        <div className="h-full rounded-[18px] overflow-hidden bg-[#F5F2EA] flex items-center justify-center">
           {!imageError ? (
             <img src={imagePath} alt={data.carta} className="w-full h-full object-cover" onError={() => setImageError(true)} />
           ) : (
             <div className="p-4 text-center">
               <Sparkles className="w-10 h-10 text-gold/30 mx-auto mb-2" />
               <span className="text-gold font-bold text-xs uppercase tracking-widest block">{data.carta}</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
