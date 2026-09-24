import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

// Frases para PREMIUM (tom de NOITE): puro engajamento, sem venda.
const FRASES_PREMIUM = [
  'Antes de dormir, receba sua mensagem do oráculo 🌙',
  'A noite pede reflexão ✨ Veja o que as cartas trazem pra você.',
  'Feche o dia com sua Sintonização ✨ Toque para receber.',
  'Seu arcano da noite espera por você 🔮',
  'Respire fundo e ouça o oráculo antes de descansar 🌙',
];

// Frases para NÃO PREMIUM (tom de NOITE): engajamento + convite ao teste grátis.
const FRASES_GRATIS = [
  'Antes de dormir, faça sua leitura GRÁTIS no oráculo 🌙',
  'Bateu aquela dúvida? Pergunte ao oráculo agora — de graça ✨',
  'A noite é sua: amor, trabalho ou saúde? Consulte grátis 🔮',
  'Feche o dia com uma tiragem grátis e clareza pra amanhã 🌙',
  'Aproveite seu teste grátis do oráculo ✨ Toque e faça sua leitura.',
  'Continue sua jornada: tiragens ilimitadas te esperam no app 🔮',
];

// Agenda um lembrete diário (21:00) para trazer a pessoa de volta ao app.
// isPremium define o tom: premium = engajamento; não premium = convida ao grátis.
export async function agendarMensagemDiaria(isPremium: boolean = false) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // Canal de notificação (obrigatório no Android 8+)
    try {
      await LocalNotifications.createChannel({
        id: 'mensagem_dia',
        name: 'Mensagem do Dia',
        description: 'Lembrete diário da sua mensagem do oráculo',
        importance: 5,
        visibility: 1,
      });
    } catch {}

    // Permissão (Android 13+ exige)
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
    }
    if (perm.display !== 'granted') return;

    // Reagenda o lembrete diário das 21h (cancela o anterior para não duplicar)
    await LocalNotifications.cancel({ notifications: [{ id: 777 }] });
    const lista = isPremium ? FRASES_PREMIUM : FRASES_GRATIS;
    const frase = lista[Math.floor(Math.random() * lista.length)];
    await LocalNotifications.schedule({
      notifications: [{
        id: 777,
        channelId: 'mensagem_dia',
        title: 'Psiquê Oráculo',
        body: frase,
        schedule: { on: { hour: 21, minute: 0 }, allowWhileIdle: true },
      }],
    });

    // Confirmação única (~8s depois): a pessoa VÊ que ativou, e serve para testar.
    const confirmada = (await Preferences.get({ key: 'psique_notif_confirmada' })).value;
    if (confirmada !== '1') {
      await LocalNotifications.schedule({
        notifications: [{
          id: 778,
          channelId: 'mensagem_dia',
          title: 'Notificações ativadas ✨',
          body: 'Toda noite às 21h você recebe sua mensagem do oráculo aqui.',
          schedule: { at: new Date(Date.now() + 8000), allowWhileIdle: true },
        }],
      });
      await Preferences.set({ key: 'psique_notif_confirmada', value: '1' });
    }
  } catch (e) {
    console.warn('Falha ao agendar notificação diária:', e);
  }
}

// Aviso ÚNICO das novas ofertas de assinatura. Dispara algumas horas depois
// da pessoa abrir o app e é agendado apenas uma vez por aparelho.
// Para reenviar no futuro (nova campanha), troque a versão da chave (v1 -> v2).
export async function agendarAvisoOferta() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // v2 = campanha do teste de 24h (troca da versão faz reenviar para todos).
    const chave = 'psique_aviso_oferta_v2';
    const jaAvisou = (await Preferences.get({ key: chave })).value;
    if (jaAvisou === '1') return;

    // Garante o canal (idempotente) e a permissão
    try {
      await LocalNotifications.createChannel({
        id: 'mensagem_dia',
        name: 'Mensagem do Dia',
        description: 'Lembrete diário da sua mensagem do oráculo',
        importance: 5,
        visibility: 1,
      });
    } catch {}

    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    // Dispara em ~3h: traz a pessoa de volta ainda no mesmo dia.
    await LocalNotifications.schedule({
      notifications: [{
        id: 780,
        channelId: 'mensagem_dia',
        title: '24h grátis liberado no Psiquê Oráculo ✨',
        body: 'Ganhe 24 horas de tiragens ILIMITADAS! Toque e faça quantas leituras quiser hoje. 🔮',
        schedule: { at: new Date(Date.now() + 2 * 60 * 60 * 1000), allowWhileIdle: true },
      }],
    });
    await Preferences.set({ key: chave, value: '1' });
  } catch (e) {
    console.warn('Falha ao agendar aviso de oferta:', e);
  }
}
