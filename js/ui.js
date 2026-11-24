/* ui.js — peças reutilizáveis da interface: ícones, campos, selos, avisos.
   Cada função devolve um pedaço de HTML em forma de texto. */
const F = Finance;

/* IMPORTANTE: todo texto digitado pelo usuário passa por esc() antes de ir
   para a tela. Sem isso, um texto com "<script>" poderia virar código. */
function esc(valor) {
  return String(valor == null ? '' : valor).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const ICONES = {
  inicio: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  carro: '<path d="M5 17H3v-5l2.2-5.2A2 2 0 0 1 7 5.5h10a2 2 0 0 1 1.8 1.3L21 12v5h-2"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/>',
  recibo: '<path d="M5 3v18l2.3-1.5L9.7 21l2.3-1.5 2.3 1.5 2.4-1.5L19 21V3z"/><path d="M9 8h6M9 12h6"/>',
  grafico: '<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V7M18 17v-8"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  voltar: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  esq: '<path d="m15 18-6-6 6-6"/>',
  dir: '<path d="m9 18 6-6-6-6"/>',
  sino: '<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pessoas: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4.3a4 4 0 0 1 0 7.4M22 21a7 7 0 0 0-4-6.3"/>',
  combustivel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M3 21h13M4 11h11"/><path d="M15 13h2a2 2 0 0 1 2 2v2a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
  pedagio: '<path d="M6 3 3 21M18 3l3 18M12 4v3M12 11v3M12 18v3"/>',
  comida: '<path d="M7 3v18M4 3v5a3 3 0 0 0 6 0V3"/><path d="M17 21v-7M17 14c-2 0-3-2-3-5.5S15.5 3 17 3z"/>',
  lavagem: '<path d="M12 3s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12z"/>',
  chave: '<path d="M14.7 6.3a4 4 0 0 1 5-1l-3 3 1 2 2 1 3-3a4 4 0 0 1-5.4 5.2L9 21.8a2 2 0 0 1-3-3L14.3 11a4 4 0 0 1 .4-4.7z" transform="translate(-1.4 -1.4)"/>',
  pontos: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  doc: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  escudo: '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  ajustes: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  nuvem: '<path d="M7 18a5 5 0 0 1-.6-10A6 6 0 0 1 18 9.200a4.500 4.500 0 0 1-.5 8.800"/><path d="M12 21v-9M8.500 15 12 11.500 15.500 15"/>',
  restaurar: '<path d="M3 12a9 9 0 1 0 3-6.700L3 8"/><path d="M3 3v5h5M12 8v4l3 2"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  enviar: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
  conversa: '<path d="M21 12a8.500 8.500 0 0 1-12.500 7.500L3 21l1.500-5.500A8.500 8.500 0 1 1 21 12z"/>',
  lixo: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  fechamento: '<path d="M9 4h6v3H9z"/><path d="M9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3"/><path d="m9 14 2 2 4-4"/>',
  dinheiro: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.500"/><path d="M7 12h.01M17 12h.01"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  baixar: '<path d="M12 3v12M7 11l5 5 5-5M4 21h16"/>',
};
function icone(nome, classe) {
  return `<svg class="icone ${classe || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome] || ''}</svg>`;
}
const LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#143A69"/><circle cx="32" cy="32" r="20" fill="none" stroke="#F5B800" stroke-width="6"/><circle cx="32" cy="32" r="5.500" fill="#F5B800"/><path d="M13 28h38M32 37v15" stroke="#F5B800" stroke-width="6" stroke-linecap="round"/></svg>';

/* ---------- Plataformas ----------
   Ficam em Store.d.plataformas (o motorista edita tudo na tela Plataformas).
   Store.d.ordemPlataformas diz a ordem: as 3 primeiras aparecem direto, o resto no "+". */
const PF_DIRETO = 3;
const corValida = (c, padrao) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : padrao);
function plataformaDe(id) {
  const p = Store.d.plataformas[id];
  return Object.assign({ id, nome: String(id), cor: '#5b6b80', corTexto: '#ffffff', img: '', taxa: 0, modo: 'bruto', forma: 'Dinheiro' }, p, { id });
}
const plataformasAtivas = () => Store.d.ordemPlataformas.filter((id) => !Store.d.plataformas[id].removida).map(plataformaDe);
const nomePlataforma = (id) => plataformaDe(id).nome;
const formaDaPlataforma = (id) => plataformaDe(id).forma;
const FORMAS_PAGAMENTO = ['Dinheiro', 'Débito', 'Crédito', 'Pix', '99', 'Uber', 'Use Táxi 1', 'Use Táxi 2'];
/* Formas fixas + a forma de cada plataforma ativa (ex.: uma plataforma nova "Indrive"). */
const formasPagamento = () => [...new Set(FORMAS_PAGAMENTO.concat(plataformasAtivas().map((p) => p.forma)))];

