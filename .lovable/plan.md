## HumanLink Settings System — Phased Plan

This is a very large scope (11 user sections, 12 admin sections, super-admin, RBAC overhaul, audit logs, soft-delete across 5 tables, security hardening). Shipping it all in one pass would take many hours and likely regress existing flows. I'll deliver it in reviewable phases; each phase is production-ready on its own.

### Phase 1 — User Settings (this turn)

New route `/settings` (under `_authenticated`) with a left-nav + section layout, mobile-responsive, matching current glassmorphic design. Backed by existing `profiles` / `profile_contacts` where possible; new columns/tables added only where required.

Sections wired to real data:
1. **Account** — edit full_name, username, bio, avatar, cover, DOB, gender, occupation, address, country/state/city, language (extends `profiles`)
2. **Security** — change password, forgot password link, sign out other devices (`supabase.auth.signOut({ scope: 'others' })`), deactivate, delete account
3. **Privacy** — profile visibility, who-can-message, show online/last-seen, phone/email visibility (new `profile_privacy` table)
4. **Notifications** — per-channel toggles (new `notification_prefs` table); wired into existing notification triggers
5. **Chat Settings** — read receipts, typing indicator, wallpaper, font size, archived, muted, blocked users list (reuses `blocked_users`)
6. **HumanLink Preferences** — default location, radius, availability, categories, skills, emergency contact
7. **Subscription** — current plan, upgrade (reuses `RazorpayCheckoutModal`), payment history
8. **Verification** — apply NGO/Business/Identity (new `verification_requests` table), status badge
9. **Activity** — links to existing history views
10. **Appearance** — theme (reuses `use-theme`), font size, reduced motion
11. **About** — static links, version, logout

### Phase 2 — RBAC + Audit Log + Soft-Delete foundation
- Extend `app_role` enum with `moderator`, `support_admin`, `finance_admin`, `content_admin`, `super_admin`
- `role_permissions` table + `has_permission()` SQL function
- `audit_logs` table + helper insert function; wire into all admin mutations
- Add `deleted_at` to users/requests/messages/posts/reviews with filtered RLS

### Phase 3 — Admin Panel expansion
Extend existing `/admin` with: verification center, payments, content management, AI settings, system settings, database export, support tickets. Dashboard metrics already partly exist under `/admin-metrics`.

### Phase 4 — Super Admin
Gated `/admin/super` route: create/remove admins & moderators, permission editor, maintenance toggles, global announcements, force-logout-all, permanent delete.

### Phase 5 — Security hardening pass
CSRF for server routes, rate limiting middleware, session/device tracking table, suspicious-login detection, file-upload validation helper.

### Technical notes
- All new tables: `GRANT` + RLS + `updated_at` trigger per project conventions
- Preferences read via a single `useSettings()` hook with TanStack Query cache
- Destructive actions use `AlertDialog` confirmation
- No changes to existing auth flow, messaging, or feed

### Deliverable for this turn
**Phase 1 only** — User Settings page fully functional, plus the small schema additions it needs (`profile_privacy`, `notification_prefs`, `verification_requests`, and new nullable columns on `profiles`). Phases 2-5 ship in follow-up turns so you can review each before the next lands.

Reply "go" to start Phase 1, or tell me to reorder / skip phases.
