// Where to fetch data/*.json from. On the web (GitHub Pages) this stays
// empty, so data is fetched same-origin and benefits from the service
// worker's offline cache. The desktop (Electron) build serves its own UI
// locally but has no daily-refreshed data of its own baked in, so it's
// pointed at the live site instead via VITE_DATA_BASE_URL at build time —
// otherwise it would be stuck showing whatever digest existed when that
// particular installer was built.
export const DATA_BASE_URL = import.meta.env.VITE_DATA_BASE_URL ?? ''
