/* Telas: Início, Notificações e Fechamento do dia. */
const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

function dataPorExtenso(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${DIAS_SEMANA[F.diaSemana(iso)]}, ${d} de ${MESES[m - 1]}`;
}

tela('/', {
  titulo: 'Início', marca: true,
  render() {
    const d = Store.d, hoje = F.hojeISO();
    const m = F.metaDoDia(d, hoje);
    const sem = F.intervalo('semana', hoje);
    const t = F.totais(d, sem.inicio, sem.fim);
    const semMeta = !d.meta.mensal;
    const posicao = Math.min(m.pct, 100);

    let rodape;
    if (semMeta) rodape = '<a href="#/meta"><strong>Defina sua meta mensal</strong></a>';
    else if (!m.trabalhaHoje) rodape = '<span>Hoje é folga: nenhuma meta para hoje</span>';
    else if (m.pct >= 100) rodape = `<span>Meta de hoje batida</span><strong>${m.pct}%</strong>`;
    else rodape = `<span>Faltam ${F.brl(Math.max(0, m.valor - m.lucroHoje))} hoje</span><strong>${m.pct}%</strong>`;

    return `
      <section class="heroi" aria-label="Resultado de hoje">
        <p class="heroi-data">${dataPorExtenso(hoje)}</p>
        <div class="heroi-linha">
          <div><span class="heroi-rotulo">Lucro do dia</span><strong class="heroi-lucro">${F.brl(m.lucroHoje)}</strong></div>
          <div class="heroi-dir"><span class="heroi-rotulo">Meta diária</span><strong class="heroi-meta">${F.brl(m.valor)}</strong></div>
        </div>
        <div class="estrada" id="estrada" data-pos="${posicao}" role="img" aria-label="${m.pct}% da meta de hoje">
          <div class="estrada-feito"></div><div class="estrada-faixa"></div>
          <div class="estrada-carro">${icone('carro')}</div>
        </div>
        <div class="estrada-info">${rodape}</div>
      </section>

      ${d.exemplo ? `<div class="faixa-aviso"><span>Estes são dados de exemplo.</span><button type="button" id="zerar-exemplo">Começar do zero</button></div>` : ''}

      <div class="atalhos">
        <a class="botao verde" href="#/corridas/nova">${icone('mais')}Nova corrida</a>
        <a class="botao vermelho" href="#/despesas/nova">${icone('menos')}Nova despesa</a>
      </div>

      <section class="bloco">
        <h2 class="bloco-titulo">Resumo da semana</h2>
        <div class="trio">
          <div><span>Receita</span><strong>${F.brl(t.receita)}</strong></div>
          <div><span>Despesas</span><strong>${F.brl(t.despesas)}</strong></div>
          <div><span>Lucro líquido</span><strong class="${t.lucro < 0 ? 'neg' : 'pos'}">${F.brl(t.lucro)}</strong></div>
        </div>
      </section>

      ${d.iaFechado ? '' : `<div class="card-ia">
        <a href="#/ia"><span class="bola">${icone('conversa')}</span><span><strong>Driver IA</strong><p>Pergunte como está seu mês, sua meta ou seus gastos.</p></span></a>
        <button type="button" class="fechar" id="fechar-ia" aria-label="Fechar Driver IA">${icone('x')}</button>
      </div>`}

      <a class="botao claro largo" href="#/fechamento">${icone('fechamento')}Fechar o dia</a>`;
  },
  montar(v) {
    // Depois que a tela aparece, o carrinho anda até a posição da meta.
    const e = v.querySelector('#estrada');
    requestAnimationFrame(() => requestAnimationFrame(() => e.style.setProperty('--pos', e.dataset.pos + '%')));

    const fechar = v.querySelector('#fechar-ia');
    if (fechar) fechar.addEventListener('click', () => { Store.d.iaFechado = true; Store.salvar(); recarregar(); });

    const zerar = v.querySelector('#zerar-exemplo');
    if (zerar) zerar.addEventListener('click', async () => {
      if (await confirmar('Apagar todos os dados de exemplo e começar com o app vazio?', 'Apagar exemplos', true)) {
        Store.zerar();
        avisar('Dados de exemplo apagados');
        irPara('/perfil');
      }
    });
  },
});

tela('/notificacoes', {
  titulo: 'Notificações', voltar: '/',
  render() {
    const lista = F.pendencias(Store.d, F.hojeISO());
    if (!lista.length) return vazio('sino', 'Nenhuma pendência. Contas, documentos e manutenções estão em dia.');
    return `<div class="lista">${lista.map((p) => `
      <a class="item" href="#${p.rota}">
        <span class="item-icone ${p.nivel === 'alto' ? 'cat-alimentacao' : 'cat-combustivel'}">${icone(p.nivel === 'alto' ? 'info' : 'sino')}</span>
        <span class="item-corpo"><span class="item-titulo">${esc(p.titulo)}</span><span class="item-sub">${esc(p.detalhe)}</span></span>
        ${icone('dir', 'seta')}
      </a>`).join('')}</div>`;
  },
});

tela('/fechamento', {
  titulo: 'Fechamento do dia', voltar: '/',
  render(_, q) {
    const d = Store.d, hoje = F.hojeISO(), dia = q.data || hoje;
    const t = F.totais(d, dia, dia);
    const fechado = d.fechamentos[dia];
    const porForma = {};
    t.corridasLista.forEach((c) => { porForma[c.formaPagamento] = (porForma[c.formaPagamento] || 0) + c.total; });
    const km = t.corridasLista.reduce((s, c) => s + (c.kmFinal && c.kmInicial ? Math.max(0, c.kmFinal - c.kmInicial) : 0), 0);
    const folga = d.meta.folgas.includes(dia);

    return `
      <div class="periodo-nav">
        <a href="#/fechamento?data=${F.somarDias(dia, -1)}" aria-label="Dia anterior" class="topo-botao">${icone('esq')}</a>
        <span>${dataPorExtenso(dia)}</span>
        ${dia < hoje ? `<a href="#/fechamento?data=${F.somarDias(dia, 1)}" aria-label="Próximo dia" class="topo-botao">${icone('dir')}</a>` : '<span></span>'}
      </div>
      ${fechado ? `<div class="info">${icone('info')}<span>Dia fechado com lucro de ${F.brl(fechado.lucro)}.${fechado.lucro !== t.lucro ? ` Depois disso os lançamentos mudaram: o lucro agora é ${F.brl(t.lucro)}.` : ''}</span></div>` : ''}
      <section class="bloco"><div class="linhas">
        <div><span>Corridas</span><strong>${t.nCorridas}</strong></div>
        <div><span>Receita bruta</span><strong>${F.brl(t.bruto)}</strong></div>
        <div><span>Taxas das plataformas</span><strong>-${F.brl(t.taxas)}</strong></div>
        <div><span>Pedágios recebidos</span><strong>${F.brl(t.adicionais)}</strong></div>
        <div><span>Despesas</span><strong>-${F.brl(t.despesas)}</strong></div>
        ${km ? `<div><span>Km rodados</span><strong>${km.toLocaleString('pt-BR')} km</strong></div>` : ''}
        <div class="destaque"><span>Lucro do dia</span><strong class="${t.lucro < 0 ? 'neg' : 'pos'}">${F.brl(t.lucro)}</strong></div>
        ${t.aReceber ? `<div><span>Ainda a receber</span><strong>${F.brl(t.aReceber)}</strong></div>` : ''}
      </div></section>
      ${Object.keys(porForma).length ? `<section class="bloco"><h2 class="bloco-titulo">Recebido por forma de pagamento</h2><div class="linhas">
        ${Object.entries(porForma).sort((a, b) => b[1] - a[1]).map(([f, v]) => `<div><span>${esc(f)}</span><strong>${F.brl(v)}</strong></div>`).join('')}
      </div></section>` : ''}
      <div class="botoes">
        <button type="button" class="botao largo ${fechado ? 'claro' : ''}" id="fechar-dia">${fechado ? 'Reabrir o dia' : 'Fechar o dia'}</button>
        ${t.nCorridas ? '' : `<button type="button" class="botao claro largo" id="folga">${folga ? 'Desmarcar folga' : 'Marcar como folga'}</button>`}
      </div>`;
  },
  montar(v, _, q) {
    const d = Store.d, dia = q.data || F.hojeISO();
    v.querySelector('#fechar-dia').addEventListener('click', () => {
      if (d.fechamentos[dia]) { delete d.fechamentos[dia]; avisar('Dia reaberto'); }
      else { d.fechamentos[dia] = { lucro: F.totais(d, dia, dia).lucro, em: new Date().toISOString() }; avisar('Dia fechado'); }
      Store.salvar(); recarregar();
    });
    const folga = v.querySelector('#folga');
    if (folga) folga.addEventListener('click', () => {
      const i = d.meta.folgas.indexOf(dia);
      if (i >= 0) d.meta.folgas.splice(i, 1); else d.meta.folgas.push(dia);
      Store.salvar();
      avisar(i >= 0 ? 'Folga desmarcada' : 'Folga marcada: a meta foi redistribuída');
      recarregar();
    });
  },
});
