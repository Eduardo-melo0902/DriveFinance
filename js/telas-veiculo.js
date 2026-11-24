/* Tela "Meu Veículo": junta o que antes eram 4 telas (Veículos, Saúde do Veículo,
   Manutenção e Documentos). Um serviço registrado aqui faz as duas coisas:
   atualiza a saúde do veículo (próxima troca de óleo etc.) e entra nas despesas. */
const TIPOS_SERVICO = ['Troca de óleo', 'Revisão', 'Rodízio de pneus', 'Alinhamento e balanceamento', 'Freios', 'Outros'];
const km = (n) => `${Number(n).toLocaleString('pt-BR')} km`;
const DOCS_DO_VEICULO = ['Seguro', 'IPVA', 'Licenciamento']; // aparecem mesmo sem cadastro, para lembrar

/* ---------- Meu Veículo (tela principal) ---------- */
tela('/veiculo', {
  titulo: 'Meu Veículo', voltar: '/menu', acao: { rota: '/manutencao/nova', rotulo: 'Registrar serviço' },
  render() {
    const d = Store.d, hoje = F.hojeISO();
    const v = F.veiculoPrincipal(d);
    const outros = d.veiculos.filter((x) => x !== v);

    const cartao = v ? `<section class="bloco veiculo-cartao">
        <div class="veiculo-topo">
          <span class="item-icone">${icone('carro')}</span>
          <span class="item-corpo"><span class="item-titulo">${esc(v.modelo)}</span>
            <span class="item-sub">${[v.placa && `Placa ${esc(v.placa)}`, v.ano && `ano ${esc(v.ano)}`].filter(Boolean).join(', ') || 'Sem placa cadastrada'}</span></span>
          <a class="topo-link" href="#/veiculos/${v.id}" aria-label="Editar ${esc(v.modelo)}">${icone('editar')}</a>
        </div>
        <form class="km-linha" id="form-km" novalidate>
          <label class="campo"><span>Quilometragem atual</span>${entradaKm('km', v.km)}</label>
          <button class="botao" type="submit">Atualizar KM</button>
        </form>
        ${outros.length ? `<div class="veiculo-troca"><span>Trocar para:</span>${outros.map((o) => `<button type="button" class="botao claro" data-principal="${o.id}">${esc(o.modelo)}</button>`).join('')}</div>` : ''}
        <a class="link-simples" href="#/veiculos/novo">${icone('mais')}Adicionar outro veículo</a>
      </section>` : vazio('carro', 'Cadastre seu veículo para acompanhar quilometragem, manutenção e documentos.', '/veiculos/novo', 'Cadastrar veículo');

    // Saúde: cada serviço mostra quando foi feito e quando é o próximo. Tocar = registrar que fez.
    const saude = F.saudeVeiculo(d, hoje).filter((i) => !DOCS_DO_VEICULO.includes(i.nome));
    const linhaSaude = (i) => {
      const ultimo = d.manutencoes.filter((m) => m.tipo === i.tipo).sort((a, b) => (a.data < b.data ? 1 : -1))[0];
      const proxima = [i.data && F.dataBR(i.data), i.kmAlvo && km(i.kmAlvo)].filter(Boolean).join(' ou ');
      return `<a class="item" href="#${i.rota}">
        <span class="item-icone">${icone('chave')}</span>
        <span class="item-corpo"><span class="item-titulo">${esc(i.nome)}</span>
          <span class="item-sub">${ultimo ? `Feito em ${F.dataBR(ultimo.data)}${ultimo.km ? `, ${km(ultimo.km)}` : ''}` : 'Nenhum registro'}</span>
          ${proxima ? `<span class="item-sub">Próximo: ${proxima}</span>` : ''}</span>
        ${selo(i.status)}${icone('dir', 'seta')}
      </a>`;
    };

    // Documentos: os cadastrados + Seguro/IPVA/Licenciamento que ainda faltam.
    const faltando = DOCS_DO_VEICULO.filter((n) => !d.documentos.some((x) => x.nome === n));
    const linhaDoc = (x) => `<a class="item" href="#/documentos/${x.id}">
        <span class="item-icone">${icone('doc')}</span>
        <span class="item-corpo"><span class="item-titulo">${esc(x.nome)}</span><span class="item-sub">Vence em ${F.dataBR(x.validade)}</span></span>
        ${selo(F.statusValidade(x.validade, hoje))}${icone('dir', 'seta')}
      </a>`;
    const linhaFaltando = (n) => `<a class="item" href="#/documentos/novo?nome=${encodeURIComponent(n)}&grupo=veiculo">
        <span class="item-icone">${icone('doc')}</span>
        <span class="item-corpo"><span class="item-titulo">${esc(n)}</span><span class="item-sub">Toque para cadastrar</span></span>
        ${selo('não cadastrado')}${icone('dir', 'seta')}
      </a>`;
    const docsGrupo = (g) => d.documentos.filter((x) => x.grupo === g).sort((a, b) => (a.validade > b.validade ? 1 : -1));
    const docsVeiculo = docsGrupo('veiculo').map(linhaDoc).concat(faltando.map(linhaFaltando));
    const docsMotorista = docsGrupo('motorista').map(linhaDoc);

    const historico = d.manutencoes.slice().sort((a, b) => (a.data < b.data ? 1 : -1));
    const linhaHist = (m) => {
      const abertas = (m.parcelas || []).filter((p) => !p.paga).length;
      return `<a class="item" href="#/manutencao/${m.id}">
        <span class="item-icone cat-manutencao">${icone('chave')}</span>
        <span class="item-corpo"><span class="item-titulo">${esc(m.tipo)}</span><span class="item-sub">${F.dataBR(m.data)}${m.km ? `, ${km(m.km)}` : ''}</span>${abertas ? `<span class="item-sub">${abertas} de ${m.parcelas.length} parcelas em aberto</span>` : ''}</span>
        <span class="item-valor">${m.valor ? F.brl(m.valor) : 'Sem custo'}</span>${icone('dir', 'seta')}
      </a>`;
    };

    return `${cartao}
      <h2 class="secao-titulo">Saúde e manutenção</h2>
      <div class="lista lista-saude">${saude.map(linhaSaude).join('')}</div>
      <a class="botao largo" href="#/manutencao/nova">${icone('mais')}Registrar serviço</a>
      <p class="ajuda">Serviço registrado aqui atualiza a saúde do veículo e, se tiver valor, entra nas despesas. Você é avisado 1 mês antes do vencimento por data e ao completar 90% dos km (troca a cada 10.000 km avisa aos 9.000 km).</p>
      <h2 class="secao-titulo">Documentos do veículo</h2>
      <div class="lista">${docsVeiculo.join('')}</div>
      ${docsMotorista.length ? `<h2 class="secao-titulo">Documentos do motorista</h2><div class="lista">${docsMotorista.join('')}</div>` : ''}
      <a class="botao claro largo" href="#/documentos/novo">${icone('mais')}Novo documento</a>
      ${historico.length ? `<h2 class="secao-titulo">Histórico de serviços</h2><div class="lista">${historico.map(linhaHist).join('')}</div>` : ''}`;
  },
  montar(v) {
    const formKm = v.querySelector('#form-km');
    if (formKm) formKm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const veic = F.veiculoPrincipal(Store.d);
      const novo = Number(formKm.elements.km.value);
      if (!(novo >= 0)) return avisar('Digite a quilometragem em números.');
      if (novo < (veic.km || 0) && !await confirmar(`O KM novo (${km(novo)}) é menor que o atual (${km(veic.km)}). Corrigir mesmo assim?`, 'Corrigir')) return;
      veic.km = novo;
      Store.salvar();
      avisar('Quilometragem atualizada');
      recarregar();
    });
    v.querySelectorAll('[data-principal]').forEach((b) => b.addEventListener('click', () => {
      Store.d.veiculos.forEach((o) => { o.principal = o.id === b.dataset.principal; });
      Store.salvar();
      avisar('Veículo trocado');
      recarregar();
    }));
  },
});

