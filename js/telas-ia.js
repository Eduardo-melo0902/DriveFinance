/* Tela: Driver IA (perguntas por texto ou voz). */
const conversaIA = [{ de: 'ia', texto: 'Oi! Pergunte sobre sua meta, lucro, despesas ou recebimentos.' }];
const SUGESTOES = ['Como está meu mês?', 'Estou perto da meta?', 'Qual foi minha maior despesa?', 'Qual plataforma está me rendendo mais?'];

tela('/ia', {
  titulo: 'Driver IA', voltar: '/',
  render() {
    return `
      <div class="conversa" id="conversa" aria-live="polite">${conversaIA.map((f) => `<div class="fala ${f.de}">${esc(f.texto)}</div>`).join('')}</div>
      <div class="sugestoes">${SUGESTOES.map((s) => `<button type="button" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      <form class="perguntar" id="perguntar">
        <input type="text" name="q" placeholder="Digite sua pergunta" autocomplete="off" aria-label="Sua pergunta">
        <button type="button" class="mic" id="mic" aria-label="Perguntar por voz">${icone('mic')}</button>
        <button type="submit" aria-label="Enviar pergunta">${icone('enviar')}</button>
      </form>`;
  },
  montar(v) {
    const form = v.querySelector('#perguntar');
    const caixa = form.elements.q;
    const conversa = v.querySelector('#conversa');

    function adicionar(de, texto) {
      conversaIA.push({ de, texto });
      const div = document.createElement('div');
      div.className = `fala ${de}`;
      div.textContent = texto;
      conversa.append(div);
    }
    function perguntar(texto) {
      if (!texto.trim()) return;
      adicionar('eu', texto.trim());
      adicionar('ia', DriverIA.responder(texto, Store.d, F.hojeISO()));
      caixa.value = '';
      form.scrollIntoView({ block: 'end' });
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); perguntar(caixa.value); });
    v.querySelector('.sugestoes').addEventListener('click', (e) => {
      const b = e.target.closest('[data-s]');
      if (b) perguntar(b.dataset.s);
    });

    /* Reconhecimento de voz: recurso do próprio navegador (funciona no Chrome). */
    const mic = v.querySelector('#mic');
    const Reconhecer = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Reconhecer) {
      mic.addEventListener('click', () => avisar('Este navegador não aceita voz. Use o Chrome ou digite a pergunta.'));
      return;
    }
    let ouvindo = false;
    const r = new Reconhecer();
    r.lang = 'pt-BR';
    r.interimResults = false;
    r.onstart = () => { ouvindo = true; mic.classList.add('ouvindo'); mic.setAttribute('aria-label', 'Parar de ouvir'); };
    r.onend = () => { ouvindo = false; mic.classList.remove('ouvindo'); mic.setAttribute('aria-label', 'Perguntar por voz'); };
    r.onresult = (e) => perguntar(e.results[0][0].transcript);
    r.onerror = (e) => {
      const motivo = e.error === 'not-allowed' ? 'Permita o uso do microfone para perguntar por voz.'
        : e.error === 'no-speech' ? 'Não ouvi nada. Tente de novo.'
        : e.error === 'network' ? 'O reconhecimento de voz precisa de internet. Digite a pergunta.'
        : 'Não consegui ouvir. Digite a pergunta.';
      avisar(motivo);
    };
    mic.addEventListener('click', () => { if (ouvindo) r.stop(); else r.start(); });
  },
});
