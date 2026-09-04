'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Inicializa o OneSignal (push remoto) — SOMENTE no app nativo (Android).
// Requer a variavel NEXT_PUBLIC_ONESIGNAL_APP_ID no build.
//
// IMPORTANTE: OneSignal e um PLUGIN NATIVO. Ele so passa a funcionar apos um
// rebuild nativo + AAB novo na Play Store (nao vai por atualizacao Capgo/OTA).
// Na web nada acontece (o plugin nem e carregado).
export default function OneSignalInit() {
  useEffect(() => {
    const init = async () => {
      if (!Capacitor.isNativePlatform()) return;

      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      if (!appId || appId === 'seu_onesignal_app_id_aqui') {
        console.warn('OneSignal: NEXT_PUBLIC_ONESIGNAL_APP_ID nao definido — push desativado.');
        return;
      }

      try {
        const mod: any = await import('onesignal-cordova-plugin');
        const OneSignal = mod.default || mod;

        OneSignal.initialize(appId);

        // Mostra o prompt do sistema pedindo permissao de notificacao.
        try { await OneSignal.Notifications.requestPermission(true); } catch {}
      } catch (e) {
        console.warn('Falha ao inicializar OneSignal:', e);
      }
    };
    init();
  }, []);

  return null;
}
