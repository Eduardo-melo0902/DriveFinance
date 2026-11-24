/* Telas: Corridas (lista, formulário, detalhe). Os recibos ficam em telas-recibos.js. */
const filtroCorridas = { periodo: novoPeriodo('dia'), plataforma: '' };
const seloPlataforma = (id) => `<span class="pf pf-${esc(id)}">${conteudoPlataforma(plataformaDe(id))}</span>`;

tela('/corridas/nova', {
  titulo: 'Nova Corrida', voltar: '/corridas', semAbas: true,
  render: (_, q) => formCorrida(null, q),
  montar: (v) => montarFormCorrida(v, null),
});

tela('/corridas', {
  titulo: 'Corridas', voltar: '/', acao: { rota: '/corridas/nova', rotulo: 'Nova corrida' },
  render() {
    const f = filtroCorridas;
    const { inicio, fim } = F.intervalo(f.periodo.tipo, f.periodo.ref);
    const lista = Store.d.corridas
      .filter((c) => c.data >= inicio && c.data <= fim && (!f.plataforma || c.plataforma === f.plataforma))
      .sort((a, b) => ((b.data + b.hora) > (a.data + a.hora) ? 1 : -1));
    const total = lista.reduce((s, c) => s + c.total, 0);
    const seletor = selecao('plataforma', [['', 'Todas as plataformas']].concat(Store.d.ordemPlataformas.map(plataformaDe).map((p) => [p.id, p.nome + (p.removida ? ' (retirada)' : '')])), f.plataforma, 'aria-label="Filtrar por plataforma" id="filtro-pf"');
    return `
      ${htmlPeriodo(f.periodo)}
      ${seletor}
      ${lista.length ? `<div class="resumo-linha"><span>${lista.length} ${lista.length === 1 ? 'corrida' : 'corridas'}</span><span>${F.brl(total)}</span></div>
      <div class="lista">${lista.slice(0, 300).map((c) => `
        <a class="item" href="#/corridas/${c.id}">
          ${seloPlataforma(c.plataforma)}
          <span class="item-corpo">
            <span class="item-titulo">${esc(c.clienteNome || c.destino || 'Corrida')}</span>
            <span class="item-sub">${F.dataBR(c.data)} às ${esc(c.hora)}</span>
          </span>
          <span class="item-valor">${F.brl(c.total)}</span>
          ${icone('dir', 'seta')}
        </a>`).join('')}</div>` : vazio('carro', 'Nenhuma corrida neste período.', '/corridas/nova', 'Nova corrida')}`;
  },
  montar(v) {
    ligarPeriodo(v, filtroCorridas.periodo);
    v.querySelector('#filtro-pf').addEventListener('change', (e) => { filtroCorridas.plataforma = e.target.value; recarregar(); });
  },
});

function formCorrida(c, q) {
  const d = Store.d, hoje = F.hojeISO();
  const agora = new Date();
  const pedida = q && q.plataforma && d.plataformas[q.plataforma] ? q.plataforma : '';
  const plataforma = c ? c.plataforma : pedida || (plataformasAtivas()[0] || plataformaDe('uber')).id;
  const modo = c ? c.modo : d.plataformas[plataforma].modo;
  const conta = c ? d.contas.find((x) => x.corridaId === c.id && !x.recebidaEm) : null;
  // Corrida antiga com forma que saiu da lista (ex.: "Use Táxi"): mantém a opção.
  const formas = c && !formasPagamento().includes(c.formaPagamento) ? formasPagamento().concat(c.formaPagamento) : formasPagamento();
  const clientes = [['', 'Sem cliente']].concat(d.clientes.map((x) => [x.id, x.nome]), [['__novo', 'Cadastrar novo cliente']]);
  return `<form class="form" novalidate>
    <div class="campo"><span>Plataforma</span>${htmlEscolhaPlataforma('plataforma', plataforma)}</div>
    <div class="duas">
      ${campo('Data', entradaData('data', c ? c.data : hoje, 'required'))}
      ${campo('Hora', entradaHora('hora', c ? c.hora : `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`, 'required'))}
    </div>
    ${campo('Cliente (opcional)', selecao('clienteId', clientes, c ? c.clienteId : ''))}
    <div id="novo-cliente" hidden>${campo('Nome do novo cliente', entrada('novoCliente', '', 'placeholder="Ex.: Ana Torres"'))}</div>
    ${campo('Origem', entrada('origem', c ? c.origem : '', 'placeholder="Opcional" autocomplete="off"'))}
    ${campo('Destino', entrada('destino', c ? c.destino : '', 'placeholder="Opcional" autocomplete="off"'))}
    <div class="duas">
      ${campo('Valor da corrida', entradaDinheiro('valor', c ? c.valorInformado : 0))}
      ${campo('Pedágio incluído', entradaDinheiro('pedagio', c ? c.pedagio : 0))}
    </div>
    <div id="area-modo">${campo('O valor digitado é', selecao('modo', [['liquido', 'Líquido (o que caiu para você)'], ['bruto', 'Bruto (valor cheio)']], modo))}</div>
    <div class="calculo" id="calculo" aria-live="polite"></div>
    ${campo('Forma de pagamento', selecao('formaPagamento', formas, c ? c.formaPagamento : formaDaPlataforma(plataforma)))}
    <label class="opcao-linha"><input type="checkbox" name="aReceber" ${conta ? 'checked' : ''}>Vou receber depois (Pix ou faturado)</label>
    <div id="area-vencimento" ${conta ? '' : 'hidden'}>${campo('Receber até', entradaData('vencimento', conta ? conta.vencimento : F.somarDias(hoje, 7)))}</div>
    <details class="mais" ${c && (c.kmInicial || c.observacao) ? 'open' : ''}>
      <summary>KM e observação</summary>
      <div>
        <div class="duas">
          ${campo('KM inicial', entradaKm('kmInicial', c && c.kmInicial))}
          ${campo('KM final', entradaKm('kmFinal', c && c.kmFinal))}
        </div>
        ${campo('Observação', `<textarea name="observacao">${esc(c ? c.observacao : '')}</textarea>`)}
      </div>
    </details>
    <button class="botao largo" type="submit">Salvar</button>
    ${c ? botaoExcluir('Excluir corrida') : ''}
  </form>`;
}

