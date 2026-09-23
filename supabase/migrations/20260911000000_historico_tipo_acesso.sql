-- Marca como cada leitura foi liberada: 'gratis', 'avulsa', 'premium', 'vip'
-- ou 'mensagem_dia'. Permite o relatório de grátis x pago direto no Supabase.
-- Projeto: Psiquê Oráculo 🔮

ALTER TABLE public.historico_leituras
  ADD COLUMN IF NOT EXISTS tipo_acesso TEXT;
