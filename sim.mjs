/* Simulação rápida das regras, sem rede: só bots, muitas partidas.
   Serve para caçar travamentos, falências mal resolvidas e partidas
   que nunca terminam. Uso: node sim.mjs [partidas] */
import { GameRoom } from './game.js';

const N = +process.argv[2] || 12;

async function salaFake() {
  const mem = new Map();
  const state = {
    storage: {
      get: async (k) => mem.get(k),
      put: async (k, v) => { mem.set(k, v); },
    },
    blockConcurrencyWhile: async (fn) => fn(),
  };
  const r = new GameRoom(state, {});
  await new Promise((res) => setTimeout(res, 0));   // deixa o construtor terminar
  r.push = () => {};          // ninguém assistindo
  r.announce = () => {};
  return r;
}

const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); };

let terminadas = 0, falencias = 0, leiloes = 0, subidas = 0, turnosMax = 0;

for (let n = 0; n < N; n++) {
  const r = await salaFake();
  r.S = r.newState('SIM' + n);
  const qtd = 2 + (n % 5);              // de 2 a 6 jogadores
  for (let i = 0; i < qtd; i++) {
    const p = r.newPlayer('bot' + i, 'Bot ' + i, false);
    p.skill = i % 3;
    r.S.players.push(p);
  }
  r.S.hostPid = 'bot0';
  r.S.target = 3000;

  let turnos = 0;
  const limite = 900;
  const origPlay = r.playTurn.bind(r);
  r.playTurn = async function () { turnos++; return origPlay(); };

  await r.beginMatch();
  // beginMatch dispara o laço; espera terminar ou estourar o limite
  const t0 = Date.now();
  while (r.running && turnos < limite && Date.now() - t0 < 20000) {
    await new Promise((res) => setTimeout(res, 5));
  }
  if (r.running) { r.S.over = true; r.S.phase = 'over'; }

  const S = r.S;
  const logTxt = S.log.map((l) => l.m).join('\n');
  falencias += (logTxt.match(/FALÊNCIA/g) || []).length;
  leiloes += (logTxt.match(/Leilão:/g) || []).length;
  subidas += (logTxt.match(/subiu para a/g) || []).length;
  turnosMax = Math.max(turnosMax, turnos);
  if (S.winner) terminadas++;

  ok(!/Erro interno/.test(logTxt), 'partida ' + n + ': erro interno no motor');
  ok(S.players.every((p) => Number.isFinite(p.cash)), 'partida ' + n + ': dinheiro virou NaN');
  ok(S.players.every((p) => p.cash >= 0 || p.debt > 0), 'partida ' + n + ': dinheiro negativo sem dívida');
  ok(S.players.every((p) => p.symbols.length <= 3), 'partida ' + n + ': alguém com mais de 3 símbolos');
  ok(S.players.every((p) => p.symbols.every((s) => s.level >= p.level)),
    'partida ' + n + ': símbolo de classe inferior à do dono');
  ok(S.players.every((p) => p.docs.length === new Set(p.docs).size), 'partida ' + n + ': documento repetido');
  ok(S.stock.every((b) => b.every((q) => q >= 0 && q <= 3)), 'partida ' + n + ': estoque fora do intervalo 0–3');
  // cada símbolo em circulação saiu do estoque de alguém
  for (let b = 0; b < 6; b++) {
    for (let L = 0; L < 3; L++) {
      const naMao = S.players.reduce((acc, p) => acc + p.symbols.filter((s) => s.biz === b && s.level === L).length, 0);
      ok(naMao + S.stock[b][L] === 3, 'partida ' + n + ': fichas de ' + b + '/' + L + ' não fecham em 3 (' + naMao + '+' + S.stock[b][L] + ')');
    }
  }
  const donos = S.owners.filter((o) => o != null);
  ok(donos.length === new Set(donos).size || qtd <= 3, 'partida ' + n + ': comércio com dois donos');
  if (S.winner) {
    const w = S.players.find((p) => p.name === S.winner.name);
    ok(w.cash >= S.target && w.debt === 0 && w.symbols.filter((s) => s.level === 2).length >= 3,
      'partida ' + n + ': vencedor sem cumprir a meta');
  }
  process.stdout.write(S.winner ? '.' : 'x');
}

console.log('\n\n' + N + ' partidas simuladas');
console.log('  terminadas com vencedor: ' + terminadas + '/' + N + '  (x = estourou o limite de turnos)');
console.log('  falências: ' + falencias + ' | leilões arrematados: ' + leiloes + ' | subidas de classe: ' + subidas);
console.log('  turnos na partida mais longa: ' + turnosMax);
console.log('\n' + (falhas.length
  ? 'FALHAS (' + falhas.length + '):\n - ' + [...new Set(falhas)].join('\n - ')
  : 'TUDO PASSOU'));
process.exit(falhas.length ? 1 : 0);
