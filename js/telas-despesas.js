/* Telas: Despesas (lista e formulário). */
const filtroDespesas = { periodo: novoPeriodo('mes'), categoria: '' };

function formDespesa(x) {
  const hoje = F.hojeISO(), agora = new Date();
  const atual = x ? x.categoria : 'Combustível';
  return `<form class="form" novalidate>
    <div class="campo"><span>Categoria</span>
      <div class="grade-cat">
        ${CATEGORIAS.map((c) => `<label class="cat"><input type="radio" name="categoria" value="${c.id}" ${c.id === atual ? 'checked' : ''}><span>${icone(c.icone)}${c.id}</span></label>`).join('')}
      </div></div>
    <div class="info" id="dica-manut" hidden>${icone('info')}<span>Troca de óleo, rodízio, revisão? Registre em <a href="#/manutencao/nova"><u>Meu Veículo</u></a>: lá entra nas despesas do mesmo jeito e ainda atualiza a saúde do veículo.</span></div>
    <div class="duas">
      ${campo('Data', entradaData('data', x ? x.data : hoje, 'required'))}
      ${campo('Hora', entradaHora('hora', x ? x.hora : `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`))}
    </div>
    ${campo('Descrição', entrada('descricao', x ? x.descricao : '', 'placeholder="Ex.: Abastecimento - Posto Ipiranga" autocomplete="off"'))}
    <div id="area-comb" class="duas">
      ${campo('Litros', `<input type="number" inputmode="decimal" min="0" step="0.01" name="litros" value="${esc(x && x.litros ? x.litros : '')}">`)}
      ${campo('KM no abastecimento', entradaKm('km', x && x.km))}
    </div>
    ${campo('Valor', entradaDinheiro('valor', x ? x.valor : 0))}
    ${campo('Forma de pagamento', selecao('formaPagamento', ['Dinheiro', 'Débito', 'Crédito', 'Pix'], x ? x.formaPagamento : 'Dinheiro'))}
    <button class="botao largo" type="submit">Salvar</button>
    ${x ? botaoExcluir('Excluir despesa') : ''}
  </form>`;
}

function montarFormDespesa(v, x) {
  const form = v.querySelector('form');
  const ajustar = () => {
    const c = form.elements.categoria.value;
    v.querySelector('#area-comb').hidden = c !== 'Combustível';
    v.querySelector('#dica-manut').hidden = c !== 'Manutenção';
  };
  form.addEventListener('change', ajustar);
  ajustar();

  aoEnviar(v, (d) => {
    if (!d.data) return mostrarErro(form, 'Informe a data da despesa.');
    if (d.valor <= 0) return mostrarErro(form, 'Informe o valor da despesa.');
    const comb = d.categoria === 'Combustível';
    const campos = {
      categoria: d.categoria, data: d.data, hora: d.hora, valor: d.valor, formaPagamento: d.formaPagamento,
      descricao: d.descricao.trim(), litros: comb ? Number(d.litros) || 0 : 0, km: comb ? Number(d.km) || 0 : 0,
    };
    if (x) Store.atualizar('despesas', x.id, campos); else Store.inserir('despesas', campos);
    if (campos.km) { Store.registrarKm(campos.km); Store.salvar(); }
    avisar('Despesa salva');
    irPara('/despesas');
  });
  if (x) ligarExcluir(v, 'Excluir esta despesa?', () => { Store.remover('despesas', x.id); avisar('Despesa excluída'); irPara('/despesas'); });
}

tela('/despesas/nova', {
  titulo: 'Nova Despesa', voltar: '/despesas', semAbas: true,
  render: () => formDespesa(null),
  montar: (v) => montarFormDespesa(v, null),
});

tela('/despesas', {
  titulo: 'Despesas', voltar: '/', acao: { rota: '/despesas/nova', rotulo: 'Nova despesa' },
  render() {
    const f = filtroDespesas;
    const { inicio, fim } = F.intervalo(f.periodo.tipo, f.periodo.ref);
    const lista = F.todasDespesas(Store.d)
      .filter((x) => x.data >= inicio && x.data <= fim && (!f.categoria || x.categoria === f.categoria))
      .sort((a, b) => (b.data + (b.hora || '') > a.data + (a.hora || '') ? 1 : -1));
    const total = lista.reduce((s, x) => s + x.valor, 0);
    const seletor = selecao('categoria', [['', 'Todas as categorias']].concat(CATEGORIAS.map((c) => c.id)), f.categoria, 'aria-label="Filtrar por categoria" id="filtro-cat"');
    return `
      ${htmlPeriodo(f.periodo)}
      ${seletor}
      ${lista.length ? `<div class="resumo-linha"><span>${lista.length} ${lista.length === 1 ? 'despesa' : 'despesas'}</span><span>${F.brl(total)}</span></div>
      <div class="lista">${lista.slice(0, 300).map((x) => {
        const c = categoria(x.categoria);
        const rota = x.manutencaoId ? `/manutencao/${x.manutencaoId}` : `/despesas/${x.id}`;
        return `<a class="item" href="#${rota}">
          <span class="item-icone ${c.classe}">${icone(c.icone)}</span>
          <span class="item-corpo"><span class="item-titulo">${esc(x.descricao || x.categoria)}</span><span class="item-sub">${esc(x.categoria)}, ${F.dataBR(x.data)}</span></span>
          <span class="item-valor">${F.brl(x.valor)}</span>${icone('dir', 'seta')}
        </a>`;
      }).join('')}</div>` : vazio('recibo', 'Nenhuma despesa neste período.', '/despesas/nova', 'Nova despesa')}`;
  },
  montar(v) {
    ligarPeriodo(v, filtroDespesas.periodo);
    v.querySelector('#filtro-cat').addEventListener('change', (e) => { filtroDespesas.categoria = e.target.value; recarregar(); });
  },
});

tela('/despesas/:id', {
  titulo: 'Editar Despesa', voltar: '/despesas', semAbas: true,
  render(p) { const x = Store.achar('despesas', p.id); return x ? formDespesa(x) : vazio('recibo', 'Esta despesa não existe mais.', '/despesas', 'Ver despesas'); },
  montar(v, p) { const x = Store.achar('despesas', p.id); if (x) montarFormDespesa(v, x); },
});
