import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Credita leitura(s) de COMPRA AVULSA (produto consumível 'leitura_avulsa'),
// validando na RevenueCat (JEITO SEGURO): consulta quantas compras avulsas o
// usuário REALMENTE tem e credita só a diferença do que já foi creditado.
// É idempotente — não dá pra forjar (precisa da compra real na RevenueCat) nem
// duplicar (o total creditado fica guardado em profiles.avulsa_credited).
// force-dynamic: precisa ler o token de autenticação em runtime.
export const dynamic = 'force-dynamic';

// Produto(s) de leitura avulsa configurados nas lojas.
const AVULSA_PRODUCT_IDS = ['leitura_avulsa'];

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const rcKey = process.env.REVENUECAT_SECRET_KEY;

    // 1) Identifica o usuário pelo token do Supabase.
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined" && authHeader !== "Bearer null" && authHeader.length > 15) {
      const token = authHeader.split(" ")[1];
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) userId = user.id;
      } catch (e) {
        console.error("grant-avulsa: erro ao validar token:", e);
      }
    }
    if (!userId) {
      const res = NextResponse.json({ granted: 0, reason: 'auth' }, { status: 401 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }
    if (!rcKey) {
      console.error("grant-avulsa: REVENUECAT_SECRET_KEY ausente no ambiente");
      const res = NextResponse.json({ granted: 0, reason: 'config' }, { status: 500 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    // 2) Pergunta pra RevenueCat quantas compras avulsas o usuário tem.
    //    O id na RevenueCat é o id do Supabase (setado via Purchases.logIn no app).
    let totalCompras = 0;
    try {
      const rcRes = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
        headers: { 'Authorization': `Bearer ${rcKey}`, 'Content-Type': 'application/json' },
      });
      if (rcRes.ok) {
        const rcData = await rcRes.json();
        const nonSubs = rcData?.subscriber?.non_subscriptions || {};
        for (const pid of AVULSA_PRODUCT_IDS) {
          const arr = nonSubs[pid];
          if (Array.isArray(arr)) totalCompras += arr.length;
        }
      } else {
        console.error("grant-avulsa: RevenueCat respondeu status", rcRes.status);
      }
    } catch (e: any) {
      console.error("grant-avulsa: erro ao consultar RevenueCat:", e?.message);
    }

    // 3) Credita no banco só a diferença (idempotente).
    let granted = 0;
    let bonus: number | undefined;
    try {
      const rpc = await supabaseAdmin.rpc('grant_avulsa_credit', { p_user_id: userId, p_total_purchases: totalCompras });
      if (!rpc.error && rpc.data) {
        granted = rpc.data.granted ?? 0;
        bonus = rpc.data.bonus;
      } else if (rpc.error) {
        console.error("grant-avulsa: erro no RPC:", rpc.error.message);
      }
    } catch (e: any) {
      console.error("grant-avulsa: exceção no RPC:", e?.message);
    }

    const res = NextResponse.json({ granted, bonus });
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ granted: 0, reason: 'error', message: e?.message }, { status: 500 });
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  }
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}
