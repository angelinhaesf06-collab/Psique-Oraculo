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

async function organizeTaro() {
  const taroDir = path.join(baseDir, 'taro');
  const majorDir = path.join(taroDir, 'major');
  const minorDir = path.join(taroDir, 'minor');

  if (!fs.existsSync(majorDir)) fs.mkdirSync(majorDir, { recursive: true });
  if (!fs.existsSync(minorDir)) fs.mkdirSync(minorDir, { recursive: true });

  const majorArcana = [
    'O Louco', 'O Mago', 'A Sacerdotisa', 'A Imperatriz', 'O Imperador', 'O Hierofante', 'Os Amantes', 'O Carro', 'A Força', 'O Eremita', 'Roda da Fortuna', 'A Justiça', 'O Pendurado', 'A Morte', 'A Temperança', 'O Diabo', 'A Torre', 'A Estrela', 'A Lua', 'O Sol', 'O Julgamento', 'O Mundo'
  ];

  const files = fs.readdirSync(taroDir);

  for (const file of files) {
    if (fs.lstatSync(path.join(taroDir, file)).isDirectory()) continue;

    const ext = path.extname(file);
    const nameWithoutExt = path.basename(file, ext);
    const slug = slugify(nameWithoutExt);
    
    // Check if it's Major Arcana
    const isMajor = majorArcana.some(m => slugify(m) === slug || slug.includes(slugify(m)));
    
    const targetDir = isMajor ? majorDir : minorDir;
    const targetPath = path.join(targetDir, `${slug}.jpg`);

    try {
      fs.renameSync(path.join(taroDir, file), targetPath);
      console.log(`Moved ${file} -> ${isMajor ? 'major' : 'minor'}/${slug}.jpg`);
    } catch (e) {
      console.error(`Error moving ${file}: ${e.message}`);
    }
  }
}

organizeTaro();
