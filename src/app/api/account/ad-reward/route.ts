import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Dá +1 leitura bônus quando o usuário assiste um anúncio recompensado (AdMob).
// Com limite diário (na função grant_ad_reward) pra evitar abuso. force-dynamic: lê o token.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined" && authHeader !== "Bearer null" && authHeader.length > 15) {
      const token = authHeader.split(" ")[1];
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) userId = user.id;
      } catch (e) {
        console.error("ad-reward: erro ao validar token:", e);
      }
    }

    if (!userId) {
      const res = NextResponse.json({ granted: false, reason: 'auth' }, { status: 401 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    let granted = false;
    let reason: string | undefined;
    try {
      const rpc = await supabaseAdmin.rpc('grant_ad_reward', { p_user_id: userId });
      if (!rpc.error && rpc.data) {
        granted = rpc.data.granted === true;
        reason = rpc.data.reason;
      } else if (rpc.error) {
        console.error("ad-reward: erro no RPC:", rpc.error.message);
      }
    } catch (e: any) {
      console.error("ad-reward: exceção:", e?.message);
    }

    const res = NextResponse.json({ granted, reason });
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ granted: false, reason: 'error', message: e?.message }, { status: 500 });
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
