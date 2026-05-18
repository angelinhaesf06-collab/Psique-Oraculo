-- Migração Inicial: Criação da Tabela de Histórico de Leituras
-- Projeto: Psiquê Oráculo 🔮

CREATE TABLE IF NOT EXISTS public.historico_leituras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_oraculo TEXT NOT NULL, -- Ex: 'taro', 'cigano', 'runas'
    tipo_leitura TEXT NOT NULL, -- Ex: 'direta_tema', 'sim_nao', 'foto'
    pergunta_tema TEXT,         -- O tema ou a pergunta feita pelo usuário
    cartas_sorteadas JSONB,     -- Lista de cartas/elementos identificados
    resposta_ia JSONB,          -- Objeto estruturado com veredito e complemento
    image_url TEXT,             -- URL da foto enviada (se houver)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas de RLS (Row Level Security)
ALTER TABLE public.historico_leituras ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias leituras
CREATE POLICY "Usuários podem ver suas próprias leituras" 
ON public.historico_leituras 
FOR SELECT 
USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias leituras
CREATE POLICY "Usuários podem inserir suas próprias leituras" 
ON public.historico_leituras 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin pode ver tudo (ajustar conforme necessário)
-- CREATE POLICY "Admins podem ver tudo" ON public.historico_leituras FOR ALL USING (auth.jwt()->>'role' = 'admin');
