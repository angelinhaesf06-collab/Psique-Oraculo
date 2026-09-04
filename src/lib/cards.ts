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
    // Petit Lenormand clássico
    return `https://raw.githubusercontent.com/Gisat/lenormand-cards/master/images/${slug}.png`;
  }

  if (deckName === 'Tarô dos Anjos') {
    // Sempre uma imagem de anjo local: nunca fica em branco e funciona offline.
    return `/assets/decks/anjos/default-angel.jpg`;
  }

  return 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=300';
}

export async function drawCards(deckName: string, count: number = 3) {
  console.log(`Sorteando ${count} cartas do deck: ${deckName}`);
  
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos' };
  const folder = folderMap[deckName] || 'tarot';

  // Mapeamento para Baralho Cigano (arquivos .jpg/.jpeg customizados)
  const CIGANO_MAP: Record<string, string> = {
    'O Cavaleiro': 'o-cavaleiro.jpg',
    'O Trevo': 'o-trevo.jpg',
    'O Navio': 'o-navio.jpg',
    'A Casa': 'a-casa.jpg',
    'A Árvore': 'a-arvore.jpg',
    'As Nuvens': 'as-nuvens.jpg',
    'A Serpente': 'a-serpente.jpg',
    'O Caixão': 'o-caixao.jpg',
    'As Flores': 'o-buque.jpeg', 
    'A Foice': 'a-foice.jpg',
    'O Chicote': 'o-chicote.jpg',
    'Os Pássaros': 'os-passaros.jpg',
    'A Criança': 'a-crianca.jpg',
    'A Raposa': 'a-raposa.jpg',
    'O Urso': 'o-urso.jpg',
    'A Estrela': 'a-estrela.jpg',
    'A Cegonha': 'a-cegonha.jpg',
    'O Cão': 'o-cao.jpg',
    'A Torre': 'a-torre.jpg',
    'O Jardim': 'o-jardim.jpg',
    'A Montanha': 'a-montanha.jpg',
    'Caminhos': 'os-caminhos.jpg',
    'O Rato': 'os-ratos.jpeg',
    'O Coração': 'o-coracao.jpg',
    'O Anel': 'o-anel.jpg',
    'Os Livros': 'o-livro.jpeg',
    'A Carta': 'a-carta.jpg',
    'O Homem': 'o-cigano.jpeg',
    'A Mulher': 'a-cigana.jpeg',
    'Os Lírios': 'os-lirios.jpg',
    'O Sol': 'o-sol.jpg',
    'A Lua': 'a-lua.jpg',
    'A Chave': 'a-chave.jpg',
    'Os Peixes': 'os-peixes.jpg',
    'A Âncora': 'a-ancora.jpg',
    'A Cruz': 'a-cruz.jpg'
  };

  // Mapeamento de Arcanos Maiores para arquivos customizados
  const CUSTOM_MAP: Record<string, string> = {
    'O Louco': 'major/o-louco.webp.jpeg',
    'O Mago': 'major/o-mago.webp.jpeg',
    'A Sacerdotisa': 'major/a-sacerdotisa.webp.jpeg',
    'A Imperatriz': 'major/a-imperatriz.webp.jpeg',
    'O Imperador': 'major/o-imperador.webp.jpeg',
    'O Hierofante': 'major/o-hierofante.webp.jpeg',
    'Os Amantes': 'major/os-amantes.webp.jpeg',
    'O Carro': 'major/o-carro.webp.jpeg',
    'A Justiça': 'major/a-justica.webp.jpeg',
    'O Eremita': 'major/o-eremita.webp.jpeg',
    'Roda da Fortuna': 'major/roda-da-fortuna.webp.jpeg',
    'A Força': 'major/a-forca.webp.jpeg',
    'O Pendurado': 'major/o-pendurado.webp.jpeg',
    'A Morte': 'major/a-morte.webp.jpeg',
    'A Temperança': 'major/a-temperanca.webp.jpeg',
    'O Diabo': 'major/o-diabo.webp.jpeg',
    'A Torre': 'major/a-torre.webp.jpeg',
    'A Estrela': 'major/a-estrela.webp.jpeg',
    'A Lua': 'major/a-lua.webp.jpeg',
    'O Sol': 'major/o-sol.webp.jpeg',
    'O Julgamento': 'major/o-julgamento.webp.jpeg',
    'O Mundo': 'major/o-mundo.webp.jpeg'
  };

  const translateMinorArcana = (name: string) => {
    const parts = name.split(' de ');
    if (parts.length !== 2) return null;

    const rankMap: Record<string, string> = {
      'Ás': 'as', 'Dois': 'dois', 'Três': 'tres', 'Quatro': 'quatro', 'Cinco': 'cinco',
      'Seis': 'seis', 'Sete': 'sete', 'Oito': 'oito', 'Nove': 'nove', 'Dez': 'dez',
      'Valete': 'pagem', 'Cavaleiro': 'cavalheiro', 'Rainha': 'rainha', 'Rei': 'rei'
    };

    const suitMap: Record<string, string> = {
      'Copas': 'copas', 'Espadas': 'espadas', 'Paus': 'paus', 'Ouros': 'ouros'
    };

    const rank = rankMap[parts[0]];
    let suit = suitMap[parts[1]];

    // Correção para variações de nomes de arquivos (plural/singular)
    if (suit === 'paus' && name.includes(' de Pau') && !name.includes(' de Paus')) {
      suit = 'pau';
    }

    if (rank && suit) return `minor/${rank}-de-${suit}.jpg`;
    return null;
  };

  const getLocalImageUrl = (name: string) => {
    // Se for Tarô e não for Arcano Maior, tenta primeiro o nome em português via translateMinorArcana
    if (deckName === 'Tarô' && !CUSTOM_MAP[name]) {
      const minorPath = translateMinorArcana(name);
      if (minorPath) return `/assets/decks/${folder}/${minorPath}`;
    }

    if (deckName === 'Tarô dos Anjos') {
      // Anjos com imagem própria. Todos os demais usam a imagem padrão de anjo
      // (default-angel.jpg) — assim NUNCA fica em branco.
      const ANGEL_FILES: Record<string, string> = {
        'Vehuiah': 'vehuiah.jpg', 'Jeliel': 'jeliel.jpg', 'Sitael': 'sitael.jpg',
        'Elemiah': 'elemiah.jpg', 'Mahasiah': 'mahasiah.jpg', 'Lelahel': 'lelahel.jpg',
        'Achaiah': 'achaiah.jpg', 'Cahetel': 'cahetel.jpg', 'Haziel': 'haziel.jpg',
        'Aladiah': 'aladiah.jpg', 'Lauviah': 'lauviah.jpg', 'Hahaiah': 'hahaiah.jpg',
        'Iezalel': 'iezalel.jpg', 'Mebahel': 'mebahel.jpg', 'Hariel': 'hariel.jpg'
      };
      const file = ANGEL_FILES[name] || 'default-angel.jpg';
      return `/assets/decks/anjos/${file}`;
    }

    // Usa o mapa do baralho correto: nomes como "A Torre", "A Estrela", "A Lua"
    // e "O Sol" existem no Tar\u00f4 E no Baralho Cigano. Consultar o CIGANO_MAP antes
    // do CUSTOM_MAP fazia essas 4 cartas do Tar\u00f4 apontarem para o arquivo do cigano
    // (inexistente na pasta taro/), deixando a carta em branco.
    const deckMap = deckName === 'Baralho Cigano' ? CIGANO_MAP : CUSTOM_MAP;
    let filename = deckMap[name] || `${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '')}.jpg`;
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
