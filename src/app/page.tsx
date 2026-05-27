'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Mic, Type, Camera, LayoutGrid, CheckCircle2, ChevronLeft, Heart, Briefcase, DollarSign, Activity, Users, LogOut, Sun, Moon, Star, X, Info, ShieldCheck, Crown, Eye, Wand2, Compass } from 'lucide-react';
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
  { label: 'Amigos', icon: Moon, color: 'from-[#1E293B] via-[#334155] to-[#1E293B]', textColor: 'text-blue-200' },
  { label: 'Amor', icon: Heart, color: 'from-[#450a0a] via-[#991b1b] to-[#450a0a]', textColor: 'text-rose-200' },
  { label: 'Dinheiro', icon: Sun, color: 'from-[#422006] via-[#a16207] to-[#422006]', textColor: 'text-amber-200' },
  { label: 'Saúde', icon: FairyIcon, color: 'from-[#064e3b] via-[#065f46] to-[#064e3b]', textColor: 'text-emerald-200' },
  { label: 'Trabalho', icon: MandalaSmallIcon, color: 'from-[#2e1065] via-[#4c1d95] to-[#2e1065]', textColor: 'text-purple-200' },
];

function CardResult({ title, data, index, tipoOraculo, veredito }: { title: string, data: any, index: number, tipoOraculo: string, veredito?: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [useCustomFallback, setUseCustomFallback] = useState(true);
  
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos' };
  const folder = folderMap[tipoOraculo] || 'taro';
  
  const normalizedSlug = (data.card_slug || '').replace(/_/g, '-').toLowerCase().trim();

  const customMap: Record<string, string> = {
    'o-louco': '00_louco.png.jpeg', 'o-mago': '01_mago.png.jpeg', 'a-sacerdotisa': '02_sacerdotisa.png.jpeg', 'a-imperatriz': '03_imperatriz.png.jpeg', 'o-imperador': '04_imperador.png.jpeg', 'o-hierofante': '5_opapa.png.jpeg', 'os-amantes': '06_enamorados.png.jpeg', 'o-carro': '07_carro.png.jpeg', 'a-justica': '08_justiça.png.jpeg', 'o-eremita': '09_eremita.jpeg', 'roda-da-fortuna': '10_sol.png.jpeg', 'a-forca': '11_força.png.jpeg', 'o-pendurado': '12_enforcado.png.jpeg', 'a-morte': '13_morte.png.jpeg', 'a-temperanca': '14_temperança.png.jpeg', 'o-diabo': '15_diabo.png.jpeg', 'a-torre': '16_torre.png.jpeg', 'a-estrela': '18_estrela.png.jpeg', 'a-lua': '12_lua.png.jpeg', 'o-sol': '19_sol.png.jpeg', 'o-julgamento': '20_julgamento.png.jpeg', 'o-mundo': '21_mundo.png.jpeg'
  };

  const customFile = customMap[normalizedSlug];
  let imagePath = (tipoOraculo === 'Tarô' && customFile && useCustomFallback) ? `/assets/decks/taro/custom/${customFile}` : (useLocalFallback ? `/assets/decks/${folder}/${normalizedSlug}.jpg` : (data.image_url || `/assets/decks/${folder}/${normalizedSlug}.jpg`));

  return (
    <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-4 duration-700 shrink-0" style={{ animationDelay: `${index * 150}ms` }}>
      <h5 className="text-[7px] font-bold uppercase tracking-widest text-gold/60">{title}</h5>
      <div className="w-[80px] md:w-[110px] aspect-[3/5] bg-white rounded-lg border border-gold/20 p-0.5 shadow-sm overflow-hidden relative">
        <div className="w-full h-full rounded-md overflow-hidden bg-[#FDFBF7] flex items-center justify-center">
           {!imageError ? (
             <img src={imagePath} alt={data.carta} className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`} onLoad={() => setImageLoading(false)} onError={() => { if (tipoOraculo === 'Tarô' && customFile && useCustomFallback) setUseCustomFallback(false); else if (!useLocalFallback) setUseLocalFallback(true); else setImageError(true); }} />
           ) : (
             <div className="p-1 text-center"><span className="text-gold font-serif text-[7px] leading-tight">{data.carta}</span></div>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
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
        
        console.log("Buscando Mensagem do Dia em:", apiUrl);
        
        const res = await fetch(apiUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ tipoOraculo: 'Geral', tipoLeitura: 'mensagem_dia', tema: 'Motivação e Bem-estar', userName: userName }) 
        }).catch(err => {
          console.error("Erro de rede na Mensagem do Dia:", err);
          return null;
        });

        if (res && res.ok) {
          const dataRes = await res.json();
          if (dataRes.acolhimento_quantum) {
            const novaMensagem = { texto: dataRes.acolhimento_quantum.conteudo, autor: dataRes.acolhimento_quantum.titulo, data: today };
            setMensagemDia({ texto: novaMensagem.texto, autor: novaMensagem.autor });
            localStorage.setItem('psique_mensagem_dia', JSON.stringify(novaMensagem));
          }
        }
      } catch (e) { console.error("Erro Mensagem Dia:", e); }
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
      
      // Melhoria: Detectar se estamos em desenvolvimento ou Mobile para decidir a URL
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pisiqueoraculo.com.br';
      
      // No Mobile, precisamos de URL absoluta. Na Web, usamos relativo /api/...
      const apiUrl = isNative ? `${siteUrl}/api/oracle/read` : `/api/oracle/read`;

      console.log("Chamando Portal IA em:", apiUrl);
      console.log("Payload enviado:", { tipoOraculo, tipoLeitura: tipo, tema });

      const res = await fetch(apiUrl, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '' 
        },
        body: JSON.stringify({ tipoOraculo, tipoLeitura: tipo, tema, pergunta: desabafo, cartas: cartasSorteadas, imagem: imageData || null, userName })
      }).catch(err => {
        console.error("ERRO DE REDE DETECTADO:");
        console.error("- Mensagem:", err.message);
        console.error("- Causa:", err.cause);
        console.error("- Stack:", err.stack);
        
        if (isNative) {
          alert(`Erro de Conexão Mobile: ${err.message}\nURL: ${apiUrl}`);
        }
        
        throw new Error(`Falha de conexão: ${err.message}. Verifique se o servidor está online.`);
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erro na Resposta da IA (Texto):", errorText);
        let errorMsg = "Silêncio no Portal.";
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }
      
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
      } catch (e) {
        console.warn("Permissões de áudio não concedidas ou não suportadas:", e);
      }
    };
    requestPermissions();
  }, []);

  const startRecording = async () => {
    try {
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      
      if (!isNative) {
        // Fallback para Web (opcional ou apenas aviso)
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

      // Lógica Nativa Capacitor
      const { available } = await SpeechRecognition.available();
      if (available) {
        setIsGravando(true);
        SpeechRecognition.start({
          language: "pt-BR",
          partialResults: true,
          popup: true, // Melhor para compatibilidade visual no Android
        });

        const partialListener = SpeechRecognition.addListener("partialResults", (data: any) => {
          if (data.matches && data.matches.length > 0) {
            setDesabafo(data.matches[0]);
          }
        });
      } else {
        toast.error("Reconhecimento de voz não disponível neste aparelho.");
      }
    } catch (err: any) {
      console.error(err);
      setIsGravando(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsGravando(false);
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      if (isNative) {
        await SpeechRecognition.stop();
        // Pequeno atraso antes de remover ouvintes para garantir que o último resultado chegue
        setTimeout(() => {
          SpeechRecognition.removeAllListeners();
        }, 500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-[100dvh] w-full text-[#5C4D3C] font-sans flex flex-col items-center relative bg-[#FDFBF7] overflow-hidden p-safe">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <img src="/assets/brand/mandala-login.png" alt="" className="w-[150%] max-w-none animate-spin-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md h-full flex flex-col items-center px-6 py-6 overflow-hidden">
        
        {/* Cabeçalho Fixo */}
        <div className="flex flex-col items-center mb-4 shrink-0">
           <div className="w-14 h-14 relative">
              <img src="/assets/brand/mandala-login.png" alt="Mandala" className="w-full h-full object-contain animate-spin-slow" />
           </div>
        </div>

        {passo === 0 && (
          <div className="flex-1 flex flex-col items-center justify-between w-full animate-in fade-in slide-in-from-bottom-4 duration-700 py-2">
            <h2 className="text-2xl font-serif text-[#C4A484] text-center px-4">Qual arcano você escolhe hoje?</h2>
            {mensagemDia && (
              <div onClick={() => setModalAberto('mensagem_ampliada')} className="w-full max-h-[140px] p-4 bg-white/40 backdrop-blur-sm rounded-[24px] border border-[#E5D9C3] shadow-sm relative overflow-hidden group cursor-pointer flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-2">
                  <span className="text-[7px] font-black uppercase tracking-widest text-[#C4A484]/60">Sintonização do Dia</span>
                  <p className="text-xs italic text-[#5C4D3C] font-serif leading-relaxed line-clamp-2">"{mensagemDia.texto}"</p>
                  <span className="text-[7px] font-medium uppercase tracking-widest text-[#8B735B] animate-pulse">Toque para ampliar ✨</span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 w-full max-w-[240px] px-4">
              {[
                { id: 'Tarô', title: 'TARÔ CLÁSSICO', img: '/assets/decks/covers/taro.jpg' },
                { id: 'Baralho Cigano', title: 'BARALHO CIGANO', img: '/assets/decks/covers/cigano.jpg' },
                { id: 'Tarô dos Anjos', title: 'TARÔ DOS ANJOS', img: '/assets/decks/covers/anjos.jpg' }
              ].map((o) => (
                <button key={o.id} onClick={() => { setTipoOraculo(o.id); nextPasso(); }} className="flex items-center gap-4 group w-full bg-white/40 backdrop-blur-sm border border-[#E5D9C3] p-2 rounded-2xl shadow-sm active:scale-95 transition-all">
                  <div className="w-12 h-18 bg-white rounded-xl border border-[#E5D9C3] p-0.5 overflow-hidden shrink-0">
                    <img src={o.img} alt={o.title} className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.2em] text-[#8B735B] uppercase text-left">{o.title}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 w-full shrink-0">
               <h1 className="text-xl font-serif text-[#C4A484] tracking-tight opacity-40">Psiquê Oráculo</h1>
               
               <div className="flex items-center gap-2 w-full justify-center flex-wrap">
                  <button onClick={() => setModalAberto('assinatura')} className="flex items-center gap-2 rounded-full border border-[#E5D9C3] bg-white/50 px-4 py-2 shadow-sm active:scale-95 transition-all">
                    <Crown className="w-3 h-3 text-[#C4A484]" />
                    <span className="text-[8px] font-bold text-[#8B735B] uppercase tracking-widest">Premium</span>
                  </button>
                  <button onClick={() => setModalAberto('ajuda')} className="text-[7px] font-bold uppercase tracking-widest text-[#C4A484]/60 bg-white/30 px-3 py-2 rounded-full border border-[#E5D9C3]/50">Ajuda</button>
                  <button onClick={() => setModalAberto('politicas')} className="text-[7px] font-bold uppercase tracking-widest text-[#C4A484]/60 bg-white/30 px-3 py-2 rounded-full border border-[#E5D9C3]/50">Políticas</button>
                  <button onClick={handleLogout} className="text-[7px] font-bold uppercase tracking-widest text-[#991b1b]/50 bg-white/30 px-3 py-2 rounded-full border border-[#E5D9C3]/50">Sair</button>
               </div>
            </div>
          </div>
        )}

        {passo === 1 && (
          <div className="flex-1 flex flex-col items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-700 py-4">
            <h2 className="text-2xl font-serif text-[#C4A484] text-center px-4">Onde sua alma busca luz?</h2>
            <div className="flex flex-col gap-2 w-full">
              {TEMAS.map((t) => (
                <button key={t.label} onClick={() => { setTema(t.label); nextPasso(); }} className={`w-full h-12 rounded-xl bg-gradient-to-r ${t.color} p-[1px] shadow-sm active:scale-[0.98] transition-all`}><div className="w-full h-full bg-black/40 backdrop-blur-md rounded-[11px] flex items-center justify-between px-6"><div className="flex items-center gap-4"><t.icon className="w-4 h-4 text-white/90" /><span className="text-sm font-medium text-white/95 tracking-wide">{t.label}</span></div><ChevronLeft className="w-3 h-3 rotate-180 opacity-40 text-white" /></div></button>
              ))}
            </div>
            <button onClick={prevPasso} className="mt-8 py-2 px-6 rounded-full bg-white/40 border border-[#E5D9C3] text-[8px] font-bold uppercase tracking-widest text-[#C4A484] active:scale-95 transition-all">‹ Mudar Oráculo</button>
          </div>
        )}

        {passo === 2 && (
          <div className="flex-1 flex flex-col items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-700 py-6">
            <h2 className="text-2xl font-serif text-[#C4A484] text-center px-4">Abra o seu coração</h2>
            <div className="flex-1 w-full max-w-[340px] flex flex-col justify-center">
              <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-[#E5D9C3] p-6 shadow-xl w-full">
                <textarea value={desabafo} onChange={(e) => setDesabafo(e.target.value)} placeholder="Escreva sua dúvida..." className="w-full h-32 bg-transparent border-none focus:outline-none text-base font-light text-[#5C4D3C] resize-none" />
                <div className="space-y-3 pt-4 border-t border-[#E5D9C3]/30">
                  <button 
                    onMouseDown={startRecording} 
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`w-full py-3 rounded-full flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all ${isGravando ? 'bg-red-500 text-white animate-pulse' : 'bg-[#C4A484]/10 text-[#C4A484] border border-[#C4A484]/20'} active:scale-95`}
                  >
                    <Mic size={16} /> {isGravando ? 'Ouvindo...' : 'Segure para Falar'}
                  </button>
                  <button onClick={nextPasso} disabled={!desabafo && !isGravando} className="w-full bg-[#C4A484] text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg disabled:opacity-20 active:scale-95">Prosseguir</button>
                </div>
              </div>
            </div>
            <button onClick={prevPasso} className="mt-6 text-[8px] font-bold uppercase tracking-widest text-[#C4A484]">‹ Trocar Foco ({tema})</button>
          </div>
        )}

        {passo === 3 && (
          <div className="flex-1 flex flex-col items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-700 py-10">
            <h2 className="text-2xl font-serif text-[#C4A484] text-center px-4">Consulte o Invisível</h2>
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              {[{ id: 'foto', icon: Eye, title: 'Visão do Jogo Físico', color: 'bg-[#065f46]' }, { id: 'completa', icon: Wand2, title: 'Caminho do Destino', color: 'bg-[#991b1b]' }, { id: 'sim_nao', icon: Compass, title: 'Bússola Sim ou Não', color: 'bg-[#a16207]' }].map((m) => (
                <button key={m.id} onClick={() => handleLeitura(m.id)} className="w-full h-14 flex items-center gap-4 bg-white border border-[#E5D9C3] px-5 rounded-[18px] shadow-md active:scale-[0.98] transition-all"><div className={`w-8 h-8 ${m.color} rounded-lg flex items-center justify-center text-white shadow-sm`}><m.icon size={16} /></div><h4 className="font-bold text-[9px] text-[#5C4D3C] uppercase tracking-widest text-left">{m.title}</h4></button>
              ))}
            </div>
            <button onClick={prevPasso} className="mt-8 text-[8px] font-bold uppercase tracking-widest text-[#C4A484]">‹ Refazer Pergunta</button>
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
                {resultado.situacao_atual && (
                  <CardResult 
                    title="Situação" 
                    data={resultado.situacao_atual} 
                    index={1} 
                    tipoOraculo={tipoOraculo} 
                  />
                )}
                {resultado.caminho_acao && (
                  <CardResult 
                    title="Conselho" 
                    data={resultado.caminho_acao} 
                    index={2} 
                    tipoOraculo={tipoOraculo} 
                  />
                )}
                {resultado.resultado_conselho && (
                  <CardResult 
                    title="Resultado" 
                    data={resultado.resultado_conselho} 
                    index={3} 
                    tipoOraculo={tipoOraculo} 
                  />
                )}
                {!resultado.situacao_atual && resultado.carta_sorteada && (
                   <div className="flex flex-col items-center gap-4">
                      <CardResult title="O Arcano" data={resultado.carta_sorteada} index={0} tipoOraculo={tipoOraculo} />
                      {resultado.leitura_caminho?.veredito_direto && (
                        <div className="bg-[#C4A484]/20 px-8 py-3 rounded-2xl border-2 border-[#C4A484]/30 animate-bounce shadow-lg">
                          <span className="text-2xl font-black text-[#C4A484] uppercase tracking-[0.3em]">
                            {resultado.leitura_caminho.veredito_direto.split(' ')[0]}
                          </span>
                        </div>
                      )}
                   </div>
                )}
              </div>

              <div className="w-full space-y-6 pb-6">
                 {/* Card de Leitura - Único que Rola Conteúdo Longo */}
                 <div className="bg-[#2C2420] rounded-[32px] border border-white/5 p-8 shadow-2xl text-white/90 relative overflow-hidden">
                    <h3 className="text-[#C4A484] font-serif text-xl mb-4">{resultado.leitura_caminho?.titulo || "A Voz do Destino"}</h3>
                    <p className="text-sm leading-relaxed text-white/80 font-sans font-light text-justify">
                      {resultado.leitura_caminho?.analise_detalhada}
                    </p>
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
                       {resultado.ancoragem_rituais.banho && <div className="flex items-start gap-4"><div className="w-6 h-6 rounded-full bg-[#C4A484]/10 flex items-center justify-center shrink-0 text-[#C4A484]"><Activity size={14} /></div><div className="space-y-0.5"><span className="text-[7px] font-black uppercase tracking-widest text-[#C4A484]/60">Ação Mística</span><p className="text-xs text-[#5C4D3C]/80 leading-relaxed">{resultado.ancoragem_rituais.banho}</p></div></div>}
                     </div>
                   </div>
                 )}

                 {resultado.acolhimento_quantum && (
                   <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F2EA] rounded-[32px] border border-[#C4A484]/20 p-8 text-center shadow-inner italic">
                     <div className="text-[#C4A484] mb-4 flex justify-center"><Heart size={24} className={tipoOraculo === 'Tarô' ? 'animate-pulse' : ''} /></div>
                     <h4 className="text-[#C4A484] font-serif text-lg mb-2">
                       {tipoOraculo === 'Tarô' ? 'Mantra da Alma' : resultado.acolhimento_quantum.titulo}
                     </h4>
                     <p className={`text-xs text-[#5C4D3C]/70 leading-relaxed ${tipoOraculo === 'Tarô' ? 'animate-pulse font-bold text-[#C4A484]' : ''}`}>
                       {tipoOraculo === 'Tarô' ? resultado.ancoragem_rituais?.mantra || resultado.acolhimento_quantum.conteudo : resultado.acolhimento_quantum.conteudo}
                     </p>
                   </div>
                 )}
              </div>
            </div>

            <div className="w-full pt-4 pb-2 flex flex-col items-center gap-4 shrink-0">
               {resultado.acolhimento_psicologico && (
                 <button 
                   onClick={() => setPasso(5)} 
                   className="text-[10px] font-bold uppercase tracking-[0.2em] text-white py-3 px-8 bg-[#2C2420] rounded-full shadow-lg border border-[#C4A484]/30 animate-pulse hover:bg-[#4A3B28] transition-all"
                 >
                   Quer um conselho do Psico? 👨‍⚕️
                 </button>
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
                  <div className="absolute -top-10 -left-10 opacity-[0.03] rotate-12">
                     <Users size={200} className="text-[#C4A484]" />
                  </div>
                  
                  <h3 className="text-xl font-serif text-[#5C4D3C] text-center border-b border-[#E5D9C3]/30 pb-4">
                     {resultado.acolhimento_psicologico.titulo}
                  </h3>

                  <div className="space-y-4">
                    <p className="text-sm md:text-base leading-relaxed text-[#5C4D3C]/90 font-sans font-light text-justify first-letter:text-3xl first-letter:font-serif first-letter:text-[#C4A484] first-letter:mr-2">
                       {resultado.acolhimento_psicologico.conteudo}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-[#E5D9C3]/30">
                    <p className="text-[10px] text-center italic text-[#8B735B]/80 font-serif">
                       "O autoconhecimento é o portal para a cura da alma."
                    </p>
                  </div>
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
                {/* Cabeçalho do Print */}
                <div className="w-full flex justify-between items-center px-6 py-4 shrink-0 bg-white/20">
                  <span className="text-2xl italic font-serif text-[#C4A484] lowercase tracking-tight opacity-70">mensagem_ampliada</span>
                  <button onClick={() => setModalAberto(null)} className="p-2 text-[#C4A484] hover:opacity-50 transition-opacity"><X size={28} strokeWidth={1} /></button>
                </div>

                <div className="flex-1 w-full overflow-y-auto px-8 flex flex-col items-center justify-center text-center py-6">
                  {/* Ícone Circular Estelar */}
                  <div className="w-28 h-24 rounded-full bg-[#F5F2EA] flex items-center justify-center shrink-0 mb-10">
                    <Sparkles size={56} className="text-[#C4A484]" strokeWidth={0.8} />
                  </div>

                  <div className="space-y-8 max-w-[320px]">
                    <h4 className="text-[11px] font-sans font-black tracking-[0.4em] text-[#C4A484] uppercase opacity-80">
                      Sintonização e Bem-estar
                    </h4>
                    
                    <p className="text-2xl italic font-serif text-[#5C4D3C] leading-relaxed">
                      "{mensagemDia.texto}"
                    </p>

                    <div className="flex flex-col items-center gap-6 pt-6">
                      <div className="w-20 h-[0.5px] bg-[#C4A484]/20" />
                      <span className="text-xs font-sans font-bold tracking-[0.2em] text-[#C4A484] uppercase">
                        {mensagemDia.autor || "Abraço da Alma"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botão Inferior do Print */}
                <div className="w-full px-10 pb-10 pt-4 shrink-0">
                  <button 
                    onClick={() => setModalAberto(null)} 
                    className="w-full py-5 bg-[#C4A484] text-white rounded-[45px] font-sans font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-95 transition-all hover:bg-[#B39373]"
                  >
                    Receber com Gratidão ✨
                  </button>
                </div>
              </div>
            )}

            {modalAberto !== 'mensagem_ampliada' && (
              <>
                <div className="p-5 border-b border-[#E5D9C3]/30 flex justify-between items-center bg-white/50">
                  <h3 className="text-xl font-serif text-[#C4A484]">{modalAberto === 'assinatura' ? 'Portal da Abundância' : modalAberto}</h3>
                  <button onClick={() => setModalAberto(null)} className="p-2"><X className="w-5 h-5 text-[#C4A484]" /></button>
                </div>
                <div className="p-6 overflow-y-auto text-center">
                  {modalAberto === 'assinatura' && (
                    <div className="space-y-5">
                      <div className="w-16 h-16 bg-[#C4A484]/10 rounded-full flex items-center justify-center mx-auto"><Crown className="w-8 h-8 text-[#C4A484]" /></div>
                      <h4 className="text-lg font-bold">Jornada de Conexão</h4>
                      <p className="text-[10px] leading-relaxed opacity-70">Acesse consultas ilimitadas, rituais e banhos exclusivos.</p>
                      <div className="bg-[#C4A484]/5 p-4 rounded-2xl border border-[#C4A484]/20">
                        <div className="text-2xl font-black text-[#C4A484]">R$ 89,00<span className="text-[8px] opacity-40 ml-1">/ano</span></div>
                      </div>
                      <button className="w-full py-4 bg-gradient-to-r from-[#C4A484] to-[#8B735B] text-white rounded-xl font-bold uppercase tracking-widest text-[9px]">Desbloquear Acesso</button>
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
