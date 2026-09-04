'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash, Sparkles, Mic, Type, Camera, LayoutGrid, CheckCircle2, ChevronLeft, Heart, Briefcase, DollarSign, Activity, Users, LogOut, Sun, Moon, Star, X, Info, ShieldCheck, Crown, Eye, Wand2, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { drawCards, getAngelAttributes, getFallbackImageUrl } from '@/lib/cards';
import { isVipEmail } from '@/lib/vip';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { agendarMensagemDiaria } from '@/lib/notifications';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Camera as CapacitorCamera, CameraResultType } from '@capacitor/camera';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { Purchases, LOG_LEVEL, PRODUCT_CATEGORY } from '@revenuecat/purchases-capacitor';

// Modelo de conversão: a pessoa usa o app sem login. Após 3 consultas grátis
// (contadas NO APARELHO), aparece o paywall para cadastrar e assinar.
// A "mensagem do dia" é sempre gratuita e não entra nessa conta.
const FREE_READINGS_LIMIT = 3;

async function getFreeReadingsUsed(): Promise<number> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: 'psique_free_readings' });
      return parseInt(value || '0', 10) || 0;
    }
    return parseInt(localStorage.getItem('psique_free_readings') || '0', 10) || 0;
  } catch { return 0; }
}

async function incFreeReadings(): Promise<void> {
  try {
    const next = String((await getFreeReadingsUsed()) + 1);
    if (Capacitor.isNativePlatform()) await Preferences.set({ key: 'psique_free_readings', value: next });
    else localStorage.setItem('psique_free_readings', next);
  } catch {}
}

// Créditos de leitura avulsa (comprados a R$ 2,06 cada), guardados no aparelho.
async function getPaidReadings(): Promise<number> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: 'psique_paid_readings' });
      return parseInt(value || '0', 10) || 0;
    }
    return parseInt(localStorage.getItem('psique_paid_readings') || '0', 10) || 0;
  } catch { return 0; }
}

async function setPaidReadingsStore(n: number): Promise<void> {
  try {
    const v = String(Math.max(0, n));
    if (Capacitor.isNativePlatform()) await Preferences.set({ key: 'psique_paid_readings', value: v });
    else localStorage.setItem('psique_paid_readings', v);
  } catch {}
}

