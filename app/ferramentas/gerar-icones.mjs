/* ==========================================================================
   Gerador dos ícones do app. Não roda no aparelho — é ferramenta de mesa:
   `node ferramentas/gerar-icones.mjs` reescreve tudo em icones/.

   Desenha por campo de distância (SDF) e resolve a borda com smoothstep, em
   vez de rasterizar SVG: sem dependência externa, e a marca sai limpa tanto
   no ícone de 512 quanto no favicon de 32.
   ========================================================================== */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

/* --- PNG mínimo: assinatura, IHDR, IDAT, IEND ---------------------------- */
const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = buf => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const pedaco = (tipo, dados) => {
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados]);
  const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tam, corpo, crc]);
};
function png(largura, altura, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0); ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; ihdr[9] = 6; /* 8 bits, RGBA */
  /* filtro 0 em cada linha — o zlib já dá compressão suficiente para ícone */
  const bruto = Buffer.alloc(altura * (largura * 4 + 1));
  for (let y = 0; y < altura; y++) {
    bruto[y * (largura * 4 + 1)] = 0;
    rgba.copy(bruto, y * (largura * 4 + 1) + 1, y * largura * 4, (y + 1) * largura * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(bruto, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0))
  ]);
}

/* --- geometria em campo de distância ------------------------------------ */
const distSegmento = (px, py, ax, ay, bx, by) => {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
};
const distRetanguloArredondado = (px, py, cx, cy, mx, my, r) => {
  const qx = Math.abs(px - cx) - (mx - r), qy = Math.abs(py - cy) - (my - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
/* cobertura ∈ [0,1] a partir da distância com sinal (negativo = dentro) */
const cobertura = d => Math.max(0, Math.min(1, 0.5 - d));

/* A marca: o traçado de pulso do MARCA dos coletores, em coordenadas 0..1.
   Só a onda — as arcadas de ultrassom não sobrevivem a 48 px de lançador. */
const PULSO = [[0.00,0.50],[0.23,0.50],[0.35,0.17],[0.54,0.83],[0.69,0.33],[0.80,0.50],[1.00,0.50]];

const COR_FUNDO = [0x1B, 0x46, 0x9A];   /* azul de marca, primo do --accent  */
const COR_FUNDO_2 = [0x2E, 0x63, 0xC8];
const COR_MARCA = [0xFF, 0xFF, 0xFF];

function desenhar(lado, { margem, raio, fundo = true }) {
  const px = Buffer.alloc(lado * lado * 4);
  const m = lado * margem;                       /* área útil da marca       */
  const util = lado - 2 * m;
  const esp = Math.max(1.6, lado * 0.052);       /* espessura do traço       */
  const pts = PULSO.map(([x, y]) => [m + x * util, m + (0.30 + y * 0.40) * lado - lado * 0.30 + util * 0.30]);
  /* recentra a onda verticalmente na área útil */
  const ys = pts.map(p => p[1]);
  const desloca = (lado / 2) - (Math.min(...ys) + Math.max(...ys)) / 2;
  pts.forEach(p => { p[1] += desloca; });

  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      let r = 0, g = 0, b = 0, a = 0;

      if (fundo) {
        const cobFundo = cobertura(distRetanguloArredondado(cx, cy, lado / 2, lado / 2, lado / 2, lado / 2, raio * lado));
        const t = cy / lado;                      /* gradiente vertical suave */
        r = COR_FUNDO[0] + (COR_FUNDO_2[0] - COR_FUNDO[0]) * t;
        g = COR_FUNDO[1] + (COR_FUNDO_2[1] - COR_FUNDO[1]) * t;
        b = COR_FUNDO[2] + (COR_FUNDO_2[2] - COR_FUNDO[2]) * t;
        a = cobFundo;
      }

      let dMarca = Infinity;
      for (let i = 0; i < pts.length - 1; i++)
        dMarca = Math.min(dMarca, distSegmento(cx, cy, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
      const cobMarca = cobertura(dMarca - esp / 2);

      if (cobMarca > 0) {                         /* marca por cima do fundo  */
        r = r * (1 - cobMarca) + COR_MARCA[0] * cobMarca;
        g = g * (1 - cobMarca) + COR_MARCA[1] * cobMarca;
        b = b * (1 - cobMarca) + COR_MARCA[2] * cobMarca;
        a = Math.max(a, cobMarca);
      }

      const i = (y * lado + x) * 4;
      px[i] = Math.round(r); px[i + 1] = Math.round(g); px[i + 2] = Math.round(b);
      px[i + 3] = Math.round(a * 255);
    }
  }
  return png(lado, lado, px);
}

/* margem 0.22 nos comuns; 0.30 no maskable, que o Android recorta em círculo */
const SAIDAS = [
  ['icones/icone-192.png',          192, { margem: 0.22, raio: 0.22 }],
  ['icones/icone-512.png',          512, { margem: 0.22, raio: 0.22 }],
  ['icones/icone-maskable-512.png', 512, { margem: 0.30, raio: 0.50 }],
  ['icones/icone-180.png',          180, { margem: 0.22, raio: 0.00 }], /* iOS arredonda sozinho */
  ['icones/favicon-32.png',          32, { margem: 0.16, raio: 0.20 }]
];
for (const [caminho, lado, opts] of SAIDAS) {
  writeFileSync(new URL('../' + caminho, import.meta.url), desenhar(lado, opts));
  console.log('gerado', caminho, lado + '×' + lado);
}
