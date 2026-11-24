/* telas-recibos.js — Recibos no estilo do talão de táxi.
   O site preenche sozinho tudo o que já sabe (perfil, veículo, corrida)
   e a pessoa pode editar qualquer informação depois em "Editar recibo". */

const numeroRecibo = (n) => String(n).padStart(4, '0');

const WHATS = '<svg class="rc-whats" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#25D366"/><path fill="#fff" d="M16.7 14.3c-.3-.1-1.6-.8-1.8-.9-.3-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.300-1.500-1.400-1.800-.2-.3 0-.4.1-.5l.4-.5.3-.4v-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.200s.9 2.500 1.100 2.700c.1.2 1.800 2.800 4.400 3.900 1.600.7 2.200.7 3 .6.500-.1 1.600-.6 1.800-1.300.2-.6.2-1.200.2-1.300-.1-.1-.3-.2-.6-.3z"/></svg>';

/* Cabeçalho padrão: o que a pessoa salvou da última vez; nome e telefone vêm do perfil. */
function modeloRecibo() {
  const m = Store.d.reciboModelo, p = Store.d.perfil;
  return {
    nome: m.nome || p.nome, telefone: m.telefone || p.telefone, slogan: m.slogan, cidade: m.cidade,
    txtEsq: m.txtEsq, imgEsq: m.imgEsq, txtDir: m.txtDir, imgDir: m.imgDir,
  };
}

/* Preenche o recibo com os dados da corrida. */
function dadosRecibo(c) {
  const v = F.veiculoPrincipal(Store.d);
  // O recibo é do passageiro: vai o valor que ELE pagou (com pedágio), não o que sobrou para você.
  const valor = (c.bruto || 0) + (c.pedagio || 0);
  return Object.assign(modeloRecibo(), {
    titulo: 'RECIBO', placa: v ? v.placa : '', valor,
    recebiDe: c.clienteNome || '', importancia: F.extenso(valor),
    itinerario: [c.origem, c.destino].filter(Boolean).join(' até '), data: c.data,
  });
}

function criarRecibo(c) {
  const d = Store.d;
  const r = Store.inserir('recibos', { numero: d.proximoRecibo, corridaId: c.id, criadoEm: new Date().toISOString(), dados: dadosRecibo(c) });
  d.proximoRecibo++;
  Store.salvar();
  return r;
}

/* Pergunta se quer o recibo. Se sim, gera e abre. Devolve true se gerou. */
async function oferecerRecibo(c, pergunta) {
  if (!c || !(await confirmar(pergunta, 'Gerar recibo', false, 'Agora não'))) return false;
  const r = criarRecibo(c);
  avisar(`Recibo nº ${numeroRecibo(r.numero)} gerado`);
  irPara(`/recibos/${r.id}`);
  return true;
}

/* Uma imagem pode estar guardada (id) ou acabou de ser escolhida (começa com "data:"). */
const fonteImagem = (img) => (!img ? '' : img.startsWith('data:') ? img : Store.d.imagens[img] || '');

function htmlCanto(img, texto) {
  const src = fonteImagem(img);
  if (src) return `<img src="${esc(src)}" alt="">`;
  return texto ? `<span class="rc-canto-txt">${esc(texto)}</span>` : '';
}

function partesData(iso) {
  if (!iso) return ['', '', ''];
  return [String(Number(iso.slice(8, 10))), MESES[Number(iso.slice(5, 7)) - 1] || '', iso.slice(0, 4)];
}

