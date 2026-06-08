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
export function getFallbackImageUrl(name: string, deckName: string): string {
  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');
  
  if (deckName === 'Tarô') {
    // Rider-Waite Tarot de repositório público
    return `https://raw.githubusercontent.com/fabiolous/tarot-images/master/cards/${slug}.jpg`;
  }
  
  if (deckName === 'Baralho Cigano') {
    // Petit Lenormand clássico (mapeamento simples de número ou nome)
    return `https://raw.githubusercontent.com/Gisat/lenormand-cards/master/images/${slug}.png`;
  }

  if (deckName === 'Tarô dos Anjos') {
    // Imagem genérica de anjo majestoso ou luz divina baseada no nome
    return `https://images.unsplash.com/photo-1598463162624-912b535d4615?auto=format&fit=crop&q=80&w=300&q=80`;
  }

  return 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=300';
}

export async function drawCards(deckName: string, count: number = 3) {
  console.log(`Sorteando ${count} cartas do deck: ${deckName}`);
  
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos' };
  const folder = folderMap[deckName] || 'taro';

  // Mapeamento para Baralho Cigano (arquivos .jpeg customizados)
  const CIGANO_MAP: Record<string, string> = {
    'O Cavaleiro': 'o-cavaleiro.jpeg',
    'O Trevo': 'o-trevo.jpeg',
    'O Navio': 'o-navio.jpeg',
    'A Casa': 'a-casa.jpeg',
    'A Árvore': 'a-arvore.jpeg',
    'As Nuvens': 'as-nuvens.jpeg',
    'A Serpente': 'a-serpente.jpeg',
    'O Caixão': 'o-caixao.jpeg',
    'As Flores': 'o-buque.jpeg', 
    'A Foice': 'a-foice.jpeg',
    'O Chicote': 'o-chicote.jpeg',
    'Os Pássaros': 'os-passaros.jpeg',
    'A Criança': 'a-criança.jpeg',
    'A Raposa': 'a-raposa.jpeg',
    'O Urso': 'o-urso.jpeg',
    'A Estrela': 'a-estrela.jpeg',
    'A Cegonha': 'a-cegonha.jpeg',
    'O Cão': 'o-cao.jpeg',
    'A Torre': 'a-torre.jpeg',
    'O Jardim': 'o-jardim.jpeg',
    'A Montanha': 'a-montanha.jpeg',
    'Caminhos': 'os-caminhos.jpeg',
    'O Rato': 'os-ratos.jpeg',
    'O Coração': 'o-coracao.jpeg',
    'O Anel': 'o-anel.jpeg',
    'Os Livros': 'o-livro.jpeg',
    'A Carta': 'a-carta.jpeg',
    'O Homem': 'o-cigano.jpeg',
    'A Mulher': 'a-cigana.jpeg',
    'Os Lírios': 'os-lirios.jpeg',
    'O Sol': 'o-sol.jpeg',
    'A Lua': 'a-lua.jpeg',
    'A Chave': 'a-chave.jpeg',
    'Os Peixes': 'os-peixes.jpeg',
    'A Âncora': 'a-ancora.jpeg'
  };

  // Mapeamento de Arcanos Maiores para arquivos customizados
  const CUSTOM_MAP: Record<string, string> = {
    'O Louco': 'custom/o-louco.webp.jpeg',
    'O Mago': 'custom/o-mago.webp.jpeg',
    'A Sacerdotisa': 'custom/a-sacerdotisa.webp.jpeg',
    'A Imperatriz': 'custom/a-imperatriz.webp.jpeg',
    'O Imperador': 'custom/o-imperador.webp.jpeg',
    'O Hierofante': 'custom/o-hierofante.webp.jpeg',
    'Os Amantes': 'custom/os-amantes.webp.jpeg',
    'O Carro': 'custom/o-carro.webp.jpeg',
    'A Justiça': 'custom/a-justica.webp.jpeg',
    'O Eremita': 'custom/o-eremita.webp.jpeg',
    'Roda da Fortuna': 'custom/roda-da-fortuna.webp.jpeg',
    'A Força': 'custom/a-forca.webp.jpeg',
    'O Pendurado': 'custom/o-pendurado.webp.jpeg',
    'A Morte': 'custom/a-morte.webp.jpeg',
    'A Temperança': 'custom/a-temperanca.webp.jpeg',
    'O Diabo': 'custom/o-diabo.webp.jpeg',
    'A Torre': 'custom/a-torre.webp.jpeg',
    'A Estrela': 'custom/a-estrela.webp.jpeg',
    'A Lua': 'custom/a-lua.webp.jpeg',
    'O Sol': 'custom/o-sol.webp.jpeg',
    'O Julgamento': 'custom/o-julgamento.webp.jpeg',
    'O Mundo': 'custom/o-mundo.webp.jpeg'
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

  const getLocalImageUrl = (name: string) => {
    let slug = name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s_]+/g, '-') 
      .replace(/[^\w-]/g, '');

    let filename = CIGANO_MAP[name] || CUSTOM_MAP[name] || translateMinorArcana(name) || `${slug}.jpg`;
    return `/assets/decks/${folder}/${filename}`;
  };

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
        image_url: getLocalImageUrl(card.card_name)
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

  const result = shuffled.slice(0, count).map(name => {
    let slug = name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s_]+/g, '-') 
      .replace(/[^\w-]/g, '');

    return {
      name,
      slug,
      image_url: getLocalImageUrl(name)
    };
  });

  console.log("Cartas sorteadas localmente:", result.map(c => c.name));
  return result;
}

