# Coding Exercise

## Challenge Overview

The objective of this exercise is to implement a web crawler scraping techniques.
This solution has to be capable of:
* Crawl a specific URL.
* Produce structured output from the scraped web page.
* Perform Filtering operations.
* Audit the filters used with timestamp.
* Store the audit data.


This solution also includes Docker support as an optional way to run the application in an isolated environment, to avoid any incompatibility issues.

## Solution Overview

A small full-stack web crawler for Hacker News (or any page with the same markup). The backend crawls a URL, extracts structured entries, exposes two independent filters over the crawled data, and persists an audit trail of every filter call to a local SQLite database. The frontend is a React app that triggers the crawl and each filter, and displays the results — including the audit log — in a simple grid view.

## Architecture

Client-server, with a small versioned REST API in between:

```
┌──────────────┐        POST /api/v1/crawl         ┌──────────────┐
│   Frontend   │ ────────────────────────────────▶ │              │
│ (React/Vite) │                                    │   Backend    │──▶ axios + cheerio
│              │ ◀──────────────────────────────── │  (Express)   │    scrape target URL
└──────┬───────┘   entries[] (cached in-memory)     └──────┬───────┘
       │                                                    │
       │  GET /api/v1/entries/filter/points                 │
       │  GET /api/v1/entries/filter/comments                │
       ▼                                                    ▼
  filtered results                               every filter call is
  rendered as a grid                             recorded to audit.db
                                                  (source_url, filter_type,
                                                   filter_params, result_count,
                                                   created_at)

  GET /api/v1/audit ── reads the persisted audit trail back for display
```

A crawl's raw entries are held in memory on the server (`src/state.js`) rather than persisted — only the audit trail of filter usage is stored in SQLite, per the exercise requirements. Both filter endpoints require a crawl to have run first.

## Tech Stack

**Backend**
- Node.js 22 (ESM, `"type": "module"`)
- Express 5 — HTTP server and routing
- axios — fetches the target page's HTML
- cheerio — server-side jQuery-like HTML parsing
- `node:sqlite` (built-in) — audit persistence, no native dependency to compile
- cors — cross-origin support for local development

**Frontend**
- React 19
- Vite — dev server and build tool; proxies `/api` to the backend in development

**Tooling**
- `concurrently` — runs the backend and frontend dev servers with a single command
- Docker — multi-stage build producing one image that serves both

## Project Structure

```
.
├── Dockerfile
├── .dockerignore
├── index.js                     # standalone scraper smoke-test (bypasses the API)
├── package.json                 # backend deps + combined dev script
├── db/
│   └── audit.db                  # SQLite file, created on first run (gitignored)
├── src/
│   ├── server.js                  # Express bootstrap, static frontend serving
│   ├── state.js                   # in-memory "last crawl" cache + guard middleware
│   ├── db.js                      # SQLite connection, schema, audit read/write
│   ├── routes/
│   │   └── v1.js                   # v1 handlers + router: crawl, filters, audit
│   └── services/
│       ├── fetcher.js              # axios wrapper
│       ├── scraper.js              # cheerio-based HTML → structured entries
│       └── filterService.js        # pure filter functions
└── frontend/
    ├── vite.config.js              # dev server port + /api proxy to :3000
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx                  # URL input + 3 action buttons + results grid
        └── App.css
```

## Prerequisites

- Node.js 22 or later (required for the built-in `node:sqlite` module)
- npm
- Docker, only if running the containerized build

## Local development

Install dependencies in both projects:

```bash
npm install
cd frontend && npm install && cd ..
```

Run both the API and the frontend together with one command from the repo root:

```bash
npm run dev
```

Or run them separately, in two terminals:

```bash
npm run server
```
```bash
npm run client
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api/v1

The frontend's Vite dev server proxies any `/api/*` request to the backend on port 3000, so the app works entirely through relative paths in development.

## Docker

A multi-stage build compiles the frontend to static assets and serves them from the same Express process as the API — one image, one port:

```bash
docker build -t code-challenge-crawler .
docker run -p 3000:3000 code-challenge-crawler
```

Open http://localhost:3000 — both the UI and `/api/v1/*` are served from the same origin.

## API Endpoints

All routes are versioned under `/api/v1`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/crawl` | Body `{ "url": "..." }`. Crawls the page, caches the parsed entries in memory, and returns `{ url, count, entries }`. |
| `GET` | `/api/v1/entries/filter/points?min=` | Filters the last crawled entries by minimum points. Requires a prior crawl. Writes an audit record. |
| `GET` | `/api/v1/entries/filter/comments?min=` | Filters the last crawled entries by minimum comment count. Requires a prior crawl. Writes an audit record. |
| `GET` | `/api/v1/audit` | Returns the most recent audit records (source URL, filter type/params, result count, timestamp). |

## Crawler & Scraping approach

1. `fetcher.js` issues a plain `axios.get(url)` to fetch the target page's raw HTML.
2. `scraper.js` loads the HTML into `cheerio` and selects each `.athing` row (Hacker News' per-post row), reading the sibling `.subtext` row for points and comment count.
3. Each row is normalized into `{ number, title, points, comments }`, with `points`/`comments` parsed to integers (defaulting to `0` when absent — e.g. a post with no comments yet) so they can be filtered numerically.
4. The resulting array is cached in memory (`state.js`) against the crawled URL, so the two filter endpoints can operate on it without re-fetching the page on every filter click.
5. Every filter call — regardless of whether it's triggered from the UI or hit directly — writes a row to the `audit` table via `saveAudit`, so the audit trail can't be skipped by a frontend that forgets to log it separately.

## Andres Torres
