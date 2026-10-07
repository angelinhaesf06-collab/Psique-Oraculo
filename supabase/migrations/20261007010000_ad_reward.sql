-- Recompensa por assistir anúncio (AdMob recompensado): +1 leitura bônus.
-- Com LIMITE DIÁRIO pra evitar abuso (alguém chamar o endpoint sem assistir).
-- Reaproveita profiles.bonus_readings (mesmo saldo do bônus de avaliar). Projeto: Psiquê Oráculo 🔮

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ad_rewards_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ad_rewards_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.grant_ad_reward(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_date DATE;
  v_count INTEGER;
  v_cap CONSTANT INTEGER := 5;  -- máximo de leituras por anúncio por dia
BEGIN
  SELECT ad_rewards_date, ad_rewards_count FROM public.profiles WHERE id = p_user_id INTO v_date, v_count;
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id) VALUES (p_user_id) ON CONFLICT (id) DO NOTHING;
    v_date := NULL; v_count := 0;
  END IF;
  -- Reseta a contagem a cada novo dia
  IF v_date IS NULL OR v_date < CURRENT_DATE THEN
    v_date := CURRENT_DATE;
    v_count := 0;
  END IF;
  IF v_count >= v_cap THEN
    RETURN json_build_object('granted', false, 'reason', 'daily_cap');
  END IF;
  UPDATE public.profiles
     SET bonus_readings = COALESCE(bonus_readings, 0) + 1,
         ad_rewards_date = v_date,
         ad_rewards_count = v_count + 1
   WHERE id = p_user_id;
  RETURN json_build_object('granted', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.grant_ad_reward(UUID) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
