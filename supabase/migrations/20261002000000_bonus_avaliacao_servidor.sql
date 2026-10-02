-- Bônus de "avaliar o app = 1 tiragem grátis" agora é controlado por CONTA (servidor),
-- à prova de reinstalação. Antes ficava só no aparelho (Capacitor Preferences), então
-- reinstalar/limpar dados zerava a trava e a pessoa resgatava o bônus de novo (+1 leitura
-- por reinstalação). Agora é uma vez por CONTA, e o consumo é validado no servidor.
-- Projeto: Psiquê Oráculo 🔮

-- 1) Colunas na conta: saldo de bônus e flag de "já resgatou avaliação".
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bonus_readings INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rated_bonus_claimed BOOLEAN NOT NULL DEFAULT false;

-- 2) Concede o bônus de avaliação UMA ÚNICA VEZ por conta (+1 tiragem).
--    Idempotente: chamar de novo não dá bônus extra.
CREATE OR REPLACE FUNCTION public.claim_rating_bonus(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
BEGIN
    SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id) VALUES (p_user_id) ON CONFLICT (id) DO NOTHING;
        SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;
    END IF;

    IF COALESCE(v_profile.rated_bonus_claimed, false) THEN
        RETURN json_build_object('granted', false, 'reason', 'already_claimed');
    END IF;

    UPDATE public.profiles
       SET rated_bonus_claimed = true,
           bonus_readings = COALESCE(bonus_readings, 0) + 1
     WHERE id = p_user_id;

    RETURN json_build_object('granted', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Consome 1 crédito de bônus, se houver. Chamada pelo servidor na hora da leitura.
CREATE OR REPLACE FUNCTION public.consume_bonus_reading(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_bonus INTEGER;
BEGIN
    SELECT COALESCE(bonus_readings, 0) FROM public.profiles WHERE id = p_user_id INTO v_bonus;
    IF v_bonus IS NULL OR v_bonus <= 0 THEN
        RETURN json_build_object('allowed', false);
    END IF;
    UPDATE public.profiles SET bonus_readings = bonus_readings - 1 WHERE id = p_user_id;
    RETURN json_build_object('allowed', true, 'type', 'bonus');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Recarrega o cache do PostgREST.
NOTIFY pgrst, 'reload schema';
