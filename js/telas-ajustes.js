/* Telas: Menu, Configurações, Plataformas, Meta, Perfil e Backup. */
const linkMenu = (rota, nomeIcone, texto) => `<a class="item" href="#${rota}"><span class="item-icone">${icone(nomeIcone)}</span><span class="item-corpo"><span class="item-titulo">${texto}</span></span>${icone('dir', 'seta')}</a>`;

tela('/menu', {
  titulo: 'Menu', voltar: '/',
  render: () => `<div class="lista">
    ${linkMenu('/corridas/nova', 'carro', 'Nova Corrida')}
    ${linkMenu('/despesas/nova', 'recibo', 'Nova Despesa')}
    ${linkMenu('/fechamento', 'fechamento', 'Fechamento do Dia')}
    ${linkMenu('/receber', 'dinheiro', 'Contas a Receber')}
    ${linkMenu('/recibos', 'recibo', 'Recibos')}
    ${linkMenu('/relatorios', 'grafico', 'Relatórios')}
    ${linkMenu('/ia', 'conversa', 'Driver IA')}
    ${linkMenu('/veiculo', 'escudo', 'Meu Veículo')}
    ${linkMenu('/clientes', 'pessoas', 'Clientes')}
    ${linkMenu('/configuracoes', 'ajustes', 'Configurações')}
  </div>`,
});

tela('/configuracoes', {
  titulo: 'Configurações', voltar: '/menu',
  render: () => `<div class="lista">
      ${linkMenu('/perfil', 'pessoa', 'Perfil')}
      ${linkMenu('/plataformas', 'ajustes', 'Plataformas')}
      ${linkMenu('/meta', 'alvo', 'Meta Financeira')}
      ${linkMenu('/backup', 'nuvem', 'Backup e Restauração')}
    </div>
    <button type="button" class="botao perigo largo" id="apagar">${icone('lixo')}Apagar todos os dados</button>`,
  montar(v) {
    v.querySelector('#apagar').addEventListener('click', async () => {
      if (await confirmar('Apagar corridas, despesas, clientes e todos os outros dados deste aparelho? Baixe uma cópia antes, se quiser guardar.', 'Apagar tudo', true)) {
        Store.zerar();
        avisar('Todos os dados foram apagados');
        irPara('/');
      }
    });
  },
});