function htmlRecibo(x, numero) {
  const [dia, mes, ano] = partesData(x.data);
  const valor = x.valor ? F.brl(x.valor).replace(/R\$\s?/, '') : '';
  return `<article class="rc" id="recibo">
    <header class="rc-topo">
      <div class="rc-canto">${htmlCanto(x.imgEsq, x.txtEsq)}</div>
      <div class="rc-centro">
        ${x.nome ? `<strong class="rc-nome">${esc(x.nome)}</strong>` : ''}
        ${x.telefone ? `<span class="rc-tel">${WHATS}${esc(x.telefone)}</span>` : ''}
        ${x.slogan ? `<small class="rc-slogan">${esc(x.slogan)}</small>` : ''}
      </div>
      <div class="rc-canto">${htmlCanto(x.imgDir, x.txtDir)}</div>
    </header>
    <div class="rc-corpo">
      <div class="rc-linha1">
        <span class="rc-titulo">${esc(x.titulo)}${numero ? ` <small>nº ${numeroRecibo(numero)}</small>` : ''}</span>
        <span>Placa&nbsp; <span class="rc-placa">${esc(x.placa)}</span></span>
        <span class="rc-valor">Valor R$ <u>${esc(valor)}</u></span>
      </div>
      <p class="rc-campo"><span>Recebi (emos) de:</span><u>${esc(x.recebiDe)}</u></p>
      <p class="rc-campo"><span>a importância de:</span><u>${esc(x.importancia)}</u></p>
      <p class="rc-campo"><span>Itinerário:</span><u>${esc(x.itinerario)}</u></p>
      <div class="rc-rodape">
        <span class="rc-data">${esc(x.cidade)}${x.cidade ? ',' : ''} <u>${dia}</u> de <u class="rc-mes">${mes}</u> de <u>${ano}</u></span>
        <span class="rc-assinatura"></span>
      </div>
    </div>
  </article>`;
}

function textoRecibo(r) {
  const x = r.dados;
  const [dia, mes, ano] = partesData(x.data);
  const linhas = [
    `*${x.titulo || 'Recibo'} nº ${numeroRecibo(r.numero)}*`,
    x.nome, x.telefone && `WhatsApp: ${x.telefone}`, x.placa && `Placa: ${x.placa}`,
    `Valor: ${F.brl(x.valor).replace(/ /g, ' ')}`,
    x.recebiDe && `Recebi(emos) de: ${x.recebiDe}`,
    x.importancia && `A importância de: ${x.importancia}`,
    x.itinerario && `Itinerário: ${x.itinerario}`,
    x.data && `${x.cidade ? x.cidade + ', ' : ''}${dia} de ${mes} de ${ano}`,
  ];
  return linhas.filter(Boolean).join('\n');
}

tela('/recibos', {
  titulo: 'Recibos', voltar: '/menu',
  render() {
    const lista = Store.d.recibos.slice().sort((a, b) => b.numero - a.numero);
    if (!lista.length) return vazio('recibo', 'Nenhum recibo gerado. Abra uma corrida e toque em Gerar recibo.', '/corridas', 'Ver corridas');
    return `<div class="lista">${lista.map((r) => `
      <a class="item" href="#/recibos/${r.id}">
        <span class="item-icone">${icone('recibo')}</span>
        <span class="item-corpo"><span class="item-titulo">Recibo nº ${numeroRecibo(r.numero)}</span><span class="item-sub">${esc(r.dados.recebiDe || r.dados.itinerario || 'Sem cliente')}${r.dados.data ? `, ${F.dataBR(r.dados.data)}` : ''}</span></span>
        <span class="item-valor">${F.brl(r.dados.valor)}</span>${icone('dir', 'seta')}
      </a>`).join('')}</div>`;
  },
});

