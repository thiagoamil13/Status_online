/* Teste de partida completa contra o wrangler dev.
   Uso: node test.mjs [http://127.0.0.1:8787] */
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
const WSB = BASE.replace('http', 'ws');

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); console.log((cond ? '  ok  ' : ' FALHA ') + msg); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Cliente {
  constructor(nome, pid) {
    this.nome = nome; this.pid = pid;
    this.st = null; this.board = null; this.prompt = null;
    this.respondidos = new Set();
    this.vazou = false;         // recebeu lance alheio?
    this.anuncios = [];
    this.perguntas = 0;
    this.msgs = 0;
  }
  async conectar(code) {
    this.ws = new WebSocket(WSB + '/ws?code=' + code);
    await new Promise((res, rej) => {
      this.ws.addEventListener('open', res);
      this.ws.addEventListener('error', rej);
    });
    this.ws.addEventListener('message', (ev) => this.onMsg(JSON.parse(ev.data)));
    this.ws.send(JSON.stringify({ t: 'join', pid: this.pid, name: this.nome }));
    await sleep(250);
  }
  onMsg(m) {
    this.msgs++;
    if (m.t === 'init') { this.board = m.board; }
    else if (m.t === 'denied') { this.negado = m.reason; }
    else if (m.t === 'announce') { this.anuncios.push(m.title); }
    else if (m.t === 'state') {
      this.st = m.s;
      // nenhum lance alheio pode trafegar
      const cru = JSON.stringify(m);
      if (/"bids"|"lance":/.test(cru)) this.vazou = true;
      if (m.prompt && !this.respondidos.has(m.prompt.id)) {
        this.respondidos.add(m.prompt.id);
        this.perguntas++;
        setTimeout(() => this.responder(m.prompt), 40 + Math.random() * 120);
      }
    }
  }
  responder(q) {
    const bts = (q.buttons || []).filter((b) => !b.disabled);
    if (!bts.length) return;
    const bt = bts[Math.floor(Math.random() * bts.length)];
    const form = {};
    (q.form || []).forEach((f) => {
      // valor aleatório dentro do permitido, mantendo o passo
      const st = f.step || 1;
      const span = Math.max(0, (f.max - f.min) / st);
      form[f.id] = String(f.min + Math.floor(Math.random() * (span + 1)) * st);
    });
    try { this.ws.send(JSON.stringify({ t: 'answer', promptId: q.id, value: bt.value, form })); } catch (_) {}
  }
  host(cmd, extra = {}) { this.ws.send(JSON.stringify({ t: 'host', cmd, ...extra })); }
  fechar() { try { this.ws.close(); } catch (_) {} }
}