/* ---------- Plataformas: lista (ordem, editar, restaurar) ---------- */
tela('/plataformas', {
  titulo: 'Plataformas', voltar: '/configuracoes', semAbas: true,
  acao: { rota: '/plataformas/nova', rotulo: 'Nova plataforma' },
  render() {
    const ativas = plataformasAtivas();
    const removidas = Store.d.ordemPlataformas.filter((id) => Store.d.plataformas[id].removida).map(plataformaDe);
    const taxa = (p) => `Taxa ${String(p.taxa).replace('.', ',')}%`;
    const item = (p, i) => `<div class="pf-item">
        <span class="pf pf-${esc(p.id)}">${conteudoPlataforma(p)}</span>
        <span class="pf-item-texto"><strong>${esc(p.nome)}</strong><small>${taxa(p)}</small></span>
        <span class="pf-item-acoes">
          <button type="button" data-mover="-1" data-id="${esc(p.id)}" aria-label="Subir ${esc(p.nome)}" ${i === 0 ? 'disabled' : ''}>${icone('esq', 'girar')}</button>
          <button type="button" data-mover="1" data-id="${esc(p.id)}" aria-label="Descer ${esc(p.nome)}" ${i === ativas.length - 1 ? 'disabled' : ''}>${icone('dir', 'girar')}</button>
          <a href="#/plataformas/${encodeURIComponent(p.id)}" aria-label="Editar ${esc(p.nome)}">${icone('editar')}</a>
        </span>
      </div>`;
    const retirada = (p) => `<div class="pf-item">
        <span class="pf pf-${esc(p.id)}">${conteudoPlataforma(p)}</span>
        <span class="pf-item-texto"><strong>${esc(p.nome)}</strong><small>Retirada</small></span>
        <span class="pf-item-acoes">
          <button type="button" data-restaurar="${esc(p.id)}" aria-label="Trazer ${esc(p.nome)} de volta">${icone('restaurar')}</button>
          <a href="#/plataformas/${encodeURIComponent(p.id)}" aria-label="Editar ${esc(p.nome)}">${icone('editar')}</a>
        </span>
      </div>`;
    return `<div class="form">
      <div class="pf-lista">
        <p class="pf-divisa">Aparecem direto na corrida</p>
        ${ativas.slice(0, PF_DIRETO).map(item).join('')}
        ${ativas.length > PF_DIRETO ? `<p class="pf-divisa">Ficam no botão "+"</p>${ativas.slice(PF_DIRETO).map((p, i) => item(p, i + PF_DIRETO)).join('')}` : ''}
      </div>
      <a class="botao largo" href="#/plataformas/nova">${icone('mais')}Nova plataforma</a>
      ${removidas.length ? `<section class="pf-lista"><p class="pf-divisa">Retiradas: toque na seta circular para trazer de volta</p>${removidas.map(retirada).join('')}</section>` : ''}
      <div class="info">${icone('info')}<span>Use as setas para mudar a ordem: as ${PF_DIRETO} primeiras aparecem direto na tela de nova corrida e as outras ficam no botão "+". Corridas já lançadas mantêm a taxa da época.</span></div>
    </div>`;
  },
  montar(v) {
    v.querySelector('.form').addEventListener('click', (e) => { // no .form (é recriado a cada recarga), para o clique não contar em dobro
      const mover = e.target.closest('[data-mover]');
      const restaurar = e.target.closest('[data-restaurar]');
      if (mover && !mover.disabled) {
        const id = mover.dataset.id, passo = Number(mover.dataset.mover);
        const ativas = plataformasAtivas().map((p) => p.id);
        const i = ativas.indexOf(id), j = i + passo;
        if (i < 0 || j < 0 || j >= ativas.length) return;
        [ativas[i], ativas[j]] = [ativas[j], ativas[i]];
        Store.d.ordemPlataformas = ativas.concat(Store.d.ordemPlataformas.filter((x) => !ativas.includes(x)));
        Store.salvar();
        recarregar();
        // Mantém o foco na mesma seta (ou na outra, se esta ficou desligada no topo/fim).
        const raiz = document.getElementById('tela');
        const alvo = [passo, -passo].map((p) => raiz.querySelector(`[data-mover="${p}"][data-id="${CSS.escape(id)}"]`)).find((b) => b && !b.disabled);
        if (alvo) alvo.focus();
      }
      if (restaurar) {
        Store.d.plataformas[restaurar.dataset.restaurar].removida = false;
        Store.salvar();
        avisar(`${nomePlataforma(restaurar.dataset.restaurar)} voltou para os botões`);
        recarregar();
      }
    });
  },
});

/* ---------- Plataformas: criar e editar ---------- */
const voltarDoEditorPf = (p, q) => (q && q.voltar === 'corrida' ? '/corridas/nova' : '/plataformas');
tela('/plataformas/nova', {
  titulo: 'Nova Plataforma', voltar: voltarDoEditorPf, semAbas: true,
  render: () => formPlataforma(null),
  montar: (v, p, q) => montarFormPlataforma(v, null, q),
});
tela('/plataformas/:id', {
  titulo: 'Editar Plataforma', voltar: voltarDoEditorPf, semAbas: true,
  render: (p) => (Store.d.plataformas[p.id] ? formPlataforma(p.id) : vazio('carro', 'Esta plataforma não existe mais.', '/plataformas', 'Ver plataformas')),
  montar: (v, p, q) => { if (Store.d.plataformas[p.id]) montarFormPlataforma(v, p.id, q); },
});