/* ---------- Cadastro de veículo ---------- */
function formVeiculo(x) {
  return `<form class="form" novalidate>
    ${campo('Modelo', entrada('modelo', x ? x.modelo : '', 'placeholder="Ex.: Corolla Cross" autocomplete="off" required'))}
    <div class="duas">
      ${campo('Placa', entrada('placa', x ? x.placa : '', 'placeholder="ABC-1D23" autocomplete="off" style="text-transform:uppercase"'))}
      ${campo('Ano', `<input type="number" inputmode="numeric" name="ano" min="1950" max="2100" value="${esc(x ? x.ano : '')}">`)}
    </div>
    ${campo('Quilometragem atual', entradaKm('km', x && x.km))}
    <label class="opcao-linha"><input type="checkbox" name="principal" ${!x && !Store.d.veiculos.length || (x && x.principal) ? 'checked' : ''}>Veículo principal</label>
    <button class="botao largo" type="submit">Salvar</button>
    ${x ? botaoExcluir('Excluir veículo') : ''}
  </form>`;
}
function montarFormVeiculo(v, x) {
  const form = v.querySelector('form');
  aoEnviar(v, (d) => {
    if (!d.modelo.trim()) return mostrarErro(form, 'Informe o modelo do veículo.');
    const principal = !!d.principal || !Store.d.veiculos.some((o) => o.principal && (!x || o.id !== x.id));
    if (principal) Store.d.veiculos.forEach((o) => { o.principal = false; }); // só um pode ser o principal
    const campos = { modelo: d.modelo.trim(), placa: d.placa.trim().toUpperCase(), ano: d.ano, km: Number(d.km) || 0, principal };
    if (x) Store.atualizar('veiculos', x.id, campos); else Store.inserir('veiculos', campos);
    avisar('Veículo salvo');
    irPara('/veiculo');
  });
  if (x) ligarExcluir(v, `Excluir ${x.modelo}?`, () => {
    Store.remover('veiculos', x.id);
    if (x.principal && Store.d.veiculos[0]) { Store.d.veiculos[0].principal = true; Store.salvar(); }
    avisar('Veículo excluído');
    irPara('/veiculo');
  });
}

