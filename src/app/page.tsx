'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash, Sparkles, Mic, Type, Camera, LayoutGrid, CheckCircle2, ChevronLeft, Heart, Briefcase, DollarSign, Activity, Users, LogOut, Sun, Moon, Star, X, Info, ShieldCheck, Crown, Eye, Wand2, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { drawCards, getAngelAttributes, getFallbackImageUrl } from '@/lib/cards';
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
  const [modalAberto, setModalAberto] = useState<'politicas' | 'ajuda' | 'assinatura' | 'paywall' | 'limite_diario' | 'mensagem_ampliada' | null>(null);
  const [mensagemDia, setMensagemDia] = useState<{ texto: string, autor: string } | null>(null);
  const [conselhoDia, setConselhoDia] = useState<{ carta: string, texto: string, img: string } | null>(null);
  const [loadingConselho, setLoadingConselho] = useState(false);

  // Conselho do Dia: 1 arcano do oráculo escolhido + conselho curto.
  // Cache por dia e por oráculo → no máximo 1 chamada de IA por dia/oráculo.
  const carregarConselhoDia = async (oraculo: string) => {
    if (!oraculo) return;
    const hoje = new Date().toLocaleDateString('pt-BR');
    const chave = `psique_conselho_${oraculo}_${hoje}`;
    try {
      const salvo = localStorage.getItem(chave);
      if (salvo) { setConselhoDia(JSON.parse(salvo)); return; }
    } catch {}
    setConselhoDia(null);
    setLoadingConselho(true);
    try {
      const cartas = await drawCards(oraculo, 1);
      const carta = cartas[0];
      const { data: { session } } = await supabase.auth.getSession();
      const siteUrl = 'https://www.pisiqueoraculo.com.br';
      const apiUrl = Capacitor.isNativePlatform() ? `${siteUrl}/api/oracle/read` : `/api/oracle/read`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '' },
        body: JSON.stringify({ tipoOraculo: oraculo, tipoLeitura: 'resposta_rapida', tema: 'Conselho do Dia', pergunta: 'Qual conselho breve e inspirador o oráculo me dá para hoje?', cartas })
      });
      const txt = await res.text();
      let data: any = {};
      try { data = JSON.parse(txt); } catch {}
      const conselho = { carta: carta.name, texto: data?.resposta_rapida || 'Confie no seu caminho hoje. ✨', img: carta.image_url };
      setConselhoDia(conselho);
      try { localStorage.setItem(chave, JSON.stringify(conselho)); } catch {}
    } catch {
      setConselhoDia(null);
    } finally {
      setLoadingConselho(false);
    }
  };

  // Carrega o conselho ao chegar no passo dos temas (com o oráculo já escolhido)
  useEffect(() => {
    if (passo === 1 && tipoOraculo) carregarConselhoDia(tipoOraculo);
  }, [passo, tipoOraculo]);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [freeRestantes, setFreeRestantes] = useState<number>(FREE_READINGS_LIMIT);
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
        let premium = false;
        if (session) {
          const { data: prof } = await supabase.from('profiles').select('is_premium').eq('id', session.user.id).single();
          premium = !!prof?.is_premium;
        }
        setIsPremiumUser(premium);
        const usadas = await getFreeReadingsUsed();
        setFreeRestantes(Math.max(0, FREE_READINGS_LIMIT - usadas));
        setPaidReadings(await getPaidReadings());

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
        const savedData = localStorage.getItem('psique_mensagem_dia');
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
              localStorage.setItem('psique_mensagem_dia', JSON.stringify(novaMensagem));
            }
          } catch (e) { console.error("Erro parse mensagem dia:", e); }
        }
      } catch (e) { console.error("Erro fetch mensagem dia:", e); }
    };
    fetchMensagemDia();
  }, []);

  const handleLogout = async () => { localStorage.removeItem('psique_demo_mode'); await supabase.auth.signOut(); router.push('/login'); };
  const nextPasso = () => setPasso(passo + 1);
  const prevPasso = () => setPasso(passo - 1);

  const handleLeitura = async (tipo: string, imageData?: string) => {
    // Controle de acesso: premium libera tudo; senão, 3 consultas grátis no aparelho.
    const { data: { session: gateSession } } = await supabase.auth.getSession();
    let isPremium = false;
    if (gateSession) {
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
      <div className="relative z-10 w-full max-w-md flex flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-8 min-h-[100dvh]">

        <div className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-1000 pb-4 flex-1 justify-center">
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
                {mensagemDia && (
                  <div onClick={() => setModalAberto('mensagem_ampliada')} className="w-full max-w-[340px] p-2.5 bg-[#C4A484]/15 backdrop-blur-md rounded-[28px] border border-[#C4A484]/30 shadow-lg relative overflow-hidden group cursor-pointer flex flex-col items-center text-center space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-[#C4A484] animate-pulse" /><span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#C4A484]">Sintonização do Dia</span><Sparkles size={12} className="text-[#C4A484] animate-pulse" />
                    </div>
                    <p className="text-[13px] italic text-[#5C4D3C] font-serif leading-relaxed line-clamp-3 px-2 font-medium">&quot;{mensagemDia.texto}&quot;</p>
                    <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#8B735B]/60 group-hover:text-[#C4A484] transition-colors">Toque para ler a mensagem completa ✨</span>
                  </div>
                )}
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
                    <button onClick={() => setModalAberto('politicas')} className="flex items-center gap-1.5 rounded-full border border-[#E5D9C3] bg-white/70 px-2.5 py-1 shadow-sm active:scale-95 transition-all group"><div className="w-3.5 h-3.5 flex-none"><img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" /></div><span className="text-[8px] font-black uppercase tracking-widest text-[#C4A484]">Políticas</span></button>
                    {user && (
                      <button onClick={handleLogout} className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-white/50 px-2.5 py-1 rounded-full border border-red-100/50 active:scale-95 transition-all">Sair</button>
                    )}
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

              {/* Conselho do Dia — 1 arcano do oráculo escolhido */}
              {(loadingConselho || conselhoDia) && (
                <div className="w-full max-w-[340px] bg-white/40 backdrop-blur-md rounded-[24px] border border-[#C4A484]/25 shadow-sm p-3 flex items-center gap-3 animate-in fade-in duration-500">
                  {loadingConselho ? (
                    <div className="flex items-center gap-3 w-full justify-center py-3">
                      <Sparkles size={14} className="text-[#C4A484] animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#8B735B]/70">Sorteando seu conselho...</span>
                    </div>
                  ) : conselhoDia && (
                    <>
                      <div className="w-12 h-[68px] rounded-lg overflow-hidden border border-[#C4A484]/30 bg-[#FDFBF7] shrink-0">
                        <img src={conselhoDia.img} alt={conselhoDia.carta} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="flex flex-col text-left gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={10} className="text-[#C4A484]" />
                          <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#C4A484]">Conselho do Dia · {conselhoDia.carta}</span>
                        </div>
                        <p className="text-[11px] italic text-[#5C4D3C] leading-snug font-medium">&quot;{conselhoDia.texto}&quot;</p>
                      </div>
                    </>
                  )}
                </div>
              )}

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
                <p className="text-sm leading-relaxed text-white/80 font-sans font-light text-left">{resultado.leitura_caminho?.analise_detalhada}</p>
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
                      <p className="text-xs text-[#5C4D3C] leading-relaxed">{resultado.situacao_atual.interpretacao}</p>
                    </div>
                  )}
                  {resultado.caminho_acao && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-[24px] border border-[#E5D9C3] p-6 space-y-2">
                      <h4 className="text-[10px] font-black text-[#C4A484] uppercase tracking-widest">O Caminho: {resultado.caminho_acao.carta}</h4>
                      <p className="text-xs text-[#5C4D3C] leading-relaxed">{resultado.caminho_acao.interpretacao}</p>
                    </div>
                  )}
                  {resultado.resultado_conselho && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-[24px] border border-[#E5D9C3] p-6 space-y-2">
                      <h4 className="text-[10px] font-black text-[#C4A484] uppercase tracking-widest">O Resultado: {resultado.resultado_conselho.carta}</h4>
                      <p className="text-xs text-[#5C4D3C] leading-relaxed">{resultado.resultado_conselho.interpretacao}</p>
                    </div>
                  )}
                  {resultado.carta_sorteada && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-[24px] border border-[#E5D9C3] p-6 space-y-2">
                      <h4 className="text-[10px] font-black text-[#C4A484] uppercase tracking-widest">{resultado.carta_sorteada.carta}</h4>
                      <p className="text-xs text-[#5C4D3C] leading-relaxed">{resultado.carta_sorteada.interpretacao}</p>
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
                      <p className="text-sm italic text-[#5C4D3C] leading-relaxed text-left font-medium">&quot;{resultado.acolhimento_psicologico.conteudo}&quot;</p>
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
                        <p className="text-xs text-[#5C4D3C] leading-relaxed font-medium">{resultado.ancoragem_rituais.salmo}</p>
                      </div>
                    )}

                    {resultado.ancoragem_rituais.banho && (
                      <div className="bg-[#C4A484]/5 rounded-[24px] border border-[#C4A484]/20 p-6 shadow-sm space-y-2">
                        <h5 className="text-[9px] font-black text-[#C4A484] uppercase tracking-widest">Banho ou Erva Mística</h5>
                        <p className="text-xs text-[#5C4D3C] leading-relaxed font-medium">{resultado.ancoragem_rituais.banho}</p>
                      </div>
                    )}

                    {resultado.ancoragem_rituais.biblia && (
                      <div className="bg-white rounded-[24px] border border-[#E5D9C3] p-6 shadow-sm space-y-2 italic">
                        <h5 className="text-[9px] font-black text-[#8B735B]/60 uppercase tracking-widest not-italic">Versículo de Acolhimento</h5>
                        <p className="text-xs text-[#5C4D3C] leading-relaxed">&quot;{resultado.ancoragem_rituais.biblia}&quot;</p>
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
                        <p className="text-xs text-[#5C4D3C] leading-relaxed border-t border-[#4FD1C5]/10 pt-3">{resultado.ancoragem_rituais.dica_angelical.dica_texto}</p>
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
                {modalAberto === 'assinatura' ? 'Portal da Abundância' : (modalAberto === 'ajuda' ? 'Santuário de Ajuda' : 'Políticas de Luz')}
              </h3>
              <button onClick={() => setModalAberto(null)} className="p-2 hover:bg-[#C4A484]/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-[#C4A484]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 bg-[#FDFBF7]">
               {modalAberto === 'mensagem_ampliada' && mensagemDia && (
                 <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-20 h-20 flex-none">
                      <img src="/assets/brand/mandala-login.png" alt="" className="w-full h-full object-contain animate-spin-slow" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles size={14} className="text-[#C4A484]" />
                        <h4 className="text-xl font-serif text-[#C4A484] uppercase tracking-[0.2em]">{mensagemDia.autor || "Sintonização"}</h4>
                        <Sparkles size={14} className="text-[#C4A484]" />
                      </div>
                      <div className="h-px w-12 bg-[#E5D9C3] mx-auto" />
                      <p className="text-lg italic text-[#4A3B28] font-serif leading-relaxed px-2 font-medium">
                        &quot;{mensagemDia.texto}&quot;
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
