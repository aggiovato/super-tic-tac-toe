import { GAME_ROOMS_PATH } from '@protocol';
import { Hono } from 'hono';
import { gameRoomsController } from './controllers/game-rooms.controller';
import { GameRoom } from './durable-objects/game-room.durable-object';

// The Worker's entry: the controllers under /api, and the Durable Object class wrangler binds.
export { GameRoom };

const app = new Hono<{ Bindings: Env }>();
// For whoever needs to know the Worker is up (the e2e servers, a deploy check).
app.get('/api/health', (c) => c.text('ok'));
app.route(GAME_ROOMS_PATH, gameRoomsController);

export default app;
