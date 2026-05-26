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
  
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos', 'Runas': 'runas' };
  const folder = folderMap[tipoOraculo] || 'taro';
  
  const normalizedSlug = (data.card_slug || '').replace(/_/g, '-').toLowerCase().trim();

  const customMap: Record<string, string> = {
    'o-louco': '00_louco.png.jpeg',
    'o-mago': '01_mago.png.jpeg',
    'a-sacerdotisa': '02_sacerdotisa.png.jpeg',
    'a-imperatriz': '03_imperatriz.png.jpeg',
    'o-louco': '00_louco.png.jpeg',
    'o-mago': '01_mago.png.jpeg',
    'a-sacerdotisa': '02_sacerdotisa.png.jpeg',
    'a-imperatriz': '03_imperatriz.png.jpeg',
    'o-imperador': '04_imperador.png.jpeg',
    'o-hierofante': '5_opapa.png.jpeg',
    'os-amantes': '06_enamorados.png.jpeg',
    'o-carro': '07_carro.png.jpeg',
    'a-justica': '08_justiça.png.jpeg',
    'o-eremita': '09_eremita.jpeg',
    'roda-da-fortuna': '10_sol.png.jpeg', 
    'a-forca': '11_força.png.jpeg',
    'o-pendurado': '12_enforcado.png.jpeg',
    'a-morte': '13_morte.png.jpeg',
    'a-temperanca': '14_temperança.png.jpeg',
    'o-diabo': '15_diabo.png.jpeg',
    'a-torre': '16_torre.png.jpeg',
    'a-estrela': '18_estrela.png.jpeg',
    'a-lua': '12_lua.png.jpeg', 
    'o-sol': '19_sol.png.jpeg',
    'o-julgamento': '20_julgamento.png.jpeg',
    'o-mundo': '21_mundo.png.jpeg'
  };

  const customFile = customMap[normalizedSlug];
  
  let imagePath = (tipoOraculo === 'Tarô' && customFile && useCustomFallback)
    ? `/assets/decks/taro/custom/${customFile}`
    : (useLocalFallback 
        ? `/assets/decks/${folder}/${normalizedSlug}.jpg`
        : (data.image_url || `/assets/decks/${folder}/${normalizedSlug}.jpg`));

  useEffect(() => {
    if (data.carta) {
      console.log(`[Oráculo Debug] Carta: ${data.carta} | Slug: ${normalizedSlug} | Path: ${imagePath}`);
    }
  }, [data.carta, normalizedSlug, imagePath]);

  return (
    <div className="flex flex-col items-center gap-2 md:gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out" style={{ animationDelay: `${index * 200}ms` }}>
      <h5 className="text-[7px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60 text-center leading-none mb-1">{title}</h5>
      <div className="w-[85px] md:w-[180px] relative aspect-[3/4.5] bg-white rounded-[12px] md:rounded-[24px] border border-gold/20 p-1 md:p-2 shadow-[0_10px_30px_rgba(212,185,130,0.15)] group overflow-hidden">
        {imageLoading && !imageError && (
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        )}
        <div className="w-full h-full rounded-[10px] md:rounded-[18px] overflow-hidden bg-[#FDFBF7] flex items-center justify-center relative">
           {!imageError ? (
             <img 
               src={imagePath} 
               alt={data.carta} 
               className={`w-full h-full object-contain transition-all duration-1000 ${imageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} group-hover:scale-110`}
               onLoad={() => setImageLoading(false)}
               onError={() => {
                 if (tipoOraculo === 'Tarô' && customFile && useCustomFallback) {
                   setUseCustomFallback(false);
                 } else if (!useLocalFallback) {
                   setUseLocalFallback(true);
                 } else {
                   setImageError(true);
                   setImageLoading(false);
                 }
               }} 
             />
           ) : (
             <div className="p-4 text-center bg-gold/5 w-full h-full flex flex-col items-center justify-center gap-2">
               <Sparkles className="text-gold/20 w-8 h-8" />
               <span className="text-gold font-serif text-[8px] md:text-sm italic leading-tight">{data.carta}</span>
             </div>
           )}
           <div className="absolute inset-0 pointer-events-none border-[0.5px] border-gold/10 rounded-[10px] md:rounded-[18px] m-0.5 md:m-1" />
        </div>
      </div>
      {veredito && (
        <div className="mt-2 text-center animate-in fade-in zoom-in duration-1000 delay-500">
          <span className={`text-xs md:text-lg font-black tracking-[0.2em] uppercase ${
            veredito.startsWith('SIM') ? 'text-emerald-600' : 
            veredito.startsWith('NÃO') ? 'text-rose-600' : 'text-amber-600'
          }`}>
            {veredito.split(' ')[0]}
          </span>
        </div>
      )}
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
          if (data === today) {
            setMensagemDia({ texto, autor });
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        const userName = localStorage.getItem('psique_user_name') || session?.user?.user_metadata?.full_name || "Alma Querida";
        
        const res = await fetch('/api/oracle/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tipoOraculo: 'Geral', 
            tipoLeitura: 'mensagem_dia', 
            tema: 'Motivação e Bem-estar',
            userName: userName
          })
        });
        const dataRes = await res.json();
        if (dataRes.acolhimento_quantum) {
          const novaMensagem = { 
            texto: dataRes.acolhimento_quantum.conteudo, 
            autor: dataRes.acolhimento_quantum.titulo,
            data: today
          };
          setMensagemDia({ texto: novaMensagem.texto, autor: novaMensagem.autor });
          localStorage.setItem('psique_mensagem_dia', JSON.stringify(novaMensagem));
        }
      } catch (e) { console.error("Erro ao carregar mensagem do dia:", e); }
    };
    fetchMensagemDia();
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await SpeechRecognition.requestPermissions();
        await VoiceRecorder.requestAudioRecordingPermission();
      } catch (e) {
        console.warn("Permissões de áudio não concedidas:", e);
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const isDemo = localStorage.getItem('psique_demo_mode') === 'true';
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !isDemo) { router.push('/login'); return; } 
      if (session) {
        setUser(session.user);
        try {
          const { data: profile, error } = await supabase.from('profiles').select('subscription_status, subscription_end_date').eq('id', session.user.id).single();
          if (!error && profile) {
            const now = new Date();
            const endDate = profile.subscription_end_date ? new Date(profile.subscription_end_date) : null;
            const isActive = profile.subscription_status === 'active' && endDate && endDate >= now;
            if (!isActive && !isDemo) { setModalAberto('assinatura'); toast.info('Sua assinatura expirou ou é inexistente.'); }
          }
        } catch (e) { console.error(e); }
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
      const isAvailable = await SpeechRecognition.available();
      if (isAvailable) {
        const permissionStatus = await SpeechRecognition.checkPermissions();
        if (permissionStatus.speechRecognition !== 'granted') { await SpeechRecognition.requestPermissions(); }
        setIsGravando(true); setDesabafo(""); 
        SpeechRecognition.start({ language: "pt-BR", maxResults: 1, prompt: "Sintonizando sua voz...", partialResults: true, popup: true });
        SpeechRecognition.addListener('partialResults', (data: any) => { if (data.matches && data.matches.length > 0) { setDesabafo(data.matches[0]); } });
        try { await VoiceRecorder.startRecording(); } catch (e) { console.warn(e); }
      } else { toast.error("Reconhecimento de voz não disponível."); }
    } catch (err: any) { toast.error('O portal de voz não pôde ser aberto.'); setIsGravando(false); }
  };

  const stopRecording = async () => {
    if (!isGravando) return;
    try {
      setIsGravando(false);
      await SpeechRecognition.stop();
      SpeechRecognition.removeAllListeners();
      const result = await VoiceRecorder.stopRecording();
      if (result.value && result.value.recordDataBase64) {
        setAudioBase64(`data:${result.value.mimeType};base64,${result.value.recordDataBase64}`);
        toast.success('Sintonizado.');
      }
    } catch (err) { console.error(err); }
  };

  const handleCaptureImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height; const maxDim = 1200;
          if (width > height && width > maxDim) { height *= maxDim / width; width = maxDim; }
          else if (height > maxDim) { width *= maxDim / height; height = maxDim; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          handleLeitura('foto', compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLeitura = async (tipo: string, imageData?: string) => {
    setLoading(true);
    try {
      let finalImageUrl = imageData;
      if (tipo === 'foto' && imageData) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id || 'anonymous';
          const fileName = `${userId}_${Date.now()}.jpg`;
          const blob = await fetch(imageData).then(res => res.blob());
          const { data: uploadData, error: uploadError } = await supabase.storage.from('cartas-usuarios').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage.from('cartas-usuarios').getPublicUrl(fileName);
            finalImageUrl = publicUrl;
          }
        } catch (uploadErr) { console.error(uploadErr); }
      }

      const cartasSorteadas = tipo === 'foto' ? null : (tipo === 'completa' ? await drawCards(tipoOraculo, 3) : await drawCards(tipoOraculo, 1));
      const { data: { session } } = await supabase.auth.getSession();
      const userName = localStorage.getItem('psique_user_name') || session?.user?.user_metadata?.full_name || "Consulente";
      
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;
      const API_BASE_URL = isNative ? 'https://pisiqueoraculo.com.br' : ''; 
      const fetchUrl = `${API_BASE_URL}/api/oracle/read`;
      
      console.log(`Tentando conexão (${isNative ? 'Nativo' : 'Web'}) em:`, fetchUrl);
      
      const payload = { 
        tipoOraculo, tipoLeitura: tipo, tema, pergunta: desabafo, 
        cartas: cartasSorteadas, imagem: imageData || null, 
        imageUrl: finalImageUrl, audio: audioBase64, userName 
      };

      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.error("Erro de Rede:", err);
        throw new Error(`Erro de conexão: ${err.message || 'Sem sinal com o servidor'}`);
      });

      if (!res.ok) {
        const errorDetail = await res.text().catch(() => "Erro desconhecido");
        console.error("Erro Servidor:", res.status, errorDetail);
        throw new Error(`O Oráculo está em silêncio (Erro ${res.status}).`);
      }

      const data = await res.json();
      console.log("Resposta recebida com sucesso!");
      if (data.error) throw new Error(data.details || data.error);
      
      if (cartasSorteadas && Array.isArray(cartasSorteadas)) {
        if (data.situacao_atual) data.situacao_atual.card_slug = cartasSorteadas[0]?.slug;
        if (data.caminho_acao) data.caminho_acao.card_slug = cartasSorteadas[1]?.slug;
        if (data.resultado_conselho) data.resultado_conselho.card_slug = cartasSorteadas[2]?.slug;
        if (data.carta_sorteada) data.carta_sorteada.card_slug = cartasSorteadas[0]?.slug;
      }

      setResultado(data); setPasso(4); 
    } catch (error: any) { toast.error(`Falha: ${error.message}`); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full text-[#5C4D3C] font-sans flex flex-col items-center relative bg-[#FDFBF7] overflow-x-hidden">
      
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <img src="/assets/brand/mandala-login.png" alt="" className="w-[150%] max-w-none animate-spin-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md flex-1 flex flex-col items-center px-6 pt-6 pb-24">
        
        <div className={`transition-all duration-1000 flex flex-col items-center mb-6 ${passo === 0 ? "mt-2" : "mt-0"}`}>
           <div className="w-20 h-20 md:w-32 md:h-32 relative mb-4">
              <img src="/assets/brand/mandala-login.png" alt="Mandala" className="w-full h-full object-contain animate-spin-slow" />
           </div>
        </div>

        {passo === 0 && (
          <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-serif text-[#C4A484] text-center mb-10 italic" style={{ fontFamily: 'var(--font-great-vibes)' }}>
              Qual arcano você escolhe hoje?
            </h2>

            {mensagemDia && (
              <div 
                onClick={() => setModalAberto('mensagem_ampliada')}
                className="w-full mb-10 p-6 bg-white/40 backdrop-blur-sm rounded-[24px] border border-[#E5D9C3] shadow-sm animate-in fade-in zoom-in-95 duration-1000 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all hover:shadow-md animate-pulse-subtle"
              >
                <div className="absolute -top-2 -right-2 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <Sparkles size={48} className="text-[#C4A484]" />
                </div>
                <div className="flex flex-col items-center text-center space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C4A484]/60">Sintonização do Dia</span>
                  <p className="text-sm md:text-base italic text-[#5C4D3C] font-serif leading-relaxed line-clamp-3">"{mensagemDia.texto}"</p>
                  <div className="w-10 h-[1px] bg-[#C4A484]/20" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-[#C4A484] tracking-widest flex items-center gap-2">
                      {mensagemDia.autor}
                    </span>
                    <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-[#C4A484]/40 flex items-center gap-1 animate-pulse">
                      Toque para ampliar ✨
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-12">
              {[
                { id: 'Tarô', title: 'TARÔ', img: '/assets/decks/covers/taro.jpg' },
                { id: 'Baralho Cigano', title: 'CIGANO', img: '/assets/decks/covers/cigano.jpg' },
                { id: 'Tarô dos Anjos', title: 'ANJOS', img: '/assets/decks/covers/anjos.jpg' },
                { id: 'Runas', title: 'RUNAS', img: '/assets/decks/covers/runas.jpg' }
              ].map((o) => (
                <button key={o.id} onClick={() => { setTipoOraculo(o.id); nextPasso(); }} className="flex flex-col items-center group">
                  <div className="w-full aspect-[3/5.2] bg-white rounded-2xl border-2 border-[#E5D9C3] p-1 shadow-md group-active:scale-95 transition-all mb-2 overflow-hidden">
                    <img src={o.img} alt={o.title} className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#8B735B]">{o.title}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-6 w-full">
               <h1 className="text-4xl md:text-5xl font-serif text-[#C4A484] tracking-tight text-center opacity-40 italic" style={{ fontFamily: 'var(--font-great-vibes)' }}>Psiquê Oráculo</h1>
               
               <button onClick={() => setModalAberto('assinatura')} className="w-full max-w-[220px] h-14 flex items-center justify-center gap-3 rounded-full border-2 border-[#E5D9C3] bg-white/50 backdrop-blur-sm shadow-sm active:scale-95 transition-all">
                  <Crown className="w-5 h-5 text-[#C4A484]" />
                  <span className="text-xs font-bold text-[#8B735B] uppercase tracking-[0.3em]">Premium</span>
               </button>

               <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[#C4A484]/40 mt-4">
                  <button onClick={() => setModalAberto('ajuda')}>Ajuda</button>
                  <span className="w-1.5 h-1.5 bg-[#C4A484]/20 rounded-full" />
                  <button onClick={() => setModalAberto('politicas')}>Políticas</button>
                  <span className="w-1.5 h-1.5 bg-[#C4A484]/20 rounded-full" />
                  <button onClick={handleLogout} className="text-[#991b1b]/40">Sair</button>
               </div>
            </div>
          </div>
        )}

        {passo === 1 && (
          <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-serif text-[#C4A484] text-center mb-12 italic" style={{ fontFamily: 'var(--font-great-vibes)' }}>
              Onde sua alma busca luz?
            </h2>
            
            <div className="flex flex-col gap-4 w-full">
              {TEMAS.map((t) => (
                <button key={t.label} onClick={() => { setTema(t.label); nextPasso(); }} className={`w-full h-16 rounded-[22px] bg-gradient-to-r ${t.color} p-[1.5px] shadow-lg active:scale-[0.98] transition-all`}>
                  <div className="w-full h-full bg-black/40 backdrop-blur-md rounded-[20px] flex items-center justify-between px-8">
                    <div className="flex items-center gap-5">
                      <t.icon className="w-6 h-6 text-white/90" />
                      <span className="text-lg font-medium text-white/95 tracking-wide">{t.label}</span>
                    </div>
                    <ChevronLeft className="w-5 h-5 rotate-180 opacity-40 text-white" />
                  </div>
                </button>
              ))}
            </div>

            <button onClick={prevPasso} className="mt-16 py-3 px-8 rounded-full bg-white/40 border border-[#E5D9C3] text-[10px] font-bold uppercase tracking-[0.3em] text-[#C4A484] flex items-center gap-2 active:scale-95 transition-all">
              ‹ Mudar Oráculo
            </button>
          </div>
        )}

        {passo === 2 && (
          <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-serif text-[#C4A484] text-center mb-10 italic" style={{ fontFamily: 'var(--font-great-vibes)' }}>Abra o seu coração</h2>
            <div className="relative bg-white/80 backdrop-blur-md rounded-[32px] border border-[#E5D9C3] p-6 shadow-2xl w-full max-w-[340px]">
              <textarea value={desabafo} onChange={(e) => setDesabafo(e.target.value)} placeholder="Escreva sua dúvida..." className="w-full h-40 bg-transparent border-none focus:outline-none text-base font-light text-[#5C4D3C]" />
              <div className="space-y-4 pt-4 border-t border-[#E5D9C3]/30">
                <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording} className={`w-full py-4 rounded-full flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em] transition-all ${isGravando ? 'bg-[#991b1b] text-white animate-pulse shadow-lg scale-95' : 'bg-[#C4A484]/10 text-[#C4A484] border border-[#C4A484]/20'}`}><Mic size={20} /> {isGravando ? 'Ouvindo...' : 'Segure para Falar'}</button>
                <button onClick={nextPasso} disabled={!desabafo && !isGravando} className="w-full bg-[#C4A484] text-white py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-xl disabled:opacity-20 active:scale-95">Prosseguir</button>
              </div>
            </div>
            <button onClick={prevPasso} className="mt-12 text-[10px] font-bold uppercase tracking-[0.3em] text-[#C4A484] flex items-center gap-2">‹ Trocar Foco ({tema})</button>
          </div>
        )}

        {passo === 3 && (
          <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-right-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-serif text-[#C4A484] text-center mb-10 italic" style={{ fontFamily: 'var(--font-great-vibes)' }}>Consulte o Invisível</h2>
            <div className="flex flex-col gap-3 w-full max-w-[300px]">
              {[
                { id: 'foto', icon: Eye, title: 'Visão do Jogo Físico', color: 'bg-[#065f46]', action: () => fileInputRef.current?.click() },
                { id: 'completa', icon: Wand2, title: 'Caminho do Destino', color: 'bg-[#991b1b]', action: () => handleLeitura('completa') },
                { id: 'sim_nao', icon: Compass, title: 'Bússola Sim ou Não', color: 'bg-[#a16207]', action: () => handleLeitura('sim_nao') }
              ].map((m) => (
                <button key={m.id} onClick={m.action} className="w-full h-16 flex items-center gap-4 bg-white border border-[#E5D9C3] px-5 rounded-[20px] shadow-lg active:scale-[0.98] transition-all group">
                  <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform`}><m.icon size={20} /></div>
                  <h4 className="font-bold text-[10px] md:text-xs text-[#5C4D3C] uppercase tracking-[0.1em] text-left leading-tight">{m.title}</h4>
                </button>
              ))}
            </div>
            <button onClick={prevPasso} className="mt-12 text-[10px] font-bold uppercase tracking-[0.3em] text-[#C4A484]">‹ Refazer Pergunta</button>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleCaptureImage} />
          </div>
        )}

        {passo === 4 && resultado && (
          <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-1000 pb-20">
            <div className="mb-6 text-center">
              <div className="inline-block px-5 py-1.5 bg-[#C4A484]/10 rounded-full text-[10px] font-bold text-[#C4A484] uppercase tracking-[0.2em] border border-[#C4A484]/20 mb-3">{resultado.tema}</div>
              <h2 className="text-4xl md:text-5xl font-serif text-[#C4A484] leading-none italic" style={{ fontFamily: 'var(--font-great-vibes)' }}>Sua Revelação</h2>
            </div>
            
            <div className="flex flex-row justify-center gap-2 md:gap-4 mb-8 w-full overflow-x-auto py-2 px-1">
              {resultado.situacao_atual && <CardResult title="Situação" data={resultado.situacao_atual} index={1} tipoOraculo={tipoOraculo} />}
              {resultado.caminho_acao && <CardResult title="Caminho" data={resultado.caminho_acao} index={2} tipoOraculo={tipoOraculo} />}
              {resultado.resultado_conselho && <CardResult title="Resultado" data={resultado.resultado_conselho} index={3} tipoOraculo={tipoOraculo} />}
              {!resultado.situacao_atual && resultado.carta_sorteada && (
                <CardResult 
                  title="O Arcano" 
                  data={resultado.carta_sorteada} 
                  index={0} 
                  tipoOraculo={tipoOraculo} 
                  veredito={resultado.leitura_caminho?.veredito_direto}
                />
              )}
            </div>

            <div className="w-full space-y-6">
               <div className="bg-[#2C2420] rounded-[32px] border border-white/5 p-8 shadow-2xl text-white/90 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 -translate-y-1/2 translate-x-1/2"><img src="/assets/brand/mandala-login.png" alt="" className="animate-spin-slow" /></div>
                  <h3 className="text-[#C4A484] font-serif text-3xl mb-6 italic" style={{ fontFamily: 'var(--font-great-vibes)' }}>{resultado.leitura_caminho?.titulo || "A Voz do Destino"}</h3>
                  <p className="text-sm md:text-base leading-relaxed text-white/80 font-light text-justify italic font-serif">
                    {resultado.leitura_caminho?.analise_detalhada}
                  </p>
                  {resultado.leitura_caminho?.veredito_direto && !(!resultado.situacao_atual && resultado.carta_sorteada) && (
                    <div className="mt-8 pt-6 border-t border-white/10 text-center font-black text-[#C4A484] uppercase text-[10px] tracking-[0.3em]">{resultado.leitura_caminho.veredito_direto}</div>
                  )}
               </div>

               {resultado.ancoragem_rituais && (
                 <div className="bg-white/90 backdrop-blur-sm rounded-[32px] border border-[#E5D9C3] p-8 shadow-xl space-y-8">
                   <h3 className="text-[#C4A484] font-serif text-3xl text-center italic" style={{ fontFamily: 'var(--font-great-vibes)' }}>Ancoragem e Rituais</h3>
                   
                   <div className="grid grid-cols-1 gap-6">
                     {resultado.ancoragem_rituais.mantra && (
                       <div className="flex items-start gap-4">
                         <div className="w-8 h-8 rounded-full bg-[#C4A484]/10 flex items-center justify-center shrink-0 text-[#C4A484]"><Sparkles size={16} /></div>
                         <div className="space-y-1">
                           <span className="text-[9px] font-black uppercase tracking-widest text-[#C4A484]/60">Sintonização</span>
                           <p className="text-sm italic text-[#5C4D3C] font-medium leading-relaxed">"{resultado.ancoragem_rituais.mantra}"</p>
                         </div>
                       </div>
                     )}
                     
                     {resultado.ancoragem_rituais.salmo && (
                       <div className="flex items-start gap-4">
                         <div className="w-8 h-8 rounded-full bg-[#C4A484]/10 flex items-center justify-center shrink-0 text-[#C4A484]"><ShieldCheck size={16} /></div>
                         <div className="space-y-1">
                           <span className="text-[9px] font-black uppercase tracking-widest text-[#C4A484]/60">Salmo Protetor</span>
                           <p className="text-sm text-[#5C4D3C]/80 leading-relaxed">{resultado.ancoragem_rituais.salmo}</p>
                         </div>
                       </div>
                     )}

                     {resultado.ancoragem_rituais.biblia && (
                       <div className="flex items-start gap-4">
                         <div className="w-8 h-8 rounded-full bg-[#C4A484]/10 flex items-center justify-center shrink-0 text-[#C4A484]"><Star size={16} /></div>
                         <div className="space-y-1">
                           <span className="text-[9px] font-black uppercase tracking-widest text-[#C4A484]/60">Sabedoria Bíblica</span>
                           <p className="text-sm text-[#5C4D3C]/80 leading-relaxed">{resultado.ancoragem_rituais.biblia}</p>
                         </div>
                       </div>
                     )}

                     {resultado.ancoragem_rituais.banho && (
                       <div className="flex items-start gap-4">
                         <div className="w-8 h-8 rounded-full bg-[#C4A484]/10 flex items-center justify-center shrink-0 text-[#C4A484]"><Activity size={16} /></div>
                         <div className="space-y-1">
                           <span className="text-[9px] font-black uppercase tracking-widest text-[#C4A484]/60">Ritual Sagrado</span>
                           <p className="text-sm text-[#5C4D3C]/80 leading-relaxed">{resultado.ancoragem_rituais.banho}</p>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {resultado.acolhimento_quantum && (
                 <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F2EA] rounded-[32px] border border-[#C4A484]/20 p-8 text-center shadow-inner italic">
                   <div className="text-[#C4A484] mb-4 flex justify-center"><Heart size={24} className="animate-pulse" /></div>
                   <h4 className="text-[#C4A484] font-serif text-2xl mb-2" style={{ fontFamily: 'var(--font-great-vibes)' }}>{resultado.acolhimento_quantum.titulo}</h4>
                   <p className="text-sm text-[#5C4D3C]/70 leading-relaxed">{resultado.acolhimento_quantum.conteudo}</p>
                 </div>
               )}

               <div className="pt-10 pb-16 flex justify-center">
                  <button onClick={() => { setPasso(0); setResultado(null); setDesabafo(''); }} className="text-[11px] font-black uppercase tracking-[0.4em] text-[#C4A484] py-5 bg-white shadow-xl px-16 rounded-full border-2 border-[#E5D9C3] hover:bg-[#C4A484] hover:text-white transition-all active:scale-95">Novo Ciclo ✨</button>
               </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-white/98 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 relative">
               <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full animate-spin-slow opacity-20" />
               <div className="absolute inset-0 border-t-2 border-[#C4A484] rounded-full animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#C4A484] animate-pulse">Sintonizando Essência...</p>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#2C2420]/70 backdrop-blur-md" onClick={() => setModalAberto(null)} />
          <div className="relative w-full max-w-md bg-[#FDFBF7] rounded-[40px] border border-[#E5D9C3] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-[#E5D9C3]/30 flex justify-between items-center bg-white/50">
              <h3 className="text-2xl font-serif text-[#C4A484] italic" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                {modalAberto === 'assinatura' ? 'Portal da Abundância' : 
                 modalAberto === 'mensagem_ampliada' ? 'Sintonização de Hoje' : 
                 modalAberto}
              </h3>
              <button onClick={() => setModalAberto(null)} className="p-2 hover:bg-[#C4A484]/10 rounded-full"><X className="w-6 h-6 text-[#C4A484]" /></button>
            </div>
            <div className="p-8 overflow-y-auto text-center">
              {modalAberto === 'assinatura' && (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-[#C4A484]/10 rounded-full flex items-center justify-center mx-auto"><Crown className="w-10 h-10 text-[#C4A484]" /></div>
                  <h4 className="text-xl font-bold text-[#2C2420]">✨ Sua jornada de conexão começou...</h4>
                  <p className="text-xs leading-relaxed opacity-70">A energia dos oráculos se conectou com o seu caminho. No plano gratuito, você tem direito a **5 tiragens por dia**. Para ter acesso a consultas ilimitadas, rituais e banhos, assine o plano anual.</p>
                  <div className="bg-[#C4A484]/5 p-5 rounded-3xl border border-[#C4A484]/20"><div className="text-3xl font-black text-[#C4A484]">R$ 89,00<span className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">/ano</span></div></div>
                  <button className="w-full py-5 bg-gradient-to-r from-[#C4A484] to-[#8B735B] text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-xs">Desbloquear Acesso</button>
                </div>
              )}

              {modalAberto === 'mensagem_ampliada' && mensagemDia && (
                <div className="space-y-8 py-4">
                  <div className="w-24 h-24 relative mx-auto">
                    <img src="/assets/brand/mandala-login.png" alt="Mandala" className="w-full h-full object-contain animate-spin-slow" />
                  </div>
                  <div className="space-y-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C4A484]">Sintonização e Bem-estar</span>
                    <p className="text-xl md:text-2xl italic font-serif text-[#5C4D3C] leading-relaxed px-2">
                      "{mensagemDia.texto}"
                    </p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-[2px] bg-[#C4A484]/20 rounded-full" />
                      <span className="text-xs font-bold text-[#C4A484] tracking-[0.2em]">{mensagemDia.autor}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setModalAberto(null)}
                    className="mt-8 px-10 py-4 bg-[#C4A484] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all"
                  >
                    Receber com Gratidão ✨
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
