## Goal
Unify user-profile navigation across the app and upgrade the 1:1 messaging surface with presence, typing, image sharing, search, and date separators — building on the existing profile page (`/profile/$userId`) and messages table (which already has realtime + read receipts).

## What already exists (won't rebuild)
- `/profile/$userId` public profile with Follow, Message-open, phone gating, karma, reviews.
- `/messages?user=X` thread with Supabase Realtime, read receipts, optimistic sends, WebRTC call button.
- Global `UserSearch` dropdown and `/search` page (People + Requests tabs).
- Feed, Requests, Leaderboard already link avatars/names to `/profile/$userId`.

## Changes

### 1. Profile page (`profile.$userId.tsx`)
- Add prominent action row: **Message · Follow · Share · Report** (own profile shows Edit · Share).
- Share = copy profile URL via `navigator.share` fallback to clipboard.
- Report = insert into new `user_reports` table (reporter, target, reason).
- Add "Online now" / "Last seen" dot driven by presence channel.
- Ensure clickable name/avatar everywhere routes here (audit Feed comments, Followers list, Reviews author, Leaderboard rows).

### 2. Search upgrades (`/search` People tab + `UserSearch`)
- Rich user card: avatar, name, @username, badge, karma, bio snippet, location, skill chips, **Follow** + **Message** buttons.
- Message button navigates to `/messages?user=id` (thread auto-materializes on first send — no explicit conversation row needed since messaging uses per-message rows).
- Friendly empty state ("No people match — try a different name, skill, or city").
- Add badge/segment filter chips (NGO, Business, Volunteer, Verified) — reuse `SegmentFilter` pattern.

### 3. Messaging upgrades (`messages.tsx`)
- **Presence**: Supabase Realtime `presence` channel `presence:online` tracking my id; show green dot on conversation rows and thread header ("Online" / "Last seen …").
- **Typing indicator**: broadcast `typing` events on the per-thread channel; show "typing…" pill under header.
- **Image sharing**: image button using `feed-media` bucket; store as `[img:<publicUrl>]` marker (parsed alongside existing `[loc:]` / `[call:]` markers) and render inline.
- **Emoji picker**: lightweight popover (small hand-picked set, no heavy dependency).
- **Message search**: search input at top of list pane; filters conversations and, when active, highlights matches inside thread (client-side filter over loaded messages).
- **Date separators**: group messages by day with a centered "Today / Yesterday / MMM d" pill.
- **Unread badges**: already present in list; also surface global unread count in navbar (small dot on Messages link).
- Auto-scroll & infinite scroll: extend current 200-message limit with "Load earlier" button that pages older messages by `created_at`.

### 4. Data model
- Migration: add `avatar_last_seen_at timestamptz` to `profiles` (updated by client on visibility) for offline "Last seen".
- Migration: new `user_reports` table (reporter_id, target_id, reason, created_at) + RLS (insert by authenticated, select by admin via `has_role`).
- No `conversations` table needed — the existing per-message pattern with `sender_id`/`receiver_id` already yields deterministic 1:1 threads. Getting a thread key = sorted pair of ids; opening `/messages?user=X` naturally shows or starts it.

### 5. Design & responsiveness
- Keep AMOLED / royal-blue-gold tokens already in use (no new colors).
- Skeletons on card loads, framer-motion transitions on new messages, mobile: thread pane replaces list on small screens (already implemented — verify).

## Out of scope
- Group chats, voice notes, message reactions, video calls (voice call button already exists via WebRTC).
- New dedicated `conversations` table — not needed for current 1:1 model.

## Technical notes
- Presence uses `supabase.channel('presence:online', { config: { presence: { key: me } } }).track({...})`.
- Typing = `broadcast` on `thread:<sortedPair>` channel — no DB writes.
- Image uploads reuse existing `feed-media` bucket + signed public URL; content stored as `[img:URL]`.
- `avatar_last_seen_at` updated on tab focus/blur via lightweight upsert (throttled to 1/min).