tela('/veiculos/novo', { titulo: 'Novo Veículo', voltar: '/veiculo', semAbas: true, render: () => formVeiculo(null), montar: (v) => montarFormVeiculo(v, null) });
tela('/veiculos/:id', {
  titulo: 'Editar Veículo', voltar: '/veiculo', semAbas: true,
  render(p) { const x = Store.achar('veiculos', p.id); return x ? formVeiculo(x) : vazio('carro', 'Este veículo não existe mais.', '/veiculo', 'Meu veículo'); },
  montar(v, p) { const x = Store.achar('veiculos', p.id); if (x) montarFormVeiculo(v, x); },
});

/* ---------- Registrar serviço (troca de óleo, rodízio, revisão...) ---------- */
function formManutencao(x, q) {
  const hoje = F.hojeISO();
  const tipoAtual = x ? x.tipo : TIPOS_SERVICO.includes(q && q.tipo) ? q.tipo : TIPOS_SERVICO[0];
  const n = x ? (x.parcelas || []).length || 1 : 1;
  // Serviço novo: o KM já vem com o KM atual do carro (é o que faz a saúde do veículo atualizar).
  const veic = F.veiculoPrincipal(Store.d);
  const kmServ = x ? x.km : veic ? veic.km : '';
  return `<form class="form" novalidate>
    ${campo('Tipo de serviço', selecao('tipo', TIPOS_SERVICO, tipoAtual))}
    ${campo('Descrição', entrada('descricao', x ? x.descricao : '', 'placeholder="Opcional" autocomplete="off"'))}
    <div class="duas">
      ${campo('Data', entradaData('data', x ? x.data : hoje, 'required'))}
      ${campo('KM no serviço', entradaKm('km', kmServ))}
    </div>
    ${campo('Valor pago', entradaDinheiro('valor', x ? x.valor : 0), 'Foi de graça? Deixe R$ 0,00. Aí não entra nas despesas.')}
    <div class="duas" id="area-pagamento">
      ${campo('Pagamento', selecao('formaPagamento', ['Dinheiro', 'Débito', 'Crédito', 'Pix'], x ? x.formaPagamento : 'Pix'))}
      ${campo('Parcelas', `<input type="number" inputmode="numeric" name="nParcelas" min="1" max="24" value="${n}">`)}
    </div>
    <details class="mais" ${x && (x.proximaKm || x.proximaData || x.garantiaAte) ? 'open' : ''}>
      <summary>Próximo serviço e garantia</summary>
      <div>
        <div class="duas">
          ${campo('Próximo em KM', entradaKm('proximaKm', x && x.proximaKm))}
          ${campo('Próximo em data', entradaData('proximaData', x ? x.proximaData : ''))}
        </div>
        <p class="ajuda">Em troca de óleo e rodízio de pneus, sem próximo informado, o app considera 10.000 km depois do serviço.</p>
        ${campo('Garantia até', entradaData('garantiaAte', x ? x.garantiaAte : ''), 'Opcional. Útil para retorno em alinhamento e serviços com garantia.')}
      </div>
    </details>
    <button class="botao largo" type="submit">Salvar</button>
    ${x ? botaoExcluir('Excluir serviço') : ''}
  </form>`;
}

