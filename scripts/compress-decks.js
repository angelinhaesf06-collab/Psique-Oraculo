const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const decksDir = path.join('public', 'assets', 'decks');
const MAX_W = 600;   // cartas aparecem ~100px no app; 600 cobre retina com folga
const Q = 80;

function walk(dir) {
  let files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(p));
    else files.push(p);
  }
  return files;
}

(async () => {
  const files = walk(decksDir);
  let before = 0, after = 0;
  for (const f of files) {
    if (!/\.(jpg|jpeg|png)$/i.test(f)) continue;
    const orig = fs.statSync(f).size;
    before += orig;
    // Pula o que já está comprimido (evita perder qualidade re-comprimindo)
    if (!/\.png$/i.test(f) && orig <= 95 * 1024) { after += orig; continue; }
    try {
      const isPng = /\.png$/i.test(f);
      const input = fs.readFileSync(f); // lê na memória p/ não travar o arquivo no Windows
      const buf = await sharp(input)
        .rotate()
        .resize({ width: MAX_W, withoutEnlargement: true })
        .jpeg({ quality: Q, mozjpeg: true })
        .toBuffer();
      if (isPng) {
        const jpgPath = f.replace(/\.png$/i, '.jpg');
        fs.writeFileSync(jpgPath, buf);
        if (jpgPath !== f) fs.unlinkSync(f);
        after += buf.length;
        console.log('PNG->JPG', path.basename(f), (orig / 1024 | 0) + 'KB ->', (buf.length / 1024 | 0) + 'KB');
      } else {
        fs.writeFileSync(f, buf);
        after += buf.length;
      }
    } catch (e) {
      console.error('Falha em', f, e.message);
      after += orig;
    }
  }
  console.log('=== Total antes:', (before / 1048576).toFixed(1) + 'MB', '-> depois:', (after / 1048576).toFixed(1) + 'MB');
})();