function formPlataforma(id) {
  const p = id ? plataformaDe(id) : { nome: '', cor: '#0a5fe0', corTexto: '#ffffff', img: '', taxa: 0, modo: 'bruto' };
  return `<form class="form" novalidate>
    <div class="campo"><span>Prévia do botão</span>
      <div class="pf-previa" aria-hidden="true"><div class="chip"><span id="previa-pf"></span></div></div>
    </div>
    ${campo('Nome', entrada('nome', p.nome, 'maxlength="20" autocomplete="off" placeholder="Ex.: inDrive" required'))}
    <div class="cores-linha">
      ${campo('Cor de fundo', `<input type="color" name="cor" value="${esc(corValida(p.cor, '#5b6b80'))}">`)}
      ${campo('Cor do texto', `<input type="color" name="corTexto" value="${esc(corValida(p.corTexto, '#ffffff'))}">`)}
    </div>
    <div class="campo canto-edit">
      <span>Logo (opcional)</span>
      <div class="canto-linha">
        <div class="canto-mini" id="mini-pf"></div>
        <label class="botao claro">${icone('camera')}Escolher imagem<input type="file" accept="image/*" id="logo-pf" hidden></label>
        <button type="button" class="botao perigo" id="tirar-pf">Tirar imagem</button>
      </div>
      <small class="ajuda">Com logo, o botão mostra só a imagem, em cima da cor de fundo.</small>
    </div>
    <div class="duas">
      ${campo('Taxa da plataforma (%)', `<input type="number" inputmode="decimal" name="taxa" min="0" max="95" step="0.01" value="${esc(p.taxa)}">`)}
      ${campo('Forma de lançamento', selecao('modo', [['liquido', 'Líquido'], ['bruto', 'Bruto']], p.modo))}
    </div>
    <small class="ajuda">Líquido = você digita o que caiu para você. Bruto = você digita o valor cheio.</small>
    ${id && Store.d.plataformas[id].padrao ? '<button type="button" class="botao claro largo" id="original-pf">Voltar ao visual original</button>' : ''}
    <button class="botao largo" type="submit">Salvar</button>
    ${!id ? '' : p.removida
    ? `<button type="button" class="botao claro largo" id="restaurar-pf">${icone('restaurar')}Trazer de volta para os botões</button>`
    : `<button type="button" class="botao perigo largo" id="retirar-pf">${icone('lixo')}Retirar plataforma</button>`}
  </form>`;
}

