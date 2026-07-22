/* ============================================================
   STATUS ONLINE — a página do jogo
   O navegador só desenha e responde. Todas as regras rodam
   no Durable Object; nada de dado escondido chega aqui.
   ============================================================ */
export const PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#12293f">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Status — O Jogo da Ascensão Social</title>
<style>
:root{
  --paper:#e9dfc0; --paper2:#f2ecda; --ink:#1c1a16; --blue:#2f9ec4; --blue-dk:#1b7fa3;
  --gold:#e5a52e; --red:#c8473f;
  --sat:env(safe-area-inset-top,0px); --sab:env(safe-area-inset-bottom,0px);
  --sal:env(safe-area-inset-left,0px); --sar:env(safe-area-inset-right,0px);
  --topbar:52px; --actionbar:64px; --tabbar:58px;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;padding:0;height:100%;overflow:hidden;overscroll-behavior:none}
body{
  background:#20486e linear-gradient(160deg,#2a5a87 0%,#1c3f63 55%,#152f4c 100%);
  font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);
  display:flex;flex-direction:column;
  padding:var(--sat) var(--sar) var(--sab) var(--sal);
  user-select:none;-webkit-user-select:none;
}
button{font:inherit;border:0;cursor:pointer;touch-action:manipulation}
.hidden{display:none !important}

