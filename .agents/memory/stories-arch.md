---
name: Stories architecture
description: How Blue Media stories work — DB, API, music, frontend
---

## DB Tables
Both in `lib/db/src/schema/posts.ts` and exported via `lib/db/src/schema/index.ts`:
- `storiesTable`: userId, imageUrl, text, bgColor, musicTitle, musicArtist, musicPreviewUrl, musicArtwork, expiresAt (24h)
- `storyViewsTable`: storyId, viewerId, viewedAt — use onConflictDoNothing() for upserts

## API Routes
File: `artifacts/api-server/src/routes/stories.ts`
- GET /api/stories — list all non-expired stories with seen status per viewer
- POST /api/stories — create story (requireAuth)
- POST /api/stories/:id/view — mark seen (onConflictDoNothing)
- DELETE /api/stories/:id — delete own story

## Music
iTunes Search API — completely free, no API key needed:
`https://itunes.apple.com/search?term=OPM&entity=song&limit=12&country=PH`
Returns: trackName, artistName, previewUrl (30s clip), artworkUrl100

**Why:** Apple allows CORS requests to the iTunes API from any origin. No account needed.
