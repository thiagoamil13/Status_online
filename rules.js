/* ============================================================
   STATUS — O Jogo da Ascensão Social (Grow, 1977)
   Dados e regras puras. Usado pelo servidor; enviado ao
   navegador como JSON na entrada da sala (nada é duplicado).
   ============================================================ */

export const CLASSES = ['Classe Baixa', 'Classe Média', 'Classe Alta'];
export const CLASS_SHORT = ['baixa', 'média', 'alta'];
export const SYMBOL_PRICE = [10, 50, 300];   // preço do símbolo por classe
export const OUTRA = [2, 10, 50];            // "outra compra" por anel
export const RECEBA = [20, 100, 1000];       // rendimento ao passar
export const TAX_MULT = [1, 10, 100];        // impostos: dados × mult
export const PROMO_CASH = [null, 50, 300];   // dinheiro para subir à classe X
export const PROMO_BLACK = [null, 20, 100];  // mercado negro do documento
export const BANK_BUYBACK = [null, 10, 5];   // banco resgata símbolo na subida

export const BIZ = [
  { id: 'sport',   name: 'Big Sport',     color: '#7d55a4', products: ['Tênis', 'Golfe', 'Veleiro'] },
  { id: 'modas',   name: "Modas Rose's",  color: '#c8473f', products: ['Modelo Exclusivo', 'Alta Costura', 'Casaco de Mink'] },
  { id: 'gall',    name: 'Gall Arte',     color: '#a5643c', products: ['Busto de Bach', 'Natureza Morta', 'Vaso Ming'] },
  { id: 'snob',    name: 'Snob Car',      color: '#2e7fb5', products: ['Rádio', 'Toca-Fitas', 'Carro Esporte'] },
  { id: 'goldj',   name: 'Gold Joias',    color: '#e5a52e', products: ['Anel de Prata', 'Pulseira de Ouro', 'Colar de Rubi'] },
  { id: 'movelar', name: 'Movelar',       color: '#5aa14b', products: ['Máquina de Lavar', 'TV a Cores', 'Sala de Jantar'] },
];

export const DOCS = {
  supletivo: { name: 'Diploma de Supletivo',  tier: 0, cost: 5,  kind: 'diploma' },
  country:   { name: 'Título do Country Club', tier: 0, cost: 5,  kind: 'clube' },
  faculdade: { name: 'Diploma Universitário',  tier: 1, cost: 30, kind: 'diploma' },
  iate:      { name: 'Título do Iate Club',    tier: 1, cost: 20, kind: 'clube' },
};

export const JOCKEY_PAY = {
  2: [40, 20, 10], 3: [20, 10, 5], 4: [12, 7, 4], 5: [10, 5, 3], 6: [7, 4, 2],
  7: [6, 3, 1], 8: [7, 4, 2], 9: [10, 5, 3], 10: [12, 7, 4], 11: [20, 10, 5], 12: [40, 20, 10],
};

export function stockQuote(a, c) {
  switch (c) {
    case 2: return 0;
    case 3: return Math.min(10, a);
    case 4: return a * 0.25;
    case 5: return a * 0.5;
    case 6: return a * 0.75;
    case 7: return a;
    case 8: return a * 1.5;
    case 9: return a * 2;
    case 10: return a * 3;
    case 11: return a * 6;
    default: return a * 11;
  }
}

const B = (id) => ({ t: 'biz', id });
const E = (t, label, x = {}) => ({ t, label, ...x });

