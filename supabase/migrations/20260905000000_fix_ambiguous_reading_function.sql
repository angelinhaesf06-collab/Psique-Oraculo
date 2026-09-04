-- FIX: "energias recalibrando" toda vez / trava de leitura não funciona.
-- Projeto: Psiquê Oráculo 🔮
--
-- Causa: existiam DUAS versões sobrecarregadas de check_and_consume_reading no
-- banco — a antiga com 2 parâmetros (p_user_id, p_is_premium_rc) e a nova com 1
-- parâmetro (p_user_id). O código chama a rota com apenas { p_user_id }, e o
-- PostgREST não consegue escolher entre as duas (erro PGRST203, ambiguidade),
-- fazendo o RPC falhar. Com a rota agora "fail-closed", esse erro vira 503.
--
-- Solução: remover a versão antiga de 2 parâmetros e recriar a versão de 1
-- parâmetro de forma limpa, garantindo a coluna free_used e recarregando o
-- cache de schema do PostgREST.

-- 1) Remove a sobrecarga antiga (2 parâmetros) que causa a ambiguidade.
DROP FUNCTION IF EXISTS public.check_and_consume_reading(uuid, boolean);

-- 2) Garante a coluna usada pela regra "1 grátis por conta".
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_used BOOLEAN DEFAULT false;

-- 3) (Re)cria a versão única e correta (1 parâmetro).
--    Premium: até 5 leituras/dia. Não premium: 1 grátis vitalícia; depois, paywall.
CREATE OR REPLACE FUNCTION public.check_and_consume_reading(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
    v_is_new_day BOOLEAN;
BEGIN
    SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;

    IF NOT FOUND THEN
        -- Cria o perfil na hora caso o trigger de signup não tenha criado.
        INSERT INTO public.profiles (id) VALUES (p_user_id)
        ON CONFLICT (id) DO NOTHING;
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

-- 4) Recarrega o cache de schema do PostgREST (para a API enxergar a função já).
NOTIFY pgrst, 'reload schema';
