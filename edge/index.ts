/**
 * The app's Worker. It runs only for `/api/*` (`run_worker_first` in wrangler.jsonc): those
 * requests, WebSocket upgrades included, go to the API Worker through its service binding, on the
 * same origin, so the app needs no CORS and the API has no public address of its own. Everything
 * else is the static build, served without running this code.
 */
interface Env {
  /** `super-3t-api` in production; pre and each PR preview bind their own (scripts/wrangler-config.mjs). */
  readonly API: Fetcher;
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return env.API.fetch(request);
  },
} satisfies ExportedHandler<Env>;
