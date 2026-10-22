-- Volta para 1 leitura grátis (por CONTA e por APARELHO). Antes eram 2.
-- Premium continua 5/dia (sem trava de aparelho). Projeto: Psiquê Oráculo 🔮

CREATE OR REPLACE FUNCTION public.check_and_consume_reading_device(p_user_id UUID, p_device_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
    v_is_new_day BOOLEAN;
    v_limite CONSTANT INTEGER := 1;
    v_device_count INTEGER;
BEGIN
    SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id) VALUES (p_user_id) ON CONFLICT (id) DO NOTHING;
        SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;
    END IF;

    -- Premium: 5 leituras por dia (sem trava de aparelho)
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

    -- Não premium: checa o APARELHO (se veio device id)
    IF p_device_id IS NOT NULL AND length(p_device_id) > 0 THEN
        SELECT free_count FROM public.device_free_usage WHERE device_id = p_device_id INTO v_device_count;
        IF v_device_count IS NULL THEN
            INSERT INTO public.device_free_usage (device_id, free_count) VALUES (p_device_id, 0) ON CONFLICT (device_id) DO NOTHING;
            v_device_count := 0;
        END IF;
        IF v_device_count >= v_limite THEN
            RETURN json_build_object('allowed', false, 'reason', 'paywall', 'message', 'Você já usou sua leitura grátis. Assine para leituras ilimitadas! ✨');
        END IF;
    END IF;

    -- Checa a CONTA
    IF COALESCE(v_profile.free_count, 0) >= v_limite THEN
        RETURN json_build_object('allowed', false, 'reason', 'paywall', 'message', 'Você já usou sua leitura grátis. Assine para leituras ilimitadas! ✨');
    END IF;

    -- Libera: consome na CONTA e no APARELHO
    UPDATE public.profiles SET free_count = COALESCE(free_count, 0) + 1, last_reading_at = NOW() WHERE id = p_user_id;
    IF p_device_id IS NOT NULL AND length(p_device_id) > 0 THEN
        UPDATE public.device_free_usage SET free_count = free_count + 1, updated_at = now() WHERE device_id = p_device_id;
    END IF;

    RETURN json_build_object('allowed', true, 'type', 'free', 'restantes', v_limite - (COALESCE(v_profile.free_count, 0) + 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_and_consume_reading_device(UUID, TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
