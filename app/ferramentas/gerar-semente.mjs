/* ==========================================================================
   Gera base/semente.js a partir dos dados de demonstração que já existem
   dentro dos coletores.

       node ferramentas/gerar-semente.mjs

   Lê os literais INSTITUICOES/EQUIPAMENTOS (raios X e odonto intraoral) e
   HOSPITAIS/PARQUE (ultrassom), confere que as listas de clientes são mesmo
   iguais e emite um cadastro único e normalizado. Transcrever isso à mão convidaria
   a erro de digitação em número de série e CNPJ — justamente o que vai
   impresso no laudo.
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

/* Recorta `const NOME = [ ... ];` no nível do arquivo e avalia o literal.
   É código nosso, local e versionado — avaliar aqui é leitura, não execução
   de entrada externa. */
function literal(fonte, nome) {
  const inicio = fonte.indexOf('\nconst ' + nome + ' = [');
  if (inicio < 0) throw new Error('não achei ' + nome);
  const fim = fonte.indexOf('\n];', inicio);
  if (fim < 0) throw new Error('não achei o fim de ' + nome);
  const texto = fonte.slice(inicio + ('\nconst ' + nome + ' = ').length, fim + 3);
  return (0, eval)('(' + texto.replace(/;\s*$/, '') + ')');
}

const rx = readFileSync(RAIZ + 'coletor-rx-in90.html', 'utf8');
const us = readFileSync(RAIZ + 'coletor-us-in96.html', 'utf8');
const od = readFileSync(RAIZ + 'coletor-odi-in95.html', 'utf8');

const clientesRx = literal(rx, 'INSTITUICOES');
const clientesUs = literal(us, 'HOSPITAIS');
const clientesOd = literal(od, 'INSTITUICOES');
const equipRx    = literal(rx, 'EQUIPAMENTOS');
const equipUs    = literal(us, 'PARQUE');
const equipOd    = literal(od, 'EQUIPAMENTOS');

/* Confere a premissa em vez de confiar nela. */
const chave = l => JSON.stringify(l.map(c => [c.id, c.nome, c.cnpj]).sort());
for (const [nome, lista] of [['ultrassom', clientesUs], ['odonto intraoral', clientesOd]])
  if (chave(clientesRx) !== chave(lista))
    throw new Error('a lista de clientes do coletor de ' + nome
      + ' diverge da de raios X — revise à mão');

/* Campos que todo equipamento tem, seja qual for a modalidade. O que sobra
   vai para `extra` e só a modalidade dona entende. */
const NUCLEO = ['id', 'relatorio', 'periodicidade', 'visita', 'validade',
                'unidade', 'setor', 'sala', 'marca', 'modelo', 'ns', 'patrimonio'];

function normalizar(e, modalidade) {
  const fora = { cliente: e.hosp, modalidade };
  const extra = {};
  for (const [k, v] of Object.entries(e)) {
    if (k === 'hosp') continue;
    if (NUCLEO.includes(k)) fora[k] = v; else extra[k] = v;
  }
  for (const k of NUCLEO) if (!(k in fora)) fora[k] = '';
  fora.extra = extra;
  return fora;
}

const semente = {
  clientes: clientesRx,
  equipamentos: [
    ...equipRx.map(e => normalizar(e, 90)),
    ...equipOd.map(e => normalizar(e, 95)),
    ...equipUs.map(e => normalizar(e, 96))
  ]
};

mkdirSync(RAIZ + 'base', { recursive: true });
writeFileSync(RAIZ + 'base/semente.js',
  '/* Gerado por ferramentas/gerar-semente.mjs — não edite à mão.\n'
  + '   Cadastro inicial de demonstração: ' + semente.clientes.length + ' clientes, '
  + semente.equipamentos.length + ' equipamentos. */\n'
  + 'window.SEMENTE = ' + JSON.stringify(semente, null, 1) + ';\n');

console.log('base/semente.js ·', semente.clientes.length, 'clientes,',
  semente.equipamentos.length, 'equipamentos');
for (const m of [90, 95, 96])
  console.log('   IN', m, '→', semente.equipamentos.filter(e => e.modalidade === m).length);
