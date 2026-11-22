// The API Worker's bindings (wrangler.jsonc), for the Worker and for the tests (`cloudflare:test`).
interface Env {
  readonly GAME_ROOMS: DurableObjectNamespace<
    import('./durable-objects/game-room.durable-object').GameRoom
  >;
  /** Rooms created and joined per client address and minute. */
  readonly ROOM_REQUESTS: RateLimit;
}

declare namespace Cloudflare {
  interface Env {
    readonly GAME_ROOMS: DurableObjectNamespace<
      import('./durable-objects/game-room.durable-object').GameRoom
    >;
    readonly ROOM_REQUESTS: RateLimit;
  }
}
