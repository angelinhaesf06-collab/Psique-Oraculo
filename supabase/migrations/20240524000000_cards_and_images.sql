-- Migração: Tabela de Cartas e Mapeamento de Imagens
-- Projeto: Psiquê Oráculo 🔮

-- 1. Criar tabela de cartas
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deck_name TEXT NOT NULL, -- 'Tarô', 'Baralho Cigano', 'Tarô dos Anjos'
    card_name TEXT NOT NULL,
    card_slug TEXT NOT NULL,
    image_url TEXT, -- Link público do Supabase Storage
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- 3. Política de Leitura Pública
CREATE POLICY "Cartas são visíveis por todos" 
ON public.cards FOR SELECT 
USING (true);

-- 4. Índice para busca rápida por deck e slug
CREATE INDEX IF NOT EXISTS idx_cards_deck_slug ON public.cards(deck_name, card_slug);

-- Comentário: 
-- Você deve criar um bucket público chamado 'cartas-oraculo' no seu Supabase Storage.
-- A estrutura recomendada de pastas dentro do bucket é: /taro, /cigano, /anjos.
