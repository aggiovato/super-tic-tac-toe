// The API Worker's bindings (wrangler.jsonc), for the Worker and for the tests (`cloudflare:test`).
interface Env {
  readonly GAME_ROOMS: DurableObjectNamespace<
    import('./durable-objects/game-room.durable-object').GameRoom
  >;
}

declare namespace Cloudflare {
  interface Env {
    readonly GAME_ROOMS: DurableObjectNamespace<
      import('./durable-objects/game-room.durable-object').GameRoom
    >;
  }
}
