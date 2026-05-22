'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Mic, Type, Camera, LayoutGrid, CheckCircle2, ChevronLeft, Heart, Briefcase, DollarSign, Activity, Users, LogOut, Sun, Moon, Star, X, Info, ShieldCheck, Crown } from 'lucide-react';
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
    <div className="flex flex-col items-center gap-2 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 150}ms` }}>
      <h5 className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] text-foreground/40 text-center">{title}</h5>
      <div className="w-[100px] md:w-[180px] relative aspect-[3/4.5] bg-[#FDFBF7] rounded-[16px] md:rounded-[24px] border-[1px] md:border-[2px] border-[#D4B982]/30 p-1 md:p-2 shadow-lg md:shadow-xl">
        <div className="w-full h-full rounded-[12px] md:rounded-[18px] overflow-hidden bg-[#F5F2EA] flex items-center justify-center">
           {!imageError ? (
             <img src={imagePath} alt={data.carta} className="w-full h-full object-contain" onError={() => setImageError(true)} />
           ) : (
             <div className="p-2 text-center">
               <span className="text-gold font-bold text-[8px] md:text-xs uppercase tracking-widest block">{data.carta}</span>
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
  const [modalAberto, setModalAberto] = useState<'politicas' | 'ajuda' | 'assinatura' | null>(null);

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
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
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
          const base64data = reader.result as string;
          setAudioBase64(base64data);
          toast.success('Sua voz foi sintonizada ao campo.');
        };
      };

      recorder.start();
      setIsGravando(true);
    } catch (err) {
      toast.error('Erro ao acessar microfone. Verifique as permissões.');
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
      reader.onloadend = () => {
        handleLeitura('foto', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLeitura = async (tipo: string, imageData?: string) => {
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
          cartas: tipo === 'foto' ? null : cartasSorteadas,
          imagem: imageData || null,
          audio: audioBase64
        })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(`O oráculo falhou: ${data.details || 'Tente novamente.'}`);
        setLoading(false);
        return;
      }
      setResultado(data);
      setAudioBase64(null);
      setPasso(4); 
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      toast.error(`Erro de conexão: ${error.message || 'Verifique o console para mais detalhes.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full text-foreground font-sans p-4 md:p-12 flex flex-col items-center justify-start md:justify-center relative bg-[#F5F2EA] overflow-x-hidden">
      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[900px] md:h-[900px] opacity-[0.05]">
           <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="absolute top-4 left-4 md:top-8 md:left-8 w-16 h-16 md:w-48 md:h-48 opacity-20"><svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current"><path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" /><circle cx="20" cy="20" r="3" /></svg></div>
        <div className="absolute top-4 right-4 md:top-8 md:right-8 w-16 h-16 md:w-48 md:h-48 opacity-20 rotate-90"><svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current"><path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" /></svg></div>
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-16 h-16 md:w-48 md:h-48 opacity-20 -rotate-90"><svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current"><path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" /></svg></div>
        <div className="absolute bottom-4 right-4 md:bottom-8 md:left-8 w-16 h-16 md:w-48 md:h-48 opacity-20 rotate-180"><svg viewBox="0 0 200 200" className="w-full h-full text-gold fill-current"><path d="M20,20 Q100,20 100,100 Q100,180 180,180" fill="none" stroke="currentColor" strokeWidth="1" /></svg></div>
      </div>

      <div className={`fixed z-50 pointer-events-none transition-all duration-700 ${
        passo === 0
          ? "bottom-8 md:bottom-16 left-0 right-0 flex justify-center items-center"
          : (passo === 1 || passo === 2 || passo === 3)
            ? "top-4 md:top-6 left-0 right-0 flex justify-center items-center" 
            : "top-4 left-4 md:top-8 md:left-8"
      }`}>
        <div className={`bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden border-2 border-gold/30 pointer-events-auto transition-all duration-700 ${
          passo === 0 ? "w-14 h-14 md:w-20 md:h-20" : 
          (passo === 1 || passo === 2 || passo === 3) ? "w-20 h-20 md:w-32 md:h-32" : "w-16 h-16 md:w-24 md:h-24"
        }`}>
          <img src="/assets/brand/icon-512.png" alt="Icon" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mt-28 md:mt-48 pb-20">
        {passo === 0 && (
          <div className="flex flex-col items-center space-y-8 md:space-y-12 animate-in fade-in zoom-in-95 duration-1000">
            <div className="text-center space-y-4 mb-4">
              <h2 className="text-4xl md:text-6xl font-serif text-gold leading-tight px-4" style={{ fontFamily: 'var(--font-great-vibes)' }}>Qual arcano você escolhe hoje?</h2>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 w-full px-8">
              {[
                { id: 'Tarô', title: 'TARÔ', img: '/assets/decks/covers/taro.jpg', borderColor: 'border-[#E5D9C3]' },
                { id: 'Baralho Cigano', title: 'CIGANO', img: '/assets/decks/covers/cigano.jpg', borderColor: 'border-[#D4B982]' },
                { id: 'Tarô dos Anjos', title: 'ANJOS', img: '/assets/decks/covers/anjos.jpg', borderColor: 'border-[#E5D9C3]' }
              ].map((o) => (
                <button 
                  key={o.id}
                  onClick={() => { setTipoOraculo(o.id); nextPasso(); }}
                  className={`w-full max-w-[180px] md:max-w-[240px] flex flex-col items-center bg-[#FDFBF7] rounded-[24px] md:rounded-[32px] border-2 md:border-4 ${o.borderColor} p-3 md:p-5 shadow-xl transition-all hover:scale-105 active:scale-95`}
                >
                  <h3 className="text-xs md:text-base font-bold text-foreground/80 tracking-widest mb-3 md:mb-5 font-sans">{o.title}</h3>
                  <div className="w-full aspect-[3/4.5] rounded-[12px] md:rounded-[16px] overflow-hidden border border-gold/5 bg-white/50 flex items-center justify-center p-0">
                    <img src={o.img} alt={o.title} className="w-full h-full object-cover" />
                  </div>
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-4 pt-4 pb-32">
               <div className="flex items-center gap-6 text-gold/20">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.224 1.224-3.136 2.52-6.528 2.52-5.32 0-9.624-4.304-9.624-9.624s4.304-9.624 9.624-9.624c2.88 0 5.032 1.136 6.592 2.616l2.32-2.32C18.664 1.256 15.8 0 12.48 0 6.312 0 1.296 5.016 1.296 11.184s5.016 11.184 11.184 11.184c3.392 0 5.968-1.12 7.968-3.2 2.072-2.072 2.728-4.968 2.728-7.312 0-.704-.064-1.376-.184-1.936l-10.512.016z"/></svg>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-2.415-2.828 0-1.927 1.572-3.123 3.018-3.123 1.056 0 2.214.654 2.214 1.884 0 1.23-.96 2.153-2.14 2.153-.346 0-.67-.09-.96-.237l-.022.016c.365.807 1.096 1.488 2.305 1.488 1.99 0 3.255-1.63 3.255-3.64 0-2.03-1.64-3.522-3.87-3.522-2.525 0-4.437 1.846-4.437 4.295 0 2.235 1.594 4.17 3.524 4.17.653 0 1.24-.19 1.7-.514l-.004-.002a4.4 4.4 0 0 1-2.168.652z"/></svg>
                  <Sun className="w-6 h-6" strokeWidth={1.5} />
               </div>
               <h2 className="text-xl md:text-3xl font-bold text-[#A08149]/30 tracking-[0.4em] font-sans text-center px-4 uppercase">PSIQUEORÁCULO</h2>
               
               <div className="flex flex-col items-center gap-6 mt-12">
                  <button 
                    onClick={() => setModalAberto('assinatura')}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-gold/10 border border-gold/20 hover:bg-gold/20 transition-all group"
                  >
                    <Crown className="w-4 h-4 text-gold" />
                    <span className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">Seja Premium • R$ 89,00/ano</span>
                  </button>

                  <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-gold/30">
                    <button onClick={() => setModalAberto('ajuda')} className="hover:text-gold/60 transition-colors">Ajuda</button>
                    <span>•</span>
                    <button onClick={() => setModalAberto('politicas')} className="hover:text-gold/60 transition-colors">Políticas</button>
                    <span>•</span>
                    <button onClick={handleLogout} className="hover:text-ruby transition-colors">Sair</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {passo === 1 && (
          <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-right-4 duration-700 relative text-center">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-serif text-gold leading-tight px-4" style={{ fontFamily: 'var(--font-great-vibes)' }}>Onde sua alma busca luz?</h2>
            </div>
            <div className="flex flex-col gap-3 md:gap-4 w-full max-w-sm mx-auto px-4 pb-8">
              {TEMAS.map((t) => (
                <button 
                  key={t.label} 
                  onClick={() => { setTema(t.label); nextPasso(); }} 
                  className={`w-full h-16 md:h-20 rounded-[20px] bg-gradient-to-r ${t.color} p-[1px] shadow-xl hover:scale-[1.03] transition-all group overflow-hidden border border-gold/10`}
                >
                  <div className="w-full h-full bg-black/20 backdrop-blur-sm flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-full bg-white/10 ${t.textColor} group-hover:scale-110 transition-transform`}>
                        <t.icon className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                      <span className={`text-lg md:text-xl font-medium ${t.textColor} tracking-[0.1em] font-sans`}>{t.label}</span>
                    </div>
                    <ChevronLeft className="w-5 h-5 opacity-0 group-hover:opacity-40 rotate-180 transition-all text-white" />
                  </div>
                </button>
              ))}
            </div>
            <div className="pt-2">
               <button onClick={prevPasso} className="text-gold/60 hover:text-gold flex items-center justify-center gap-2 mx-auto text-[9px] font-bold uppercase tracking-[0.2em] bg-white/10 px-8 py-3 rounded-full border border-gold/10 backdrop-blur-md transition-all">
                 <ChevronLeft size={12} /> Mudar Oráculo
               </button>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 relative px-4 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-serif text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>Abra o seu coração</h2>
            </div>
            <div className="relative bg-[#FDFBF7] rounded-[30px] border border-gold/10 p-6 shadow-xl max-w-xl mx-auto">
              <textarea value={desabafo} onChange={(e) => setDesabafo(e.target.value)} placeholder="Escreva aqui sua dúvida..." className="w-full h-40 bg-transparent border-none focus:outline-none text-lg font-light text-foreground/80" />
              <div className="flex flex-col md:flex-row justify-between items-center mt-4 border-t border-gold/5 pt-4 gap-4">
                <button 
                  onMouseDown={startRecording} 
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isGravando ? 'bg-ruby text-white scale-110' : 'bg-gold/5 text-gold border border-gold/10'}`}
                >
                  <Mic size={22} className={isGravando ? 'text-white' : 'text-gold'} /> {isGravando ? 'O Campo está ouvindo...' : 'Segure para Falar'}
                </button>
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

        {passo === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 px-4 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20 shadow-inner">
                <LayoutGrid className="w-10 h-10 text-gold" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif text-gold" style={{ fontFamily: 'var(--font-great-vibes)' }}>Consulte o Invisível</h2>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleCaptureImage}
            />
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 max-w-4xl mx-auto px-8">
              {[
                { id: 'foto', icon: Camera, title: 'Foto do seu Jogo Físico', color: 'bg-emerald-600', action: () => fileInputRef.current?.click() },
                { id: 'completa', icon: LayoutGrid, title: 'Situação, Caminho e Resultado', color: 'bg-ruby', action: () => handleLeitura('completa') },
                { id: 'sim_nao', icon: CheckCircle2, title: 'Sim/Não', color: 'bg-amber-500', action: () => handleLeitura('sim_nao') }
              ].map((m) => (
                <button key={m.id} onClick={m.action} className="w-full max-w-[180px] md:max-w-[200px] flex flex-col items-center gap-4 bg-white border border-gold/10 p-5 rounded-[24px] hover:shadow-2xl transition-all group">
                  <div className={`w-16 h-16 ${m.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-110`}><m.icon size={32} /></div>
                  <h4 className="font-bold text-[9px] md:text-xs text-foreground/80 uppercase tracking-widest leading-tight">{m.title}</h4>
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

        {passo === 4 && resultado && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 space-y-8 pb-24 text-center px-4">
            <div className="space-y-4">
              <div className="inline-block px-6 py-2 bg-gold/10 rounded-full text-[10px] font-bold text-gold uppercase tracking-[0.3em] border border-gold/20">{resultado.oraculo_utilizado} • {resultado.tema}</div>
              <h2 className="text-4xl md:text-6xl font-serif text-gold leading-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>Sua Revelação</h2>
            </div>
            {resultado.situacao_atual ? (
              <div className="space-y-10">
                 <div className="flex flex-row flex-wrap items-start justify-center gap-3 md:gap-8 px-2">
                    <CardResult title="Presente" data={resultado.situacao_atual} index={1} tipoOraculo={tipoOraculo} />
                    <CardResult title="Caminho" data={resultado.caminho_acao} index={2} tipoOraculo={tipoOraculo} />
                    <CardResult title="Síntese" data={resultado.resultado_conselho} index={3} tipoOraculo={tipoOraculo} />
                 </div>
                 <div className="relative p-6 md:p-10 rounded-[32px] bg-white border border-gold/10 shadow-2xl">
                    <p className="text-xl md:text-2xl leading-relaxed text-foreground/80 font-light italic font-sans mb-6">"{resultado.conselho_final}"</p>
                    {resultado.salmo_recomendado && <p className="text-sm font-bold text-gold/80 uppercase tracking-widest bg-gold/5 py-2 px-4 rounded-full border border-gold/10 inline-block">{resultado.salmo_recomendado}</p>}
                 </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="flex justify-center mx-auto">
                  {resultado.carta_sorteada && <CardResult title="A Resposta" data={resultado.carta_sorteada} index={0} tipoOraculo={tipoOraculo} />}
                </div>
                <div className="bg-white rounded-[32px] border border-gold/10 p-6 shadow-2xl">
                  <h3 className="text-2xl font-bold text-gold mb-4 font-sans">{resultado.veredito}</h3>
                  <p className="text-lg leading-relaxed text-foreground/70 font-light mb-6 font-sans">{resultado.previsao}</p>
                  <div className="bg-gold/5 p-4 rounded-2xl border border-gold/10 italic text-base font-sans mb-4">"{resultado.conselho}"</div>
                  {resultado.salmo_recomendado && <p className="text-sm font-bold text-gold/80 uppercase tracking-widest bg-gold/5 py-2 px-4 rounded-full border border-gold/10 inline-block">{resultado.salmo_recomendado}</p>}
                </div>
              </div>
            )}
            <div className="space-y-8">
              {resultado.complemento_terapeutico && (
                <div className="bg-gold/10 p-6 rounded-[24px] border border-gold/20 max-w-2xl mx-auto shadow-inner">
                  <p className="text-xs font-black uppercase tracking-[0.5em] text-gold/40 mb-2">Mantra do Dia</p>
                  <p className="text-xl md:text-2xl font-bold text-gold tracking-tight font-sans animate-in fade-in duration-1000">
                    {resultado.complemento_terapeutico}
                  </p>
                </div>
              )}
              <button onClick={() => { setPasso(0); setResultado(null); setDesabafo(''); }} className="px-12 py-5 rounded-full text-[11px] font-bold uppercase tracking-[0.3em] text-gold border border-gold/20 hover:bg-gold hover:text-white transition-all shadow-lg shadow-gold/10">Novo Ciclo Arquetípico</button>
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

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#2C2420]/60 backdrop-blur-sm" onClick={() => setModalAberto(null)} />
          
          <div className="relative w-full max-w-lg bg-[#FDFBF7] rounded-[32px] border border-gold/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gold/10 flex justify-between items-center bg-white/50">
              <h3 className="text-xl font-serif text-gold capitalize" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                {modalAberto === 'assinatura' ? 'Desperte seu Poder Interior' : modalAberto}
              </h3>
              <button onClick={() => setModalAberto(null)} className="p-2 hover:bg-gold/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-gold" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto font-sans text-foreground/70 leading-relaxed">
              {modalAberto === 'assinatura' && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
                      <Crown className="w-10 h-10 text-gold" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gold/60">Plano Anual Vitalício</p>
                    <div className="text-4xl font-bold text-foreground">R$ 89,00</div>
                  </div>

                  <ul className="space-y-4">
                    {[
                      'Consultas ilimitadas aos 3 oráculos',
                      'Acesso a todas as tiragens especiais',
                      'Leitura de fotos de cartas físicas ilimitadas',
                      'Suporte prioritário e campo energético limpo',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <button className="w-full py-5 bg-gold text-white rounded-[24px] font-bold text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                    Assinar Agora
                  </button>
                  <p className="text-[10px] text-center text-foreground/40 px-4">Pagamento único anual. Acesso imediato a todas as ferramentas de autoconhecimento.</p>
                </div>
              )}

              {modalAberto === 'ajuda' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2">Como Consultar</h4>
                    <p className="text-sm">Escolha seu oráculo, defina um tema e abra seu coração. Você pode digitar sua dúvida ou usar o microfone para gravar seu desabafo.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2">Métodos de Leitura</h4>
                    <p className="text-sm">Oferecemos tiragens virtuais completas (Situação, Caminho e Síntese) ou a análise da sua própria carta física através da câmera.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2">Dúvidas Técnicas?</h4>
                    <p className="text-sm">Entre em contato através do portal de luz: <span className="font-bold">suporte@psiqueoraculo.com</span></p>
                  </div>
                </div>
              )}

              {modalAberto === 'politicas' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2">Privacidade</h4>
                    <p className="text-xs italic">Sua jornada é sagrada. Não armazenamos seus dados sensíveis nem compartilhamos suas consultas. O campo energético é restrito entre você e o oráculo.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gold uppercase text-[10px] tracking-widest mb-2">Termos de Uso</h4>
                    <p className="text-xs italic">O Psiquê Oráculo é uma ferramenta de autoconhecimento e apoio terapêutico. As orientações não substituem acompanhamento médico ou profissional especializado.</p>
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
