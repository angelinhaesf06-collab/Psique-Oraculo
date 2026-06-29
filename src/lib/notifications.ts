import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

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
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
    }
    if (perm.display !== 'granted') return;

    // Cancela a anterior e reagenda (evita duplicar)
    await LocalNotifications.cancel({ notifications: [{ id: 777 }] });

    const frase = FRASES[Math.floor(Math.random() * FRASES.length)];
    await LocalNotifications.schedule({
      notifications: [{
        id: 777,
        title: 'Psiquê Oráculo',
        body: frase,
        schedule: { on: { hour: 9, minute: 0 }, allowWhileIdle: true },
      }],
    });
  } catch (e) {
    console.warn('Falha ao agendar notificação diária:', e);
  }
}
