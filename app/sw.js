/* ==========================================================================
   Service worker do Controle de Qualidade RDC 611.

   Estratégia: cache-first para tudo. O app é estático e offline por
   princípio — não existe resposta "mais fresca" na rede que valha esperar
   dentro de uma sala de raios X sem sinal. A rede só entra quando o pedido
   não está no cache, e o resultado é guardado para a próxima.

   IMPORTANTE: ao acrescentar uma modalidade, inclua o arquivo em RECURSOS
   *e* incremente VERSAO — sem isso o aparelho continua servindo o pacote
   antigo indefinidamente.
   ========================================================================== */

const VERSAO = 'cq-rdc611-v24';
const RECURSOS = [
  './',
  './index.html',
  './coletor-rx-in90.html',
  './coletor-us-in96.html',
  './coletor-odi-in95.html',
  './base/arquivos.js',
  './base/xlsx.js',
  './base/cadastro.js',
  './base/semente.js',
  './manifest.webmanifest',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './icones/icone-maskable-512.png',
  './icones/icone-180.png',
  './icones/favicon-32.png'
];

/* Instalação: baixa o pacote inteiro de uma vez. addAll é tudo-ou-nada, e é
   isso que queremos — meio app em cache é pior que nenhum.

   Sem skipWaiting aqui, de propósito: a versão nova fica em espera até o
   usuário aceitar. Trocar o app por baixo de quem está no meio de um ensaio
   é pior que ficar uma visita com a versão anterior. Quem chama skipWaiting
   é a mensagem SW_ATUALIZAR, lá embaixo. */
self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(VERSAO).then(cache => cache.addAll(RECURSOS))
  );
});

/* Ativação: descarta os pacotes de versões anteriores. */
self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(
        nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evento => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  /* Só governa o que é nosso; qualquer outra origem passa direto. */
  if (new URL(pedido.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(pedido, { ignoreSearch: true }).then(guardado => {
      if (guardado) return guardado;
      return fetch(pedido).then(resposta => {
        /* Respostas opacas ou de erro não entram no cache: envenenariam o
           pacote e o usuário ficaria com uma tela branca offline. */
        if (!resposta || resposta.status !== 200 || resposta.type !== 'basic')
          return resposta;
        const copia = resposta.clone();
        caches.open(VERSAO).then(cache => cache.put(pedido, copia));
        return resposta;
      }).catch(() => {
        /* Sem rede e fora do cache: numa navegação, devolve a casca, que é
           sempre melhor que o dinossauro do navegador. */
        if (pedido.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Sem rede e fora do cache' });
      });
    })
  );
});

/* A casca manda SW_ATUALIZAR quando o usuário aceita recarregar. */
self.addEventListener('message', evento => {
  if (evento.data === 'SW_ATUALIZAR') self.skipWaiting();
});
