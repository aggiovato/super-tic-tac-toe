import { Hono } from 'hono';
import { gameRoomsController } from './controllers/game-rooms.controller';
import { GameRoom } from './durable-objects/game-room.durable-object';

// The Worker's entry: the controllers under /api, and the Durable Object class wrangler binds.
export { GameRoom };

const app = new Hono<{ Bindings: Env }>().basePath('/api');
app.route('/game-rooms', gameRoomsController);

export default app;
