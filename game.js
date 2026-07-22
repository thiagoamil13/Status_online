/* ============================================================
   STATUS ONLINE — Durable Object da sala
   O motor da partida roda inteiro aqui. O navegador só desenha
   o tabuleiro e responde às perguntas que o servidor manda.
   ============================================================ */
import {
  CLASSES, CLASS_SHORT, SYMBOL_PRICE, OUTRA, RECEBA, TAX_MULT,
  PROMO_CASH, PROMO_BLACK, BANK_BUYBACK, BIZ, DOCS, JOCKEY_PAY,
  stockQuote, TRACKS, PLAYER_COLORS, bizIdx, symbolName, d6, fmt,
  boardPayload,
} from './rules.js';

/* Prazos das perguntas (ms). Quem não responde recebe a opção segura. */
const T = {
  turn:    90000,  // ação do jogador da vez (subir de classe / lançar)
  buy:     60000,  // compra de símbolo, documento, forma de pagamento
  bid:     45000,  // lance fechado no leilão
  join:    40000,  // entrar no Jockey / na Loteria / retirar da Bolsa
  gone:     3000,  // jogador desconectado: não segura a mesa
  announce: 2200,  // aviso sem botão (resultado de dados, etc.)
};

/* Sala sem ninguém por este tempo é apagada do disco. */
const ABANDONO_MS = 48 * 60 * 60 * 1000;

const clone = (x) => JSON.parse(JSON.stringify(x));
const chance = (x) => Math.random() < x;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const roomCode = () => {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join('');
};

