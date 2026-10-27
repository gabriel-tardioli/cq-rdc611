/* ==========================================================================
   Arquivos guardados no aparelho — certificados de calibração, por ora.

   Por que não `localStorage`: ele guarda texto e tem da ordem de 5 MB para o
   site inteiro. Um certificado em PDF tem 1 a 3 MB, e três deles estouram a
   cota — levando junto o cadastro e a coleta, que moram lá. IndexedDB guarda
   Blob nativamente e tem cota de outra ordem de grandeza.

   O preço é a assincronia: tudo aqui devolve Promise, enquanto o resto do
   cadastro é síncrono. Por isso o que é lido no meio da renderização — nome,
   número, validade do certificado — continua em `localStorage`, junto do
   instrumento; aqui fica só o arquivo, que é aberto por um toque e nunca no
   meio de desenhar uma tela.

       const id = await Arquivos.guardar(file, {instrumento:'INS-01'});
       await Arquivos.abrir(id);      // abre em outra aba
       await Arquivos.apagar(id);

   Sem IndexedDB — modo privado de alguns navegadores —, todas as funções
   falham silenciosamente e devolvem null. O app segue funcionando sem anexo,
   que é degradar, não quebrar.
   ========================================================================== */
(function (raiz) {
  "use strict";

  const BANCO = 'cq-rdc611-arquivos';
  const LOJA = 'arquivos';
  const VERSAO = 1;

  let promessaBanco = null;

  function abrirBanco() {
    if (promessaBanco) return promessaBanco;
    promessaBanco = new Promise(function (ok, falha) {
      if (!raiz.indexedDB) return falha(new Error('sem IndexedDB'));
      const req = raiz.indexedDB.open(BANCO, VERSAO);
      req.onupgradeneeded = function () {
        const bd = req.result;
        if (!bd.objectStoreNames.contains(LOJA))
          bd.createObjectStore(LOJA, {keyPath: 'id'});
      };
      req.onsuccess = function () { ok(req.result); };
      req.onerror = function () { falha(req.error); };
    }).catch(function (e) {
      /* Uma falha de abertura não pode deixar a promessa presa: zera para que
         a próxima tentativa não herde o erro desta. */
      promessaBanco = null;
      throw e;
    });
    return promessaBanco;
  }

  function transacao(modo, tarefa) {
    return abrirBanco().then(function (bd) {
      return new Promise(function (ok, falha) {
        const tx = bd.transaction(LOJA, modo);
        const loja = tx.objectStore(LOJA);
        let resultado;
        try { resultado = tarefa(loja); }
        catch (e) { return falha(e); }
        tx.oncomplete = function () { ok(resultado && resultado.result !== undefined
                                        ? resultado.result : resultado); };
        tx.onerror = function () { falha(tx.error); };
        tx.onabort = function () { falha(tx.error); };
      });
    }).catch(function () { return null; });
  }

  /* Identificador com o instante na frente: ordena sozinho e não colide entre
     dois anexos feitos no mesmo segundo. */
  function novoId() {
    return 'arq-' + Date.now().toString(36) + '-' +
           Math.random().toString(36).slice(2, 8);
  }

  const API = {
    /* Guarda o arquivo e devolve o id, ou null se o aparelho não deixar.
       `meta` é o que se quer saber sem abrir o arquivo: nome e tamanho saem
       daqui para a tela de cadastro. */
    guardar: function (arquivo, meta) {
      if (!arquivo) return Promise.resolve(null);
      const reg = {
        id: novoId(),
        nome: arquivo.name || 'certificado',
        tipo: arquivo.type || 'application/octet-stream',
        tamanho: arquivo.size || 0,
        criado: Date.now(),
        meta: meta || {},
        blob: arquivo
      };
      return transacao('readwrite', function (loja) { loja.put(reg); return reg.id; });
    },

    ler: function (id) {
      if (!id) return Promise.resolve(null);
      return transacao('readonly', function (loja) { return loja.get(id); });
    },

    /* Só os dados de tela, sem trazer o Blob junto pela memória. */
    ficha: function (id) {
      return API.ler(id).then(function (r) {
        if (!r) return null;
        return {id: r.id, nome: r.nome, tipo: r.tipo, tamanho: r.tamanho, criado: r.criado};
      });
    },

    apagar: function (id) {
      if (!id) return Promise.resolve(null);
      return transacao('readwrite', function (loja) { loja.delete(id); return true; });
    },

    /* Abre numa aba nova. Precisa partir de um toque do usuário, como todo
       pop-up, e a URL é revogada depois — mas não de imediato: o navegador
       ainda a está lendo quando a aba abre. */
    abrir: function (id) {
      return API.ler(id).then(function (r) {
        if (!r || !r.blob) return false;
        const url = URL.createObjectURL(r.blob);
        raiz.open(url, '_blank');
        raiz.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
        return true;
      });
    },

    /* Quanto o aparelho já deixou guardar e quanto está em uso. Serve para
       avisar antes de a cota estourar, não depois. */
    espaco: function () {
      if (!navigator.storage || !navigator.storage.estimate)
        return Promise.resolve(null);
      return navigator.storage.estimate().then(function (e) {
        return {usado: e.usage || 0, cota: e.quota || 0};
      }).catch(function () { return null; });
    },

    disponivel: function () { return !!raiz.indexedDB; }
  };

  raiz.Arquivos = API;
})(window);
