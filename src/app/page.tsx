'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash, Sparkles, Mic, Type, Camera, LayoutGrid, CheckCircle2, ChevronLeft, Heart, Briefcase, DollarSign, Activity, Users, LogOut, Sun, Moon, Star, X, Info, ShieldCheck, Crown, Eye, Wand2, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { drawCards } from '@/lib/cards';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { VoiceRecorder } from 'capacitor-voice-recorder';

const FairyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2L9 7h6l-3-5z" />
    <path d="M12 7c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4z" />
    <path d="M8 11c-2 0-4 1-4 3s2 3 4 3" />
    <path d="M16 11c2 0 4 1 4 3s-2 3-4 3" />
    <path d="M12 15v5" />
    <path d="M10 21h4" />
    <circle cx="12" cy="7" r="1" fill="currentColor" />
  </svg>
);

const MandalaSmallIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <path d="M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
  </svg>
);

const TEMAS = [
  { label: 'Amigos', icon: Moon, color: 'from-[#4FD1C5] via-[#81E6D9] to-[#4FD1C5]' }, // Cerceta claro/Turquesa
  { label: 'Amor', icon: Heart, color: 'from-[#F687B3] via-[#FBB6CE] to-[#F687B3]' }, // Rosa suave/vibrante
  { label: 'Dinheiro', icon: Sun, color: 'from-[#F6E05E] via-[#FAF089] to-[#F6E05E]' }, // Amarelo Ouro claro
  { label: 'Saúde', icon: FairyIcon, color: 'from-[#68D391] via-[#9AE6B4] to-[#68D391]' }, // Verde menta/claro
  { label: 'Trabalho', icon: MandalaSmallIcon, color: 'from-[#B794F4] via-[#D6BCFA] to-[#B794F4]' }, // Lilás/Roxo claro
];