/* O que vai dentro do botão: a logo (se tiver) ou o nome.
   Com logo, o nome continua lá, escondido, para leitores de tela. */
function conteudoPlataforma(p, imgSrc) {
  const src = imgSrc !== undefined ? imgSrc : (p.img && Store.d.imagens[p.img]) || '';
  return src ? `<img class="pf-logo" src="${esc(src)}" alt=""><span class="so-leitor">${esc(p.nome)}</span>` : esc(p.nome);
}
const estiloPlataforma = (p) => `background:${corValida(p.cor, '#5b6b80')};color:${corValida(p.corTexto, '#ffffff')}`;

/* As cores viram uma folha de estilo (.pf-uber, .pf-99...) que vale no app inteiro. */
function aplicarCoresPlataformas() {
  let el = document.getElementById('cores-pf');
  if (!el) { el = document.createElement('style'); el.id = 'cores-pf'; document.head.append(el); }
  el.textContent = Object.keys(Store.d.plataformas)
    .filter((id) => /^[\w-]+$/.test(id))
    .map((id) => `.pf-${id}{${estiloPlataforma(plataformaDe(id))}}`).join('\n');
}

/* Botões de plataforma: as 3 primeiras e "+". O "+" mostra as outras e o atalho "Nova". */
function htmlEscolhaPlataforma(nome, atual) {
  const chip = (p) => `<label class="chip"><input type="radio" name="${nome}" value="${esc(p.id)}" ${p.id === atual ? 'checked' : ''}><span class="pf-${esc(p.id)}">${conteudoPlataforma(p)}</span></label>`;
  const ativas = plataformasAtivas();
  const extras = ativas.slice(PF_DIRETO);
  // Corrida antiga de uma plataforma retirada: ela aparece no "+" para não sumir.
  if (atual && !ativas.some((p) => p.id === atual) && Store.d.plataformas[atual]) extras.push(plataformaDe(atual));
  const extraEscolhida = extras.some((p) => p.id === atual);
  return `<div class="escolha-pf">
    <div class="chips" role="radiogroup" aria-label="Plataforma">
      ${ativas.slice(0, PF_DIRETO).map(chip).join('')}
      <button type="button" class="chip-mais ${extraEscolhida ? 'ativo' : ''}" data-mais-pf aria-expanded="${extraEscolhida}" aria-label="Mais plataformas">${icone(extraEscolhida ? 'menos' : 'mais')}</button>
    </div>
    <div class="chips grade" data-extras-pf role="radiogroup" aria-label="Mais plataformas" ${extraEscolhida ? '' : 'hidden'}>${extras.map(chip).join('')}
      <a class="chip-nova" href="#/plataformas/nova?voltar=corrida">${icone('mais')}Nova</a>
    </div>
  </div>`;
}
function ligarEscolhaPlataforma(raiz) {
  const botao = raiz.querySelector('[data-mais-pf]');
  const extras = raiz.querySelector('[data-extras-pf]');
  botao.addEventListener('click', () => {
    extras.hidden = !extras.hidden;
    botao.setAttribute('aria-expanded', String(!extras.hidden));
    botao.innerHTML = icone(extras.hidden ? 'mais' : 'menos');
  });
  // O "+" fica destacado quando a plataforma escolhida está escondida nele.
  raiz.addEventListener('change', (e) => {
    if (e.target.type === 'radio' && e.target.closest('.escolha-pf')) botao.classList.toggle('ativo', !!e.target.closest('[data-extras-pf]'));
  });
}
const CATEGORIAS = [
  { id: 'Combustível', icone: 'combustivel', classe: 'cat-combustivel', cor: '#2563D9' },
  { id: 'Pedágio', icone: 'pedagio', classe: 'cat-pedagio', cor: '#E5A100' },
  { id: 'Alimentação', icone: 'comida', classe: 'cat-alimentacao', cor: '#7A3FC4' },
  { id: 'Lavagem', icone: 'lavagem', classe: 'cat-lavagem', cor: '#17A398' },
  { id: 'Manutenção', icone: 'chave', classe: 'cat-manutencao', cor: '#C8325A' },
  { id: 'Outros', icone: 'pontos', classe: 'cat-outros', cor: '#7C8F2A' },
];
const categoria = (id) => CATEGORIAS.find((c) => c.id === id) || CATEGORIAS[5];

