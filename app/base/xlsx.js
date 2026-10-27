/* ==========================================================================
   Gerador de planilha .xlsx, sem dependência externa.

   Um .xlsx é um ZIP contendo alguns XMLs. Nada aqui é mágico: montamos os
   XMLs como texto, fechamos o ZIP à mão e devolvemos um Blob. São ~200 linhas
   contra os ~450 KB de uma biblioteca completa, e o app continua sendo o que
   o repositório mostra.

   Por que .xlsx e não .csv: número gravado como número não tem briga de
   vírgula contra ponto. O Excel em português lê 57.4 do XML e mostra 57,4,
   sem assistente de importação e sem transformar 0,95 em data. O XML é sempre
   locale-independente — quem traduz é o Excel, na hora de exibir.

   O que este gerador faz: uma aba, cabeçalho em negrito e congelado, filtro
   automático, largura de coluna, texto e número. O que não faz: fórmula,
   estilo por célula, várias abas, imagem. Quando precisar de algo disso,
   acrescente aqui — ou reconsidere a biblioteca.

       Planilha.gerar({
         aba: 'Leituras',
         colunas: [{rot:'Data', larg:12}, {rot:'Valor', larg:10}],
         linhas: [['13/09/2026', 57.4], ...]     // string = texto, number = número
       })  ->  Blob

   Célula null ou undefined sai vazia. `true`/`false` saem como texto, porque
   booleano em planilha de laudo confunde mais do que ajuda.
   ========================================================================== */
