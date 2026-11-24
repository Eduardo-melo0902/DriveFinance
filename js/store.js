/* store.js — guarda e lê os dados no próprio aparelho (localStorage).
   localStorage é uma gavetinha do navegador: só aceita texto,
   por isso usamos JSON.stringify para guardar e JSON.parse para ler. */
const CHAVE_DADOS = 'driverFinance.dados';
const CHAVE_BACKUP = 'driverFinance.backup';

/* Plataformas que já vêm no app. Tudo pode ser editado na tela Plataformas.
   cor/corTexto = cores do botão; img = id de uma imagem em d.imagens (logo);
   forma = forma de pagamento que já vem escolhida; removida = o motorista tirou dos botões
   (continua guardada para as corridas antigas mostrarem o nome certo). */
const ORDEM_PADRAO_PF = ['uber', '99', 'pix', 'usetaxi', 'usetaxi2', 'credito', 'debito', 'particular'];
function plataformasPadrao() {
  const pf = (nome, cor, corTexto, taxa, modo, forma) => ({ nome, cor, corTexto, img: '', taxa, modo, forma: forma || nome, removida: false, padrao: true });
  return {
    uber: pf('Uber', '#000000', '#ffffff', 15, 'liquido'),
    99: pf('99', '#ffdd00', '#000000', 15, 'liquido'),
    pix: pf('Pix', '#32bcad', '#04302c', 0, 'bruto'),
    usetaxi: pf('Use Táxi 1', '#0f8a45', '#ffffff', 20, 'bruto'),
    usetaxi2: pf('Use Táxi 2', '#0b5e30', '#ffffff', 20, 'bruto'),
    credito: pf('Crédito', '#7a3fc4', '#ffffff', 0, 'bruto'),
    debito: pf('Débito', '#e5a100', '#2a1d00', 0, 'bruto'),
    particular: pf('Particular', '#0a5fe0', '#ffffff', 0, 'bruto', 'Dinheiro'),
  };
}

function dadosVazios() {
  return {
    versao: 1, exemplo: false,
    perfil: { nome: '', telefone: '', email: '', cpf: '', foto: '' },
    plataformas: plataformasPadrao(),
    // Ordem dos botões: as 3 primeiras aparecem direto na corrida, as outras ficam no "+".
    ordemPlataformas: ORDEM_PADRAO_PF.slice(),
    meta: { mensal: 0, diasSemana: [1, 2, 3, 4, 5], folgas: [], usarFeriados: true },
    corridas: [], despesas: [], clientes: [], contas: [], veiculos: [], manutencoes: [], documentos: [], recibos: [],
    proximoRecibo: 1, fechamentos: {},
    // Cabeçalho padrão dos recibos. Nome e telefone vazios = usar os do perfil.
    reciboModelo: { nome: '', telefone: '', slogan: 'Qualidade - Conforto - Compromisso', cidade: 'São Paulo', txtEsq: 'TÁXI', imgEsq: '', txtDir: '', imgDir: '' },
    imagens: {}, /* imagens dos recibos: { id: 'data:image/png;base64,...' } */
    backup: { auto: true, ultimo: '' }, iaFechado: false,
  };
}

