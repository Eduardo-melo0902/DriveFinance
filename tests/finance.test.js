// Testes das regras financeiras. Para rodar: npm test
const test = require('node:test');
const assert = require('node:assert');
const F = require('../js/finance.js');
const IA = require('../js/ia.js');

const base = (extra) => Object.assign({
  meta: { mensal: 800000, diasSemana: [1, 2, 3, 4, 5], folgas: [], usarFeriados: true },
  corridas: [], despesas: [], manutencoes: [], contas: [], documentos: [], veiculos: [],
  plataformas: { uber: { nome: 'Uber' }, 99: { nome: '99' } },
}, extra);

const corrida = (data, total, plataforma = 'uber', extra = {}) => Object.assign(
  { id: data + total, data, plataforma, bruto: total, taxaValor: 0, pedagio: 0, total }, extra);

test('Use Táxi: exemplo do documento fecha em R$ 116,96', () => {
  const r = F.calcCorrida({ valor: 14515, pedagio: 420, taxa: 20, modo: 'bruto' });
  assert.deepStrictEqual(r, { bruto: 14095, taxa: 2819, pedagio: 420, liquido: 11276, total: 11696 });
});

test('Uber/99: lançar líquido reconstrói o bruto', () => {
  const r = F.calcCorrida({ valor: 8500, taxa: 15, modo: 'liquido' });
  assert.strictEqual(r.bruto, 10000);
  assert.strictEqual(r.taxa, 1500);
  assert.strictEqual(r.total, 8500);
});

test('Particular: sem taxa recebe tudo', () => {
  assert.strictEqual(F.calcCorrida({ valor: 12000, taxa: 0 }).total, 12000);
});

test('Pedágio maior que o valor e taxa absurda não quebram a conta', () => {
  assert.strictEqual(F.calcCorrida({ valor: 100, pedagio: 500, taxa: 20 }).total, 100);
  assert.ok(Number.isFinite(F.calcCorrida({ valor: 100, taxa: 100, modo: 'liquido' }).bruto));
});

test('Datas não voltam um dia e semana começa na segunda', () => {
  assert.strictEqual(F.paraISO(F.deISO('2026-11-09')), '2026-11-09');
  assert.strictEqual(F.inicioSemana('2026-11-15'), '2026-11-09');
  assert.strictEqual(F.fimMes('2028-02-10'), '2028-02-29');
});

test('Sexta-feira Santa de 2026 cai em 03/04', () => {
  assert.ok(F.feriados(2026).includes('2026-04-03'));
});

test('Meta: fim de semana, feriado e folga não geram meta', () => {
  const d = base();
  assert.strictEqual(F.ehDiaDeTrabalho('2026-11-14', d.meta), false); // sábado
  assert.strictEqual(F.ehDiaDeTrabalho('2026-11-20', d.meta), false); // Consciência Negra
  d.meta.folgas = ['2026-11-11'];
  assert.strictEqual(F.ehDiaDeTrabalho('2026-11-11', d.meta), false);
  assert.strictEqual(F.ehDiaDeTrabalho('2026-11-12', d.meta), true);
});

test('Meta: uma folga redistribui o valor pelos dias restantes', () => {
  const sem = F.metaDoDia(base(), '2026-11-09');
  const d = base(); d.meta.folgas = ['2026-11-11'];
  const com = F.metaDoDia(d, '2026-11-09');
  assert.strictEqual(com.restantes, sem.restantes - 1);
  assert.ok(com.valor > sem.valor);
  assert.strictEqual(com.valor, Math.round(800000 / com.restantes));
});

test('Meta: lucro de hoje não mexe no valor da meta de hoje', () => {
  const vazio = F.metaDoDia(base(), '2026-11-09');
  const m = F.metaDoDia(base({ corridas: [corrida('2026-11-09', 30000)] }), '2026-11-09');
  assert.strictEqual(m.valor, vazio.valor);
  assert.strictEqual(m.lucroHoje, 30000);
});

test('Meta: em dia de folga o valor é zero', () => {
  const m = F.metaDoDia(base(), '2026-11-14');
  assert.strictEqual(m.valor, 0);
  assert.strictEqual(m.trabalhaHoje, false);
});

