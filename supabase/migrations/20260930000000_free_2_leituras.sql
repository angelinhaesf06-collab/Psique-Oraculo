-- Modelo grátis: 2 leituras grátis NO TOTAL por conta (substitui o teste de 24h).
-- Não premium: 2 leituras grátis; depois, paywall.
-- Premium: até 5 leituras por dia (inalterado).
-- Sincronização do Dia (mensagem_dia) continua livre (tratada fora, sem gate).
-- Projeto: Psiquê Oráculo 🔮

-- 1) Contador de leituras grátis já usadas (por conta).
--    Default 0 => todos começam com 2 grátis (também re-engaja quem já existia).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_count INTEGER DEFAULT 0;

-- 2) Remove versões antigas para evitar ambiguidade (PGRST203).
DROP FUNCTION IF EXISTS public.check_and_consume_reading(uuid, text);
DROP FUNCTION IF EXISTS public.check_and_consume_reading(uuid, boolean);
DROP FUNCTION IF EXISTS public.check_and_consume_reading(uuid);

-- 3) Nova função: 2 grátis no total, depois paywall.
CREATE OR REPLACE FUNCTION public.check_and_consume_reading(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
    v_is_new_day BOOLEAN;
    v_limite CONSTANT INTEGER := 2;   -- quantas leituras grátis no total
BEGIN
    SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id) VALUES (p_user_id) ON CONFLICT (id) DO NOTHING;
        SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;
    END IF;

    -- Premium: 5 leituras por dia
    IF v_profile.is_premium THEN
        v_is_new_day := v_profile.last_reading_at IS NULL OR (v_profile.last_reading_at::date < NOW()::date);
        IF v_is_new_day THEN
            UPDATE public.profiles SET readings_today = 1, last_reading_at = NOW() WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium');
        ELSIF COALESCE(v_profile.readings_today, 0) < 5 THEN
            UPDATE public.profiles SET readings_today = COALESCE(readings_today, 0) + 1, last_reading_at = NOW() WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium');
        ELSE
            RETURN json_build_object('allowed', false, 'reason', 'premium_limit', 'message', 'Limite diário de 5 leituras atingido.');
        END IF;
    END IF;

    -- Não premium: 2 grátis no total
    IF COALESCE(v_profile.free_count, 0) < v_limite THEN
        UPDATE public.profiles
           SET free_count = COALESCE(free_count, 0) + 1, last_reading_at = NOW()
         WHERE id = p_user_id;
        RETURN json_build_object('allowed', true, 'type', 'free', 'restantes', v_limite - (COALESCE(v_profile.free_count, 0) + 1));
    END IF;

    RETURN json_build_object(
        'allowed', false,
        'reason', 'paywall',
        'message', 'Você já usou suas 2 leituras grátis. Assine para leituras ilimitadas! ✨'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Recarrega o cache do PostgREST.
NOTIFY pgrst, 'reload schema';
