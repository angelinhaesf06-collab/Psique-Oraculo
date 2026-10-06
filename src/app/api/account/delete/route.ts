import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Exclui PERMANENTEMENTE a conta do usuário e seus dados (exigência Apple 5.1.1(v) e LGPD).
// Usa a service role (admin) pra apagar o usuário de auth + os dados vinculados.
// force-dynamic: lê o header Authorization por requisição. No build do APP (output:export)
// a pasta /api é excluída (o app chama a API remota em pisiqueoraculo.com.br).
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Autentica pelo Bearer token (mesma lógica da rota de leitura).
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined" && authHeader !== "Bearer null" && authHeader.length > 15) {
      const token = authHeader.split(" ")[1];
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) userId = user.id;
      } catch (e) {
        console.error("account/delete: erro ao validar token:", e);
      }
    }

    if (!userId) {
      const res = NextResponse.json(
        { success: false, message: 'Sua sessão expirou. Entre novamente para excluir a conta.' },
        { status: 401 }
      );
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    // 1) Apaga os dados vinculados ao usuário.
    try { await supabaseAdmin.from('historico_leituras').delete().eq('user_id', userId); } catch (e) { console.warn("delete historico:", e); }
    try { await supabaseAdmin.from('profiles').delete().eq('id', userId); } catch (e) { console.warn("delete profile:", e); }

    // 2) Apaga o usuário de autenticação (exclusão definitiva).
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("account/delete: falha ao apagar usuário:", delErr.message);
      const res = NextResponse.json(
        { success: false, message: 'Não consegui excluir a conta agora. Tente novamente.' },
        { status: 500 }
      );
      res.headers.set('Access-Control-Allow-Origin', '*');
      return res;
    }

    const res = NextResponse.json({ success: true });
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ success: false, message: e?.message }, { status: 500 });
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