function montarFormPlataforma(v, id, q) {
  const d = Store.d;
  const form = v.querySelector('form');
  const el = (n) => form.elements[n];
  let img = id ? d.plataformas[id].img : ''; // id de d.imagens, ou "data:..." se acabou de ser escolhida
  const srcImg = () => (img.startsWith('data:') ? img : d.imagens[img] || '');

  function atualizar() {
    const p = { nome: el('nome').value.trim() || 'Nome', cor: el('cor').value, corTexto: el('corTexto').value };
    const previa = v.querySelector('#previa-pf');
    previa.setAttribute('style', estiloPlataforma(p));
    previa.innerHTML = conteudoPlataforma(p, srcImg());
    v.querySelector('#mini-pf').innerHTML = srcImg() ? `<img src="${esc(srcImg())}" alt="Logo escolhida">` : 'Sem logo';
    v.querySelector('#tirar-pf').hidden = !img;
  }
  form.addEventListener('input', atualizar);
  atualizar();

  v.querySelector('#logo-pf').addEventListener('change', async (e) => {
    if (!e.target.files[0]) return;
    try { img = await reduzirImagem(e.target.files[0], 200); atualizar(); }
    catch (erro) { avisar('Este arquivo não é uma imagem válida.'); }
    e.target.value = '';
  });
  v.querySelector('#tirar-pf').addEventListener('click', () => { img = ''; atualizar(); });

  const original = v.querySelector('#original-pf');
  if (original) original.addEventListener('click', () => {
    const o = plataformasPadrao()[id];
    el('nome').value = o.nome; el('cor').value = o.cor; el('corTexto').value = o.corTexto; img = '';
    atualizar();
    avisar('Visual original de volta. Toque em Salvar para manter.');
  });

  const restaurar = v.querySelector('#restaurar-pf');
  if (restaurar) restaurar.addEventListener('click', () => {
    d.plataformas[id].removida = false;
    Store.salvar();
    avisar(`${nomePlataforma(id)} voltou para os botões`);
    irPara('/plataformas');
  });

  const retirar = v.querySelector('#retirar-pf');
  if (retirar) retirar.addEventListener('click', async () => {
    if (plataformasAtivas().length <= 1) return mostrarErro(form, 'Deixe pelo menos uma plataforma nos botões.');
    const nome = nomePlataforma(id);
    if (!await confirmar(`Retirar ${nome} dos botões? As corridas já lançadas continuam com ela, e você pode trazer de volta depois.`, 'Retirar', true)) return;
    const usada = d.corridas.some((c) => c.plataforma === id);
    if (!d.plataformas[id].padrao && !usada) {
      // Criada pelo motorista e nunca usada: pode apagar de vez.
      delete d.plataformas[id];
      d.ordemPlataformas = d.ordemPlataformas.filter((x) => x !== id);
    } else d.plataformas[id].removida = true;
    Store.limparImagens();
    Store.salvar();
    avisar(`${nome} foi retirada`);
    irPara('/plataformas');
  });

  aoEnviar(v, (dados) => {
    const nome = dados.nome.trim();
    if (!nome) return mostrarErro(form, 'Dê um nome para a plataforma.');
    const repetida = plataformasAtivas().find((p) => p.id !== id && p.nome.toLowerCase() === nome.toLowerCase());
    if (repetida) return mostrarErro(form, `Já existe uma plataforma chamada ${repetida.nome}.`);
    const taxa = Number(dados.taxa);
    if (dados.taxa === '' || !(taxa >= 0 && taxa <= 95)) return mostrarErro(form, 'A taxa precisa ficar entre 0 e 95%.');

    // Logo nova vira um registro em d.imagens (igual aos recibos).
    let imgId = img;
    if (img.startsWith('data:')) { imgId = novoId(); d.imagens[imgId] = img; }

    const campos = { nome, cor: corValida(dados.cor, '#5b6b80'), corTexto: corValida(dados.corTexto, '#ffffff'), img: imgId, taxa, modo: dados.modo };
    let pfId = id;
    if (id) {
      const antes = d.plataformas[id];
      // Se a forma de pagamento era o próprio nome (ex.: "Uber"), acompanha o nome novo.
      if (antes.forma === antes.nome) campos.forma = nome;
      Object.assign(antes, campos);
    } else {
      pfId = 'pf' + novoId();
      d.plataformas[pfId] = Object.assign(campos, { forma: nome, removida: false, padrao: false });
      // Entra logo depois da última plataforma ativa.
      const ativas = plataformasAtivas().map((p) => p.id).filter((x) => x !== pfId);
      d.ordemPlataformas = ativas.concat(pfId, d.ordemPlataformas.filter((x) => x !== pfId && !ativas.includes(x)));
    }
    Store.limparImagens();
    if (!Store.salvar()) return;
    avisar(id ? 'Plataforma salva' : `${nome} criada`);
    irPara(q && q.voltar === 'corrida' ? `/corridas/nova?plataforma=${encodeURIComponent(pfId)}` : '/plataformas');
  });
}