tela('/recibos/:id', {
  titulo: 'Recibo', voltar: '/recibos',
  render(p) {
    const r = Store.achar('recibos', p.id);
    if (!r) return vazio('recibo', 'Este recibo não existe mais.', '/recibos', 'Ver recibos');
    const texto = textoRecibo(r);
    const assunto = `Recibo nº ${numeroRecibo(r.numero)}`;
    return `${htmlRecibo(r.dados, r.numero)}
      <a class="botao claro largo nao-imprimir" href="#/recibos/${r.id}/editar">${icone('editar')}Editar recibo</a>
      <div class="botoes dois nao-imprimir">
        <button type="button" class="botao verde" id="zap-imagem">${icone('conversa')}WhatsApp (imagem)</button>
        <button type="button" class="botao" id="baixar-imagem">${icone('baixar')}Baixar imagem</button>
      </div>
      <div class="botoes tres nao-imprimir">
        <a class="botao claro" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(texto)}">${icone('conversa')}Texto</a>
        <button type="button" class="botao claro" id="pdf">${icone('doc')}PDF</button>
        <a class="botao claro" href="mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto.replace(/\*/g, ''))}">${icone('email')}E-mail</a>
      </div>`;
  },
  montar(v, p) {
    const r = Store.achar('recibos', p.id);
    if (!r) return;
    v.querySelector('#pdf').addEventListener('click', () => window.print()); // na janela de impressão, escolher "Salvar como PDF"

    // A imagem começa a ser feita assim que a tela abre. Assim, quando a pessoa toca
    // no botão, ela já está pronta (o celular só deixa compartilhar logo após o toque).
    const nomeArquivo = `recibo-${numeroRecibo(r.numero)}.png`;
    let pronta = null;
    const pegarImagem = () => {
      if (!pronta) pronta = imagemDoRecibo(r).catch((erro) => { pronta = null; throw erro; });
      return pronta;
    };
    pegarImagem().catch(() => {});

    v.querySelector('#baixar-imagem').addEventListener('click', async () => {
      try { baixarArquivo(await pegarImagem(), nomeArquivo); }
      catch (erro) { console.error(erro); avisar('Não foi possível gerar a imagem.'); }
    });

    v.querySelector('#zap-imagem').addEventListener('click', async () => {
      let blob;
      try { blob = await pegarImagem(); }
      catch (erro) { console.error(erro); avisar('Não foi possível gerar a imagem.'); return; }
      const arquivo = new File([blob], nomeArquivo, { type: 'image/png' });
      // navigator.share abre a janela "Compartilhar" do celular; lá a pessoa escolhe o WhatsApp.
      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        try { await navigator.share({ files: [arquivo] }); }
        catch (erro) { if (erro.name !== 'AbortError') avisar('Não foi possível compartilhar. Use "Baixar imagem".'); }
        return;
      }
      // Navegador sem compartilhamento de arquivos (comum no computador): baixa a imagem.
      baixarArquivo(blob, nomeArquivo);
      avisar('Imagem baixada. Agora é só anexar no WhatsApp.');
    });
  },
});

/* ---------- Recibo como imagem ----------
   A biblioteca html2canvas "fotografa" um pedaço da página e devolve uma imagem.
   Ela só é carregada quando alguém abre um recibo, para não deixar o site lento. */
let carregandoH2C = null;
function carregarHtml2canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (!carregandoH2C) {
    carregandoH2C = new Promise((resolver, falhar) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/html2canvas.min.js';
      s.onload = () => resolver(window.html2canvas);
      s.onerror = () => { carregandoH2C = null; s.remove(); falhar(new Error('html2canvas não carregou')); };
      document.head.append(s);
    });
  }
  return carregandoH2C;
}

/* Desenha o recibo fora da tela, sempre com a mesma largura (900px),
   para a imagem sair igual no celular e no computador. */
async function imagemDoRecibo(r) {
  const h2c = await carregarHtml2canvas();
  const caixa = document.createElement('div');
  caixa.className = 'recibo-foto';
  caixa.innerHTML = htmlRecibo(r.dados, r.numero);
  document.body.append(caixa);
  try {
    await Promise.all([...caixa.querySelectorAll('img')].map((i) => (i.complete ? null : new Promise((ok) => { i.onload = i.onerror = ok; }))));
    const tela = await h2c(caixa.firstElementChild, { scale: 2, backgroundColor: '#ffffff', logging: false });
    return await new Promise((ok, falhar) => tela.toBlob((b) => (b ? ok(b) : falhar(new Error('toBlob falhou'))), 'image/png'));
  } finally {
    caixa.remove();
  }
}

