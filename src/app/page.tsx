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
  // ... rest of state ...

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
      // Sorteia as cartas ANTES de chamar a IA para garantir realismo
      const cartasSorteadas = tipo === 'completa' ? drawCards(tipoOraculo, 3) : drawCards(tipoOraculo, 1);
      
      const res = await fetch('/api/oracle/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoOraculo,
          tipoLeitura: tipo,
          tema,
          pergunta: desabafo,
          cartas: cartasSorteadas, // Envia as cartas reais sorteadas pelo sistema
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

  // if (!user) return null; 

  return (
    <div className="min-h-screen text-foreground font-sans p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden bg-[#F5F2EA]">
      
      {/* Elementos Decorativos Passo 0 */}
      {passo === 0 && (
        <>
          {/* Mandala Central Suave ao Fundo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[900px] md:h-[900px] opacity-[0.07] pointer-events-none z-0">
             <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" />
          </div>

          {/* Ornamentos de Canto (SVG simulando a imagem) */}
          <div className="absolute top-4 left-4 md:top-8 md:left-8 w-24 h-24 md:w-48 md:h-48 opacity-20 pointer-events-none z-0">
             <svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current">
                <path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="20" cy="20" r="3" />
                <circle cx="40" cy="20" r="2" />
                <circle cx="20" cy="40" r="2" />
             </svg>
          </div>
          <div className="absolute top-4 right-4 md:top-8 md:right-8 w-24 h-24 md:w-48 md:h-48 opacity-20 pointer-events-none z-0 rotate-90">
             <svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current">
                <path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" />
             </svg>
          </div>
          <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-24 h-24 md:w-48 md:h-48 opacity-20 pointer-events-none z-0 -rotate-90">
             <svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current">
                <path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" />
             </svg>
          </div>
          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-24 h-24 md:w-48 md:h-48 opacity-20 pointer-events-none z-0 rotate-180">
             <svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current">
                <path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" />
             </svg>
          </div>
        </>
      )}

      {/* Header Fixo */}
      <div className="fixed top-4 left-4 right-4 md:top-8 md:left-8 md:right-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          {passo > 0 && (
            <button onClick={prevPasso} className="text-gold flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gold/10 shadow-sm">
              <ChevronLeft size={16} /> Voltar
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <button 
            onClick={handleLogout}
            className="text-gold/40 hover:text-gold transition-colors p-2 bg-white/50 backdrop-blur-sm rounded-full"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-gold/30">
            <img 
              src="/assets/brand/icon-512.png" 
              alt="Psiquê Ícone" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        
        {/* PASSO 0: ESCOLHA SEU ORÁCULO (Réplica da Imagem) */}
        {passo === 0 && (
          <div className="flex flex-col items-center space-y-12 md:space-y-16 animate-in fade-in zoom-in-95 duration-1000">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 px-4 md:px-10 w-full">
              {[
                { 
                  id: 'Tarô', 
                  title: 'TARO', 
                  desc: 'TARO: CONSELHOS DOS ARCANOS', 
                  img: '/assets/decks/covers/taro.jpg',
                  borderColor: 'border-[#E5D9C3]'
                },
                { 
                  id: 'Baralho Cigano', 
                  title: 'BARALHO CIGANO', 
                  desc: 'BARALHO CIGANO LENORMAN', 
                  img: '/assets/decks/covers/cigano.jpg',
                  borderColor: 'border-[#D4B982]'
                },
                { 
                  id: 'Tarô dos Anjos', 
                  title: 'TARO DOS ANJOS', 
                  desc: 'TARO DOS ANJOS E AINGRESIS', 
                  img: '/assets/decks/covers/anjos.jpg',
                  borderColor: 'border-[#E5D9C3]'
                }
              ].map((oracle) => (
                <div key={oracle.id} className="flex flex-col items-center group">
                  <button 
                    onClick={() => setTipoOraculo(oracle.id)}
                    className={`relative flex flex-col items-center bg-[#FDFBF7] rounded-[40px] md:rounded-[56px] border-4 md:border-[10px] ${oracle.borderColor} p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all hover:scale-105 ${tipoOraculo === oracle.id ? 'ring-4 ring-[#008B8B]/40 border-[#008B8B]/20' : ''}`}
                  >
                    <h3 className="text-xl md:text-2xl font-serif text-foreground/80 tracking-[0.2em] mb-6 md:mb-8">{oracle.title}</h3>
                    
                    <div className="w-full aspect-[3/4.2] rounded-[16px] md:rounded-[24px] overflow-hidden border border-gold/10 shadow-inner bg-[#F5F2EA]">
                      <img 
                        src={oracle.img} 
                        alt={oracle.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/F5F2EA/C5A059?text=' + oracle.title;
                        }}
                      />
                    </div>
                  </button>
                  <p className="text-[10px] md:text-[12px] font-bold text-foreground/50 tracking-[0.2em] mt-6 md:mt-8 text-center px-4 leading-relaxed uppercase">
                    {oracle.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-12 w-full">
               <button 
                 onClick={() => tipoOraculo && nextPasso()}
                 disabled={!tipoOraculo}
                 className={`group relative overflow-hidden bg-gradient-to-r from-[#008B8B] to-[#006666] text-white px-16 md:px-24 py-4 md:py-5 rounded-full text-[12px] md:text-[14px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] shadow-[0_15px_40px_rgba(0,102,102,0.3)] transition-all hover:shadow-[0_20px_50px_rgba(0,102,102,0.4)] hover:-translate-y-1 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:translate-y-0`}
               >
                  <span className="relative z-10">Selecionar Leitura</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
               </button>

               {/* Logo e Ícones Inferiores (Réplica da Imagem) */}
               <div className="flex flex-col items-center gap-6 pb-8 md:pb-0">
                  <div className="flex items-center gap-8 text-gold/30">
                     <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.224 1.224-3.136 2.52-6.528 2.52-5.32 0-9.624-4.304-9.624-9.624s4.304-9.624 9.624-9.624c2.88 0 5.032 1.136 6.592 2.616l2.32-2.32C18.664 1.256 15.8 0 12.48 0 6.312 0 1.296 5.016 1.296 11.184s5.016 11.184 11.184 11.184c3.392 0 5.968-1.12 7.968-3.2 2.072-2.072 2.728-4.968 2.728-7.312 0-.704-.064-1.376-.184-1.936l-10.512.016z"/></svg>
                     <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-2.415-2.828 0-1.927 1.572-3.123 3.018-3.123 1.056 0 2.214.654 2.214 1.884 0 1.23-.96 2.153-2.14 2.153-.346 0-.67-.09-.96-.237l-.022.016c.365.807 1.096 1.488 2.305 1.488 1.99 0 3.255-1.63 3.255-3.64 0-2.03-1.64-3.522-3.87-3.522-2.525 0-4.437 1.846-4.437 4.295 0 2.235 1.594 4.17 3.524 4.17.653 0 1.24-.19 1.7-.514l-.004-.002a4.4 4.4 0 0 1-2.168.652z"/></svg>
                     <Sun className="w-8 h-8" strokeWidth={1} />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-serif text-[#A08149]/40 tracking-[0.3em] md:tracking-[0.5em] font-light">
                    PSIQUEORÁCULO
                  </h2>
               </div>
            </div>
          </div>
        )}

        {/* PASSO 1: SELEÇÃO DE TEMA */}
        {passo === 1 && (
          <div className="space-y-10 md:space-y-12 animate-in fade-in slide-in-from-right-4 duration-700 relative">
            <div className="absolute -top-16 md:-top-24 -right-4 md:-right-10 opacity-30 animate-pulse transition-all">
               <div className="relative">
                  <Sparkles className="text-gold w-12 h-12 md:w-16 md:h-16" />
                  <div className="absolute -top-2 -right-2 text-[20px] md:text-[24px]">🧚</div>
               </div>
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-medium text-foreground leading-tight tracking-tight px-4">
                O que o seu coração <br className="hidden md:block" />
                precisa entender hoje?
              </h2>
              <p className="text-base md:text-lg text-foreground/60 font-medium">Escolha uma área para focar:</p>
            </div>
            
            <div className="flex flex-col gap-4 md:gap-5 w-full max-w-md mx-auto px-4 md:px-0">
              {TEMAS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => { setTema(t.label); nextPasso(); }}
                  className={`w-full h-16 md:h-20 rounded-2xl bg-gradient-to-r ${t.color} p-[1px] shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden`}
                >
                  <div className="w-full h-full bg-black/5 group-hover:bg-transparent transition-colors flex items-center justify-center relative">
                    <div className="flex items-center gap-4 md:gap-6">
                      <t.icon className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-2xl" />
                      <span className="text-2xl md:text-4xl font-bold text-white drop-shadow-2xl tracking-tighter">{t.label}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 2: DESABAFO */}
        {passo === 2 && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 relative px-4 md:px-0">
            <button onClick={prevPasso} className="text-gold/60 hover:text-gold flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <ChevronLeft size={14} /> Mudar Tema ({tema})
            </button>
            <div className="space-y-2 text-center">
              <h2 className="text-3xl md:text-4xl font-serif text-gold tracking-tight" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                Abra o seu coração
              </h2>
              <p className="text-foreground/50 italic text-xs md:text-sm">O inconsciente se revela através das palavras.</p>
            </div>
            <div className="relative group mx-auto max-w-xl">
              <div className="relative bg-[#FDFBF7] rounded-[30px] md:rounded-[40px] border border-gold/10 p-6 md:p-8 shadow-xl overflow-hidden">
                <textarea
                  value={desabafo}
                  onChange={(e) => setDesabafo(e.target.value)}
                  placeholder="Escreva aqui sua dúvida mais profunda..."
                  className="relative w-full h-40 md:h-48 bg-transparent border-none focus:outline-none resize-none text-lg md:text-xl font-light text-foreground/80 leading-relaxed z-10"
                />
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gold/5 gap-4 relative z-10">
                  <button 
                    onMouseDown={() => setIsGravando(true)}
                    onMouseUp={() => { setIsGravando(false); toast.success('Sua voz foi ouvida.'); }}
                    className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${isGravando ? 'bg-ruby text-white scale-95' : 'bg-gold/5 text-gold hover:bg-gold/10 border border-gold/10'}`}
                  >
                    <Mic size={18} /> {isGravando ? 'Ouvindo...' : 'Segure para Falar'}
                  </button>
                  <button 
                    onClick={nextPasso}
                    disabled={!desabafo && !isGravando}
                    className="w-full md:w-auto bg-gold text-white px-12 py-4 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:scale-[1.05] transition-all disabled:opacity-30"
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
          <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 px-4 md:px-0">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-serif text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                Consulte o Invisível
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:gap-6 max-w-md mx-auto">
              {[
                { id: 'foto', icon: Camera, title: 'Tirar Foto', desc: 'Leitura física', color: 'bg-gold' },
                { id: 'completa', icon: LayoutGrid, title: 'Tiragem Virtual', desc: 'Sincronicidade de 3 Arcanos', color: 'bg-ruby' },
                { id: 'sim_nao', icon: CheckCircle2, title: 'Sim ou Não', desc: 'Direcionamento rápido', color: 'bg-blue-400' }
              ].map((m) => (
                <button 
                  key={m.id}
                  onClick={() => handleLeitura(m.id)}
                  className="flex items-center gap-4 md:gap-6 bg-white border border-gold/10 p-4 md:p-6 rounded-[24px] md:rounded-[32px] hover:border-gold/40 hover:shadow-2xl transition-all group text-left"
                >
                  <div className={`w-12 h-12 md:w-16 md:h-16 ${m.color}/5 rounded-xl md:rounded-2xl flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all`}>
                    <m.icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg md:text-xl text-foreground/80">{m.title}</h4>
                    <p className="text-xs md:text-sm text-foreground/40">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 4: RESULTADO */}
        {passo === 4 && resultado && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 space-y-8 md:space-y-12 pb-24 max-w-4xl mx-auto text-center px-4 md:px-0">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-block px-6 py-2 bg-gold/10 rounded-full text-[10px] md:text-[11px] font-black text-gold uppercase tracking-[0.3em] border border-gold/20">
                {resultado.oraculo_utilizado} • {resultado.tema}
              </div>
              <h2 className="text-4xl md:text-6xl font-serif text-gold leading-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                Sua Revelação
              </h2>
            </div>

            {resultado.situacao_atual ? (
              <div className="space-y-10 md:space-y-16">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <CardResult 
                      title="O Presente" 
                      data={resultado.situacao_atual} 
                      index={1} 
                      tipoOraculo={tipoOraculo}
                    />
                    <CardResult 
                      title="O Caminho" 
                      data={resultado.caminho_acao} 
                      index={2} 
                      tipoOraculo={tipoOraculo}
                    />
                    <CardResult 
                      title="A Síntese" 
                      data={resultado.resultado_conselho} 
                      index={3} 
                      tipoOraculo={tipoOraculo}
                    />
                 </div>
                 <div className="relative p-6 md:p-10 rounded-[32px] md:rounded-[56px] bg-white border border-gold/10 shadow-2xl">
                    <p className="text-xl md:text-3xl leading-relaxed text-foreground/80 font-light italic">
                      "{resultado.conselho_final}"
                    </p>
                    {resultado.salmo_recomendado && <p className="mt-4 md:mt-6 text-xs md:text-sm font-bold text-gold/60">{resultado.salmo_recomendado}</p>}
                 </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="max-w-xs mx-auto">
                  {resultado.carta_sorteada && (
                    <CardResult 
                      title="A Resposta do Campo" 
                      data={resultado.carta_sorteada} 
                      index={0} 
                      tipoOraculo={tipoOraculo}
                    />
                  )}
                </div>
                <div className="bg-white rounded-[32px] md:rounded-[56px] border border-gold/10 p-6 md:p-12 shadow-2xl">
                  <h3 className="text-2xl md:text-4xl font-bold text-gold mb-4">{resultado.veredito}</h3>
                  <p className="text-lg md:text-xl leading-relaxed text-foreground/70 font-light mb-6">{resultado.previsao}</p>
                  <div className="bg-gold/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gold/10 italic text-base md:text-lg">"{resultado.conselho}"</div>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {resultado.complemento_terapeutico && (
                <p className="text-sm font-black uppercase tracking-[0.4em] text-[#40E0D0] max-w-md mx-auto animate-pulse">
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

function CardResult({ title, data, index, tipoOraculo }: { title: string, data: any, index: number, tipoOraculo: string }) {
  const [imageError, setImageError] = useState(false);
  
  const folderMap: Record<string, string> = {
    'Tarô': 'taro',
    'Baralho Cigano': 'cigano',
    'Tarô dos Anjos': 'anjos'
  };

  const folder = folderMap[tipoOraculo] || 'taro';
  const imagePath = `/assets/decks/${folder}/${data.card_slug}.jpg`;

  // Define a cor de destaque (glow) baseada no oráculo ou na carta
  const glowColor = tipoOraculo === 'Baralho Cigano' 
    ? (index % 2 === 0 ? 'shadow-teal-500/20' : 'shadow-ruby/20')
    : 'shadow-gold/20';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-backwards" style={{ animationDelay: `${index * 200}ms` }}>
      <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/30 text-center">{title}</h5>
      
      {/* Moldura Estilo Joalheria Mística */}
      <div className={`relative h-full bg-[#FDFBF7] rounded-[32px] border-[3px] border-[#D4B982]/30 p-3 shadow-2xl transition-all duration-700 hover:scale-[1.05] hover:border-[#D4B982] ${glowColor}`}>
        
        {/* Borda Interna Fina (Efeito Duplo) */}
        <div className="h-full border border-[#D4B982]/10 rounded-[22px] flex flex-col overflow-hidden bg-white">
          
          <div className="h-full relative overflow-hidden bg-[#F5F2EA]">
             {!imageError ? (
               <img 
                 src={imagePath} 
                 alt={data.carta}
                 className="w-full h-full object-cover"
                 onError={() => setImageError(true)}
               />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#FDFBF7] to-[#F5F2EA]">
                 <div className="w-16 h-16 mb-4 rounded-full border-2 border-gold/20 flex items-center justify-center text-gold/40">
                   <Sparkles size={24} />
                 </div>
                 <span className="text-gold font-bold text-lg uppercase tracking-widest leading-tight">{data.carta}</span>
               </div>
             )}
             
             {/* Overlay de Brilho nos Cantos */}
             <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-gold/30" />
             <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-gold/30" />
             <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-gold/30" />
             <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-gold/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
