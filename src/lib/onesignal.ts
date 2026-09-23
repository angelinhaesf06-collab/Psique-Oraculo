import { Capacitor } from '@capacitor/core';

// App ID PÚBLICO do OneSignal (não é segredo — igual à chave pública do RevenueCat).
// Painel: onesignal.com → Psiquê Oráculo. Serve para enviar avisos/campanhas push
// para quem tiver esta versão (ou mais nova) do app instalada e aberta ao menos 1x.
const ONESIGNAL_APP_ID = 'd943ae47-afde-4243-bbe1-4f4857b199be';

// Inicializa o push do OneSignal (só no app nativo). Import dinâmico para não
// quebrar o build web/export estático (o plugin é nativo/Cordova).
export async function initOneSignal() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const OneSignal = (await import('onesignal-cordova-plugin')).default as any;
    OneSignal.initialize(ONESIGNAL_APP_ID);
    // Pede a permissão de notificação (diálogo do sistema). Se já tiver, não repete.
    try { await OneSignal.Notifications.requestPermission(true); } catch {}
  } catch (e) {
    console.warn('Falha ao inicializar OneSignal:', e);
  }
}
