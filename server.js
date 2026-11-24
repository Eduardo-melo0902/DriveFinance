// Servidor bem simples para abrir o site no computador: npm start
// Ele só entrega os arquivos da pasta. Só é acessível neste computador.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTA = process.env.PORT || 5173;
const RAIZ = __dirname;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.png': 'image/png',
};

http.createServer((req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const arquivo = path.join(RAIZ, caminho === '/' ? 'index.html' : caminho);
  // Impede pedir arquivos fora da pasta do projeto (ex.: /../../segredo).
  if (arquivo !== RAIZ && !arquivo.startsWith(RAIZ + path.sep)) { res.writeHead(403); res.end('Proibido'); return; }
  fs.readFile(arquivo, (erro, conteudo) => {
    if (erro) { res.writeHead(404); res.end('Não encontrado'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    res.end(conteudo);
  });
}).listen(PORTA, '127.0.0.1', () => console.log(`Driver Finance em http://localhost:${PORTA}`));
