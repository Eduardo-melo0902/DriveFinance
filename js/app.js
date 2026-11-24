/* app.js — o "porteiro" do site: olha o endereço depois do # e mostra a tela certa.
   Assim o site tem várias telas sem precisar de vários arquivos HTML. */
const NAV = [
  { rota: '/', nome: 'Início', icone: 'inicio', aba: 'inicio' },
  { rota: '/corridas', nome: 'Corridas', icone: 'carro', aba: 'corridas' },
  { rota: '/despesas', nome: 'Despesas', icone: 'recibo', aba: 'despesas' },
  { rota: '/relatorios', nome: 'Relatórios', icone: 'grafico', aba: 'relatorios' },
  { rota: '/menu', nome: 'Menu', icone: 'menu', aba: 'menu' },
];

function lerEndereco() {
  const bruto = location.hash.slice(1) || '/';
  const [caminho, busca] = bruto.split('?');
  return { caminho, partes: caminho.split('/').filter(Boolean), query: Object.fromEntries(new URLSearchParams(busca || '')) };
}

/* Procura qual tela combina com o endereço. Partes com ":" viram parâmetros. */
function acharTela(partes) {
  for (const t of TELAS) {
    if (t.partes.length !== partes.length) continue;
    const params = {};
    const combina = t.partes.every((p, i) => {
      if (p[0] === ':') { params[p.slice(1)] = decodeURIComponent(partes[i]); return true; }
      return p === partes[i];
    });
    if (combina) return { def: t, params };
  }
  return null;
}

const abaDe = (partes) => {
  const p = partes[0];
  return !p ? 'inicio' : ['corridas', 'despesas', 'relatorios'].includes(p) ? p : 'menu';
};
const valorDe = (v, ...args) => (typeof v === 'function' ? v(...args) : v);

function desenharNavegacao(aba) {
  const link = (n, classe) => `<a class="${classe}" href="#${n.rota}" ${n.aba === aba ? 'aria-current="page"' : ''}>${icone(n.icone)}<span>${n.nome}</span></a>`;
  document.getElementById('abas').innerHTML = NAV.map((n) => link(n, 'aba')).join('');
  document.getElementById('lateral').innerHTML = `
    <div class="marca-nome">${LOGO}<span>Driver Finance</span></div>
    <p class="lateral-slogan">Mais controle. Mais lucro.</p>
    ${NAV.map((n) => link(n, 'nav')).join('')}
    <div class="acoes">
      <a class="botao verde" href="#/corridas/nova">${icone('mais')}Nova corrida</a>
      <a class="botao vermelho" href="#/despesas/nova">${icone('menos')}Nova despesa</a>
    </div>`;
}

function desenharTopo(def, params, query) {
  const topo = document.getElementById('topo');
  if (def.marca) {
    const n = F.pendencias(Store.d, F.hojeISO()).length;
    topo.className = 'topo marca';
    topo.innerHTML = `<div class="marca-nome">${LOGO}<span>Driver Finance</span></div>
      <a class="topo-botao" href="#/notificacoes" aria-label="Notificações, ${n} pendentes">${icone('sino')}${n ? `<span class="contador">${n > 9 ? '9+' : n}</span>` : ''}</a>
      <a class="topo-botao topo-menu" href="#/menu" aria-label="Menu">${icone('menu')}</a>`;
    return;
  }
  const acao = valorDe(def.acao, params, query);
  const voltar = valorDe(def.voltar, params, query);
  topo.className = 'topo';
  topo.innerHTML = `${voltar ? `<a class="topo-botao" href="#${voltar}" aria-label="Voltar">${icone('voltar')}</a>` : '<span></span>'}
    <h1>${esc(valorDe(def.titulo, params, query))}</h1>
    ${acao ? `<a class="topo-botao" href="#${acao.rota}" aria-label="${esc(acao.rotulo)}">${icone(acao.icone || 'mais')}</a>` : '<span></span>'}`;
}

let enderecoAnterior = null;

function desenhar() {
  const end = lerEndereco();
  const achada = acharTela(end.partes);
  if (!achada) { irPara('/'); return; }
  const { def, params } = achada;
  const view = document.getElementById('tela');
  const mudouDeTela = enderecoAnterior !== location.hash;
  enderecoAnterior = location.hash;

  document.querySelector('.app').classList.toggle('sem-abas', !!def.semAbas);
  desenharNavegacao(abaDe(end.partes));
  aplicarCoresPlataformas(); // cores e logos das plataformas (o motorista pode ter mudado)
  try {
    desenharTopo(def, params, end.query);
    view.innerHTML = def.render(params, end.query);
    if (def.montar) def.montar(view, params, end.query);
  } catch (erro) {
    console.error(erro);
    view.innerHTML = vazio('info', 'Esta tela não abriu por um erro nos dados. Volte ao início e tente de novo.', '/', 'Ir para o início');
  }
  document.title = `${valorDe(def.titulo, params, end.query)} | Driver Finance`;
  if (mudouDeTela) { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
}

/* Redesenha a tela atual (usado depois de filtros e ações). */
function recarregar() { desenhar(); }

Store.carregar();
window.addEventListener('hashchange', desenhar);
desenhar();

/* O modo offline só funciona quando o site é aberto por um endereço http(s). */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Modo offline indisponível:', e));
}
