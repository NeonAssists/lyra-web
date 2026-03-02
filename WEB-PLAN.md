# Lyra Web — Build Plan

## Stack
- **Framework:** Next.js 16 (App Router)
- **Styles:** Tailwind CSS
- **Backend:** Supabase (same DB as mobile app)
- **Music data:** iTunes API (free, no auth)
- **Auth:** Supabase email/password
- **Deploy:** Vercel

## Design System
- Background: `#0a0a0a`
- Surface: `#141414`
- Surface2: `#1c1c1e`
- Accent: `#6C63FF`
- Text secondary: `#8E8E93`
- Text tertiary: `#48484A`
- Rating colors: centralized in `lib/itunes.ts` → `ratingColor()`
- Dark-first, mobile-first, premium minimal

---

## Pages — Current Status

### ✅ `/` — Marketing landing page
- **Status:** DONE, deployed
- Full premium marketing page with CSS iPhone mockups
- CTAs to App Store (pending) + `/app`

### ✅ `/app` — Web app home
- **Status:** DONE (overnight prep)
- Auth-aware nav (shows user avatar when logged in, Sign In when not)
- Community Picks section (Supabase, rated 8+)
- Top Songs + New Albums from iTunes RSS
- Search (iTunes API, debounced)
- Mobile bottom nav
- **Missing:** Rating modal (rank from web), personalized feed when logged in

### ✅ `/login` — Sign in
- **Status:** DONE (overnight prep)
- Email + password via Supabase auth
- Redirects to `/app` on success

### ✅ `/signup` — Create account
- **Status:** DONE (overnight prep)
- Email + password + handle + display name
- Creates profile row in Supabase
- Redirects to `/app` on success

### ✅ `/u/[handle]` — Public profile
- **Status:** DONE + improved (overnight prep)
- Fast-path: reads title/artist/artwork_url from DB (no per-item iTunes calls)
- Falls back to iTunes only for null title (legacy pre-fix data)
- Rankings grid sorted by rating, solid color badges
- Avg rating stat

### ⚠️ `/search` — Search page
- **Status:** EXISTS, basic
- Searches iTunes API
- **Missing:** User search (search Lyra profiles), filter by type (songs/albums/artists)

### ⚠️ `/ranking/[id]` — Single ranking detail
- **Status:** EXISTS, needs review
- Shows one user's rating of one item
- **Missing:** Confirm it reads from DB correctly, add similar ratings from other users

### ❌ `/u/[handle]/rankings` — Full rankings list
- **Status:** NOT BUILT
- Dedicated page for all of a user's rankings with sort/filter

---

## Priority Order for Next Session

### P0 — Core loop (rank from web)
1. **RatingModal component** — allow logged-in users to rate songs/albums from the web
   - Slider 0.0–10.0, step 0.1
   - Saves to `user_rankings` via Supabase
   - Needs auth check
2. **Search → Rank flow** — clicking a result in `/app` search should open RatingModal

### P1 — Auth polish
3. **Auth persistence** — Supabase session persists on refresh (use `createBrowserClient`)
4. **Protected routes** — redirect to `/login` when trying to rank without auth
5. **Sign out** — button in profile nav

### P2 — Profile page improvements
6. **Songs vs Albums tabs** on profile page
7. **Follow button** on other users' profiles (if logged in)
8. **Edit profile** — change display name / handle / avatar (logged-in user only)

### P3 — Discovery
9. **Community feed** — dedicated page `/community` with all high-rated items
10. **User search** — search Lyra users by handle in `/search`
11. **Artist page** — `/artist/[name]` showing iTunes top songs + who on Lyra has rated them

---

## Key Decisions Made
- **No Spotify on web** — iTunes only for music data
- **Shared DB** — same Supabase project as mobile; all rankings sync between platforms
- **Profile URLs** — `lyra.app/u/[handle]` — shareable, public by default
- **Auth = Supabase** — same credentials work on web and mobile
- **Rating scale** — 0.0–10.0 decimal, `numeric(3,1)` in DB
- **No SSR for auth** — client-side auth check to avoid complexity; pages hydrate after mount

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://owbytrnrchcruyotvnsu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Supabase Tables Used
- `profiles` — id, handle, display_name, avatar_url, plan
- `user_rankings` — user_id, item_id, rating, title, artist, artwork_url, ranked_at
- `follows` — follower_id, following_id
- `lists` — id, user_id, name
- `list_items` — list_id, item_id, title, artist, artwork_url

## Deployment
- Vercel project: `lyra-web` (neonotics-png)
- Auto-deploys on push to `main`
- Env vars set in Vercel dashboard