test('Totais: receita, taxas, pedágio, despesas e lucro', () => {
  const d = base({
    corridas: [corrida('2026-11-09', 11696, 'usetaxi', { bruto: 14095, taxaValor: 2819, pedagio: 420 })],
    despesas: [{ id: 'd', data: '2026-11-09', categoria: 'Combustível', valor: 5000 }],
  });
  const t = F.totais(d, '2026-11-09', '2026-11-09');
  assert.strictEqual(t.receita, 11696);
  assert.strictEqual(t.despesas, 5000);
  assert.strictEqual(t.lucro, 6696);
});

test('A receber: fica destacado até ser recebido', () => {
  const c = corrida('2026-11-09', 10000);
  const conta = { id: 'x', corridaId: c.id, cliente: 'A', valor: 10000, vencimento: '2026-11-20', recebidaEm: '' };
  const d = base({ corridas: [c], contas: [conta] });
  assert.strictEqual(F.totais(d, '2026-11-01', '2026-11-30').aReceber, 10000);
  conta.recebidaEm = '2026-11-15';
  assert.strictEqual(F.totais(d, '2026-11-01', '2026-11-30').aReceber, 0);
});

test('Conta sem corrida só entra na receita quando recebida, e nunca em dobro', () => {
  const conta = { id: 'x', cliente: 'A', valor: 5000, vencimento: '2026-11-20', recebidaEm: '' };
  const d = base({ contas: [conta] });
  assert.strictEqual(F.totais(d, '2026-11-01', '2026-11-30').receita, 0);
  conta.recebidaEm = '2026-11-10';
  assert.strictEqual(F.totais(d, '2026-11-01', '2026-11-30').receita, 5000);
});

test('Parcelas de manutenção caem como despesa em cada vencimento', () => {
  const d = base({ manutencoes: [{ id: 'm', tipo: 'Revisão', parcelas: [
    { n: 1, data: '2026-11-10', valor: 10000, paga: true },
    { n: 2, data: '2026-12-10', valor: 10000, paga: false },
  ] }] });
  assert.strictEqual(F.totais(d, '2026-11-01', '2026-11-30').despesas, 10000);
  assert.strictEqual(F.totais(d, '2026-12-01', '2026-12-31').despesas, 10000);
});

test('Status de conta', () => {
  const c = (vencimento, recebidaEm = '') => ({ vencimento, recebidaEm });
  assert.strictEqual(F.statusConta(c('2026-11-01'), '2026-11-09'), 'vencido');
  assert.strictEqual(F.statusConta(c('2026-11-12'), '2026-11-09'), 'a vencer');
  assert.strictEqual(F.statusConta(c('2026-12-30'), '2026-11-09'), 'pendente');
  assert.strictEqual(F.statusConta(c('2026-11-01', '2026-11-02'), '2026-11-09'), 'recebido');
});

test('Rodízio: alerta aos 90% (9.000 km) e vence aos 10.000 km', () => {
  const d = base({
    veiculos: [{ id: 'v', principal: true, km: 58999 }],
    manutencoes: [{ id: 'm', tipo: 'Rodízio de pneus', data: '2026-01-01', km: 50000, parcelas: [] }],
  });
  const item = () => F.saudeVeiculo(d, '2026-11-09').find((i) => i.nome === 'Rodízio de pneus');
  assert.strictEqual(item().status, 'em dia');
  d.veiculos[0].km = 59000;
  assert.strictEqual(item().status, 'a vencer');
  d.veiculos[0].km = 60000;
  assert.strictEqual(item().status, 'vencido');
});

test('Próximo KM informado: alerta aos 90% do intervalo', () => {
  const d = base({
    veiculos: [{ id: 'v', principal: true, km: 24399 }],
    manutencoes: [{ id: 'm', tipo: 'Revisão', data: '2026-01-01', km: 10000, proximaKm: 26000, parcelas: [] }],
  });
  const item = () => F.saudeVeiculo(d, '2026-11-09').find((i) => i.nome === 'Revisão');
  assert.strictEqual(item().status, 'em dia');
  d.veiculos[0].km = 24400; // 10.000 + 90% de 16.000
  assert.strictEqual(item().status, 'a vencer');
});

