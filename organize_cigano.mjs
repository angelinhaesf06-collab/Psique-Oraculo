import fs from 'fs';
import path from 'path';

const baseDir = 'public/assets/decks';

function slugify(name) {
  return name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]/g, '');
}

async function organizeCigano() {
  const ciganoDir = path.join(baseDir, 'cigano');
  if (!fs.existsSync(ciganoDir)) return;

  const CIGANO_MAP = {
    'O Cavaleiro': 'o-cavaleiro.jpg',
    'O Trevo': 'o-trevo.jpg',
    'O Navio': 'o-navio.jpg',
    'A Casa': 'a-casa.jpg',
    'A Árvore': 'a-arvore.jpg',
    'As Nuvens': 'as-nuvens.jpg',
    'A Serpente': 'a-serpente.jpg',
    'O Caixão': 'o-caixao.jpg',
    'As Flores': 'o-buque.jpg', 
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
    'O Rato': 'os-ratos.jpg',
    'O Coração': 'o-coracao.jpg',
    'O Anel': 'o-anel.jpg',
    'Os Livros': 'o-livro.jpg',
    'A Carta': 'a-carta.jpg',
    'O Homem': 'o-cigano.jpg',
    'A Mulher': 'a-cigana.jpg',
    'Os Lírios': 'os-lirios.jpg',
    'O Sol': 'o-sol.jpg',
    'A Lua': 'a-lua.jpg',
    'A Chave': 'a-chave.jpg',
    'Os Peixes': 'os-peixes.jpg',
    'A Âncora': 'a-ancora.jpg',
    'A Cruz': 'a-cruz.jpg'
  };

  const files = fs.readdirSync(ciganoDir);

  for (const file of files) {
    if (fs.lstatSync(path.join(ciganoDir, file)).isDirectory()) continue;

    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    const slug = slugify(nameWithoutExt);
    
    // Find matching entry in CIGANO_MAP
    let targetName = null;
    for (const [key, val] of Object.entries(CIGANO_MAP)) {
        if (slugify(key) === slug || slug.includes(slugify(key))) {
            targetName = val;
            break;
        }
    }

    if (targetName) {
        const targetPath = path.join(ciganoDir, targetName);
        try {
            fs.renameSync(path.join(ciganoDir, file), targetPath);
            console.log(`Moved ${file} -> ${targetName}`);
        } catch (e) {
            console.error(`Error moving ${file}: ${e.message}`);
        }
    }
  }
}

organizeCigano();