tela('/meta', {
  titulo: 'Meta Financeira', voltar: '/configuracoes', semAbas: true,
  render() {
    const m = Store.d.meta;
    const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const ordem = [1, 2, 3, 4, 5, 6, 0];
    return `<form class="form" novalidate>
      ${campo('Meta mensal', entradaDinheiro('mensal', m.mensal))}
      <div class="campo"><span>Dias de trabalho</span>
        <div class="dias">${ordem.map((d) => `<label class="dia"><input type="checkbox" name="dia" value="${d}" ${m.diasSemana.includes(d) ? 'checked' : ''}><span>${nomes[d]}</span></label>`).join('')}</div>
      </div>
      <label class="opcao-linha"><input type="checkbox" name="usarFeriados" ${m.usarFeriados ? 'checked' : ''}>Não trabalhar nos feriados nacionais</label>
      <div class="campo"><span>Folgas marcadas</span>
        <div class="duas" style="grid-template-columns:1fr auto">
          <input type="date" id="nova-folga" aria-label="Data da folga">
          <button type="button" class="botao claro" id="add-folga">Adicionar</button>
        </div>
        <div class="etiquetas" id="folgas"></div>
      </div>
      <div class="info">${icone('info')}<span id="previa"></span></div>
      <button class="botao largo" type="submit">Salvar</button>
    </form>`;
  },
  montar(v) {
    const form = v.querySelector('form');
    const hoje = F.hojeISO();
    const folgas = Store.d.meta.folgas.filter((x) => x >= F.inicioMes(hoje)).sort();

    function metaDoFormulario() {
      const dados = lerForm(form);
      return {
        mensal: dados.mensal, folgas,
        diasSemana: [...form.querySelectorAll('[name=dia]:checked')].map((c) => Number(c.value)),
        usarFeriados: !!dados.usarFeriados,
      };
    }
    function atualizar() {
      v.querySelector('#folgas').innerHTML = folgas.map((f, i) => `<span class="etiqueta">${F.dataBR(f)}<button type="button" data-i="${i}" aria-label="Remover folga de ${F.dataBR(f)}">${icone('x')}</button></span>`).join('');
      const m = F.metaDoDia({ ...Store.d, meta: metaDoFormulario() }, hoje);
      v.querySelector('#previa').textContent = m.trabalhaHoje
        ? `Meta de hoje: ${F.brl(m.valor)}, com ${m.restantes} dias de trabalho restantes neste mês. O valor é reajustado conforme seu resultado.`
        : `Hoje não é dia de trabalho. Restam ${m.restantes} dias de trabalho neste mês.`;
    }
    form.addEventListener('input', atualizar);
    v.querySelector('#add-folga').addEventListener('click', () => {
      const c = v.querySelector('#nova-folga');
      if (c.value && !folgas.includes(c.value)) { folgas.push(c.value); folgas.sort(); atualizar(); }
      c.value = '';
    });
    v.querySelector('#folgas').addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) { folgas.splice(Number(b.dataset.i), 1); atualizar(); }
    });
    atualizar();

    aoEnviar(v, () => {
      const m = metaDoFormulario();
      if (m.mensal <= 0) return mostrarErro(form, 'Informe o valor da meta mensal.');
      if (!m.diasSemana.length) return mostrarErro(form, 'Escolha pelo menos um dia de trabalho.');
      // Mantém no histórico as folgas de meses passados.
      m.folgas = Store.d.meta.folgas.filter((x) => x < F.inicioMes(hoje)).concat(folgas);
      Store.d.meta = m;
      Store.salvar();
      avisar('Meta salva');
      irPara('/');
    });
  },
});

tela('/perfil', {
  titulo: 'Perfil', voltar: '/configuracoes', semAbas: true,
  render() {
    const p = Store.d.perfil;
    return `<form class="form" novalidate>
      <div class="foto-area">
        <div class="foto">
          <div id="foto-vista">${p.foto ? `<img class="foto-img" src="${esc(p.foto)}" alt="Foto de perfil">` : `<div class="foto-img">${icone('pessoa')}</div>`}</div>
          <label aria-label="Trocar foto">${icone('camera')}<input type="file" accept="image/*" id="foto"></label>
        </div>
      </div>
      ${campo('Nome', entrada('nome', p.nome, 'autocomplete="name"'))}
      ${campo('Telefone', `<input type="tel" name="telefone" value="${esc(p.telefone)}" autocomplete="tel">`, 'Nome e telefone já vão preenchidos nos seus recibos.')}
      ${campo('E-mail', `<input type="email" name="email" value="${esc(p.email)}" autocomplete="email">`)}
      ${campo('CPF', entrada('cpf', p.cpf, 'inputmode="numeric" autocomplete="off"'))}
      <button class="botao largo" type="submit">Salvar</button>
    </form>`;
  },
  montar(v) {
    let foto = Store.d.perfil.foto;
    v.querySelector('#foto').addEventListener('change', (e) => {
      const arquivo = e.target.files[0];
      if (!arquivo) return;
      const img = new Image();
      img.onload = () => {
        // Reduz a foto para 256x256: imagem grande lotaria o armazenamento.
        const lado = Math.min(img.width, img.height);
        const tela2 = document.createElement('canvas');
        tela2.width = tela2.height = 256;
        tela2.getContext('2d').drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256);
        foto = tela2.toDataURL('image/jpeg', 0.82);
        v.querySelector('#foto-vista').innerHTML = `<img class="foto-img" src="${foto}" alt="Foto de perfil">`;
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => avisar('Este arquivo não é uma imagem válida.');
      img.src = URL.createObjectURL(arquivo);
    });
    aoEnviar(v, (d) => {
      Store.d.perfil = { nome: d.nome.trim(), telefone: d.telefone.trim(), email: d.email.trim(), cpf: d.cpf.trim(), foto };
      Store.salvar();
      avisar('Perfil salvo');
      irPara('/configuracoes');
    });
  },
});

