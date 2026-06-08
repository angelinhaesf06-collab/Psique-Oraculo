-- Atualizar a função de validação para considerar o trial de 24h
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

    -- 1. Se for Premium, segue a regra de 5 leituras por dia
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

    -- 2. Se estiver no período de Trial (24h), permite leitura
    IF v_profile.trial_expires_at > NOW() THEN
        UPDATE public.profiles SET last_reading_at = NOW() WHERE id = p_user_id;
        RETURN json_build_object('allowed', true, 'type', 'trial', 'expires_at', v_profile.trial_expires_at);
    END IF;

    -- 3. Se o Trial expirou e não é Premium, bloqueia
    RETURN json_build_object(
        'allowed', false, 
        'reason', 'paywall', 
        'message', 'Seu período de teste de 24 horas expirou. Assine o plano anual para continuar sua jornada!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