function baixarArquivo(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ---------- Editar recibo ---------- */
function campoCanto(lado, rotulo, texto, img) {
  return `<div class="campo canto-edit">
    <span>${rotulo}</span>
    <div class="canto-linha">
      <div class="canto-mini" data-mini="${lado}"></div>
      <label class="botao claro">${icone('camera')}Escolher imagem<input type="file" accept="image/*" data-img="${lado}" hidden></label>
      <button type="button" class="botao perigo" data-tirar="${lado}" ${img ? '' : 'hidden'}>Tirar imagem</button>
    </div>
    ${campo('Texto (aparece quando não há imagem)', entrada(`txt${lado}`, texto, 'autocomplete="off"'))}
  </div>`;
}

tela('/recibos/:id/editar', {
  titulo: 'Editar Recibo', semAbas: true,
  voltar: (p) => `/recibos/${p.id}`,
  render(p) {
    const r = Store.achar('recibos', p.id);
    if (!r) return vazio('recibo', 'Este recibo não existe mais.', '/recibos', 'Ver recibos');
    const x = r.dados;
    return `<div id="previa">${htmlRecibo(x, r.numero)}</div>
      <form class="form" novalidate>
        <h2 class="secao">Cabeçalho</h2>
        ${campo('Nome', entrada('nome', x.nome, 'autocomplete="off"'))}
        ${campo('Telefone (com o ícone do WhatsApp)', `<input type="tel" name="telefone" value="${esc(x.telefone)}" autocomplete="off">`)}
        ${campo('Texto abaixo do telefone', entrada('slogan', x.slogan, 'autocomplete="off"'))}
        ${campoCanto('Esq', 'Canto esquerdo', x.txtEsq, x.imgEsq)}
        ${campoCanto('Dir', 'Canto direito', x.txtDir, x.imgDir)}
        <h2 class="secao">Recibo</h2>
        <div class="duas">
          ${campo('Título', entrada('titulo', x.titulo, 'autocomplete="off"'))}
          ${campo('Placa', entrada('placa', x.placa, 'autocomplete="off"'))}
        </div>
        ${campo('Valor', entradaDinheiro('valor', x.valor))}
        ${campo('Recebi (emos) de', entrada('recebiDe', x.recebiDe, 'autocomplete="off" placeholder="Nome do passageiro"'))}
        ${campo('A importância de', `<textarea name="importancia">${esc(x.importancia)}</textarea>`, 'O valor por extenso muda sozinho quando você altera o valor.')}
        ${campo('Itinerário', entrada('itinerario', x.itinerario, 'autocomplete="off"'))}
        <div class="duas">
          ${campo('Cidade', entrada('cidade', x.cidade, 'autocomplete="off"'))}
          ${campo('Data', entradaData('data', x.data))}
        </div>
        <label class="opcao-linha"><input type="checkbox" name="padrao" checked>Usar este cabeçalho e a cidade nos próximos recibos</label>
        <button class="botao largo" type="submit">Salvar recibo</button>
      </form>`;
  },
  montar(v, p) {
    const r = Store.achar('recibos', p.id);
    if (!r) return;
    const form = v.querySelector('form');
    const imagens = { Esq: r.dados.imgEsq, Dir: r.dados.imgDir }; // ainda não salvas
    let valorAnterior = r.dados.valor;

    const ler = () => {
      const d = lerForm(form);
      const t = (nome) => String(d[nome] || '').trim();
      return {
        nome: t('nome'), telefone: t('telefone'), slogan: t('slogan'), cidade: t('cidade'),
        txtEsq: t('txtEsq'), imgEsq: imagens.Esq, txtDir: t('txtDir'), imgDir: imagens.Dir,
        titulo: t('titulo'), placa: t('placa'), valor: d.valor, recebiDe: t('recebiDe'),
        importancia: t('importancia'), itinerario: t('itinerario'), data: d.data,
        padrao: !!d.padrao,
      };
    };
    const atualizarMini = (lado) => {
      const src = fonteImagem(imagens[lado]);
      v.querySelector(`[data-mini="${lado}"]`).innerHTML = src ? `<img src="${esc(src)}" alt="Imagem do canto">` : 'Sem imagem';
      v.querySelector(`[data-tirar="${lado}"]`).hidden = !src;
    };
    const atualizarPrevia = () => { v.querySelector('#previa').innerHTML = htmlRecibo(ler(), r.numero); };
    atualizarMini('Esq');
    atualizarMini('Dir');

    form.addEventListener('input', (e) => {
      // Se a pessoa não mexeu no texto por extenso, ele acompanha o valor.
      if (e.target.name === 'valor') {
        const novo = centavosDe(e.target.value);
        const imp = form.elements.importancia;
        if (!imp.value.trim() || imp.value.trim() === F.extenso(valorAnterior)) imp.value = novo ? F.extenso(novo) : '';
        valorAnterior = novo;
      }
      atualizarPrevia();
    });
    form.addEventListener('change', async (e) => {
      const lado = e.target.dataset.img;
      if (!lado || !e.target.files[0]) return;
      try {
        imagens[lado] = await reduzirImagem(e.target.files[0], 320);
        atualizarMini(lado);
        atualizarPrevia();
      } catch (erro) {
        avisar('Este arquivo não é uma imagem válida.');
      }
      e.target.value = '';
    });
    form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tirar]');
      if (!b) return;
      imagens[b.dataset.tirar] = '';
      atualizarMini(b.dataset.tirar);
      atualizarPrevia();
    });

    aoEnviar(v, () => {
      const x = ler();
      if (!x.valor) return mostrarErro(form, 'Informe o valor do recibo.');
      // Imagem nova vira um registro separado: assim vários recibos usam a mesma sem repetir.
      ['imgEsq', 'imgDir'].forEach((k) => {
        if (x[k] && x[k].startsWith('data:')) {
          const id = novoId();
          Store.d.imagens[id] = x[k];
          x[k] = id;
        }
      });
      const salvarPadrao = x.padrao;
      delete x.padrao;
      Store.atualizar('recibos', r.id, { dados: x });
      if (salvarPadrao) {
        const perfil = Store.d.perfil;
        Store.d.reciboModelo = {
          // Igual ao perfil = deixa vazio, para continuar acompanhando o perfil.
          nome: x.nome === perfil.nome ? '' : x.nome,
          telefone: x.telefone === perfil.telefone ? '' : x.telefone,
          slogan: x.slogan, cidade: x.cidade, txtEsq: x.txtEsq, imgEsq: x.imgEsq, txtDir: x.txtDir, imgDir: x.imgDir,
        };
      }
      Store.limparImagens();
      if (!Store.salvar()) return;
      avisar('Recibo salvo');
      irPara(`/recibos/${r.id}`);
    });
  },
});

/* Diminui a imagem (no máximo "lado" pixels) para não lotar o armazenamento.
   PNG continua PNG (mantém fundo transparente e QR Code nítido); foto vira JPEG. */
function reduzirImagem(arquivo, lado) {
  return new Promise((resolver, falhar) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * escala));
      c.height = Math.max(1, Math.round(img.height * escala));
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      const png = arquivo.type === 'image/jpeg' ? '' : c.toDataURL('image/png');
      if (png && png.length < 120000) return resolver(png);
      // Foto ou PNG pesado: vira JPEG (com fundo branco, porque JPEG não tem transparência).
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      resolver(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); falhar(new Error('imagem inválida')); };
    img.src = URL.createObjectURL(arquivo);
  });
}
