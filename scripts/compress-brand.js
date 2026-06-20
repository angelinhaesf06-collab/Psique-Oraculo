const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const dir = path.join('public','assets','brand');
(async () => {
  let before=0, after=0;
  for (const name of fs.readdirSync(dir)) {
    const f = path.join(dir, name);
    if (!/\.(jpg|jpeg|png)$/i.test(f)) continue;
    const orig = fs.statSync(f).size; before += orig;
    try {
      const input = fs.readFileSync(f);
      let buf;
      if (/\.png$/i.test(f)) {
        // mantém transparência (alpha); só comprime/redimensiona
        buf = await sharp(input).resize({ width: 450, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 80 }).toBuffer();
      } else {
        buf = await sharp(input).resize({ width: 600, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      }
      if (buf.length < orig) { fs.writeFileSync(f, buf); after += buf.length; console.log(name, (orig/1024|0)+'KB ->', (buf.length/1024|0)+'KB'); }
      else { after += orig; }
    } catch(e){ console.error('Falha', name, e.message); after += orig; }
  }
  console.log('=== brand antes:', (before/1048576).toFixed(1)+'MB -> depois:', (after/1048576).toFixed(1)+'MB');
})();
