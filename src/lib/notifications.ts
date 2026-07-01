import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

// Frases-convite (a mensagem real do dia aparece quando a pessoa abre o app).
const FRASES = [
  'Sua Sintonização do Dia chegou ✨ Toque para receber sua mensagem.',
  'O oráculo tem um recado para você hoje 🔮',
  'Comece o dia com sua mensagem de luz ✨',
  'Seu arcano do dia espera por você 🌙',
  'Respire fundo e veja o que as cartas trazem hoje ✨',
];

// Agenda um lembrete diário (09:00) para trazer a pessoa de volta ao app,
// mesmo quem baixou e ainda não assinou. Repete todos os dias.
export async function agendarMensagemDiaria() {
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

    // Reagenda o lembrete diário das 9h (cancela o anterior para não duplicar)
    await LocalNotifications.cancel({ notifications: [{ id: 777 }] });
    const frase = FRASES[Math.floor(Math.random() * FRASES.length)];
    await LocalNotifications.schedule({
      notifications: [{
        id: 777,
        channelId: 'mensagem_dia',
        title: 'Psiquê Oráculo',
        body: frase,
        schedule: { on: { hour: 9, minute: 0 }, allowWhileIdle: true },
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
          body: 'Todo dia às 9h você recebe sua mensagem do oráculo aqui.',
          schedule: { at: new Date(Date.now() + 8000), allowWhileIdle: true },
        }],
      });
      await Preferences.set({ key: 'psique_notif_confirmada', value: '1' });
    }
  } catch (e) {
    console.warn('Falha ao agendar notificação diária:', e);
  }
}
