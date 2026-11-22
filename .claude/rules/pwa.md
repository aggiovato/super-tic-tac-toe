---
paths:
  - 'ngsw-config.json'
  - 'public/_headers'
  - 'public/manifest.webmanifest'
  - 'src/app/app.config.ts'
  - 'src/app/shell/app-updates.ts'
  - 'src/app/shell/update-notice/**'
  - 'e2e/offline.spec.ts'
---

# Offline play and updates (phase 5)

- **Service worker**: `@angular/service-worker`, production builds only (`angular.json`
  `serviceWorker`, `provideServiceWorker` with `registerWhenStable:30000`). `ngsw-config.json`
  prefetches everything a game needs offline: `index.html`, the manifest, favicons, every `.js` (the
  lazy routes and each opponent's Worker, so a level never opened before still plays) and `.css`,
  then the `.woff2` fonts, textures and icons. `og.png` and the legacy `.woff` fonts stay out. A new
  file the app needs offline goes into one of these groups.
- **Caching headers** (`public/_headers`): only `main-*.js`, `chunk-*.js`, CSS and `media/` are
  immutable. Not `worker-*.js`: that glob also matches the service worker's `worker-basic.min.js`,
  and every matching rule applies (Cloudflare, like Netlify, joins the values). `index.html`, `ngsw-worker.js`, `ngsw.json` and the
  worker's helpers are `no-cache`, so a release reaches installed copies.
- **Updates**: `AppUpdates` (`@shell`) is created at start-up (`provideAppUpdates`, an app
  initializer) so no service worker event is missed. It checks for a version at start, every
  `UPDATE_CHECK_MS` (30 min) and when the page comes back to the foreground. `ready` turns on with
  `VERSION_READY`; `broken` with an unrecoverable version, which `UpdateNotice` reloads by itself as
  soon as no save is under way. `UpdateNotice` (the game layout's controls, under the history's
  masthead) hides while a save is under way; if the game could not be saved it warns that the last
  moves would be lost and the player presses "Update anyway". `RELOAD_PAGE` is a token tests
  replace; without `SwUpdate` (tests, development) nothing happens. The notice lives in an
  always-present `aria-live` region (not `role="status"`: the game's status sentence holds it).
- **Tests**: `update-notice.spec.ts` (fake `SwUpdate`), `e2e/offline.spec.ts` (installs online,
  waits until every prefetched file is cached and the page is controlled, then plays the three games
  offline and resumes a game after an offline reload). Other specs block the service worker.
