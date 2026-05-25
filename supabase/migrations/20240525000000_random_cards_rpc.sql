-- Migration: RPC for drawing random cards
-- Project: Psiquê Oráculo 🔮

CREATE OR REPLACE FUNCTION public.draw_random_cards(p_deck_name TEXT, p_count INT, p_random_seed TEXT DEFAULT '')
RETURNS SETOF public.cards AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.cards
    WHERE deck_name = p_deck_name
    ORDER BY random()
    LIMIT p_count;
END;
$$ LANGUAGE plpgsql;

-- Grant access to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.draw_random_cards(TEXT, INT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.draw_random_cards(TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.draw_random_cards(TEXT, INT, TEXT) TO service_role;
