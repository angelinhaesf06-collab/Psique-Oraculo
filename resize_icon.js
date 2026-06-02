const sharp = require('sharp');
const path = require('path');

const input = 'C:/Users/Angela/psique-oraculo/assets/logo.png';
const output = 'C:/Users/Angela/psique-oraculo/assets/icon-only.png';

sharp(input)
  .resize(1024, 1024, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .extend({
    top: 256,
    bottom: 256,
    left: 256,
    right: 256,
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .resize(1024, 1024) // Resize back to standard
  .toFile(output)
  .then(() => console.log('Ícone processado com sucesso!'))
  .catch(err => console.error('Erro ao processar ícone:', err));