const COLECOES = ['corridas', 'despesas', 'clientes', 'contas', 'veiculos', 'manutencoes', 'documentos', 'recibos'];
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* Gera dados realistas para a pessoa ver o app funcionando na primeira vez. */
function dadosExemplo() {
  const d = dadosVazios();
  const hoje = F.hojeISO();
  d.exemplo = true;
  d.perfil = { nome: 'Motorista Exemplo', telefone: '(11) 90000-0000', email: 'motorista@exemplo.com', cpf: '000.000.000-00', foto: '' };
  d.meta.mensal = 800000;

  // Sorteio com semente: gera sempre a mesma sequência de números.
  let semente = 20260922;
  const sorteio = () => {
    semente = (semente + 0x6D2B79F5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const entre = (a, b) => Math.floor(a + sorteio() * (b - a + 1));
  const escolher = (l) => l[Math.floor(sorteio() * l.length)];

  d.clientes = [
    ['Ana Torres', 'particular', '(11) 98765-4321'], ['João Silva', 'empresa', '(11) 91234-5678'],
    ['Maria Lima', 'particular', '(11) 99876-5432'], ['Carlos Ribeiro', 'empresa', '(11) 97654-3210'],
    ['Fernanda Pereira', 'particular', '(11) 98888-7766'],
  ].map(([nome, tipo, telefone]) => ({ id: novoId(), nome, tipo, telefone, email: '' }));

  const ROTAS = [
    ['Av. Brigadeiro Faria Lima, 123 - SP', 'Aeroporto de Congonhas - SP'], ['Av. Paulista, 900 - SP', 'Terminal Tietê - SP'],
    ['Rua Augusta, 1500 - SP', 'Shopping Ibirapuera - SP'], ['Vila Olímpia - SP', 'Aeroporto de Guarulhos - SP'],
    ['Pinheiros - SP', 'Hospital das Clínicas - SP'], ['Moema - SP', 'Av. Berrini, 1000 - SP'],
  ];
  let km = 56100;

  for (let i = 62; i >= 0; i--) {
    const dia = F.somarDias(hoje, -i);
    if (!F.ehDiaDeTrabalho(dia, d.meta) && i !== 0) continue;
    const n = i === 0 ? 4 : entre(6, 8);
    for (let j = 0; j < n; j++) {
      const r = sorteio();
      const plataforma = r < 0.35 ? 'usetaxi' : r < 0.6 ? 'uber' : r < 0.85 ? '99' : 'particular';
      const cfg = d.plataformas[plataforma];
      const pedagio = sorteio() < 0.15 ? 420 : 0;
      const valor = entre(3800, 11500) + pedagio;
      const conta = F.calcCorrida({ valor, pedagio, taxa: cfg.taxa, modo: cfg.modo });
      const [origem, destino] = escolher(ROTAS);
      const kmIni = km;
      km += entre(6, 24);
      const cliente = plataforma === 'particular' ? escolher(d.clientes) : null;
      const forma = plataforma === 'particular' ? escolher(['Dinheiro', 'Pix', 'Débito', 'Crédito']) : cfg.forma;
      d.corridas.push({
        id: novoId(), data: dia, hora: `${String(7 + j * 2).padStart(2, '0')}:${String(entre(0, 59)).padStart(2, '0')}`,
        plataforma, clienteId: cliente ? cliente.id : '', clienteNome: cliente ? cliente.nome : '',
        origem, destino, valorInformado: valor, modo: cfg.modo, taxaAplicada: cfg.taxa,
        bruto: conta.bruto, taxaValor: conta.taxa, pedagio: conta.pedagio, liquido: conta.liquido, total: conta.total,
        formaPagamento: forma, kmInicial: kmIni, kmFinal: km, observacao: '',
      });
    }
    if (F.diaSemana(dia) % 2 === 1) d.despesas.push({ id: novoId(), categoria: 'Combustível', data: dia, hora: '06:40', valor: entre(13000, 18000), formaPagamento: 'Débito', descricao: 'Abastecimento - Posto Ipiranga', litros: entre(26, 36), km });
    if (sorteio() < 0.5) d.despesas.push({ id: novoId(), categoria: 'Alimentação', data: dia, hora: '12:30', valor: entre(1800, 3800), formaPagamento: 'Pix', descricao: 'Almoço' });
    if (sorteio() < 0.3) d.despesas.push({ id: novoId(), categoria: 'Pedágio', data: dia, hora: '09:10', valor: entre(420, 1260), formaPagamento: 'Dinheiro', descricao: 'Pedágio' });
    if (F.diaSemana(dia) === 5) d.despesas.push({ id: novoId(), categoria: 'Lavagem', data: dia, hora: '18:00', valor: 2500, formaPagamento: 'Pix', descricao: 'Lavagem completa' });
    if (sorteio() < 0.05) d.despesas.push({ id: novoId(), categoria: 'Outros', data: dia, hora: '15:00', valor: entre(1500, 6000), formaPagamento: 'Dinheiro', descricao: 'Estacionamento' });
  }

  const emDias = (n) => F.somarDias(hoje, n);
  d.contas = [
    ['Cliente Particular', 'particular', 15000, 3, 'Corrida para o aeroporto'],
    ['Empresa ABC', 'empresa', 42000, 16, 'Serviços faturados'],
    ['Cliente Exemplo', 'particular', 18000, 21, 'Corrida executiva'],
    ['Transportes Lima', 'empresa', 26000, -4, 'Corridas de outubro'],
  ].map(([cliente, tipo, valor, dias, descricao]) => ({ id: novoId(), corridaId: '', clienteId: '', cliente, tipo, valor, vencimento: emDias(dias), recebidaEm: '', descricao }));

  d.veiculos = [
    { id: novoId(), modelo: 'Corolla Cross', placa: 'FDE-1A23', ano: '2024', km, principal: true },
    { id: novoId(), modelo: 'Compass', placa: 'GHI-4B56', ano: '2022', km: 41200, principal: false },
  ];
  const veiculoId = d.veiculos[0].id;
  const servico = (tipo, dias, valor, kmServ, proximaKm, proximaData, n, descricao) => {
    const data = emDias(dias);
    const parcelas = gerarParcelas(valor, Math.max(1, n), data);
    parcelas.forEach((p) => { p.paga = p.data <= hoje; });
    return { id: novoId(), veiculoId, tipo, data, descricao, valor, formaPagamento: n > 1 ? 'Crédito' : 'Pix', km: kmServ, proximaKm, proximaData, garantiaAte: '', parcelas };
  };
  d.manutencoes = [
    servico('Troca de óleo', -55, 32000, km - 4300, km + 5700, emDias(41), 1, 'Óleo sintético e filtro'),
    servico('Rodízio de pneus', -60, 18000, km - 9620, 0, '', 1, 'Rodízio e calibragem'),
    servico('Alinhamento e balanceamento', -120, 12000, km - 12000, km + 8000, '', 1, 'Alinhamento 3D'),
    servico('Revisão', -35, 96000, km - 2800, km + 7200, emDias(130), 3, 'Revisão dos 50.000 km'),
  ];

  d.documentos = [
    ['CNH', 'motorista', 640], ['Condutax', 'motorista', 220], ['Alvará', 'motorista', 180],
    ['CRLV', 'veiculo', 300], ['Licenciamento', 'veiculo', 200], ['Seguro', 'veiculo', 120],
    ['IPVA', 'veiculo', 150], ['IPem', 'veiculo', 18],
  ].map(([nome, grupo, dias]) => ({ id: novoId(), nome, grupo, validade: emDias(dias), numero: '', observacao: '' }));

  return d;
}

/* Recibos feitos antes do modelo novo: passa os dados para o formato atual. */
function reciboNoFormatoNovo(r, modelo) {
  const x = r.dados || {};
  if ('recebiDe' in x) return r;
  const placa = (String(x.veiculo || '').match(/placa\s+(.+)$/i) || [])[1] || '';
  return Object.assign({}, r, {
    dados: {
      nome: x.motorista || '', telefone: x.telefone || '', slogan: modelo.slogan, cidade: modelo.cidade,
      txtEsq: modelo.txtEsq, imgEsq: '', txtDir: modelo.txtDir, imgDir: '',
      titulo: 'RECIBO', placa, valor: x.valor || 0, recebiDe: x.cliente || '', importancia: F.extenso(x.valor || 0),
      itinerario: [x.origem, x.destino].filter(Boolean).join(' até '), data: x.data || '',
    },
  });
}

/* Backups antigos só tinham taxa e modo: completa cada plataforma com o visual padrão. */
function completarPlataformas(base, salvas) {
  const r = {};
  Object.keys(base).concat(Object.keys(salvas || {})).forEach((id) => {
    r[id] = Object.assign({ nome: id, cor: '#5b6b80', corTexto: '#ffffff', img: '', taxa: 0, modo: 'bruto', forma: 'Dinheiro', removida: false }, base[id], (salvas || {})[id]);
  });
  return r;
}

/* Divide um valor em parcelas mensais. Os centavos que sobram vão na primeira. */
function gerarParcelas(valor, quantidade, dataInicial) {
  const base = Math.floor(valor / quantidade), resto = valor - base * quantidade;
  const inicio = F.deISO(dataInicial);
  const lista = [];
  for (let i = 0; i < quantidade; i++) {
    const ultimoDia = new Date(inicio.getFullYear(), inicio.getMonth() + i + 1, 0).getDate();
    const data = new Date(inicio.getFullYear(), inicio.getMonth() + i, Math.min(inicio.getDate(), ultimoDia));
    lista.push({ n: i + 1, data: F.paraISO(data), valor: base + (i === 0 ? resto : 0), paga: false });
  }
  return lista;
}

const Store = {
  d: null,

  carregar() {
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem(CHAVE_DADOS)); } catch (e) { salvo = null; }
    this.d = salvo ? this.completar(salvo) : dadosExemplo();
    if (!salvo) this.salvar();
    this.backupAutomatico();
  },

  /* Se um backup antigo não tiver algum campo, usa o valor padrão. */
  completar(salvo) {
    const base = dadosVazios();
    const d = Object.assign(base, salvo, {
      perfil: Object.assign(base.perfil, salvo.perfil),
      plataformas: completarPlataformas(base.plataformas, salvo.plataformas),
      meta: Object.assign(base.meta, salvo.meta),
      backup: Object.assign(base.backup, salvo.backup),
      reciboModelo: Object.assign(base.reciboModelo, salvo.reciboModelo),
      imagens: Object.assign({}, salvo.imagens),
    });
    d.recibos = d.recibos.map((r) => reciboNoFormatoNovo(r, d.reciboModelo));
    // Ordem: só ids que existem, sem repetir, e qualquer plataforma esquecida vai pro fim.
    const ordem = (Array.isArray(salvo.ordemPlataformas) ? salvo.ordemPlataformas : ORDEM_PADRAO_PF).map(String);
    d.ordemPlataformas = [...new Set(ordem.concat(Object.keys(d.plataformas)))].filter((id) => d.plataformas[id]);
    return d;
  },

  /* Apaga imagens que nenhum recibo usa mais (para não lotar o aparelho). */
  limparImagens() {
    const usadas = new Set();
    const m = this.d.reciboModelo;
    [m.imgEsq, m.imgDir].concat(...this.d.recibos.map((r) => [r.dados.imgEsq, r.dados.imgDir])).forEach((i) => i && usadas.add(i));
    Object.values(this.d.plataformas).forEach((p) => p.img && usadas.add(p.img));
    Object.keys(this.d.imagens).forEach((id) => { if (!usadas.has(id)) delete this.d.imagens[id]; });
  },

  salvar() {
    try { localStorage.setItem(CHAVE_DADOS, JSON.stringify(this.d)); return true; }
    catch (e) { avisar('Não foi possível salvar: o armazenamento deste aparelho está cheio.'); return false; }
  },

  achar(colecao, id) { return this.d[colecao].find((x) => x.id === id) || null; },
  inserir(colecao, obj) { obj.id = obj.id || novoId(); this.d[colecao].push(obj); this.salvar(); return obj; },
  atualizar(colecao, id, campos) { const o = this.achar(colecao, id); Object.assign(o, campos); this.salvar(); return o; },
  remover(colecao, id) { this.d[colecao] = this.d[colecao].filter((x) => x.id !== id); this.salvar(); },

  /* Mantém a quilometragem do veículo principal sempre na maior já informada. */
  registrarKm(km) {
    const v = F.veiculoPrincipal(this.d);
    if (v && Number(km) > (v.km || 0)) v.km = Number(km);
  },

  /* ---------- Backup ---------- */
  guardarCopia() {
    this.d.backup.ultimo = new Date().toISOString();
    this.salvar();
    try { localStorage.setItem(CHAVE_BACKUP, JSON.stringify(this.d)); return true; }
    catch (e) { return false; }
  },
  backupAutomatico() {
    const { auto, ultimo } = this.d.backup;
    if (auto && (!ultimo || F.paraISO(new Date(ultimo)) !== F.hojeISO())) this.guardarCopia();
  },
  copiaDoAparelho() {
    try { return JSON.parse(localStorage.getItem(CHAVE_BACKUP)); } catch (e) { return null; }
  },

  /* Confere se um arquivo de backup é válido antes de trocar os dados. */
  valido(obj) {
    return !!obj && typeof obj === 'object' && obj.versao === 1 && COLECOES.every((c) => Array.isArray(obj[c]));
  },
  restaurar(obj) { this.d = this.completar(obj); this.salvar(); },

  zerar() {
    const backup = this.d.backup;
    this.d = dadosVazios();
    this.d.backup = backup;
    this.salvar();
  },
};
