/* Telas: Contas a Receber e Clientes. */
const filtroContas = { aba: 'pendentes', tipo: '', prazo: '' };
const TIPOS_CLIENTE = [['particular', 'Particular'], ['empresa', 'Empresa']];
const seloTipo = (t) => `<span class="selo ${t === 'empresa' ? 'azul' : 'bom'}">${t === 'empresa' ? 'Empresa' : 'Particular'}</span>`;

function formConta(x) {
  const hoje = F.hojeISO();
  return `<form class="form" novalidate>
    ${campo('Cliente', entrada('cliente', x ? x.cliente : '', 'list="lista-clientes" autocomplete="off" required'))}
    <datalist id="lista-clientes">${Store.d.clientes.map((c) => `<option value="${esc(c.nome)}">`).join('')}</datalist>
    ${campo('Tipo de cliente', selecao('tipo', TIPOS_CLIENTE, x ? x.tipo : 'particular'))}
    ${campo('Descrição', entrada('descricao', x ? x.descricao : '', 'placeholder="Opcional" autocomplete="off"'))}
    <div class="duas">
      ${campo('Valor', entradaDinheiro('valor', x ? x.valor : 0))}
      ${campo('Vencimento', entradaData('vencimento', x ? x.vencimento : F.somarDias(hoje, 7), 'required'))}
    </div>
    <button class="botao largo" type="submit">Salvar</button>
    ${x ? `<button type="button" class="botao ${x.recebidaEm ? 'claro' : 'verde'} largo" id="marcar">${x.recebidaEm ? 'Voltar para pendente' : 'Marcar como recebida'}</button>` : ''}
    ${x && !x.corridaId ? botaoExcluir('Excluir conta') : ''}
  </form>`;
}

function montarFormConta(v, x) {
  const form = v.querySelector('form');
  aoEnviar(v, (d) => {
    if (!d.cliente.trim()) return mostrarErro(form, 'Informe o nome do cliente.');
    if (d.valor <= 0) return mostrarErro(form, 'Informe o valor da conta.');
    if (!d.vencimento) return mostrarErro(form, 'Informe o vencimento.');
    const campos = { cliente: d.cliente.trim(), tipo: d.tipo, descricao: d.descricao.trim(), valor: d.valor, vencimento: d.vencimento };
    if (x) Store.atualizar('contas', x.id, campos);
    else Store.inserir('contas', Object.assign(campos, { corridaId: '', clienteId: '', recebidaEm: '' }));
    avisar('Conta salva');
    irPara('/receber');
  });
  if (!x) return;
  v.querySelector('#marcar').addEventListener('click', () => {
    const recebendo = !x.recebidaEm;
    Store.atualizar('contas', x.id, { recebidaEm: recebendo ? F.hojeISO() : '' });
    avisar(recebendo ? 'Conta recebida' : 'Conta voltou para pendente');
    irPara('/receber');
  });
  ligarExcluir(v, 'Excluir esta conta?', () => { Store.remover('contas', x.id); avisar('Conta excluída'); irPara('/receber'); });
}

tela('/receber/nova', {
  titulo: 'Nova Conta', voltar: '/receber', semAbas: true,
  render: () => formConta(null),
  montar: (v) => montarFormConta(v, null),
});

tela('/receber', {
  titulo: 'Contas a Receber', voltar: '/menu', acao: { rota: '/receber/nova', rotulo: 'Nova conta' },
  render() {
    const f = filtroContas, hoje = F.hojeISO();
    const pendentes = f.aba === 'pendentes';
    const lista = Store.d.contas.filter((c) => {
      if (pendentes === !!c.recebidaEm) return false;
      if (f.tipo && c.tipo !== f.tipo) return false;
      const base = c.recebidaEm || c.vencimento;
      if (f.prazo === 'mes') { const p = F.intervalo('mes', hoje); return base >= p.inicio && base <= p.fim; }
      if (f.prazo === '30') return base >= F.somarDias(hoje, -30) && base <= F.somarDias(hoje, 30);
      return true;
    }).sort((a, b) => (a.vencimento > b.vencimento ? (pendentes ? 1 : -1) : pendentes ? -1 : 1));
    const total = lista.reduce((s, c) => s + c.valor, 0);
    return `
      <div class="segmento" id="abas-contas">
        <button type="button" data-aba="pendentes" aria-pressed="${pendentes}">Pendentes</button>
        <button type="button" data-aba="recebidas" aria-pressed="${!pendentes}">Recebidas</button>
      </div>
      <div class="duas">
        ${selecao('prazo', [['', 'Qualquer período'], ['mes', 'Este mês'], ['30', 'Últimos e próximos 30 dias']], f.prazo, 'aria-label="Filtrar por período" id="f-prazo"')}
        ${selecao('tipo', [['', 'Todos os clientes']].concat(TIPOS_CLIENTE), f.tipo, 'aria-label="Filtrar por tipo de cliente" id="f-tipo"')}
      </div>
      ${lista.length ? `<div class="resumo-linha"><span>${pendentes ? 'Total a receber' : 'Total recebido'}</span><span>${F.brl(total)}</span></div>
      <div class="lista">${lista.map((c) => `
        <a class="item" href="#/receber/${c.id}">
          <span class="item-corpo">
            <span class="item-titulo">${esc(c.cliente)}</span>
            <span class="item-sub">${F.brl(c.valor)}</span>
            <span class="item-sub">${c.recebidaEm ? `Recebida em ${F.dataBR(c.recebidaEm)}` : `Vencimento: ${F.dataBR(c.vencimento)}`}</span>
          </span>
          <span class="item-valor">${seloTipo(c.tipo)}<small style="margin-top:4px">${selo(F.statusConta(c, hoje))}</small></span>
          ${icone('dir', 'seta')}
        </a>`).join('')}</div>` : vazio('dinheiro', pendentes ? 'Nenhuma conta pendente.' : 'Nenhuma conta recebida.', pendentes ? '/receber/nova' : '', 'Nova conta')}
      ${lista.length ? `<a class="botao largo" href="#/receber/nova">${icone('mais')}Nova conta</a>` : ''}`;
  },
  montar(v) {
    v.querySelector('#abas-contas').addEventListener('click', (e) => {
      const b = e.target.closest('[data-aba]');
      if (b) { filtroContas.aba = b.dataset.aba; recarregar(); }
    });
    v.querySelector('#f-tipo').addEventListener('change', (e) => { filtroContas.tipo = e.target.value; recarregar(); });
    v.querySelector('#f-prazo').addEventListener('change', (e) => { filtroContas.prazo = e.target.value; recarregar(); });
  },
});

