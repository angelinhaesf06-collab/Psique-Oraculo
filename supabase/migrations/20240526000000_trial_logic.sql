-- Adicionar trial_expires_at e created_at na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- Atualizar a função de criação de perfil para incluir o trial de 24h
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits, trial_expires_at)
  VALUES (NEW.id, 3, NOW() + interval '24 hours');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar usuários existentes que não têm trial_expires_at
UPDATE public.profiles SET trial_expires_at = created_at + interval '24 hours' WHERE trial_expires_at IS NULL;
