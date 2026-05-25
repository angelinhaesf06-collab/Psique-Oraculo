import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, nome } = await req.json();
    const password = 'psique-oraculo-guest';

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Tentar buscar se o usuário já existe
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.users.find(u => u.email === email);

    if (existingUser) {
      // Se existe e não está confirmado, vamos confirmar agora
      if (!existingUser.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true
        });
      }
    } else {
      // 2. Se não existe, criar o usuário já confirmado
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: nome }
      });

      if (createError) throw createError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro no Quick Access:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
