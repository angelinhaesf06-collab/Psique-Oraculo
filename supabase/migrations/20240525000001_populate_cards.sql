-- Migration: Populate cards table
-- Project: Psiquê Oráculo 🔮

DO $$
DECLARE
    taro_cards TEXT[] := ARRAY['O Louco', 'O Mago', 'A Sacerdotisa', 'A Imperatriz', 'O Imperador', 'O Hierofante', 'Os Amantes', 'O Carro', 'A Força', 'O Eremita', 'Roda da Fortuna', 'A Justiça', 'O Pendurado', 'A Morte', 'A Temperança', 'O Diabo', 'A Torre', 'A Estrela', 'A Lua', 'O Sol', 'O Julgamento', 'O Mundo', 'Ás de Copas', 'Dois de Copas', 'Três de Copas', 'Quatro de Copas', 'Cinco de Copas', 'Seis de Copas', 'Sete de Copas', 'Oito de Copas', 'Nove de Copas', 'Dez de Copas', 'Valete de Copas', 'Cavaleiro de Copas', 'Rainha de Copas', 'Rei de Copas', 'Ás de Espadas', 'Dois de Espadas', 'Três de Espadas', 'Quatro de Espadas', 'Cinco de Espadas', 'Seis de Espadas', 'Sete de Espadas', 'Oito de Espadas', 'Nove de Espadas', 'Dez de Espadas', 'Valete de Espadas', 'Cavaleiro de Espadas', 'Rainha de Espadas', 'Rei de Espadas', 'Ás de Paus', 'Dois de Paus', 'Três de Paus', 'Quatro de Paus', 'Cinco de Paus', 'Seis de Paus', 'Sete de Paus', 'Oito de Paus', 'Nove de Paus', 'Dez de Paus', 'Valete de Paus', 'Cavaleiro de Paus', 'Rainha de Paus', 'Rei de Paus', 'Ás de Ouros', 'Dois de Ouros', 'Três de Ouros', 'Quatro de Ouros', 'Cinco de Ouros', 'Seis de Ouros', 'Sete de Ouros', 'Oito de Ouros', 'Nove de Ouros', 'Dez de Ouros', 'Valete de Ouros', 'Cavaleiro de Ouros', 'Rainha de Ouros', 'Rei de Ouros'];
    cigano_cards TEXT[] := ARRAY['O Cavaleiro', 'O Trevo', 'O Navio', 'A Casa', 'A Árvore', 'As Nuvens', 'A Serpente', 'O Caixão', 'As Flores', 'A Foice', 'O Chicote', 'Os Pássaros', 'A Criança', 'A Raposa', 'O Urso', 'A Estrela', 'A Cegonha', 'O Cão', 'A Torre', 'O Jardim', 'A Montanha', 'Caminhos', 'O Rato', 'O Coração', 'O Anel', 'Os Livros', 'A Carta', 'O Homem', 'A Mulher', 'Os Lírios', 'O Sol', 'A Lua', 'A Chave', 'Os Peixes', 'A Âncora', 'A Cruz'];
    anjos_cards TEXT[] := ARRAY['Vehuiah', 'Jeliel', 'Sitael', 'Elemiah', 'Mahasiah', 'Lelahel', 'Achaiah', 'Cahetel', 'Haziel', 'Aladiah', 'Lauviah', 'Hahaiah', 'Iezalel', 'Mebahel', 'Hariel', 'Hakamiah', 'Lauviah II', 'Caliel', 'Leuviah', 'Pahaliah', 'Nelchael', 'Ieiaiel', 'Melahel', 'Haheuiah', 'Nith-Haiah', 'Haaiah', 'Ierathel', 'Seheiah', 'Reyel', 'Omael', 'Lecabel', 'Vasariah', 'Iehuiah', 'Lehahiah', 'Chavakiah', 'Menadel', 'Aniel', 'Haamiah', 'Rehael', 'Ieiazel', 'Hahahel', 'Mikael', 'Veuliah', 'Ielaiah', 'Sealiah', 'Ariel', 'Asaliah', 'Mihael', 'Vehuel', 'Daniel', 'Hahasiah', 'Imamiah', 'Nanael', 'Nithael', 'Mebahiah', 'Poiel', 'Nemamiah', 'Ieiaiel II', 'Harahel', 'Mizrael', 'Umabel', 'Iah-Hel', 'Anauel', 'Mehiel', 'Damabiah', 'Manakel', 'Eiael', 'Habuhiah', 'Rochel', 'Jabamiah', 'Haiaiel', 'Mumiah'];
    card_name TEXT;
    slug TEXT;
    supabase_url TEXT := 'https://your-project.supabase.co'; -- Will be updated via env or just used as placeholder
BEGIN
    -- Tarô
    FOREACH card_name IN ARRAY taro_cards LOOP
        slug := lower(unaccent(card_name));
        slug := regexp_replace(slug, '\s+', '_', 'g');
        slug := regexp_replace(slug, '[^\w-]', '', 'g');
        
        INSERT INTO public.cards (deck_name, card_name, card_slug, image_url)
        VALUES ('Tarô', card_name, slug, '/storage/v1/object/public/cartas-oraculo/taro/' || slug || '.webp')
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Cigano
    FOREACH card_name IN ARRAY cigano_cards LOOP
        slug := lower(unaccent(card_name));
        slug := regexp_replace(slug, '\s+', '_', 'g');
        slug := regexp_replace(slug, '[^\w-]', '', 'g');
        
        INSERT INTO public.cards (deck_name, card_name, card_slug, image_url)
        VALUES ('Baralho Cigano', card_name, slug, '/storage/v1/object/public/cartas-oraculo/cigano/' || slug || '.webp')
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Anjos
    FOREACH card_name IN ARRAY anjos_cards LOOP
        slug := lower(unaccent(card_name));
        slug := regexp_replace(slug, '\s+', '_', 'g');
        slug := regexp_replace(slug, '[^\w-]', '', 'g');
        
        INSERT INTO public.cards (deck_name, card_name, card_slug, image_url)
        VALUES ('Tarô dos Anjos', card_name, slug, '/storage/v1/object/public/cartas-oraculo/anjos/' || slug || '.webp')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