function montarFormManutencao(v, x) {
  const form = v.querySelector('form');
  // Sem valor, não tem por que escolher pagamento nem parcelas.
  const areaPag = v.querySelector('#area-pagamento');
  const ajustarPagamento = () => { areaPag.hidden = !centavosDe(form.elements.valor.value); };
  form.elements.valor.addEventListener('input', ajustarPagamento);
  ajustarPagamento();

  aoEnviar(v, (d) => {
    if (!d.data) return mostrarErro(form, 'Informe a data do serviço.');
    const n = d.valor ? Math.round(Number(d.nParcelas)) : 1;
    if (!(n >= 1 && n <= 24)) return mostrarErro(form, 'As parcelas precisam ficar entre 1 e 24.');

    const parcelas = d.valor ? gerarParcelas(d.valor, n, d.data) : [];
    parcelas.forEach((p) => {
      const antiga = x && (x.parcelas || []).find((a) => a.n === p.n);
      p.paga = antiga ? antiga.paga : n === 1; // à vista já nasce paga
    });
    const kmServ = Number(d.km) || 0;
    const v0 = F.veiculoPrincipal(Store.d);
    const campos = {
      veiculoId: x ? x.veiculoId : v0 ? v0.id : '', tipo: d.tipo, descricao: d.descricao.trim(), data: d.data, valor: d.valor,
      formaPagamento: d.formaPagamento, km: kmServ, proximaKm: Number(d.proximaKm) || 0, proximaData: d.proximaData, garantiaAte: d.garantiaAte, parcelas,
    };
    if (x) Store.atualizar('manutencoes', x.id, campos); else Store.inserir('manutencoes', campos);
    if (kmServ) { Store.registrarKm(kmServ); Store.salvar(); }
    avisar(d.valor ? 'Serviço salvo e lançado nas despesas' : 'Serviço salvo');
    irPara('/veiculo');
  });
  if (x) ligarExcluir(v, 'Excluir este serviço? Ele sai da saúde do veículo e das despesas.', () => { Store.remover('manutencoes', x.id); avisar('Serviço excluído'); irPara('/veiculo'); });
}

tela('/manutencao/nova', {
  titulo: (_, q) => (q && TIPOS_SERVICO.includes(q.tipo) && q.tipo !== 'Outros' ? `Registrar ${q.tipo.toLowerCase()}` : 'Registrar Serviço'),
  voltar: '/veiculo', semAbas: true,
  render: (_, q) => formManutencao(null, q),
  montar: (v) => montarFormManutencao(v, null),
});

