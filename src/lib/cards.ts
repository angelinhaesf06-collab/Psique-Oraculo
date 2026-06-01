import { supabase } from './supabase';

export const DECKS = {
  'Tarô': [
    'O Louco', 'O Mago', 'A Sacerdotisa', 'A Imperatriz', 'O Imperador', 'O Hierofante', 'Os Amantes', 'O Carro', 'A Força', 'O Eremita', 'Roda da Fortuna', 'A Justiça', 'O Pendurado', 'A Morte', 'A Temperança', 'O Diabo', 'A Torre', 'A Estrela', 'A Lua', 'O Sol', 'O Julgamento', 'O Mundo',
    'Ás de Copas', 'Dois de Copas', 'Três de Copas', 'Quatro de Copas', 'Cinco de Copas', 'Seis de Copas', 'Sete de Copas', 'Oito de Copas', 'Nove de Copas', 'Dez de Copas', 'Valete de Copas', 'Cavaleiro de Copas', 'Rainha de Copas', 'Rei de Copas',
    'Ás de Espadas', 'Dois de Espadas', 'Três de Espadas', 'Quatro de Espadas', 'Cinco de Espadas', 'Seis de Espadas', 'Sete de Espadas', 'Oito de Espadas', 'Nove de Espadas', 'Dez de Espadas', 'Valete de Espadas', 'Cavaleiro de Espadas', 'Rainha de Espadas', 'Rei de Espadas',
    'Ás de Paus', 'Dois de Paus', 'Três de Paus', 'Quatro de Paus', 'Cinco de Paus', 'Seis de Paus', 'Sete de Paus', 'Oito de Paus', 'Nove de Paus', 'Dez de Paus', 'Valete de Paus', 'Cavaleiro de Paus', 'Rainha de Paus', 'Rei de Paus',
    'Ás de Ouros', 'Dois de Ouros', 'Três de Ouros', 'Quatro de Ouros', 'Cinco de Ouros', 'Seis de Ouros', 'Sete de Ouros', 'Oito de Ouros', 'Nove de Ouros', 'Dez de Ouros', 'Valete de Ouros', 'Cavaleiro de Ouros', 'Rainha de Ouros', 'Rei de Ouros'
  ],
  'Baralho Cigano': [
    'O Cavaleiro', 'O Trevo', 'O Navio', 'A Casa', 'A Árvore', 'As Nuvens', 'A Serpente', 'O Caixão', 'As Flores', 'A Foice', 'O Chicote', 'Os Pássaros', 'A Criança', 'A Raposa', 'O Urso', 'A Estrela', 'A Cegonha', 'O Cão', 'A Torre', 'O Jardim', 'A Montanha', 'Caminhos', 'O Rato', 'O Coração', 'O Anel', 'Os Livros', 'A Carta', 'O Homem', 'A Mulher', 'Os Lírios', 'O Sol', 'A Lua', 'A Chave', 'Os Peixes', 'A Âncora', 'A Cruz'
  ],
  'Tarô dos Anjos': [
    'Vehuiah', 'Jeliel', 'Sitael', 'Elemiah', 'Mahasiah', 'Lelahel', 'Achaiah', 'Cahetel', 'Haziel', 'Aladiah', 'Lauviah', 'Hahaiah', 'Iezalel', 'Mebahel', 'Hariel', 'Hakamiah', 'Lauviah II', 'Caliel', 'Leuviah', 'Pahaliah', 'Nelchael', 'Ieiaiel', 'Melahel', 'Haheuiah', 'Nith-Haiah', 'Haaiah', 'Ierathel', 'Seheiah', 'Reyel', 'Omael', 'Lecabel', 'Vasariah', 'Iehuiah', 'Lehahiah', 'Chavakiah', 'Menadel', 'Aniel', 'Haamiah', 'Rehael', 'Ieiazel', 'Hahahel', 'Mikael', 'Veuliah', 'Ielaiah', 'Sealiah', 'Ariel', 'Asaliah', 'Mihael', 'Vehuel', 'Daniel', 'Hahasiah', 'Imamiah', 'Nanael', 'Nithael', 'Mebahiah', 'Poiel', 'Nemamiah', 'Ieiaiel II', 'Harahel', 'Mizrael', 'Umabel', 'Iah-Hel', 'Anauel', 'Mehiel', 'Damabiah', 'Manakel', 'Eiael', 'Habuhiah', 'Rochel', 'Jabamiah', 'Haiaiel', 'Mumiah'
  ],
  'Runas': [
    'Fehu', 'Uruz', 'Thurisaz', 'Ansuz', 'Raido', 'Kenaz', 'Gebo', 'Wunjo', 'Hagalaz', 'Nauthiz', 'Isa', 'Jera', 'Eihwaz', 'Perthro', 'Algiz', 'Sowilo', 'Tiwaz', 'Berkana', 'Ehwaz', 'Mannaz', 'Laguz', 'Ingwaz', 'Othala', 'Dagaz'
  ]
};