function montarFormCorrida(v, c) {
  const d = Store.d;
  const form = v.querySelector('form');
  const el = (nome) => form.elements[nome];
  const taxaAtual = (p) => (c && c.plataforma === p ? c.taxaAplicada : d.plataformas[p].taxa);

  function atualizarCalculo() {
    const dados = lerForm(form);
    const p = dados.plataforma;
    const taxa = taxaAtual(p);
    const r = F.calcCorrida({ valor: dados.valor, pedagio: dados.pedagio, taxa, modo: dados.modo });
    v.querySelector('#area-modo').hidden = !taxa; // sem taxa, bruto e líquido são iguais
    v.querySelector('#calculo').innerHTML = `
      <div><span>Valor bruto</span><span>${F.brl(r.bruto)}</span></div>
      <div><span>Taxa ${esc(nomePlataforma(p))} (${String(taxa).replace('.', ',')}%)</span><span>-${F.brl(r.taxa)}</span></div>
      ${r.pedagio ? `<div><span>Pedágio</span><span>${F.brl(r.pedagio)}</span></div>` : ''}
      <div class="total"><span>Você recebe</span><span>${F.brl(r.total)}</span></div>`;
  }

  ligarEscolhaPlataforma(form);
  form.addEventListener('input', atualizarCalculo);
  form.addEventListener('change', (e) => {
    if (e.target.name === 'plataforma') {
      const p = e.target.value;
      el('modo').value = d.plataformas[p].modo;
      el('formaPagamento').value = formaDaPlataforma(p);
      atualizarCalculo();
    }
    if (e.target.name === 'clienteId') v.querySelector('#novo-cliente').hidden = e.target.value !== '__novo';
    if (e.target.name === 'aReceber') v.querySelector('#area-vencimento').hidden = !e.target.checked;
  });
  atualizarCalculo();

  aoEnviar(v, async (dados) => {
    if (!dados.data || !dados.hora) return mostrarErro(form, 'Informe a data e a hora da corrida.');
    if (dados.valor <= 0) return mostrarErro(form, 'Informe o valor da corrida.');
    if (dados.pedagio > dados.valor) return mostrarErro(form, 'O pedágio não pode ser maior que o valor da corrida.');
    if (dados.clienteId === '__novo' && !dados.novoCliente.trim()) return mostrarErro(form, 'Digite o nome do novo cliente.');
    const kmI = Number(dados.kmInicial) || 0, kmF = Number(dados.kmFinal) || 0;
    if (kmI && kmF && kmF < kmI) return mostrarErro(form, 'O KM final precisa ser maior que o KM inicial.');
    if (dados.aReceber && !dados.vencimento) return mostrarErro(form, 'Informe até quando vai receber.');

    let cliente = d.clientes.find((x) => x.id === dados.clienteId) || null;
    if (dados.clienteId === '__novo') cliente = Store.inserir('clientes', { nome: dados.novoCliente.trim(), tipo: 'particular', telefone: '', email: '' });

    const taxa = taxaAtual(dados.plataforma);
    const modo = taxa ? dados.modo : 'bruto';
    const r = F.calcCorrida({ valor: dados.valor, pedagio: dados.pedagio, taxa, modo });
    const campos = {
      data: dados.data, hora: dados.hora, plataforma: dados.plataforma,
      clienteId: cliente ? cliente.id : '', clienteNome: cliente ? cliente.nome : '',
      origem: dados.origem.trim(), destino: dados.destino.trim(),
      valorInformado: dados.valor, modo, taxaAplicada: taxa,
      bruto: r.bruto, taxaValor: r.taxa, pedagio: r.pedagio, liquido: r.liquido, total: r.total,
      formaPagamento: dados.formaPagamento, kmInicial: kmI, kmFinal: kmF, observacao: dados.observacao.trim(),
    };
    const salva = c ? Store.atualizar('corridas', c.id, campos) : Store.inserir('corridas', campos);
    sincronizarConta(salva, dados, cliente);
    if (kmF) Store.registrarKm(kmF);
    Store.salvar();
    // Corrida nova: oferece o recibo logo ao terminar.
    if (!c && await oferecerRecibo(salva, 'Corrida salva! Quer gerar o recibo desta corrida?')) return;
    if (c) avisar('Corrida salva');
    irPara(`/corridas/${salva.id}`);
  });

  if (c) ligarExcluir(v, 'Excluir esta corrida? O valor sai dos seus relatórios.', () => {
    Store.d.contas = Store.d.contas.filter((x) => x.corridaId !== c.id);
    Store.remover('corridas', c.id);
    avisar('Corrida excluída');
    irPara('/corridas');
  });
}

