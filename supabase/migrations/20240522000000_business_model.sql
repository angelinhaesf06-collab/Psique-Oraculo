-- Migração: Gerenciamento de Créditos, Assinaturas e Limites Diários
-- Projeto: Psiquê Oráculo 🔮

-- 1. Criar tabela de perfis para gerenciar créditos e assinatura
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_premium BOOLEAN DEFAULT FALSE,
    credits INTEGER DEFAULT 3, -- 3 créditos gratuitos iniciais
    last_reading_at TIMESTAMPTZ,
    readings_today INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Trigger para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits)
  VALUES (NEW.id, 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Função para validar e descontar créditos/limites
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

    -- Verificar se é um novo dia para resetar o contador premium
    v_is_new_day := v_profile.last_reading_at IS NULL OR (v_profile.last_reading_at::date < NOW()::date);

    IF v_profile.is_premium THEN
        -- Lógica Premium: Limite de 5 por dia
        IF v_is_new_day THEN
            UPDATE public.profiles 
            SET readings_today = 1, last_reading_at = NOW() 
            WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium');
        ELSIF v_profile.readings_today < 5 THEN
            UPDATE public.profiles 
            SET readings_today = readings_today + 1, last_reading_at = NOW() 
            WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'premium');
        ELSE
            RETURN json_build_object('allowed', false, 'reason', 'Limite diário de 5 leituras atingido.');
        END IF;
    ELSE
        -- Lógica Gratuita: Consome créditos
        IF v_profile.credits > 0 THEN
            UPDATE public.profiles 
            SET credits = credits - 1, last_reading_at = NOW() 
            WHERE id = p_user_id;
            RETURN json_build_object('allowed', true, 'type', 'free', 'remaining', v_profile.credits - 1);
        ELSE
            RETURN json_build_object('allowed', false, 'reason', 'Créditos esgotados. Assine o plano anual!');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
