/* Tela: Relatórios, com os gráficos desenhados em SVG. */
const filtroRelatorio = { periodo: novoPeriodo('mes') };

/* Gráfico de rosca. Cada fatia é um pedaço do contorno de um círculo:
   stroke-dasharray diz o tamanho do pedaço e dashoffset onde ele começa. */
function htmlRosca(t) {
  const fatias = CATEGORIAS.filter((c) => t.porCategoria[c.id] > 0).map((c) => ({ ...c, valor: t.porCategoria[c.id] }));
  const R = 54, C = 2 * Math.PI * R, VAO = 2;
  let acumulado = 0;
  const circulos = fatias.map((f) => {
    const frac = f.valor / t.despesas;
    const tamanho = Math.max(frac * C - (fatias.length > 1 ? VAO : 0), 1);
    const s = `<circle class="fatia" tabindex="0" r="${R}" cx="75" cy="75" fill="none" stroke="${f.cor}" stroke-width="18"
      stroke-dasharray="${tamanho.toFixed(2)} ${(C - tamanho).toFixed(2)}" stroke-dashoffset="${(-acumulado).toFixed(2)}"
      data-rotulo="${f.id}" data-valor="${F.brl(f.valor)}" aria-label="${f.id}: ${F.brl(f.valor)}"></circle>`;
    acumulado += frac * C;
    return s;
  }).join('');
  const legenda = fatias.map((f) => `<div><i style="background:${f.cor}"></i><span>${f.id}</span><b>${F.brl(f.valor)}</b><em>${Math.round((f.valor / t.despesas) * 100)}%</em></div>`).join('');
  return `<div class="rosca-area">
    <div class="rosca">
      <svg viewBox="0 0 150 150" width="150" height="150" style="transform:rotate(-90deg)" role="img" aria-label="Despesas por categoria">${circulos}</svg>
      <div class="rosca-centro"><span id="rosca-rotulo">Total</span><strong id="rosca-valor">${F.brl(t.despesas)}</strong></div>
    </div>
    <div class="legenda">${legenda}</div>
  </div>`;
}

function htmlBarras(t) {
  const linhas = Object.entries(t.porPlataforma).sort((a, b) => b[1] - a[1]);
  const maior = linhas.length ? linhas[0][1] : 1;
  const soma = linhas.reduce((s, x) => s + x[1], 0);
  return `<div class="barras">${linhas.map(([id, v]) => `
    <div title="${esc(nomePlataforma(id))}: ${F.brl(v)}">
      <div class="barra-topo"><span>${esc(nomePlataforma(id))}</span><span>${F.brl(v)} (${Math.round((v / soma) * 100)}%)</span></div>
      <div class="barra-trilho"><div class="barra" style="width:${(v / maior) * 100}%"></div></div>
    </div>`).join('')}</div>`;
}

tela('/relatorios', {
  titulo: 'Relatórios', voltar: '/',
  render() {
    const p = filtroRelatorio.periodo;
    const { inicio, fim } = F.intervalo(p.tipo, p.ref);
    const t = F.totais(Store.d, inicio, fim);
    const vazioPeriodo = !t.nCorridas && !t.despesas && !t.receita;
    return `
      ${htmlPeriodo(p)}
      ${vazioPeriodo ? vazio('grafico', 'Sem lançamentos neste período.', '/corridas/nova', 'Nova corrida') : `
      <section class="bloco">
        <div class="trio">
          <div><span>Receita</span><strong class="pos">${F.brl(t.receita)}</strong></div>
          <div><span>Despesas</span><strong class="neg">${F.brl(t.despesas)}</strong></div>
          <div><span>Lucro líquido</span><strong>${F.brl(t.lucro)}</strong></div>
        </div>
      </section>
      ${t.despesas ? `<section class="bloco"><h2 class="bloco-titulo">Despesas por categoria</h2>${htmlRosca(t)}</section>` : ''}
      ${t.nCorridas ? `<section class="bloco"><h2 class="bloco-titulo">Receita por plataforma</h2>${htmlBarras(t)}</section>` : ''}
      <section class="bloco"><h2 class="bloco-titulo">Detalhes</h2><div class="linhas">
        <div><span>Receita bruta</span><strong>${F.brl(t.bruto)}</strong></div>
        <div><span>Taxas</span><strong>-${F.brl(t.taxas)}</strong></div>
        <div><span>Valores adicionais (pedágio)</span><strong>${F.brl(t.adicionais)}</strong></div>
        ${t.outrasReceitas ? `<div><span>Contas recebidas</span><strong>${F.brl(t.outrasReceitas)}</strong></div>` : ''}
        <div><span>Despesas</span><strong>-${F.brl(t.despesas)}</strong></div>
        <div class="destaque"><span>Lucro líquido</span><strong>${F.brl(t.lucro)}</strong></div>
        ${t.aReceber ? `<div><span>Parte ainda a receber</span><strong>${F.brl(t.aReceber)}</strong></div>` : ''}
        <div><span>Corridas realizadas</span><strong>${t.nCorridas}</strong></div>
        <div><span>Média por corrida</span><strong>${F.brl(t.ticket)}</strong></div>
        <div><span>Lucro médio por dia trabalhado</span><strong>${F.brl(t.mediaDia)}</strong></div>
      </div></section>`}`;
  },
  montar(v) {
    ligarPeriodo(v, filtroRelatorio.periodo);
    const rotulo = v.querySelector('#rosca-rotulo');
    if (!rotulo) return;
    const valor = v.querySelector('#rosca-valor');
    const padrao = [rotulo.textContent, valor.textContent];
    v.querySelectorAll('.fatia').forEach((f) => {
      const mostrar = () => { rotulo.textContent = f.dataset.rotulo; valor.textContent = f.dataset.valor; };
      const esconder = () => { [rotulo.textContent, valor.textContent] = padrao; };
      f.addEventListener('mouseenter', mostrar); f.addEventListener('focus', mostrar); f.addEventListener('click', mostrar);
      f.addEventListener('mouseleave', esconder); f.addEventListener('blur', esconder);
    });
  },
});
