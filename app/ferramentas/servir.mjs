/* ==========================================================================
   Servidor estático de desenvolvimento.

       node ferramentas/servir.mjs [porta]

   Existe por um motivo só: service worker não registra em file://. Para ver
   o app como ele será no aparelho — instalável e offline — é preciso servi-lo
   por http. Em produção qualquer hospedagem estática faz o mesmo papel.

   Escuta em 0.0.0.0 e imprime o endereço da rede local, que é como o celular
   alcança o notebook para o primeiro carregamento.
   ========================================================================== */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PORTA = Number(process.argv[2]) || 8080;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2'
};

createServer((req, res) => {
  const pedido = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const alvo = join(RAIZ, normalize(pedido === '/' ? '/index.html' : pedido));

  /* Recusa qualquer caminho que escape da raiz servida. */
  if (!alvo.startsWith(RAIZ.endsWith(sep) ? RAIZ : RAIZ + sep)) {
    res.writeHead(403).end('403');
    return;
  }

  let info;
  try { info = statSync(alvo); } catch { res.writeHead(404).end('404 · ' + pedido); return; }
  if (info.isDirectory()) { res.writeHead(404).end('404 · ' + pedido); return; }

  res.writeHead(200, {
    'Content-Type': TIPOS[extname(alvo).toLowerCase()] || 'application/octet-stream',
    'Content-Length': info.size,
    /* Sem cache do navegador em desenvolvimento: quem faz cache aqui é o
       service worker, e cache duplo esconde o que acabou de mudar. */
    'Cache-Control': 'no-store'
  });
  createReadStream(alvo).pipe(res);
}).listen(PORTA, '0.0.0.0', () => {
  const locais = Object.values(networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('Servindo ' + RAIZ);
  console.log('  http://localhost:' + PORTA);
  for (const ip of locais) console.log('  http://' + ip + ':' + PORTA + '   ← use este no celular');
});
