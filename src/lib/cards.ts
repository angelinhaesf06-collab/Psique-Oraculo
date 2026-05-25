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
  ]
};

export function drawCards(deckName: string, count: number = 3) {
  const deck = DECKS[deckName as keyof typeof DECKS] || DECKS['Tarô'];
  const shuffled = [...deck];
  
  // Algoritmo de Fisher-Yates para embaralhamento real
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const folderMap: Record<string, string> = { 'Tarô': 'taro', 'Baralho Cigano': 'cigano', 'Tarô dos Anjos': 'anjos' };
  const folder = folderMap[deckName] || 'taro';

  return shuffled.slice(0, count).map(name => {
    const slug = name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_')
      .replace(/[^\w-]/g, '');
    
    return {
      name,
      slug,
      // URL dinâmica do Supabase Storage
      image_url: `${supabaseUrl}/storage/v1/object/public/cartas-oraculo/${folder}/${slug}.webp`
    };
  });
}
