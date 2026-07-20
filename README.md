# Status — O Jogo da Ascensão Social, online

Recriação digital do jogo da Grow (1977) para jogar com os amigos, cada um no seu
celular. Roda inteiro num Cloudflare Worker com Durable Objects; não precisa de
banco de dados nem de servidor próprio.

## Arquivos (todos na raiz do repositório)

| arquivo | o que faz |
|---|---|
| `index.js` | rotas do Worker: a página, `/api/new`, `/api/room/:code`, `/ws` |
| `game.js` | o Durable Object da sala — motor da partida, leilões, bots |
| `rules.js` | os dados do tabuleiro: 84 casas, comércios, tabelas, preços |
| `html.js` | a página do jogo (HTML, CSS e o JavaScript do navegador) |
| `wrangler.jsonc` | configuração do Worker e a migração do Durable Object |

Não há pastas. Não há `package.json`: o `npx wrangler deploy` instala o wrangler sozinho.

## Como publicar

1. Suba os cinco arquivos na raiz do repositório no GitHub.
2. Na Cloudflare, conecte o repositório com o comando de deploy `npx wrangler deploy`.
3. Cada commit dispara um build novo automaticamente.

## Como se joga

Quem cria a sala recebe um código de 4 letras e um link de convite. Os outros
abrem o link, digitam o nome e entram. O anfitrião pode completar a mesa com bots
(de 2 a 6 jogadores no total) e escolher a meta em dinheiro antes de começar.

O objetivo é o do manual original: chegar primeiro à meta em dinheiro, com **três
símbolos da alta sociedade** e **nenhuma dívida no cartão**.

## Decisões próprias da versão online

**As regras rodam no servidor.** O navegador só desenha o tabuleiro e responde às
perguntas. Nenhum jogador consegue forçar uma jogada pelo inspecionar elemento,
porque o estado que vale é o do Durable Object.

**Leilões são de lance fechado e simultâneos.** Todos ofertam ao mesmo tempo e
nenhuma oferta trafega pela rede antes do encerramento — o servidor só envia a
pergunta, nunca o lance alheio. Empate no lance mais alto é decidido por sorteio,
como manda o manual.

**Toda pergunta tem cronômetro** (a barra dourada no alto da folha). Se o tempo
acabar, o servidor escolhe a opção segura — não comprar, não apostar, lance zero —
e a partida segue. Sem isso, um celular esquecido na mesa travaria todo mundo.

**Quem cai da conexão não segura a mesa.** As perguntas de um jogador desconectado
são resolvidas em 3 segundos com a opção segura. Quando ele volta, reentra na
mesma partida, no mesmo lugar, com o mesmo dinheiro.

**Resultados de dados não pedem confirmação.** Impostos, Loteca, Grande Prêmio,
Jockey e Loteria aparecem como aviso na tela e a partida continua. Só as decisões
de verdade abrem a folha com botões.

**O anfitrião tem um "Seguir sem quem falta"** para o caso de alguém largar o
celular no meio de uma pergunta longa.

Se o servidor hibernar no meio da partida (todos fecharam o navegador), o estado
volta do disco quando alguém reconecta — o turno em andamento recomeça do início.

## Apagar uma sala na mão

Sala abandonada some sozinha em 48 horas. Para apagar antes disso, existe uma rota
protegida:

```
/admin/limpar?code=JHWH&chave=SEU_SEGREDO
```

Ela **nasce desligada**: sem a variável `ADMIN_KEY` configurada na Cloudflare
(Settings → Variables and Secrets, como *Secret*), a rota responde 404 como
qualquer endereço inexistente. Chave errada também devolve 404, para não confirmar
que ela existe.

O painel da Cloudflare não serve para isso. O **Data Studio** só enxerga tabelas
criadas pela API de SQL; como o estado é gravado pela API de chave-valor, a tabela
interna `_cf_KV` responde `SQLITE_AUTH: access prohibited` até para o dono da conta.

## Testes

Três baterias, todas contra o código de verdade:

- `regras.mjs` — falência, venda forçada antes da falência, exigências de cada
  subida de classe, limites de símbolos, contagem das fichas e critério de vitória.
- `sim.mjs` — partidas inteiras só com bots, de 2 a 6 jogadores, conferindo a cada
  fim que as 9 fichas de cada comércio ainda fecham, que ninguém ficou com símbolo
  de classe inferior à sua e que o vencedor cumpriu mesmo a meta.
- `test.mjs` — partida real contra o `wrangler dev`, com dois humanos e dois bots,
  incluindo a queda proposital de um jogador no meio e a checagem de que nenhum
  lance de leilão vaza para os adversários.

```sh
npx wrangler dev          # em um terminal
node test.mjs             # em outro
node sim.mjs 24
node regras.mjs
```

Recriação para uso pessoal, baseada no manual original e em fotografias do
tabuleiro da Grow (1977).
