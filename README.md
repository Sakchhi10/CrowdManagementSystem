# Crowd Management System (Kloudspot UI take-home)

React + Vite frontend that logs in, reads crowd analytics from the Kloudspot APIs and shows them live.

- **Login**: email/login ID + password with show/hide toggle, inline error on failure. The JWT is kept in `sessionStorage` and is never logged.
- **Overview**: Live Occupancy, Footfall and Avg Dwell Time cards with "% vs yesterday" indicators, an occupancy timeline with a LIVE marker, and a demographics donut + male/female timeline.
- **Crowd Entries**: server-paginated entry/exit table (Prev/Next and page numbers). Visitors without an exit time show an **Inside** badge.
- **Real time**: Socket.IO alerts appear as toasts and in the Alerts drawer (bell icon). Live occupancy events update the card and extend the chart without reloading.
- **Site + day selection**: site picker in the top bar (from `GET /api/sites`); day picker on each page. Day boundaries use the site's timezone.

## Demo mode

Set `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD` in `.env.development.local` (not committed, and not used by `npm run build`) and log in with them to explore the app with generated sample data and a simulated live feed (an alert and an occupancy update every 5 seconds). No API calls are made in a demo session. The top bar shows "Demo data" instead of "Live". Demo mode is off when these are unset. Any other credentials go to the real API. Credentials are never shown in the UI.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. The API base URL defaults to `https://hiring-dev.internal.kloudspot.com`; override it with `VITE_API_BASE_URL` (see `.env.example`).

## Build & deploy

```bash
npm run build
```

`dist/` is a static site. SPA fallbacks are included for Netlify (`public/_redirects`) and Vercel (`vercel.json`).

## Notes

- All dashboard requests start in parallel and each widget has its own loading skeleton, error state with Retry, and empty state, so one slow or failing API doesn't block the rest.
- "vs yesterday" compares the same time window one day earlier (e.g. 00:00–14:30 today vs 00:00–14:30 yesterday).
- A 401 from any API clears the session and returns to the login page.
- Swagger doesn't document the occupancy/demographics response bodies or the socket event names, so the parsers in `src/api/endpoints.js` and `src/live/LiveContext.jsx` accept the common field-name variants, and socket events are matched by name (`*alert*`, `*occupancy*`).