test('Documento e serviço por data: alerta 1 mês antes', () => {
  assert.strictEqual(F.statusValidade('2026-12-20', '2026-11-19'), 'válido');
  assert.strictEqual(F.statusValidade('2026-12-20', '2026-11-20'), 'a vencer');
  assert.strictEqual(F.statusValidade('2026-12-20', '2026-12-21'), 'vencido');
  assert.strictEqual(F.somarMeses('2026-03-31', -1), '2026-02-28');
  assert.strictEqual(F.somarMeses('2026-01-15', -1), '2025-12-15');
  const d = base({
    veiculos: [{ id: 'v', principal: true, km: 0 }],
    manutencoes: [{ id: 'm', tipo: 'Revisão', data: '2026-01-01', proximaData: '2027-01-15', parcelas: [] }],
  });
  const st = (hoje) => F.saudeVeiculo(d, hoje).find((i) => i.nome === 'Revisão').status;
  assert.strictEqual(st('2026-12-14'), 'em dia');
  assert.strictEqual(st('2026-12-15'), 'a vencer');
});

test('Driver IA responde com dados e não inventa quando não há dados', () => {
  const hoje = '2026-11-09';
  const vazio = base();
  assert.match(IA.responder('Como está meu mês?', vazio, hoje), /Não encontrei/);
  assert.match(IA.responder('Qual foi minha maior despesa?', vazio, hoje), /Não encontrei/);
  assert.match(IA.responder('qual a capital da frança', vazio, hoje), /Só consigo/);

  const d = base({
    corridas: [corrida(hoje, 30000, 'uber'), corrida(hoje, 10000, '99')],
    despesas: [
      { id: 'a', data: hoje, categoria: 'Combustível', valor: 8000 },
      { id: 'b', data: hoje, categoria: 'Pedágio', valor: 1000 },
    ],
  });
  assert.match(IA.responder('Qual plataforma está me rendendo mais?', d, hoje), /^Uber/);
  assert.match(IA.responder('Qual foi minha maior despesa?', d, hoje), /Combustível/);
  assert.match(IA.responder('Estou perto da meta?', d, hoje), /Faltam/);
  assert.match(IA.responder('Como está meu mês?', d, hoje).replace(/\s/g, ' '), /lucro de R\$ 310,00/);
});

test('Driver IA separa documentos de serviços e entende "por dia"', () => {
  const hoje = '2026-11-09';
  const d = base({
    veiculos: [{ id: 'v', principal: true, km: 70000 }],
    manutencoes: [{ id: 'm', tipo: 'Troca de óleo', data: '2026-01-01', km: 50000, parcelas: [] }],
    documentos: [{ id: 'd', nome: 'CNH', validade: '2026-11-20', grupo: 'motorista' }],
    corridas: [corrida('2026-11-03', 10000), corrida(hoje, 30000)],
  });
  const docs = IA.responder('Tem algum documento vencendo?', d, hoje);
  assert.match(docs, /CNH/);
  assert.doesNotMatch(docs, /óleo/);
  const serv = IA.responder('Como está a manutenção?', d, hoje);
  assert.match(serv, /óleo/);
  assert.doesNotMatch(serv, /CNH/);
  assert.match(IA.responder('Qual minha média por dia?', d, hoje), /Neste mês/);
});

test('Recibo: valor por extenso', () => {
  const casos = {
    14515: 'cento e quarenta e cinco reais e quinze centavos',
    100: 'um real',
    1: 'um centavo',
    0: 'zero reais',
    10000: 'cem reais',
    2050: 'vinte reais e cinquenta centavos',
    150000: 'mil e quinhentos reais',
    123456: 'mil duzentos e trinta e quatro reais e cinquenta e seis centavos',
    200100: 'dois mil e um reais',
    100000000: 'um milhão de reais',
    250000000: 'dois milhões e quinhentos mil reais',
  };
  for (const [centavos, texto] of Object.entries(casos)) assert.strictEqual(F.extenso(Number(centavos)), texto);
});