export function getAngelAttributes(name: string): string[] {
  const mapping: Record<string, string[]> = {
    'Vehuiah': ['Força de Vontade'],
    'Jeliel': ['Amor', 'Amizade'],
    'Sitael': ['Proteção', 'Trabalho'],
    'Elemiah': ['Proteção', 'Trabalho'],
    'Mahasiah': ['Corpo', 'Intelecto'],
    'Lelahel': ['Artes', 'Intelecto', 'Saúde'],
    'Achaiah': ['Força de Vontade'],
    'Cahetel': ['Proteção'],
    'Haziel': ['Amizade'],
    'Aladiah': ['Trabalho', 'Saúde'],
    'Lauviah': ['Intelecto', 'Trabalho'],
    'Hahaiah': ['Proteção', 'Sonhos'],
    'Iezalel': ['Amor', 'Amizade', 'Intelecto'],
    'Mebahel': ['Corpo', 'Proteção', 'Justiça'],
    'Hariel': ['Intelecto'],
    'Hakamiah': ['Proteção'],
    'Lauviah II': ['Amizade', 'Sonhos', 'Música'],
    'Caliel': ['Justiça'],
    'Leuviah': ['Força de Vontade', 'Intelecto'],
    'Pahaliah': ['Intelecto'],
    'Nelchael': ['Intelecto', 'Proteção'],
    'Ieiaiel': ['Prosperidade'],
    'Melahel': ['Proteção', 'Saúde'],
    'Haheuiah': ['Justiça'],
    'Nith-Haiah': ['Intelecto', 'Sonhos'],
    'Haaiah': ['Justiça'],
    'Ierathel': ['Proteção'],
    'Seheiah': ['Proteção'],
    'Reyel': ['Proteção'],
    'Omael': ['Intelecto', 'Saúde'],
    'Lecabel': ['Intelecto', 'Prosperidade'],
    'Vasariah': ['Justiça'],
    'Iehuiah': ['Amor', 'Força de Vontade', 'Proteção'],
    'Lehahiah': ['Amizade'],
    'Chavakiah': ['Amizade'],
    'Menadel': ['Intelecto', 'Trabalho'],
    'Aniel': ['Intelecto'],
    'Haamiah': ['Intelecto', 'Proteção'],
    'Rehael': ['Saúde'],
    'Ieiazel': ['Criatividade', 'Intelecto'],
    'Hahahel': ['Proteção'],
    'Mikael': ['Trabalho'],
    'Veuliah': ['Prosperidade'],
    'Ielaiah': ['Proteção', 'Justiça'],
    'Sealiah': ['Força de Vontade', 'Proteção'],
    'Ariel': ['Sonhos'],
    'Asaliah': ['Justiça'],
    'Mihael': ['Amor'],
    'Vehuel': ['Criatividade'],
    'Daniel': ['Corpo', 'Justiça'],
    'Hahasiah': ['Intelecto', 'Saúde'],
    'Imamiah': ['Proteção'],
    'Nanael': ['Intelecto'],
    'Nithael': ['Trabalho'],
    'Mebahiah': ['Força de Vontade'],
    'Poiel': ['Intelecto', 'Proteção', 'Prosperidade'],
    'Nemamiah': ['Força de Vontade', 'Prosperidade'],
    'Ieiaiel II': ['Saúde'],
    'Harahel': ['Criatividade', 'Prosperidade', 'Trabalho'],
    'Mizrael': ['Trabalho', 'Saúde'],
    'Umabel': ['Amor', 'Amizade', 'Intelecto'],
    'Iah-Hel': ['Amor', 'Intelecto'],
    'Anauel': ['Proteção', 'Saúde'],
    'Mehiel': ['Criatividade', 'Proteção'],
    'Habuhiah': ['Saúde'],
    'Rochel': ['Prosperidade', 'Trabalho', 'Justiça'],
    'Jabamiah': ['Saúde', 'Cura Vícios'],
    'Haiaiel': ['Força de Vontade'],
    'Mumiah': ['Saúde']
  };
  return mapping[name] || [];
}
