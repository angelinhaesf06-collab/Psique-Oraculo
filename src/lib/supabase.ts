import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Variáveis do Supabase não encontradas. O app pode falhar em funções de autenticação.");
}

// No Android (Capacitor), o localStorage do WebView é volátil: some ao fechar o app
// ou quando o Capgo aplica uma atualização OTA, derrubando o login.
// Por isso usamos o armazenamento NATIVO (Capacitor Preferences) para guardar a sessão.
const isNative = Capacitor.isNativePlatform();

const capacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key });
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try { await Preferences.set({ key, value }); } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try { await Preferences.remove({ key }); } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isNative ? capacitorStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    // Em app nativo não há sessão na URL; na web mantemos o comportamento padrão.
    detectSessionInUrl: !isNative,
  },
});