/**
 * Sorteia cartas usando aleatoriedade real do Supabase (RANDOM())
 * Se falhar, usa o fallback local com Fisher-Yates.
 */
export async function drawCards(deckName: string, count: number = 3) {
  console.log(`Sorteando ${count} cartas do deck: ${deckName}`);
  
  try {
    const { data, error } = await supabase.rpc('draw_random_cards', {
      p_deck_name: deckName,
      p_count: count,
      p_random_seed: `${Date.now()}-${Math.random()}-${Math.random().toString(36)}`
    });

    if (!error && data && data.length > 0) {
      // Re-embaralhar localmente com maior entropia
      const shuffledData = [...data].sort(() => 0.5 - Math.random());
      
      return shuffledData.map((card: any) => ({
        name: card.card_name,
        slug: card.card_slug,
        image_url: card.image_url.startsWith('http') 
          ? card.image_url 
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}${card.image_url}`
      }));
    }
    if (error) console.error("Erro RPC Supabase:", error);
  } catch (err) {
    console.warn("Falha ao sortear do Supabase, usando fallback local:", err);
  }

  // Fallback Local Ultra-Robusto
  console.log("Usando fallback local para sorteio...");
  const deck = DECKS[deckName as keyof typeof DECKS] || DECKS['Tarô'];
  
  // Criar cópia e embaralhar múltiplas vezes para garantir aleatoriedade
  let shuffled = [...deck];
  for (let cycle = 0; cycle < 3; cycle++) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos' };
  const folder = folderMap[deckName] || 'taro';

  // Mapeamento de Arcanos Maiores para arquivos customizados
  const CUSTOM_MAP: Record<string, string> = {
    'O Louco': 'custom/00_louco.png.jpeg',
    'O Mago': 'custom/01_mago.png.jpeg',
    'A Sacerdotisa': 'custom/02_sacerdotisa.png.jpeg',
    'A Imperatriz': 'custom/03_imperatriz.png.jpeg',
    'O Imperador': 'custom/04_imperador.png.jpeg',
    'O Hierofante': 'custom/5_opapa.png.jpeg',
    'Os Amantes': 'custom/06_enamorados.png.jpeg',
    'O Carro': 'custom/07_carro.png.jpeg',
    'A Justiça': 'custom/08_justiça.png.jpeg',
    'O Eremita': 'custom/09_eremita.jpeg',
    'A Força': 'custom/11_força.png.jpeg',
    'O Pendurado': 'custom/12_enforcado.png.jpeg',
    'A Morte': 'custom/13_morte.png.jpeg',
    'A Temperança': 'custom/14_temperança.png.jpeg',
    'O Diabo': 'custom/15_diabo.png.jpeg',
    'A Torre': 'custom/16_torre.png.jpeg',
    'A Estrela': 'custom/18_estrela.png.jpeg',
    'A Lua': 'custom/12_lua.png.jpeg',
    'O Sol': 'custom/19_sol.png.jpeg',
    'O Julgamento': 'custom/20_julgamento.png.jpeg',
    'O Mundo': 'custom/21_mundo.png.jpeg'
  };

  const translateMinorArcana = (name: string) => {
    const parts = name.split(' de ');
    if (parts.length !== 2) return null;

    const rankMap: Record<string, string> = {
      'Ás': 'ace', 'Dois': 'two', 'Três': 'three', 'Quatro': 'four', 'Cinco': 'five',
      'Seis': 'six', 'Sete': 'seven', 'Oito': 'eight', 'Nove': 'nine', 'Dez': 'ten',
      'Valete': 'page', 'Cavaleiro': 'knight', 'Rainha': 'queen', 'Rei': 'king'
    };

    const suitMap: Record<string, string> = {
      'Copas': 'cups', 'Espadas': 'swords', 'Paus': 'wands', 'Ouros': 'pentacles'
    };

    const rank = rankMap[parts[0]];
    const suit = suitMap[parts[1]];

    if (rank && suit) return `${rank}-of-${suit}.jpg`;
    return null;
  };

  const result = shuffled.slice(0, count).map(name => {
    let slug = name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s_]+/g, '-') // Troca espaços e sublinhados por hífens
      .replace(/[^\w-]/g, '');

    let filename = CUSTOM_MAP[name] || translateMinorArcana(name) || `${slug}.jpg`;
    
    return {
      name,
      slug,
      image_url: `/assets/decks/${folder}/${filename}`
    };
  });

  console.log("Cartas sorteadas localmente:", result.map(c => c.name));
  return result;
}
