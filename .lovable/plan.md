## Scope

Five major modules in one pass. To keep this shippable and avoid breaking existing v1, I'll execute in a single migration + coordinated frontend pass, but with clear priorities. Existing data (profiles, requests, roles, plans) stays intact.

## 1. Leaderboard page (`/leaderboard`)

- New public route, ranks profiles by `karma_points` desc.
- Search by name/username, time-range filter (all-time / 30d / 7d) computed from `award_karma_on_complete` source: `help_requests.completed_at` joined to `helper_id`.
- Top-3 podium with faux-3D cards, rank list below, verified badge for premium users, admin crown.

## 2. Community feed + interactions

- New tables: `posts`, `post_likes`, `post_comments`, `advertisements`.
- `/feed` route (under `_authenticated`) with infinite scroll (cursor by `created_at`).
- Create-post composer (text + optional image URL).
- Like (toggle), comment (expandable thread, realtime via Supabase channel), share (copy link + Web Share API).
- Admin-only "Official Announcement" switch on composer → `is_announcement=true`, pinned to top with royal-blue/gold border + badge.
- Native ad injection: after every 6th post, pull next active ad from `advertisements` with "Sponsored" tag.

## 3. Mock payment + instant verification

- Replace manual UPI/QR flow on `/pricing` with a `MockPaymentModal` (card + UPI tabs, realistic styling).
- On "Confirm Payment": 2s spinner → server fn `activatePremium({planId})` updates `profiles.is_verified=true`, `profiles.premium_tier`, `profiles.premium_until`.
- Verified checkmark badge component shown next to user names in feed, requests, leaderboard, profile.

## 4. AI Smart Match dashboard tab

- New tab on `/dashboard` ("AI Smart Match").
- Server fn calls Lovable AI (`google/gemini-3-flash-preview`) with active requests + current user's skills/bio → returns ranked matches with score + reasoning.
- Cards show "94% Match" ring, request summary, why-fit bullets, "Offer Help" CTA.

## 5. Impact Time-Capsules

- Table `time_capsules` (owner, goal_title, goal_karma, collected_karma, unlocked_at, media JSONB).
- Page `/_authenticated/capsules`: create capsule, progress bar, locked/unlocked state.
- Unlock trigger: when `collected_karma >= goal_karma`, set `unlocked_at`. Manual contribute action for v1 (collective karma aggregation is heavy — keep simple: capsule owner + contributors table later).

## 6. Admin: Ad Manager

- New tab in `/admin`: "Advertisements" — title, description, destination URL, image URL, active toggle, CRUD.

## Technical details

**Migration (one file):**
- `posts(id, author_id→profiles, body, image_url, is_announcement, created_at, updated_at)`
- `post_likes(post_id, user_id, created_at, PK(post_id,user_id))`
- `post_comments(id, post_id, author_id, body, created_at)`
- `advertisements(id, title, description, destination_url, image_url, active, created_at)`
- `time_capsules(id, owner_id, title, description, goal_karma, collected_karma, unlocked_at, media jsonb, created_at)`
- Add `profiles.is_verified bool default false`, `profiles.premium_tier text`, `profiles.premium_until timestamptz`.
- GRANTs to authenticated + service_role; SELECT to anon on `posts`, `post_comments`, `advertisements`, `profiles` (already), `time_capsules` (public goals).
- RLS: authors manage own posts/comments/capsules; anyone authed can like; only admins can write `advertisements` and set `posts.is_announcement=true` (enforced via trigger checking `has_role`).
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE post_comments, post_likes;`

**Server fns (`src/lib/*.functions.ts`):**
- `activatePremium`, `aiSmartMatch`, `feed.create/list/like/comment`, `capsule.contribute`.

**Components:**
- `VerifiedBadge`, `PostCard`, `CommentThread`, `MockPaymentModal`, `AdCard`, `MatchCard`, `CapsuleCard`, `LeaderboardPodium`.

**Routes added:**
- `/leaderboard` (public)
- `/_authenticated/feed`
- `/_authenticated/capsules`
- Tabs added to `/dashboard` and `/admin`

**Aesthetic:** keep existing royal blue/gold tokens from `src/styles.css`. No new color hardcodes.

## Out of scope (call out)

- Real payment gateway (mock only, as requested).
- Per-user collective karma streams for capsules (single-owner v1).
- Image uploads to storage (image URL field only — fastest path; can add bucket later if you want).
- Push notifications.

## Risk

This is ~12 new files + 1 large migration + edits to 5 existing files. I'll keep components lean and reuse shadcn primitives. Expect 1 follow-up turn to polish any rough edges after you click around.