(function (raiz) {
  "use strict";

  const enc = new TextEncoder();

  /* ------------------------------------------------------------------------
     1. CRC-32, que o ZIP exige por arquivo
     ---------------------------------------------------------------------- */
  const TABELA_CRC = (function () {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* ------------------------------------------------------------------------
     2. ZIP

     Sem compressão (método 0, "stored"). Uma visita dá algumas centenas de
     linhas — o arquivo sai na casa das dezenas de KB, e deflate só traria
     mais código para manter. Se um dia a planilha crescer, CompressionStream
     ('deflate-raw') existe nos navegadores atuais e entra aqui.
     ---------------------------------------------------------------------- */
  function zip(arquivos) {
    const locais = [], centrais = [];
    let deslocamento = 0;

    /* Data e hora no formato do MS-DOS, que é o que o ZIP guarda. */
    const d = new Date();
    const horaDos = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
    const dataDos = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;

    arquivos.forEach(function (a) {
      const nome = enc.encode(a.nome);
      const corpo = a.bytes;
      const crc = crc32(corpo);

      const cab = new Uint8Array(30 + nome.length);
      const v = new DataView(cab.buffer);
      v.setUint32(0, 0x04034b50, true);   /* assinatura de cabeçalho local  */
      v.setUint16(4, 20, true);           /* versão necessária: 2.0         */
      v.setUint16(6, 0x0800, true);       /* nome do arquivo em UTF-8       */
      v.setUint16(8, 0, true);            /* método 0: sem compressão       */
      v.setUint16(10, horaDos, true);
      v.setUint16(12, dataDos, true);
      v.setUint32(14, crc, true);
      v.setUint32(18, corpo.length, true);
      v.setUint32(22, corpo.length, true);
      v.setUint16(26, nome.length, true);
      v.setUint16(28, 0, true);           /* sem campo extra                */
      cab.set(nome, 30);

      const central = new Uint8Array(46 + nome.length);
      const c = new DataView(central.buffer);
      c.setUint32(0, 0x02014b50, true);   /* assinatura de diretório central */
      c.setUint16(4, 20, true);
      c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true);
      c.setUint16(12, horaDos, true);
      c.setUint16(14, dataDos, true);
      c.setUint32(16, crc, true);
      c.setUint32(20, corpo.length, true);
      c.setUint32(24, corpo.length, true);
      c.setUint16(28, nome.length, true);
      c.setUint32(42, deslocamento, true);
      central.set(nome, 46);

      locais.push(cab, corpo);
      centrais.push(central);
      deslocamento += cab.length + corpo.length;
    });

    const tamanhoCentral = centrais.reduce(function (s, x) { return s + x.length; }, 0);
    const fim = new Uint8Array(22);
    const f = new DataView(fim.buffer);
    f.setUint32(0, 0x06054b50, true);     /* fim do diretório central        */
    f.setUint16(8, arquivos.length, true);
    f.setUint16(10, arquivos.length, true);
    f.setUint32(12, tamanhoCentral, true);
    f.setUint32(16, deslocamento, true);

    return new Blob(locais.concat(centrais, [fim]),
                    {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }

  /* ------------------------------------------------------------------------
     3. XML

     Além dos cinco caracteres de escape, o XML 1.0 proíbe quase todos os
     caracteres de controle — e um deles vindo de um campo de observação
     derrubaria a planilha inteira no Excel, com mensagem de arquivo
     corrompido. Some antes de gravar.
     ---------------------------------------------------------------------- */
  function xml(s) {
    return String(s == null ? '' : s)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/[&<>"']/g, function (c) {
        return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[c];
      });
  }

  /* Índice de coluna para letra: 0 -> A, 25 -> Z, 26 -> AA. */
  function coluna(i) {
    let s = '';
    for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s;
    return s;
  }

  function celula(ref, valor, estilo) {
    const s = estilo ? ' s="' + estilo + '"' : '';
    if (valor == null || valor === '') return '<c r="' + ref + '"' + s + '/>';
    if (typeof valor === 'number' && isFinite(valor))
      return '<c r="' + ref + '"' + s + '><v>' + valor + '</v></c>';
    /* Texto vai embutido na própria célula: dispensa sharedStrings.xml, que
       seria mais um arquivo e mais uma tabela para manter em sincronia. */
    return '<c r="' + ref + '" t="inlineStr"' + s + '><is><t xml:space="preserve">'
         + xml(valor) + '</t></is></c>';
  }

  /* ------------------------------------------------------------------------
     4. Os arquivos do pacote
     ---------------------------------------------------------------------- */
  const CABECALHO_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  const CONTENT_TYPES = CABECALHO_XML +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>';

  const RELS = CABECALHO_XML +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const RELS_WORKBOOK = CABECALHO_XML +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  /* Dois formatos apenas: 0 é o normal, 1 é o cabeçalho em negrito sobre
     fundo claro. É tudo que a planilha usa. */
  const STYLES = CABECALHO_XML +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="3">' +
      '<font><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
      '<font><b/><sz val="14"/><name val="Calibri"/></font>' +
    '</fonts>' +
    '<fills count="3">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFEDF1F5"/><bgColor indexed="64"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    /* 0 normal · 1 seção (negrito sobre fundo claro) · 2 título do documento
       · 3 rótulo em negrito, sem fundo. */
    '<cellXfs count="4">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '</cellXfs>' +
    /* O estilo "Normal" tem de existir declarado. Sem ele o arquivo até abre,
       mas os leitores reclamam de pasta sem estilo padrão — e o Excel é mais
       exigente que os outros. */
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  function workbookXml(aba) {
    return CABECALHO_XML +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="' + xml(aba) + '" sheetId="1" r:id="rId1"/></sheets>' +
      '</workbook>';
  }

  /* Uma linha pode ser:
       ['rótulo', valor, ...]   um par comum
       {secao:'TEXTO'}          faixa de seção, em negrito sobre fundo claro
       {titulo:'TEXTO'}         título do documento, uma vez no alto
       {vazio:true}             respiro entre blocos
     A forma de objeto é o que permite uma planilha de leitura — rótulo numa
     coluna, valor na outra — sem inventar uma convenção de célula mágica. */
  function sheetXml(colunas, linhas, o) {
    const n = colunas.length;
    const ultima = coluna(n - 1);

    const cols = '<cols>' + colunas.map(function (c, i) {
      return '<col min="' + (i + 1) + '" max="' + (i + 1) +
             '" width="' + (c.larg || 14) + '" customWidth="1"/>';
    }).join('') + '</cols>';

    const temCabecalho = colunas.some(function (c) { return c.rot; });
    const cabecalho = temCabecalho
      ? '<row r="1">' + colunas.map(function (c, i) {
          return celula(coluna(i) + '1', c.rot, 1);
        }).join('') + '</row>'
      : '';

    let r = temCabecalho ? 1 : 0;
    const corpo = linhas.map(function (linha) {
      r++;
      if (linha && !Array.isArray(linha)) {
        if (linha.vazio) return '<row r="' + r + '"/>';
        if (linha.titulo) return '<row r="' + r + '">' + celula('A' + r, linha.titulo, 2) + '</row>';
        /* A faixa de seção pinta as duas colunas, senão o fundo para na
           primeira e a linha fica com meia tarja. */
        return '<row r="' + r + '">' + colunas.map(function (c, i) {
          return celula(coluna(i) + r, i === 0 ? linha.secao : '', 1);
        }).join('') + '</row>';
      }
      const celulas = [];
      for (let i = 0; i < n; i++) {
        const v = linha[i];
        if (v == null || v === '') continue;   /* célula vazia não precisa existir */
        /* Rótulo em negrito quando a linha pede — usado nos nomes de ensaio,
           que abrem um bloco de medidas. */
        const estilo = (i === 0 && linha.forte) ? 3 : 0;
        celulas.push(celula(coluna(i) + r, typeof v === 'boolean' ? String(v) : v, estilo));
      }
      return '<row r="' + r + '">' + celulas.join('') + '</row>';
    }).join('');

    const congelar = (o && o.congelar === false) ? '' :
      '<sheetViews><sheetView workbookViewId="0">' +
      '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
      '</sheetView></sheetViews>';
    const filtro = (o && o.filtro === false) ? '' :
      '<autoFilter ref="A1:' + ultima + (linhas.length + 1) + '"/>';

    return CABECALHO_XML +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      congelar +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      cols +
      '<sheetData>' + cabecalho + corpo + '</sheetData>' +
      filtro +
      '</worksheet>';
  }

  /* ------------------------------------------------------------------------
     5. A porta de entrada
     ---------------------------------------------------------------------- */
  function gerar(o) {
    const colunas = o.colunas || [];
    const linhas = o.linhas || [];
    const aba = (o.aba || 'Planilha').slice(0, 31).replace(/[\\\/\?\*\[\]:]/g, '-');

    const arquivo = function (nome, texto) {
      return {nome: nome, bytes: enc.encode(texto)};
    };

    return zip([
      arquivo('[Content_Types].xml', CONTENT_TYPES),
      arquivo('_rels/.rels', RELS),
      arquivo('xl/workbook.xml', workbookXml(aba)),
      arquivo('xl/_rels/workbook.xml.rels', RELS_WORKBOOK),
      arquivo('xl/styles.xml', STYLES),
      arquivo('xl/worksheets/sheet1.xml', sheetXml(colunas, linhas, o))
    ]);
  }

  /* ------------------------------------------------------------------------
     6. Entregar o arquivo ao aparelho

     Nenhum navegador deixa uma página gravar em disco sozinha. Há dois
     caminhos, e os dois exigem que isto seja chamado de dentro de um toque
     do usuário:

     - folha de compartilhamento (navigator.share): no celular é o melhor
       caminho, porque leva a "Salvar em Arquivos", Drive, e-mail e WhatsApp
       na mesma janela. É o único jeito decente no iOS;
     - download: cai na pasta de downloads. É o que existe no computador e o
       recurso de sempre onde a folha não aceita arquivo.
     ---------------------------------------------------------------------- */
  async function salvar(blob, nome) {
    const arquivo = new File([blob], nome,
      {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});

    if (navigator.canShare && navigator.canShare({files: [arquivo]})) {
      try {
        await navigator.share({files: [arquivo], title: nome});
        return 'compartilhado';
      } catch (e) {
        /* Cancelar a folha de compartilhamento não é erro, e não deve virar
           um download que o usuário não pediu. */
        if (e && e.name === 'AbortError') return 'cancelado';
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    /* O Safari precisa que a URL sobreviva ao clique. */
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    return 'baixado';
  }

  raiz.Planilha = {gerar: gerar, salvar: salvar, coluna: coluna};
})(window);
