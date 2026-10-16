-- Compra avulsa (leitura única) creditada pelo SERVIDOR, validada na RevenueCat.
-- Guarda quantas avulsas JÁ foram creditadas (avulsa_credited) e, a cada chamada,
-- credita só a diferença entre o total de compras confirmadas e o já creditado.
-- Assim não dá pra duplicar crédito nem forjar (o endpoint confere na RevenueCat).
-- Reaproveita profiles.bonus_readings (mesmo saldo dos outros bônus). Psiquê Oráculo 🔮

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avulsa_credited INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.grant_avulsa_credit(p_user_id UUID, p_total_purchases INTEGER)
RETURNS JSON AS $$
DECLARE
  v_credited INTEGER;
  v_new INTEGER;
  v_bonus INTEGER;
BEGIN
  SELECT COALESCE(avulsa_credited, 0) FROM public.profiles WHERE id = p_user_id INTO v_credited;
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id) VALUES (p_user_id) ON CONFLICT (id) DO NOTHING;
    v_credited := 0;
  END IF;

  -- Credita apenas a diferença (compras confirmadas - já creditadas).
  v_new := GREATEST(0, COALESCE(p_total_purchases, 0) - v_credited);

  UPDATE public.profiles
     SET bonus_readings = COALESCE(bonus_readings, 0) + v_new,
         avulsa_credited = GREATEST(COALESCE(avulsa_credited, 0), COALESCE(p_total_purchases, 0))
   WHERE id = p_user_id
   RETURNING COALESCE(bonus_readings, 0) INTO v_bonus;

  RETURN json_build_object('granted', v_new, 'bonus', v_bonus);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.grant_avulsa_credit(UUID, INTEGER) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
