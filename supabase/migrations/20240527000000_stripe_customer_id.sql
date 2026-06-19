-- Adiciona o ID do cliente Stripe ao perfil.
-- Necessário para remover o acesso Premium automaticamente quando a
-- assinatura é cancelada (evento customer.subscription.deleted do webhook).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles (stripe_customer_id);
