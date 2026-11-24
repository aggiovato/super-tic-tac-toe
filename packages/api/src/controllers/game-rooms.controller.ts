import { gameById, isGameId } from '@catalog';
import { Hono } from 'hono';
import { clientKey } from '../security/limits';

/** A room's Durable Object, or null for an id that is not one of ours. */
function roomOf(env: Env, id: string) {
  try {
    return env.GAME_ROOMS.get(env.GAME_ROOMS.idFromString(id));
  } catch {
    return null;
  }
}

/** The rooms' HTTP controller, under `/api/game-rooms`: it checks the input and calls the room. */
export const gameRoomsController = new Hono<{ Bindings: Env }>();

// Creating and joining are limited per client address: a few a minute is plenty for people.
gameRoomsController.post('*', async (c, next) => {
  const { success } = await c.env.ROOM_REQUESTS.limit({ key: clientKey(c.req.raw) });
  if (!success) {
    return c.json({ error: 'too-many' }, 429);
  }
  return next();
});

/**
 * Creates a private room for a game of the catalog that is played online (and a variant it
 * offers): the creator gets seat 0 and its token, and shares the room's id as the invitation.
 */
gameRoomsController.post('/', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const { gameId, variant } = (body ?? {}) as { gameId?: unknown; variant?: unknown };
  if (!isGameId(gameId)) {
    return c.json({ error: 'unknown-game' }, 400);
  }
  const game = gameById(gameId);
  // A game not offered online yet (Ship Sink, until each seat is sent only its own view).
  if (!game.online) {
    return c.json({ error: 'not-online' }, 400);
  }
  const id = c.env.GAME_ROOMS.newUniqueId();
  const token = await c.env.GAME_ROOMS.get(id).create({
    gameId,
    variant: game.variantOf(typeof variant === 'string' ? variant : undefined),
    rulesVersion: game.rulesVersion,
  });
  return c.json({ roomId: id.toString(), seat: 0, token }, 201);
});

/** Takes the guest's seat through the invitation, once. */
gameRoomsController.post('/:id/join', async (c) => {
  const room = roomOf(c.env, c.req.param('id'));
  const outcome = room ? await room.join() : { ok: false as const, reason: 'missing' as const };
  if (!outcome.ok) {
    return c.json({ error: outcome.reason }, outcome.reason === 'full' ? 409 : 404);
  }
  return c.json({ seat: outcome.seat, token: outcome.token }, 201);
});

/** A player's socket to the room; its token names its seat. */
gameRoomsController.get('/:id/socket', async (c) => {
  const room = roomOf(c.env, c.req.param('id'));
  if (!room) {
    return c.json({ error: 'missing' }, 404);
  }
  return room.fetch(c.req.raw);
});
