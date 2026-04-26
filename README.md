# My Queen App

Next.js 16 + Drizzle ORM + NextAuth (Auth0) + Firebase Cloud Messaging.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run migrate              # apply Drizzle migrations
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Command                  | What it does                                  |
| ------------------------ | --------------------------------------------- |
| `npm run dev`            | Dev server (with experimental HTTPS for FCM). |
| `npm run dev2`           | Dev server without HTTPS.                     |
| `npm run build`          | Production build.                             |
| `npm run start`          | Run the production build.                     |
| `npm run lint`           | ESLint over the project.                      |
| `npm run typecheck`      | `tsc --noEmit`.                               |
| `npm test`               | Run the Vitest suite once.                    |
| `npm run test:watch`     | Vitest in watch mode.                         |
| `npm run test:coverage`  | Generate coverage report (`text` + `lcov`).   |
| `npm run migrate`        | Apply Drizzle migrations.                     |
| `npm run migrate:generate` | Generate a new migration from schema.       |

## Architecture

```
app/
├── api/                       Server routes
│   ├── auth/[...nextauth]     NextAuth handler (uses lib/auth.ts options)
│   └── movies/trending        Authed proxy to TMDB (rate-limited, server-only key)
├── firebase-messaging-sw.js/  Dynamic service worker (env-driven Firebase config)
├── movie/                     Swipe deck
├── notification/              Inbox
├── stats/                     Charts (per-sender, no hardcoded users)
└── providers/                 React Query, theme, swipe context
backEnd/                       Server actions (auth-required, validated)
├── movies.ts                  Swipe upserts, match detection
├── notification.ts            Inbox CRUD with sender FK
├── firebaseNotification.ts    Admin SDK wrapper (loads service account from env)
└── users.ts                   getOrCreateCurrentUser (JIT provisioning)
lib/
├── auth.ts                    NextAuth options + requireUser()
├── env.ts                     Zod-validated env loader (server + client)
├── logger.ts                  pino logger with secret redaction
├── rateLimit.ts               In-memory token bucket
├── result.ts                  ActionResult<T> + action() wrapper
├── validation.ts              Zod schemas for every action input
└── utils.ts                   `cn` helper
drizzle/                       Schema, relations, SQL migrations
```

## Security model

- **Authn**: Auth0 via NextAuth, JWT session strategy.
- **Authz**: every server action calls `requireUser()` and resolves the row in
  `users` (JIT provisioning on first sight). User identifiers are NEVER passed
  in as parameters.
- **Headers**: HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, per-request CSP nonce — see
  `middleware.ts` and `next.config.ts`.
- **Rate limiting**: middleware throttles `/api/*` per IP, the TMDB proxy
  throttles per authenticated email. Replace the in-memory bucket with Redis /
  Upstash when scaling beyond a single instance.
- **Validation**: every server action input runs through a Zod schema
  (`lib/validation.ts`). Notification links must be same-origin paths.
- **Secrets**: Firebase admin credentials are read from
  `FIREBASE_SERVICE_ACCOUNT` (full JSON) or
  `FIREBASE_ADMIN_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY`. The TMDB API
  key is **never** sent to the browser — clients hit `/api/movies/trending`.
- **Logging**: pino with redaction of `password`, `token`, `authorization`,
  `cookie`, `private_key`. Server actions return opaque `INTERNAL` errors;
  details only land in the server logs.

## Schema overview

```
users
  ├── id (PK)
  ├── external_id (unique, OIDC sub)
  ├── email (unique)
  └── name
movie
  ├── id (PK)
  └── movie_id (TMDB id, unique)
movie_swipe        unique(user_id, movie_id)
  ├── user_id  → users.id
  ├── movie_id → movie.id
  └── choice   (boolean)
last               unique(user_id)
  ├── user_id  → users.id
  └── movie_id → movie.id
notification
  ├── sender_id → users.id
  ├── title / message / link
  └── read (boolean)
```

Migration `0002_refonte_users_swipes.sql` migrates legacy data:
the hardcoded `anatholy` / `axelle` boolean columns in `movie` are converted
into rows in `movie_swipe` keyed by the new `users.id`.

## Tests

Run `npm test` — coverage targets `lib/**`, `backEnd/**`, `components/**`,
`hooks/**`, and `app/api/**`. Server-side tests mock the database via
`vi.hoisted` so they exercise pure logic without a live Postgres.

## License

Private.
