# Driver Finance

Controle financeiro para motoristas profissionais. **Mais controle. Mais lucro.**

## Como abrir

No terminal, dentro desta pasta:

```
npm start
```

Depois acesse http://localhost:5173. Dá para abrir o `index.html` direto, mas o modo offline só funciona pelo endereço acima.

Para rodar os testes das contas: `npm test`.

## Onde fica cada coisa

| Arquivo | O que faz |
|---|---|
| `index.html` | Página única; carrega todo o resto |
| `css/styles.css` | Visual do site |
| `js/finance.js` | Todas as contas e regras (taxas, meta, status) |
| `js/ia.js` | Respostas do Driver IA |
| `js/store.js` | Guarda os dados no aparelho; dados de exemplo |
| `js/ui.js` | Peças reutilizáveis: ícones, campos, avisos |
| `js/app.js` | Decide qual tela mostrar |
| `js/telas-*.js` | Uma família de telas por arquivo |
| `js/telas-recibos.js` | Recibo no estilo do talão de táxi e a tela "Editar recibo" |
| `js/vendor/html2canvas.min.js` | Biblioteca que transforma o recibo em imagem (MIT) |
| `sw.js` | Modo offline |
| `tests/` | Testes das regras financeiras |
| `TelasDoc/` | Prints e documento mestre do projeto |

## Regras que merecem conferência

- **Use Táxi:** o valor do taxímetro já inclui o pedágio. Fórmula: `(valor - pedágio) x 80% + pedágio`. O exemplo do documento (R$ 145,15 com R$ 4,20) dá líquido de **R$ 112,76** e total de R$ 116,96. O documento escreve R$ 112,96, que não fecha com o próprio total.
- **Lucro** conta corridas a receber no dia em que aconteceram. A parte que ainda não entrou aparece separada como "a receber".
- **Parcelas de manutenção** viram despesa na data de cada vencimento.
- **Recibo:** o valor é o que o passageiro pagou (valor bruto + pedágio), não o que sobrou para o motorista depois da taxa. Nome e telefone vêm do perfil, a placa do veículo principal e o resto da corrida. Tudo pode ser editado em "Editar recibo"; o cabeçalho (nome, telefone, texto, cidade e imagens dos cantos) pode virar o padrão dos próximos recibos.
- **Plataformas:** na tela aparecem Uber, 99, Pix e o botão +, que mostra Use Táxi 1, Use Táxi 2, Crédito, Débito e Particular. Pix, Crédito e Débito começam sem taxa e entram na receita no dia da corrida. As taxas podem ser mudadas em Configurações > Plataformas.
- **Meta do dia** = (meta do mês - lucro dos dias anteriores) / dias de trabalho restantes.

## Limitações desta versão

- Os dados ficam só no navegador do aparelho. Não há conta de usuário nem sincronização.
- Backup: cópia automática no aparelho e arquivo para baixar. Backup em nuvem precisa de servidor.
- Driver IA responde por regras a partir dos dados; não usa um modelo de IA real. A voz depende do navegador (Chrome) e de internet.
- Recibo como imagem: no celular abre a janela Compartilhar (escolha o WhatsApp). No computador a imagem é baixada para anexar.
- Recibo em PDF usa a janela de impressão do navegador ("Salvar como PDF"). O modelo A4 com 8 recibos por folha não foi incluído.