// Histórico local (funciona com ou sem conta, guardado no aparelho)
async function getHistoricoLocal(): Promise<any[]> {
  try {
    const raw = Capacitor.isNativePlatform()
      ? (await Preferences.get({ key: 'psique_historico_local' })).value
      : localStorage.getItem('psique_historico_local');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function setHistoricoLocal(arr: any[]): Promise<void> {
  try {
    const v = JSON.stringify(arr.slice(0, 40));
    if (Capacitor.isNativePlatform()) await Preferences.set({ key: 'psique_historico_local', value: v });
    else localStorage.setItem('psique_historico_local', v);
  } catch {}
}

// Saudação conforme a hora (o card nunca fica vazio, mesmo sem a mensagem da IA)
function saudacaoDoDia(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Faça um bom dia';
  if (h < 18) return 'Faça uma boa tarde';
  return 'Faça uma boa noite';
}

const MandalaSmallIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <path d="M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
  </svg>
);

const TEMAS = [
  { label: 'Amigos', icon: Moon, color: 'text-[#4FD1C5]' }, 
  { label: 'Amor', icon: Heart, color: 'text-[#F687B3]' }, 
  { label: 'Dinheiro', icon: Sun, color: 'text-[#D69E2E]' }, 
  { label: 'Saúde', icon: Activity, color: 'text-[#48BB78]' }, 
  { label: 'Trabalho', icon: MandalaSmallIcon, color: 'text-[#9F7AEA]' }, 
];

function CardResult({ title, data, index, tipoOraculo }: { title: string, data: any, index: number, tipoOraculo: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos' };
  const folder = folderMap[tipoOraculo] || 'taro';
  
  const slug = (data.card_slug || '').toLowerCase().trim();
  const imagePath = useFallback ? getFallbackImageUrl(data.carta, tipoOraculo) : (data.image_url || `/assets/decks/${folder}/${slug}.jpg`);
  
  const atributosAnjo = tipoOraculo === 'Tarô dos Anjos' ? getAngelAttributes(data.carta) : [];

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
                onError={() => {
                  if (!useFallback) {
                    setUseFallback(true);
                    setImageLoading(true);
                  } else {
                    setImageError(true);
                  }
                }} 
             />
           ) : (
             <div className="p-2 text-center bg-[#F5F2EA] w-full h-full flex items-center justify-center">
                <span className="text-[#C4A484] font-serif text-[8px] leading-tight font-bold uppercase">{data.carta}</span>
             </div>
           )}
        </div>
      </div>

      <span className="text-[8px] font-black text-[#8B735B] uppercase tracking-wider text-center px-1">
        {data.carta}
      </span>
      
      {atributosAnjo.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 mt-1 max-w-[80px]">
          {atributosAnjo.map(attr => (
            <span key={attr} className="bg-[#C4A484]/10 text-[#8B735B] text-[5px] font-black uppercase px-1 py-0.5 rounded-full border border-[#C4A484]/20 tracking-tighter">
              {attr}
            </span>
          ))}
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
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [modalAberto, setModalAberto] = useState<'politicas' | 'ajuda' | 'assinatura' | 'paywall' | 'limite_diario' | 'mensagem_ampliada' | 'historico' | null>(null);
  const [historicoLista, setHistoricoLista] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [streak, setStreak] = useState(0);

  const shareCardRef = useRef<HTMLDivElement>(null);

  // Gera uma imagem bonita da leitura (pergunta em cima + resultado + marca).
  const gerarImagemLeitura = async (): Promise<Blob | null> => {
    try {
      const el = shareCardRef.current;
      if (!el) return null;
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { backgroundColor: '#FDFBF7', scale: 2, useCORS: true, logging: false });
      return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.95));
    } catch { return null; }
  };

  // Compartilhar a leitura como IMAGEM (WhatsApp, Instagram...). Fallback: texto.
  const handleCompartilhar = async () => {
    try {
      const linkApp = 'https://play.google.com/store/apps/details?id=com.psiqueoraculo';
      const blob = await gerarImagemLeitura();
      if (blob) {
        const file = new File([blob], 'minha-leitura.png', { type: 'image/png' });
        const nav: any = navigator;
        if (nav?.canShare && nav.canShare({ files: [file] }) && nav.share) {
          await nav.share({ files: [file], title: 'Psiquê Oráculo', text: `✨ Minha leitura no Psiquê Oráculo. Faça a sua, baixe grátis:\n${linkApp}` });
          return;
        }
      }
      // Fallback: compartilha texto
      const titulo = resultado?.leitura_caminho?.titulo || 'Minha Revelação';
      const trecho = (resultado?.leitura_caminho?.analise_detalhada || respostaRapida || 'Recebi uma mensagem linda hoje.').slice(0, 220);
      const texto = `✨ ${titulo} — Psiquê Oráculo\n\n"${trecho}..."\n\n🔮 Faça sua leitura também, baixe grátis:\n${linkApp}`;
      if ((navigator as any)?.share) await (navigator as any).share({ title: 'Psiquê Oráculo', text: texto });
      else { try { await navigator.clipboard.writeText(texto); toast.success('Leitura copiada! Cole onde quiser. ✨'); } catch {} }
    } catch { /* usuária cancelou */ }
  };

  // Salvar a leitura no HISTÓRICO (para rever depois em "Minhas Leituras")
  const handleSalvarLeitura = async () => {
    try {
      if (!resultado) return;
      const item = {
        id: 'local_' + Date.now(),
        tipo_oraculo: tipoOraculo,
        tipo_leitura: resultado.tipoLeitura || '',
        pergunta_tema: (resultado.tema || tema || '') + (desabafo ? ': ' + desabafo : ''),
        resposta_ia: resultado,
        created_at: new Date().toISOString(),
      };
      const atual = await getHistoricoLocal();
      const jaTem = atual.some((x) => x.pergunta_tema === item.pergunta_tema && JSON.stringify(x.resposta_ia) === JSON.stringify(item.resposta_ia));
      if (jaTem) { toast.info('Essa leitura já está no seu histórico ✨'); return; }
      atual.unshift(item);
      await setHistoricoLocal(atual);
      toast.success('Leitura salva no histórico! ✨');
    } catch { toast.info('Não consegui salvar agora. Tente de novo.'); }
  };

  // Abrir a página do app na Play Store para avaliar
  const abrirAvaliar = async () => {
    const url = 'https://play.google.com/store/apps/details?id=com.psiqueoraculo';
    try {
      if (Capacitor.isNativePlatform()) await Browser.open({ url });
      else window.open(url, '_blank');
    } catch { try { window.open(url, '_blank'); } catch {} }
  };

  // Carrega o histórico de leituras (apenas para quem tem conta)
  // Excluir uma leitura do histórico (local ou da nuvem)
  const handleExcluirLeitura = async (item: any) => {
    try {
      if (String(item.id).startsWith('local_')) {
        const atual = await getHistoricoLocal();
        await setHistoricoLocal(atual.filter((x: any) => x.id !== item.id));
      } else {
        await supabase.from('historico_leituras').delete().eq('id', item.id);
      }
      setHistoricoLista((lista) => lista.filter((x) => x.id !== item.id));
      toast.success('Leitura removida do histórico.');
    } catch { toast.info('Não consegui remover agora. Tente de novo.'); }
  };

  const carregarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const locais = await getHistoricoLocal();
      let remotos: any[] = [];
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('historico_leituras')
          .select('id, tipo_oraculo, tipo_leitura, pergunta_tema, resposta_ia, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        remotos = data || [];
      }
      const todos = [...locais, ...remotos]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 40);
      setHistoricoLista(todos);
    } catch { setHistoricoLista([]); }
    finally { setLoadingHistorico(false); }
  };
  const [mensagemDia, setMensagemDia] = useState<{ texto: string, autor: string } | null>(null);
  const [conselhoDia, setConselhoDia] = useState<{ carta: string, texto: string, img: string } | null>(null);
  const [loadingConselho, setLoadingConselho] = useState(false);
  const [mostrarPressagio, setMostrarPressagio] = useState(false);

  const abrirPressagio = () => {
    setMostrarPressagio(true);
    carregarConselhoDia(tipoOraculo);
  };

  // Conselho do Dia: 1 arcano do oráculo escolhido + conselho curto.
  // Cache por dia e por oráculo → no máximo 1 chamada de IA por dia/oráculo.
  const carregarConselhoDia = async (oraculo: string) => {
    if (!oraculo) return;
    const hoje = new Date().toLocaleDateString('pt-BR');
    const chave = `psique_conselho_v3_${oraculo}_${hoje}`;
    try {
      const salvo = localStorage.getItem(chave);
      if (salvo) { setConselhoDia(JSON.parse(salvo)); return; }
    } catch {}
    setConselhoDia(null);
    setLoadingConselho(true);
    try {
      // Sorteia a carta com proteção (não pode derrubar o presságio)
      let carta: any = null;
      try { const cartas = await drawCards(oraculo, 1); carta = cartas?.[0] || null; } catch {}
      const nomeCarta = carta?.name || 'O Arcano';

      const { data: { session } } = await supabase.auth.getSession();
      const siteUrl = 'https://www.pisiqueoraculo.com.br';
      const apiUrl = Capacitor.isNativePlatform() ? `${siteUrl}/api/oracle/read` : `/api/oracle/read`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '' },
        body: JSON.stringify({ tipoOraculo: oraculo, tipoLeitura: 'conselho_dia', tema: 'Conselho do Dia', cartas: [{ name: nomeCarta }] })
      });
      const txt = await res.text();
      let data: any = {};
      try { data = JSON.parse(txt); } catch {}
      const texto = data?.resposta_rapida;
      const conselho = { carta: nomeCarta, texto: texto || 'Confie no seu caminho hoje. ✨', img: carta?.image_url || '' };
      setConselhoDia(conselho);
      // Só guarda no cache se veio previsão de verdade (evita cachear fallback)
      if (texto) { try { localStorage.setItem(chave, JSON.stringify(conselho)); } catch {} }
    } catch {
      setConselhoDia({ carta: 'O Oráculo', texto: 'As energias pedem um instante. Tente novamente. ✨', img: '' });
    } finally {
      setLoadingConselho(false);
    }
  };

  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [freeRestantes, setFreeRestantes] = useState<number>(FREE_READINGS_LIMIT);
  const [primeiroNome, setPrimeiroNome] = useState('Alma Querida');
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);
  const [mostrarNovidades, setMostrarNovidades] = useState(false);

  const fecharNovidades = async () => {
    try {
      if (Capacitor.isNativePlatform()) await Preferences.set({ key: 'psique_novidades_v1', value: '1' });
      else localStorage.setItem('psique_novidades_v1', '1');
    } catch {}
    setMostrarNovidades(false);
  };
  const [respostaRapida, setRespostaRapida] = useState<string | null>(null);
  const [loadingRapida, setLoadingRapida] = useState(false);
  const [paidReadings, setPaidReadings] = useState(0);

  // Compra avulsa: paga R$ 2,06 e libera 1 leitura (produto consumível 'leitura_avulsa').
  const handleComprarAvulsa = async () => {
    try {
      setLoading(true);
      if (!Capacitor.isNativePlatform()) { toast.info('A compra avulsa está disponível no aplicativo. ✨'); return; }
      const { products } = await Purchases.getProducts({ productIdentifiers: ['leitura_avulsa'], type: PRODUCT_CATEGORY.NON_SUBSCRIPTION });
      if (!products || products.length === 0) { toast.error('Produto indisponível no momento. Tente novamente.'); return; }
      await Purchases.purchaseStoreProduct({ product: products[0] });
      const novo = (await getPaidReadings()) + 1;
      await setPaidReadingsStore(novo);
      setPaidReadings(novo);
      toast.success('Leitura liberada! ✨');
      setModalAberto(null);
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      const cancel = e?.userCancelled === true || e?.code === '1' || e?.code === 1 || msg.includes('cancel');
      if (!cancel) toast.error('Não foi possível concluir a compra. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Pergunta sugerida: sorteia 1 carta invisível e pede uma resposta curta (baixo token).
  const handlePerguntaSugerida = async () => {
    if (!resultado?.pergunta_sugerida || loadingRapida || respostaRapida) return;
    setLoadingRapida(true);
    try {
      const carta = await drawCards(tipoOraculo, 1);
      const { data: { session } } = await supabase.auth.getSession();
      const siteUrl = 'https://www.pisiqueoraculo.com.br';
      const apiUrl = Capacitor.isNativePlatform() ? `${siteUrl}/api/oracle/read` : `/api/oracle/read`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '' },
        body: JSON.stringify({ tipoOraculo, tipoLeitura: 'resposta_rapida', tema, pergunta: resultado.pergunta_sugerida, cartas: carta })
      });
      const txt = await res.text();
      let data: any = {};
      try { data = JSON.parse(txt); } catch {}
      setRespostaRapida(data?.resposta_rapida || 'As energias pedem silêncio. Tente novamente em paz. ✨');
    } catch {
      setRespostaRapida('As energias pedem silêncio. Tente novamente em paz. ✨');
    } finally {
      setLoadingRapida(false);
    }
  };

  const fecharBoasVindas = async () => {
    try {
      if (Capacitor.isNativePlatform()) await Preferences.set({ key: 'psique_welcome_seen', value: '1' });
      else localStorage.setItem('psique_welcome_seen', '1');
    } catch {}
    setMostrarBoasVindas(false);
  };

  // Ao abrir: carrega sessão, status premium e quantas consultas grátis restam.
  useEffect(() => {
    const carregarAcesso = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        const nomeCompleto = localStorage.getItem('psique_user_name') || session?.user?.user_metadata?.full_name || '';
        setPrimeiroNome(nomeCompleto ? nomeCompleto.trim().split(' ')[0] : 'Alma Querida');
        let premium = false;
        if (isVipEmail(session?.user?.email)) premium = true;
        if (!premium && session) {
          const { data: prof } = await supabase.from('profiles').select('is_premium').eq('id', session.user.id).single();
          premium = !!prof?.is_premium;
        }
        setIsPremiumUser(premium);
        const usadas = await getFreeReadingsUsed();
        setFreeRestantes(Math.max(0, FREE_READINGS_LIMIT - usadas));
        setPaidReadings(await getPaidReadings());

        // Sequência de dias (hábito): conta dias consecutivos abrindo o app
        try {
          const getP = async (k: string) => Capacitor.isNativePlatform() ? (await Preferences.get({ key: k })).value : localStorage.getItem(k);
          const setP = async (k: string, v: string) => { if (Capacitor.isNativePlatform()) await Preferences.set({ key: k, value: v }); else localStorage.setItem(k, v); };
          const hojeStr = new Date().toDateString();
          const last = await getP('psique_last_open');
          let s = parseInt((await getP('psique_streak')) || '0', 10) || 0;
          if (last !== hojeStr) {
            const ontem = new Date(Date.now() - 86400000).toDateString();
            s = (last === ontem) ? s + 1 : 1;
            await setP('psique_streak', String(s));
            await setP('psique_last_open', hojeStr);
          } else if (s === 0) { s = 1; await setP('psique_streak', '1'); }
          setStreak(s);
        } catch {}

        // Tela de boas-vindas: só na primeira vez (e não para quem já é premium)
        const welcomeSeen = Capacitor.isNativePlatform()
          ? (await Preferences.get({ key: 'psique_welcome_seen' })).value
          : localStorage.getItem('psique_welcome_seen');
        if (welcomeSeen !== '1' && !premium) {
          setMostrarBoasVindas(true);
        } else {
          // Usuário que já conhece o app: mostra "Novidades" 1x
          const novidadesVistas = Capacitor.isNativePlatform()
            ? (await Preferences.get({ key: 'psique_novidades_v1' })).value
            : localStorage.getItem('psique_novidades_v1');
          if (novidadesVistas !== '1') setMostrarNovidades(true);
        }

        // Se a pessoa voltou do cadastro com intenção de assinar, abre o paywall.
        const pend = Capacitor.isNativePlatform()
          ? (await Preferences.get({ key: 'psique_pending_subscribe' })).value
          : localStorage.getItem('psique_pending_subscribe');
        if (pend === '1' && session) {
          if (Capacitor.isNativePlatform()) await Preferences.remove({ key: 'psique_pending_subscribe' });
          else localStorage.removeItem('psique_pending_subscribe');
          setModalAberto('assinatura');
        }
      } catch {}
    };
    carregarAcesso();
    // Agenda o lembrete diário da "mensagem do dia" (retém quem ainda não assinou)
    agendarMensagemDiaria();
  }, []);

  const handleSubscribe = async (plano: 'anual' | 'mensal' = 'anual') => {
    try {
      setLoading(true);
      let { data: { session } } = await supabase.auth.getSession();

      // Rede de segurança: se a sessão não veio na primeira tentativa,
      // tenta renová-la antes de mandar a usuária para o login.
      if (!session) {
        const refreshed = await supabase.auth.refreshSession();
        session = refreshed.data.session;
      }

      if (!session) {
        // Modelo de conversão: a pessoa cria a conta agora e volta direto para assinar.
        try {
          if (Capacitor.isNativePlatform()) await Preferences.set({ key: 'psique_pending_subscribe', value: '1' });
          else localStorage.setItem('psique_pending_subscribe', '1');
        } catch {}
        toast.info('Crie sua conta para ativar o Premium ✨');
        router.push('/login');
        return;
      }

      const isNative = Capacitor.isNativePlatform();
      console.log("Iniciando processo de assinatura. IsNative:", isNative);

      if (isNative) {
        try {
          console.log("Configurando RevenueCat para usuário:", session.user.id);
          await Purchases.logIn({ appUserID: session.user.id });
          
          // Busca as ofertas (Offerings) que é o jeito recomendado
          const offerings = await Purchases.getOfferings();
          console.log("Ofertas encontradas:", JSON.stringify(offerings));

          let packageToPurchase: any = null;
          const pkgs = offerings.current?.availablePackages || [];
          if (offerings.current) {
            if (plano === 'mensal') {
              packageToPurchase =
                offerings.current.monthly ||
                pkgs.find((p: any) => p.packageType === 'MONTHLY') ||
                pkgs.find((p: any) => /mensal|monthly/i.test(p.identifier || p.product?.identifier || ''));
            } else {
              packageToPurchase =
                offerings.current.annual ||
                pkgs.find((p: any) => p.packageType === 'ANNUAL') ||
                pkgs.find((p: any) => /anual|annual/i.test(p.identifier || p.product?.identifier || ''));
            }
            // Último recurso dentro da oferta: primeiro pacote disponível
            if (!packageToPurchase && pkgs.length > 0) packageToPurchase = pkgs[0];
            console.log(`Plano ${plano} -> pacote escolhido:`, packageToPurchase?.identifier);
          }

          if (!packageToPurchase) {
            // Último recurso: busca direto por ID do produto
            try {
              const fallbackIds = plano === 'mensal' ? ['mensal', 'premium_mensal', 'psique_premium_mensal'] : ['premium_anual', 'psique_premium_anual'];
              const { products } = await Purchases.getProducts({ productIdentifiers: fallbackIds });
              if (products && products.length > 0) {
                console.log("Produto encontrado via getProducts:", products[0].identifier);
                const purchaseResult = await Purchases.purchaseStoreProduct({ product: products[0] });
                const activeEntitlements = purchaseResult.customerInfo.entitlements.active;
                const hasPremiumFallback = Object.keys(activeEntitlements).length > 0;
                if (hasPremiumFallback) {
                  await supabase.from('profiles').update({ is_premium: true }).eq('id', session.user.id);
                  setIsPremiumUser(true);
                  toast.success('Assinatura ativada! ✨');
                  setModalAberto(null);
                  return;
                }
              }
            } catch (productErr) {
              console.error("Erro ao buscar produtos diretamente:", productErr);
            }
          }

          if (packageToPurchase) {
            const purchaseResult = await Purchases.purchasePackage({ aPackage: packageToPurchase });

            const activeEntitlements = purchaseResult.customerInfo.entitlements.active;
            console.log("Entitlements ativos após compra:", JSON.stringify(activeEntitlements));

            // Qualquer entitlement ativo = premium, ou verifica IDs específicos
            const hasPremium =
              Object.keys(activeEntitlements).length > 0 ||
              typeof activeEntitlements['com.psiqueoraculo Pro'] !== "undefined" ||
              typeof activeEntitlements['premium'] !== "undefined" ||
              typeof activeEntitlements['pro'] !== "undefined";

            if (hasPremium) {
              await supabase.from('profiles').update({ is_premium: true }).eq('id', session.user.id);
              setIsPremiumUser(true);
              toast.success('Assinatura ativada! Bem-vinda ao Premium. ✨');
              setModalAberto(null);
            } else {
              console.error("Nenhum entitlement ativo após compra:", activeEntitlements);
              toast.error('Assinatura processada, mas o acesso Premium ainda não foi liberado. Tente reiniciar o app.');
            }
          } else {
             toast.error('Nenhuma oferta ativa encontrada na Play Store. Verifique suas compras in-app no RevenueCat.');
          }
        } catch (nativeError: any) {
          // Detecção robusta de cancelamento: não é erro, a pessoa só desistiu.
          const msg = (nativeError?.message || '').toLowerCase();
          const foiCancelada =
            nativeError?.userCancelled === true ||
            nativeError?.code === "1" ||
            nativeError?.code === 1 ||
            nativeError?.code === "PURCHASE_CANCELLED" ||
            msg.includes('cancel');

          if (!foiCancelada) {
            console.error('Erro detalhado RevenueCat:', nativeError);

            let msgErro = "Falha na compra. Tente novamente.";
            if (nativeError.code === "2") msgErro = "Problema com a loja (Play Store). Verifique sua conta Google.";
            if (nativeError.code === "7") msgErro = "Este produto já foi adquirido.";
            if (nativeError.code === "5") msgErro = "Produto não disponível para compra no momento.";

            toast.error(`Erro na Play Store: ${msgErro}`);
          }
          // Se foi cancelada: não mostra nada (experiência tranquila).
        }
      } else {
        console.log("Iniciando checkout Stripe...");
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id, email: session.user.email, isNative: false }),
        });

        const textResponse = await res.text();
        let data;
        try {
          data = JSON.parse(textResponse);
        } catch (e) {
          console.error("Erro ao processar resposta do servidor (não é JSON):", textResponse);
          throw new Error('O servidor retornou uma resposta inválida. Tente novamente mais tarde.');
        }

        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          console.error("Erro retornado pelo Stripe:", data);
          throw new Error(data.error || 'Erro ao gerar link de pagamento');
        }
      }
    } catch (err: any) {
      console.error("Erro Geral na Assinatura:", err);
      toast.error(`Erro no portal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initRevenueCat = async () => {
      const isNative = Capacitor.isNativePlatform();
      const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY;
      if (isNative && apiKey && apiKey !== 'sua_chave_publica_google_do_revenuecat_aqui') {
        try {
          await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
          await Purchases.configure({ apiKey });
        } catch (e) {
          console.error("Falha ao inicializar o RevenueCat", e);
        }
      }
    };
    initRevenueCat();
  }, []);

  useEffect(() => {
    const fetchMensagemDia = async () => {
      try {
        const today = new Date().toLocaleDateString('pt-BR');
        // Cache no armazenamento NATIVO (o localStorage some no Android e gerava 2 mensagens/dia)
        const savedData = Capacitor.isNativePlatform()
          ? (await Preferences.get({ key: 'psique_mensagem_dia' })).value
          : localStorage.getItem('psique_mensagem_dia');
        if (savedData) {
          const { texto, autor, data } = JSON.parse(savedData);
          if (data === today) { setMensagemDia({ texto, autor }); return; }
        }
        const { data: { session } } = await supabase.auth.getSession();
        const userName = localStorage.getItem('psique_user_name') || session?.user?.user_metadata?.full_name || "Alma Querida";
        const isNative = Capacitor.isNativePlatform();
        const siteUrl = 'https://www.pisiqueoraculo.com.br';
        const apiUrl = isNative ? `${siteUrl}/api/oracle/read` : `/api/oracle/read`;
        const res = await fetch(apiUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ tipoOraculo: 'Geral', tipoLeitura: 'mensagem_dia', tema: 'Motivação e Bem-estar', userName: userName }) 
        });
        if (res && res.ok) {
          const textRes = await res.text();
          try {
            const dataRes = JSON.parse(textRes);
            if (dataRes.acolhimento_quantum) {
              const novaMensagem = { texto: dataRes.acolhimento_quantum.conteudo, autor: dataRes.acolhimento_quantum.titulo, data: today };
              setMensagemDia({ texto: novaMensagem.texto, autor: novaMensagem.autor });
              const serial = JSON.stringify(novaMensagem);
              if (Capacitor.isNativePlatform()) await Preferences.set({ key: 'psique_mensagem_dia', value: serial });
              else localStorage.setItem('psique_mensagem_dia', serial);
            }
          } catch (e) { console.error("Erro parse mensagem dia:", e); }
        }
      } catch (e) { console.error("Erro fetch mensagem dia:", e); }
    };
    fetchMensagemDia();
  }, []);

  const handleLogout = async () => { localStorage.removeItem('psique_demo_mode'); await supabase.auth.signOut(); router.push('/login'); };
  // Sair: faz logout (se houver) e sempre leva à tela de login/entrada.
  const handleSair = async () => {
    try { localStorage.removeItem('psique_demo_mode'); } catch {}
    try { await supabase.auth.signOut(); } catch {}
    router.push('/login');
  };
  const nextPasso = () => setPasso(passo + 1);
  const prevPasso = () => setPasso(passo - 1);

  const handleLeitura = async (tipo: string, imageData?: string) => {
    // Controle de acesso: premium libera tudo; senão, 3 consultas grátis no aparelho.
    const { data: { session: gateSession } } = await supabase.auth.getSession();
    let isPremium = false;
    // VIP: emails liberados têm tiragens ILIMITADAS (contam como premium aqui).
    if (isVipEmail(gateSession?.user?.email)) isPremium = true;
    if (!isPremium && gateSession) {
      try {
        const { data: prof } = await supabase.from('profiles').select('is_premium').eq('id', gateSession.user.id).single();
        isPremium = !!prof?.is_premium;
      } catch {}
    }
    if (!isPremium) {
      const gratisRestantes = FREE_READINGS_LIMIT - (await getFreeReadingsUsed());
      const avulsas = await getPaidReadings();
      // Sem grátis e sem crédito avulso → paywall
      if (gratisRestantes <= 0 && avulsas <= 0) {
        setModalAberto('assinatura');
        return;
      }
    }

    if (tipo === 'foto' && !imageData) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 70, 
          allowEditing: false,
          resultType: CameraResultType.Base64,
          promptLabelHeader: 'Analisar Jogo Físico',
          promptLabelPhoto: 'Escolher da Galeria',
          promptLabelPicture: 'Tirar Foto Agora'
        });
        if (image.base64String) handleLeitura('foto', `data:image/jpeg;base64,${image.base64String}`);
        return;
      } catch (e) { return; }
    }

    setLoading(true);
    try {
      const cartasSorteadas = tipo === 'foto' ? null : (tipo === 'completa' ? await drawCards(tipoOraculo, 3) : await drawCards(tipoOraculo, 1));
      const { data: { session } } = await supabase.auth.getSession();
      const userName = localStorage.getItem('psique_user_name') || session?.user?.user_metadata?.full_name || "Consulente";
      const isNative = Capacitor.isNativePlatform();
      const siteUrl = 'https://www.pisiqueoraculo.com.br';
      const apiUrl = isNative ? `${siteUrl}/api/oracle/read` : `/api/oracle/read`;
      const res = await fetch(apiUrl, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '' },
        body: JSON.stringify({ tipoOraculo, tipoLeitura: tipo, tema, pergunta: desabafo, cartas: cartasSorteadas, imagem: imageData || null, userName })
      });
      const textResponse = await res.text();
      if (!res.ok) {
        let dataErr; try { dataErr = JSON.parse(textResponse); } catch (e) {}
        if (res.status === 403 && dataErr?.reason === 'paywall') { setModalAberto('assinatura'); return; }
        if (res.status === 403) { toast.info(dataErr?.message || 'Você atingiu seu limite de leituras por hoje. Volte amanhã. ✨'); return; }
        throw new Error(`Erro do Servidor (${res.status})`);
      }
      let data = JSON.parse(textResponse);
      if (cartasSorteadas && Array.isArray(cartasSorteadas)) {
        if (tipo === 'completa' && cartasSorteadas.length === 3) {
          if (data.situacao_atual) { data.situacao_atual.carta = cartasSorteadas[0].name; data.situacao_atual.card_slug = cartasSorteadas[0].slug; data.situacao_atual.image_url = cartasSorteadas[0].image_url; }
          if (data.caminho_acao) { data.caminho_acao.carta = cartasSorteadas[1].name; data.caminho_acao.card_slug = cartasSorteadas[1].slug; data.caminho_acao.image_url = cartasSorteadas[1].image_url; }
          if (data.resultado_conselho) { data.resultado_conselho.carta = cartasSorteadas[2].name; data.resultado_conselho.card_slug = cartasSorteadas[2].slug; data.resultado_conselho.image_url = cartasSorteadas[2].image_url; }
          data.carta_sorteada = null;
        } else {
          if (data.carta_sorteada) { data.carta_sorteada.carta = cartasSorteadas[0].name; data.carta_sorteada.card_slug = cartasSorteadas[0].slug; data.carta_sorteada.image_url = cartasSorteadas[0].image_url; }
          data.situacao_atual = null;
          data.caminho_acao = null;
          data.resultado_conselho = null;
        }
      }
      setResultado(data); setPasso(4); setRespostaRapida(null);
      // Consumiu uma consulta grátis (só conta quem ainda não é premium)
      if (!isPremium) {
        // Consome grátis primeiro; se não houver, consome 1 crédito avulso pago
        if ((await getFreeReadingsUsed()) < FREE_READINGS_LIMIT) {
          await incFreeReadings();
          setFreeRestantes((r) => Math.max(0, r - 1));
        } else {
          const restante = Math.max(0, (await getPaidReadings()) - 1);
          await setPaidReadingsStore(restante);
          setPaidReadings(restante);
        }
      }
    } catch (error: any) {
      toast.info("As energias estão se recalibrando. Tente novamente em um momento de paz. ✨"); 
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const isNative = Capacitor.isNativePlatform();
        if (isNative) { await SpeechRecognition.requestPermissions(); await VoiceRecorder.requestAudioRecordingPermission(); }
      } catch (e) {}
    };
    requestPermissions();
  }, []);

  // Toque para falar: usa a tela de voz do Google (transcreve de forma confiável
  // e devolve o texto), em vez do modo inline que falhava em muitos aparelhos.
  const gravarVoz = async () => {
    if (isGravando) return;
    try {
      const isNative = Capacitor.isNativePlatform();
      if (!isNative) {
        const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SR) { toast.info('Seu navegador não suporta voz. Digite sua pergunta. ✨'); return; }
        const recognition = new SR();
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          const txt = Array.from(event.results).map((r: any) => r[0].transcript).join(' ');
          setDesabafo(txt);
        };
        recognition.onend = () => setIsGravando(false);
        recognition.start();
        setIsGravando(true);
        return;
      }

      // Permissão do microfone
      let perm = await SpeechRecognition.checkPermissions();
      if (perm.speechRecognition !== 'granted') {
        perm = await SpeechRecognition.requestPermissions();
      }
      if (perm.speechRecognition !== 'granted') {
        toast.error('Permita o microfone nas configurações para usar a voz. 🎤');
        return;
      }

      const { available } = await SpeechRecognition.available();
      if (!available) {
        toast.info('Voz indisponível neste aparelho. Pode digitar sua pergunta. ✨');
        return;
      }

      setIsGravando(true);
      // popup do Google + partialResults:false → devolve a transcrição final
      const result: any = await SpeechRecognition.start({ language: 'pt-BR', popup: true, partialResults: false });
      setIsGravando(false);
      const texto = result?.matches?.[0];
      if (texto) {
        setDesabafo((prev) => (prev ? prev.trim() + ' ' : '') + texto);
      } else {
        toast.info('Não consegui entender. Toque e fale de novo. 🎤');
      }
    } catch (err: any) {
      setIsGravando(false);
      const msg = (err?.message || '').toLowerCase();
      // Cancelamento / "sem correspondência" não são erros que precisam alarmar
      if (msg && !msg.includes('cancel') && !msg.includes('no match') && !msg.includes('no speech')) {
        toast.info('Não consegui ouvir agora. Tente de novo ou digite. 🎤');
      }
    }
  };

  return (
    <div className="w-full text-[#5C4D3C] font-sans flex flex-col items-center relative min-h-[100dvh] bg-transparent overflow-y-auto no-scrollbar">
      <div className="relative z-10 w-full max-w-md flex flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-[max(env(safe-area-inset-bottom),130px)] min-h-[100dvh]">

        <div className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-1000 pb-4 flex-1 justify-start">
          {passo === 0 && (
            <>
              <div className="flex flex-col items-center w-full gap-4 shrink-0">
                {/* Ícone Superior - dentro do fluxo para não sobrepor o título */}
                <div className="flex justify-center pointer-events-none animate-in fade-in duration-500">
                  <div className="w-20 h-20 flex-none">
                    <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow image-render-sharp" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-serif text-[#8B735B] text-center px-4 leading-tight tracking-tight drop-shadow-sm">Qual arcano você escolhe hoje?</h2>
                <div onClick={() => setModalAberto('mensagem_ampliada')} className="w-full max-w-[340px] p-2.5 bg-[#C4A484]/15 backdrop-blur-md rounded-[28px] border border-[#C4A484]/30 shadow-lg relative overflow-hidden group cursor-pointer flex flex-col items-center text-center space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-[#C4A484] animate-pulse" /><span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#C4A484]">Sintonização do Dia</span><Sparkles size={12} className="text-[#C4A484] animate-pulse" />
                  </div>
                  <p className="text-[14px] font-serif font-bold text-[#4A3B28]">{saudacaoDoDia()}, {primeiroNome}! ✨</p>
                  <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#8B735B]/60 group-hover:text-[#C4A484] transition-colors">Toque para ler a mensagem completa ✨</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full max-w-[360px] shrink-0">
                {[
                  { id: 'Tarô', title: 'TARÔ CLÁSSICO', img: '/assets/decks/covers/taro.jpg', desc: 'A jornada épica da alma' },
                  { id: 'Baralho Cigano', title: 'BARALHO CIGANO', img: '/assets/decks/covers/cigano.jpg', desc: 'Respostas claras e objetivas' },
                  { id: 'Tarô dos Anjos', title: 'TARÔ DOS ANJOS', img: '/assets/decks/covers/anjos.jpg', desc: 'Aconselhamento celestial' }
                ].map((o) => (
                  <button key={o.id} onClick={() => { setTipoOraculo(o.id); nextPasso(); }} className="flex items-center gap-4 md:gap-5 group w-full bg-white/15 backdrop-blur-lg border border-white/30 p-2.5 md:p-3 rounded-[32px] shadow-lg hover:shadow-xl active:scale-[0.96] transition-all">
                    <div className="w-14 h-20 md:w-16 md:h-24 bg-white/10 rounded-[18px] border border-white/20 p-1 overflow-hidden shrink-0 shadow-sm">
                      <img src={o.img} alt={o.title} className="w-full h-full object-cover rounded-[14px]" />
                    </div>
                    <div className="flex flex-col text-left space-y-0.5">
                      <div className="flex flex-col">
                        <span className="text-[12px] md:text-[13px] font-black tracking-[0.25em] text-[#8B735B] uppercase leading-none">{o.title.split(' ')[0]}</span>
                        <span className="text-[#C4A484] text-[11px] md:text-[12px] font-black tracking-[0.25em] uppercase">{o.title.split(' ').slice(1).join(' ')}</span>
                      </div>
                      <span className="text-[8px] md:text-[9px] font-medium text-[#8B735B]/50 uppercase tracking-widest leading-tight">{o.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center gap-3 w-full shrink-0 pt-4">
                 {/* Selo de sequência de dias (hábito) */}
                 {streak > 1 && (
                   <div className="flex items-center gap-1.5 rounded-full bg-[#D69E2E]/10 border border-[#D69E2E]/25 px-3 py-1">
                     <span className="text-[11px]">🔥</span>
                     <span className="text-[8px] font-black uppercase tracking-widest text-[#8B735B]">{streak} dias de sintonia</span>
                   </div>
                 )}
                 {/* Selo de status: premium ou consultas grátis restantes */}
                 {isPremiumUser ? (
                   <div className="flex items-center gap-1.5 rounded-full bg-[#C4A484]/15 border border-[#C4A484]/30 px-3 py-1">
                     <Crown size={11} className="text-[#C4A484]" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-[#8B735B]">Premium Ativo</span>
                   </div>
                 ) : (
                   <button onClick={() => setModalAberto('assinatura')} className="flex items-center gap-1.5 rounded-full bg-[#C4A484]/10 border border-[#C4A484]/25 px-3 py-1 active:scale-95 transition-all">
                     <Sparkles size={11} className="text-[#C4A484]" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-[#8B735B]">
                       {freeRestantes > 0 ? `${freeRestantes} ${freeRestantes === 1 ? 'consulta grátis' : 'consultas grátis'}` : 'Seja Premium para continuar'}
                     </span>
                   </button>
                 )}
                 <div className="flex items-center gap-1.5 w-full justify-center flex-wrap px-1">
                    <button onClick={() => setModalAberto('assinatura')} className="flex items-center gap-1.5 rounded-full border border-[#E5D9C3] bg-white/70 px-2.5 py-1 shadow-sm active:scale-95 transition-all group"><div className="w-3.5 h-3.5 flex-none"><img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" /></div><span className="text-[8px] font-black text-[#8B735B] uppercase tracking-widest">Premium</span></button>
                    <button onClick={() => setModalAberto('ajuda')} className="flex items-center gap-1.5 rounded-full border border-[#E5D9C3] bg-white/70 px-2.5 py-1 shadow-sm active:scale-95 transition-all group"><div className="w-3.5 h-3.5 flex-none"><img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" /></div><span className="text-[8px] font-black uppercase tracking-widest text-[#C4A484]">Ajuda</span></button>
                    <button onClick={() => { setModalAberto('historico'); carregarHistorico(); }} className="flex items-center gap-1.5 rounded-full border border-[#E5D9C3] bg-white/70 px-2.5 py-1 shadow-sm active:scale-95 transition-all group"><div className="w-3.5 h-3.5 flex-none"><img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" /></div><span className="text-[8px] font-black uppercase tracking-widest text-[#C4A484]">Histórico</span></button>
                    <button onClick={() => setModalAberto('politicas')} className="flex items-center gap-1.5 rounded-full border border-[#E5D9C3] bg-white/70 px-2.5 py-1 shadow-sm active:scale-95 transition-all group"><div className="w-3.5 h-3.5 flex-none"><img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" /></div><span className="text-[8px] font-black uppercase tracking-widest text-[#C4A484]">Políticas</span></button>
                    <button onClick={handleSair} className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-white/50 px-2.5 py-1 rounded-full border border-red-100/50 active:scale-95 transition-all">Sair</button>
                 </div>
              </div>
            </>
          )}

          {passo === 1 && (
            <div className="flex flex-col items-center justify-center w-full gap-8 animate-in fade-in slide-in-from-right-4 duration-700 flex-1">
              <div className="flex flex-col items-center w-full gap-4 shrink-0 mb-4">
                <div className="flex justify-center pointer-events-none mb-2">
                  <div className="w-20 h-20 flex-none">
                    <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow image-render-sharp" />
                  </div>
                </div>
                <div className="bg-[#C4A484]/15 backdrop-blur-md px-8 py-4 rounded-[28px] border border-[#C4A484]/30 shadow-sm">
                  <h2 className="text-2xl md:text-3xl font-serif text-[#4A3B28] text-center leading-tight drop-shadow-sm">Onde sua alma busca luz?</h2>
                </div>
              </div>

              {/* Botão para revelar o Presságio do Dia (abre em pop-up, não corta a tela) */}
              <button onClick={abrirPressagio} className="flex items-center gap-2 rounded-full border border-[#C4A484]/40 bg-white/50 px-4 py-2 shadow-sm active:scale-95 transition-all">
                <Sparkles size={12} className="text-[#C4A484]" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#8B735B]">Ver Presságio do Dia</span>
              </button>

              <div className="flex flex-col gap-2.5 w-full max-w-[340px]">
                {TEMAS.map((t) => (
                  <button key={t.label} onClick={() => { setTema(t.label); nextPasso(); }} className="w-full h-14 rounded-[22px] bg-white/10 backdrop-blur-md border border-white/20 p-[2px] shadow-sm active:scale-[0.98] transition-all group">
                    <div className="w-full h-full bg-transparent rounded-[20px] flex items-center justify-between px-6">
                      <div className="flex items-center gap-4"><div className={`p-1.5 rounded-full bg-white/50 shadow-sm ${t.color}`}><t.icon className="w-4 h-4" /></div><span className={`text-sm font-bold tracking-[0.2em] uppercase ${t.color}`}>{t.label}</span></div>
                      <ChevronLeft className={`w-4 h-4 rotate-180 opacity-30 ${t.color}`} />
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={prevPasso} className="py-2 px-10 rounded-full bg-white/50 border border-[#E5D9C3] shadow-sm text-[8px] font-black uppercase tracking-[0.4em] text-[#C4A484] active:scale-95 transition-all">‹ Voltar ao Oráculo</button>
            </div>
          )}

          {passo === 2 && (
            <div className="flex flex-col items-center justify-center w-full gap-6 animate-in fade-in slide-in-from-right-4 duration-700 flex-1">
              <div className="flex flex-col items-center w-full gap-4 shrink-0 mt-6 mb-4">
                <div className="bg-[#C4A484]/15 backdrop-blur-md px-8 py-4 rounded-[28px] border border-[#C4A484]/30 shadow-sm">
                  <h2 className="text-2xl md:text-3xl font-serif text-[#4A3B28] text-center leading-tight drop-shadow-sm">Abra o seu coração</h2>
                </div>
              </div>
              <div className="w-full max-w-[340px] bg-white/5 backdrop-blur-md rounded-[24px] border border-[#E5D9C3]/40 p-6 shadow-sm space-y-4">
                <textarea value={desabafo} onChange={(e) => setDesabafo(e.target.value)} placeholder="Escreva sua dúvida..." className="w-full h-32 bg-transparent border-none focus:outline-none text-base md:text-lg font-medium text-[#4A3B28] resize-none placeholder:text-[#8B735B]/50" />
                <div className="space-y-3 pt-4 border-t border-[#E5D9C3]/40">
                  <button onClick={gravarVoz} className={`w-full py-4 rounded-full flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] transition-all ${isGravando ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-[#4A3B28] border border-[#E5D9C3]/50'}`}><Mic size={16} /> {isGravando ? 'Ouvindo...' : 'Toque para Falar'}</button>
                  <button onClick={nextPasso} disabled={!desabafo && !isGravando} className="w-full bg-[#4A3B28] text-white py-4 rounded-full text-[9px] font-black uppercase tracking-[0.4em] shadow-md disabled:opacity-20">Prosseguir</button>
                </div>
              </div>
              <button onClick={prevPasso} className="py-2 px-10 rounded-full bg-white/50 border border-[#E5D9C3] shadow-sm text-[8px] font-black uppercase tracking-[0.4em] text-[#C4A484]">‹ Trocar Foco ({tema.toUpperCase()})</button>
            </div>
          )}

          {passo === 3 && (
            <div className="flex flex-col items-center justify-center w-full gap-6 animate-in fade-in slide-in-from-right-4 duration-700 flex-1">
              <div className="flex flex-col items-center w-full gap-4 shrink-0 mb-4">
                <div className="flex justify-center pointer-events-none mb-2">
                  <div className="w-20 h-20 flex-none">
                    <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow image-render-sharp" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-serif text-[#8B735B] text-center px-4 leading-tight drop-shadow-sm">Consulte o Invisível</h2>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-[340px]">
                {[ { id: 'foto', icon: Eye, title: 'Visão do Jogo Físico', color: 'bg-[#065f46]' }, { id: 'completa', icon: Wand2, title: 'Caminho do Destino', color: 'bg-[#991b1b]' }, { id: 'sim_nao', icon: Compass, title: 'Bússola Sim ou Não', color: 'bg-[#a16207]' } ].map((m) => (
                  <button key={m.id} onClick={() => handleLeitura(m.id)} className="w-full h-16 flex items-center gap-5 bg-white/10 backdrop-blur-md border border-white/20 px-6 rounded-full shadow-lg active:scale-[0.98] transition-all group">
                    <div className={`w-10 h-10 ${m.color} rounded-[14px] flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform duration-500`}><m.icon size={20} /></div>
                    <h4 className="font-black text-[10px] text-[#5C4D3C] uppercase tracking-[0.25em] text-left leading-relaxed">{m.title}</h4>
                  </button>
                ))}
              </div>
              <div className="pt-8">
                <button onClick={prevPasso} className="py-2 px-10 rounded-full bg-white/50 border border-[#E5D9C3] shadow-sm text-[8px] font-black uppercase tracking-[0.4em] text-[#C4A484] active:scale-95 transition-all">‹ Refazer Pergunta</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {passo === 4 && resultado && (
        <div className="fixed inset-0 z-50 bg-[#FDFBF7] flex flex-col items-center px-6 py-10 overflow-y-auto no-scrollbar">
          <div className="mb-6 text-center shrink-0">
            <div className="inline-block px-3 py-1 bg-[#C4A484]/10 rounded-full text-[8px] font-bold text-[#C4A484] uppercase tracking-widest border border-[#C4A484]/20 mb-2">{resultado.tema}</div>
            <h2 className="text-2xl font-serif text-[#C4A484] leading-tight">Sua Revelação</h2>
          </div>

          <div className="flex flex-col items-center mb-8 w-full py-2">
            {resultado.situacao_atual ? (
              <div className="flex flex-row justify-center gap-2 w-full">
                <CardResult title="Situação" data={resultado.situacao_atual} index={1} tipoOraculo={tipoOraculo} />
                <CardResult title="Caminho" data={resultado.caminho_acao} index={2} tipoOraculo={tipoOraculo} />
                <CardResult title="Resultado" data={resultado.resultado_conselho} index={3} tipoOraculo={tipoOraculo} />
              </div>
            ) : resultado.carta_sorteada && (
              <div className="flex flex-col items-center gap-6">
                <CardResult title="O Arcano" data={resultado.carta_sorteada} index={0} tipoOraculo={tipoOraculo} />
              </div>
            )}
          </div>

          <div className="w-full max-w-[360px] space-y-8 pb-12">
             {/* 1. Síntese do Destino */}
             <div className="bg-[#2C2420] rounded-[32px] border border-white/5 p-8 shadow-2xl text-white/90 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-12 h-12 text-[#C4A484]" /></div>
                <h3 className="text-[#C4A484] font-serif text-xl mb-4 text-center">{resultado.leitura_caminho?.titulo || "A Voz do Destino"}</h3>
                <p className="text-sm leading-relaxed text-white/80 font-sans font-light text-center">{resultado.leitura_caminho?.analise_detalhada}</p>
                {resultado.leitura_caminho?.veredito_direto && (
                  <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C4A484]">Veredito</span>
                    <span className="text-2xl font-serif font-bold text-white tracking-widest">{resultado.leitura_caminho.veredito_direto}</span>
                  </div>
                )}
             </div>

             {/* 2. Interpretação das Cartas (Oculta se for Sim/Não) */}
             {resultado.tipoLeitura !== 'sim_nao' && (
               <div className="space-y-4">
                  {resultado.situacao_atual && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-[24px] border border-[#E5D9C3] p-6 space-y-2">
                      <h4 className="text-[10px] font-black text-[#C4A484] uppercase tracking-widest">A Situação: {resultado.situacao_atual.carta}</h4>
                      <p className="text-xs text-[#5C4D3C] leading-relaxed text-center">{resultado.situacao_atual.interpretacao}</p>
                    </div>
                  )}
                  {resultado.caminho_acao && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-[24px] border border-[#E5D9C3] p-6 space-y-2">
                      <h4 className="text-[10px] font-black text-[#C4A484] uppercase tracking-widest">O Caminho: {resultado.caminho_acao.carta}</h4>
                      <p className="text-xs text-[#5C4D3C] leading-relaxed text-center">{resultado.caminho_acao.interpretacao}</p>
                    </div>
                  )}
                  {resultado.resultado_conselho && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-[24px] border border-[#E5D9C3] p-6 space-y-2">
                      <h4 className="text-[10px] font-black text-[#C4A484] uppercase tracking-widest">O Resultado: {resultado.resultado_conselho.carta}</h4>
                      <p className="text-xs text-[#5C4D3C] leading-relaxed text-center">{resultado.resultado_conselho.interpretacao}</p>
                    </div>
                  )}
                  {resultado.carta_sorteada && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-[24px] border border-[#E5D9C3] p-6 space-y-2">
                      <h4 className="text-[10px] font-black text-[#C4A484] uppercase tracking-widest">{resultado.carta_sorteada.carta}</h4>
                      <p className="text-xs text-[#5C4D3C] leading-relaxed text-center">{resultado.carta_sorteada.interpretacao}</p>
                    </div>
                  )}
               </div>
             )}

             {/* 3. Acolhimento Psicológico */}
             {resultado.acolhimento_psicologico && (
               <div className="bg-[#4A3B28]/10 backdrop-blur-sm rounded-[32px] border-2 border-[#E5D9C3] p-8 shadow-xl space-y-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-[#C4A484]/10"><Heart className="w-6 h-6 text-[#C4A484]" /></div>
                    <h4 className="text-lg font-serif text-[#4A3B28]">{resultado.acolhimento_psicologico.titulo || "Um Espaço de Escuta e Acolhimento"}</h4>
                  </div>
                  
                  <details className="group">
                    <summary className="list-none cursor-pointer flex flex-col items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C4A484] group-open:hidden py-2 px-6 rounded-full border border-[#C4A484]/20 hover:bg-[#C4A484]/5 transition-all">
                        Quer um aconselhamento do Psico?
                      </span>
                    </summary>
                    <div className="animate-in fade-in slide-in-from-top-2 duration-500 pt-4">
                      <p className="text-sm italic text-[#5C4D3C] leading-relaxed text-center font-medium">&quot;{resultado.acolhimento_psicologico.conteudo}&quot;</p>
                    </div>
                  </details>
               </div>
             )}

             {/* 4. Ancoragem e Rituais */}
             {resultado.ancoragem_rituais && (
               <div className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-px flex-1 bg-[#E5D9C3]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B735B]">Rituais de Ancoragem</span>
                    <div className="h-px flex-1 bg-[#E5D9C3]" />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {resultado.ancoragem_rituais.mantra && (
                      <div className="bg-gradient-to-br from-white to-[#FDFBF7] rounded-[24px] border border-[#E5D9C3] p-6 shadow-sm flex flex-col items-center text-center gap-3">
                        <Sparkles className="w-5 h-5 text-[#C4A484]" />
                        <h5 className="text-[9px] font-black text-[#8B735B]/60 uppercase tracking-[0.3em]">Mantra da Alma</h5>
                        <p className="text-sm font-serif font-bold text-[#4A3B28] italic leading-relaxed">&quot;{resultado.ancoragem_rituais.mantra}&quot;</p>
                      </div>
                    )}

                    {resultado.ancoragem_rituais.salmo && (
                      <div className="bg-white rounded-[24px] border border-[#E5D9C3] p-6 shadow-sm space-y-2">
                        <h5 className="text-[9px] font-black text-[#C4A484] uppercase tracking-widest flex items-center gap-2">
                           {tipoOraculo === 'Tarô dos Anjos' ? 'Salmo Sagrado' : 'Dica da Cigana'}
                        </h5>
                        <p className="text-xs text-[#5C4D3C] leading-relaxed font-medium text-center">{resultado.ancoragem_rituais.salmo}</p>
                      </div>
                    )}

                    {resultado.ancoragem_rituais.banho && (
                      <div className="bg-[#C4A484]/5 rounded-[24px] border border-[#C4A484]/20 p-6 shadow-sm space-y-2">
                        <h5 className="text-[9px] font-black text-[#C4A484] uppercase tracking-widest">Banho ou Erva Mística</h5>
                        <p className="text-xs text-[#5C4D3C] leading-relaxed font-medium text-center">{resultado.ancoragem_rituais.banho}</p>
                      </div>
                    )}

                    {resultado.ancoragem_rituais.biblia && (
                      <div className="bg-white rounded-[24px] border border-[#E5D9C3] p-6 shadow-sm space-y-2 italic">
                        <h5 className="text-[9px] font-black text-[#8B735B]/60 uppercase tracking-widest not-italic">Versículo de Acolhimento</h5>
                        <p className="text-xs text-[#5C4D3C] leading-relaxed text-center">&quot;{resultado.ancoragem_rituais.biblia}&quot;</p>
                      </div>
                    )}

                    {resultado.ancoragem_rituais.dica_angelical && (
                      <div className="bg-[#4FD1C5]/5 rounded-[24px] border border-[#4FD1C5]/20 p-6 shadow-sm space-y-4">
                        <h5 className="text-[9px] font-black text-[#4FD1C5] uppercase tracking-widest">Ritual Angelical</h5>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <span className="text-[8px] font-bold text-[#8B735B]/60 uppercase">Foco</span>
                              <p className="text-[10px] font-bold text-[#5C4D3C]">{resultado.ancoragem_rituais.dica_angelical.foco_oracao}</p>
                           </div>
                           <div className="space-y-1">
                              <span className="text-[8px] font-bold text-[#8B735B]/60 uppercase">Vela</span>
                              <p className="text-[10px] font-bold text-[#5C4D3C]">{resultado.ancoragem_rituais.dica_angelical.vela_cor}</p>
                           </div>
                        </div>
                        <p className="text-xs text-[#5C4D3C] leading-relaxed border-t border-[#4FD1C5]/10 pt-3 text-center">{resultado.ancoragem_rituais.dica_angelical.dica_texto}</p>
                      </div>
                    )}
                  </div>
               </div>
             )}

             {/* Pergunta sugerida (isca) + resposta rápida */}
             {resultado.pergunta_sugerida && (
               <div className="flex flex-col items-center gap-3">
                 {!respostaRapida ? (
                   <button
                     onClick={handlePerguntaSugerida}
                     disabled={loadingRapida}
                     className="w-full flex items-center justify-center gap-2 py-4 px-5 rounded-[24px] bg-[#C4A484]/10 border border-[#C4A484]/40 text-[#8B735B] active:scale-[0.98] transition-all disabled:opacity-60"
                   >
                     <Sparkles size={15} className={`text-[#C4A484] ${loadingRapida ? 'animate-spin' : 'animate-pulse'}`} />
                     <span className="text-[12px] font-bold text-[#5C4D3C]">
                       {loadingRapida ? 'Consultando o oráculo...' : resultado.pergunta_sugerida}
                     </span>
                   </button>
                 ) : (
                   <div className="w-full bg-[#2C2420] rounded-[24px] border border-[#C4A484]/20 p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                     <div className="flex items-center justify-center gap-2 mb-3">
                       <Sparkles size={12} className="text-[#C4A484]" />
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C4A484]">{resultado.pergunta_sugerida}</span>
                       <Sparkles size={12} className="text-[#C4A484]" />
                     </div>
                     <p className="text-base font-serif text-white/90 leading-relaxed">{respostaRapida}</p>
                   </div>
                 )}
               </div>
             )}

             {/* Compartilhar + Salvar (como imagem) */}
             <div className="flex gap-3">
               <button onClick={handleCompartilhar} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-[#C4A484]/15 border border-[#C4A484]/40 text-[#8B735B] active:scale-95 transition-all">
                 <Sparkles size={14} className="text-[#C4A484]" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Compartilhar</span>
               </button>
               <button onClick={handleSalvarLeitura} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-white/60 border border-[#E5D9C3] text-[#8B735B] active:scale-95 transition-all">
                 <Heart size={14} className="text-[#C4A484]" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Salvar</span>
               </button>
             </div>
             <button onClick={abrirAvaliar} className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-white/50 border border-[#E5D9C3] text-[#8B735B] active:scale-95 transition-all">
               <Star size={13} className="text-[#D69E2E]" />
               <span className="text-[10px] font-black uppercase tracking-widest">Avaliar o app</span>
             </button>

             {/* Card oculto que vira a imagem compartilhada/salva */}
             <div ref={shareCardRef} style={{ position: 'fixed', left: '-9999px', top: 0, width: '480px', background: '#FDFBF7', padding: '40px 36px', boxSizing: 'border-box', fontFamily: 'Georgia, "Times New Roman", serif', color: '#4A3B28' }}>
               <div style={{ textAlign: 'center', fontSize: '13px', letterSpacing: '6px', color: '#C4A484', fontWeight: 'bold', marginBottom: '22px' }}>✦ PSIQUÊ ORÁCULO ✦</div>
               {(desabafo || resultado?.tema) && (
                 <div style={{ background: 'rgba(196,164,132,0.12)', borderRadius: '18px', padding: '16px 20px', marginBottom: '22px', border: '1px solid rgba(196,164,132,0.35)' }}>
                   <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#8B735B', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>Minha pergunta</div>
                   <div style={{ fontSize: '17px', color: '#4A3B28', fontStyle: 'italic', lineHeight: 1.5 }}>{desabafo || resultado?.tema}</div>
                 </div>
               )}
               <div style={{ textAlign: 'center', fontSize: '22px', color: '#C4A484', marginBottom: '10px' }}>{resultado?.leitura_caminho?.titulo || 'A Voz do Destino'}</div>
               {(() => {
                 const cartas = resultado?.situacao_atual
                   ? [resultado.situacao_atual?.carta, resultado.caminho_acao?.carta, resultado.resultado_conselho?.carta].filter(Boolean).join('  ·  ')
                   : (resultado?.carta_sorteada?.carta || '');
                 return cartas ? (
                   <div style={{ textAlign: 'center', fontSize: '13px', letterSpacing: '2px', color: '#8B735B', textTransform: 'uppercase', marginBottom: '14px', fontFamily: 'Arial, sans-serif' }}>🃏 {cartas}</div>
                 ) : null;
               })()}
               {resultado?.leitura_caminho?.veredito_direto && (
                 <div style={{ textAlign: 'center', fontSize: '44px', fontWeight: 'bold', color: '#4A3B28', margin: '6px 0 16px', letterSpacing: '6px' }}>{resultado.leitura_caminho.veredito_direto}</div>
               )}
               <div style={{ fontSize: '15px', lineHeight: 1.6, color: '#5C4D3C', textAlign: 'center', fontStyle: 'italic' }}>
                 {(() => {
                   const t = (resultado?.leitura_caminho?.analise_detalhada || respostaRapida || '').trim();
                   const curto = t.slice(0, 150);
                   return t.length > 150 ? curto.slice(0, curto.lastIndexOf(' ')) + '…' : curto;
                 })()}
               </div>
               <div style={{ textAlign: 'center', marginTop: '26px', paddingTop: '16px', borderTop: '1px solid rgba(196,164,132,0.35)', fontSize: '12px', letterSpacing: '2px', color: '#8B735B', fontFamily: 'Arial, sans-serif' }}>✨ Faça sua leitura no Psiquê Oráculo ✨</div>
             </div>

             <button onClick={() => { setPasso(0); setResultado(null); setDesabafo(''); setRespostaRapida(null); window.scrollTo(0,0); }} className="w-full text-[10px] font-black uppercase tracking-[0.4em] text-white py-6 bg-gradient-to-br from-[#4A3B28] to-[#1A1614] shadow-2xl rounded-full active:scale-95 transition-all">Novo Ciclo ✨</button>
          </div>
        </div>
      )}

      {mostrarBoasVindas && (
        <div className="fixed inset-0 bg-[#FDFBF7] z-[120] flex flex-col items-center justify-center px-8 py-10 text-center animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
          <div className="w-28 h-28 flex-none mb-6 rounded-[28px] overflow-hidden shadow-lg border border-[#E5D9C3]">
            <img src="/assets/brand/icon-512.png" alt="Psiquê Oráculo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-serif text-[#C4A484] leading-tight mb-2">Bem-vinda ✨</h1>
          <p className="text-sm text-[#8B735B] max-w-[300px] leading-relaxed mb-6">
            Seu oráculo de bolso com <span className="font-bold">Tarô, Baralho Cigano e Tarô dos Anjos</span>, interpretado com sensibilidade e acolhimento.
          </p>

          <div className="w-full max-w-[320px] bg-[#C4A484]/10 border border-[#C4A484]/30 rounded-[28px] p-6 mb-8 flex flex-col items-center gap-2">
            <Sparkles size={20} className="text-[#C4A484]" />
            <span className="text-2xl font-serif font-bold text-[#4A3B28]">3 leituras grátis</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B735B]/70">para começar sua jornada</span>
          </div>

          <button
            onClick={fecharBoasVindas}
            className="w-full max-w-[320px] py-5 bg-gradient-to-br from-[#4A3B28] to-[#1A1614] text-white rounded-[24px] shadow-xl text-[11px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all"
          >
            Começar minha jornada
          </button>
          <p className="text-[9px] text-[#8B735B]/50 uppercase tracking-widest mt-4">Sem cadastro · É só escolher seu arcano</p>
        </div>
      )}

      {mostrarNovidades && (
        <div className="fixed inset-0 z-[119] flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#2C2420]/80 backdrop-blur-md" onClick={fecharNovidades} />
          <div className="relative w-full max-w-sm bg-[#FDFBF7] rounded-[32px] border border-[#E5D9C3] shadow-2xl p-7 z-[120] animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-[20px] overflow-hidden border border-[#E5D9C3] mb-3">
                <img src="/assets/brand/icon-512.png" alt="" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-serif text-[#C4A484]">Novidades ✨</h3>
              <p className="text-[11px] text-[#8B735B]/70 mt-1">O Psiquê Oráculo está ainda melhor</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { t: 'Plano mensal', d: 'Agora por R$ 19,90/mês, além do anual' },
                { t: 'Leitura avulsa', d: 'Pague só por uma consulta quando quiser' },
                { t: 'Pergunta rápida', d: 'Uma resposta extra no fim de cada leitura' },
                { t: 'App mais leve e rápido', d: 'Atualizado para abrir e rodar melhor' },
              ].map((n) => (
                <div key={n.t} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#48BB78] shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-[#4A3B28] leading-tight">{n.t}</p>
                    <p className="text-[11px] text-[#8B735B] leading-tight">{n.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={fecharNovidades} className="w-full py-4 bg-gradient-to-br from-[#4A3B28] to-[#1A1614] text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all">
              Explorar agora
            </button>
          </div>
        </div>
      )}

      {mostrarPressagio && (
        <div className="fixed inset-0 z-[118] flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#2C2420]/80 backdrop-blur-md" onClick={() => setMostrarPressagio(false)} />
          <div className="relative w-full max-w-sm bg-[#FDFBF7] rounded-[32px] border border-[#E5D9C3] shadow-2xl p-7 z-[120] flex flex-col items-center text-center animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-[#C4A484]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C4A484]">Presságio do Dia</span>
              <Sparkles size={14} className="text-[#C4A484]" />
            </div>
            {loadingConselho ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Sparkles size={22} className="text-[#C4A484] animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8B735B]/70">Consultando o oráculo...</span>
              </div>
            ) : conselhoDia ? (
              <>
                <div className="w-20 h-[112px] rounded-xl overflow-hidden border border-[#C4A484]/30 bg-[#FDFBF7] shadow-md mb-4">
                  <img src={conselhoDia.img} alt={conselhoDia.carta} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <h4 className="text-lg font-serif text-[#4A3B28] mb-2">{conselhoDia.carta}</h4>
                <p className="text-sm italic text-[#5C4D3C] leading-relaxed font-medium mb-6">&quot;{conselhoDia.texto}&quot;</p>
              </>
            ) : (
              <p className="text-sm text-[#8B735B] py-8">O oráculo sussurra em silêncio. Tente novamente.</p>
            )}
            <button onClick={() => setMostrarPressagio(false)} className="w-full py-4 bg-gradient-to-br from-[#4A3B28] to-[#1A1614] text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all">
              Voltar ao Oráculo
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-[#FDFBF7] z-[100] flex flex-col items-center justify-center overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-40 h-40 relative flex items-center justify-center">
              <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full animate-spin opacity-90 drop-shadow-lg" />
              <div className="absolute -inset-6 border-t-[3px] border-b-[3px] border-[#C4A484] rounded-full animate-spin-slow shadow-[0_0_30px_rgba(196,164,132,0.4)]" />
            </div>
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-[#8B735B] animate-pulse mt-16">Sintonizando Essência...</p>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#2C2420]/80 backdrop-blur-md" onClick={() => setModalAberto(null)} />
          
          <div className="relative w-full max-w-md bg-[#FDFBF7] rounded-[40px] border border-[#E5D9C3] shadow-2xl overflow-hidden h-[90vh] flex flex-col z-[110]">
            {/* Header do Modal */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-[#E5D9C3]/50 bg-[#FDFBF7]">
              <h3 className="text-2xl font-serif text-[#C4A484]">
                {modalAberto === 'assinatura' ? 'Portal da Abundância' : (modalAberto === 'ajuda' ? 'Santuário de Ajuda' : (modalAberto === 'historico' ? 'Minhas Leituras' : (modalAberto === 'mensagem_ampliada' ? 'Sintonização do Dia' : 'Políticas de Luz')))}
              </h3>
              <button onClick={() => setModalAberto(null)} className="p-2 hover:bg-[#C4A484]/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-[#C4A484]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 bg-[#FDFBF7]">
               {modalAberto === 'mensagem_ampliada' && (
                 <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-20 h-20 flex-none">
                      <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles size={14} className="text-[#C4A484]" />
                        <h4 className="text-xl font-serif text-[#C4A484] uppercase tracking-[0.2em]">{saudacaoDoDia()}, {primeiroNome}!</h4>
                        <Sparkles size={14} className="text-[#C4A484]" />
                      </div>
                      <div className="h-px w-12 bg-[#E5D9C3] mx-auto" />
                      <p className="text-lg italic text-[#4A3B28] font-serif leading-relaxed px-2 font-medium">
                        &quot;{mensagemDia?.texto || 'Que hoje você caminhe leve, confiando na sua luz. Respire, sinta e permita-se florescer. ✨'}&quot;
                      </p>
                    </div>

                    <div className="pt-8 border-t border-[#E5D9C3]/50 w-full">
                       <p className="text-[10px] font-black text-[#8B735B]/60 uppercase tracking-[0.4em]">Que sua essência brilhe hoje ✨</p>
                    </div>
                 </div>
               )}

               {modalAberto === 'assinatura' && (
                 <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-24 h-24 flex-none">
                      <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold text-[#4A3B28]">Acesso Premium</h4>
                      <p className="text-sm text-[#8B735B] leading-relaxed">
                        Desbloqueie <span className="font-bold">todos os oráculos</span>, rituais e leituras. Escolha o plano que combina com você.
                      </p>
                    </div>

                    <div className="w-full bg-white rounded-[32px] border border-[#E5D9C3] p-6 shadow-sm">
                      <div className="space-y-4 text-left">
                        {[
                          "Salmos e Cânticos da Bíblia",
                          "Psico Conselhos Inclusos",
                          "Simpatias e Banhos Místicos",
                          "Mantras e Meditações Sagradas",
                          "Acesso Total a todos os Decks",
                          "5 Tiragens Completas Diárias"
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#48BB78] shrink-0" />
                            <span className="text-[13px] font-medium text-[#5C4D3C]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="w-full space-y-3 pt-2">
                      {/* Plano Anual - destaque */}
                      <button
                        onClick={() => handleSubscribe('anual')}
                        disabled={loading}
                        className="w-full relative py-4 px-5 bg-gradient-to-br from-[#C4A484] to-[#8B735B] text-white rounded-[24px] shadow-xl active:scale-95 transition-all flex items-center justify-between disabled:opacity-60"
                      >
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Anual · Melhor valor</span>
                          <span className="text-lg font-black leading-tight">R$ 89,90 <span className="text-[11px] font-medium opacity-80">/ano</span></span>
                          <span className="text-[9px] font-medium opacity-70">Equivale a R$ 7,49/mês</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full">{loading ? '...' : 'Assinar'}</span>
                      </button>

                      {/* Plano Mensal */}
                      <button
                        onClick={() => handleSubscribe('mensal')}
                        disabled={loading}
                        className="w-full py-4 px-5 bg-white border border-[#C4A484]/40 rounded-[24px] shadow-sm active:scale-95 transition-all flex items-center justify-between disabled:opacity-60"
                      >
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B735B]/70">Mensal · Flexível</span>
                          <span className="text-lg font-black text-[#4A3B28] leading-tight">R$ 19,90 <span className="text-[11px] font-medium opacity-70">/mês</span></span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#C4A484]">{loading ? '...' : 'Assinar'}</span>
                      </button>

                      <p className="text-[9px] text-[#8B735B]/50 uppercase tracking-tighter text-center">Cancele quando quiser • Renovação automática</p>

                      {/* Opção avulsa - discreta, para quem não quer assinar */}
                      <div className="flex items-center gap-2 pt-2">
                        <div className="h-px flex-1 bg-[#E5D9C3]/60" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[#8B735B]/50">ou</span>
                        <div className="h-px flex-1 bg-[#E5D9C3]/60" />
                      </div>
                      <button
                        onClick={handleComprarAvulsa}
                        disabled={loading}
                        className="w-full py-3 rounded-[20px] border border-[#E5D9C3] bg-white/60 text-[#8B735B] active:scale-95 transition-all disabled:opacity-60"
                      >
                        <span className="text-[11px] font-bold">Só hoje? Liberar 1 leitura · R$ 2,06</span>
                      </button>
                    </div>
                 </div>
               )}

               {modalAberto === 'ajuda' && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col items-center text-center space-y-4">
                       <div className="w-16 h-16 flex-none">
                          <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" />
                       </div>
                       <h4 className="text-xl font-bold text-[#4A3B28]">Como sintonizar?</h4>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-[#C4A484]">1. Escolha seu Deck</h5>
                          <p className="text-sm text-[#5C4D3C] leading-relaxed">Navegue entre o Tarô Clássico, Baralho Cigano ou Tarô dos Anjos. Cada um possui uma vibração única para sua necessidade atual.</p>
                       </div>
                       <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-[#C4A484]">2. Defina o Tema</h5>
                          <p className="text-sm text-[#5C4D3C] leading-relaxed">Selecione a área da vida (Amor, Trabalho, Saúde, etc.) que deseja iluminar com a sabedoria do oráculo.</p>
                       </div>
                       <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-[#C4A484]">3. Abra o Coração</h5>
                          <p className="text-sm text-[#5C4D3C] leading-relaxed">Você pode escrever sua dúvida ou usar o comando de voz para desabafar. A sinceridade atrai as melhores respostas.</p>
                       </div>
                       <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-[#C4A484]">4. Consulte o Invisível</h5>
                          <p className="text-sm text-[#5C4D3C] leading-relaxed">Escolha entre uma leitura completa de 3 cartas, uma resposta direta Sim/Não ou a leitura de um jogo físico via foto.</p>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-[#E5D9C3]/50 text-center space-y-4">
                       <p className="text-[11px] font-bold text-[#8B735B]/60 uppercase tracking-widest">Ainda com dúvidas?</p>
                       <a href="mailto:angelinhaesf06@gmail.com" className="inline-block px-8 py-3 bg-[#C4A484]/10 text-[#C4A484] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#C4A484]/20">Suporte por E-mail</a>
                    </div>
                 </div>
               )}

               {modalAberto === 'historico' && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {loadingHistorico ? (
                      <div className="flex flex-col items-center gap-3 py-16">
                        <Sparkles size={22} className="text-[#C4A484] animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B735B]/70">Buscando suas leituras...</span>
                      </div>
                    ) : historicoLista.length === 0 ? (
                      <div className="flex flex-col items-center text-center gap-3 py-14">
                        <Sparkles size={20} className="text-[#C4A484]" />
                        <p className="text-sm text-[#8B735B] leading-relaxed max-w-[270px]">Você ainda não salvou leituras.<br />Após uma consulta, toque em <span className="font-bold">Salvar</span> para guardá-la aqui. ✨</p>
                        {!user && (
                          <button onClick={() => { setModalAberto(null); router.push('/login'); }} className="mt-2 px-6 py-2.5 bg-[#C4A484]/10 text-[#C4A484] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#C4A484]/20">Criar conta p/ guardar na nuvem</button>
                        )}
                      </div>
                    ) : (
                      historicoLista.map((h) => {
                        const r = h.resposta_ia || {};
                        const resumo = r?.leitura_caminho?.analise_detalhada || r?.carta_sorteada?.interpretacao || r?.acolhimento_quantum?.conteudo || 'Leitura registrada.';
                        const data = h.created_at ? new Date(h.created_at).toLocaleDateString('pt-BR') : '';
                        const abrirCompleta = () => {
                          if (h.tipo_oraculo) setTipoOraculo(h.tipo_oraculo);
                          setResultado(h.resposta_ia);
                          setRespostaRapida(null);
                          setModalAberto(null);
                          setPasso(4);
                          window.scrollTo(0, 0);
                        };
                        return (
                          <div key={h.id} onClick={abrirCompleta} className="bg-white/60 rounded-[20px] border border-[#E5D9C3] p-4 space-y-1.5 cursor-pointer active:scale-[0.99] transition-all">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#C4A484]">{h.tipo_oraculo}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-[#8B735B]/60">{data}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleExcluirLeitura(h); }} className="p-1 rounded-full hover:bg-red-50 active:scale-90 transition-all" aria-label="Excluir leitura">
                                  <Trash size={13} className="text-red-400" />
                                </button>
                              </div>
                            </div>
                            {h.pergunta_tema && <p className="text-[11px] font-bold text-[#4A3B28]">{h.pergunta_tema}</p>}
                            <p className="text-[11px] text-[#5C4D3C] leading-relaxed line-clamp-2">{resumo}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#C4A484]/80 pt-1">Toque para ver completa ✨</p>
                          </div>
                        );
                      })
                    )}
                 </div>
               )}

               {modalAberto === 'politicas' && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col items-center text-center space-y-4">
                       <div className="w-16 h-16 flex-none">
                          <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" />
                       </div>
                       <h4 className="text-xl font-bold text-[#4A3B28]">Privacidade Sagrada</h4>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-[#C4A484]">Dados Protegidos</h5>
                          <p className="text-sm text-[#5C4D3C] leading-relaxed">Suas perguntas, desabafos e tiragens são estritamente confidenciais e criptografadas. Ninguém, além de você, tem acesso ao seu histórico.</p>
                       </div>
                       <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-[#C4A484]">Termos de Uso</h5>
                          <p className="text-sm text-[#5C4D3C] leading-relaxed">O Psiquê Oráculo é uma ferramenta de autoconhecimento e entretenimento. Não substitui aconselhamento médico, psicológico ou jurídico profissional.</p>
                       </div>
                       <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-[#C4A484]">Pagamentos Seguros</h5>
                          <p className="text-sm text-[#5C4D3C] leading-relaxed">Todas as transações são processadas via Stripe ou Google Play Store, garantindo a segurança máxima dos seus dados financeiros.</p>
                       </div>
                       <div className="space-y-3">
                          <h5 className="text-[11px] font-black uppercase tracking-widest text-[#C4A484]">Uso da IA</h5>
                          <p className="text-sm text-[#5C4D3C] leading-relaxed">Utilizamos a tecnologia Google Gemini para processar as interpretações, unindo sabedoria ancestral com tecnologia de ponta.</p>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-[#E5D9C3]/50 text-center">
                       <button onClick={() => setModalAberto(null)} className="text-[10px] font-black text-[#C4A484] uppercase tracking-widest underline underline-offset-4">Entendido</button>
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
