/* ============================================================
   STATUS ONLINE — Worker de entrada
   ============================================================ */
import { GameRoom } from './game.js';
import { PAGE } from './html.js';

export { GameRoom };

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () =>
  Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

const html = (body) =>
  new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

/* Nada de API vai para cache: código de sala sorteado não pode repetir,
   e o estado da sala muda a cada segundo. */
const json = (obj, status = 200) =>
  Response.json(obj, { status, headers: { 'cache-control': 'no-store, no-cache, must-revalidate', 'pragma': 'no-cache' } });

function room(env, code) {
  return env.GAME_ROOM.get(env.GAME_ROOM.idFromName('sala:' + code));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') return new Response('ok');

    // cria uma sala nova e devolve o código.
    // Só POST: método não-idempotente não é guardado em cache por engano.
    if (path === '/api/new') {
      if (request.method !== 'POST') return json({ error: 'use POST' }, 405);
      for (let tentativa = 0; tentativa < 8; tentativa++) {
        const code = newCode();
        const r = await room(env, code).fetch(
          new Request(`https://sala/create?code=${code}`, { method: 'POST' })
        );
        if (r.ok) return json({ code });
      }
      return json({ error: 'não consegui criar a sala' }, 500);
    }

    // a sala existe?
    const mExists = path.match(/^\/api\/room\/([A-Za-z0-9]{4})$/);
    if (mExists) {
      const code = mExists[1].toUpperCase();
      const r = await room(env, code).fetch(new Request('https://sala/exists'));
      const j = await r.json();
      return json({ code, ...j });
    }

    // websocket da sala
    if (path === '/ws') {
      const code = (url.searchParams.get('code') || '').toUpperCase();
      if (!/^[A-Z0-9]{4}$/.test(code)) return new Response('código inválido', { status: 400 });
      return room(env, code).fetch(new Request('https://sala/ws', request));
    }

    // a página serve tanto a raiz quanto o link de convite /r/CODE
    if (path === '/' || /^\/r\/[A-Za-z0-9]{4}$/.test(path)) return html(PAGE);

    return new Response('não encontrado', { status: 404 });
  },
};