/* ---------- Registro de telas ----------
   tela('/corridas/:id', {...}) diz: "quando o endereço for esse, mostre isto". */
const TELAS = [];
function tela(padrao, definicao) {
  TELAS.push(Object.assign({ padrao, partes: padrao.split('/').filter(Boolean) }, definicao));
}
const irPara = (rota) => { location.hash = '#' + rota; };

/* ---------- Pedaços prontos de HTML ---------- */
const campo = (rotulo, controle, ajuda) =>
  `<label class="campo"><span>${esc(rotulo)}</span>${controle}${ajuda ? `<small>${esc(ajuda)}</small>` : ''}</label>`;

const entrada = (name, valor, attrs) => `<input type="text" name="${name}" value="${esc(valor)}" ${attrs || ''}>`;
const entradaData = (name, valor, attrs) => `<input type="date" name="${name}" value="${esc(valor)}" ${attrs || ''}>`;
const entradaHora = (name, valor, attrs) => `<input type="time" name="${name}" value="${esc(valor)}" ${attrs || ''}>`;
const entradaDinheiro = (name, centavos, attrs) =>
  `<input type="text" inputmode="numeric" name="${name}" data-dinheiro value="${F.brl(centavos || 0)}" autocomplete="off" ${attrs || ''}>`;
const entradaKm = (name, valor, ph) =>
  `<input type="number" inputmode="numeric" min="0" step="1" name="${name}" value="${esc(valor || '')}" placeholder="${ph || ''}">`;

/* Monta um <select>. Cada opção pode ser 'texto' ou ['valor', 'texto']. */
function selecao(name, opcoes, atual, attrs) {
  const linhas = opcoes.map((o) => {
    const [v, t] = Array.isArray(o) ? o : [o, o];
    return `<option value="${esc(v)}" ${String(v) === String(atual) ? 'selected' : ''}>${esc(t)}</option>`;
  });
  return `<select name="${name}" ${attrs || ''}>${linhas.join('')}</select>`;
}

