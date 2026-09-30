import { createClient } from '@supabase/supabase-js';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
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

// No iOS, o fetch do WebView falha ao chamar o Supabase ("TypeError: Load failed" /
// "Type error") — problema conhecido de CORS/rede do WKWebView. Solução: no iOS,
// as chamadas do Supabase passam pela REDE NATIVA (CapacitorHttp), contornando o
// WebView. Android e web continuam com o fetch padrão (que já funciona) — sem risco.
const isIOS = Capacitor.getPlatform() === 'ios';

const nativeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const req = input instanceof Request ? input : null;
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (req as Request).url);
  const method = (init?.method || req?.method || 'GET').toUpperCase();

  // Normaliza os headers para objeto simples — junta os do Request (se houver) E os do init.
  const headers: Record<string, string> = {};
  if (req) req.headers.forEach((v, k) => { headers[k] = v; });
  const h = init?.headers;
  if (h instanceof Headers) h.forEach((v, k) => { headers[k] = v; });
  else if (Array.isArray(h)) for (const [k, v] of h as [string, string][]) headers[k] = v;
  else if (h) Object.assign(headers, h as Record<string, string>);

  // Garante a apikey do Supabase (o CapacitorHttp às vezes não repassa esse header).
  if (!headers['apikey'] && !headers['apiKey'] && !headers['Apikey']) {
    headers['apikey'] = supabaseAnonKey;
  }

  // Corpo: o Supabase envia string JSON (no init.body ou no próprio Request).
  let data: any = undefined;
  let bodyStrIn: string | undefined;
  if (typeof init?.body === 'string') bodyStrIn = init.body;
  else if (req && !init?.body) { try { bodyStrIn = await req.clone().text(); } catch {} }
  if (bodyStrIn) { try { data = JSON.parse(bodyStrIn); } catch { data = bodyStrIn; } }

  const res = await CapacitorHttp.request({ url, method, headers, data });
  const bodyStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? '');
  return new Response(bodyStr, {
    status: res.status,
    headers: (res.headers as Record<string, string>) || {},
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isNative ? capacitorStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    // Em app nativo não há sessão na URL; na web mantemos o comportamento padrão.
    detectSessionInUrl: !isNative,
  },
  // Só no iOS trocamos o fetch pelo nativo (Android/web usam o padrão).
  global: isIOS ? { fetch: nativeFetch as unknown as typeof fetch } : undefined,
});