export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sockets = new Set();       // {ws, pid}
    this.prompts = new Map();       // promptId -> {pid, spec, resolve, timer, deadline}
    this.promptSeq = 0;
    this.running = false;
    this.S = null;
    this.state.blockConcurrencyWhile(async () => {
      this.S = (await this.state.storage.get('S')) || null;
    });
  }

  /* ---------------- HTTP / WebSocket ---------------- */
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/create')) {
      if (this.S) return Response.json({ error: 'ocupado' }, { status: 409 });
      this.S = this.newState(url.searchParams.get('code') || roomCode());
      await this.save();
      return Response.json({ ok: true, code: this.S.code });
    }

    if (url.pathname.endsWith('/exists')) {
      return Response.json({ ok: !!this.S, phase: this.S ? this.S.phase : null });
    }

    /* Apagar a sala por dentro: aqui a permissão existe, ao contrário do
       Data Studio, que não consegue tocar na tabela interna de chave-valor. */
    if (url.pathname.endsWith('/wipe')) {
      const existia = !!this.S;
      for (const c of this.sockets) {
        try { c.ws.close(1000, 'sala encerrada pelo administrador'); } catch (_) {}
      }
      this.sockets.clear();
      this.expireAll();
      this.S = null;
      this.running = false;
      await this.state.storage.deleteAll();
      return Response.json({ ok: true, existia });
    }

    if (url.pathname.endsWith('/ws')) {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('esperava websocket', { status: 426 });
      }
      if (!this.S) return new Response('sala não existe', { status: 404 });
      const pair = new WebSocketPair();
      this.accept(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    return new Response('não encontrado', { status: 404 });
  }

  accept(ws) {
    ws.accept();
    const conn = { ws, pid: null };
    this.sockets.add(conn);
    ws.addEventListener('message', (ev) => {
      let m;
      try { m = JSON.parse(ev.data); } catch (_) { return; }
      this.onMessage(conn, m).catch((e) => this.fail(e));
    });
    const bye = () => {
      this.sockets.delete(conn);
      if (this.S) {
        this.S.ultimoContato = Date.now();
        if (!this.sockets.size) this.agendaLimpeza();
      }
      if (conn.pid && this.S) {
        const p = this.byPid(conn.pid);
        const aindaAberto = [...this.sockets].some((c) => c.pid === conn.pid);
        if (p && !aindaAberto) {
          p.connected = false;
          this.log(`${p.name} saiu da sala.`);
          this.expireFor(conn.pid);   // quem cai não segura a mesa
        }
        this.reassignHost();
      }
      this.push();
    };
    ws.addEventListener('close', bye);
    ws.addEventListener('error', bye);
  }

  fail(e) {
    this.log('Erro interno: ' + (e && e.message ? e.message : e));
    this.push();
  }

  async onMessage(conn, m) {
    const S = this.S;
    if (!S) return;

    if (m.t === 'join') {
      const pid = String(m.pid || '').slice(0, 60);
      const name = String(m.name || '').trim().slice(0, 18) || 'Jogador';
      if (!pid) return;
      let p = this.byPid(pid);
      if (!p) {
        // quem é barrado não pode ficar marcado no socket, senão continua
        // recebendo as transmissões de estado e assiste à partida de fora
        if (S.phase !== 'lobby') {
          this.send(conn.ws, { t: 'denied', reason: 'A partida já começou nesta sala.' });
          return;
        }
        if (S.players.length >= 6) {
          this.send(conn.ws, { t: 'denied', reason: 'A sala já tem 6 jogadores.' });
          return;
        }
        p = this.newPlayer(pid, name, true);
        S.players.push(p);
        if (!S.hostPid) S.hostPid = pid;
        this.log(`${name} entrou na sala.`);
      } else {
        p.name = name;
        p.connected = true;
        this.log(`${p.name} voltou.`);
      }
      conn.pid = pid;              // só agora, depois de aprovado
      S.ultimoContato = Date.now();
      await this.agendaLimpeza();
      this.reassignHost();
      await this.save();
      this.send(conn.ws, { t: 'init', board: boardPayload(), code: S.code, you: pid });
      this.push();
      // se o servidor hibernou no meio da partida, o turno recomeça daqui
      if (S.phase === 'playing' && !S.over && !this.running) {
        this.log('Partida retomada.');
        this.loop();
      }
      return;
    }

    if (!conn.pid) return;
    const me = this.byPid(conn.pid);
    if (!me) return;

    if (m.t === 'answer') {
      this.resolvePrompt(m.promptId, conn.pid, { value: m.value, form: m.form || {} });
      return;
    }

    if (m.t === 'host') {
      if (conn.pid !== S.hostPid) return;
      await this.hostCommand(m);
      return;
    }
  }

  async hostCommand(m) {
    const S = this.S;
    if (m.cmd === 'addBot' && S.phase === 'lobby' && S.players.length < 6) {
      const n = S.players.filter((p) => !p.human).length + 1;
      const skill = Math.max(0, Math.min(2, +m.skill || 1));
      const nm = ['Bot Fácil', 'Bot Médio', 'Bot Difícil'][skill] + ' ' + n;
      const b = this.newPlayer('bot:' + Date.now() + ':' + n, nm, false);
      b.skill = skill;
      S.players.push(b);
      this.log(`${nm} entrou na mesa.`);
    }
    if (m.cmd === 'remove' && S.phase === 'lobby') {
      const i = S.players.findIndex((p) => p.pid === m.pid);
      if (i >= 0 && S.players[i].pid !== S.hostPid) {
        this.log(`${S.players[i].name} foi removido da mesa.`);
        S.players.splice(i, 1);
      }
    }
    if (m.cmd === 'target' && S.phase === 'lobby') {
      S.target = Math.max(500, Math.floor(+m.value || 10000));
    }
    if (m.cmd === 'start' && S.phase === 'lobby' && S.players.length >= 2) {
      await this.beginMatch();
      return;
    }
    if (m.cmd === 'force') {
      this.expireAll();
    }
    if (m.cmd === 'again' && S.phase === 'over') {
      const keep = S.players.map((p) => ({ pid: p.pid, name: p.name, human: p.human, skill: p.skill }));
      const target = S.target, host = S.hostPid, code = S.code;
      this.S = this.newState(code);
      this.S.hostPid = host;
      this.S.target = target;
      this.S.players = keep.map((k) => {
        const p = this.newPlayer(k.pid, k.name, k.human);
        p.skill = k.skill;
        p.connected = k.human ? [...this.sockets].some((c) => c.pid === k.pid) : true;
        return p;
      });
      this.log('Nova partida — mesma mesa.');
    }
    await this.save();
    this.push();
  }

  /* ---------------- estado ---------------- */
  newState(code) {
    return {
      code, phase: 'lobby', hostPid: null,
      players: [], owners: [null, null, null, null, null, null],
      stock: BIZ.map(() => [3, 3, 3]),
      order: [], turn: 0, rolled: false, lastRoll: 0,
      investments: [], target: 10000, over: false, winner: null,
      dice: [0, 0], log: [], priority: null, pickTurn: null,
    };
  }

  newPlayer(pid, name, human) {
    return {
      pid, name, human, connected: human ? true : true, skill: human ? 1 : 1,
      color: PLAYER_COLORS[0], cash: 20, debt: 0, level: 0, pos: 0,
      businesses: [], symbols: [], docs: [], skip: 0, suspended: false, _skipAsset: {},
    };
  }

  byPid(pid) { return this.S.players.find((p) => p.pid === pid); }
  active() { return this.byPid(this.S.order[this.S.turn]); }
  track(p) { return TRACKS[p.level]; }
  spaceOf(p) { return this.track(p)[p.pos]; }
  online(p) { return !p.human || p.connected; }

  /* O comando da sala é recalculado toda vez que alguém entra, volta ou sai,
     e só pode recair sobre quem está presente. Se a sala esvazia, fica sem
     dono — nunca com um fantasma, que travaria a mesa para quem voltasse. */
  reassignHost() {
    const S = this.S;
    const cur = S.hostPid && this.byPid(S.hostPid);
    if (cur && cur.human && cur.connected) return;
    const next = S.players.find((p) => p.human && p.connected);
    S.hostPid = next ? next.pid : null;
  }

  log(msg, destaque) {
    if (!this.S) return;   // a sala pode ter sido apagada no meio de um turno
    this.S.log.unshift({ m: msg, d: !!destaque, at: Date.now() });
    if (this.S.log.length > 160) this.S.log.length = 160;
  }

  async save() {
    if (this.S) await this.state.storage.put('S', clone(this.S));
  }

  /* Há alguém de carne e osso vendo a partida? Sem isso, a mesa jogaria
     sozinha até o fim — e numa sala sem bots nunca haveria fim, porque a
     resposta automática é "não comprar" e ninguém completaria a meta. */
  temPlateia() {
    return this.S.players.some((p) => p.human && p.connected);
  }

  async agendaLimpeza() {
    try { await this.state.storage.setAlarm(Date.now() + ABANDONO_MS); } catch (_) {}
  }

  /* Dispara quando a sala passa do tempo de abandono: apaga o estado do disco.
     Se alguém apareceu nesse meio-tempo, só remarca. */
  async alarm() {
    if (!this.S) return;
    if (this.sockets.size) { await this.agendaLimpeza(); return; }
    const parado = Date.now() - (this.S.ultimoContato || 0);
    if (parado >= ABANDONO_MS) {
      await this.state.storage.deleteAll();
      this.S = null;
      return;
    }
    try { await this.state.storage.setAlarm(Date.now() + (ABANDONO_MS - parado)); } catch (_) {}
  }

  /* ---------------- envio ---------------- */
  send(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch (_) {}
  }

  publicState() {
    const S = this.S;
    return {
      code: S.code, phase: S.phase, hostPid: S.hostPid, target: S.target,
      players: S.players.map((p) => ({
        pid: p.pid, name: p.name, human: p.human, connected: p.connected, skill: p.skill,
        color: p.color, cash: p.cash, debt: p.debt, level: p.level, pos: p.pos,
        businesses: p.businesses, symbols: p.symbols, docs: p.docs,
        skip: p.skip, suspended: p.suspended,
      })),
      owners: S.owners, stock: S.stock, order: S.order, turn: S.turn,
      investments: S.investments, dice: S.dice, over: S.over, winner: S.winner,
      priority: S.priority, log: S.log.slice(0, 90),
      turnPid: S.phase === 'playing' && S.order.length ? S.order[S.turn] : null,
    };
  }

  push() {
    if (!this.S) return;
    const base = this.publicState();
    // quem está sendo esperado (sem revelar o conteúdo das respostas)
    const waiting = [...this.prompts.values()].map((q) => {
      const p = this.byPid(q.pid);
      return p ? p.name : '';
    }).filter(Boolean);
    for (const c of this.sockets) {
      if (!c.pid) continue;
      const mine = [...this.prompts.values()].find((q) => q.pid === c.pid);
      this.send(c.ws, {
        t: 'state',
        s: base,
        you: c.pid,
        waiting,
        prompt: mine ? { id: mine.id, ...mine.spec, deadline: mine.deadline } : null,
      });
    }
  }

  announce(title, body) {
    for (const c of this.sockets) {
      if (c.pid) this.send(c.ws, { t: 'announce', title, body });
    }
  }

  /* ---------------- perguntas ---------------- */
  /* spec: {title, body, buttons:[{label,cls,value,disabled}], form:[...]} */
  ask(p, spec, opts = {}) {
    const timeout = this.online(p) ? (opts.timeout || T.buy) : T.gone;
    const def = 'def' in opts ? opts.def : null;
    return new Promise((resolve) => {
      const id = 'q' + (++this.promptSeq);
      const deadline = Date.now() + timeout;
      const q = { id, pid: p.pid, spec, deadline, resolve, def, timer: null };
      q.timer = setTimeout(() => this.resolvePrompt(id, p.pid, null, true), timeout);
      this.prompts.set(id, q);
      this.push();
    });
  }

  askForm(p, spec, opts = {}) {
    return this.ask(p, { ...spec, isForm: true }, opts);
  }

  resolvePrompt(id, pid, answer, expired) {
    const q = this.prompts.get(id);
    if (!q || q.pid !== pid) return;
    clearTimeout(q.timer);
    this.prompts.delete(id);
    let out;
    if (expired || !answer) {
      out = q.def;
      const p = this.byPid(pid);
      if (p) {
        this.log(p.connected
          ? `${p.name} não respondeu a tempo; o servidor escolheu a opção segura.`
          : `${p.name} está fora do ar; o servidor jogou por ele.`);
      }
    } else if (q.spec.isForm) {
      out = { value: answer.value, form: answer.form };
    } else {
      out = answer.value;
    }
    q.resolve(out);
    this.push();
  }

  expireFor(pid) {
    for (const q of [...this.prompts.values()]) {
      if (q.pid === pid) this.resolvePrompt(q.id, pid, null, true);
    }
  }

  expireAll() {
    for (const q of [...this.prompts.values()]) this.resolvePrompt(q.id, q.pid, null, true);
  }

  /* ---------------- regras auxiliares ---------------- */
  ownBiz(p, s) { return p.businesses.includes(s.biz); }
  usefulSymbols(p, minLevel) {
    return p.symbols.filter((s) => !p.businesses.includes(s.biz) && s.level >= minLevel);
  }
  hasDocTier(p, tier) { return p.docs.some((k) => DOCS[k].tier === tier); }
  docTierKeys(tier) { return Object.keys(DOCS).filter((k) => DOCS[k].tier === tier); }

  promotionInfo(p) {
    if (p.level >= 2) return null;
    const target = p.level + 1;
    const minLvl = target === 1 ? 0 : 1;
    if (this.usefulSymbols(p, minLvl).length < 3) return null;
    const hasDoc = this.hasDocTier(p, p.level);
    const need = PROMO_CASH[target] + (hasDoc ? 0 : PROMO_BLACK[target]);
    if (p.cash < need) return null;
    return { target, hasDoc, need, black: hasDoc ? 0 : PROMO_BLACK[target] };
  }

  canReceiveSymbol(p, biz, level) {
    return p.symbols.length < 3 && level >= p.level && !p.businesses.includes(biz)
      && !p.symbols.some((s) => s.biz === biz && s.level === level);
  }
  canReceiveDoc(p, key) { return DOCS[key].tier >= p.level && !p.docs.includes(key); }
  eligibleForAsset(p, a) {
    return a.kind === 'symbol' ? this.canReceiveSymbol(p, a.biz, a.level) : this.canReceiveDoc(p, a.doc);
  }
  assetsOf(p) {
    const a = p.symbols.map((s) => ({
      kind: 'symbol', biz: s.biz, level: s.level, key: 's' + s.biz + '_' + s.level,
      name: symbolName(s) + ' (' + BIZ[s.biz].name + ')', base: SYMBOL_PRICE[s.level],
    }));
    p.docs.forEach((k) => a.push({ kind: 'doc', doc: k, key: 'd' + k, name: DOCS[k].name, base: DOCS[k].cost }));
    return a;
  }
  removeAsset(p, a) {
    if (a.kind === 'symbol') {
      const i = p.symbols.findIndex((s) => s.biz === a.biz && s.level === a.level);
      if (i >= 0) p.symbols.splice(i, 1);
    } else {
      const i = p.docs.indexOf(a.doc);
      if (i >= 0) p.docs.splice(i, 1);
    }
  }
  giveAsset(p, a) {
    if (a.kind === 'symbol') p.symbols.push({ biz: a.biz, level: a.level });
    else p.docs.push(a.doc);
  }
  returnAssetToBank(a) { if (a.kind === 'symbol') this.S.stock[a.biz][a.level]++; }
  winCheck(p) {
    return p.cash >= this.S.target && p.debt === 0 && p.symbols.filter((s) => s.level === 2).length >= 3;
  }
  credName(pid) { return pid == null ? 'o Banco' : (this.byPid(pid) || { name: '?' }).name; }
  /* "ao Banco", mas "a Fulano" — a crase só existe com o artigo do Banco */
  credPara(pid) { return pid == null ? 'ao Banco' : 'a ' + this.credName(pid); }
  transfer(p, amount, creditorPid) {
    p.cash -= amount;
    if (creditorPid != null) { const c = this.byPid(creditorPid); if (c) c.cash += amount; }
  }

  /* ---------------- pagamentos e falência ---------------- */
  async forcedPayment(p, amount, creditorPid, desc) {
    while (p.cash < amount) {
      const assets = this.assetsOf(p);
      if (!assets.length) { await this.bankruptcy(p, creditorPid, desc); return false; }
      let asset;
      if (p.human) {
        const list = this.assetsOf(p).filter((a) => !(p._skipAsset && p._skipAsset[a.key]));
        if (!list.length) { await this.bankruptcy(p, creditorPid, desc); return false; }
        asset = await this.ask(p, {
          title: 'Leiloar um bem',
          body: `<p><b>${desc}</b>: ${fmt(amount)} — você tem ${fmt(p.cash)}.</p>
                 <p>O manual exige leiloar seus bens antes de declarar falência. Faltam <b>${fmt(amount - p.cash)}</b>.</p>`,
          buttons: list.map((a) => ({ label: a.name, value: a.key })),
        }, { timeout: T.buy, def: list[0].key });
        asset = list.find((a) => a.key === asset) || list[0];
      } else {
        asset = this.botPickAsset(p);
      }
      if (!asset) { await this.bankruptcy(p, creditorPid, desc); return false; }
      const sold = await this.auctionAsset(p, asset, { reason: `venda de emergência (${desc})` });
      if (!sold) {
        p._skipAsset = p._skipAsset || {};
        p._skipAsset[asset.key] = true;
        const sellable = this.assetsOf(p).filter((a) => !p._skipAsset[a.key]);
        if (!sellable.length) { await this.bankruptcy(p, creditorPid, desc); return false; }
      }
    }
    p._skipAsset = {};
    this.transfer(p, amount, creditorPid);
    this.log(`${p.name} pagou ${fmt(amount)} (${desc}) ${this.credPara(creditorPid)}.`);
    return true;
  }

  async bankruptcy(p, creditorPid, desc) {
    const S = this.S;
    const inv = S.investments.find((v) => v.owner === p.pid);
    if (inv) { p.cash += inv.value; S.investments = S.investments.filter((v) => v !== inv); }
    const moved = Math.max(0, p.cash);
    if (creditorPid != null) { const c = this.byPid(creditorPid); if (c) c.cash += moved; }
    p.symbols.forEach((s) => S.stock[s.biz][s.level]++);
    p.symbols = []; p.docs = []; p.cash = 20; p.debt = 0;
    p.level = 0; p.pos = 0; p.skip = 0; p.suspended = false; p._skipAsset = {};
    this.log(`FALÊNCIA: ${p.name} não cobriu "${desc}". ${fmt(moved)} foi para ${this.credName(creditorPid)}; símbolos e documentos voltaram. Recomeça na classe baixa com $20.`, true);
    this.announce('Falência!', `<p><b>${p.name}</b> não conseguiu pagar <b>${desc}</b>.</p><p>Recomeça na Entrada da classe baixa com $20, mantendo os comércios.</p>`);
    this.push();
    await sleep(T.announce);
  }

  /* ---------------- leilão de lances fechados ---------------- */
  async auctionAsset(seller, asset, { eligiblePids = null, bankPrice = 0, reason = '' } = {}) {
    const S = this.S;
    const bidders = S.players.filter((x) => x.pid !== seller.pid && !x.suspended && x.cash > 0
      && (!eligiblePids || eligiblePids.includes(x.pid)) && this.eligibleForAsset(x, asset));

    // todos ofertam ao mesmo tempo; ninguém vê o lance do outro
    const bids = [];
    await Promise.all(bidders.map(async (b) => {
      let v = 0;
      if (b.human) {
        const r = await this.askForm(b, {
          title: `Leilão — ${asset.name}`,
          body: `<p><b>${seller.name}</b> leiloa <b>${asset.name}</b>${reason ? ` (${reason})` : ''}.</p>
                 <p>Lance fechado: ninguém vê a sua oferta. Você tem ${fmt(b.cash)}.</p>`,
          form: [{ id: 'bid', label: 'Sua oferta', type: 'number', min: 0, max: b.cash, step: 1, value: 0 }],
          buttons: [{ label: 'Ofertar', cls: 'gold', value: 'ok' }, { label: 'Não ofertar', cls: 'plain', value: 'no' }],
        }, { timeout: T.bid, def: { value: 'no', form: {} } });
        v = r && r.value === 'ok' ? Math.max(0, Math.min(b.cash, Math.floor(+r.form.bid || 0))) : 0;
      } else {
        v = this.botBid(b, asset);
      }
      if (v > 0) bids.push({ p: b, v });
    }));

    bids.sort((a, b) => b.v - a.v);
    let win = null;
    if (bids.length) {
      const top = bids.filter((x) => x.v === bids[0].v);
      win = top.length === 1 ? top[0] : top[Math.floor(Math.random() * top.length)];
    }
    if (win) {
      win.p.cash -= win.v; seller.cash += win.v;
      this.removeAsset(seller, asset); this.giveAsset(win.p, asset);
      this.log(`Leilão: ${win.p.name} arrematou ${asset.name} por ${fmt(win.v)}.`, true);
      this.announce('Leilão encerrado', `<p><b>${win.p.name}</b> arrematou <b>${asset.name}</b> por ${fmt(win.v)}.</p>`);
      this.push(); await sleep(T.announce);
      return true;
    }
    if (bankPrice > 0 && asset.kind === 'symbol') {
      this.removeAsset(seller, asset); this.returnAssetToBank(asset); seller.cash += bankPrice;
      this.log(`Sem ofertas: o Banco resgatou ${asset.name} por ${fmt(bankPrice)}.`);
      this.push();
      return true;
    }
    this.log(`Leilão sem ofertas por ${asset.name}.`);
    this.push();
    return false;
  }

  /* ---------------- ascensão de classe ---------------- */
  async doPromotion(p, { free = false } = {}) {
    const target = p.level + 1;
    if (target > 2) return;
    if (!free) {
      const info = this.promotionInfo(p);
      if (!info) return;
      if (!info.hasDoc) {
        const keys = this.docTierKeys(p.level);
        let key;
        if (p.human) {
          key = await this.ask(p, {
            title: 'Mercado negro',
            body: `<p>Você não tem diploma nem título da ${CLASSES[p.level]}. Compre um no mercado negro por ${fmt(info.black)} para poder subir.</p>`,
            buttons: keys.map((k) => ({ label: DOCS[k].name + ` — ${fmt(info.black)}`, cls: 'gold', value: k }))
              .concat([{ label: 'Desistir da subida', cls: 'plain', value: null }]),
          }, { timeout: T.buy, def: null });
          if (!key) return;
        } else key = keys[0];
        p.cash -= info.black; p.docs.push(key);
        this.log(`${p.name} comprou ${DOCS[key].name} no mercado negro por ${fmt(info.black)}.`);
      }
    }
    p.level = target; p.pos = 0;
    this.log(`${p.name} subiu para a ${CLASSES[target]}${free ? ' pelo Golpe do Baú' : ''}!`, true);
    this.announce('Ascensão social', `<p><b>${p.name}</b> agora é da <b>${CLASSES[target]}</b>.</p><p>Os bens da classe anterior vão a leilão.</p>`);
    this.push(); await sleep(T.announce);

    for (;;) {
      const s = p.symbols.find((x) => x.level < target);
      if (!s) break;
      const asset = {
        kind: 'symbol', biz: s.biz, level: s.level, key: 's' + s.biz + '_' + s.level,
        name: symbolName(s) + ' (' + BIZ[s.biz].name + ')', base: SYMBOL_PRICE[s.level],
      };
      const elig = this.S.players.filter((x) => x.pid !== p.pid && x.level <= s.level).map((x) => x.pid);
      const sold = await this.auctionAsset(p, asset, { eligiblePids: elig, bankPrice: BANK_BUYBACK[target], reason: 'subida de classe' });
      if (!sold) { this.removeAsset(p, asset); this.returnAssetToBank(asset); this.log(`${asset.name} voltou ao estoque sem resgate.`); }
    }
    for (;;) {
      const k = p.docs.find((x) => DOCS[x].tier < target);
      if (!k) break;
      const asset = { kind: 'doc', doc: k, key: 'd' + k, name: DOCS[k].name, base: DOCS[k].cost };
      const sold = await this.auctionAsset(p, asset, { reason: 'subida de classe' });
      if (!sold) { this.removeAsset(p, asset); this.log(`${p.name} devolveu ${DOCS[k].name} (o Banco não paga por documentos).`); }
    }
    this.push();
  }

  /* ---------------- resolução das casas ---------------- */
  async resolveSpace(p) {
    const sp = this.spaceOf(p);
    switch (sp.t) {
      case 'biz': return this.resolveBiz(p, bizIdx(sp.id));
      case 'liquida': return this.resolveLiquida(p);
      case 'tax': {
        const a = d6(), b = d6(), val = (a + b) * TAX_MULT[p.level];
        this.S.dice = [a, b];
        this.log(`${p.name} tirou ${a}+${b} nos Impostos: ${a + b} × ${TAX_MULT[p.level]} = ${fmt(val)}.`);
        this.announce('Impostos', `<p>${p.name} tirou <b>${a} + ${b}</b> × ${TAX_MULT[p.level]}</p><p>Paga <b>${fmt(val)}</b> ao Banco — impostos não aceitam cartão.</p>`);
        this.push(); await sleep(T.announce);
        return this.forcedPayment(p, val, null, 'Impostos');
      }
      case 'dietax': {
        const d = d6(), val = d * sp.mult;
        this.log(`${p.name} tirou ${d} na ${sp.nome}: ${d} × ${sp.mult} = ${fmt(val)}.`);
        this.announce(sp.nome, `<p>Dado: <b>${d}</b> × ${sp.mult}</p><p>${p.name} paga <b>${fmt(val)}</b> ao Banco.</p>`);
        this.push(); await sleep(T.announce);
        return this.forcedPayment(p, val, null, sp.nome);
      }
      case 'ganho':
        p.cash += sp.amt;
        this.log(`${p.name} parou em "${sp.label.split('\n')[0]}" e recebeu ${fmt(sp.amt)}.`);
        return;
      case 'funeral':
        p.cash += 20; p.skip = 1; p.suspended = true;
        this.log(`${p.name} herdou $20 no Funeral da Vovó, perde 1 volta e fica com os negócios suspensos.`, true);
        return;
      case 'golpe': {
        if (p.level >= 2) { this.log('Golpe do Baú sem efeito: já está na classe alta.'); return; }
        let go = true;
        if (p.human) {
          go = await this.ask(p, {
            title: 'Golpe do Baú',
            body: `<p>Casamento rico! Você pode passar direto para a <b>${CLASSES[p.level + 1]}</b>, sem nenhuma exigência.</p>
                   <p class="mini">Seus símbolos e documentos da classe atual irão a leilão, como manda o manual.</p>`,
            buttons: [{ label: 'Dar o golpe!', cls: 'gold', value: true }, { label: 'Ficar onde estou', cls: 'plain', value: false }],
          }, { timeout: T.buy, def: false });
        }
        if (!go) return;
        return this.doPromotion(p, { free: true });
      }
      case 'desquite': {
        const val = this.S.lastRoll * sp.mult;
        const dest = Math.max(0, p.level - 1);
        this.announce('Desquite', `<p>${p.name} paga pensão de <b>${fmt(val)}</b> (${this.S.lastRoll} × ${sp.mult}) e desce para a <b>${CLASSES[dest]}</b>.</p>`);
        this.push(); await sleep(T.announce);
        const ok = await this.forcedPayment(p, val, null, 'Desquite (pensão)');
        if (!ok) return;
        p.docs = []; p.level = dest; p.pos = 0;
        this.log(`${p.name} desquitou-se: devolveu documentos e voltou à ${CLASSES[dest]}.`, true);
        return;
      }
      case 'doc': return this.resolveDoc(p, sp.doc);
      case 'jockey': return this.resolveJockey(p);
      case 'bolsa': return this.resolveBolsa(p);
      case 'loteca': {
        const val = this.S.lastRoll * sp.mult;
        p.cash += val;
        this.log(`${p.name} acertou na Loteca: ${this.S.lastRoll} × ${sp.mult} = ${fmt(val)}.`, true);
        this.announce('Loteca', `<p><b>${p.name}</b> ganhou ${this.S.lastRoll} × ${sp.mult} = <b>${fmt(val)}</b>!</p>`);
        this.push(); await sleep(T.announce);
        return;
      }
      case 'grande': {
        const a = d6(), b = d6();
        this.S.dice = [a, b];
        const val = a === b ? 100 : ((a + b) % 2 === 0 ? 20 : 5);
        p.cash += val;
        const how = a === b ? 'dobradinha!' : ((a + b) % 2 === 0 ? 'soma par' : 'soma ímpar');
        this.log(`${p.name} no Grande Prêmio: ${a}+${b} → ${how} — recebe ${fmt(val)}.`);
        this.announce('Grande Prêmio', `<p>Dados: <b>${a} + ${b}</b> — ${how}</p><p><b>${p.name}</b> recebe ${fmt(val)}.</p>`);
        this.push(); await sleep(T.announce);
        return;
      }
      case 'loteria': return this.resolveLoteria(p);
      default: return;
    }
  }

  async payForPurchase(p, price, creditorPid, what) {
    let method = 'cash';
    if (p.human) {
      method = await this.ask(p, {
        title: 'Forma de pagamento',
        body: `<p><b>${what}</b> — ${fmt(price)} para ${this.credName(creditorPid)}.</p>`,
        buttons: [
          { label: `Dinheiro (${fmt(p.cash)} disponível)`, cls: 'gold', value: 'cash', disabled: p.cash < price },
          { label: `Cartão de crédito <small>(dívida atual ${fmt(p.debt)} — quita na Liquidação com +10%)</small>`, value: 'credit' },
        ],
      }, { timeout: T.buy, def: p.cash >= price ? 'cash' : 'credit' });
    } else {
      method = this.botPayMethod(p, price);
    }
    if (method === 'cash' && p.cash >= price) {
      this.transfer(p, price, creditorPid);
      this.log(`${p.name} pagou ${fmt(price)} em dinheiro por ${what}.`);
    } else {
      p.debt += price;
      if (creditorPid != null) { const c = this.byPid(creditorPid); if (c) c.cash += price; }
      this.log(`${p.name} comprou ${what} no cartão de crédito (dívida: ${fmt(p.debt)}).`);
    }
  }

  async resolveBiz(p, idx) {
    const S = this.S;
    const ownerPid = S.owners[idx];
    const biz = BIZ[idx];
    if (ownerPid === p.pid) { this.log(`${p.name} parou no próprio comércio (${biz.name}); nada acontece.`); return; }
    const owner = ownerPid == null ? null : this.byPid(ownerPid);
    if (owner && owner.suspended) { this.log(`${biz.name} está fechada (luto de ${owner.name}); sem transação.`); return; }
    const levels = [0, 1, 2].filter((L) => L >= p.level && S.stock[idx][L] > 0 && this.canReceiveSymbol(p, idx, L));
    let choice;
    if (p.human) {
      const opts = levels.map((L) => ({
        label: `Comprar ${biz.products[L]} — ${fmt(SYMBOL_PRICE[L])} <small>(símbolo da ${CLASSES[L]})</small>`,
        cls: 'gold', value: 'buy' + L,
      }));
      opts.push({ label: `Outra compra — ${fmt(OUTRA[p.level])} <small>(obrigatória se não levar símbolo; só dinheiro)</small>`, value: 'outra' });
      const r = await this.ask(p, {
        title: biz.name,
        body: `<p>Proprietário: <b>${owner ? owner.name : 'Banco'}</b>.</p>
               ${p.symbols.length >= 3 ? '<div class="notice">Você já tem 3 símbolos — só resta a Outra Compra.</div>' : ''}
               <p class="mini">Você pode comprar o símbolo da sua classe ou de classe superior. Máximo de 3 símbolos, sem repetir artigo.</p>`,
        buttons: opts,
      }, { timeout: T.buy, def: 'outra' });
      choice = r === 'outra' || r == null ? { outra: true } : { buy: +String(r).slice(3) };
    } else {
      choice = this.botBuyChoice(p, idx, levels);
    }
    if (choice.buy != null) {
      const L = choice.buy;
      await this.payForPurchase(p, SYMBOL_PRICE[L], ownerPid, `${biz.products[L]} (${biz.name})`);
      S.stock[idx][L]--; p.symbols.push({ biz: idx, level: L });
      this.log(`${p.name} agora exibe ${biz.products[L]} — símbolo da ${CLASSES[L]}.`);
    } else {
      await this.forcedPayment(p, OUTRA[p.level], ownerPid, `Outra Compra na ${biz.name}`);
    }
    this.push();
  }

  async resolveDoc(p, key) {
    const doc = DOCS[key];
    if (this.hasDocTier(p, doc.tier)) { this.log(`${p.name} já tem diploma/título da ${CLASSES[doc.tier]}; casa ignorada.`); return; }
    let buy;
    if (p.human) {
      buy = await this.ask(p, {
        title: doc.name,
        body: `<p>Adquira <b>${doc.name}</b> por ${fmt(doc.cost)} — necessário (ou equivalente) para subir de classe.</p>`,
        buttons: [{ label: `Comprar — ${fmt(doc.cost)}`, cls: 'gold', value: true }, { label: 'Não comprar', cls: 'plain', value: false }],
      }, { timeout: T.buy, def: false });
    } else buy = this.botBuyDoc(p);
    if (!buy) { this.log(`${p.name} não quis ${doc.name}.`); return; }
    await this.payForPurchase(p, doc.cost, null, doc.name);
    p.docs.push(key);
    this.push();
  }

  async resolveLiquida(p) {
    if (p.debt <= 0) { this.log(`${p.name} não tem dívida no cartão; nada a liquidar.`); return; }
    const total = Math.round(p.debt * 1.1 * 100) / 100;
    this.log(`${p.name} caiu na Liquidação do Débito: ${fmt(p.debt)} + 10% = ${fmt(total)}.`, true);
    this.announce('Liquidação do Débito', `<p><b>${p.name}</b> quita a dívida do cartão: ${fmt(p.debt)} + 10% = <b>${fmt(total)}</b>.</p>`);
    this.push(); await sleep(T.announce);
    const ok = await this.forcedPayment(p, total, null, 'Liquidação do Débito');
    if (ok) p.debt = 0;
    this.push();
  }

  /* ---------- Jockey ---------- */
  async resolveJockey(p) {
    if (p.cash <= 0) { this.log(`${p.name} está sem dinheiro para o Jockey.`); return; }
    let horse, stake;
    if (p.human) {
      const r = await this.askForm(p, {
        title: 'Jockey Club',
        body: `<p>Escolha um cavalo (2 a 12) e o valor da aposta. Os demais podem apostar no <b>mesmo</b> cavalo. Três lançamentos: 1º lugar paga mais.</p>
               <div class="notice">Você tem <b>${fmt(p.cash)}</b> disponíveis.</div>`,
        form: [
          { id: 'horse', label: 'Cavalo nº', type: 'number', min: 2, max: 12, step: 1, value: 7 },
          { id: 'stake', label: 'Aposta', type: 'number', min: 1, max: p.cash, step: 1, value: Math.min(10, p.cash) },
        ],
        buttons: [{ label: 'Abrir apostas', cls: 'gold', value: 'go' }, { label: 'Não apostar', cls: 'plain', value: 'no' }],
      }, { timeout: T.buy, def: { value: 'no', form: {} } });
      if (!r || r.value === 'no') return;
      horse = Math.max(2, Math.min(12, Math.floor(+r.form.horse || 7)));
      stake = Math.max(1, Math.min(p.cash, Math.floor(+r.form.stake || 0)));
      if (!stake) return;
    } else {
      const bet = this.botJockeyInit(p);
      if (!bet) return;
      horse = bet.horse; stake = bet.stake;
    }
    this.log(`${p.name} aposta ${fmt(stake)} no cavalo ${horse}.`);
    this.push();

    const bets = [{ p, stake }];
    const others = this.S.players.filter((o) => o.pid !== p.pid && !o.suspended && o.cash > 0);
    await Promise.all(others.map(async (o) => {
      let v = 0;
      if (o.human) {
        const r = await this.askForm(o, {
          title: 'Jockey — apostas abertas',
          body: `<p>${p.name} apostou ${fmt(stake)} no cavalo <b>${horse}</b>. Quer apostar junto?</p>
                 <div class="notice">Você tem <b>${fmt(o.cash)}</b>.</div>`,
          form: [{ id: 'st', label: 'Sua aposta (0 = não)', type: 'number', min: 0, max: o.cash, step: 1, value: 0 }],
          buttons: [{ label: 'Confirmar', cls: 'gold', value: 'ok' }, { label: 'Ficar de fora', cls: 'plain', value: 'no' }],
        }, { timeout: T.join, def: { value: 'no', form: {} } });
        v = r && r.value === 'ok' ? Math.max(0, Math.min(o.cash, Math.floor(+r.form.st || 0))) : 0;
      } else {
        v = this.botJockeyJoin(o);
      }
      if (v > 0) { bets.push({ p: o, stake: v }); this.log(`${o.name} acompanha com ${fmt(v)} no cavalo ${horse}.`); }
    }));

    const rolls = []; let place = -1;
    for (let i = 0; i < 3; i++) { const s = d6() + d6(); rolls.push(s); if (s === horse) { place = i; break; } }
    if (place >= 0) {
      const mult = JOCKEY_PAY[horse][place];
      bets.forEach((b) => { b.p.cash += b.stake * mult; });
      this.log(`Jockey: cavalo ${horse} chegou em ${place + 1}º (${rolls.join(' · ')}). Paga ${mult} para 1 — apostas conservadas!`, true);
      this.announce('Resultado do Jockey', `<p>Lançamentos: <b>${rolls.join(' · ')}</b></p>
        <p>O cavalo <b>${horse}</b> chegou em <b>${place + 1}º</b> — paga ${mult} para 1.</p>
        ${bets.map((b) => `<p class="mini">${b.p.name}: +${fmt(b.stake * mult)}</p>`).join('')}`);
    } else {
      bets.forEach((b) => { b.p.cash -= b.stake; });
      this.log(`Jockey: cavalo ${horse} não chegou (${rolls.join(' · ')}). Apostas para o Banco.`);
      this.announce('Resultado do Jockey', `<p>Lançamentos: <b>${rolls.join(' · ')}</b></p><p>O cavalo <b>${horse}</b> não se classificou. Apostas para o Banco.</p>`);
    }
    this.push(); await sleep(T.announce + 900);
  }

  /* ---------- Bolsa ---------- */
  async resolveBolsa(p) {
    const S = this.S;
    if (S.investments.some((v) => v.owner === p.pid)) { this.log(`${p.name} já tem dinheiro na Bolsa.`); return; }
    const max = Math.floor(p.cash / 10) * 10;
    if (max < 10) { this.log(`${p.name} não tem $10 para investir.`); return; }
    let amt = 0;
    if (p.human) {
      const r = await this.askForm(p, {
        title: 'Bolsa de Valores',
        body: `<p>Invista um múltiplo de $10. Seu dinheiro entra na cotação <b>7</b>; cada jogada dos adversários muda a cotação (2 = perde tudo … 12 = 11×). Você decide quando retirar — ou retira obrigatoriamente quando a rodada completar.</p>
               <div class="notice">Você tem <b>${fmt(p.cash)}</b> disponíveis.</div>`,
        form: [{ id: 'amt', label: 'Investimento', type: 'number', min: 10, max, step: 10, value: Math.min(50, max) }],
        buttons: [{ label: 'Investir', cls: 'gold', value: 'go' }, { label: 'Não investir', cls: 'plain', value: 'no' }],
      }, { timeout: T.buy, def: { value: 'no', form: {} } });
      if (!r || r.value === 'no') return;
      amt = Math.max(10, Math.min(max, Math.floor((+r.form.amt || 0) / 10) * 10));
    } else {
      amt = this.botBolsaInvest(p, max);
      if (!amt) return;
    }
    p.cash -= amt;
    S.investments.push({ owner: p.pid, amount: amt, value: amt, rounds: 0 });
    this.log(`${p.name} investiu ${fmt(amt)} na Bolsa (cotação inicial 7).`);
    this.push();
  }

  async updateInvestments(sum, rollerPid) {
    const S = this.S;
    const list = S.investments.filter((v) => v.owner !== rollerPid);
    if (!list.length) return;
    for (const inv of list) {
      inv.value = Math.round(stockQuote(inv.amount, sum) * 100) / 100;
      inv.rounds++;
      const o = this.byPid(inv.owner);
      if (o) this.log(`Bolsa: cotação ${sum} — as ações de ${o.name} valem ${fmt(inv.value)}.`);
    }
    this.push();
    await Promise.all(list.map(async (inv) => {
      const o = this.byPid(inv.owner);
      if (!o) return;
      let out;
      if (o.human) {
        out = await this.ask(o, {
          title: 'Bolsa de Valores',
          body: `<p>Cotação <b>${sum}</b>: seu investimento de ${fmt(inv.amount)} vale agora <b>${fmt(inv.value)}</b>.</p>`,
          buttons: [{ label: `Retirar ${fmt(inv.value)}`, cls: 'gold', value: true }, { label: 'Manter investido', cls: 'plain', value: false }],
        }, { timeout: T.join, def: false });
      } else out = this.botBolsaCashOut(inv, o);
      if (out) {
        o.cash += inv.value;
        S.investments = S.investments.filter((v) => v !== inv);
        this.log(`${o.name} retirou ${fmt(inv.value)} da Bolsa.`);
      }
    }));
    this.push();
  }

  /* ---------- Loteria ---------- */
  async resolveLoteria(p) {
    if (p.cash <= 0) { this.log(`${p.name} está sem dinheiro para a Loteria.`); return; }
    let stake = 0;
    if (p.human) {
      const r = await this.askForm(p, {
        title: 'Loteria',
        body: `<p>Defina a contribuição. Quem quiser participar paga o mesmo valor; todos lançam 2 dados e o maior resultado leva o bolo. Se ninguém aderir, nada acontece.</p>
               <div class="notice">Você tem <b>${fmt(p.cash)}</b> disponíveis.</div>`,
        form: [{ id: 'st', label: 'Contribuição', type: 'number', min: 1, max: p.cash, step: 1, value: Math.min(10, p.cash) }],
        buttons: [{ label: 'Convidar jogadores', cls: 'gold', value: 'go' }, { label: 'Não jogar', cls: 'plain', value: 'no' }],
      }, { timeout: T.buy, def: { value: 'no', form: {} } });
      if (!r || r.value === 'no') return;
      stake = Math.max(1, Math.min(p.cash, Math.floor(+r.form.st || 0)));
    } else {
      stake = this.botLoteriaInit(p);
      if (!stake) return;
    }
    this.log(`${p.name} propõe uma Loteria de ${fmt(stake)} por cabeça.`);
    this.push();

    const joiners = [p];
    const others = this.S.players.filter((o) => o.pid !== p.pid && !o.suspended && o.cash >= stake);
    await Promise.all(others.map(async (o) => {
      let j;
      if (o.human) {
        j = await this.ask(o, {
          title: 'Loteria',
          body: `<p>${p.name} propôs uma loteria: contribuição de <b>${fmt(stake)}</b>, maior resultado nos dados leva tudo.</p>`,
          buttons: [{ label: 'Entrar', cls: 'gold', value: true }, { label: 'Ficar de fora', cls: 'plain', value: false }],
        }, { timeout: T.join, def: false });
      } else j = this.botLoteriaJoin(o, stake);
      if (j) joiners.push(o);
    }));

    if (joiners.length === 1) { this.log(`Ninguém aderiu à Loteria de ${p.name}; ele não ganha nem perde.`); return; }
    joiners.forEach((j) => { j.cash -= stake; });
    const pool = joiners.map((j) => ({ p: j, roll: d6() + d6() }));
    let res = [...pool];
    for (;;) {
      const best = Math.max(...res.map((r) => r.roll));
      const tied = res.filter((r) => r.roll === best);
      if (tied.length === 1) { res = tied; break; }
      res = tied.map((t) => ({ p: t.p, roll: d6() + d6() }));
    }
    const winner = res[0].p, pot = stake * joiners.length;
    winner.cash += pot;
    this.log(`Loteria: ${pool.map((r) => `${r.p.name} ${r.roll}`).join(', ')} → ${winner.name} leva ${fmt(pot)}!`, true);
    this.announce('Resultado da Loteria', `<p>${pool.map((r) => `${r.p.name}: <b>${r.roll}</b>`).join('<br>')}</p><p><b>${winner.name}</b> leva o bolo de <b>${fmt(pot)}</b>.</p>`);
    this.push(); await sleep(T.announce + 600);
  }

  /* ---------------- turno e laço ---------------- */
  async playTurn() {
    const S = this.S;
    const p = this.active();
    S.rolled = false;
    S.dice = [0, 0];
    this.push();

    const inv = S.investments.find((v) => v.owner === p.pid);
    if (inv) {
      p.cash += inv.value;
      S.investments = S.investments.filter((v) => v !== inv);
      this.log(`${p.name} retirou obrigatoriamente ${fmt(inv.value)} da Bolsa (rodada completa).`);
      this.push();
    }
    if (p.skip > 0) {
      p.skip--;
      this.log(`${p.name} está de luto e perde esta volta.`);
      this.push(); await sleep(900);
      return;
    }
    if (p.suspended) { p.suspended = false; this.log(`${p.name} voltou ao jogo; seus negócios reabriram.`); }

    // antes dos dados: subir de classe
    if (p.human) {
      for (;;) {
        const info = this.promotionInfo(p);
        const act = await this.ask(p, {
          title: 'Sua vez',
          body: `<p>${CLASSES[p.level]} · ${fmt(p.cash)}${p.debt ? ' · dívida ' + fmt(p.debt) : ''}</p>
                 ${info ? `<div class="notice">Você pode subir para a <b>${CLASSES[info.target]}</b> agora, por ${fmt(info.need)}${info.black ? ' (inclui o documento no mercado negro)' : ''}.</div>` : ''}`,
          buttons: [
            { label: '🎲 Lançar os dados', cls: 'gold', value: 'roll' },
            { label: 'Subir de classe', value: 'ascend', disabled: !info },
          ],
          isTurn: true,
        }, { timeout: T.turn, def: 'roll' });
        if (act === 'ascend' && this.promotionInfo(p)) { await this.doPromotion(p); continue; }
        break;
      }
    } else {
      await sleep(650);
      // Difícil e Médio sobem assim que podem; Fácil às vezes perde a deixa.
      if (this.promotionInfo(p) && (this.sk(p) > 0 || chance(0.6))) await this.doPromotion(p);
    }

    const a = d6(), b = d6(), sum = a + b;
    S.dice = [a, b]; S.lastRoll = sum; S.rolled = true;
    this.log(`${p.name} lançou ${a} + ${b} = ${sum}.`);
    this.push(); await sleep(700);

    await this.updateInvestments(sum, p.pid);

    const tr = this.track(p);
    for (let i = 0; i < sum; i++) {
      p.pos = (p.pos + 1) % tr.length;
      const sp = tr[p.pos];
      if (sp.t === 'receba') {
        p.cash += RECEBA[p.level];
        this.log(`${p.name} passou pelos Rendimentos: +${fmt(RECEBA[p.level])}.`);
      }
      this.push();
      await sleep(160);
    }
    const sp = this.spaceOf(p);
    this.log(`${p.name} parou em ${sp.t === 'biz' ? BIZ[bizIdx(sp.id)].name : sp.label.split('\n')[0]}.`);
    this.push(); await sleep(500);
    await this.resolveSpace(p);
    this.push();
  }

  async beginMatch() {
    const S = this.S;
    S.phase = 'priority';
    // menor soma escolhe primeiro (empates: relança entre os empatados)
    const pool = S.players.map((p) => ({ pid: p.pid, name: p.name, rolls: [d6() + d6()] }));
    for (let guard = 0; guard < 50; guard++) {
      const groups = {};
      pool.forEach((r) => { const k = r.rolls.join('-'); (groups[k] = groups[k] || []).push(r); });
      const tied = Object.values(groups).filter((g) => g.length > 1);
      if (!tied.length) break;
      tied.forEach((g) => g.forEach((r) => r.rolls.push(d6() + d6())));
    }
    pool.sort((x, y) => {
      for (let i = 0; i < Math.max(x.rolls.length, y.rolls.length); i++) {
        const d = (x.rolls[i] ?? 99) - (y.rolls[i] ?? 99);
        if (d) return d;
      }
      return 0;
    });
    S.order = pool.map((r) => r.pid);
    S.priority = pool.map((r) => ({ name: r.name, rolls: r.rolls }));
    S.players.forEach((p, i) => { p.color = PLAYER_COLORS[i % PLAYER_COLORS.length]; });
    this.log('Ordem definida: o menor resultado escolhe primeiro.', true);
    this.push();
    await this.save();
    await sleep(2600);
    await this.businessPhase();
    S.phase = 'playing';
    S.turn = 0;
    this.log(`Partida iniciada — meta de ${fmt(S.target)}. ${this.active().name} começa.`, true);
    await this.save();
    this.push();
    this.loop();
  }

  async businessPhase() {
    const S = this.S;
    S.phase = 'business';
    const picksEach = S.players.length <= 3 ? 2 : 1;
    for (let round = 0; round < picksEach; round++) {
      for (const pid of S.order) {
        const p = this.byPid(pid);
        const free = BIZ.map((b, i) => i).filter((i) => S.owners[i] == null);
        if (!free.length) break;
        let pick;
        if (p.human) {
          S.pickTurn = pid;
          this.push();
          const r = await this.ask(p, {
            title: 'Escolha do comércio',
            body: `<p>Escolha ${round ? 'seu segundo comércio' : 'seu comércio'}. Você recebe as 9 fichas dele (3 de cada classe).</p>`,
            buttons: free.map((i) => ({ label: `${BIZ[i].name}<br><small>${BIZ[i].products.join(' · ')}</small>`, value: i, biz: i })),
          }, { timeout: T.buy, def: free[Math.floor(Math.random() * free.length)] });
          pick = free.includes(+r) ? +r : free[0];
        } else {
          await sleep(500);
          pick = free[Math.floor(Math.random() * free.length)];
        }
        S.owners[pick] = pid;
        p.businesses.push(pick);
        if (p.businesses.length === 1) p.color = BIZ[pick].color;
        this.log(`${p.name} assumiu a ${BIZ[pick].name}.`);
        this.push();
      }
    }
    S.pickTurn = null;
  }

  async loop() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.S && this.S.phase === 'playing' && !this.S.over) {
        await this.save();
        if (!this.temPlateia()) {
          this.log('Partida pausada — ninguém na sala. Recomeça quando alguém voltar.');
          await this.save();
          break;
        }
        await this.playTurn();
        if (!this.S || this.S.over) break;
        const w = this.S.players.find((p) => this.winCheck(p));
        if (w) {
          this.S.over = true;
          this.S.phase = 'over';
          this.S.winner = { name: w.name, cash: w.cash };
          this.log(`${w.name} VENCEU: ${fmt(w.cash)}, 3 símbolos da alta sociedade e nenhuma dívida!`, true);
          await this.save();
          this.push();
          break;
        }
        this.S.turn = (this.S.turn + 1) % this.S.order.length;
        this.push();
      }
    } catch (e) {
      this.fail(e);
    } finally {
      this.running = false;
    }
  }

  /* ---------------- bots ----------------
     skill 0 = Fácil, 1 = Médio, 2 = Difícil. Cada tabela [f, m, d] escala uma
     decisão. Regra geral: o Difícil guarda mais reserva, corre atrás dos
     símbolos da alta rumo à vitória, aposta pouco em jogos de sorte e joga
     forte na Bolsa e nos leilões; o Fácil faz o oposto — gasta por impulso,
     guarda pouco e arrisca demais. */
  sk(p) { return Math.max(0, Math.min(2, p.skill ?? 1)); }

  // Crédito custa 10% na Liquidação; a Bolsa rende ~67% por jogada. O bom
  // jogador paga à vista para não criar dívida e mantém o resto girando na Bolsa.
  // Por isso o Difícil guarda MENOS reserva ociosa (paga à vista); o Fácil, mais
  // (empurra no crédito e junta dívida).
  botReserve(p) {
    const base = p.level === 0 ? 15 : p.level === 1 ? 80 : 400;
    return Math.round(base * [1.6, 1, 0.5][this.sk(p)]);
  }
  botPayMethod(p, price) { return p.cash - price >= this.botReserve(p) ? 'cash' : 'credit'; }
  botWantsLevel(p) { return p.level === 0 ? 0 : 1; }

  botBuyChoice(p, idx, levels) {
    if (!levels.length) return { outra: true };
    const sk = this.sk(p);
    const need2 = p.symbols.filter((s) => s.level === 2).length < 3;
    // rumo à vitória: símbolo da alta. Difícil persegue cedo; Fácil quase nunca.
    const limiarAlta = [Infinity, 900, 350][sk];
    if (levels.includes(2) && need2 && (p.level === 2 || p.cash > limiarAlta)) return { buy: 2 };
    const minL = this.botWantsLevel(p);
    const missing = 3 - this.usefulSymbols(p, minL).length;
    if (missing > 0) {
      const useful = levels.filter((L) => L >= minL);
      if (useful.length) {
        // Difícil pega a classe mais alta que puder; Fácil e Médio, a mais barata.
        const L = sk === 2 ? useful[useful.length - 1] : useful[0];
        const folga = [70, 250, 500][sk];
        if (SYMBOL_PRICE[L] <= p.cash + folga) return { buy: L };
      }
    }
    // Fácil compra símbolo por impulso mesmo sem precisar
    if (sk === 0 && chance(0.35)) {
      const baratos = levels.filter((L) => SYMBOL_PRICE[L] <= p.cash);
      if (baratos.length) return { buy: baratos[0] };
    }
    return { outra: true };
  }

  botBuyDoc(p) {
    // Difícil e Médio sempre compram o documento (precisam para subir);
    // Fácil às vezes deixa passar e trava a própria ascensão.
    return this.sk(p) > 0 || chance(0.7);
  }

  botBid(b, asset) {
    const need = asset.kind === 'symbol'
      ? (this.usefulSymbols(b, this.botWantsLevel(b)).length < 3 && asset.level >= this.botWantsLevel(b))
        || (asset.level === 2 && b.symbols.filter((s) => s.level === 2).length < 3 && b.cash > 500)
      : !this.hasDocTier(b, DOCS[asset.doc].tier);
    const sk = this.sk(b);
    const greed = [0.7, 1, 1.3][sk];
    // Difícil dá lance mesmo sem precisar, para tomar do adversário; Fácil raramente.
    const chuteAtoa = [0.1, 0.25, 0.4][sk];
    if (!need && !chance(chuteAtoa)) return 0;
    const factor = (need ? (0.75 + Math.random() * 0.45) : (0.2 + Math.random() * 0.3)) * greed;
    return Math.max(0, Math.min(b.cash, Math.round(asset.base * factor)));
  }

  botPickAsset(p) {
    const assets = this.assetsOf(p).filter((a) => !(p._skipAsset && p._skipAsset[a.key]));
    // Difícil sacrifica o bem mais barato/menos útil; Fácil larga qualquer um.
    if (this.sk(p) === 0) return assets[Math.floor(Math.random() * assets.length)];
    assets.sort((a, b) => a.base - b.base);
    return assets[0];
  }

  botJockeyInit(p) {
    const sk = this.sk(p);
    if (!chance([0.55, 0.35, 0.15][sk]) || p.cash < 2) return null;
    const horses = [6, 7, 8, 5, 9, 2, 12, 3, 11, 4, 10];
    // Difícil aposta nos cavalos de meio (mais prováveis); Fácil chuta nos extremos.
    const horse = chance([0.4, 0.7, 0.9][sk]) ? horses[Math.floor(Math.random() * 5)] : 2 + Math.floor(Math.random() * 11);
    const cap = [30, 150, 600][p.level];
    const stake = Math.max(1, Math.min(p.cash, cap, Math.round(p.cash * [0.12, 0.06, 0.04][sk])));
    return { horse, stake };
  }
  botJockeyJoin(o) {
    const sk = this.sk(o);
    if (!chance([0.45, 0.25, 0.12][sk]) || o.cash < 2) return 0;
    return Math.max(1, Math.min(o.cash, Math.round(o.cash * [0.08, 0.04, 0.03][sk])));
  }

  // A Bolsa é a única jogada claramente lucrativa (rende ~67% por rodada).
  // Difícil despeja quase tudo o que sobra; Fácil quase não usa.
  botBolsaInvest(p, max) {
    const sk = this.sk(p);
    if (!chance([0.3, 0.5, 0.9][sk])) return 0;
    return Math.max(10, Math.min(max, Math.round(p.cash * [0.08, 0.15, 0.45][sk] / 10) * 10));
  }
  // Como a cotação é reavaliada a cada rodada e pode zerar (soma 2), o Difícil
  // trava o lucro cedo (a partir de +30%); o Fácil fica ganancioso e arrisca perder.
  botBolsaCashOut(inv, o) {
    const sk = this.sk(o || { skill: 1 });
    const alvo = [1.7, 1.5, 1.3][sk];
    if (inv.value >= inv.amount * alvo) return true;
    if (inv.rounds >= this.S.players.length - 2 && inv.value >= inv.amount) return true;
    return chance([0.3, 0.12, 0.04][sk]);
  }

  botLoteriaInit(p) {
    const sk = this.sk(p);
    if (!chance([0.5, 0.3, 0.12][sk]) || p.cash < 2) return 0;
    return Math.max(1, Math.min(p.cash, [20, 100, 400][p.level], Math.round(p.cash * [0.06, 0.03, 0.02][sk])));
  }
  botLoteriaJoin(o, stake) { return stake <= o.cash * [0.14, 0.08, 0.05][this.sk(o)]; }
}
