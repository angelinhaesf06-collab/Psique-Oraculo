const sharp = require('sharp');

const files = [
  'C:/Users/Angela/psique-oraculo/public/assets/brand/mandala-login.png',
  'C:/Users/Angela/psique-oraculo/assets/logo.png',
  'C:/Users/Angela/Desktop/Mandala.jpg'
];

async function check() {
  for (const f of files) {
    try {
      const meta = await sharp(f).metadata();
      console.log(`${f}: ${meta.width}x${meta.height}, format: ${meta.format}`);
    } catch (e) {
      console.log(`${f}: Erro - ${e.message}`);
    }
  }
}

check();
