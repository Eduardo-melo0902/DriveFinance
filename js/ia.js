/* ia.js — o "cérebro" do Driver IA.
   Nesta versão ele NÃO usa um modelo de IA de verdade: procura palavras na
   pergunta e responde consultando os dados guardados no aparelho.
   Vantagem: funciona offline, é de graça e nunca inventa número.
   Para ligar uma IA real depois, basta trocar a função responder(). */
(function (raiz, criar) {
  if (typeof module === 'object' && module.exports) module.exports = criar(require('./finance.js'));
  else raiz.DriverIA = criar(raiz.Finance);
})(typeof self !== 'undefined' ? self : this, function (F) {
  'use strict';


  /* Descobre de qual período a pergunta fala. */
  function periodoDaPergunta(q, hoje, padrao) {
    const de = (tipo, ref, nome) => Object.assign(F.intervalo(tipo, ref), { nome });
    if (/\bontem\b/.test(q)) return de('dia', F.somarDias(hoje, -1), 'ontem');
    if (/\bhoje\b|(?<!por )\bdia\b/.test(q)) return de('dia', hoje, 'hoje');
    if (/semana passada/.test(q)) return de('semana', F.somarDias(hoje, -7), 'na semana passada');
    if (/semana/.test(q)) return de('semana', hoje, 'nesta semana');
    if (/mes passado/.test(q)) return de('mes', F.moverPeriodo('mes', hoje, -1), 'no mês passado');
    if (/\bano\b/.test(q)) return de('ano', hoje, 'neste ano');
    if (/\bmes\b/.test(q)) return de('mes', hoje, 'neste mês');
    return padrao === 'dia' ? de('dia', hoje, 'hoje') : de('mes', hoje, 'neste mês');
  }

  const SEM_MOVIMENTO = (nome) => `Não encontrei lançamentos ${nome}, então prefiro não chutar um número.`;

  function responderMeta(d, hoje) {
    if (!d.meta.mensal) return 'Você ainda não definiu uma meta. Cadastre em Menu, Meta Financeira.';
    const m = F.metaDoDia(d, hoje);
    if (m.faltaMes === 0) return `Meta do mês batida! Você já fez ${F.brl(m.lucroMes)} de ${F.brl(d.meta.mensal)}.`;
    const inicio = `Faltam ${F.brl(m.faltaMes)} para a meta de ${F.brl(d.meta.mensal)}.`;
    if (!m.trabalhaHoje) return `${inicio} Hoje é folga, e restam ${m.restantes} dias de trabalho no mês.`;
    return `${inicio} A meta de hoje é ${F.brl(m.valor)} e você está em ${m.pct}%. Restam ${m.restantes} dias de trabalho.`;
  }

  function responderMaiorDespesa(t, p) {
    if (!t.despesasLista.length) return SEM_MOVIMENTO(p.nome);
    const [cat, valor] = Object.entries(t.porCategoria).sort((a, b) => b[1] - a[1])[0];
    return `Sua maior despesa ${p.nome} foi ${cat}: ${F.brl(valor)}, de ${F.brl(t.despesas)} no total.`;
  }

  function responderPlataforma(t, p, dados) {
    const lista = Object.entries(t.porPlataforma).sort((a, b) => b[1] - a[1]);
    if (!lista.length) return SEM_MOVIMENTO(p.nome);
    const [id, valor] = lista[0];
    const pct = Math.round((valor / lista.reduce((s, x) => s + x[1], 0)) * 100);
    const n = t.corridasLista.filter((c) => c.plataforma === id).length;
    return `${((dados.plataformas || {})[id] || {}).nome || id} é a que mais rende ${p.nome}: ${F.brl(valor)} em ${n} corridas, ${pct}% do que você recebeu.`;
  }

  function responderReceber(d, hoje) {
    const abertas = d.contas.filter((c) => !c.recebidaEm);
    if (!abertas.length) return 'Você não tem nenhuma conta pendente.';
    const total = abertas.reduce((s, c) => s + c.valor, 0);
    const vencidas = abertas.filter((c) => F.statusConta(c, hoje) === 'vencido');
    const fim = vencidas.length ? ` ${vencidas.length} já venceram, somando ${F.brl(vencidas.reduce((s, c) => s + c.valor, 0))}.` : ' Nenhuma vencida.';
    return `Você tem ${F.brl(total)} a receber em ${abertas.length} contas.${fim}`;
  }

  function responderPendenciasVeiculo(d, hoje, filtro) {
    const itens = F.pendencias(d, hoje).filter(filtro);
    if (!itens.length) return 'Está tudo em dia por aqui.';
    return itens.slice(0, 3).map((i) => `${i.titulo} (${i.detalhe})`).join('; ') + '.';
  }

  function responderResumo(t, p) {
    if (!t.nCorridas && !t.despesas) return SEM_MOVIMENTO(p.nome);
    const fala = `${p.nome.charAt(0).toUpperCase() + p.nome.slice(1)}: lucro de ${F.brl(t.lucro)}. Receita ${F.brl(t.receita)}, despesas ${F.brl(t.despesas)}, ${t.nCorridas} corridas.`;
    return t.aReceber ? `${fala} Desse valor, ${F.brl(t.aReceber)} ainda não entraram.` : fala;
  }

  function responder(pergunta, d, hoje) {
    const q = F.norm(pergunta).trim();
    if (!q) return 'Pode perguntar: "Como está meu mês?" ou "Estou perto da meta?"';

    if (/\bmeta\b|objetivo/.test(q)) return responderMeta(d, hoje);
    if (/receber|recebimento|recebi|pendente|devendo|\bpix\b/.test(q)) return responderReceber(d, hoje);
    if (/document|\bcnh\b|condutax|alvara|crlv|licenciamento|seguro|ipva/.test(q)) {
      return responderPendenciasVeiculo(d, hoje, (i) => i.origem === 'documento');
    }
    if (/manutenc|revisao|oleo|pneu|rodizio|alinhamento|parcela/.test(q)) {
      return responderPendenciasVeiculo(d, hoje, (i) => i.origem === 'servico');
    }

    const padrao = /lucro|ganhei|fiz|quanto/.test(q) ? 'dia' : 'mes';
    const p = periodoDaPergunta(q, hoje, padrao);
    const t = F.totais(d, p.inicio, p.fim);

    if (/maior.*(despesa|gasto)|gastei mais|mais gastei|mais caro/.test(q)) return responderMaiorDespesa(t, p);
    if (/plataforma|rend|uber|\b99\b|use taxi/.test(q)) return responderPlataforma(t, p, d);
    if (/despesa|gasto|gastei/.test(q)) {
      return t.despesasLista.length ? `Você gastou ${F.brl(t.despesas)} ${p.nome}, em ${t.despesasLista.length} lançamentos.` : SEM_MOVIMENTO(p.nome);
    }
    if (/media|ticket/.test(q)) {
      return t.nCorridas ? `${p.nome.charAt(0).toUpperCase() + p.nome.slice(1)}: média de ${F.brl(t.ticket)} por corrida e ${F.brl(t.mediaDia)} de lucro por dia trabalhado.` : SEM_MOVIMENTO(p.nome);
    }
    if (/quantas corridas|corridas/.test(q)) {
      return t.nCorridas ? `Você fez ${t.nCorridas} corridas ${p.nome}.` : SEM_MOVIMENTO(p.nome);
    }
    if (/lucro|ganhei|fiz|fatur|como esta|como foi|desempenho|resumo|\bmes\b|semana|hoje|ontem/.test(q)) return responderResumo(t, p);

    return 'Só consigo responder sobre seus dados: meta, lucro, despesas, recebimentos, plataformas, documentos e manutenção.';
  }

  return { responder };
});
