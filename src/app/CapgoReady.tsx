'use client';

import { useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Confirma ao Capgo que o app carregou com sucesso.
// Sem esta chamada, o Capgo desfaz (rollback) qualquer atualização OTA por segurança.
export default function CapgoReady() {
  useEffect(() => {
    CapacitorUpdater.notifyAppReady().catch(() => {
      // Em ambiente web (sem Capacitor) o plugin não existe; ignoramos silenciosamente.
    });
  }, []);

  return null;
}