function CardResult({ title, data, index, tipoOraculo }: { title: string, data: any, index: number, tipoOraculo: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos' };
  const folder = folderMap[tipoOraculo] || 'taro';
  
  const slug = (data.card_slug || '').toLowerCase().trim();
  const imagePath = data.image_url || `/assets/decks/${folder}/${slug}.webp`;

  return (
    <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 shrink-0" style={{ animationDelay: `${index * 100}ms` }}>
      <h5 className="text-[6px] font-bold uppercase tracking-widest text-[#C4A484]/80">{title}</h5>
      <div className="w-[75px] xs:w-[85px] md:w-[100px] aspect-[3/5] bg-white rounded-lg border border-[#C4A484]/30 p-0.5 shadow-sm overflow-hidden relative">
        <div className="w-full h-full rounded-md overflow-hidden bg-[#FDFBF7] flex items-center justify-center">
           {!imageError ? (
             <img 
                src={imagePath} 
                alt={data.carta} 
                className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`} 
                onLoad={() => setImageLoading(false)} 
                onError={() => setImageError(true)} 
             />
           ) : (
             <div className="p-2 text-center bg-[#F5F2EA] w-full h-full flex items-center justify-center">
                <span className="text-[#C4A484] font-serif text-[8px] leading-tight font-bold uppercase">{data.carta}</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

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
  const [modalAberto, setModalAberto] = useState<'politicas' | 'ajuda' | 'assinatura' | 'paywall' | 'limite_diario' | 'mensagem_ampliada' | null>(null);
  const [mensagemDia, setMensagemDia] = useState<{ texto: string, autor: string } | null>(null);

  useEffect(() => {
    const fetchMensagemDia = async () => {
      try {
        const today = new Date().toLocaleDateString('pt-BR');
        const savedData = localStorage.getItem('psique_mensagem_dia');
        if (savedData) {
          const { texto, autor, data } = JSON.parse(savedData);
          if (data === today) { setMensagemDia({ texto, autor }); return; }
        }
        const { data: { session } } = await supabase.auth.getSession();
        const userName = localStorage.getItem('psique_user_name') || session?.user?.user_metadata?.full_name || "Alma Querida";
        
        const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pisiqueoraculo.com.br';
        const apiUrl = isNative ? `${siteUrl}/api/oracle/read` : `/api/oracle/read`;
        
        const res = await fetch(apiUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ tipoOraculo: 'Geral', tipoLeitura: 'mensagem_dia', tema: 'Motivação e Bem-estar', userName: userName }) 
        }).catch(err => null);

        if (res && res.ok) {
          const dataRes = await res.json();
          if (dataRes.acolhimento_quantum) {
            const novaMensagem = { texto: dataRes.acolhimento_quantum.conteudo, autor: dataRes.acolhimento_quantum.titulo, data: today };
            setMensagemDia({ texto: novaMensagem.texto, autor: novaMensagem.autor });
            localStorage.setItem('psique_mensagem_dia', JSON.stringify(novaMensagem));
          }
        }
      } catch (e) {}
    };
    fetchMensagemDia();
  }, []);

  const handleLogout = async () => { localStorage.removeItem('psique_demo_mode'); await supabase.auth.signOut(); router.push('/login'); };
  const nextPasso = () => setPasso(passo + 1);
  const prevPasso = () => setPasso(passo - 1);

  const handleLeitura = async (tipo: string, imageData?: string) => {
    setLoading(true);
    try {
      const cartasSorteadas = tipo === 'foto' ? null : (tipo === 'completa' ? await drawCards(tipoOraculo, 3) : await drawCards(tipoOraculo, 1));
      const { data: { session } } = await supabase.auth.getSession();
      const userName = localStorage.getItem('psique_user_name') || session?.user?.user_metadata?.full_name || "Consulente";
      
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pisiqueoraculo.com.br';
      const apiUrl = isNative ? `${siteUrl}/api/oracle/read` : `/api/oracle/read`;

      const res = await fetch(apiUrl, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '' 
        },
        body: JSON.stringify({ tipoOraculo, tipoLeitura: tipo, tema, pergunta: desabafo, cartas: cartasSorteadas, imagem: imageData || null, userName })
      });

      if (!res.ok) throw new Error("Silêncio no Portal.");
      
      const data = await res.json();
      if (cartasSorteadas && Array.isArray(cartasSorteadas)) {
        if (data.situacao_atual) data.situacao_atual.card_slug = cartasSorteadas[0]?.slug;
        if (data.caminho_acao) data.caminho_acao.card_slug = cartasSorteadas[1]?.slug;
        if (data.resultado_conselho) data.resultado_conselho.card_slug = cartasSorteadas[2]?.slug;
        if (data.carta_sorteada) data.carta_sorteada.card_slug = cartasSorteadas[0]?.slug;
      }
      setResultado(data); setPasso(4); 
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
        if (isNative) {
          await SpeechRecognition.requestPermissions();
          await VoiceRecorder.requestAudioRecordingPermission();
        }
      } catch (e) {}
    };
    requestPermissions();
  }, []);

  const startRecording = async () => {
    try {
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      if (!isNative) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setDesabafo(prev => prev + (prev ? ' ' : '') + text);
        };
        recognition.start();
        setIsGravando(true);
        return;
      }
      const { available } = await SpeechRecognition.available();
      if (available) {
        setIsGravando(true);
        SpeechRecognition.start({ language: "pt-BR", partialResults: true, popup: true });
        SpeechRecognition.addListener("partialResults", (data: any) => {
          if (data.matches && data.matches.length > 0) setDesabafo(data.matches[0]);
        });
      }
    } catch (err: any) { setIsGravando(false); }
  };

  const stopRecording = async () => {
    try {
      setIsGravando(false);
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      if (isNative) {
        await SpeechRecognition.stop();
        setTimeout(() => SpeechRecognition.removeAllListeners(), 500);
      }
    } catch (e) {}
  };

  return (
    <div className="h-full w-full text-[#5C4D3C] font-sans flex flex-col items-center relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md h-full flex flex-col items-center px-6 py-2 overflow-hidden">
        
        {/* Cabeçalho Fixo - Equilibrado */}
        <div className="flex flex-col items-center mb-2 shrink-0">
           <div className="w-14 h-14 relative">
              <img src="/assets/brand/mandala-login.png" alt="Mandala" className="w-full h-full object-contain animate-spin-slow" />
           </div>
        </div>

        {passo === 0 && (
          <div className="flex-1 flex flex-col items-center justify-between w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 py-2">
            <h2 className="text-xl md:text-2xl font-serif text-[#C4A484] text-center px-4 leading-tight tracking-tight shrink-0">Qual arcano você escolhe hoje?</h2>
            
            {mensagemDia && (
              <div onClick={() => setModalAberto('mensagem_ampliada')} className="w-full max-w-[340px] p-4 bg-white rounded-[28px] border border-[#E5D9C3]/50 shadow-md relative overflow-hidden group cursor-pointer flex flex-col items-center text-center space-y-2 shrink-0">
                <span className="text-[7px] font-black uppercase tracking-[0.4em] text-[#C4A484]/70">Sintonização do Dia</span>
                <p className="text-[13px] italic text-[#5C4D3C] font-serif leading-relaxed line-clamp-2 px-2">"{mensagemDia.texto}"</p>
                <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#C4A484]/40 group-hover:text-[#C4A484] transition-colors">Toque para ampliar ✨</span>
              </div>
            )}

            <div className="flex flex-col gap-2.5 w-full max-w-[320px] shrink-0">
              {[
                { id: 'Tarô', title: 'TARÔ CLÁSSICO', img: '/assets/decks/covers/taro.jpg' },
                { id: 'Baralho Cigano', title: 'BARALHO CIGANO', img: '/assets/decks/covers/cigano.jpg' },
                { id: 'Tarô dos Anjos', title: 'TARÔ DOS ANJOS', img: '/assets/decks/covers/anjos.jpg' }
              ].map((o) => (
                <button key={o.id} onClick={() => { setTipoOraculo(o.id); nextPasso(); }} className="flex items-center gap-5 group w-full bg-white border border-[#E5D9C3]/50 p-2.5 rounded-[24px] shadow-sm active:scale-[0.97] transition-all">
                  <div className="w-14 h-20 bg-white rounded-[16px] border border-[#E5D9C3]/30 p-0.5 overflow-hidden shrink-0 shadow-inner relative z-10">
                    <img src={o.img} alt={o.title} className="w-full h-full object-cover rounded-[14px]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[12px] font-black tracking-[0.2em] text-[#8B735B] uppercase leading-none">{o.title.split(' ')[0]}</span>
                    <span className="text-[#C4A484] text-[11px] font-black tracking-[0.2em] uppercase">{o.title.split(' ').slice(1).join(' ')}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-2 w-full shrink-0 pt-2 pb-2">
               <h1 className="text-xl font-serif text-[#C4A484] tracking-[0.3em] opacity-10 uppercase">Psiquê Oráculo</h1>
               
               <div className="flex items-center gap-1.5 w-full justify-center flex-wrap px-1">
                  <button onClick={() => setModalAberto('assinatura')} className="flex items-center gap-1.5 rounded-full border border-[#E5D9C3] bg-white px-4 py-2 shadow-sm active:scale-95 transition-all group">
                    <Crown className="w-3 h-3 text-[#C4A484]" />
                    <span className="text-[8px] font-black text-[#8B735B] uppercase tracking-widest">Premium</span>
                  </button>
                  <button onClick={() => setModalAberto('ajuda')} className="text-[8px] font-black uppercase tracking-widest text-[#C4A484] bg-white px-4 py-2 rounded-full border border-[#E5D9C3] shadow-sm active:scale-95 transition-all">Ajuda</button>
                  <button onClick={() => setModalAberto('politicas')} className="text-[8px] font-black uppercase tracking-widest text-[#C4A484] bg-white px-4 py-2 rounded-full border border-[#E5D9C3] shadow-sm active:scale-95 transition-all">Políticas</button>
                  <button onClick={handleLogout} className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-white px-4 py-2 rounded-full border border-red-50 shadow-sm active:scale-95 transition-all">Sair</button>
               </div>
            </div>
          </div>
        )}

        {passo === 1 && (
          <div className="flex-1 flex flex-col items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-700 py-6 gap-6">
            <h2 className="text-3xl font-serif text-[#C4A484] text-center px-4 leading-tight">Onde sua alma busca luz?</h2>
            <div className="flex flex-col gap-3 w-full max-w-[340px]">
              {TEMAS.map((t) => (
                <button key={t.label} onClick={() => { setTema(t.label); nextPasso(); }} className={`w-full h-16 rounded-[24px] bg-gradient-to-r ${t.color} p-[2px] shadow-xl active:scale-[0.98] transition-all group`}>
                  <div className="w-full h-full bg-black/80 backdrop-blur-lg rounded-[22px] flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                      <t.icon className="w-5 h-5 text-white group-hover:scale-125 transition-transform duration-500" />
                      <span className="text-lg font-medium text-white tracking-wide">{t.label}</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 rotate-180 opacity-30 text-white group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
            <button onClick={prevPasso} className="mt-4 py-3 px-10 rounded-full bg-white/5 border border-[#C4A484]/10 text-[9px] font-black uppercase tracking-[0.4em] text-[#C4A484] active:scale-95 transition-all">‹ Mudar Oráculo</button>
          </div>
        )}

        {passo === 2 && (
          <div className="flex-1 flex flex-col items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-700 py-6 gap-6">
            <h2 className="text-3xl font-serif text-[#C4A484] text-center px-4 leading-tight">Abra o seu coração</h2>
            <div className="flex-1 w-full max-w-[360px] flex flex-col justify-center">
              <div className="bg-white rounded-[32px] border border-[#E5D9C3]/60 p-8 shadow-xl w-full space-y-6">
                <textarea value={desabafo} onChange={(e) => setDesabafo(e.target.value)} placeholder="Escreva sua dúvida..." className="w-full h-48 bg-transparent border-none focus:outline-none text-lg font-light text-[#5C4D3C] resize-none placeholder:text-[#C4A484]/20 custom-scrollbar" />
                <div className="space-y-4 pt-6 border-t border-[#E5D9C3]/40">
                  <button 
                    onMouseDown={startRecording} 
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`w-full py-5 rounded-full flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${isGravando ? 'bg-red-500 text-white animate-pulse shadow-red-200' : 'bg-[#FDFBF7] text-[#C4A484] border-2 border-[#C4A484]/10 shadow-inner'} active:scale-95`}
                  >
                    <Mic size={20} /> {isGravando ? 'Ouvindo...' : 'Segure para Falar'}
                  </button>
                  <button onClick={nextPasso} disabled={!desabafo && !isGravando} className="w-full bg-[#C4A484] text-white py-5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-lg disabled:opacity-20 active:scale-95">Prosseguir</button>
                </div>
              </div>
            </div>
            <button onClick={prevPasso} className="mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-[#C4A484] opacity-50 hover:opacity-100 transition-opacity uppercase">‹ Trocar Foco ({tema.toUpperCase()})</button>
          </div>
        )}

        {passo === 3 && (
          <div className="flex-1 flex flex-col items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-700 py-8 gap-8">
            <h2 className="text-4xl font-serif text-[#C4A484] text-center px-4 leading-tight tracking-tighter">Consulte o Invisível</h2>
            <div className="flex flex-col gap-4 w-full max-w-[340px]">
              {[
                { id: 'foto', icon: Eye, title: 'Visão do Jogo Físico', color: 'bg-[#065f46]' }, 
                { id: 'completa', icon: Wand2, title: 'Caminho do Destino', color: 'bg-[#991b1b]' }, 
                { id: 'sim_nao', icon: Compass, title: 'Bússola Sim ou Não', color: 'bg-[#a16207]' }
              ].map((m) => (
                <button key={m.id} onClick={() => handleLeitura(m.id)} className="w-full h-20 flex items-center gap-6 bg-white border border-[#E5D9C3]/40 px-8 rounded-full shadow-xl active:scale-[0.98] transition-all group">
                  <div className={`w-12 h-12 ${m.color} rounded-[16px] flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform duration-500`}>
                    <m.icon size={24} />
                  </div>
                  <h4 className="font-black text-[11px] text-[#5C4D3C] uppercase tracking-[0.3em] text-left leading-relaxed">{m.title}</h4>
                </button>
              ))}
            </div>
            <button onClick={prevPasso} className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-[#C4A484] hover:opacity-100 transition-opacity uppercase">‹ Refazer Pergunta</button>
          </div>
        )}

        {passo === 4 && resultado && (
          <div className="flex-1 flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-1000 overflow-hidden">
            <div className="mb-4 text-center shrink-0">
              <div className="inline-block px-3 py-1 bg-[#C4A484]/10 rounded-full text-[8px] font-bold text-[#C4A484] uppercase tracking-widest border border-[#C4A484]/20 mb-1">{resultado.tema}</div>
              <h2 className="text-xl font-serif text-[#C4A484] leading-none">Sua Revelação</h2>
            </div>
            
            <div className="flex-1 w-full overflow-y-auto px-1 custom-scrollbar">
              <div className="flex flex-row justify-center gap-2 mb-6 w-full py-1">
                {resultado.situacao_atual && !resultado.carta_sorteada && (
                  <>
                    <CardResult title="Situação" data={resultado.situacao_atual} index={1} tipoOraculo={tipoOraculo} />
                    <CardResult title="Conselho" data={resultado.caminho_acao} index={2} tipoOraculo={tipoOraculo} />
                    <CardResult title="Resultado" data={resultado.resultado_conselho} index={3} tipoOraculo={tipoOraculo} />
                  </>
                )}
                {resultado.carta_sorteada && (
                   <div className="flex flex-col items-center gap-6">
                      {resultado.leitura_caminho?.veredito_direto && (
                        <div className="bg-[#C4A484] px-10 py-4 rounded-[24px] shadow-xl border-4 border-white/20 animate-in zoom-in duration-500">
                          <span className="text-3xl font-black text-white uppercase tracking-[0.4em] drop-shadow-md">
                            {resultado.leitura_caminho.veredito_direto.split(' ')[0].replace(/[^a-zA-ZáéíóúÁÉÍÓÚ]/g, '')}
                          </span>
                        </div>
                      )}
                      <CardResult title="O Arcano" data={resultado.carta_sorteada} index={0} tipoOraculo={tipoOraculo} />
                   </div>
                )}
              </div>

              <div className="w-full space-y-6 pb-6">
                 <div className="bg-[#2C2420] rounded-[32px] border border-white/5 p-8 shadow-2xl text-white/90 relative overflow-hidden">
                    <h3 className="text-[#C4A484] font-serif text-xl mb-4">{resultado.leitura_caminho?.titulo || "A Voz do Destino"}</h3>
                    <p className="text-sm leading-relaxed text-white/80 font-sans font-light text-justify">{resultado.leitura_caminho?.analise_detalhada}</p>
                    {resultado.leitura_caminho?.veredito_direto && !(tipoOraculo === 'Tarô') && (
                      <div className="mt-8 pt-6 border-t border-white/10 text-center font-black text-[#C4A484] uppercase text-[9px] tracking-widest">{resultado.leitura_caminho.veredito_direto}</div>
                    )}
                 </div>

                 {resultado.ancoragem_rituais && !(tipoOraculo === 'Tarô') && (
                   <div className="bg-white/90 backdrop-blur-sm rounded-[32px] border border-[#E5D9C3] p-8 shadow-xl space-y-6">
                     <h3 className="text-[#C4A484] font-serif text-xl text-center">Ancoragem e Rituais</h3>
                     <div className="grid grid-cols-1 gap-5">
                       {resultado.ancoragem_rituais.mantra && <div className="flex items-start gap-4"><div className="w-6 h-6 rounded-full bg-[#C4A484]/10 flex items-center justify-center shrink-0 text-[#C4A484]"><Sparkles size={14} /></div><div className="space-y-0.5"><span className="text-[7px] font-black uppercase tracking-widest text-[#C4A484]/60">Sintonização</span><p className="text-xs italic text-[#5C4D3C] font-medium leading-relaxed">"{resultado.ancoragem_rituais.mantra}"</p></div></div>}
                       {resultado.ancoragem_rituais.salmo && <div className="flex items-start gap-4"><div className="w-6 h-6 rounded-full bg-[#C4A484]/10 flex items-center justify-center shrink-0 text-[#C4A484]"><ShieldCheck size={14} /></div><div className="space-y-0.5"><span className="text-[7px] font-black uppercase tracking-widest text-[#C4A484]/60">Orientação</span><p className="text-xs text-[#5C4D3C]/80 leading-relaxed">{resultado.ancoragem_rituais.salmo}</p></div></div>}
                       {resultado.ancoragem_rituais.banho && (
                         <div className="flex items-start gap-4">
                           <div className="w-6 h-6 rounded-full bg-[#C4A484]/10 flex items-center justify-center shrink-0 text-[#C4A484]"><Activity size={14} /></div>
                           <div className="space-y-0.5">
                             <span className="text-[7px] font-black uppercase tracking-widest text-[#C4A484]/60">{tipoOraculo === 'Tarô dos Anjos' ? 'Dizeres da Bíblia' : 'Ação Mística'}</span>
                             <p className="text-xs text-[#5C4D3C]/80 leading-relaxed">{resultado.ancoragem_rituais.banho}</p>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 {resultado.acolhimento_quantum && (
                   <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F2EA] rounded-[32px] border border-[#C4A484]/20 p-8 text-center shadow-inner italic">
                     <div className="text-[#C4A484] mb-4 flex justify-center"><Heart size={24} className={tipoOraculo === 'Tarô' ? 'animate-pulse' : ''} /></div>
                     <h4 className="text-[#C4A484] font-serif text-lg mb-2">{tipoOraculo === 'Tarô' ? 'Mantra da Alma' : resultado.acolhimento_quantum.titulo}</h4>
                     <p className={`text-xs text-[#5C4D3C]/70 leading-relaxed ${tipoOraculo === 'Tarô' ? 'animate-pulse font-bold text-[#C4A484]' : ''}`}>
                       {tipoOraculo === 'Tarô' ? resultado.ancoragem_rituais?.mantra || resultado.acolhimento_quantum.conteudo : resultado.acolhimento_quantum.conteudo}
                     </p>
                   </div>
                 )}
              </div>
            </div>

            <div className="w-full pt-4 pb-2 flex flex-col items-center gap-4 shrink-0">
               {resultado.acolhimento_psicologico && (
                 <button onClick={() => setPasso(5)} className="text-[10px] font-bold uppercase tracking-[0.2em] text-white py-3 px-8 bg-[#2C2420] rounded-full shadow-lg border border-[#C4A484]/30 animate-pulse hover:bg-[#4A3B28] transition-all">Quer um conselho do Psico? 👨‍⚕️</button>
               )}
               <button onClick={() => { setPasso(0); setResultado(null); setDesabafo(''); }} className="text-[9px] font-black uppercase tracking-widest text-[#C4A484] py-4 bg-white shadow-md px-10 rounded-full border border-[#E5D9C3] active:scale-95 transition-all">Novo Ciclo ✨</button>
            </div>
          </div>
        )}

        {passo === 5 && resultado && (
          <div className="flex-1 flex flex-col items-center w-full animate-in fade-in slide-in-from-right-4 duration-700 overflow-hidden">
            <div className="mb-6 text-center shrink-0">
               <h2 className="text-3xl font-serif text-[#C4A484] leading-tight">O Olhar Clínico</h2>
               <p className="text-[9px] font-bold uppercase tracking-widest text-[#8B735B]/60">Sua jornada emocional</p>
            </div>
            <div className="flex-1 w-full overflow-y-auto px-1 custom-scrollbar pb-10">
               <div className="bg-white/80 backdrop-blur-md rounded-[40px] border border-[#E5D9C3] p-8 shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute -top-10 -left-10 opacity-[0.03] rotate-12"><Users size={200} className="text-[#C4A484]" /></div>
                  <h3 className="text-xl font-serif text-[#5C4D3C] text-center border-b border-[#E5D9C3]/30 pb-4">{resultado.acolhimento_psicologico.titulo}</h3>
                  <div className="space-y-4"><p className="text-sm md:text-base leading-relaxed text-[#5C4D3C]/90 font-sans font-light text-justify first-letter:text-3xl first-letter:font-serif first-letter:text-[#C4A484] first-letter:mr-2">{resultado.acolhimento_psicologico.conteudo}</p></div>
                  <div className="pt-6 border-t border-[#E5D9C3]/30"><p className="text-[10px] text-center italic text-[#8B735B]/80 font-serif">"O autoconhecimento é o portal para a cura da alma."</p></div>
               </div>
            </div>
            <div className="w-full pt-4 pb-2 flex justify-center shrink-0 gap-4">
               <button onClick={() => setPasso(4)} className="text-[9px] font-bold uppercase tracking-widest text-[#C4A484] py-4 bg-white/50 px-8 rounded-full border border-[#E5D9C3] active:scale-95 transition-all">‹ Voltar ao Oráculo</button>
               <button onClick={() => { setPasso(0); setResultado(null); setDesabafo(''); }} className="text-[9px] font-black uppercase tracking-widest text-white py-4 bg-[#C4A484] shadow-md px-10 rounded-full active:scale-95 transition-all">Novo Ciclo ✨</button>
            </div>
          </div>
        )}

        {loading && <div className="fixed inset-0 bg-white/98 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center gap-6"><div className="w-16 h-16 relative"><img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full animate-spin-slow opacity-20" /><div className="absolute inset-0 border-t border-[#C4A484] rounded-full animate-spin" /></div><p className="text-[8px] font-black uppercase tracking-[0.5em] text-[#C4A484] animate-pulse">Sintonizando Essência...</p></div>}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#2C2420]/70 backdrop-blur-md" onClick={() => setModalAberto(null)} />
          <div className="relative w-full max-w-md bg-[#FDFBF7] rounded-[40px] border border-[#E5D9C3] shadow-2xl overflow-hidden h-[85vh] max-h-[85vh] flex flex-col">
            {modalAberto === 'mensagem_ampliada' && mensagemDia && (
              <div className="flex flex-col h-full bg-[#FDFBF7]">
                <div className="w-full flex justify-between items-center px-6 py-4 shrink-0 bg-white/20">
                  <span className="text-2xl italic font-serif text-[#C4A484] lowercase tracking-tight opacity-70">mensagem_ampliada</span>
                  <button onClick={() => setModalAberto(null)} className="p-2 text-[#C4A484] hover:opacity-50 transition-opacity"><X size={28} strokeWidth={1} /></button>
                </div>
                <div className="flex-1 w-full overflow-y-auto px-8 flex flex-col items-center justify-start text-center py-10">
                  <div className="w-28 h-28 rounded-full bg-[#F5F2EA] flex items-center justify-center shrink-0 mb-6 relative overflow-hidden p-2">
                    <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow opacity-80" />
                  </div>
                  <div className="space-y-8 max-w-[320px]">
                    <h4 className="text-[11px] font-sans font-black tracking-[0.4em] text-[#C4A484] uppercase opacity-80">Sintonização e Bem-estar</h4>
                    <p className="text-2xl italic font-serif text-[#5C4D3C] leading-relaxed">"{mensagemDia.texto}"</p>
                    <div className="flex flex-col items-center gap-6 pt-6">
                      <div className="w-20 h-[0.5px] bg-[#C4A484]/20" />
                      <span className="text-xs font-sans font-bold tracking-[0.2em] text-[#C4A484] uppercase">{mensagemDia.autor || "Abraço da Alma"}</span>
                    </div>
                  </div>
                </div>
                <div className="w-full px-10 pb-10 pt-4 shrink-0">
                  <button onClick={() => setModalAberto(null)} className="w-full py-5 bg-[#C4A484] text-white rounded-[45px] font-sans font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-95 transition-all hover:bg-[#B39373]">Receber com Gratidão ✨</button>
                </div>
              </div>
            )}
            {modalAberto !== 'mensagem_ampliada' && (
              <>
                <div className="p-5 border-b border-[#E5D9C3]/30 flex justify-between items-center bg-white/50">
                  <h3 className="text-xl font-serif text-[#C4A484]">{modalAberto === 'assinatura' ? 'Portal da Abundância' : (modalAberto === 'ajuda' ? 'Guia de Sintonização' : 'Pacto de Luz')}</h3>
                  <button onClick={() => setModalAberto(null)} className="p-2"><X className="w-5 h-5 text-[#C4A484]" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                  {modalAberto === 'assinatura' && (
                    <div className="space-y-6 text-center">
                      <div className="w-16 h-16 bg-[#C4A484]/10 rounded-full flex items-center justify-center mx-auto"><Crown className="w-8 h-8 text-[#C4A484]" /></div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-[#5C4D3C]">Acesso Premium</h4>
                        <p className="text-[10px] leading-relaxed text-[#8B735B]">Experimente <span className="font-bold">grátis por 24 horas</span>.<br/>Após o período, assine para continuar sua jornada.</p>
                      </div>
                      <div className="bg-white rounded-3xl border border-[#E5D9C3] p-6 shadow-sm space-y-4">
                        <div className="space-y-1">
                          <div className="text-3xl font-black text-[#C4A484]">R$ 89,00<span className="text-xs opacity-60 ml-1">/ano</span></div>
                          <p className="text-[9px] uppercase tracking-widest font-bold text-[#8B735B]/70">Plano Anual Soul</p>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-[#E5D9C3]/50">
                          <div className="flex items-center gap-2 text-left"><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-[#5C4D3C]">5 tiragens completas por dia</span></div>
                          <div className="flex items-center gap-2 text-left"><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-[#5C4D3C]">Acesso a todos os Decks</span></div>
                          <div className="flex items-center gap-2 text-left"><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-[#5C4D3C]">Rituais e Banhos exclusivos</span></div>
                        </div>
                      </div>
                      <button className="w-full py-5 bg-gradient-to-r from-[#C4A484] to-[#8B735B] text-white rounded-[32px] font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">Iniciar 24h Grátis</button>
                      <p className="text-[8px] text-[#8B735B]/50 px-4">Cancele a qualquer momento antes do fim do período de teste.</p>
                    </div>
                  )}
                  {modalAberto === 'ajuda' && (
                    <div className="space-y-6 text-[#5C4D3C]">
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-[#E5D9C3] space-y-2 text-left">
                          <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#C4A484]">Como consultar?</h4>
                          <p className="text-[11px] leading-relaxed">Escolha seu deck preferido, foque em uma questão do seu coração e deixe que a IA interprete os símbolos para você.</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-[#E5D9C3] space-y-2 text-left">
                          <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#C4A484]">Métodos de Leitura</h4>
                          <p className="text-[11px] leading-relaxed">Oferecemos a Bússola Sim/Não para dúvidas rápidas e o Caminho do Destino para análises profundas de 3 cartas.</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-[#E5D9C3] space-y-2 text-left">
                          <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#C4A484]">Voz e Imagem</h4>
                          <p className="text-[11px] leading-relaxed">Você pode falar sua dúvida segurando o microfone ou fotografar um jogo de cartas físico para análise.</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-[#8B735B] italic">Suporte: angelinhaesf06@gmail.com</p>
                    </div>
                  )}
                  {modalAberto === 'politicas' && (
                    <div className="space-y-6 text-[#5C4D3C]">
                      <div className="flex flex-col gap-3">
                        <button onClick={() => router.push('/terms')} className="w-full p-4 bg-white rounded-2xl border border-[#E5D9C3] flex items-center justify-between group"><span className="text-[10px] font-bold uppercase tracking-widest">Termos de Uso</span><ChevronLeft className="w-3 h-3 rotate-180 opacity-40" /></button>
                        <button onClick={() => router.push('/privacy')} className="w-full p-4 bg-white rounded-2xl border border-[#E5D9C3] flex items-center justify-between group"><span className="text-[10px] font-bold uppercase tracking-widest">Privacidade</span><ChevronLeft className="w-3 h-3 rotate-180 opacity-40" /></button>
                        <button onClick={() => router.push('/delete-account')} className="w-full p-4 bg-white rounded-2xl border border-red-100 flex items-center justify-between group"><span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Excluir Minha Conta</span><Trash className="w-3 h-3 text-red-300" /></button>
                      </div>
                      <p className="text-[8px] text-[#8B735B]/50 uppercase tracking-widest text-center">Versão 1.0.0 • Psiquê Oráculo</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
