/* Verificações pontuais das regras que a simulação raramente alcança:
   falência, venda forçada, exigências para subir de classe, limites de símbolos.
   Uso: node regras.mjs */
import { GameRoom } from './game.js';

const falhas = [];
const ok = (c, m) => { if (!c) falhas.push(m); console.log((c ? '  ok  ' : ' FALHA ') + m); };

async function sala(qtd = 3) {
  const mem = new Map();
  const r = new GameRoom({
    storage: { get: async (k) => mem.get(k), put: async (k, v) => { mem.set(k, v); } },
    blockConcurrencyWhile: async (fn) => fn(),
  }, {});
  await new Promise((res) => setTimeout(res, 0));
  r.push = () => {}; r.announce = () => {};
  r.S = r.newState('TEST');
  for (let i = 0; i < qtd; i++) {
    const p = r.newPlayer('bot' + i, 'Bot ' + i, false);
    p.skill = 1;
    r.S.players.push(p);
  }
  r.S.order = r.S.players.map((p) => p.pid);
  r.S.phase = 'playing';
  return r;
}

console.log('\n== falência ==');
{
  const r = await sala(2);
  const [a, b] = r.S.players;
  a.cash = 5; a.symbols = []; a.docs = [];
  a.businesses = [0]; r.S.owners[0] = a.pid;
  b.cash = 100;
  const pago = await r.forcedPayment(a, 500, b.pid, 'Impostos');
  ok(pago === false, 'quem não tem como pagar não conclui o pagamento');
  ok(a.cash === 20, 'o falido recomeça com $20 (ficou com ' + a.cash + ')');
  ok(a.level === 0 && a.pos === 0, 'o falido volta à Entrada da classe baixa');
  ok(a.businesses.length === 1 && r.S.owners[0] === a.pid, 'o falido mantém o comércio, como manda o manual');
  ok(b.cash === 105, 'o credor recebeu o que sobrou (ficou com ' + b.cash + ')');
  ok(r.S.log.some((l) => /FALÊNCIA/.test(l.m)), 'a falência foi registrada');
}

console.log('\n== venda forçada antes da falência ==');
{
  const r = await sala(2);
  const [a, b] = r.S.players;
  a.cash = 0;
  a.symbols = [{ biz: 2, level: 0 }];   // Busto de Bach
  r.S.stock[2][0] = 2;
  b.cash = 900;                          // o bot tem com que arrematar
  const antes = a.symbols.length;
  await r.forcedPayment(a, 4, null, 'Outra Compra');
  ok(a.symbols.length < antes || a.cash === 20, 'o bem foi a leilão antes de declarar falência');
  ok(r.S.log.some((l) => /Leilão/.test(l.m)), 'o leilão de emergência aconteceu');
  const naMao = r.S.players.reduce((n, p) => n + p.symbols.filter((s) => s.biz === 2 && s.level === 0).length, 0);
  ok(naMao + r.S.stock[2][0] === 3, 'as 3 fichas de Gall Arte / baixa continuam fechando');
}

console.log('\n== exigências para subir de classe ==');
{
  const r = await sala(2);
  const p = r.S.players[0];
  p.businesses = [0];
  p.cash = 1000;
  p.symbols = [{ biz: 1, level: 0 }, { biz: 2, level: 0 }];
  ok(r.promotionInfo(p) === null, 'com 2 símbolos não sobe');
  p.symbols.push({ biz: 3, level: 0 });
  let info = r.promotionInfo(p);
  ok(info && info.target === 1, 'com 3 símbolos e dinheiro, sobe para a classe média');
  ok(info.black === 20, 'sem documento, entra o mercado negro de $20');
  p.docs = ['supletivo'];
  info = r.promotionInfo(p);
  ok(info.black === 0, 'com o Supletivo, não paga mercado negro');
  p.cash = 40;
  ok(r.promotionInfo(p) === null, 'sem os $50 exigidos, não sobe');

  // símbolo do próprio comércio não conta
  p.cash = 1000;
  p.symbols = [{ biz: 0, level: 0 }, { biz: 1, level: 0 }, { biz: 2, level: 0 }];
  ok(r.promotionInfo(p) === null, 'símbolo do próprio comércio não conta para subir');
}

