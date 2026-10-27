/* ==========================================================================
   Cadastro compartilhado: clientes, equipamentos e modalidades.

   É a única fonte de verdade de todos os consumidores — a casca (menu) e um
   coletor por modalidade. Os coletores nasceram com a lista de instituições
   escrita no próprio arquivo; a ponte no fim de cada um troca aquelas
   constantes por isto aqui.

   Fica em localStorage, não em IndexedDB: o cadastro é texto, é pequeno, e
   os coletores leem no meio da renderização, que é síncrona. IndexedDB entra
   quando chegarem as fotos, que é outro problema.
   ========================================================================== */
(function (raiz) {
  "use strict";

  const CHAVE = 'cq-rdc611-cadastro-v1';
  const CHAVE_ATIVO = 'cq-rdc611-cliente-ativo';

  /* ------------------------------------------------------------------------
     1. As oito modalidades da RDC nº 611/2022

     `icone` é o miolo de um <svg viewBox="0 0 24 24"> com traço, sem
     preenchimento — o mesmo sistema dos ícones que os coletores já usam.
     Cada desenho é o equipamento da modalidade, não um símbolo abstrato:
     quem trabalha na sala reconhece o aparelho antes de ler o nome.
     ---------------------------------------------------------------------- */
  const MODALIDADES = [
    { in: 90, arquivo: 'coletor-rx-in90.html', chave: 'coletor-cq-rx-in90-v1',
      nome: 'Radiografia médica convencional', curto: 'Radiografia',
      desc: 'Geometria, parâmetros do feixe, controle automático de exposição, receptores e proteção radiológica.',
      /* Cabeçote no alto, feixe colimado abrindo, receptor embaixo. O feixe é
         tracejado e não encosta no receptor: ligado e contínuo, o contorno
         fecha num trapézio e o ícone vira um erlenmeyer. */
      icone: '<rect x="8.6" y="2.4" width="6.8" height="3.9" rx="1.2"/>'
           + '<path d="M10.6 6.3h2.8"/>'
           + '<path d="M11.2 8.1L6.6 15.2M12.8 8.1L17.4 15.2" stroke-dasharray="2.1 1.9"/>'
           + '<rect x="3.2" y="17.4" width="17.6" height="3.2" rx="1.2"/>' },

    { in: 96, arquivo: 'coletor-us-in96.html', chave: 'coletor-cq-us-in96-v1',
      nome: 'Ultrassom diagnóstico ou intervencionista', curto: 'Ultrassom',
      desc: 'Modo B — imagem, geometria e alvos do simulador — e Doppler, transdutor a transdutor.',
      /* Transdutor e três frentes de onda. */
      icone: '<path d="M9 2.6h6v5.2l-3 2.4-3-2.4z"/>'
           + '<path d="M7.6 13.1a7 7 0 0 0 8.8 0"/>'
           + '<path d="M6.2 16.4a10 10 0 0 0 11.6 0"/>'
           + '<path d="M4.8 19.7a13 13 0 0 0 14.4 0"/>' },

    { in: 95, arquivo: 'coletor-odi-in95.html', chave: 'coletor-cq-odi-in95-v1',
      nome: 'Radiologia odontológica intraoral', curto: 'Odonto intraoral',
      desc: 'Tensão, tempo, rendimento, colimação e qualidade da imagem em equipamentos periapicais.',
      /* Um dente. */
      icone: '<path d="M12 4.6c-2.4-2-6.3-1.1-6.3 3.1 0 3 .7 5 1.4 8.1.4 1.8 2.2 2.1 2.6.3l.9-3.6c.3-1.1 1.5-1.1 1.8 0l.9 3.6c.4 1.8 2.2 1.5 2.6-.3.7-3.1 1.4-5.1 1.4-8.1 0-4.2-3.9-5.1-6.3-3.1z"/>' },

    { in: 94, arquivo: null,
      nome: 'Radiologia odontológica extraoral', curto: 'Odonto extraoral',
      desc: 'Panorâmicos e cefalométricos, incluindo tomografia de feixe cônico.',
      /* A arcada do panorâmico, com os dentes marcados. */
      icone: '<path d="M4.2 6.5c0 8 3.4 12.5 7.8 12.5s7.8-4.5 7.8-12.5"/>'
           + '<path d="M7.1 13.6l-.9 2.2M10.3 16.5l-.4 2.3M13.7 16.5l.4 2.3M16.9 13.6l.9 2.2"/>' },

    { in: 91, arquivo: null,
      nome: 'Fluoroscopia e radiologia intervencionista', curto: 'Fluoroscopia',
      desc: 'Taxa de kerma, controle automático de intensidade, resolução e dose acumulada.',
      /* O arco em C, com intensificador em cima e tubo embaixo. */
      icone: '<path d="M16.5 4.2a8.6 8.6 0 1 0 0 15.6"/>'
           + '<rect x="15.2" y="2.8" width="5.6" height="3" rx="1"/>'
           + '<rect x="15.2" y="18.2" width="5.6" height="3" rx="1"/>'
           + '<path d="M8.6 12h6.8"/>' },

    { in: 92, arquivo: null,
      nome: 'Mamografia', curto: 'Mamografia',
      desc: 'Força de compressão, CAE, dose glandular média e qualidade da imagem em simulador.',
      /* Bandeja de compressão em cima, bucky embaixo, e entre os dois a mama
         achatada. Sem coluna: com a haste vertical à esquerda o conjunto lê
         como bandeira, e a forma comprimida — que é o que identifica a
         modalidade — vira o mastro. A cúpula tem de dominar o ícone. */
      icone: '<path d="M2.8 18.4h18.4"/>'
           + '<path d="M5.1 18.4c0-4.4 3.1-6.9 6.9-6.9s6.9 2.5 6.9 6.9"/>'
           + '<path d="M3.4 11.5h17.2"/>' },

    { in: 93, arquivo: null,
      nome: 'Tomografia computadorizada', curto: 'Tomografia',
      desc: 'Número de TC, ruído, uniformidade, espessura de corte e índices de dose (CTDI).',
      /* Anel do gantry, abertura e a mesa entrando. O ponto cheio no anel é o
         tubo que gira — sem ele, dois círculos concêntricos leem como lente
         de câmera. */
      icone: '<circle cx="12" cy="10.4" r="7.5"/>'
           + '<circle cx="12" cy="10.4" r="3.3"/>'
           + '<circle cx="12" cy="4.3" r="1.15" fill="currentColor" stroke="none"/>'
           + '<path d="M4.6 20.9h14.8"/>'
           + '<path d="M12 13.7v7.2"/>' },

    { in: 97, arquivo: null,
      nome: 'Ressonância magnética nuclear', curto: 'Ressonância',
      desc: 'Relação sinal-ruído, uniformidade, exatidão geométrica e espessura de corte.',
      /* O magneto de lado, o túnel e a mesa saindo. Centrado e com pés, o
         retângulo com uma elipse dentro lê como monitor; deslocado para a
         esquerda e com a mesa atravessando, lê como túnel. */
      icone: '<rect x="2.4" y="3.8" width="12.4" height="15.2" rx="3.6"/>'
           + '<circle cx="8.6" cy="11.4" r="3.6"/>'
           + '<path d="M8.6 13.8h12.8"/>'
           + '<path d="M12.6 13.8v4.2M19.4 13.8v4.2"/>'
           + '<path d="M11.4 18h9.2"/>' }
  ];

  /* ------------------------------------------------------------------------
     1b. Ensaios de medida posterior

     Rotina do físico: em campo se adquire a imagem, e a leitura sai depois,
     no escritório, sobre a imagem gravada. Estes são os ensaios que ficam
     para essa segunda etapa — os demais fecham na própria sala.

     A lista abaixo é uma proposta, não a norma: a IN não separa os ensaios
     por momento de leitura. Mexer aqui muda a tela de medidas posteriores
     inteira, e é o único lugar a mexer.
     ---------------------------------------------------------------------- */
  const POSTERIORES = {
    90: [
      { id:'distorcao',         nome:'Distorção geométrica' },
      { id:'uniformidade_img',  nome:'Uniformidade da imagem' },
      { id:'sensib_placas',     nome:'Diferença de sensibilidade entre as placas de fósforo' },
      { id:'ind_dose_detector', nome:'Exatidão do indicador de dose do detector' },
      { id:'resolucao',         nome:'Resolução espacial' },
      { id:'artefatos',         nome:'Artefatos na imagem' },
      { id:'qualidade_img',     nome:'Qualidade da imagem' }
    ],
    95: [
      { id:'artefatos',     nome:'Artefatos na imagem' },
      { id:'apagamento',    nome:'Efetividade do ciclo de apagamento' },
      { id:'qualidade_img', nome:'Qualidade da imagem' }
    ]
  };

  /* ------------------------------------------------------------------------
     1c. Conjunto emissor — especificações do tubo de raios X

     Dados de placa do equipamento, exigidos no cabeçalho do laudo e na
     inspeção sanitária. Não são de coleta: mudam quando o tubo é trocado, não
     a cada visita.

     Ficam num bloco só porque seis das oito modalidades os têm, e são os
     mesmos seis campos em todas. Ultrassom (IN 96) e ressonância (IN 97) não
     têm tubo de raios X e não recebem o bloco — daí `MODALIDADES_COM_TUBO`
     ser a lista, e não uma exceção escrita em cada tela.

     São guardados em `extra`, como o resto do que é específico de modalidade:
     o núcleo do cadastro continua sendo o que vale para todo equipamento.
     ---------------------------------------------------------------------- */
  const MODALIDADES_COM_TUBO = [90, 91, 92, 93, 94, 95];

  const CAMPOS_TUBO = [
    { id:'tuboModelo', rot:'Modelo do tubo',     larg:'meia' },
    { id:'tuboNs',     rot:'N/S do tubo',        larg:'meia' },
    { id:'anoFab',     rot:'Ano de fabricação',  larg:'meia', dica:'Do conjunto emissor' },
    { id:'kvpMax',     rot:'Tensão máxima (kVp)', larg:'meia' },
    { id:'maMax',      rot:'Corrente máxima (mA)', larg:'meia' },
    { id:'filtracao',  rot:'Filtração total',    dica:'Inerente e adicional, em mm de alumínio' }
  ];

  /* O acervo antigo guardava modelo e série do tubo numa string só
     (`tubo: 'Opti 150/30/50C — SN T-9921'`). Quem lê o cadastro para o laudo
     usa isto, e não os campos crus: assim um equipamento cadastrado antes da
     separação continua saindo certo no relatório. */
  function descreverTubo(extra) {
    const x = extra || {};
    const partes = [x.tuboModelo, x.tuboNs].filter(Boolean);
    if (partes.length) return partes.join(' — ');
    return x.tubo || '';
  }

  /* Situações de resultado e sua gravidade — os mesmos rótulos e a mesma
     ordem dos coletores, para que a tabela de relatórios não invente uma
     terceira convenção. Peso menor é pior. */
  const ROTULOS = { conf:'conforme', nconf:'não conforme', restr:'nível de restrição',
                    lim:'limítrofe', elb:'nova linha de base',
                    pend:'pendente', na:'não aplicável' };
  /* `elb` só existe no ultrassom: é o teste sem linha de base com que
     comparar. Entra entre limítrofe e conforme — não é reprovação, mas
     também não é um resultado que se possa chamar de conforme. */
  const PESO = { restr:0, nconf:1, lim:2, elb:3, conf:4, pend:5, na:6 };


  /* ------------------------------------------------------------------------
     1d. Medidores, fantomas e ferramentas

     O coletor nasceu com uma lista fixa de instrumentos escrita dentro de
     cada arquivo. Isso serve a um serviço só — e o aplicativo é vendido a
     vários, cada um com o seu parque de medição. A lista passa a ser cadastro.

     `tipo` é o que liga o instrumento ao ensaio: o ensaio declara `instr` com
     o tipo de que precisa, e o coletor resolve para o instrumento que o
     serviço cadastrou daquele tipo. Trocar a câmara de ionização por outra
     não mexe em nenhum ensaio.
     ---------------------------------------------------------------------- */
  const TIPOS_INSTRUMENTO = [
    { id:'multimetro', classe:'medidor', nome:'Multímetro não invasivo',
      desc:'kV, tempo, dose e forma de onda' },
    { id:'camara',     classe:'medidor', nome:'Câmara de ionização',
      desc:'Kerma no ar, com eletrômetro' },
    { id:'fotometro',  classe:'medidor', nome:'Fotômetro / luxímetro',
      desc:'Luminância e iluminância' },
    { id:'trena',      classe:'medidor', nome:'Trena, paquímetro e nível',
      desc:'Distâncias, alinhamento e ângulo' },
    { id:'outro',      classe:'medidor', nome:'Outro medidor',
      desc:'O que não couber acima' },

    { id:'objeto',     classe:'fantoma', nome:'Objeto de teste de imagem',
      desc:'Pares de linhas, contraste, malha geométrica' },
    { id:'simulador',  classe:'fantoma', nome:'Simulador de paciente',
      desc:'PMMA, água e placas de atenuação' },
    { id:'fantoma_us', classe:'fantoma', nome:'Fantoma de ultrassom',
      desc:'Alvos de resolução, anecoicos e Doppler' },
    { id:'fantoma_outro', classe:'fantoma', nome:'Outro fantoma',
      desc:'O que não couber acima' }
  ];

  /* Medidor mede; fantoma é imageado. A separação é do vocabulário de quem
     usa — o físico procura "o fantoma de mama", não "o instrumento tipo
     objeto" — e é só isso que ela governa: as duas telas do cadastro. Para o
     ensaio, o que importa continua sendo o `id` do tipo. */
  const CLASSES_INSTRUMENTO = [
    { id:'medidor', nome:'Medidores',
      desc:'Instrumentos que medem: multímetro, câmara, fotômetro, trena' },
    { id:'fantoma', nome:'Fantomas',
      desc:'Objetos de teste e simuladores, que são imageados' }
  ];

  const tipoInstrumento = id =>
    TIPOS_INSTRUMENTO.find(t => t.id === id) || TIPOS_INSTRUMENTO[TIPOS_INSTRUMENTO.length - 1];

  /* ------------------------------------------------------------------------
     Coeficiente de calibração por qualidade de feixe

     O certificado de uma câmara traz um N para cada qualidade de feixe, não
     um só. Aplicar o N de 70 kV a uma medida de 120 kV é erro sistemático
     introduzido pelo próprio controle de qualidade.

     `coefDe` escolhe pela tensão do ensaio: interpola entre as duas linhas
     vizinhas e não extrapola além das pontas — fora da faixa calibrada, o
     valor honesto é o da ponta, não uma reta inventada. Sem tensão, ou com um
     coeficiente só, devolve aquele.
     ---------------------------------------------------------------------- */
  function coefDe(inst, kv) {
    const padrao = { N: 1, U: null, qualidade: null };
    if (!inst) return padrao;

    const lista = (inst.coeficientes || [])
      .filter(c => c && c.N != null && !isNaN(Number(c.N)))
      .map(c => ({ kv: c.kv == null || c.kv === '' ? null : Number(c.kv),
                   N: Number(c.N),
                   U: c.U == null || c.U === '' ? null : Number(c.U),
                   qualidade: c.qualidade || '' }));
    if (!lista.length) return padrao;
    if (lista.length === 1 || kv == null || isNaN(Number(kv))) {
      const c = lista[0];
      return { N: c.N, U: c.U, qualidade: c.qualidade };
    }

    const comKv = lista.filter(c => c.kv != null).sort((a, b) => a.kv - b.kv);
    if (!comKv.length) {
      const c = lista[0];
      return { N: c.N, U: c.U, qualidade: c.qualidade };
    }

    const alvo = Number(kv);
    if (alvo <= comKv[0].kv) return { N:comKv[0].N, U:comKv[0].U, qualidade:comKv[0].qualidade };
    const ultimo = comKv[comKv.length - 1];
    if (alvo >= ultimo.kv) return { N:ultimo.N, U:ultimo.U, qualidade:ultimo.qualidade };

    for (let i = 0; i < comKv.length - 1; i++) {
      const a = comKv[i], b = comKv[i + 1];
      if (alvo >= a.kv && alvo <= b.kv) {
        const f = (alvo - a.kv) / (b.kv - a.kv);
        return {
          N: a.N + (b.N - a.N) * f,
          /* A incerteza interpolada fica a maior das duas: interpolar
             incerteza para baixo seria afirmar uma precisão que o
             certificado não dá. */
          U: (a.U == null || b.U == null) ? (a.U == null ? b.U : a.U) : Math.max(a.U, b.U),
          qualidade: f < 0.5 ? a.qualidade : b.qualidade
        };
      }
    }
    return padrao;
  }

  /* Quantos dias faltam para o certificado vencer. Negativo, já venceu. */
  function diasParaVencer(validade) {
    const p = String(validade || '').split('/');
    if (p.length !== 3) return null;
    const d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
    if (isNaN(d.getTime())) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Math.round((d - hoje) / 86400000);
  }

  /* ------------------------------------------------------------------------
     2. Persistência
     ---------------------------------------------------------------------- */
  const vazio = () => ({ clientes: [], equipamentos: [], instrumentos: [] });

  function ler() {
    try {
      const cru = localStorage.getItem(CHAVE);
      if (cru) {
        const d = JSON.parse(cru);
        if (d && Array.isArray(d.clientes) && Array.isArray(d.equipamentos)) {
          /* Acervo gravado antes de existirem instrumentos e ensaios do
             serviço: completa em vez de descartar. */
          if (!Array.isArray(d.instrumentos)) d.instrumentos = [];
          return d;
        }
      }
    } catch (e) { /* modo privado ou dado corrompido: cai na semente */ }

    /* Primeira execução: parte do acervo de demonstração, para que o app
       nunca abra vazio numa apresentação. */
    const s = raiz.SEMENTE;
    return s ? JSON.parse(JSON.stringify(s)) : vazio();
  }

  let BD = ler();

  function gravar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(BD)); return true; }
    catch (e) { return false; }   /* cota estourada ou modo privado */
  }

  /* ------------------------------------------------------------------------
     3. Identificadores

     O id de cliente vira parte da URL (?cliente=hospex) e é a chave que liga
     equipamento a cliente — então é legível, estável e não se repete.
     ---------------------------------------------------------------------- */
  function apelido(nome) {
    const base = String(nome || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')   /* tira acento     */
      .toLowerCase().replace(/[^a-z0-9]+/g, '')
      .slice(0, 10);
    return base || 'cli';
  }
  function idUnico(base, usados) {
    if (!usados.includes(base)) return base;
    let n = 2;
    while (usados.includes(base + n)) n++;
    return base + n;
  }

  /* ------------------------------------------------------------------------
     4. API
     ---------------------------------------------------------------------- */
  const clonar = o => JSON.parse(JSON.stringify(o));

  const API = {
    MODALIDADES: MODALIDADES,
    modalidade: n => MODALIDADES.find(m => m.in === Number(n)) || null,

    POSTERIORES: POSTERIORES,
    posteriores: n => POSTERIORES[Number(n)] || [],

    /* --- conjunto emissor --- */
    CAMPOS_TUBO: CAMPOS_TUBO,
    MODALIDADES_COM_TUBO: MODALIDADES_COM_TUBO,
    temTubo: n => MODALIDADES_COM_TUBO.indexOf(Number(n)) >= 0,
    descreverTubo: descreverTubo,

    ROTULOS: ROTULOS,
    PESO: PESO,
    /* Situação de um conjunto: a pior de todas. Sem nada, 'na'. */
    pior: arr => arr.reduce((a, b) => (PESO[b] < PESO[a] ? b : a), 'na'),

    /* --- clientes --- */
    clientes: () => clonar(BD.clientes),
    cliente: id => { const c = BD.clientes.find(c => c.id === id); return c ? clonar(c) : null; },

    salvarCliente(dados) {
      const c = Object.assign({}, dados);
      if (!c.id) c.id = idUnico(apelido(c.nome), BD.clientes.map(x => x.id));
      const i = BD.clientes.findIndex(x => x.id === c.id);
      if (i >= 0) BD.clientes[i] = c; else BD.clientes.push(c);
      gravar();
      return clonar(c);
    },

    removerCliente(id) {
      /* Some com os equipamentos junto: equipamento órfão não tem cabeçalho
         de laudo, e um cadastro meio apagado é pior que nenhum. */
      BD.clientes = BD.clientes.filter(c => c.id !== id);
      BD.equipamentos = BD.equipamentos.filter(e => e.cliente !== id);
      if (API.clienteAtivo() === id) API.definirClienteAtivo(null);
      gravar();
    },

    /* --- equipamentos --- */
    equipamentos(filtro) {
      const f = filtro || {};
      return clonar(BD.equipamentos.filter(e =>
        (f.cliente == null || e.cliente === f.cliente) &&
        (f.modalidade == null || Number(e.modalidade) === Number(f.modalidade))));
    },
    equipamento: id => { const e = BD.equipamentos.find(e => e.id === id); return e ? clonar(e) : null; },

    salvarEquipamento(dados) {
      const e = Object.assign({ extra: {} }, dados);
      e.modalidade = Number(e.modalidade);
      if (!e.id) {
        const m = API.modalidade(e.modalidade);
        const pref = m ? ('IN' + m.in) : 'EQ';
        let n = 1;
        const usados = BD.equipamentos.map(x => x.id);
        while (usados.includes(pref + '-' + String(n).padStart(2, '0'))) n++;
        e.id = pref + '-' + String(n).padStart(2, '0');
      }
      const i = BD.equipamentos.findIndex(x => x.id === e.id);
      if (i >= 0) BD.equipamentos[i] = e; else BD.equipamentos.push(e);
      gravar();
      return clonar(e);
    },

    removerEquipamento(id) {
      BD.equipamentos = BD.equipamentos.filter(e => e.id !== id);
      gravar();
    },

    /* Quantos equipamentos cada modalidade tem — no cliente dado, ou em todos
       quando `cliente` vem nulo. É o número que o cartão do menu mostra. */
    contagem(modalidade, cliente) {
      return BD.equipamentos.filter(e =>
        Number(e.modalidade) === Number(modalidade) &&
        (cliente == null || e.cliente === cliente)).length;
    },


    /* --- medidores, fantomas e ferramentas --- */
    TIPOS_INSTRUMENTO: TIPOS_INSTRUMENTO,
    tipoInstrumento: tipoInstrumento,
    coefDe: coefDe,
    diasParaVencer: diasParaVencer,

    CLASSES_INSTRUMENTO: CLASSES_INSTRUMENTO,
    tiposDaClasse: c => TIPOS_INSTRUMENTO.filter(t => t.classe === c),

    instrumentos(filtro) {
      const f = filtro || {};
      return clonar((BD.instrumentos || []).filter(i =>
        (f.tipo == null || i.tipo === f.tipo) &&
        (f.classe == null || tipoInstrumento(i.tipo).classe === f.classe)));
    },
    instrumento: id => {
      const i = (BD.instrumentos || []).find(x => x.id === id);
      return i ? clonar(i) : null;
    },

    salvarInstrumento(dados) {
      BD.instrumentos = BD.instrumentos || [];
      const i = Object.assign({ coeficientes: [] }, dados);
      if (!i.id) {
        let n = 1;
        const usados = BD.instrumentos.map(x => x.id);
        while (usados.includes('INS-' + String(n).padStart(2, '0'))) n++;
        i.id = 'INS-' + String(n).padStart(2, '0');
      }
      const k = BD.instrumentos.findIndex(x => x.id === i.id);
      if (k >= 0) BD.instrumentos[k] = i; else BD.instrumentos.push(i);
      gravar();
      return clonar(i);
    },

    removerInstrumento(id) {
      BD.instrumentos = (BD.instrumentos || []).filter(i => i.id !== id);
      gravar();
    },

    /* O instrumento que o serviço usa para um tipo de ensaio. Havendo mais de
       um do mesmo tipo, o marcado como preferido manda; sem marcação, o
       primeiro cadastrado. Nenhum, devolve null — e o coletor cai na lista
       interna, para que o arquivo aberto solto continue funcionando. */
    instrumentoDoTipo(tipo) {
      const lista = (BD.instrumentos || []).filter(i => i.tipo === tipo);
      if (!lista.length) return null;
      return clonar(lista.find(i => i.preferido) || lista[0]);
    },

    /* --- cliente ativo ---
       Guardado à parte do cadastro: é preferência de sessão de trabalho, não
       dado do acervo. */
    clienteAtivo() {
      let id = null;
      try { id = localStorage.getItem(CHAVE_ATIVO); } catch (e) {}
      if (id && BD.clientes.some(c => c.id === id)) return id;
      return BD.clientes.length === 1 ? BD.clientes[0].id : null;
    },
    definirClienteAtivo(id) {
      try {
        if (id) localStorage.setItem(CHAVE_ATIVO, id);
        else localStorage.removeItem(CHAVE_ATIVO);
      } catch (e) {}
    },

    /* Recarrega de outra aba ou depois de uma escrita externa. */
    recarregar() { BD = ler(); },

    /* Volta o cadastro ao acervo de demonstração. */
    restaurarDemonstracao() {
      try { localStorage.removeItem(CHAVE); } catch (e) {}
      BD = ler();
      gravar();
    }
  };

  raiz.Cadastro = API;
})(window);