tela('/manutencao/:id', {
  titulo: 'Serviço', voltar: '/veiculo', semAbas: true,
  render(p) {
    const x = Store.achar('manutencoes', p.id);
    if (!x) return vazio('chave', 'Este serviço não existe mais.', '/veiculo', 'Meu veículo');
    return `${x.parcelas.length > 1 ? `<section class="bloco"><h2 class="bloco-titulo">Parcelas</h2>
      ${x.parcelas.map((q) => `<label class="opcao-linha"><input type="checkbox" data-parcela="${q.n}" ${q.paga ? 'checked' : ''}>
        <span style="flex:1">${q.n}ª parcela, vence em ${F.dataBR(q.data)}</span><strong>${F.brl(q.valor)}</strong></label>`).join('')}
      </section>` : ''}${formManutencao(x)}`;
  },
  montar(v, p) {
    const x = Store.achar('manutencoes', p.id);
    if (!x) return;
    montarFormManutencao(v, x);
    v.querySelectorAll('[data-parcela]').forEach((c) => c.addEventListener('change', () => {
      x.parcelas.find((q) => q.n === Number(c.dataset.parcela)).paga = c.checked;
      Store.salvar();
      avisar(c.checked ? 'Parcela marcada como paga' : 'Parcela marcada como em aberto');
    }));
  },
});

/* ---------- Documentos ---------- */
const NOMES_DOC = ['CNH', 'Condutax', 'Alvará', 'CRLV', 'Licenciamento', 'Seguro', 'IPVA', 'IPem'];
function formDocumento(x, q) {
  const grupo = x ? x.grupo : q && q.grupo === 'veiculo' ? 'veiculo' : 'motorista';
  return `<form class="form" novalidate>
    ${campo('Documento', entrada('nome', x ? x.nome : (q && q.nome) || '', 'list="nomes-doc" autocomplete="off" required'))}
    <datalist id="nomes-doc">${NOMES_DOC.map((n) => `<option value="${n}">`).join('')}</datalist>
    ${campo('Pertence a', selecao('grupo', [['motorista', 'Motorista'], ['veiculo', 'Veículo']], grupo))}
    ${campo('Validade', entradaData('validade', x ? x.validade : '', 'required'))}
    ${campo('Número', entrada('numero', x ? x.numero : '', 'placeholder="Opcional" autocomplete="off"'))}
    ${campo('Observação', `<textarea name="observacao">${esc(x ? x.observacao : '')}</textarea>`)}
    <button class="botao largo" type="submit">Salvar</button>
    ${x ? botaoExcluir('Excluir documento') : ''}
  </form>`;
}
function montarFormDocumento(v, x) {
  const form = v.querySelector('form');
  aoEnviar(v, (d) => {
    if (!d.nome.trim()) return mostrarErro(form, 'Informe o nome do documento.');
    if (!d.validade) return mostrarErro(form, 'Informe a validade do documento.');
    const campos = { nome: d.nome.trim(), grupo: d.grupo, validade: d.validade, numero: d.numero.trim(), observacao: d.observacao.trim() };
    if (x) Store.atualizar('documentos', x.id, campos); else Store.inserir('documentos', campos);
    avisar('Documento salvo');
    irPara('/veiculo');
  });
  if (x) ligarExcluir(v, `Excluir ${x.nome}?`, () => { Store.remover('documentos', x.id); avisar('Documento excluído'); irPara('/veiculo'); });
}

tela('/documentos/novo', { titulo: 'Novo Documento', voltar: '/veiculo', semAbas: true, render: (_, q) => formDocumento(null, q), montar: (v) => montarFormDocumento(v, null) });
tela('/documentos/:id', {
  titulo: 'Editar Documento', voltar: '/veiculo', semAbas: true,
  render(p) { const x = Store.achar('documentos', p.id); return x ? formDocumento(x) : vazio('doc', 'Este documento não existe mais.', '/veiculo', 'Meu veículo'); },
  montar(v, p) { const x = Store.achar('documentos', p.id); if (x) montarFormDocumento(v, x); },
});

/* Endereços antigos (atalhos salvos, avisos) levam para a tela nova. */
['/saude', '/manutencao', '/documentos', '/veiculos'].forEach((rota) => tela(rota, {
  titulo: 'Meu Veículo', render: () => { setTimeout(() => location.replace('#/veiculo')); return ''; },
}));