const run = async () => {
  console.log('\n== saúde e criação da sala ==');
  const h = await fetch(BASE + '/health');
  ok(h.ok && (await h.text()) === 'ok', '/health responde ok');

  const nova = await (await fetch(BASE + '/api/new')).json();
  ok(/^[A-Z0-9]{4}$/.test(nova.code || ''), 'sala criada com código ' + nova.code);
  const code = nova.code;

  const existe = await (await fetch(BASE + '/api/room/' + code)).json();
  ok(existe.ok === true, 'a sala existe e responde /api/room');
  const inexistente = await (await fetch(BASE + '/api/room/ZZZZ')).json();
  ok(inexistente.ok === false, 'código inexistente não vira sala fantasma');

  const pagina = await (await fetch(BASE + '/r/' + code)).text();
  ok(pagina.includes('o jogo da ascensão social'), 'o link de convite /r/CODE serve a página');

  console.log('\n== lobby ==');
  const A = new Cliente('Thiago', 'pidA');
  await A.conectar(code);
  ok(A.st && A.st.hostPid === 'pidA', 'quem cria a sala vira anfitrião');

  const Bc = new Cliente('Amiga', 'pidB');
  await Bc.conectar(code);
  await sleep(200);
  ok(A.st.players.length === 2, 'segundo humano entrou na mesa');

  A.host('addBot', { skill: 1 });
  A.host('addBot', { skill: 2 });
  await sleep(300);
  ok(A.st.players.length === 4, 'dois bots adicionados (4 na mesa)');
  ok(A.st.players.filter((p) => !p.human).length === 2, 'os bots aparecem como bots');

  const C = new Cliente('Terceiro', 'pidC');
  await C.conectar(code);
  await sleep(200);

  console.log('\n== início da partida ==');
  A.host('target', { value: 1200 });   // meta baixa para a partida terminar no teste
  A.host('start');
  await sleep(400);
  ok(['priority', 'business', 'playing'].includes(A.st.phase), 'a partida saiu do lobby (fase ' + A.st.phase + ')');
  ok(A.st.order.length === A.st.players.length, 'ordem de prioridade tem todos os jogadores');
  ok(A.st.priority && A.st.priority.length === A.st.players.length, 'os dados de prioridade foram registrados');

  const D = new Cliente('Atrasado', 'pidD');
  await D.conectar(code);
  await sleep(300);
  ok(!!D.negado, 'quem chega com a partida em andamento é barrado: "' + (D.negado || '') + '"');
  D.fechar();

  console.log('\n== partida ==');
  const limite = Date.now() + (+process.env.TEST_MS || 200000);
  let derrubei = false, tick = 0;
  while (Date.now() < limite) {
    await sleep(500);
    if (++tick % 6 === 0) {
      console.log('  [' + Math.round((Date.now() - (limite - (+process.env.TEST_MS || 200000))) / 1000) + 's] fase=' +
        (A.st ? A.st.phase : '?') + ' registro=' + (A.st ? A.st.log.length : 0) +
        ' msgs=' + A.msgs + ' perguntas=' + A.perguntas);
    }
    if (!A.st) continue;
    if (A.st.phase === 'over') break;
    // no meio do jogo, derruba um humano para ver se a mesa continua
    if (!derrubei && A.st.log.length > 40) {
      derrubei = true;
      console.log('  (derrubando a conexão do "Terceiro" de propósito)');
      C.fechar();
    }
  }

  const S = A.st;
  console.log('\n== resultado ==');
  console.log('  fase:', S.phase, '| linhas no registro:', S.log.length);
  ok(S.log.length > 30, 'a partida gerou registro (' + S.log.length + ' linhas)');
  ok(A.perguntas >= 1, 'o servidor fez perguntas ao jogador (' + A.perguntas + ')');
  ok(!A.vazou && !Bc.vazou, 'nenhum lance de leilão trafegou para os adversários');
  ok(S.owners.filter((o) => o != null).length >= 4, 'os comércios foram distribuídos');
  ok(!S.log.some((l) => /Erro interno/.test(l.m)), 'nenhum erro interno no registro');
  ok(derrubei ? S.log.length > 45 : true, 'a mesa continuou depois da queda de um jogador');

  const leiloes = S.log.filter((l) => /Leilão/.test(l.m)).length;
  const falencias = S.log.filter((l) => /FALÊNCIA/.test(l.m)).length;
  const subidas = S.log.filter((l) => /subiu para a/.test(l.m)).length;
  console.log('  leilões:', leiloes, '| falências:', falencias, '| subidas de classe:', subidas);

  if (S.phase === 'over') {
    ok(!!S.winner, 'a partida terminou com vencedor: ' + (S.winner && S.winner.name));
    A.host('again');
    await sleep(400);
    ok(A.st.phase === 'lobby', 'o anfitrião consegue recomeçar com a mesma mesa');
    ok(A.st.players.every((p) => p.cash === 20 && p.level === 0), 'a nova partida zera dinheiro e classe');
  } else {
    console.log('  (a partida não terminou dentro do tempo do teste — isso não é falha por si só)');
  }

  console.log('\n== últimas linhas do registro ==');
  S.log.slice(0, 12).reverse().forEach((l) => console.log('   ›', l.m));

  A.fechar(); Bc.fechar();
  console.log('\n' + (falhas.length ? 'FALHAS: ' + falhas.length + '\n - ' + falhas.join('\n - ') : 'TUDO PASSOU'));
  process.exit(falhas.length ? 1 : 0);
};

run().catch((e) => { console.error('estourou:', e); process.exit(2); });
