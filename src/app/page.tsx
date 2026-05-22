'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Mic, Type, Camera, LayoutGrid, CheckCircle2, ChevronLeft, Heart, Briefcase, DollarSign, Activity, Users, LogOut, Sun, Moon, Star, X, Info, ShieldCheck, Crown, Eye, Wand2, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { drawCards } from '@/lib/cards';

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
  { label: 'Amigos', icon: Moon, color: 'from-[#1E293B] via-[#334155] to-[#1E293B]', textColor: 'text-blue-200' },
  { label: 'Amor', icon: Heart, color: 'from-[#450a0a] via-[#991b1b] to-[#450a0a]', textColor: 'text-rose-200' },
  { label: 'Dinheiro', icon: Sun, color: 'from-[#422006] via-[#a16207] to-[#422006]', textColor: 'text-amber-200' },
  { label: 'Saúde', icon: FairyIcon, color: 'from-[#064e3b] via-[#065f46] to-[#064e3b]', textColor: 'text-emerald-200' },
  { label: 'Trabalho', icon: MandalaSmallIcon, color: 'from-[#2e1065] via-[#4c1d95] to-[#2e1065]', textColor: 'text-purple-200' },
];

function CardResult({ title, data, index, tipoOraculo }: { title: string, data: any, index: number, tipoOraculo: string }) {
  const [imageError, setImageError] = useState(false);
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos' };
  const folder = folderMap[tipoOraculo] || 'taro';
  const imagePath = `/assets/decks/${folder}/${data.card_slug}.jpg`;

  return (
    <div className="flex flex-col items-center gap-1 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 150}ms` }}>
      <h5 className="text-[7px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] text-foreground/40 text-center leading-none">{title}</h5>
      <div className="w-[85px] md:w-[180px] relative aspect-[3/4.5] bg-[#FDFBF7] rounded-[12px] md:rounded-[24px] border-[1px] md:border-[2px] border-[#D4B982]/30 p-1 md:p-2 shadow-lg">
        <div className="w-full h-full rounded-[10px] md:rounded-[18px] overflow-hidden bg-[#F5F2EA] flex items-center justify-center">
           {!imageError ? (
             <img src={imagePath} alt={data.carta} className="w-full h-full object-contain" onError={() => setImageError(true)} />
           ) : (
             <div className="p-1 text-center">
               <span className="text-gold font-bold text-[7px] md:text-xs uppercase tracking-widest block leading-tight">{data.carta}</span>
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState<'politicas' | 'ajuda' | 'assinatura' | 'paywall' | 'limite_diario' | null>(null);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
          setDesabafo(transcript);
        };
        recognition.start();
        (window as any).recognition = recognition;
      }

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
          toast.success('Sintonizado.');
        };
      };

      recorder.start();
      setIsGravando(true);
    } catch (err) {
      toast.error('Verifique o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isGravando) {
      mediaRecorderRef.current.stop();
      setIsGravando(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      if ((window as any).recognition) {
        (window as any).recognition.stop();
        delete (window as any).recognition;
      }
    }
  };

  const handleCaptureImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleLeitura('foto', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLeitura = async (tipo: string, imageData?: string) => {
    setLoading(true);
    try {
      // Foto e Caminho do Destino (completa) usam 3 cartas. Bússola (sim_nao) usa 1 carta.
      const cartasSorteadas = (tipo === 'completa' || tipo === 'foto') ? drawCards(tipoOraculo, 3) : drawCards(tipoOraculo, 1);
      const { data: { session } } = await supabase.auth.getSession();
      const userName = localStorage.getItem('psique_user_name') || session?.user?.user_metadata?.full_name || "Consulente";
      
      const res = await fetch('/api/oracle/read', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          tipoOraculo, tipoLeitura: tipo, tema, pergunta: desabafo,
          cartas: tipo === 'foto' ? null : cartasSorteadas,
          imagem: imageData || null, audio: audioBase64,
          userName // Enviando o nome para personalização
        })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Erro ${res.status}: Servidor instável.`);
      }

      const data = await res.json();
      if (res.status === 403 && data.code === "PAYWALL") {
        setModalAberto('assinatura');
        toast.error(data.details);
        setLoading(false);
        return;
      }
      if (data.error) throw new Error(data.details || data.error);
      
      // Mapear os slugs das cartas sorteadas de volta para o resultado da IA
      if (data.situacao_atual) data.situacao_atual.card_slug = cartasSorteadas[0]?.slug;
      if (data.caminho_acao) data.caminho_acao.card_slug = cartasSorteadas[1]?.slug;
      if (data.resultado_conselho) data.resultado_conselho.card_slug = cartasSorteadas[2]?.slug;
      if (data.carta_sorteada) data.carta_sorteada.card_slug = cartasSorteadas[0]?.slug;

      setResultado(data);
      setAudioBase64(null);
      setPasso(4); 
    } catch (error: any) {
      toast.error(`Falha: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-[100dvh] w-full text-foreground font-sans p-2 md:p-12 flex flex-col items-center relative bg-[#F5F2EA] ${passo === 4 ? "overflow-y-auto" : "overflow-hidden justify-center"}`}>
      
      {/* Background Mandala */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[900px] md:h-[900px] opacity-[0.06]">
           <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Ícone Cabeçalho Centralizado */}
      <div className={`fixed z-50 pointer-events-none transition-all duration-700 ${
        passo === 0
          ? "opacity-0 invisible scale-0"
          : "top-4 md:top-8 left-0 right-0 flex justify-center items-center" 
      }`}>
        <div className="w-16 h-16 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden border-2 border-gold/20 pointer-events-auto">
          <img src="/assets/brand/icon-512.png" alt="Icon" className="w-full h-full object-cover scale-105" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-2xl flex-1 flex flex-col items-center justify-between pt-4 md:pt-48">
        
        {/* PASSO 0: ESCOLHA */}
        {passo === 0 && (
          <div className="flex flex-col items-center justify-between w-full h-full py-4">
            <h2 className="text-2xl md:text-5xl font-serif text-gold leading-tight text-center px-4" style={{ fontFamily: 'var(--font-great-vibes)' }}>Qual arcano você escolhe hoje?</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 w-full px-4">
              {[
                { id: 'Tarô', title: 'TARÔ', img: '/assets/decks/covers/taro.jpg', borderColor: 'border-[#E5D9C3]' },
                { id: 'Baralho Cigano', title: 'CIGANO', img: '/assets/decks/covers/cigano.jpg', borderColor: 'border-[#D4B982]' },
                { id: 'Tarô dos Anjos', title: 'ANJOS', img: '/assets/decks/covers/anjos.jpg', borderColor: 'border-[#E5D9C3]' }
              ].map((o) => (
                <button key={o.id} onClick={() => { setTipoOraculo(o.id); nextPasso(); }} className={`w-full max-w-[90px] md:max-w-[200px] flex flex-col items-center bg-[#FDFBF7] rounded-[14px] md:rounded-[32px] border-2 md:border-4 ${o.borderColor} p-1 md:p-4 shadow-xl transition-all hover:scale-105 active:scale-95`}>
                  <h3 className="text-[8px] md:text-sm font-bold text-foreground/80 tracking-widest mb-0.5 md:mb-4 font-sans uppercase">{o.title}</h3>
                  <div className="w-full aspect-[3/4.5] rounded-[6px] md:rounded-[16px] overflow-hidden bg-white flex items-center justify-center"><img src={o.img} alt={o.title} className="w-full h-full object-cover" /></div>
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-2 pb-2">
               <h2 className="text-2xl md:text-4xl font-serif text-[#A08149]/30 tracking-tight text-center" style={{ fontFamily: 'var(--font-great-vibes)' }}>Psiquê Oráculo</h2>
               <div className="flex flex-col items-center gap-3">
                  <button onClick={() => setModalAberto('assinatura')} className="flex items-center gap-2 px-6 py-1.5 rounded-full bg-gold/10 border border-gold/20 shadow-sm"><Crown className="w-4 h-4 text-gold" /><span className="text-[10px] font-bold text-gold uppercase tracking-widest">Premium</span></button>
                  <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gold/30">
                    <button onClick={() => setModalAberto('ajuda')}>Ajuda</button><span>•</span>
                    <button onClick={() => setModalAberto('politicas')}>Políticas</button><span>•</span>
                    <button onClick={handleLogout} className="text-ruby/40">Sair</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PASSO 1: TEMA */}
        {passo === 1 && (
          <div className="flex flex-col items-center justify-between w-full h-full py-20">
            <h2 className="text-2xl md:text-5xl font-serif text-gold text-center px-4" style={{ fontFamily: 'var(--font-great-vibes)' }}>Onde sua alma busca luz?</h2>
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
              {TEMAS.map((t) => (
                <button key={t.label} onClick={() => { setTema(t.label); nextPasso(); }} className={`w-full h-12 md:h-16 rounded-[16px] bg-gradient-to-r ${t.color} p-[1px] shadow-lg hover:scale-[1.02] transition-all`}>
                  <div className="w-full h-full bg-black/30 backdrop-blur-md rounded-[15px] flex items-center justify-between px-6">
                    <div className="flex items-center gap-4"><t.icon className={`w-5 h-5 ${t.textColor}`} /><span className={`text-[15px] md:text-xl font-medium ${t.textColor} tracking-wide font-sans`}>{t.label}</span></div>
                    <ChevronLeft className="w-4 h-4 rotate-180 opacity-30 text-white" />
                  </div>
                </button>
              ))}
            </div>
            <button onClick={prevPasso} className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A08149] py-4 bg-white/50 px-8 rounded-full border border-gold/10">‹ Mudar Oráculo</button>
          </div>
        )}

        {/* PASSO 2: PERGUNTA */}
        {passo === 2 && (
          <div className="flex flex-col items-center justify-between w-full h-full py-20">
            <h2 className="text-2xl md:text-4xl font-serif text-gold text-center px-4" style={{ fontFamily: 'var(--font-great-vibes)' }}>Abra o seu coração</h2>
            <div className="relative bg-white rounded-[28px] border border-gold/10 p-4 shadow-2xl w-full max-w-[340px]">
              <textarea value={desabafo} onChange={(e) => setDesabafo(e.target.value)} placeholder="Escreva sua dúvida..." className="w-full h-32 bg-transparent border-none focus:outline-none text-base font-light text-foreground/70" />
              <div className="space-y-3 pt-3 border-t border-gold/5">
                <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isGravando ? 'bg-ruby text-white animate-pulse' : 'bg-gold/5 text-gold border border-gold/10'}`}><Mic size={18} /> {isGravando ? 'Ouvindo...' : 'Segure para Falar'}</button>
                <button onClick={nextPasso} disabled={!desabafo && !isGravando} className="w-full bg-gold text-white py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg disabled:opacity-20">Prosseguir</button>
              </div>
            </div>
            <button onClick={prevPasso} className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A08149] py-4 bg-white/50 px-8 rounded-full border border-gold/10">‹ Trocar Foco ({tema})</button>
          </div>
        )}

        {/* PASSO 3: MÉTODO */}
        {passo === 3 && (
          <div className="flex flex-col items-center justify-between w-full h-full py-20">
            <h2 className="text-2xl md:text-5xl font-serif text-gold text-center px-4" style={{ fontFamily: 'var(--font-great-vibes)' }}>Consulte o Invisível</h2>
            <div className="flex flex-col md:flex-row gap-3 w-full max-w-[320px] md:max-w-xl">
              {[
                { id: 'foto', icon: Eye, title: 'Visão do Jogo Físico', color: 'bg-emerald-600', action: () => fileInputRef.current?.click() },
                { id: 'completa', icon: Wand2, title: 'Caminho do Destino', color: 'bg-ruby', action: () => handleLeitura('completa') },
                { id: 'sim_nao', icon: Compass, title: 'Bússola Sim ou Não', color: 'bg-amber-500', action: () => handleLeitura('sim_nao') }
              ].map((m) => (
                <button key={m.id} onClick={m.action} className="w-full flex flex-col items-center gap-1.5 bg-white border border-gold/10 p-2 rounded-[20px] shadow-lg active:scale-95 transition-all">
                  <div className={`w-12 h-12 ${m.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}><m.icon size={24} /></div>
                  <h4 className="font-bold text-[8px] md:text-xs text-foreground/80 uppercase tracking-widest text-center leading-tight">{m.title}</h4>
                </button>
              ))}
            </div>
            <button onClick={prevPasso} className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A08149] py-4 bg-white/50 px-8 rounded-full border border-gold/10">‹ Refazer Pergunta</button>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleCaptureImage} />
          </div>
        )}

        {/* PASSO 4: RESULTADO */}
        {passo === 4 && resultado && (
          <div className="flex flex-col items-center gap-6 w-full py-12 animate-in fade-in zoom-in-95 duration-1000 px-4">
            <div className="space-y-1 text-center">
              <div className="inline-block px-4 py-1 bg-gold/5 rounded-full text-[8px] font-bold text-gold uppercase tracking-widest border border-gold/10">{resultado.tema}</div>
              <h2 className="text-3xl md:text-6xl font-serif text-gold leading-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>Sua Revelação</h2>
            </div>
            
            {/* Cartas */}
            <div className="flex flex-row justify-center gap-2 md:gap-8">
              {resultado.situacao_atual && <CardResult title="Situação" data={resultado.situacao_atual} index={1} tipoOraculo={tipoOraculo} />}
              {resultado.caminho_acao && <CardResult title="Caminho" data={resultado.caminho_acao} index={2} tipoOraculo={tipoOraculo} />}
              {resultado.resultado_conselho && <CardResult title="Resultado" data={resultado.resultado_conselho} index={3} tipoOraculo={tipoOraculo} />}
              {!resultado.situacao_atual && resultado.carta_sorteada && <CardResult title="Arcano" data={resultado.carta_sorteada} index={0} tipoOraculo={tipoOraculo} />}
            </div>

            {/* Conteúdo Holístico */}
            <div className="w-full max-w-xl space-y-6">
               
               {/* 1. Leitura do Caminho */}
               <div className="bg-white/90 backdrop-blur-sm rounded-[28px] border border-gold/10 p-6 shadow-xl">
                  <h3 className="text-gold font-serif text-xl mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                    <Sparkles size={18} /> {resultado.leitura_caminho?.titulo || "A Leitura do seu Caminho"}
                  </h3>
                  <p className="text-[13px] md:text-base leading-relaxed text-foreground/80 font-light text-justify">
                    {resultado.leitura_caminho?.analise_detalhada}
                  </p>
                  {resultado.leitura_caminho?.veredito_direto && (
                    <div className="mt-4 pt-3 border-t border-gold/5 text-center font-bold text-gold uppercase text-[11px] tracking-widest">
                      {resultado.leitura_caminho.veredito_direto}
                    </div>
                  )}
               </div>

               {/* 2. Acolhimento e Quantum */}
               <div className="bg-gradient-to-br from-white/95 to-gold/5 backdrop-blur-sm rounded-[28px] border border-gold/10 p-6 shadow-xl">
                  <h3 className="text-gold font-serif text-xl mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                    <Activity size={18} /> {resultado.acolhimento_quantum?.titulo || "Acolhimento Quântico"}
                  </h3>
                  <p className="text-[13px] md:text-base leading-relaxed text-foreground/80 font-light text-justify italic">
                    {resultado.acolhimento_quantum?.conteudo}
                  </p>
               </div>

               {/* 3. Rituais e Ancoragem */}
               <div className="bg-[#2C2420] rounded-[28px] border border-white/5 p-6 shadow-2xl text-white/90">
                  <h3 className="text-gold font-serif text-xl mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                    <Wand2 size={18} /> {resultado.ancoragem_rituais?.titulo || "Ancoragem Energética"}
                  </h3>
                  <div className="space-y-4 text-[12px] md:text-sm">
                    {resultado.ancoragem_rituais?.mantra && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0"><Sparkles size={14} className="text-gold" /></div>
                        <div><span className="block font-black text-[9px] uppercase tracking-widest text-gold/60">Mantra Quântico</span>{resultado.ancoragem_rituais.mantra}</div>
                      </div>
                    )}
                    {resultado.ancoragem_rituais?.salmo && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0"><Star size={14} className="text-gold" /></div>
                        <div><span className="block font-black text-[9px] uppercase tracking-widest text-gold/60">Salmo de Proteção</span>{resultado.ancoragem_rituais.salmo}</div>
                      </div>
                    )}
                    {resultado.ancoragem_rituais?.biblia && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0"><Info size={14} className="text-gold" /></div>
                        <div><span className="block font-black text-[9px] uppercase tracking-widest text-gold/60">Sabedoria Bíblica</span>{resultado.ancoragem_rituais.biblia}</div>
                      </div>
                    )}
                    {resultado.ancoragem_rituais?.banho && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0"><Activity size={14} className="text-gold" /></div>
                        <div><span className="block font-black text-[9px] uppercase tracking-widest text-gold/60">Banho de Ervas</span>{resultado.ancoragem_rituais.banho}</div>
                      </div>
                    )}
                    {resultado.ancoragem_rituais?.cristal && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0"><ShieldCheck size={14} className="text-gold" /></div>
                        <div><span className="block font-black text-[9px] uppercase tracking-widest text-gold/60">Cristal de Conexão</span>{resultado.ancoragem_rituais.cristal}</div>
                      </div>
                    )}
                  </div>
               </div>

               {/* Botão Reiniciar */}
               <div className="pt-4 pb-12 flex justify-center">
                  <button onClick={() => { setPasso(0); setResultado(null); setDesabafo(''); }} className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A08149] py-4 bg-white/50 px-12 rounded-full border border-gold/10 shadow-lg hover:bg-gold hover:text-white transition-all">Novo Ciclo ✨</button>
               </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-t-2 border-gold rounded-full animate-spin"></div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gold animate-pulse">Sintonizando Inconsciente...</p>
          </div>
        )}
      </div>

      {/* MODAIS */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#2C2420]/60 backdrop-blur-sm" onClick={() => setModalAberto(null)} />
          <div className="relative w-full max-w-lg bg-[#FDFBF7] rounded-[32px] border border-gold/20 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-gold/10 flex justify-between items-center bg-white/50">
              <h3 className="text-xl font-serif text-gold capitalize" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                {modalAberto === 'assinatura' || modalAberto === 'paywall' ? 'Portal da Abundância' : 
                 modalAberto === 'limite_diario' ? 'Momento de Pausa' : modalAberto}
              </h3>
              <button onClick={() => setModalAberto(null)} className="p-2 hover:bg-gold/5 rounded-full"><X className="w-5 h-5 text-gold" /></button>
            </div>
            <div className="p-6 overflow-y-auto font-sans text-foreground/70 text-sm leading-relaxed text-center">
              
              {(modalAberto === 'assinatura' || modalAberto === 'paywall') && (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                    <Crown className="w-10 h-10 text-gold" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-[#2C2420]">✨ Sua jornada de conexão começou...</h4>
                    <p className="text-xs leading-relaxed opacity-80">
                      Suas 3 leituras gratuitas foram concluídas! A energia dos oráculos se conectou com o seu caminho, e as respostas para o seu ano de 2026 estão prontas para ser reveladas.
                    </p>
                    <p className="text-xs leading-relaxed opacity-80 font-medium">
                      Para ter acesso a consultas diárias, rituais, banhos e leituras por foto com acolhimento quântico, assine o nosso plano anual.
                    </p>
                  </div>

                  <div className="bg-gold/5 p-4 rounded-2xl border border-gold/10">
                    <div className="text-3xl font-black text-gold">R$ 89,00<span className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">/ano</span></div>
                  </div>

                  <ul className="space-y-3 text-left max-w-[240px] mx-auto py-2">
                    {[
                      '5 Consultas diárias',
                      'Acesso total aos 3 oráculos',
                      'Leitura de fotos e áudio',
                      'Rituais e Ancoragem Exclusiva'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#A08149]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                      </li>
                    ))}
                  </ul>

                  <button className="w-full py-4 bg-gradient-to-r from-gold to-[#A08149] text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs">
                    Desbloquear Meu Acesso Anual
                  </button>
                </div>
              )}

              {modalAberto === 'limite_diario' && (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <Sun className="w-10 h-10 text-emerald-600 animate-spin-slow" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-[#2C2420]">🌿 Hora de pausar e ancorar sua energia...</h4>
                    <p className="text-xs leading-relaxed opacity-80 italic">
                      Você atingiu o seu limite de 5 leituras por hoje. No universo quântico, a mente precisa de tempo para absorver os conselhos, mentalizar os mantras e permitir que as respostas se manifestem no seu caminho.
                    </p>
                    <p className="text-xs leading-relaxed opacity-80">
                      Pratique o banho de ervas recomendado, medite com o seu cristal e volte amanhã. Suas cartas estarão esperando por você à meia-noite!
                    </p>
                  </div>

                  <button 
                    onClick={() => setModalAberto(null)}
                    className="w-full py-4 bg-[#2C2420] text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs"
                  >
                    Compreendido
                  </button>
                </div>
              )}
              
              {modalAberto === 'ajuda' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2 border-b border-gold/10 pb-1">Como Consultar</h4>
                    <p className="text-xs">Escolha seu oráculo, defina um tema e abra seu coração. Você pode digitar sua dúvida ou usar o microfone para gravar seu desabafo em tempo real.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2 border-b border-gold/10 pb-1">Métodos de Leitura</h4>
                    <p className="text-xs">Oferecemos o 'Caminho do Destino' para visões completas (Situação, Caminho e Síntese) ou a análise da sua própria carta física através da 'Visão do Jogo Físico'.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2 border-b border-gold/10 pb-1">Dúvidas Técnicas?</h4>
                    <p className="text-xs">Entre em contato através do portal de luz: <span className="font-bold text-gold/80">angelinhaesf06@gmail.com</span></p>
                  </div>
                </div>
              )}

              {modalAberto === 'politicas' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2 border-b border-gold/10 pb-1">Privacidade Sagrada</h4>
                    <p className="text-xs italic">Sua jornada é sagrada. Não armazenamos seus dados sensíveis nem compartilhamos suas consultas. O campo energético é restrito entre você e o oráculo.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2 border-b border-gold/10 pb-1">Termos de Uso</h4>
                    <p className="text-xs italic">O Psiquê Oráculo é uma ferramenta de autoconhecimento e apoio terapêutico. As orientações arquetípicas não substituem acompanhamento médico ou profissional especializado.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
