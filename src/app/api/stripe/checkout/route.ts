import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-static';

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27-acacia' as any,
    });

    const { userId, email, isNative } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Usuário não identificado.' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pisiqueoraculo.com.br';
    const successUrl = isNative ? 'psiqueoraculo://checkout-return?success=true' : `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = isNative ? 'psiqueoraculo://checkout-return?success=false' : `${baseUrl}/`;

    // Cria a sessão de Checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID, 
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 1, // 24 horas grátis conforme solicitado
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Erro Stripe Checkout:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
