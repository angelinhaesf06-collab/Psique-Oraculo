-- 1 leitura grátis VITALÍCIA por conta (substitui o trial de 24h).
-- Projeto: Psiquê Oráculo 🔮
--
-- Regras finais de check_and_consume_reading:
--   - Premium: até 5 leituras por dia
--   - Não premium: 1 leitura grátis por conta (para sempre); depois, paywall
--
-- Os créditos avulsos (compra R$ 2,06 e o bônus de avaliar o app) são tratados
-- fora desta função: o app envia usarCredito=true e a rota /api/oracle/read pula
-- este controle nesses casos.

-- 1) Marca se a conta já usou sua leitura grátis
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_used BOOLEAN DEFAULT false;

-- 2) Nova regra de consumo
CREATE OR REPLACE FUNCTION public.check_and_consume_reading(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
    v_is_new_day BOOLEAN;
BEGIN
    SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;

    IF NOT FOUND THEN
        RETURN json_build_object('allowed', false, 'reason', 'Perfil não encontrado');
    END IF;

    -- Premium: 5 leituras por dia
    IF v_profile.is_premium THEN
        v_is_new_day := v_profile.last_reading_at IS NULL OR (v_profile.last_reading_at::date < NOW()::date);
        IF v_is_new_day THEN
            UPDATE public.profiles SET readings_today = 1, last_reading_at = NOW() WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium');
        ELSIF v_profile.readings_today < 5 THEN
            UPDATE public.profiles SET readings_today = readings_today + 1, last_reading_at = NOW() WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium');
        ELSE
            RETURN json_build_object('allowed', false, 'reason', 'premium_limit', 'message', 'Limite diário de 5 leituras atingido.');
        END IF;
    END IF;

    -- Não premium: 1 leitura grátis vitalícia por conta
    IF COALESCE(v_profile.free_used, false) = false THEN
        UPDATE public.profiles SET free_used = true, last_reading_at = NOW() WHERE id = p_user_id;
        RETURN json_build_object('allowed', true, 'type', 'free_once');
    END IF;

    -- Já usou a grátis e não é premium → paywall
    RETURN json_build_object(
        'allowed', false,
        'reason', 'paywall',
        'message', 'Você já usou sua leitura grátis. Assine para continuar sua jornada! ✨'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
