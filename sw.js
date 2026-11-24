/* sw.js — "service worker": guarda os arquivos do site no aparelho
   para ele abrir mesmo sem internet.
   Estratégia: tenta a internet primeiro (sempre a versão mais nova)
   e, se não houver conexão, usa a cópia guardada. */
const CACHE = 'driver-finance-v6';
const ARQUIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'assets/icone.svg',
  'assets/fonts/barlow-latin-400-normal.woff2', 'assets/fonts/barlow-latin-500-normal.woff2',
  'assets/fonts/barlow-latin-600-normal.woff2', 'assets/fonts/barlow-latin-700-normal.woff2',
  'js/finance.js', 'js/ia.js', 'js/ui.js', 'js/store.js', 'js/app.js', 'js/telas-inicio.js',
  'js/telas-corridas.js', 'js/telas-recibos.js', 'js/telas-despesas.js', 'js/telas-receber.js', 'js/telas-veiculo.js',
  'js/telas-relatorios.js', 'js/telas-ajustes.js', 'js/telas-ia.js', 'js/vendor/html2canvas.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return resposta;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