/* ---------- ENTRADA / LOBBY ---------- */
#gate{flex:1;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;gap:14px;color:#fff}
.card{width:100%;max-width:420px;background:var(--paper2);color:var(--ink);border:3px solid #17130d;border-radius:8px;box-shadow:0 10px 30px #0008;padding:16px}
.card h1{margin:0 0 4px;font-size:22px}
.card p{font-size:13.5px;line-height:1.5;margin:.4em 0}
.card label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:700;margin-top:10px}
.card input,.card select{font:inherit;padding:12px;border:2px solid #a99d7d;background:#fff;border-radius:4px;font-size:16px;width:100%}
.logoBig{font-style:italic;font-weight:900;font-size:52px;letter-spacing:-3px;color:#f2c14e;
  text-shadow:0 3px 0 #00000055;font-family:Georgia,"Times New Roman",serif;transform:skewX(-8deg);line-height:1}
.sub{color:#bcd3e4;font-size:12px;letter-spacing:2px;text-transform:uppercase}
.codeBig{font-size:38px;font-weight:900;letter-spacing:8px;text-align:center;background:#12293f;color:#ffd76e;
  padding:12px;border-radius:6px;margin:8px 0}
.lobbyRow{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border:1px solid #cabf9f;
  border-left:8px solid var(--pc,#888);border-radius:3px;margin-bottom:6px;font-size:14px}
.lobbyRow .nm{flex:1;font-weight:700}
.lobbyRow .tag{font-size:11px;color:#6b6350}
.err{background:#f6d9d6;border-left:5px solid var(--red);padding:9px 11px;font-size:13px;border-radius:0 4px 4px 0;margin-top:8px}

/* ---------- TOP BAR ---------- */
.top{
  flex:0 0 auto;height:var(--topbar);display:flex;align-items:center;gap:10px;
  padding:0 12px;color:#fff;background:#12293fcc;border-bottom:1px solid #ffffff1a;
}
.brand .logo{
  font-style:italic;font-weight:900;font-size:26px;letter-spacing:-1.5px;color:#f2c14e;
  text-shadow:0 2px 0 #00000055;font-family:Georgia,"Times New Roman",serif;
  transform:skewX(-8deg);display:inline-block;line-height:1;
}
#topInfo{flex:1;min-width:0;font-size:12px;line-height:1.25}
#topInfo b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#topInfo span{color:#bcd3e4;font-size:11px}
#topCash{font-size:15px;font-weight:800;color:#ffd76e;white-space:nowrap}

/* ---------- STAGE / VIEWS ---------- */
.stage{flex:1 1 auto;position:relative;min-height:0}
.view{position:absolute;inset:0;display:none;overflow:auto;-webkit-overflow-scrolling:touch}
.view.on{display:block}
.view.pad{padding:10px}

/* ---------- BOARD ---------- */
#boardStage{overflow:hidden;background:#0f1c14;touch-action:none}
#board{
  position:absolute;left:0;top:0;width:1000px;height:1000px;transform-origin:0 0;
  display:block;background:#e9dfc0;border:6px solid #101418;will-change:transform;
}
.zoomctl{position:absolute;right:9px;bottom:9px;display:flex;flex-direction:column;gap:8px;z-index:20}
.zoomctl button{
  width:46px;height:46px;padding:0;border-radius:50%;font-size:19px;font-weight:800;color:#fff;
  background:#12293fe6;box-shadow:0 2px 8px #000a;border:1px solid #ffffff26;
}
.zoomctl button.on{background:#c9891c}
.hintbar{
  position:absolute;left:9px;top:9px;z-index:20;background:#12293fdd;color:#cfe0ee;
  font-size:10px;padding:5px 10px;border-radius:20px;pointer-events:none;transition:opacity .5s;
}
.spacecard{
  position:absolute;left:9px;right:9px;bottom:9px;z-index:30;background:var(--paper2);
  border:3px solid #17130d;border-radius:8px;padding:12px 14px;box-shadow:0 10px 30px #000b;
  font-size:13px;line-height:1.45;
}
.spacecard h4{margin:0 0 6px;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#6b6350}
.spacecard .ttl{font-size:15px;font-weight:800;display:block;margin-bottom:4px}
.spacecard .x{position:absolute;top:4px;right:6px;background:none;box-shadow:none;color:#6b6350;font-size:22px;line-height:1;padding:6px 10px}

/* ---------- PANELS ---------- */
.panel{background:var(--paper2);border:3px solid #17130d;border-radius:4px;box-shadow:0 6px 16px #0007;padding:11px 12px;margin-bottom:10px}
.panel h2{margin:0 0 8px;font-size:11px;letter-spacing:2.2px;text-transform:uppercase;border-bottom:2px solid #17130d;padding-bottom:5px}
.turno{font-size:14px;line-height:1.45}
.btn{
  background:var(--blue-dk);color:#fff;font-weight:800;letter-spacing:.4px;padding:0 14px;
  min-height:46px;border-radius:4px;box-shadow:0 3px 0 #0d4658;font-size:13px;
}
.btn:active{transform:translateY(2px);box-shadow:0 1px 0 #0d4658}
.btn:disabled{background:#98a09e;box-shadow:none;cursor:not-allowed;color:#e8e8e4}
.btn.gold{background:#c9891c;box-shadow:0 3px 0 #7d5410}
.btn.gold:active{box-shadow:0 1px 0 #7d5410}
.btn.red{background:#a93b39;box-shadow:0 3px 0 #6c2321}
.btn.plain{background:#5d6a66;box-shadow:0 3px 0 #39423f}
.btn.wide{width:100%;margin-top:10px}
.players{display:grid;grid-template-columns:1fr;gap:8px}
.pcard{background:#fff;border:1px solid #cabf9f;border-left:8px solid var(--pc,#888);padding:10px 12px;font-size:13px;line-height:1.5;border-radius:3px}
.pcard.active{outline:3px solid #e5a52e;outline-offset:1px}
.pcard.off{opacity:.5}
.pcard .row1{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.pcard .row1 .nm{font-size:16px;font-weight:800}
.pcard .row1 .cash{font-size:18px;font-weight:800;white-space:nowrap}
.pcard .muted{color:#6b6350;font-size:12.5px}
.chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.chip{font-size:11px;font-weight:700;color:#fff;padding:4px 8px;border-radius:3px}
.chip.doc{background:#8c4a68}
.bizlist{display:grid;grid-template-columns:1fr;gap:6px}
.bizrow{color:#fff;font-size:12px;padding:10px 11px;border-radius:3px;display:flex;flex-direction:column;gap:2px}
.bizrow b{font-size:13px}
.log{
  height:calc(100dvh - var(--topbar) - var(--actionbar) - var(--tabbar) - 92px);min-height:220px;
  overflow:auto;background:#14241d;color:#cfe3d3;font:12px/1.55 Consolas,ui-monospace,monospace;
  padding:9px;border-radius:3px;
}
.log .lg{margin-bottom:3px}
.log .lg.destaque{color:#ffd76e}
.help{font-size:13px;line-height:1.6}
.help table{border-collapse:collapse;width:100%;margin:6px 0;min-width:460px}
.help td,.help th{border:1px solid #b9ae8d;padding:5px 6px;font-size:11.5px;text-align:center;white-space:nowrap}
.tablescroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.footer{color:#b9cbdc;font-size:10.5px;padding:2px 4px 14px;text-align:center}

/* ---------- ACTION BAR ---------- */
.actionbar{
  flex:0 0 auto;height:var(--actionbar);display:flex;gap:8px;align-items:center;
  padding:0 9px;background:#12293f;border-top:1px solid #ffffff1a;
}
.dicebox{
  flex:1.35;display:flex;gap:7px;align-items:center;justify-content:center;
  padding:6px 8px;border-radius:8px;background:#ffffff14;border:1px solid #ffffff26;min-height:50px;
}
.dicebox .dicelabel{font-size:9.5px;letter-spacing:1.6px;text-transform:uppercase;color:#cfe0ee;font-weight:800}
.die{width:38px;height:38px;background:#f6f1e2;border-radius:8px;box-shadow:0 3px 0 #00000066,inset 0 0 0 2px #d9d2ba;display:grid;place-items:center}
.die svg{width:28px;height:28px}
.actionbar .btn{flex:1;font-size:11.5px;padding:0 8px;min-height:50px;line-height:1.15}
#btnLeave{flex:0 0 56px;padding:0;font-size:11px}

/* ---------- TAB BAR ---------- */
.tabbar{flex:0 0 auto;height:var(--tabbar);display:flex;background:#0d2032;border-top:1px solid #ffffff14}
.tabbar button{
  flex:1;background:none;box-shadow:none;border-radius:0;color:#7f9aa5;font-size:9.5px;font-weight:700;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:0;position:relative;
}
.tabbar button .ico{font-size:19px;line-height:1}
.tabbar button.on{color:var(--gold)}
.tabbar button.on:after{content:"";position:absolute;top:0;left:22%;right:22%;height:3px;background:var(--gold)}
.badge{
  position:absolute;top:5px;right:calc(50% - 24px);background:var(--red);color:#fff;font-size:9px;
  font-weight:900;min-width:17px;height:17px;border-radius:9px;display:grid;place-items:center;padding:0 4px;
}

/* ---------- FOLHA DE PERGUNTA ---------- */
.overlay{position:fixed;inset:0;background:#0a1520e0;display:flex;align-items:flex-end;z-index:50}
.sheet{
  width:100%;max-height:88dvh;background:var(--paper2);border-top:5px solid var(--gold);
  border-radius:16px 16px 0 0;box-shadow:0 -10px 40px #000c;display:flex;flex-direction:column;
  animation:rise .22s ease-out;padding-bottom:var(--sab);
}
@keyframes rise{from{transform:translateY(28px);opacity:.4}to{transform:none;opacity:1}}
.clock{flex:0 0 auto;height:6px;background:#00000018;border-radius:16px 16px 0 0;overflow:hidden}
.clock i{display:block;height:100%;background:var(--gold);width:100%;transition:width .25s linear}
.clock.urg i{background:var(--red)}
.dialog{flex:1 1 auto;overflow:auto;padding:12px 16px 16px;-webkit-overflow-scrolling:touch}
.dialog h1{margin:0 0 10px;font-size:19px;border-bottom:3px solid #17130d;padding-bottom:8px}
.dialog p{line-height:1.55;font-size:14px;margin:.5em 0}
.dialog .notice{background:#eadfb8;border-left:5px solid #c9891c;padding:9px 11px;font-size:13px;margin:8px 0;border-radius:0 4px 4px 0}
.dialog .mini{font-size:11.5px;color:#6b6350}
.dialog label{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:700;margin-top:8px}
.choices{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.choices .btn{text-align:left;line-height:1.35;font-weight:700;padding:11px 14px;min-height:52px}
.choices .btn small{font-weight:400;opacity:.9}
.stepper{display:flex;gap:8px;align-items:stretch}
.stepper input{flex:1;text-align:center;font-weight:800;font:inherit;font-size:18px;padding:12px;border:2px solid #a99d7d;background:#fff;border-radius:4px}
.stepper button{flex:0 0 52px;min-height:48px;padding:0;font-size:22px;color:#fff;background:#5d6a66;box-shadow:0 3px 0 #39423f;border-radius:4px;font-weight:800}

/* ---------- AVISO ---------- */
#toast{position:fixed;left:10px;right:10px;top:calc(var(--sat) + 58px);z-index:60;display:none}
#toast .box{background:var(--paper2);border:3px solid #17130d;border-left:8px solid var(--gold);
  border-radius:6px;padding:11px 13px;box-shadow:0 10px 30px #000a;font-size:13.5px;line-height:1.45}
#toast h3{margin:0 0 4px;font-size:15px}
#waiting{position:fixed;left:10px;right:10px;bottom:calc(var(--tabbar) + var(--actionbar) + 10px);z-index:40;
  background:#12293fe8;color:#cfe0ee;font-size:11.5px;padding:7px 11px;border-radius:20px;text-align:center;display:none}

/* ---------- BOTÃO DE TROCAR DE VERSÃO ---------- */
#btnModo{
  flex:0 0 auto;background:#ffffff1f;border:1px solid #ffffff2e;color:#cfe0ee;
  width:34px;height:34px;border-radius:8px;font-size:15px;line-height:1;padding:0;
}
#btnModo:active{background:#ffffff33}

/* ---------- CELULAR: os painéis são abas sobrepostas ---------- */
#side, #colA, #colB{display:contents}
#deskTabs, #subtitulo{display:none}

/* ---------- COMPUTADOR: tabuleiro à esquerda, dois painéis à direita ---------- */
body.desk{max-width:none;background:#20486e linear-gradient(160deg,#2a5a87 0%,#1c3f63 55%,#152f4c 100%)}
body.desk .top{height:auto;min-height:58px;padding:9px 18px;gap:16px;background:#0000001f;border-bottom:0}
body.desk .brand .logo{font-size:34px}
body.desk #subtitulo{
  display:block;flex:1;color:#bcd3e4;font-size:11px;letter-spacing:2.6px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
body.desk #topInfo{flex:0 0 auto;text-align:right}
body.desk .tabbar, body.desk .actionbar{display:none}

body.desk .stage{display:flex;flex-direction:row;gap:14px;padding:14px;overflow:hidden}
/* a largura é calculada no JS para bater com a altura: o tabuleiro é quadrado,
   e assim não sobra faixa escura de nenhum lado */
body.desk #boardStage{
  position:relative;flex:0 0 auto;min-width:0;border:3px solid #17130d;border-radius:6px;
  box-shadow:0 8px 26px #0007;
}
/* metade da tela para os painéis: com menos que isso a tabela da Bolsa
   fica cortada e os nomes dos jogadores quebram em três linhas */
/* duas colunas em cima e uma faixa larga embaixo, onde as Tabelas cabem
   inteiras — na coluna estreita a da Bolsa ficava cortada na cotação 9 */
body.desk #side{
  display:grid;grid-template-columns:1fr 1fr;gap:0 14px;align-content:start;
  flex:1 1 auto;min-width:0;
  overflow:auto;-webkit-overflow-scrolling:touch;padding:0;background:none;border:0;
}
body.desk #colA{grid-column:1}
body.desk #colB{grid-column:2}
body.desk #pTabelas{grid-column:1 / -1}
body.desk #colA, body.desk #colB{display:flex;flex-direction:column;min-width:0}
body.desk #side .view{position:static;display:none;overflow:visible;padding:0;inset:auto}
body.desk #side .view.on{display:block}
body.desk .panel{margin-bottom:12px;padding:14px 16px}
body.desk .panel h2{font-size:12px;letter-spacing:2.8px;padding-bottom:7px;margin-bottom:11px}
body.desk .turno{font-size:15px}
body.desk .pcard{padding:12px 14px;font-size:13.5px}
body.desk .pcard .row1 .nm{font-size:17px}
body.desk .pcard .row1 .cash{font-size:19px}
body.desk .bizrow{font-size:13px;padding:11px 13px}
body.desk .help{font-size:13.5px}
body.desk .help table{min-width:0}
body.desk .help td, body.desk .help th{padding:6px 7px;font-size:12px}
body.desk .footer{display:none}
body.desk .badge{display:none !important}
/* o Registro encolhe para as Tabelas caberem inteiras na tela;
   ele rola por dentro, então nada de registro se perde */
body.desk .log{height:clamp(150px,19vh,300px);min-height:0;font-size:12.5px}
/* Tabelas mais compactas: é a última coisa da página e era a que cortava */
body.desk #pTabelas .help{font-size:13px}
body.desk #pTabelas table{margin:5px 0 9px}
body.desk #pTabelas td, body.desk #pTabelas th{padding:5px 6px;font-size:11.5px}
body.desk #waiting{bottom:14px;left:auto;right:14px;width:auto}
/* os dados maiores, como no tabuleiro de mesa */
body.desk #pTurno .die{width:52px;height:52px;border-radius:10px}
body.desk #pTurno .die svg{width:38px;height:38px}

/* as três abas do cartão da direita, como no tabuleiro de mesa */
body.desk #deskTabs{display:flex;gap:6px;margin-bottom:10px;flex:0 0 auto}
body.desk #deskTabs button{
  flex:0 0 auto;background:#8d8776;color:#fff;font-weight:800;font-size:12.5px;letter-spacing:.6px;
  padding:9px 15px;border-radius:4px 4px 0 0;box-shadow:0 3px 0 #00000033;
}
body.desk #deskTabs button.on{background:var(--blue-dk);box-shadow:0 3px 0 #0d4658}

/* os dados moram dentro do painel Turno, e não numa barra embaixo */
body.desk #pTurno .dicebox{
  margin-top:12px;background:#00000008;border:1px solid #00000020;cursor:default;
  padding:10px;border-radius:6px;
}
body.desk #pTurno .dicebox .dicelabel{color:#6b6350;font-size:11px;letter-spacing:2.4px}
body.desk .top .btn{min-height:36px;font-size:11.5px;padding:0 12px;line-height:1.15;flex:0 0 auto}

/* entrada e lobby no computador: sem a moldura de celular, com o cartão
   maior e o logo do tamanho da tela */
body.desk #gate{gap:20px;padding:32px}
body.desk #gate .logoBig{font-size:78px;letter-spacing:-5px}
body.desk #gate .sub{font-size:13px;letter-spacing:4px}
body.desk .card{max-width:520px;padding:22px 24px;border-radius:6px;box-shadow:0 0 0 4px var(--gold),0 22px 60px #000a}
body.desk .card h1{font-size:25px}
body.desk .card p{font-size:14px}
body.desk .codeBig{font-size:46px;letter-spacing:12px}
body.desk .lobbyRow{font-size:15px;padding:10px 12px}

@media(min-width:900px){
  body:not(.desk){max-width:560px;margin:0 auto;border-left:1px solid #ffffff14;border-right:1px solid #ffffff14}
  .overlay{align-items:center;justify-content:center;padding:16px}
  .sheet{max-width:640px;border-radius:6px;border:4px solid #17130d;box-shadow:0 0 0 4px var(--gold),0 22px 60px #000;max-height:92dvh}
  .choices{flex-direction:row;flex-wrap:wrap}
  .choices .btn{flex:1 1 220px}
}
@media(min-width:1100px){
  body.desk .players{grid-template-columns:1fr 1fr}
  body.desk .bizlist{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<!-- ===================== ENTRADA / LOBBY ===================== -->
<div id="gate">
  <div style="text-align:center">
    <div class="logoBig">status</div>
    <div class="sub">o jogo da ascensão social</div>
  </div>

  <div class="card" id="cardEntrar">
    <h1>Entrar na mesa</h1>
    <p>Grow, 1977 — recriação digital para jogar com os amigos, cada um no seu celular.</p>
    <label>Seu nome <input id="inName" maxlength="18" placeholder="Como aparece na mesa"></label>
    <label>Código da sala <input id="inCode" maxlength="4" placeholder="4 letras" style="text-transform:uppercase;letter-spacing:6px;font-weight:800"></label>
    <button class="btn gold wide" id="btnEntrar">Entrar na sala</button>
    <button class="btn wide" id="btnCriar">Criar uma sala nova</button>
    <div id="gateErr" class="err hidden"></div>
  </div>

  <div class="card hidden" id="cardLobby">
    <h1>Sala aberta</h1>
    <div class="codeBig" id="lobCode">----</div>
    <button class="btn wide" id="btnConvite">Copiar link do convite</button>
    <p class="mini" id="lobHint" style="text-align:center;color:#6b6350;font-size:11.5px"></p>
    <h1 style="font-size:15px;border:0;margin:14px 0 6px">Na mesa</h1>
    <div id="lobPlayers"></div>
    <div id="lobHostBox" class="hidden">
      <label>Meta em dinheiro <input id="inTarget" type="number" min="500" step="500" value="10000"></label>
      <div style="font-size:12px;font-weight:700;margin:10px 0 5px">Adicionar bot</div>
      <div id="botBtns" style="display:flex;gap:6px">
        <button class="btn plain" data-skill="0" style="flex:1;font-size:12px">＋ Fácil</button>
        <button class="btn" data-skill="1" style="flex:1;font-size:12px">＋ Médio</button>
        <button class="btn gold" data-skill="2" style="flex:1;font-size:12px">＋ Difícil</button>
      </div>
      <button class="btn gold wide" id="btnComecar">Começar a partida</button>
      <p style="font-size:11.5px;color:#6b6350">De 2 a 6 jogadores. Com 2 ou 3, cada um assume dois comércios, como manda o manual.</p>
    </div>
    <p id="lobWait" class="mini" style="text-align:center;color:#6b6350"></p>
    <button class="btn plain wide" id="btnSairLobby">Sair desta sala</button>
  </div>
</div>

<!-- ===================== JOGO ===================== -->
<header class="top hidden" id="topBar">
  <div class="brand"><span class="logo">status</span></div>
  <div id="subtitulo">O JOGO DA ASCENSÃO SOCIAL · GROW 1977 · VERSÃO DIGITAL</div>
  <div id="topInfo"><b>Conectando…</b><span>o jogo da ascensão social</span></div>
  <div id="topCash"></div>
  <button id="btnModo" title="Trocar entre a tela de celular e a de computador">🖥</button>
</header>

<div class="stage hidden" id="stage">
  <section id="boardStage" class="view on">
    <svg id="board" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"></svg>
    <div class="hintbar" id="hint">Arraste para mover · 2 dedos para ampliar · toque numa casa</div>
    <div class="zoomctl">
      <button id="zin" aria-label="Ampliar">+</button>
      <button id="zout" aria-label="Reduzir">−</button>
      <button id="zfit" aria-label="Ver o tabuleiro inteiro">⤢</button>
      <button id="zfollow" class="on" aria-label="Seguir o peão da vez">◎</button>
    </div>
    <div id="spacecard" class="spacecard" style="display:none"></div>
  </section>

  <div id="side">
  <div id="colA"></div>
  <div id="colB"><div id="deskTabs">
    <button data-dk="viewPlayers" class="on">Jogadores</button>
    <button data-dk="viewBiz">Comércios</button>
    <button data-dk="viewHelp">Ajuda</button>
  </div></div>
  <section id="viewPlayers" class="view pad">
    <section class="panel" id="pTurno"><h2>Turno</h2><div class="turno" id="turno">…</div></section>
    <section class="panel"><h2>Jogadores</h2><div class="players" id="playersBox"></div></section>
    <div class="footer">Recriação digital para uso pessoal, baseada no manual original e em fotografias do tabuleiro da Grow (1977).</div>
  </section>

  <section id="viewBiz" class="view pad">
    <section class="panel"><h2>Comércios</h2><div class="bizlist" id="bizBox"></div></section>
    <section class="panel"><h2>Legenda</h2><div class="help">Cada comércio guarda 9 fichas: 3 de cada classe. O estoque aparece na ordem <b>baixa / média / alta</b>.</div></section>
  </section>

  <section id="viewLog" class="view pad">
    <section class="panel"><h2>Registro</h2><div class="log" id="log"></div></section>
  </section>

  <section id="viewHelp" class="view pad">
    <section class="panel"><h2>Regras</h2><div class="help" id="helpBox"></div></section>
    <section class="panel" id="pTabelas"><h2>Tabelas</h2><div class="help tablescroll" id="tablesBox"></div></section>
  </section>
  </div>
</div>

<div class="actionbar hidden" id="actionBar">
  <div class="dicebox" id="dicebox">
    <div class="die" id="die1"></div>
    <div class="die" id="die2"></div>
    <div class="dicelabel" id="diceLabel">dados</div>
  </div>
  <button class="btn plain" id="btnForce">Seguir sem quem falta</button>
  <button class="btn plain" id="btnLeave">Sair</button>
</div>

<nav class="tabbar hidden" id="tabbar">
  <button data-view="boardStage" class="on"><span class="ico">🎯</span>Tabuleiro</button>
  <button data-view="viewPlayers"><span class="ico">👤</span>Jogadores<span class="badge" id="bPlayers" style="display:none"></span></button>
  <button data-view="viewBiz"><span class="ico">🏬</span>Comércios</button>
  <button data-view="viewLog"><span class="ico">📜</span>Registro<span class="badge" id="bLog" style="display:none"></span></button>
  <button data-view="viewHelp"><span class="ico">📖</span>Ajuda</button>
</nav>

<div id="waiting"></div>
<div id="toast"><div class="box" id="toastBox"></div></div>

<div class="overlay hidden" id="overlay">
  <div class="sheet" id="sheet">
    <div class="clock" id="clock"><i id="clockBar"></i></div>
    <div class="dialog" id="dialog"></div>
  </div>
</div>

<script>
'use strict';
var $ = function (id) { return document.getElementById(id); };
var buzz = function (p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

var B = null;      // dados do tabuleiro, vindos do servidor
var ST = null;     // estado público da partida
var ME = null;     // meu pid
var WS = null;
var CODE = null;
var PROMPT = null;
var clockTimer = null;
var logSeen = 0, lastTurnPid = null, currentView = 'boardStage';

var fmt = function (n) { return '$ ' + (Math.round(n * 100) / 100).toLocaleString('pt-BR'); };
var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

/* ---------------- identidade ---------------- */
function myPid() {
  var k = 'statusPid';
  var v = null;
  try { v = localStorage.getItem(k); } catch (e) {}
  if (!v) {
    v = 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try { localStorage.setItem(k, v); } catch (e) {}
  }
  return v;
}
function savedName() { try { return localStorage.getItem('statusNome') || ''; } catch (e) { return ''; } }
function saveName(n) { try { localStorage.setItem('statusNome', n); } catch (e) {} }

/* ---------------- entrada ---------------- */
var pathCode = (location.pathname.match(/^\\/r\\/([A-Za-z0-9]{4})/) || [])[1];
$('inName').value = savedName();
if (pathCode) $('inCode').value = pathCode.toUpperCase();

function gateErr(msg) {
  var e = $('gateErr');
  if (!msg) { e.classList.add('hidden'); return; }
  e.textContent = msg;
  e.classList.remove('hidden');
}

$('btnCriar').onclick = function () {
  var nome = $('inName').value.trim();
  if (!nome) { gateErr('Escreva seu nome primeiro.'); return; }
  gateErr('');
  $('btnCriar').disabled = true;
  fetch('/api/new', { method: 'POST', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
    $('btnCriar').disabled = false;
    if (!j.code) { gateErr('Não consegui criar a sala. Tente de novo.'); return; }
    connect(j.code, nome);
  }).catch(function () {
    $('btnCriar').disabled = false;
    gateErr('Sem conexão com o servidor.');
  });
};

$('btnEntrar').onclick = function () {
  var nome = $('inName').value.trim();
  var code = $('inCode').value.trim().toUpperCase();
  if (!nome) { gateErr('Escreva seu nome primeiro.'); return; }
  if (!/^[A-Z0-9]{4}$/.test(code)) { gateErr('O código tem 4 caracteres.'); return; }
  gateErr('');
  fetch('/api/room/' + code, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
    if (!j.ok) { gateErr('Não existe sala com esse código.'); return; }
    connect(code, nome);
  }).catch(function () { gateErr('Sem conexão com o servidor.'); });
};

$('inCode').addEventListener('input', function () { this.value = this.value.toUpperCase(); });

/* ---------------- websocket ---------------- */
function connect(code, nome) {
  CODE = code;
  saveName(nome);
  var proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
  WS = new WebSocket(proto + location.host + '/ws?code=' + code);
  WS.onopen = function () {
    WS.send(JSON.stringify({ t: 'join', pid: myPid(), name: nome }));
  };
  WS.onmessage = function (ev) {
    var m = JSON.parse(ev.data);
    if (m.t === 'init') { B = m.board; ME = m.you; CODE = m.code; showHelp(); }
    else if (m.t === 'denied') { gateErr(m.reason); try { WS.close(); } catch (e) {} }
    else if (m.t === 'state') { ST = m.s; ME = m.you; onState(m); }
    else if (m.t === 'announce') { toast(m.title, m.body); }
  };
  WS.onclose = function () {
    if (ST) {
      $('topInfo').innerHTML = '<b>Reconectando…</b><span>a partida continua</span>';
      setTimeout(function () { connect(code, nome); }, 1800);
    }
  };
  WS.onerror = function () {};
}

function sendHost(cmd, extra) {
  var m = { t: 'host', cmd: cmd };
  if (extra) for (var k in extra) m[k] = extra[k];
  WS.send(JSON.stringify(m));
}

/* ---------------- estado recebido ----------------
   O servidor manda uma atualização a cada casa que o peão anda e a cada
   linha do registro — dezenas por turno no fim de jogo. Em vez de redesenhar
   tudo a cada uma, junto as que chegam no mesmo quadro e desenho uma vez só. */
var _renderAgendado = false;
function agendarRender() {
  if (_renderAgendado) return;
  _renderAgendado = true;
  requestAnimationFrame(function () { _renderAgendado = false; renderPanels(); });
}
function onState(m) {
  if (ST.phase === 'lobby') { renderLobby(); return; }
  showGame();
  renderPrompt(m.prompt);      // a pergunta aparece na hora, sem esperar o quadro
  renderWaiting(m.waiting);
  agendarRender();
}

function showGame() {
  $('gate').classList.add('hidden');
  ['topBar', 'stage', 'actionBar', 'tabbar'].forEach(function (id) { $(id).classList.remove('hidden'); });
  if (!showGame.done) {
    showGame.done = true;
    requestAnimationFrame(function () { fit(); centerOnActive(true); });
  }
}

/* ---------------- lobby ---------------- */
function renderLobby() {
  $('gate').classList.remove('hidden');
  $('cardEntrar').classList.add('hidden');
  $('cardLobby').classList.remove('hidden');
  $('lobCode').textContent = ST.code;
  var eu = ST.hostPid === ME;
  $('lobHostBox').classList.toggle('hidden', !eu);
  $('lobWait').textContent = eu ? '' : 'Esperando o anfitrião começar a partida.';
  $('lobHint').textContent = 'Quem receber o link só precisa digitar o nome.';
  $('lobPlayers').innerHTML = ST.players.map(function (p) {
    var tag = p.human ? (p.connected ? 'na sala' : 'desconectado') : 'bot';
    var host = p.pid === ST.hostPid ? ' · anfitrião' : '';
    var rm = (eu && p.pid !== ST.hostPid)
      ? '<button class="btn red" style="min-height:34px;padding:0 10px;font-size:11px" data-rm="' + p.pid + '">tirar</button>' : '';
    return '<div class="lobbyRow" style="--pc:' + p.color + '"><span class="nm">' + esc(p.name) +
      '</span><span class="tag">' + tag + host + '</span>' + rm + '</div>';
  }).join('');
  Array.prototype.forEach.call($('lobPlayers').querySelectorAll('[data-rm]'), function (b) {
    b.onclick = function () { sendHost('remove', { pid: b.dataset.rm }); };
  });
  $('btnComecar').disabled = ST.players.length < 2;
  Array.prototype.forEach.call(document.querySelectorAll('#botBtns button'), function (b) {
    b.disabled = ST.players.length >= 6;
  });
}

Array.prototype.forEach.call(document.querySelectorAll('#botBtns button'), function (b) {
  b.onclick = function () { sendHost('addBot', { skill: +b.dataset.skill }); };
});
$('btnComecar').onclick = function () {
  sendHost('target', { value: +$('inTarget').value || 10000 });
  sendHost('start');
};
$('btnConvite').onclick = function () {
  var link = location.origin + '/r/' + ST.code;
  var done = function () { $('btnConvite').textContent = 'Link copiado!'; setTimeout(function () { $('btnConvite').textContent = 'Copiar link do convite'; }, 1800); };
  if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, function () { prompt('Copie o link:', link); });
  else prompt('Copie o link:', link);
};
/* Sair: sempre volta para a tela inicial, nunca deixa uma tela sem saída.
   O location.href='/' derruba o socket e limpa o /r/CODE do endereço. */
function sair(confirmar) {
  if (confirmar && !confirm('Sair desta sala e voltar para a tela inicial?')) return;
  try { WS.onclose = null; WS.close(); } catch (e) {}
  location.href = '/';
}
$('btnLeave').onclick = function () { sair(true); };
$('btnSairLobby').onclick = function () { sair(false); };
$('btnForce').onclick = function () { sendHost('force'); };

/* ---------------- versão de celular x de computador ----------------
   Escolhe sozinha pelo tamanho da tela na primeira visita; o botão do
   cabeçalho troca a qualquer momento e a escolha fica gravada no aparelho. */
var DESK = false, deskTab = 'viewPlayers', ORIG = null;

function lerModo() {
  try { return localStorage.getItem('statusModo'); } catch (e) { return null; }
}

/* Guarda, uma única vez, quem era filho de quem no HTML original.
   Assim a volta para o celular é exata, sem depender de eu lembrar
   de desfazer cada movimento na mão. */
function guardaOriginal() {
  if (ORIG) return;
  ORIG = ['viewPlayers', 'viewHelp', 'actionBar', 'side', 'colB', 'topBar'].map(function (id) {
    return { el: $(id), filhos: Array.prototype.slice.call($(id).children) };
  });
}
function restauraOriginal() {
  ORIG.forEach(function (o) { o.filhos.forEach(function (f) { o.el.appendChild(f); }); });
}

/* Arranjo de computador: tabuleiro à esquerda; à direita, Turno (com os dados
   dentro) e Registro numa coluna, e o cartão de abas mais as Tabelas na outra. */
function montaDesk() {
  var a = $('colA'), b = $('colB');
  a.appendChild($('pTurno'));
  a.appendChild($('viewLog'));
  b.appendChild($('deskTabs'));
  b.appendChild($('viewPlayers'));
  b.appendChild($('viewBiz'));
  b.appendChild($('viewHelp'));
  $('side').appendChild($('pTabelas'));   // faixa larga embaixo, sob as duas colunas
  $('pTurno').appendChild($('dicebox'));
  $('topBar').appendChild($('btnForce'));
  $('topBar').appendChild($('btnLeave'));
  $('boardStage').classList.add('on');
  $('viewLog').classList.add('on');
  setDeskTab(deskTab);
}

function setDeskTab(id) {
  deskTab = id;
  ['viewPlayers', 'viewBiz', 'viewHelp'].forEach(function (v) { $(v).classList.toggle('on', v === id); });
  Array.prototype.forEach.call($('deskTabs').children, function (b) { b.classList.toggle('on', b.dataset.dk === id); });
}
Array.prototype.forEach.call($('deskTabs').children, function (b) {
  b.onclick = function () { setDeskTab(b.dataset.dk); };
});

/* Decide sozinho na primeira visita. Largura de janela era um critério ruim:
   quem não usa o navegador maximizado caía na tela de celular. Ter mouse é a
   pergunta certa — só peço uma largura mínima para as duas colunas caberem. */
function detectaDesk() {
  var mouse = false;
  try { mouse = window.matchMedia('(pointer: fine)').matches; } catch (e) {}
  if (mouse && window.innerWidth >= 860) return true;
  return window.innerWidth >= 1000;
}

function setModo(desk, gravar) {
  guardaOriginal();
  DESK = !!desk;
  document.body.classList.toggle('desk', DESK);
  $('btnModo').textContent = DESK ? '📱' : '🖥';
  $('btnModo').title = DESK ? 'Mudar para a tela de celular' : 'Mudar para a tela de computador';
  restauraOriginal();
  if (DESK) {
    currentView = 'boardStage';   // o tabuleiro nunca sai da tela no computador
    montaDesk();
  } else {
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) {
      v.classList.toggle('on', v.id === currentView);
    });
  }
  if (gravar) { try { localStorage.setItem('statusModo', DESK ? 'desk' : 'mob'); } catch (e) {} }
  requestAnimationFrame(function () { fit(); centerOnActive(true); });
}
$('btnModo').onclick = function () { buzz(10); setModo(!DESK, true); };

/* ---------------- perguntas do servidor ---------------- */
function renderPrompt(q) {
  if (!q) {
    PROMPT = null;
    $('overlay').classList.add('hidden');
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
    return;
  }
  if (PROMPT && PROMPT.id === q.id) return;   // já está na tela
  PROMPT = q;
  buzz([18, 40, 18]);
  var h = '<h1>' + q.title + '</h1>' + (q.body || '');
  if (q.form) {
    h += q.form.map(function (f) {
      return '<label>' + f.label + '<span class="stepper">' +
        '<button type="button" data-step="-1" data-for="' + f.id + '">−</button>' +
        '<input id="f_' + f.id + '" type="number" inputmode="decimal" min="' + f.min + '" max="' + f.max +
        '" step="' + f.step + '" value="' + f.value + '">' +
        '<button type="button" data-step="1" data-for="' + f.id + '">+</button>' +
        '</span></label>';
    }).join('');
  }
  h += '<div class="choices" id="dlgChoices"></div>';
  $('dialog').innerHTML = h;
  $('dialog').scrollTop = 0;

  Array.prototype.forEach.call($('dialog').querySelectorAll('[data-step]'), function (b) {
    b.onclick = function () {
      var inp = $('f_' + b.dataset.for);
      var st = Number(inp.step) || 1;
      var mn = inp.min === '' ? -Infinity : Number(inp.min);
      var mx = inp.max === '' ? Infinity : Number(inp.max);
      var v = (Number(inp.value) || 0) + Number(b.dataset.step) * st;
      inp.value = Math.round(Math.max(mn, Math.min(mx, v)) * 100) / 100;
      buzz(8);
    };
  });

  var box = $('dlgChoices');
  (q.buttons || []).forEach(function (bt) {
    var el = document.createElement('button');
    el.className = 'btn ' + (bt.cls || '');
    el.innerHTML = bt.label;
    el.disabled = !!bt.disabled;
    if (bt.biz != null && B) { el.style.background = B.BIZ[bt.biz].color; el.style.boxShadow = '0 3px 0 #00000055'; }
    el.onclick = function () { answer(bt.value); };
    box.appendChild(el);
  });

  $('overlay').classList.remove('hidden');
  startClock(q.deadline);
}

function answer(value) {
  if (!PROMPT) return;
  var form = {};
  Array.prototype.forEach.call($('dialog').querySelectorAll('input'), function (inp) {
    form[inp.id.replace(/^f_/, '')] = inp.value;
  });
  WS.send(JSON.stringify({ t: 'answer', promptId: PROMPT.id, value: value, form: form }));
  PROMPT = null;
  $('overlay').classList.add('hidden');
  if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
}

function startClock(deadline) {
  if (clockTimer) clearInterval(clockTimer);
  var total = Math.max(1000, deadline - Date.now());
  var tick = function () {
    var left = deadline - Date.now();
    var pct = Math.max(0, Math.min(100, left / total * 100));
    $('clockBar').style.width = pct + '%';
    $('clock').classList.toggle('urg', left < 10000);
    if (left <= 0) { clearInterval(clockTimer); clockTimer = null; }
  };
  tick();
  clockTimer = setInterval(tick, 250);
}

function renderWaiting(list) {
  var w = $('waiting');
  var outros = (list || []).filter(function (n) {
    var eu = ST.players.find(function (p) { return p.pid === ME; });
    return !eu || n !== eu.name;
  });
  if (!outros.length || PROMPT) { w.style.display = 'none'; return; }
  w.textContent = 'Esperando: ' + outros.join(', ');
  w.style.display = 'block';
}

function toast(title, body) {
  $('toastBox').innerHTML = '<h3>' + title + '</h3>' + body;
  $('toast').style.display = 'block';
  clearTimeout(toast.t);
  toast.t = setTimeout(function () { $('toast').style.display = 'none'; }, 3400);
}

/* ---------------- painéis ---------------- */
function playerByPid(pid) { return ST.players.find(function (p) { return p.pid === pid; }); }
function symbolName(s) { return B.BIZ[s.biz].products[s.level]; }

function renderPanels() {
  $('playersBox').innerHTML = ST.players.map(function (p) {
    var inv = ST.investments.find(function (v) { return v.owner === p.pid; });
    var chips = p.symbols.map(function (s) {
      return '<span class="chip" style="background:' + B.BIZ[s.biz].color + '">' + symbolName(s) + '</span>';
    }).join('') || '<span class="muted">sem símbolos</span>';
    var docs = p.docs.map(function (k) { return '<span class="chip doc">' + B.DOCS[k].name + '</span>'; }).join('');
    var act = p.pid === ST.turnPid;
    var cls = CLASS_SHORT_UP(p.level);
    return '<div class="pcard ' + (act ? 'active ' : '') + (p.human && !p.connected ? 'off' : '') + '" style="--pc:' + p.color + '">' +
      '<div class="row1"><span class="nm">' + esc(p.name) + (p.human ? '' : ' 🤖') +
      (p.human && !p.connected ? ' <small style="font-size:11px;color:#a33">offline</small>' : '') +
      '</span><span class="cash">' + fmt(p.cash) + '</span></div>' +
      '<div class="muted">' + cls + ' · dívida ' + fmt(p.debt) + ' · ' +
      (p.businesses.map(function (b) { return B.BIZ[b].name; }).join(', ') || '—') +
      (inv ? ' · Bolsa ' + fmt(inv.value) : '') + (p.skip > 0 ? ' · perde a vez' : '') + '</div>' +
      '<div class="chips">' + chips + docs + '</div></div>';
  }).join('');

  $('bizBox').innerHTML = B.BIZ.map(function (b, i) {
    var o = ST.owners[i] == null ? 'Banco' : (playerByPid(ST.owners[i]) || {}).name;
    return '<div class="bizrow" style="background:' + b.color + (i === 4 ? ';color:#3a2c08' : '') + '">' +
      '<b>' + b.name + '</b><span>' + esc(o || 'Banco') + ' · estoque ' + ST.stock[i].join(' / ') + '</span></div>';
  }).join('');

  var t = $('turno');
  if (ST.phase === 'over' && ST.winner) {
    t.innerHTML = '<b>' + esc(ST.winner.name) + ' venceu!</b><br>' + fmt(ST.winner.cash) +
      ', três símbolos da alta sociedade e nenhuma dívida.' +
      (ST.hostPid === ME ? '<button class="btn gold wide" id="btnAgain">Nova partida com a mesma mesa</button>' : '');
    if ($('btnAgain')) $('btnAgain').onclick = function () { sendHost('again'); };
  } else if (ST.phase === 'business') {
    t.innerHTML = '<b>Escolha dos comércios</b><br><span style="font-size:12px">Cada jogador assume um comércio na ordem definida pelos dados.</span>';
  } else if (ST.phase === 'priority' && ST.priority) {
    t.innerHTML = '<b>Ordem definida</b><br>' + ST.priority.map(function (r, i) {
      return (i + 1) + 'º ' + esc(r.name) + ' — ' + r.rolls.join(' · ');
    }).join('<br>');
  } else {
    var p = playerByPid(ST.turnPid);
    if (p) {
      t.innerHTML = '<b>Vez de ' + esc(p.name) + '</b>' + (p.human ? '' : ' (bot)') + '<br>' +
        CLASS_SHORT_UP(p.level) + ' · ' + fmt(p.cash) + ' · dívida ' + fmt(p.debt) +
        '<br><span style="font-size:11px;color:#6b6350">Meta: ' + fmt(ST.target) + ' + 3 símbolos da alta + dívida zero</span>';
    }
  }

  renderDice(ST.dice[0], ST.dice[1]);
  var pa = playerByPid(ST.turnPid);
  $('diceLabel').textContent = pa ? (pa.pid === ME ? 'sua vez' : 'vez de ' + pa.name) : 'dados';
  $('btnForce').classList.toggle('hidden', ST.hostPid !== ME);
  renderLog();
  syncTop();
  renderBoard();
  centerOnActive();
}

function CLASS_SHORT_UP(l) { var s = B.CLASS_SHORT[l]; return s.charAt(0).toUpperCase() + s.slice(1); }

function renderLog() {
  var box = $('log');
  box.innerHTML = ST.log.map(function (l) {
    return '<div class="lg' + (l.d ? ' destaque' : '') + '">› ' + esc(l.m) + '</div>';
  }).join('');
  if (currentView !== 'viewLog' && ST.log.length > logSeen) {
    badge('bLog', Math.min(9, ST.log.length - logSeen));
  }
}
function badge(id, n) { var el = $(id); if (!el) return; el.textContent = n > 9 ? '9+' : n; el.style.display = n ? 'grid' : 'none'; }

function renderDice(a, b) {
  var pip = function (n) {
    var pos = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
      4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
      6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[n] || [];
    return '<svg viewBox="-2 -2 4 4">' + pos.map(function (c) {
      return '<circle cx="' + (c[0] * 0.95) + '" cy="' + (c[1] * 0.95) + '" r=".42" fill="#1c1a16"/>';
    }).join('') + '</svg>';
  };
  $('die1').innerHTML = a ? pip(a) : '';
  $('die2').innerHTML = b ? pip(b) : '';
}

function syncTop() {
  var t = $('topInfo'), c = $('topCash');
  var eu = playerByPid(ME);
  if (eu) {
    t.innerHTML = '<b>' + esc(eu.name) + ' · sala ' + ST.code + '</b><span>' + CLASS_SHORT_UP(eu.level) +
      (eu.debt ? ' · dívida ' + fmt(eu.debt) : '') + '</span>';
    c.textContent = fmt(eu.cash);
  } else {
    var p = playerByPid(ST.turnPid);
    t.innerHTML = '<b>' + (p ? esc(p.name) : 'Status') + '</b><span>sala ' + ST.code + '</span>';
    c.textContent = '';
  }
  if (lastTurnPid !== ST.turnPid) {
    lastTurnPid = ST.turnPid;
    if (currentView !== 'viewPlayers') badge('bPlayers', 1);
  }
}

/* ---------------- tabuleiro ---------------- */
function polar(cx, cy, r, deg) { var a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
function sectorPath(cx, cy, r1, r2, a0, a1) {
  var p0 = polar(cx, cy, r2, a0), p1 = polar(cx, cy, r2, a1);
  var p2 = polar(cx, cy, r1, a1), p3 = polar(cx, cy, r1, a0);
  var large = (a1 - a0) > 180 ? 1 : 0;
  return 'M' + p0[0] + ',' + p0[1] + ' A' + r2 + ',' + r2 + ' 0 ' + large + ' 1 ' + p1[0] + ',' + p1[1] +
    ' L' + p2[0] + ',' + p2[1] + ' A' + r1 + ',' + r1 + ' 0 ' + large + ' 0 ' + p3[0] + ',' + p3[1] + ' Z';
}
function bizIdx(id) { for (var i = 0; i < B.BIZ.length; i++) if (B.BIZ[i].id === id) return i; return -1; }
function spaceColor(sp) { return sp.t === 'biz' ? B.BIZ[bizIdx(sp.id)].color : (B.SPACE_COLORS[sp.t] || '#ccc'); }
function spaceTextColor(sp) {
  if (sp.t === 'biz') return bizIdx(sp.id) === 4 ? '#3a2c08' : '#fff';
  return ['entrada', 'desquite', 'loteria', 'jockey', 'golpe'].indexOf(sp.t) >= 0 ? '#221d14' : '#fff';
}
function spaceLabelLines(sp, level) {
  if (sp.t === 'biz') {
    var b = B.BIZ[bizIdx(sp.id)];
    return [b.name, b.products[level] + ' ' + B.SYMBOL_PRICE[level], 'outra compra ' + B.OUTRA[level]];
  }
  return sp.label.split('\\n');
}
var NEWSPRINT = (function () {
  var rows = '';
  for (var y = 8; y < 118; y += 7) {
    var w1 = 6 + Math.floor(Math.random() * 30), w2 = 48 + Math.floor(Math.random() * 60);
    rows += '<rect x="' + w1 + '" y="' + y + '" width="' + w2 + '" height="2.3" fill="#8d8468" opacity="' + (0.35 + Math.random() * 0.3) + '"/>';
    rows += '<rect x="' + (w1 + w2 + 6) + '" y="' + y + '" width="' + Math.max(4, 110 - w1 - w2) + '" height="2.3" fill="#8d8468" opacity="' + (0.3 + Math.random() * 0.3) + '"/>';
  }
  return rows;
})();
function drawIcon(sp, cx2, cy2, rot, scale) {
  var g = 'transform="translate(' + cx2 + ',' + cy2 + ') rotate(' + rot + ') scale(' + scale + ')"';
  if (sp.t === 'jockey') return '<g ' + g + '><circle r="13" fill="#f4efdc" stroke="#221d14" stroke-width="1.6"/><path d="M-7,8 L-7,1 L-3,-5 L-1,-8 L2,-5 L3,-2 L7,0 L7,3 L2,2 L2,5 L-1,5 L-1,8 Z" fill="none" stroke="#221d14" stroke-width="1.7" stroke-linejoin="round"/></g>';
  if (sp.t === 'bolsa') return '<g ' + g + '><rect x="-15" y="-8" width="30" height="16" fill="none" stroke="#10312b" stroke-width="1.2"/><path d="M-13,5 L-7,-4 L-2,2 L4,-6 L9,0 L13,-5" fill="none" stroke="#10312b" stroke-width="1.8"/><path d="M-15,-4 H15 M-15,0 H15 M-15,4 H15" stroke="#10312b" stroke-width=".5" opacity=".6"/></g>';
  if (sp.t === 'golpe') return '<g ' + g + '><circle cx="-4" cy="0" r="7" fill="none" stroke="#fff" stroke-width="2.2"/><circle cx="5" cy="-2" r="7" fill="none" stroke="#fff" stroke-width="2.2"/></g>';
  if (sp.t === 'liquida') return '<g ' + g + '><rect x="-12" y="-8" width="24" height="16" rx="2" fill="#f4efdc" stroke="#221d14" stroke-width="1.2"/><rect x="-12" y="-4" width="24" height="3.5" fill="#221d14"/><rect x="-9" y="3" width="10" height="2" fill="#a08c50"/></g>';
  if (sp.t === 'doc') return '<g ' + g + '><rect x="-4" y="-11" width="8" height="22" rx="3.5" fill="#f4efdc" stroke="#221d14" stroke-width="1.2"/><rect x="-5.5" y="-2" width="11" height="3.6" fill="#c8473f"/></g>';
  if (sp.t === 'funeral') return '<g ' + g + '><path d="M0,-9 V9 M-6,-3 H6" stroke="#f4efdc" stroke-width="2.4"/></g>';
  return '';
}

/* O desenho das casas é fixo: só peões, destaque da vez e a lupa mudam.
   Se nada disso mudou desde a última vez, não vale reconstruir o SVG inteiro —
   é o que fazia o registro de um leilão redesenhar o tabuleiro à toa. */
var _boardSig = null;
function boardSig() {
  if (!ST || !ST.players) return 'x';
  var s = (ST.turnPid || '') + '|' + (window.MOBILE_HIDE_LENS ? '1' : '0') + '|' + ST.phase;
  for (var i = 0; i < ST.players.length; i++) {
    var p = ST.players[i];
    s += '|' + p.pid + ',' + p.level + ',' + p.pos + ',' + p.color;
  }
  return s;
}
function renderBoard(forcar) {
  if (!B) return;
  var sig = boardSig();
  if (!forcar && sig === _boardSig) return;   // nada mudou no tabuleiro
  _boardSig = sig;
  var svg = $('board'), cx = 500, cy = 500;
  var out = '<defs><pattern id="news" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-2)">' +
    '<rect width="120" height="120" fill="#e9dfc0"/>' + NEWSPRINT + '</pattern>' +
    '<radialGradient id="vign" cx="50%" cy="46%" r="62%"><stop offset="72%" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="100%" stop-color="#000" stop-opacity=".22"/></radialGradient></defs>' +
    '<rect width="1000" height="1000" fill="url(#news)"/>';
  out += '<g id="boardContent"><rect width="1000" height="1000" fill="url(#news)"/>';
  out += '<g text-anchor="middle"><g transform="translate(500,512) skewX(-8)">' +
    '<text x="0" y="0" font-family="Georgia,serif" font-style="italic" font-weight="900" font-size="86" fill="#2f9ec4" letter-spacing="-4">status</text></g>' +
    '<text x="500" y="548" font-family="Helvetica,Arial" font-size="15" letter-spacing="3" fill="#6b6350">O JOGO DA ASCENSÃO SOCIAL</text></g>';

  var wrap = function (s, max) {
    var words = String(s).split(' '), ls = [], cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length <= max) cur = (cur + ' ' + w).trim();
      else { if (cur) ls.push(cur); cur = w; }
    });
    if (cur) ls.push(cur);
    return ls;
  };

  B.TRACKS.forEach(function (tr, level) {
    var r1 = B.RINGS[level].r1, r2 = B.RINGS[level].r2, step = 360 / tr.length;
    tr.forEach(function (sp, i) {
      var a1 = 180 - i * step, a0 = a1 - step, mid = (a0 + a1) / 2;
      out += '<path d="' + sectorPath(cx, cy, r1, r2, a0, a1) + '" fill="' + spaceColor(sp) +
        '" stroke="#17130d" stroke-width="2" data-sp="' + level + '_' + i + '"/>';
      var raw = spaceLabelLines(sp, level);
      var rmid = (r1 + r2) / 2;
      var hasIcon = ['jockey', 'bolsa', 'golpe', 'liquida', 'doc', 'funeral'].indexOf(sp.t) >= 0;
      var iconOnly = (sp.t === 'jockey' || sp.t === 'bolsa');
      var lines = [];
      raw.forEach(function (ln, li) { wrap(ln, 13).forEach(function (x) { lines.push({ txt: x, head: li === 0 }); }); });
      if (iconOnly) lines = lines.filter(function (l) { return l.head; });
      var tp = polar(cx, cy, rmid + (iconOnly ? -15 : hasIcon ? -11 : 0), mid);
      var mNorm = ((mid % 360) + 360) % 360;
      var rot = mNorm - 90;
      var rN = ((rot % 360) + 360) % 360;
      if (rN > 90 && rN < 270) rot += 180;
      var fs = 10, lh = 11.2;
      var txt = '<g transform="translate(' + tp[0] + ',' + tp[1] + ') rotate(' + rot + ')" text-anchor="middle" font-family="Helvetica,Arial" fill="' + spaceTextColor(sp) + '" pointer-events="none">';
      var y0 = -((lines.length - 1) * lh) / 2;
      lines.forEach(function (ln, li) {
        txt += '<text x="0" y="' + (y0 + li * lh + 3) + '" font-weight="' + (ln.head ? '800' : '600') +
          '" font-size="' + (ln.head ? fs : fs - 2) + '">' + ln.txt + '</text>';
      });
      txt += '</g>';
      if (hasIcon) {
        var ip = polar(cx, cy, r2 - 13, mid);
        txt = '<g pointer-events="none">' + drawIcon(sp, ip[0], ip[1], rot, level === 0 ? 0.85 : level === 1 ? 0.75 : 0.68) + txt + '</g>';
      }
      out += txt;
    });
  });

  if (ST && ST.players.length && ST.phase !== 'lobby') {
    var groups = {};
    ST.players.forEach(function (p) {
      var k = p.level + '_' + p.pos;
      (groups[k] = groups[k] || []).push(p);
    });
    Object.keys(groups).forEach(function (k) {
      var ps = groups[k], parts = k.split('_'), lvl = +parts[0], pos = +parts[1];
      var tr = B.TRACKS[lvl], step = 360 / tr.length, mid = 180 - (pos + 0.5) * step;
      var rr = B.RINGS[lvl].r1 + 11;
      ps.forEach(function (p, j) {
        var spread = (j - (ps.length - 1) / 2) * (step * 0.30);
        var xy = polar(500, 500, rr, mid + spread);
        var act = p.pid === ST.turnPid;
        var eu = p.pid === ME;
        out += '<g><circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="' + (act ? 12 : 10) + '" fill="' + p.color + '" stroke="' + (eu ? '#ffd76e' : '#fff') + '" stroke-width="' + (eu ? 3.4 : 2.6) + '"/>' +
          '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="' + (act ? 12 : 10) + '" fill="none" stroke="#17130d" stroke-width="1.2"/>' +
          (act ? '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="16" fill="none" stroke="#ffd76e" stroke-width="2.4"><animate attributeName="r" values="14;18;14" dur="1.4s" repeatCount="indefinite"/></circle>' : '') + '</g>';
      });
    });
  }
  out += '</g>';

  if (ST && ST.turnPid && !window.MOBILE_HIDE_LENS) {
    var p = playerByPid(ST.turnPid);
    if (p) {
      var tr2 = B.TRACKS[p.level], st2 = 360 / tr2.length, mid2 = 180 - (p.pos + 0.5) * st2;
      var rr2 = (B.RINGS[p.level].r1 + B.RINGS[p.level].r2) / 2;
      var pc = polar(500, 500, rr2, mid2);
      var K = 1.9, R = 112, M = R + 10;
      var lx = Math.max(M, Math.min(1000 - M, pc[0])), ly = Math.max(M, Math.min(1000 - M, pc[1]));
      out += '<g pointer-events="none"><circle cx="' + (lx + 4) + '" cy="' + (ly + 6) + '" r="' + (R + 5) + '" fill="#00000042"/>' +
        '<clipPath id="lensClip"><circle cx="' + lx + '" cy="' + ly + '" r="' + R + '"/></clipPath>' +
        '<g clip-path="url(#lensClip)"><rect x="' + (lx - R) + '" y="' + (ly - R) + '" width="' + (2 * R) + '" height="' + (2 * R) + '" fill="#e9dfc0"/>' +
        '<use href="#boardContent" transform="translate(' + (lx - K * pc[0]) + ',' + (ly - K * pc[1]) + ') scale(' + K + ')"/></g>' +
        '<circle cx="' + lx + '" cy="' + ly + '" r="' + R + '" fill="none" stroke="#17130d" stroke-width="5"/>' +
        '<circle cx="' + lx + '" cy="' + ly + '" r="' + (R + 3.5) + '" fill="none" stroke="#e5a52e" stroke-width="3"/></g>';
    }
  }
  out += '<rect width="1000" height="1000" fill="url(#vign)" pointer-events="none"/><g id="hoverG" pointer-events="none"></g>';
  svg.innerHTML = out;
}

/* ---------------- zoom / pan ---------------- */
var BOARD_PX = 1012, MINS = 0.28, MAXS = 4, LENS_MAX = 1.15;
var scale = 1, tx = 0, ty = 0, follow = true, lastKey = '';
function boxOf() { var r = $('boardStage').getBoundingClientRect(); return { w: r.width, h: r.height }; }
function apply() { $('board').style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')'; }
function clamp() {
  var b = boxOf(), sz = BOARD_PX * scale, m = 90;
  tx = sz <= b.w ? (b.w - sz) / 2 : Math.min(m, Math.max(b.w - sz - m, tx));
  ty = sz <= b.h ? (b.h - sz) / 2 : Math.min(m, Math.max(b.h - sz - m, ty));
}
/* No computador, deixa a área do tabuleiro quadrada — do tamanho da altura
   disponível — para não sobrar faixa escura dos lados. O que sobra de largura
   vai para os painéis. Se a janela for baixa e larga, o limite passa a ser a
   largura, para os painéis nunca ficarem espremidos abaixo do legível. */
var LADO_MIN_PAINEIS = 560, PAD_STAGE = 28, GAP_STAGE = 14;
function ajustaColunas() {
  var bs = $('boardStage');
  if (!DESK) { bs.style.flexBasis = ''; return; }
  var st = $('stage').getBoundingClientRect();
  var alturaUtil = st.height - PAD_STAGE;
  var larguraUtil = st.width - PAD_STAGE - GAP_STAGE;
  var lado = Math.min(alturaUtil, larguraUtil - LADO_MIN_PAINEIS);
  lado = Math.max(320, lado);
  bs.style.flexBasis = Math.floor(lado) + 'px';
}

function fit() {
  ajustaColunas();
  var b = boxOf();
  if (!b.w || !b.h) return;
  scale = Math.max(MINS, Math.min(MAXS, Math.min(b.w, b.h) / BOARD_PX * 0.99));
  tx = (b.w - BOARD_PX * scale) / 2; ty = (b.h - BOARD_PX * scale) / 2;
  syncLens(); apply();
}
function zoomAt(cx, cy, f) {
  var next = Math.max(MINS, Math.min(MAXS, scale * f)), k = next / scale;
  tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; scale = next;
  clamp(); syncLens(); apply();
}
function syncLens() {
  var hide = scale > LENS_MAX;
  if (!!window.MOBILE_HIDE_LENS === hide) return;
  window.MOBILE_HIDE_LENS = hide;
  renderBoard();
}
function spaceCenterPx(level, pos) {
  var tr = B.TRACKS[level], step = 360 / tr.length, mid = 180 - (pos + 0.5) * step;
  var rr = (B.RINGS[level].r1 + B.RINGS[level].r2) / 2;
  var xy = polar(500, 500, rr, mid);
  return { x: 6 + xy[0], y: 6 + xy[1] };
}
function centerOnActive(force) {
  if (!ST || !ST.turnPid || currentView !== 'boardStage') return;
  var p = playerByPid(ST.turnPid);
  if (!p) return;
  var key = p.pid + ':' + p.level + ':' + p.pos;
  if (!force && (key === lastKey || !follow)) return;
  lastKey = key;
  if (!follow && !force) return;
  var b = boxOf();
  if (!b.w) return;
  var c = spaceCenterPx(p.level, p.pos);
  tx = b.w / 2 - c.x * scale; ty = b.h / 2 - c.y * scale;
  clamp();
  var el = $('board');
  el.style.transition = 'transform .35s ease-out';
  apply();
  setTimeout(function () { el.style.transition = ''; }, 380);
}
function setFollow(v) { follow = v; $('zfollow').classList.toggle('on', v); }

(function gestures() {
  var view = $('boardStage'), pts = new Map();
  var d0 = 0, s0 = 1, mid0 = null, moved = 0, down = null;
  var loc = function (x, y) { var r = view.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
  var midOf = function () { var a = Array.from(pts.values()); return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
  var dist = function () { var a = Array.from(pts.values()); return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
  view.addEventListener('pointerdown', function (ev) {
    if (ev.target.closest('.zoomctl,.spacecard')) return;
    view.setPointerCapture(ev.pointerId);
    pts.set(ev.pointerId, loc(ev.clientX, ev.clientY));
    if (pts.size === 1) { var q = pts.get(ev.pointerId); down = { x: q.x, y: q.y, t: Date.now() }; moved = 0; }
    if (pts.size === 2) { d0 = dist(); s0 = scale; mid0 = midOf(); }
  });
  view.addEventListener('pointermove', function (ev) {
    if (!pts.has(ev.pointerId)) return;
    var prev = pts.get(ev.pointerId), cur = loc(ev.clientX, ev.clientY);
    pts.set(ev.pointerId, cur);
    if (pts.size === 1) {
      var dx = cur.x - prev.x, dy = cur.y - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 8) setFollow(false);
      tx += dx; ty += dy; clamp(); apply();
    } else if (pts.size === 2 && d0) {
      setFollow(false);
      var d = dist(), m = midOf();
      var next = Math.max(MINS, Math.min(MAXS, s0 * d / d0)), k = next / scale;
      tx = m.x - (m.x - tx) * k; ty = m.y - (m.y - ty) * k; scale = next;
      tx += m.x - mid0.x; ty += m.y - mid0.y; mid0 = m;
      clamp(); syncLens(); apply(); moved = 99;
    }
  });
  var up = function (ev) {
    pts.delete(ev.pointerId);
    if (pts.size < 2) d0 = 0;
    if (pts.size === 0 && down && moved < 9 && Date.now() - down.t < 600) {
      var el = document.elementFromPoint(ev.clientX, ev.clientY);
      var path = el && el.closest ? el.closest('path[data-sp]') : null;
      if (path) tapSpace(path); else closeCard();
    }
    down = null;
  };
  view.addEventListener('pointerup', up);
  view.addEventListener('pointercancel', up);
  view.addEventListener('wheel', function (ev) {
    ev.preventDefault(); setFollow(false);
    var p = loc(ev.clientX, ev.clientY);
    zoomAt(p.x, p.y, ev.deltaY < 0 ? 1.14 : 1 / 1.14);
  }, { passive: false });
})();

$('zin').onclick = function () { var b = boxOf(); buzz(8); zoomAt(b.w / 2, b.h / 2, 1.3); };
$('zout').onclick = function () { var b = boxOf(); buzz(8); zoomAt(b.w / 2, b.h / 2, 1 / 1.3); };
$('zfit').onclick = function () { buzz(8); setFollow(false); closeCard(); fit(); };
$('zfollow').onclick = function () { buzz(8); setFollow(!follow); if (follow) centerOnActive(true); };

function closeCard() { $('spacecard').style.display = 'none'; var g = $('hoverG'); if (g) g.innerHTML = ''; }
function tapSpace(path) {
  buzz(9);
  var parts = path.dataset.sp.split('_'), lvl = +parts[0], i = +parts[1];
  var sp = B.TRACKS[lvl][i], body;
  if (sp.t === 'biz') {
    var bi = bizIdx(sp.id), bz = B.BIZ[bi];
    var dono = ST && ST.owners[bi] != null ? (playerByPid(ST.owners[bi]) || {}).name : 'Banco';
    body = '<span class="ttl">' + bz.name + '</span>Dono: <b>' + esc(dono || 'Banco') + '</b><br>' +
      'Símbolo desta classe: <b>' + bz.products[lvl] + '</b> — ' + fmt(B.SYMBOL_PRICE[lvl]) + '<br>' +
      'Outra compra: ' + fmt(B.OUTRA[lvl]) + '<br>Estoque (baixa/média/alta): ' + (ST ? ST.stock[bi].join(' / ') : '3 / 3 / 3');
  } else {
    var ln = sp.label.split('\\n');
    body = '<span class="ttl">' + ln[0] + '</span>' + (ln.slice(1).join('<br>') || '&nbsp;');
  }
  var aqui = ST ? ST.players.filter(function (p) { return p.level === lvl && p.pos === i; }) : [];
  var who = aqui.length ? '<br><br>Aqui: <b>' + aqui.map(function (p) { return esc(p.name); }).join(', ') + '</b>' : '';
  var c = $('spacecard');
  c.innerHTML = '<button class="x" aria-label="Fechar">×</button><h4>' + B.CLASSES[lvl] + ' · casa ' + (i + 1) + '/' + B.TRACKS[lvl].length + '</h4>' + body + who;
  c.style.display = 'block';
  c.querySelector('.x').onclick = closeCard;
}

/* ---------------- abas ---------------- */
Array.prototype.forEach.call(document.querySelectorAll('#tabbar button'), function (b) {
  b.onclick = function () {
    if (DESK) return;      // no computador tudo já está na tela
    buzz(8);
    currentView = b.dataset.view;
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) { v.classList.toggle('on', v.id === currentView); });
    Array.prototype.forEach.call(document.querySelectorAll('#tabbar button'), function (x) { x.classList.toggle('on', x.dataset.view === currentView); });
    if (currentView === 'viewLog') { logSeen = ST ? ST.log.length : 0; badge('bLog', 0); }
    if (currentView === 'viewPlayers') badge('bPlayers', 0);
    if (currentView === 'boardStage') requestAnimationFrame(function () { clamp(); apply(); if (follow) centerOnActive(true); });
  };
});

function showHelp() { $('helpBox').innerHTML = HELP_REGRAS; $('tablesBox').innerHTML = HELP_TABELAS; }

var HELP_REGRAS = ${JSON.stringify(`<b>Objetivo:</b> ser o primeiro com a meta em dinheiro (padrão $10.000), <b>3 símbolos da alta sociedade</b> e nenhuma dívida no cartão.<br><br>
<b>Turno:</b> antes dos dados você pode subir de classe (se cumprir as exigências). Depois lança 2 dados e anda no seu anel.<br><br>
<b>Comércios:</b> parou em comércio alheio? Compre o símbolo da sua classe (ou de uma superior) pagando ao dono, ou faça a <i>Outra Compra</i>, mais barata e obrigatória (só dinheiro). Máximo de 3 símbolos, sem repetir artigo, nunca de classe inferior à sua.<br><br>
<b>Cartão de crédito:</b> símbolos, diplomas e títulos podem ser comprados a crédito, sem limite. Na casa <i>Liquidação do Débito</i> paga-se TUDO + 10%. Impostos, pensões e Outra Compra: só dinheiro.<br><br>
<b>Subir de classe:</b> para a média — $50, 3 símbolos (de comércios que não sejam seus) e Supletivo ou Country Club. Para a alta — $300, 3 símbolos da média/alta e Faculdade ou Iate Club. Falta o documento? Mercado negro: $20 / $100. Ao subir, os símbolos e documentos da classe anterior vão a leilão.<br><br>
<b>Falência:</b> quem não paga uma obrigação leiloa os bens; se não bastar, entrega o dinheiro ao credor e recomeça na classe baixa com $20 (mantendo os comércios).<br><br>
<b>Online:</b> toda pergunta tem cronômetro (a barra dourada no alto da folha). Se o tempo acabar, o servidor escolhe a opção segura por você — não comprar, não apostar, lance zero — e a partida segue. Quem cai da conexão não trava a mesa.`)};

var HELP_TABELAS = ${JSON.stringify(`<b>Bolsa de Valores</b> (investimento entra na cotação 7)
<table><tr><th>Cotação</th><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td></tr>
<tr><th>Resultado</th><td>perde tudo</td><td>resta 10</td><td>¼</td><td>½</td><td>¾</td><td>igual</td><td>+½×</td><td>+1×</td><td>+2×</td><td>+5×</td><td>+10×</td></tr></table>
<b>Jockey</b> (pagamentos por 1 apostado — 1º/2º/3º lugar)
<table><tr><th>Cavalo</th><td>2 e 12</td><td>3 e 11</td><td>4 e 10</td><td>5 e 9</td><td>6 e 8</td><td>7</td></tr>
<tr><th>Paga</th><td>40/20/10</td><td>20/10/5</td><td>12/7/4</td><td>10/5/3</td><td>7/4/2</td><td>6/3/1</td></tr></table>
<b>Grande Prêmio:</b> dobradinha $100 · soma par $20 · ímpar $5.<br>
<b>Impostos:</b> dados × 1 (baixa), × 10 (média), × 100 (alta).`)};

/* A escolha da versão vale desde a tela de entrada, não só depois de sentar
   à mesa — senão o cartão de entrada fica espremido numa faixa de celular
   no meio do monitor, com a moldura sobrando dos lados. */
(function iniciaModo() {
  var salvo = lerModo();
  setModo(salvo ? salvo === 'desk' : detectaDesk(), false);
})();

document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
document.addEventListener('dblclick', function (e) { e.preventDefault(); });
window.addEventListener('resize', function () {
  setTimeout(function () {
    // no computador a área do tabuleiro muda de tamanho junto com a janela;
    // no celular só reposiciona, para não jogar fora o zoom que a pessoa deu
    if (DESK) { ajustaColunas(); fit(); } else { clamp(); apply(); }
    centerOnActive(true);
  }, 150);
});
setTimeout(function () { var h = $('hint'); if (h) { h.style.opacity = '0'; setTimeout(function () { h.remove(); }, 600); } }, 6500);
</script>
</body>
</html>`;