/* Sequência das casas no sentido do movimento (levantada das fotos do tabuleiro) */
export const TRACKS = [
  [ // ANEL EXTERNO — CLASSE BAIXA (36)
    E('entrada', 'Entrada\nInício do Jogo'), E('jockey', 'Jockey'),
    E('funeral', 'Funeral da Vovó\nHerde 20 · perca 1 volta'),
    B('gall'), B('goldj'),
    E('liquida', 'Liquidação do Débito\nPague mais 10%'),
    E('ganho', 'Noitada\nde sorte no Bingo\nReceba 10', { amt: 10 }),
    B('sport'), B('movelar'),
    E('tax', 'Impostos\nPague 1× os pontos\ndos dados'),
    B('modas'),
    E('golpe', 'Golpe do Baú\nPasse à classe média'),
    B('snob'), E('jockey', 'Jockey'), B('gall'),
    E('dietax', 'Aposentadoria\nPague 1× os pontos\nde 1 dado', { mult: 1, nome: 'Aposentadoria' }),
    E('bolsa', 'Bolsa de Valores'),
    B('sport'),
    E('receba', 'Receba 20\nao passar por aqui'),
    B('goldj'), B('movelar'),
    E('doc', 'Country Club\nPague 5 · receba 1 título', { doc: 'country' }),
    E('jockey', 'Jockey'), B('modas'),
    E('loteca', 'Loteca\nGanhe 2× os pontos\ndos dados', { mult: 2 }),
    B('snob'), B('gall'),
    E('loteria', 'Loteria'),
    B('sport'),
    E('ganho', 'Presente do Papai\nReceba 10', { amt: 10 }),
    B('movelar'), B('goldj'),
    E('doc', 'Supletivo\nPague 5 · receba 1 diploma', { doc: 'supletivo' }),
    E('bolsa', 'Bolsa de Valores'),
    B('snob'), B('modas'),
  ],
  [ // ANEL MÉDIO — CLASSE MÉDIA (28)
    E('entrada', 'Entrada\nClasse Média'),
    E('liquida', 'Liquidação do Débito\nPague mais 10%'),
    B('goldj'),
    E('ganho', 'Tio Rico\nDeixa 50 para vocês', { amt: 50 }),
    B('modas'),
    E('golpe', 'Golpe do Baú\nPasse à classe alta'),
    B('snob'),
    E('tax', 'Impostos\nPague 10× os pontos\ndos dados'),
    B('movelar'), B('gall'),
    E('doc', 'Iate Club\nPague 20 · receba 1 título', { doc: 'iate' }),
    E('bolsa', 'Bolsa de Valores'),
    B('sport'), E('jockey', 'Jockey'),
    E('receba', 'Receba 100\nao passar por aqui'),
    E('grande', 'Grande Prêmio\nDobradinha 100\npar 20 · ímpar 5'),
    B('modas'),
    E('doc', 'Faculdade\nPague 30 · receba 1 diploma', { doc: 'faculdade' }),
    E('dietax', 'Previdência Social\nPague 5× os pontos\nde 1 dado', { mult: 5, nome: 'Previdência Social' }),
    B('snob'), B('goldj'),
    E('desquite', 'Desquite\nPague 10× os dados\nvolte à classe baixa', { mult: 10 }),
    B('gall'),
    E('bolsa', 'Bolsa de Valores'),
    B('sport'),
    E('loteca', 'Loteca\nGanhe 10× os pontos\ndos dados', { mult: 10 }),
    B('movelar'), E('jockey', 'Jockey'),
  ],
  [ // ANEL INTERNO — CLASSE ALTA (20)
    E('entrada', 'Entrada\nClasse Alta'),
    B('modas'),
    E('liquida', 'Liquidação do Débito\nPague mais 10%'),
    B('gall'), B('movelar'),
    E('tax', 'Impostos\nPague 100× os pontos\ndos dados'),
    B('sport'),
    E('bolsa', 'Bolsa de Valores'),
    B('goldj'), B('snob'),
    E('receba', 'Receba 1.000\nao passar por aqui'),
    B('modas'), E('jockey', 'Jockey'),
    B('movelar'), B('gall'),
    E('desquite', 'Desquite\nPague 100× os dados\nvolte à classe média', { mult: 100 }),
    B('sport'),
    E('bolsa', 'Bolsa de Valores'),
    B('snob'), B('goldj'),
  ],
];

export const SPACE_COLORS = {
  entrada: '#f2ecda', jockey: '#b8c95e', funeral: '#9a9a96', liquida: '#c22765',
  ganho: '#c96a54', tax: '#6d3f96', golpe: '#d497c4', dietax: '#8a6f52',
  bolsa: '#4fae9e', receba: '#e2603f', doc: '#d3607a', loteca: '#e0925c',
  loteria: '#e6c08e', grande: '#a95f9d', desquite: '#dfe6e2',
};

