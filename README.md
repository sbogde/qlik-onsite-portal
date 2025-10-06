# Qlik Onsite Portal

React + Vite PWA (Progressive Web App) mashup that brokers access to the Qlik Sense "Consumer Sales" demo app through a hardened reverse proxy. The UI renders live Qlik objects, exposes lightweight analytics pages, and runs entirely on top of a single proxy endpoint so it can be deployed on-prem or via Cloudflare tunnels without exposing the Sense tenant directly.

## Key Features

- **Progressive Web App (PWA)**: Installable, offline-capable, with automatic updates
- Reverse‑proxy workflow: all HTTP (`/api/*`) and WebSocket traffic flows through the Node/Express proxy running on `localhost:3000` (or a remote tunnel).
- Bundled QIX schema (`12.170.2`) so the client never downloads `enigma.json` from Qlik Cloud during runtime.
- `enigma.js` session helper with a diagnostic `testQlikConnection()` that logs engine version and doc list for quick smoke testing.
- React components (`QlikObjectContainer`) that request visualisations via Nebula.js and react to connection state events.
- Navigation sidebar shows real-time connection status sourced from `qlikService` events.
- Playwright e2e smoke test validating the mock service path.

## PWA Features

✨ **Install on any device** - Works like a native app  
🔄 **Automatic updates** - Always get the latest version  
📱 **Offline support** - Cached content works without internet  
⚡ **Fast loading** - Instant startup with service worker caching  

See [PWA_FEATURES.md](./PWA_FEATURES.md) for detailed PWA documentation.

## Project Structure Highlights

- `src/lib/qlik.ts` – service wrapper that opens the Qlik doc through the proxy, renders objects with Nebula, and emits `connected` / `disconnected` events.
- `src/qlik/session.ts` – lightweight helper for ad-hoc enigma global connections (bundled schema + WS URL from env).
- `src/qlik/api.ts` – fetch wrapper that always adds `x-proxy-token` for REST calls via the proxy.
- `src/qlik/url.ts` – shared helpers for proxy token access and appending it to WebSocket URLs.
- `src/components/QlikObjectContainer.tsx` – reusable container that mounts/destroys Qlik objects and displays skeletons/errors.
- `src/pages/Dashboard.tsx` – default route rendering KPIs/KPIs and triggering the connection check on load.
- `public/qlik-favicon.svg` – custom tab icon styled after the Qlik mark.

## Local Development

1. Install dependencies: `npm install`
2. Start the proxy (from its repo) so it listens on `http://localhost:3000` and forwards to the Sense tenant.
3. Copy `.env.local.example` (below) into `.env.local` and adjust values as needed.
4. Run the Vite dev server: `npm run dev` (defaults to http://localhost:8080).
5. Open the app in a browser; the dashboard will log QIX version and document list via `testQlikConnection()`.

### Required Env Vars (Vite)

```
VITE_QLIK_HTTP_BASE=http://localhost:3000/api
VITE_QLIK_WS_URL=ws://localhost:3000/app/372cbc85-f7fb-4db6-a620-9a5367845dce
VITE_PROXY_TOKEN=your_secret_here
```

When `VITE_PROXY_TOKEN` is set the frontend automatically appends `?token=<value>` to the WebSocket URL while continuing to send the header on REST calls.

When deploying behind Cloudflare or another remote proxy, switch to the hosted URLs, e.g.:

```
VITE_QLIK_HTTP_BASE=https://qlik-proxy.sorinsorin.com/api
VITE_QLIK_WS_URL=wss://qlik-proxy.sorinsorin.com/app/372cbc85-f7fb-4db6-a620-9a5367845dce
```

Because Vite inlines `VITE_*` variables at build time, ensure the deployment pipeline sets them before running `npm run build`.

## Testing

- Unit/integration tests: none yet.
- Playwright: `npm run test:e2e` (uses the mock `qlikService` mode to verify UI behaviour without hitting Qlik).

## Deployment Notes

- Build with `npm run build`; the output in `dist/` is static and can be hosted on Lovable, Netlify or any static host.
- Configure the hosting environment to provide the same `VITE_*` vars used locally, or create an environment-specific `.env` file before building.
- The frontend assumes the proxy enforces `x-proxy-token` for REST calls; WebSocket auth should be handled server side (query string, cookie, etc.) since browsers cannot add custom headers to WS handshakes.

## Troubleshooting

- **White screen / hook errors** – ensure `useEffect` calls stay inside React components (see `src/pages/Dashboard.tsx`).
- **Still calling sense-demo directly** – confirm `VITE_QLIK_WS_URL` points to the proxy; the navigation status card displays the connection state derived from the proxy session.
- **Wrong proxy token seemingly ignored** – only REST calls go through `proxyGet` today; the WS handshake must be validated by the proxy itself (e.g., via query param) to enforce tokens.

## License

Internal project – no open-source license declared.