tela('/receber/:id', {
  titulo: 'Editar Conta', voltar: '/receber', semAbas: true,
  render(p) { const x = Store.achar('contas', p.id); return x ? formConta(x) : vazio('dinheiro', 'Esta conta não existe mais.', '/receber', 'Ver contas'); },
  montar(v, p) { const x = Store.achar('contas', p.id); if (x) montarFormConta(v, x); },
});

/* ---------- Clientes ---------- */
function formCliente(x) {
  return `<form class="form" novalidate>
    ${campo('Nome', entrada('nome', x ? x.nome : '', 'autocomplete="off" required'))}
    ${campo('Tipo', selecao('tipo', TIPOS_CLIENTE, x ? x.tipo : 'particular'))}
    ${campo('Telefone', `<input type="tel" name="telefone" value="${esc(x ? x.telefone : '')}" placeholder="(11) 90000-0000">`)}
    ${campo('E-mail', `<input type="email" name="email" value="${esc(x ? x.email : '')}">`)}
    <button class="botao largo" type="submit">Salvar</button>
    ${x ? botaoExcluir('Excluir cliente') : ''}
  </form>`;
}
function montarFormCliente(v, x) {
  const form = v.querySelector('form');
  aoEnviar(v, (d) => {
    if (!d.nome.trim()) return mostrarErro(form, 'Informe o nome do cliente.');
    const campos = { nome: d.nome.trim(), tipo: d.tipo, telefone: d.telefone.trim(), email: d.email.trim() };
    if (x) Store.atualizar('clientes', x.id, campos); else Store.inserir('clientes', campos);
    avisar('Cliente salvo');
    irPara('/clientes');
  });
  if (x) ligarExcluir(v, `Excluir ${x.nome}? As corridas dele continuam salvas.`, () => { Store.remover('clientes', x.id); avisar('Cliente excluído'); irPara('/clientes'); });
}

tela('/clientes/novo', {
  titulo: 'Novo Cliente', voltar: '/clientes', semAbas: true,
  render: () => formCliente(null),
  montar: (v) => montarFormCliente(v, null),
});
tela('/clientes', {
  titulo: 'Clientes', voltar: '/menu', acao: { rota: '/clientes/novo', rotulo: 'Novo cliente' },
  render() {
    const lista = Store.d.clientes.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (!lista.length) return vazio('pessoas', 'Cadastre seus clientes frequentes para lançar corridas mais rápido.', '/clientes/novo', 'Novo cliente');
    return `<div class="lista">${lista.map((c) => `
      <a class="item" href="#/clientes/${c.id}">
        <span class="avatar">${esc(iniciais(c.nome))}</span>
        <span class="item-corpo"><span class="item-titulo">${esc(c.nome)}</span><span class="item-sub">${c.tipo === 'empresa' ? 'Empresa' : 'Cliente particular'}</span><span class="item-sub">${esc(c.telefone)}</span></span>
        ${icone('dir', 'seta')}
      </a>`).join('')}</div>`;
  },
});
tela('/clientes/:id', {
  titulo: 'Editar Cliente', voltar: '/clientes', semAbas: true,
  render(p) { const x = Store.achar('clientes', p.id); return x ? formCliente(x) : vazio('pessoas', 'Este cliente não existe mais.', '/clientes', 'Ver clientes'); },
  montar(v, p) { const x = Store.achar('clientes', p.id); if (x) montarFormCliente(v, x); },
});