tela('/backup', {
  titulo: 'Backup e Restauração', voltar: '/configuracoes',
  render() {
    const b = Store.d.backup;
    const quando = b.ultimo ? new Date(b.ultimo).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Nenhum';
    return `
      <section class="bloco">
        <label class="opcao-linha" style="justify-content:space-between"><span style="font-weight:600">Backup automático diário</span><input type="checkbox" id="auto" ${b.auto ? 'checked' : ''}></label>
        <p class="ajuda">Guarda uma cópia dos dados uma vez por dia neste aparelho.</p>
        <div class="linhas" style="margin-top:6px"><div><span>Último backup</span><strong>${quando}</strong></div></div>
      </section>
      <div class="info">${icone('info')}<span>A cópia automática não protege contra perda ou troca de aparelho. Para isso, baixe o arquivo e guarde em outro lugar, como o Google Drive.</span></div>
      <button type="button" class="botao largo" id="baixar">${icone('baixar')}Baixar cópia dos dados</button>
      <section class="bloco botoes">
        <h2 class="bloco-titulo" style="margin:0">Restaurar dados</h2>
        <button type="button" class="botao claro largo" id="restaurar-auto">Restaurar última cópia automática</button>
        <label class="botao claro largo" tabindex="0" id="rotulo-arquivo">Restaurar de um arquivo<input type="file" accept=".json,application/json" id="arquivo" hidden></label>
      </section>`;
  },
  montar(v) {
    v.querySelector('#auto').addEventListener('change', (e) => {
      Store.d.backup.auto = e.target.checked;
      Store.salvar();
      avisar(e.target.checked ? 'Backup automático ligado' : 'Backup automático desligado');
    });

    v.querySelector('#baixar').addEventListener('click', () => {
      Store.guardarCopia();
      const url = URL.createObjectURL(new Blob([JSON.stringify(Store.d, null, 1)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `driver-finance-${F.hojeISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      avisar('Cópia baixada');
      recarregar();
    });

    async function aplicar(obj) {
      if (!Store.valido(obj)) return avisar('Este arquivo não é um backup do Driver Finance.');
      if (await confirmar('Restaurar substitui todos os dados atuais deste aparelho. Continuar?', 'Restaurar', true)) {
        Store.restaurar(obj);
        avisar('Dados restaurados');
        irPara('/');
      }
    }

    v.querySelector('#restaurar-auto').addEventListener('click', () => {
      const copia = Store.copiaDoAparelho();
      if (!copia) return avisar('Ainda não há cópia automática neste aparelho.');
      aplicar(copia);
    });

    const arquivo = v.querySelector('#arquivo');
    v.querySelector('#rotulo-arquivo').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); arquivo.click(); }
    });
    arquivo.addEventListener('change', async () => {
      if (!arquivo.files[0]) return;
      try { aplicar(JSON.parse(await arquivo.files[0].text())); }
      catch (e) { avisar('Este arquivo não é um backup do Driver Finance.'); }
    });
  },
});
