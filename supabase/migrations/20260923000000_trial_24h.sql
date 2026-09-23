-- Teste de 24 HORAS por conta (substitui "1 leitura grátis por conta").
-- Projeto: Psiquê Oráculo 🔮
--
-- Regra de check_and_consume_reading:
--   - Premium: até 5 leituras por dia
--   - Não premium: tiragens ILIMITADAS por 24h a partir da 1ª leitura; depois, paywall
--   - Créditos avulsos (compra / bônus de avaliar) são tratados fora (usarCredito=true)

-- 1) Garante a coluna do prazo do teste (já deve existir)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- 2) (Re)cria a função única (1 parâmetro) com a regra de 24h
CREATE OR REPLACE FUNCTION public.check_and_consume_reading(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
    v_is_new_day BOOLEAN;
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

    -- Não premium: TESTE DE 24H
    -- 1ª leitura (sem prazo definido): inicia o teste de 24h a partir de agora.
    IF v_profile.trial_expires_at IS NULL THEN
        UPDATE public.profiles
           SET trial_expires_at = NOW() + INTERVAL '24 hours', last_reading_at = NOW()
         WHERE id = p_user_id;
        RETURN json_build_object('allowed', true, 'type', 'trial_started', 'expires_at', NOW() + INTERVAL '24 hours');
    -- Dentro das 24h: ilimitado.
    ELSIF NOW() < v_profile.trial_expires_at THEN
        UPDATE public.profiles SET last_reading_at = NOW() WHERE id = p_user_id;
        RETURN json_build_object('allowed', true, 'type', 'trial', 'expires_at', v_profile.trial_expires_at);
    -- Teste expirou → paywall.
    ELSE
        RETURN json_build_object(
            'allowed', false,
            'reason', 'paywall',
            'message', 'Seu teste de 24h terminou. Assine para continuar sua jornada! ✨'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) CAMPANHA (rodar UMA vez): libera um novo teste de 24h para TODOS os não
--    premium — inclusive quem já usava o app — para o relançamento "24h grátis".
--    O prazo começa a contar na PRÓXIMA leitura de cada pessoa.
UPDATE public.profiles
   SET trial_expires_at = NULL
 WHERE COALESCE(is_premium, false) = false;

-- 4) Recarrega o cache de schema do PostgREST.
NOTIFY pgrst, 'reload schema';
