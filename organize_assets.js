const fs = require('fs');
const path = require('path');

const baseDest = 'C:/Users/Angela/psique-oraculo/public/assets/decks';

const tasks = [
    {
        src: 'C:/Users/Angela/Desktop/Arcanos de Taro',
        dest: path.join(baseDest, 'tarot/major'),
        ext: '.jpg'
    },
    {
        src: 'C:/Users/Angela/Desktop/Arcanos Menores',
        dest: path.join(baseDest, 'tarot/minor'),
        ext: '.jpg'
    },
    {
        src: 'C:/Users/Angela/Desktop/Baralho Cigano',
        dest: path.join(baseDest, 'lenormand'),
        ext: '.jpg'
    },
    {
        src: 'C:/Users/Angela/Desktop/Capas',
        dest: path.join(baseDest, 'covers'),
        ext: '.jpg'
    }
];

function slugify(text) {
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

tasks.forEach(task => {
    if (!fs.existsSync(task.dest)) {
        fs.mkdirSync(task.dest, { recursive: true });
    }

    const files = fs.readdirSync(task.src);
    files.forEach(file => {
        const fullSrcPath = path.join(task.src, file);
        if (fs.lstatSync(fullSrcPath).isDirectory()) return;

        const parsed = path.parse(file);
        // Special case for .webp.jpeg
        let name = parsed.name;
        if (name.endsWith('.webp')) {
            name = name.slice(0, -5);
        }
        
        const newName = slugify(name) + task.ext;
        const fullDestPath = path.join(task.dest, newName);

        fs.copyFileSync(fullSrcPath, fullDestPath);
        console.log(`Copied: ${file} -> ${newName}`);
    });
});