export const PLAYER_COLORS = ['#2e7fb5', '#c8473f', '#e5a52e', '#7d55a4', '#5aa14b', '#7a4a35'];

export const RINGS = [{ r1: 378, r2: 472 }, { r1: 282, r2: 372 }, { r1: 190, r2: 276 }];

/* ---------- helpers puros ---------- */
export const bizIdx = (id) => BIZ.findIndex((b) => b.id === id);
export const symbolName = (s) => BIZ[s.biz].products[s.level];
export const d6 = () => 1 + Math.floor(Math.random() * 6);
export const fmt = (n) => '$ ' + (Math.round(n * 100) / 100).toLocaleString('pt-BR');

/* Pacote enviado ao navegador na entrada da sala. */
export function boardPayload() {
  return {
    CLASSES, CLASS_SHORT, SYMBOL_PRICE, OUTRA, RECEBA, TAX_MULT,
    BIZ, DOCS, TRACKS, SPACE_COLORS, PLAYER_COLORS, RINGS,
  };
}

export const HELP = {
  regras: `<b>Objetivo:</b> ser o primeiro com a meta em dinheiro (padrão $10.000), <b>3 símbolos da alta sociedade</b> e nenhuma dívida no cartão.<br><br>
<b>Turno:</b> antes dos dados você pode subir de classe (se cumprir as exigências). Depois lança 2 dados e anda no seu anel.<br><br>
<b>Comércios:</b> parou em comércio alheio? Compre o símbolo da sua classe (ou de uma superior) pagando ao dono, ou faça a <i>Outra Compra</i>, mais barata e obrigatória (só dinheiro). Máximo de 3 símbolos, sem repetir artigo, nunca de classe inferior à sua.<br><br>
<b>Cartão de crédito:</b> símbolos, diplomas e títulos podem ser comprados a crédito, sem limite. Na casa <i>Liquidação do Débito</i> paga-se TUDO + 10%. Impostos, pensões e Outra Compra: só dinheiro.<br><br>
<b>Subir de classe:</b> para a média — $50, 3 símbolos (de comércios que não sejam seus) e Supletivo ou Country Club. Para a alta — $300, 3 símbolos da média/alta e Faculdade ou Iate Club. Falta o documento? Mercado negro: $20 / $100. Ao subir, os símbolos e documentos da classe anterior vão a leilão.<br><br>
<b>Falência:</b> quem não paga uma obrigação leiloa os bens; se não bastar, entrega o dinheiro ao credor e recomeça na classe baixa com $20 (mantendo os comércios).<br><br>
<b>Online:</b> toda pergunta tem cronômetro. Se o tempo acabar, o servidor escolhe a opção segura por você (não comprar, não apostar, lance zero) e a partida segue.`,
  tabelas: `<b>Bolsa de Valores</b> (investimento entra na cotação 7)
<table><tr><th>Cotação</th><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td></tr>
<tr><th>Resultado</th><td>perde tudo</td><td>resta 10</td><td>¼</td><td>½</td><td>¾</td><td>igual</td><td>+½×</td><td>+1×</td><td>+2×</td><td>+5×</td><td>+10×</td></tr></table>
<b>Jockey</b> (pagamentos por 1 apostado — 1º/2º/3º lugar)
<table><tr><th>Cavalo</th><td>2 e 12</td><td>3 e 11</td><td>4 e 10</td><td>5 e 9</td><td>6 e 8</td><td>7</td></tr>
<tr><th>Paga</th><td>40/20/10</td><td>20/10/5</td><td>12/7/4</td><td>10/5/3</td><td>7/4/2</td><td>6/3/1</td></tr></table>
<b>Grande Prêmio:</b> dobradinha $100 · soma par $20 · ímpar $5.<br>
<b>Impostos:</b> dados × 1 (baixa), × 10 (média), × 100 (alta).`,
};
