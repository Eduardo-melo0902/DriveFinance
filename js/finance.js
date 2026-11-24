/* finance.js — todas as CONTAS do app ficam aqui.
   Este arquivo não mexe na tela: recebe dados e devolve resultados.
   Por isso dá para testar as regras sozinho (veja tests/finance.test.js).

   Regra de ouro: dinheiro é sempre guardado em CENTAVOS (número inteiro).
   R$ 12,50 vira 1250. Assim evitamos erros de arredondamento do JavaScript. */
(function (raiz, criar) {
  if (typeof module === 'object' && module.exports) module.exports = criar();
  else raiz.Finance = criar();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Datas ----------
     Datas são textos 'AAAA-MM-DD'. Nunca usamos new Date('2026-11-09'),
     porque o JavaScript leria em UTC e o dia poderia voltar um. */
  const doisDig = (n) => String(n).padStart(2, '0');
  const paraISO = (d) => `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())}`;
  const deISO = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
  const hojeISO = () => paraISO(new Date());
  const somarDias = (iso, n) => { const d = deISO(iso); d.setDate(d.getDate() + n); return paraISO(d); };
  const inicioMes = (iso) => iso.slice(0, 8) + '01';
  const fimMes = (iso) => { const d = deISO(iso); return paraISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
  const diaSemana = (iso) => deISO(iso).getDay(); // 0 = domingo
  const inicioSemana = (iso) => somarDias(iso, -((diaSemana(iso) + 6) % 7)); // semana começa na segunda
  const diasEntre = (a, b) => Math.round((deISO(b) - deISO(a)) / 86400000);
  /* Soma (ou subtrai) meses. Se o dia não existe no mês de destino (31/03 - 1 mês),
     usa o último dia daquele mês (28 ou 29/02) em vez de pular para março. */
  const somarMeses = (iso, n) => {
    const [a, m, d] = iso.split('-').map(Number);
    const ultimo = new Date(a, m + n, 0).getDate();
    return paraISO(new Date(a, m - 1 + n, Math.min(d, ultimo)));
  };

  function intervalo(tipo, ref) {
    if (tipo === 'dia') return { inicio: ref, fim: ref };
    if (tipo === 'semana') { const i = inicioSemana(ref); return { inicio: i, fim: somarDias(i, 6) }; }
    if (tipo === 'ano') return { inicio: ref.slice(0, 4) + '-01-01', fim: ref.slice(0, 4) + '-12-31' };
    return { inicio: inicioMes(ref), fim: fimMes(ref) };
  }

  /* Anda um período para frente (+1) ou para trás (-1). */
  function moverPeriodo(tipo, ref, passo) {
    if (tipo === 'dia') return somarDias(ref, passo);
    if (tipo === 'semana') return somarDias(ref, 7 * passo);
    const d = deISO(ref);
    if (tipo === 'ano') return paraISO(new Date(d.getFullYear() + passo, 0, 1));
    return paraISO(new Date(d.getFullYear(), d.getMonth() + passo, 1));
  }

  /* ---------- Formatação ---------- */
  const brl = (c) => ((c || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
  /* ---------- Valor por extenso (para o recibo) ----------
     extenso(14515) devolve "cento e quarenta e cinco reais e quinze centavos". */
  const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
    'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  // Escreve um número de 1 a 999.
  function ate999(n) {
    if (n === 100) return 'cem';
    const partes = [];
    const c = Math.floor(n / 100), r = n % 100;
    if (c) partes.push(CENTENAS[c]);
    if (r) partes.push(r < 20 ? UNIDADES[r] : DEZENAS[Math.floor(r / 10)] + (r % 10 ? ' e ' + UNIDADES[r % 10] : ''));
    return partes.join(' e ');
  }

  // Escreve um número inteiro: separa em grupos de 3 dígitos (mil, milhão, bilhão).
  function inteiroPorExtenso(n) {
    if (!n) return 'zero';
    const grupos = [];
    for (let x = n; x > 0; x = Math.floor(x / 1000)) grupos.push(x % 1000);
    const nomes = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
    const partes = [];
    for (let i = grupos.length - 1; i >= 0; i--) {
      const g = grupos[i];
      if (!g) continue;
      let t = ate999(g);
      if (i === 1) t = g === 1 ? 'mil' : t + ' mil';
      else if (i >= 2) t += ' ' + nomes[i][g === 1 ? 0 : 1];
      partes.push({ t, g });
    }
    // "mil e quinhentos", mas "mil duzentos e trinta"
    return partes.reduce((txt, p, i) => {
      if (!i) return p.t;
      const ultimo = i === partes.length - 1;
      return txt + (ultimo && (p.g < 100 || p.g % 100 === 0) ? ' e ' : ' ') + p.t;
    }, '');
  }

  function extenso(centavos) {
    const total = Math.round(Math.abs(centavos || 0));
    const reais = Math.floor(total / 100), cent = total % 100;
    const partes = [];
    if (reais) partes.push(inteiroPorExtenso(reais) + (reais >= 1e6 && reais % 1e6 === 0 ? ' de' : '') + (reais === 1 ? ' real' : ' reais'));
    if (cent) partes.push(inteiroPorExtenso(cent) + (cent === 1 ? ' centavo' : ' centavos'));
    return partes.length ? partes.join(' e ') : 'zero reais';
  }

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* ---------- Regra das plataformas ----------
     valor   = o que o motorista digitou (com o pedágio dentro, se houver)
     modo    = 'bruto'   -> digitou o valor cheio; o app desconta a taxa
               'liquido' -> digitou o que caiu; o app reconstrói o bruto
     O pedágio nunca sofre taxa: volta inteiro para o motorista.

     Exemplo do documento (Use Táxi, 20%, taxímetro R$ 145,15 com R$ 4,20 de pedágio):
       (145,15 - 4,20) = 140,95  ->  taxa 28,19  ->  líquido 112,76  ->  total 116,96 */
  function calcCorrida({ valor = 0, pedagio = 0, taxa = 0, modo = 'bruto' }) {
    const v = Math.max(0, Math.round(valor));
    const ped = Math.min(Math.max(0, Math.round(pedagio)), v);
    const t = Math.min(Math.max(0, Number(taxa) || 0), 95); // trava para nunca dividir por zero
    const semPedagio = v - ped;
    let bruto, valorTaxa, liquido;
    if (modo === 'liquido') {
      liquido = semPedagio;
      bruto = Math.round(liquido / (1 - t / 100));
      valorTaxa = bruto - liquido;
    } else {
      bruto = semPedagio;
      valorTaxa = Math.round((bruto * t) / 100);
      liquido = bruto - valorTaxa;
    }
    return { bruto, taxa: valorTaxa, pedagio: ped, liquido, total: liquido + ped };
  }

  /* ---------- Feriados nacionais ---------- */
  function pascoa(ano) { // algoritmo clássico para achar o domingo de Páscoa
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return `${ano}-${doisDig(mes)}-${doisDig(dia)}`;
  }
  function feriados(ano) {
    const fixos = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];
    return fixos.map((d) => `${ano}-${d}`).concat(somarDias(pascoa(ano), -2)); // Sexta-feira Santa
  }

  /* ---------- Meta ---------- */
  function ehDiaDeTrabalho(iso, meta) {
    if (!meta.diasSemana.includes(diaSemana(iso))) return false;
    if ((meta.folgas || []).includes(iso)) return false;
    if (meta.usarFeriados && feriados(Number(iso.slice(0, 4))).includes(iso)) return false;
    return true;
  }
  function diasDeTrabalho(inicio, fim, meta) {
    let n = 0;
    for (let d = inicio; d <= fim; d = somarDias(d, 1)) if (ehDiaDeTrabalho(d, meta)) n++;
    return n;
  }

  /* Meta do dia = (meta do mês - lucro dos dias anteriores) / dias de trabalho que faltam.
     Usa só os dias ANTERIORES para o valor não mudar enquanto o motorista trabalha hoje. */
  function metaDoDia(dados, hoje) {
    const ini = inicioMes(hoje), fim = fimMes(hoje);
    const lucroAntes = hoje > ini ? totais(dados, ini, somarDias(hoje, -1)).lucro : 0;
    const lucroHoje = totais(dados, hoje, hoje).lucro;
    const trabalhaHoje = ehDiaDeTrabalho(hoje, dados.meta);
    const restantes = diasDeTrabalho(hoje, fim, dados.meta);
    const faltaAntes = Math.max(0, dados.meta.mensal - lucroAntes);
    const valor = trabalhaHoje && restantes > 0 ? Math.round(faltaAntes / restantes) : 0;
    const pct = valor > 0 ? Math.max(0, Math.round((lucroHoje / valor) * 100)) : 0;
    return {
      valor, pct, lucroHoje, trabalhaHoje, restantes,
      lucroMes: lucroAntes + lucroHoje,
      faltaMes: Math.max(0, dados.meta.mensal - lucroAntes - lucroHoje),
    };
  }

  /* ---------- Despesas e totais ---------- */
  /* Cada parcela de manutenção vira uma despesa na data em que vence. */
  function todasDespesas(dados) {
    const parcelas = [];
    (dados.manutencoes || []).forEach((m) => (m.parcelas || []).forEach((p) => {
      const n = m.parcelas.length;
      parcelas.push({
        id: `${m.id}-p${p.n}`, manutencaoId: m.id, categoria: 'Manutenção', data: p.data, hora: '',
        valor: p.valor, formaPagamento: m.formaPagamento,
        descricao: m.tipo + (n > 1 ? ` (parcela ${p.n}/${n})` : ''),
      });
    }));
    return (dados.despesas || []).concat(parcelas);
  }

  const noPeriodo = (data, ini, fim) => data >= ini && data <= fim;

  function totais(dados, ini, fim) {
    const corridas = dados.corridas.filter((c) => noPeriodo(c.data, ini, fim));
    const despesasLista = todasDespesas(dados).filter((d) => noPeriodo(d.data, ini, fim));
    const soma = (lista, campo) => lista.reduce((t, x) => t + (x[campo] || 0), 0);

    const bruto = soma(corridas, 'bruto');
    const taxas = soma(corridas, 'taxaValor');
    const adicionais = soma(corridas, 'pedagio');
    // Conta sem corrida ligada só vira receita quando o dinheiro entra.
    const outrasReceitas = (dados.contas || [])
      .filter((c) => !c.corridaId && c.recebidaEm && noPeriodo(c.recebidaEm, ini, fim))
      .reduce((t, c) => t + c.valor, 0);
    const receita = bruto - taxas + adicionais + outrasReceitas;
    const despesas = soma(despesasLista, 'valor');
    const lucro = receita - despesas;

    const idsAbertos = new Set((dados.contas || []).filter((c) => c.corridaId && !c.recebidaEm).map((c) => c.corridaId));
    const aReceber = corridas.filter((c) => idsAbertos.has(c.id)).reduce((t, c) => t + c.total, 0);

    const dias = new Set(corridas.map((c) => c.data)).size;
    const porPlataforma = {}, porCategoria = {};
    corridas.forEach((c) => { porPlataforma[c.plataforma] = (porPlataforma[c.plataforma] || 0) + c.total; });
    despesasLista.forEach((d) => { porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valor; });

    return {
      bruto, taxas, adicionais, outrasReceitas, receita, despesas, lucro, aReceber,
      nCorridas: corridas.length, dias,
      ticket: corridas.length ? Math.round(receita / corridas.length) : 0,
      mediaDia: dias ? Math.round(lucro / dias) : 0,
      porPlataforma, porCategoria, despesasLista, corridasLista: corridas,
    };
  }

  /* ---------- Status ---------- */
  /* Quando avisar:
     - documento ou serviço com data: 1 mês antes do vencimento;
     - serviço por KM: ao completar 90% do intervalo (troca a cada 10.000 km avisa aos 9.000 km);
     - conta a receber: 7 dias antes. */
  const MESES_ALERTA_DATA = 1, FRACAO_ALERTA_KM = 0.9, DIAS_ALERTA_CONTA = 7;
  const aVencerPorData = (data, hoje) => hoje >= somarMeses(data, -MESES_ALERTA_DATA);

  function statusConta(conta, hoje) {
    if (conta.recebidaEm) return 'recebido';
    if (conta.vencimento < hoje) return 'vencido';
    if (diasEntre(hoje, conta.vencimento) <= DIAS_ALERTA_CONTA) return 'a vencer';
    return 'pendente';
  }

  function statusValidade(data, hoje) {
    if (!data) return 'não cadastrado';
    if (data < hoje) return 'vencido';
    return aVencerPorData(data, hoje) ? 'a vencer' : 'válido';
  }

  /* ---------- Saúde do veículo ---------- */
  const veiculoPrincipal = (dados) => dados.veiculos.find((v) => v.principal) || dados.veiculos[0] || null;

  function ultimaManutencao(dados, tipo) {
    return dados.manutencoes.filter((m) => m.tipo === tipo).sort((a, b) => (a.data < b.data ? 1 : -1))[0] || null;
  }

  /* kmFeito = KM do carro quando o serviço foi feito. O aviso vem aos 90% do caminho
     entre kmFeito e kmAlvo. Sem kmFeito não dá para saber o intervalo: aí avisa
     1.000 km antes (os 10% de uma troca de 10.000 km). */
  function kmDeAviso(kmFeito, kmAlvo) {
    if (kmFeito > 0 && kmAlvo > kmFeito) return Math.round(kmFeito + (kmAlvo - kmFeito) * FRACAO_ALERTA_KM);
    return kmAlvo - 1000;
  }

  function statusDeServico(data, kmAlvo, kmAtual, hoje, kmFeito) {
    if (!data && !kmAlvo) return 'não cadastrado';
    let s = 'em dia';
    if (data) { if (data < hoje) return 'vencido'; if (aVencerPorData(data, hoje)) s = 'a vencer'; }
    if (kmAlvo && kmAtual) { if (kmAtual >= kmAlvo) return 'vencido'; if (kmAtual >= kmDeAviso(kmFeito, kmAlvo)) s = 'a vencer'; }
    return s;
  }

  function saudeVeiculo(dados, hoje) {
    const km = (veiculoPrincipal(dados) || {}).km || 0;
    const servico = (nome, tipo, kmPadrao) => {
      const m = ultimaManutencao(dados, tipo);
      const kmAlvo = m ? m.proximaKm || (kmPadrao && m.km ? m.km + kmPadrao : 0) : 0;
      const data = m ? m.proximaData || '' : '';
      return { nome, tipo, data, kmAlvo, status: m && !data && !kmAlvo ? 'sem previsão' : statusDeServico(data, kmAlvo, km, hoje, m && m.km), rota: `/manutencao/nova?tipo=${encodeURIComponent(tipo)}` };
    };
    const documento = (nome) => {
      const doc = dados.documentos.find((d) => d.nome === nome);
      const data = doc ? doc.validade : '';
      const st = statusValidade(data, hoje);
      return { nome, tipo: nome, data, kmAlvo: 0, status: st === 'válido' ? 'em dia' : st, rota: doc ? `/documentos/${doc.id}` : '/documentos/novo' };
    };
    return [
      servico('Troca de óleo', 'Troca de óleo', 10000), // feita aos 50.000 km: avisa aos 59.000
      servico('Revisão', 'Revisão', 0),
      servico('Rodízio de pneus', 'Rodízio de pneus', 10000),
      servico('Alinhamento', 'Alinhamento e balanceamento', 0),
      documento('Seguro'), documento('IPVA'), documento('Licenciamento'),
    ];
  }

  /* ---------- Pendências (o sino da tela inicial) ---------- */
  function pendencias(dados, hoje) {
    const lista = [];
    dados.contas.forEach((c) => {
      const s = statusConta(c, hoje);
      if (s === 'vencido') lista.push({ origem: 'conta', nivel: 'alto', titulo: `Conta vencida: ${c.cliente}`, detalhe: `${brl(c.valor)}, venceu em ${dataBR(c.vencimento)}`, rota: `/receber/${c.id}` });
      if (s === 'a vencer') lista.push({ origem: 'conta', nivel: 'medio', titulo: `Conta a vencer: ${c.cliente}`, detalhe: `${brl(c.valor)}, vence em ${dataBR(c.vencimento)}`, rota: `/receber/${c.id}` });
    });
    dados.documentos.forEach((d) => {
      const s = statusValidade(d.validade, hoje);
      if (s === 'vencido') lista.push({ origem: 'documento', nivel: 'alto', titulo: `${d.nome} vencido`, detalhe: `Venceu em ${dataBR(d.validade)}`, rota: `/documentos/${d.id}` });
      if (s === 'a vencer') lista.push({ origem: 'documento', nivel: 'medio', titulo: `${d.nome} a vencer`, detalhe: `Vence em ${dataBR(d.validade)}`, rota: `/documentos/${d.id}` });
    });
    const docs = new Set(['Seguro', 'IPVA', 'Licenciamento']);
    saudeVeiculo(dados, hoje).filter((i) => !docs.has(i.nome)).forEach((i) => {
      if (i.status !== 'vencido' && i.status !== 'a vencer') return;
      const quando = [i.data && dataBR(i.data), i.kmAlvo && `${i.kmAlvo.toLocaleString('pt-BR')} km`].filter(Boolean).join(' ou ');
      lista.push({ origem: 'servico', nivel: i.status === 'vencido' ? 'alto' : 'medio', titulo: `${i.nome}: ${i.status}`, detalhe: `Previsto para ${quando}`, rota: i.rota });
    });
    dados.manutencoes.forEach((m) => (m.parcelas || []).forEach((p) => {
      if (!p.paga && p.data < hoje) lista.push({ origem: 'servico', nivel: 'alto', titulo: `Parcela atrasada: ${m.tipo}`, detalhe: `${brl(p.valor)}, venceu em ${dataBR(p.data)}`, rota: `/manutencao/${m.id}` });
    }));
    return lista.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'alto' ? -1 : 1));
  }

  return {
    paraISO, deISO, hojeISO, somarDias, somarMeses, inicioMes, fimMes, diaSemana, inicioSemana, diasEntre,
    intervalo, moverPeriodo, brl, dataBR, extenso, norm, calcCorrida, pascoa, feriados, ehDiaDeTrabalho,
    diasDeTrabalho, metaDoDia, todasDespesas, totais, statusConta, statusValidade,
    veiculoPrincipal, saudeVeiculo, pendencias,
  };
});
