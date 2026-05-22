-- Migração: Reforço de Segurança e Políticas de RLS
-- Projeto: Psiquê Oráculo 🔮

-- 1. Garantir RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_leituras ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para a tabela 'profiles'
-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

-- Permitir leitura apenas do próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- BLOQUEIO DE INJEÇÃO: Não permitimos UPDATE direto pelo usuário.
-- As atualizações de créditos e limites DEVEM passar pela função RPC 'check_and_consume_reading'
-- que possui privilégios de 'SECURITY DEFINER'.
-- Se futuramente houver colunas como 'nome_exibicao', criaremos uma política específica para elas.

-- 3. Políticas para a tabela 'historico_leituras'
DROP POLICY IF EXISTS "Usuários podem ver suas próprias leituras" ON public.historico_leituras;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias leituras" ON public.historico_leituras;

CREATE POLICY "Usuários podem ver suas próprias leituras" 
ON public.historico_leituras FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias leituras" 
ON public.historico_leituras FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Função de Segurança para API (Opcional, mas recomendado)
-- Garante que o usuário logado é o mesmo que está tentando realizar a leitura
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE;
