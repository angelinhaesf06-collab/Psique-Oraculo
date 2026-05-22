-- Migração: Arquitetura de Negócios e Travas de Consumo
-- Projeto: Psiquê Oráculo 🔮

-- 1. Tabela de Perfis para controle de créditos e limites
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_premium BOOLEAN DEFAULT FALSE,
    credits_free INTEGER DEFAULT 3, -- 3 créditos iniciais
    daily_readings_count INTEGER DEFAULT 0,
    last_reading_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 2. Trigger para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits_free, last_reading_date)
  VALUES (NEW.id, 3, CURRENT_DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Função de Trava de Segurança (Executada antes da IA)
CREATE OR REPLACE FUNCTION public.check_and_consume_reading(p_user_id UUID, p_is_premium_rc BOOLEAN)
RETURNS JSON AS $$
DECLARE
    v_profile RECORD;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Busca o perfil ou cria se não existir (fallback)
    SELECT * FROM public.profiles WHERE id = p_user_id INTO v_profile;
    
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id, credits_free, last_reading_date)
        VALUES (p_user_id, 3, v_today)
        RETURNING * INTO v_profile;
    END IF;

    -- Sincroniza o status premium do RevenueCat com o banco local
    IF p_is_premium_rc != v_profile.is_premium THEN
        UPDATE public.profiles SET is_premium = p_is_premium_rc WHERE id = p_user_id;
        v_profile.is_premium := p_is_premium_rc;
    END IF;

    IF v_profile.is_premium THEN
        -- LÓGICA PREMIUM: 5 por dia
        IF v_profile.last_reading_date < v_today THEN
            -- Primeiro acesso do dia: reseta contador
            UPDATE public.profiles 
            SET daily_readings_count = 1, last_reading_date = v_today 
            WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium', 'count', 1);
        ELSIF v_profile.daily_readings_count < 5 THEN
            -- Incrementa contador diário
            UPDATE public.profiles 
            SET daily_readings_count = daily_readings_count + 1 
            WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium', 'count', v_profile.daily_readings_count + 1);
        ELSE
            -- Limite atingido
            RETURN json_build_object(
                'allowed', false, 
                'reason', 'Sua energia diária atingiu o limite! Descanse sua mente e retorne amanhã para novas respostas.',
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
            -- Créditos esgotados: Abrir Paywall
            RETURN json_build_object(
                'allowed', false, 
                'reason', 'Seus créditos gratuitos acabaram. Assine o plano anual para continuar sua jornada.',
                'code', 'PAYWALL'
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