/* Mantém a conta a receber ligada à corrida sempre certa. */
function sincronizarConta(c, dados, cliente) {
  const d = Store.d;
  const aberta = d.contas.find((x) => x.corridaId === c.id && !x.recebidaEm);
  if (dados.aReceber) {
    const campos = {
      corridaId: c.id, clienteId: cliente ? cliente.id : '', cliente: cliente ? cliente.nome : (c.destino || 'Corrida sem cliente'),
      tipo: cliente ? cliente.tipo : 'particular', valor: c.total, vencimento: dados.vencimento, recebidaEm: '',
      descricao: `Corrida de ${F.dataBR(c.data)}`,
    };
    if (aberta) Object.assign(aberta, campos); else Store.inserir('contas', campos);
  } else if (aberta) {
    d.contas = d.contas.filter((x) => x !== aberta);
  }
}

tela('/corridas/:id/editar', {
  titulo: 'Editar Corrida', semAbas: true,
  voltar: (p) => `/corridas/${p.id}`,
  render: (p) => formCorrida(Store.achar('corridas', p.id)),
  montar: (v, p) => montarFormCorrida(v, Store.achar('corridas', p.id)),
});

tela('/corridas/:id', {
  titulo: 'Corrida', voltar: '/corridas',
  render(p) {
    const c = Store.achar('corridas', p.id);
    if (!c) return vazio('carro', 'Esta corrida não existe mais.', '/corridas', 'Ver corridas');
    const recibo = Store.d.recibos.find((r) => r.corridaId === c.id);
    const conta = Store.d.contas.find((x) => x.corridaId === c.id);
    const trajeto = [c.origem, c.destino].filter(Boolean);
    return `
      <section class="bloco">
        <div class="resumo-linha">${seloPlataforma(c.plataforma)}<span>${F.dataBR(c.data)} às ${esc(c.hora)}</span></div>
        <div class="linhas" style="margin-top:8px">
          ${c.clienteNome ? `<div><span>Cliente</span><strong>${esc(c.clienteNome)}</strong></div>` : ''}
          ${trajeto.length ? `<div><span>Trajeto</span><strong>${trajeto.map(esc).join(' até ')}</strong></div>` : ''}
          <div><span>Valor bruto</span><strong>${F.brl(c.bruto)}</strong></div>
          <div><span>Taxa (${String(c.taxaAplicada).replace('.', ',')}%)</span><strong>-${F.brl(c.taxaValor)}</strong></div>
          ${c.pedagio ? `<div><span>Pedágio</span><strong>${F.brl(c.pedagio)}</strong></div>` : ''}
          <div class="destaque"><span>Você recebe</span><strong class="pos">${F.brl(c.total)}</strong></div>
          <div><span>Pagamento</span><strong>${esc(c.formaPagamento)}</strong></div>
          ${conta ? `<div><span>Recebimento</span><a href="#/receber/${conta.id}">${selo(F.statusConta(conta, F.hojeISO()))}</a></div>` : ''}
          ${c.kmFinal && c.kmInicial ? `<div><span>Percurso</span><strong>${(c.kmFinal - c.kmInicial).toLocaleString('pt-BR')} km</strong></div>` : ''}
          ${c.observacao ? `<div><span>Observação</span><strong>${esc(c.observacao)}</strong></div>` : ''}
        </div>
      </section>
      <div class="botoes">
        ${recibo ? `<a class="botao largo" href="#/recibos/${recibo.id}">${icone('recibo')}Ver recibo</a>`
          : `<button type="button" class="botao largo" id="gerar-recibo">${icone('recibo')}Gerar recibo</button>`}
        <a class="botao claro largo" href="#/corridas/${c.id}/editar">Editar corrida</a>
      </div>`;
  },
  montar(v, p) {
    const b = v.querySelector('#gerar-recibo');
    if (b) b.addEventListener('click', () => oferecerRecibo(Store.achar('corridas', p.id), 'Gerar o recibo desta corrida? Depois você pode editar tudo nele.'));
  },
});
