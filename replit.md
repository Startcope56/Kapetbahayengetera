# Blue Media

A full-featured social media platform inspired by Facebook Lite — with posts, video uploads, reactions, comments, chat, friends, notifications, and admin tools.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/blue-media run dev` — run the React frontend (port 23694, proxied at /)
- `pnpm run typecheck:libs` — rebuild lib declarations (run after schema changes)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui
- API: Express 5 + Socket.IO (real-time)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Security: custom DDoS protection, rotating hashed keys, security headers

## Where things live

- `lib/db/src/schema/` — all DB table definitions (users, posts, conversations, friendships, follows, notifications, reports)
- `lib/db/src/schema/posts.ts` — posts schema (imageUrl, videoUrl, bgColor, feeling, activity, location)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/security.ts` — DDoS protection, rotating security keys, security headers
- `artifacts/blue-media/src/pages/feed.tsx` — main feed with post composer (video, image, color, feeling, activity, location)
- `artifacts/api-server/uploads/` — uploaded files (images, videos, documents) served at /api/uploads/

## Architecture decisions

- Video upload: frontend uploads to `/api/posts/upload-video` first (up to 200MB), gets back a URL, then creates the post with that URL — avoids base64 encoding.
- Security keys rotate every 60 minutes using `crypto.randomBytes(64)` — stored in-process only.
- DDoS protection is IP-based with per-window counters; auth endpoints have stricter limits (20/min vs 200/min).
- Socket.IO is used for real-time post updates, notifications, and chat — connected at path `/socket.io`.
- All uploaded files are stored locally at `artifacts/api-server/uploads/` and served as static files at `/api/uploads/`.

## Product

- **Feed** — create posts with text, image, video, color backgrounds, feelings (😊 Happy, 🤩 Excited…), activities (🍽️ Eating, ✈️ Traveling…), and location tags
- **Reactions** — 4 reaction types (Love 🩷, Haha 😆, Sad 💔, Angry 😡) + commenting
- **Friends** — send/accept/reject friend requests
- **Chat** — real-time messaging with Socket.IO
- **Notifications** — reactions, comments, friend requests
- **Reports** — flag posts for harassment, hate speech, spam, etc.
- **Admin panel** — view reports, manage users (admin@startcope)
- **Settings** — profile picture, display name, PIN change
- **DDoS protection** — rate limiting + IP blocking + rotating security keys

## User preferences

- Admin account: startcopediwznaga@gmail.com
- Made for Pilipinas 🇵🇭

## Gotchas

- After any change to `lib/db/src/schema/`, run `pnpm run typecheck:libs` then `pnpm --filter @workspace/db run push`
- After lib declaration changes, restart the API server workflow so esbuild re-bundles
- Video uploads accept: mp4, webm, ogg, mov, avi, mkv (max 200MB)
- Image uploads: max 20MB; file/doc uploads: max 50MB

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