console.log('\n== limites de símbolos ==');
{
  const r = await sala(2);
  const p = r.S.players[0];
  p.businesses = [0];
  p.level = 1;
  ok(r.canReceiveSymbol(p, 1, 0) === false, 'não se compra símbolo de classe inferior à sua');
  ok(r.canReceiveSymbol(p, 1, 1) === true, 'símbolo da própria classe é permitido');
  ok(r.canReceiveSymbol(p, 1, 2) === true, 'símbolo de classe superior é permitido');
  ok(r.canReceiveSymbol(p, 0, 1) === false, 'não se compra símbolo do próprio comércio');
  p.symbols = [{ biz: 1, level: 1 }];
  ok(r.canReceiveSymbol(p, 1, 1) === false, 'não se repete o mesmo artigo');
  p.symbols = [{ biz: 1, level: 1 }, { biz: 2, level: 1 }, { biz: 3, level: 1 }];
  ok(r.canReceiveSymbol(p, 4, 1) === false, 'o quarto símbolo é recusado');
}

console.log('\n== subida leiloa os bens da classe anterior ==');
{
  const r = await sala(3);
  const [p, b1, b2] = r.S.players;
  p.businesses = [0]; b1.businesses = [1]; b2.businesses = [2];
  r.S.owners[0] = p.pid; r.S.owners[1] = b1.pid; r.S.owners[2] = b2.pid;
  p.cash = 1000; p.docs = ['supletivo'];
  p.symbols = [{ biz: 1, level: 0 }, { biz: 2, level: 0 }, { biz: 3, level: 0 }];
  r.S.stock[1][0]--; r.S.stock[2][0]--; r.S.stock[3][0]--;
  b1.cash = 500; b2.cash = 500;
  await r.doPromotion(p);
  ok(p.level === 1, 'subiu para a classe média');
  ok(p.symbols.every((s) => s.level >= 1), 'não restou símbolo da classe baixa com quem subiu');
  ok(p.docs.every((k) => ['faculdade', 'iate'].includes(k)), 'o documento da classe baixa saiu');
  for (const b of [1, 2, 3]) {
    const naMao = r.S.players.reduce((n, q) => n + q.symbols.filter((s) => s.biz === b && s.level === 0).length, 0);
    ok(naMao + r.S.stock[b][0] === 3, 'as fichas do comércio ' + b + ' continuam fechando em 3');
  }
}

console.log('\n== critério de vitória ==');
{
  const r = await sala(2);
  const p = r.S.players[0];
  r.S.target = 1000;
  p.cash = 1000; p.debt = 0;
  p.symbols = [{ biz: 1, level: 2 }, { biz: 2, level: 2 }, { biz: 3, level: 2 }];
  ok(r.winCheck(p) === true, 'meta + 3 símbolos da alta + sem dívida = vitória');
  p.debt = 1;
  ok(r.winCheck(p) === false, 'com dívida no cartão não vence');
  p.debt = 0; p.symbols = [{ biz: 1, level: 2 }, { biz: 2, level: 1 }, { biz: 3, level: 2 }];
  ok(r.winCheck(p) === false, 'sem os 3 símbolos da alta não vence');
}

console.log('\n== quem cai não trava a mesa ==');
{
  const r = await sala(2);
  const p = r.newPlayer('humano', 'Fulano', true);
  p.connected = false;
  r.S.players.push(p);
  const t0 = Date.now();
  const resp = await r.ask(p, { title: 'x', body: '', buttons: [{ label: 'a', value: 'a' }] }, { def: 'seguro' });
  const dt = Date.now() - t0;
  ok(resp === 'seguro', 'a resposta do desconectado é a opção segura');
  ok(dt < 5000, 'e sai rápido (' + dt + 'ms), sem esperar o cronômetro inteiro');
  ok(r.S.log.some((l) => /fora do ar/.test(l.m)), 'o registro explica que o servidor jogou por ele');
}

console.log('\n' + (falhas.length ? 'FALHAS (' + falhas.length + '):\n - ' + falhas.join('\n - ') : 'TUDO PASSOU'));
process.exit(falhas.length ? 1 : 0);
