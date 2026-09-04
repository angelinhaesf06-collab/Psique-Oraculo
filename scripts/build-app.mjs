// Build do APP (Capacitor / AAB): gera o export estático em `out/`.
//
// Por que este script existe:
// O app nativo NÃO usa as rotas de API locais (ele chama a API remota em
// www.pisiqueoraculo.com.br). Mas essas rotas precisam ser 'force-dynamic' para
// funcionar no Vercel, e o `output: export` do Next NÃO aceita rotas dinâmicas.
// Solução: durante o export do app, movemos `src/app/api` para fora
// temporariamente, rodamos o build e devolvemos a pasta ao lugar (sempre, mesmo
// se o build falhar).
//
// Uso: node scripts/build-app.mjs   (ou: npm run build:app)

import { execSync } from 'node:child_process';
import { existsSync, renameSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const API_DIR = join(ROOT, 'src', 'app', 'api');
const TMP_DIR = join(ROOT, '.api-tmp');

let moved = false;
try {
  if (existsSync(API_DIR)) {
    if (existsSync(TMP_DIR)) {
      throw new Error('.api-tmp já existe — restaure src/app/api manualmente antes de continuar.');
    }
    console.log('→ Movendo src/app/api para fora do export (temporário)...');
    renameSync(API_DIR, TMP_DIR);
    moved = true;
  }

  console.log('→ Gerando export estático (NEXT_PUBLIC_EXPORT=true next build)...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, NEXT_PUBLIC_EXPORT: 'true' },
  });

  console.log('✓ Export do app gerado em ./out');
} finally {
  if (moved) {
    // Garante que a pasta pai exista (deve existir) e devolve a /api ao lugar.
    mkdirSync(join(ROOT, 'src', 'app'), { recursive: true });
    renameSync(TMP_DIR, API_DIR);
    console.log('→ src/app/api restaurada.');
  }
}