function selo(status) {
  const classes = { 'em dia': 'bom', 'válido': 'bom', recebido: 'bom', 'a vencer': 'atencao', vencido: 'ruim', pendente: 'neutro', 'não cadastrado': 'neutro' };
  const texto = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="selo ${classes[status] || 'neutro'}">${esc(texto)}</span>`;
}

const iniciais = (nome) => String(nome || '?').trim().split(/\s+/).filter((_, i, a) => i === 0 || i === a.length - 1).map((p) => p[0]).join('').toUpperCase();

function vazio(nomeIcone, texto, rota, rotuloBotao) {
  return `<div class="vazio">${icone(nomeIcone)}<p>${esc(texto)}</p>${rota ? `<a class="botao" href="#${rota}">${icone('mais')}${esc(rotuloBotao)}</a>` : ''}</div>`;
}

/* ---------- Máscara de dinheiro ----------
   Enquanto a pessoa digita 1 2 5 0, o campo mostra R$ 12,50. */
const centavosDe = (texto) => parseInt(String(texto).replace(/\D/g, ''), 10) || 0;
document.addEventListener('input', (e) => {
  if (e.target.matches && e.target.matches('[data-dinheiro]')) e.target.value = F.brl(Math.min(centavosDe(e.target.value), 99999999999));
});

/* Lê todos os campos de um formulário e devolve um objeto. */
function lerForm(form) {
  const dados = Object.fromEntries(new FormData(form));
  form.querySelectorAll('[data-dinheiro]').forEach((i) => { dados[i.name] = centavosDe(i.value); });
  return dados;
}

/* Liga o envio do formulário e impede a página de recarregar. */
function aoEnviar(raiz, funcao) {
  const form = raiz.querySelector('form');
  form.addEventListener('submit', (e) => { e.preventDefault(); funcao(lerForm(form), form); });
}
function mostrarErro(form, texto) {
  let el = form.querySelector('.erro');
  if (!el) { el = document.createElement('p'); el.className = 'erro'; el.setAttribute('role', 'alert'); form.querySelector('[type=submit]').before(el); }
  el.textContent = texto;
}

/* ---------- Avisos ---------- */
let temporizadorAviso;
function avisar(texto) {
  const el = document.getElementById('aviso');
  el.textContent = texto;
  el.classList.add('visivel');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove('visivel'), 2600);
}

/* Janela de confirmação. Devolve uma Promise: await confirmar(...) vale true ou false. */
function confirmar(texto, rotuloOk, perigoso, rotuloNao) {
  return new Promise((resolver) => {
    const d = document.createElement('dialog');
    d.innerHTML = `<p>${esc(texto)}</p><div class="botoes dois">
      <button class="botao claro" data-r="n" type="button">${esc(rotuloNao || 'Cancelar')}</button>
      <button class="botao ${perigoso ? 'vermelho' : ''}" data-r="s" type="button">${esc(rotuloOk)}</button></div>`;
    document.body.append(d);
    const fim = (r) => { d.close(); d.remove(); resolver(r); };
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) fim(b.dataset.r === 's'); });
    d.addEventListener('cancel', (e) => { e.preventDefault(); fim(false); });
    d.showModal();
  });
}

/* Botão "Excluir" padrão das telas de edição. */
function ligarExcluir(raiz, pergunta, aoConfirmar) {
  const b = raiz.querySelector('[data-excluir]');
  if (b) b.addEventListener('click', async () => { if (await confirmar(pergunta, 'Excluir', true)) aoConfirmar(); });
}
const botaoExcluir = (rotulo) => `<button type="button" class="botao perigo largo" data-excluir>${icone('lixo')}${esc(rotulo)}</button>`;

/* ---------- Filtro de período (Dia, Semana, Mês, Ano) ---------- */
const novoPeriodo = (tipo) => ({ tipo: tipo || 'mes', ref: F.hojeISO() });
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function rotuloPeriodo(p) {
  const { inicio, fim } = F.intervalo(p.tipo, p.ref);
  if (p.tipo === 'dia') return F.dataBR(inicio);
  if (p.tipo === 'mes') { const m = MESES[Number(inicio.slice(5, 7)) - 1]; return `${m.charAt(0).toUpperCase() + m.slice(1)} de ${inicio.slice(0, 4)}`; }
  if (p.tipo === 'ano') return inicio.slice(0, 4);
  return `${F.dataBR(inicio).slice(0, 5)} a ${F.dataBR(fim)}`;
}

function htmlPeriodo(p) {
  const tipos = [['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês'], ['ano', 'Ano']];
  const noFuturo = F.intervalo(p.tipo, F.moverPeriodo(p.tipo, p.ref, 1)).inicio > F.hojeISO();
  return `<div class="filtros" data-periodo>
    <div class="segmento">${tipos.map(([v, t]) => `<button type="button" data-tipo="${v}" aria-pressed="${p.tipo === v}">${t}</button>`).join('')}</div>
    <div class="periodo-nav">
      <button type="button" data-passo="-1" aria-label="Período anterior">${icone('esq')}</button>
      <span>${esc(rotuloPeriodo(p))}</span>
      <button type="button" data-passo="1" aria-label="Próximo período" ${noFuturo ? 'disabled' : ''}>${icone('dir')}</button>
    </div></div>`;
}

function ligarPeriodo(raiz, p) {
  raiz.querySelector('[data-periodo]').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.tipo) { p.tipo = b.dataset.tipo; p.ref = F.hojeISO(); }
    else p.ref = F.moverPeriodo(p.tipo, p.ref, Number(b.dataset.passo));
    recarregar();
  });
}
