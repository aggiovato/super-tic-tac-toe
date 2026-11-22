/**
 * The one global the engines read from their runtime: a monotonic clock for the computer players'
 * time budgets. Browsers, Node and Cloudflare Workers all provide it; the package takes neither the
 * DOM's nor Node's types, so it states just this.
 */
declare const performance: { now(): number };
