-- Migração: Refinamento da Lógica de Créditos e Remoção de Vulnerabilidade
-- Projeto: Psiquê Oráculo 🔮

-- 1. Redefinir a função para não aceitar status premium do cliente
CREATE OR REPLACE FUNCTION public.check_and_consume_reading(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Busca o perfil ou cria se não existir
    SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;
    
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id, credits_free, last_reading_date)
        VALUES (p_user_id, 3, v_today)
        RETURNING * INTO v_profile;
    END IF;

    -- LÓGICA AGORA BASEADA EXCLUSIVAMENTE NO DB (v_profile.is_premium)
    IF v_profile.is_premium THEN
        -- LÓGICA PREMIUM: 5 por dia
        IF v_profile.last_reading_date < v_today THEN
            UPDATE public.profiles 
            SET daily_readings_count = 1, last_reading_date = v_today 
            WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium', 'count', 1);
        ELSIF v_profile.daily_readings_count < 5 THEN
            UPDATE public.profiles 
            SET daily_readings_count = daily_readings_count + 1 
            WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium', 'count', v_profile.daily_readings_count + 1);
        ELSE
            RETURN json_build_object(
                'allowed', false, 
                'reason', 'Sua energia diária atingiu o limite! Descanse sua mente e retorne amanhã.',
                'code', 'DAILY_LIMIT'
            );
        END IF;
    ELSE
        -- LÓGICA FREE: 3 créditos vitalícios
        IF v_profile.credits_free > 0 THEN
            UPDATE public.profiles 
            SET credits_free = credits_free - 1 
            WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'free', 'remaining', v_profile.credits_free - 1);
        ELSE
            RETURN json_build_object(
                'allowed', false, 
                'reason', 'Seus créditos gratuitos acabaram. Assine o plano anual para continuar.',
                'code', 'PAYWALL'
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função legada para compatibilidade (apenas ignora o parâmetro)
CREATE OR REPLACE FUNCTION public.check_and_consume_reading(p_user_id UUID, p_is_premium_rc BOOLEAN)
RETURNS JSON AS $$
BEGIN
    RETURN public.check_and_consume_reading(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
