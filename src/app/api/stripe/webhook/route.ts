import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Cliente com chave de SERVIÇO: necessário para escrever em 'profiles'
// contornando o RLS (a chave anônima é bloqueada nessas atualizações).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Necessário para o build de exportação estática (Capacitor) não falhar.
// No Vercel é ignorado e a rota roda normalmente como dinâmica.
export const dynamic = 'force-static';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27-acacia' as any,
  });

  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Lidar com os eventos
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

      if (userId) {
        // Ativar Premium e guardar o ID do cliente Stripe para futuros cancelamentos
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ is_premium: true, stripe_customer_id: customerId })
          .eq('id', userId);

        if (error) console.error('Erro ao ativar Premium:', error.message);
        else console.log(`Premium ativado para usuário ${userId}`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      // Assinatura cancelada ou expirada: remover o acesso Premium
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;

      if (customerId) {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ is_premium: false })
          .eq('stripe_customer_id', customerId);

        if (error) console.error('Erro ao remover Premium após cancelamento:', error.message);
        else console.log(`Premium removido para cliente Stripe ${customerId}`);
      }
      break;
    }

    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
