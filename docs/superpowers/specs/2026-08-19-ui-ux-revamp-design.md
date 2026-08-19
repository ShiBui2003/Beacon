# Beacon UI/UX Revamp — Design Spec

Date: 2026-08-19
Status: Approved for implementation planning (pending final user sign-off on this doc)

## Goal

A full visual and interaction-layer redesign of Beacon (Next.js 14, formerly Civik/Janmarg) — new color system ("Signal"), typography, spacing/radius/shadow tokens, and a GSAP + Framer Motion animation layer, applied across every page. **No functional changes**: every button, form, route, and data flow stays exactly as wired today. This is a reskin + motion layer, not a rebuild.

---

## 1. Audit — complete inventory

### 1a. Routes

**Landing / Auth**

| Route | File | What it is | Status |
|---|---|---|---|
| `/` | `app/page.tsx` | Marketing landing page: hero, stats strip, app-preview card, features grid, CTA band, footer | Primary |
| `/auth` | `app/auth/page.tsx` | Canonical unified sign-in/sign-up (mode via `?mode=`) — role select, department select, email/password, Google OAuth | Primary |
| `/login`, `/signup`, `/citizen/login`, `/admin/login`, `/admin/signup` | respective `page.tsx` (22 lines each) | Client-side redirect stubs → `/auth` | Primary (stub) |
| `/citizen/signup` | `app/citizen/signup/page.tsx` | Near-duplicate of `/auth` (same fields/logic, defaults to signup mode) | Duplicate — gets identical treatment to `/auth` |
| `/citizen/signup-success` | `app/citizen/signup-success/page.tsx` | Static "check your email" confirmation | Primary |

**Citizen** (`app/citizen/*`, shell = `CitizenNav`)

| Route | What it is | Status |
|---|---|---|
| `/citizen/dashboard` | Main landing: KPI cards, filter bar, list/map toggle, issue feed | Primary |
| `/citizen/report` | Report form: quick-photo AI path, manual form (text/audio tabs, 13-language transcription), map picker | Primary |
| `/citizen/issues` | "My Issues": stat cards, active/resolved tabs, list + detail sidebar | Primary |
| `/citizen/my-issues`, `/citizen/my-issues/[id]` | Near-duplicate of `/citizen/issues` + a separate detail page (status tracker, comments/voting) | Orphaned — included per scope decision |
| `/citizen/issues/[id]` | Primary issue detail: upvote/follow, comments, timeline, map | Primary |
| `/citizen/issues/map` | Dedicated full map view | Primary |
| `/citizen/notifications` | Notification list + settings tabs (mock data feed, real settings) | Primary |
| `/citizen/profile` | Profile edit, avatar, stats, account management dialogs | Primary |
| `/citizen/resolved` | Resolved issues by category tabs | Orphaned — included |
| `/citizen/leaderboard` | Contributor rankings (mock data) | Orphaned — included |
| `/citizen/crowdfunding` | Campaign list + donate flow (Razorpay) | Primary — **raw HTML, brought into design system** |
| `/citizen/Abhiyaan` | Campaign-drive listing/creation | Primary — **raw HTML, brought into design system** |
| `/citizen/vapi` | Static info page about the voice widget | Orphaned — included |

**Admin** (`app/admin/*`, shell = `AdminNav` + dashboard's own internal sidebar)

| Route | What it is | Status |
|---|---|---|
| `/admin/dashboard` | KPI cards, Recharts (line/pie), department performance, recent issues; has its own sidebar with several dead links (Bidding/Zones/Wards/Departments/Export/Settings don't resolve — left as-is, not this scope's problem to fix) | Primary |
| `/admin/issues` | Management table: bulk actions, filters, tabs by status, per-row actions dropdown | Primary |
| `/admin/issues/[id]` | Detail + status updater, department assigner, user assigner, citizen comments, map | Primary |
| `/admin/issues/map` | Admin map view | Primary |
| `/admin/issues/debug` | Internal coordinate-debug dump | Orphaned — included (low effort, plain text) |
| `/admin/users` | User management cards (note: Suspend/Activate buttons have no handler today — **left exactly as non-functional, out of scope to fix**) | Orphaned — included |
| `/admin/profile` | Mirrors citizen profile + admin fields; has a real `Skeleton` loading.tsx already | Primary |
| `/admin/notifications` | Send/History tabs (History is mock data) | Orphaned — included |
| `/admin/reports` | Report type/date-range picker, report cards (mock data) | Orphaned — included |
| `/admin/crowdfunding`, `/admin/abhiyaan` | Government-role variants of the citizen pages | Orphaned — included, **raw HTML, brought into design system** |

**Dead file, not a route:** `app/admin/issues/[id]/page-real.tsx` — never served by Next.js (only `page.tsx` is), left untouched (deleting it is a code-cleanup call, not visual-layer scope).

### 1b. Shared components (`components/*`)

Actively used (get redesign treatment): `VapiWidget`, `CampaignForm`, `citizen-nav`, `admin-nav`, `analytics-charts` (4 Recharts panels), `ai-urgency-badge`, `account-management`, `admin-department-assigner`, `admin-issue-status-updater`, `admin-user-assigner`, `citizen-comments`, `google-maps-embed`, `interactive-google-map`, `issue-comments-and-voting`, `issue-status-tracker`, `location-picker`, `map-picker`, `phone-input`, `real-time-notifications`, `resolved-issues-section`, `simple-admin-actions`.

**Confirmed dead (not imported anywhere) — left untouched, not part of this scope:** `admin-notifications.tsx`, `admin-quick-actions.tsx`, `auth-debug-panel.tsx`, `citizen-portal-button.tsx`, `interactive-map.tsx`, `location-debug.tsx`, `notification-system.tsx`, `search-filter.tsx`. `theme-provider.tsx` exists but is currently unmounted — **this one gets mounted** as part of the dark-mode-toggle scope decision.

### 1c. shadcn/ui primitives

Actively used: `avatar, badge, button, calendar, card, dialog, input, label, popover, progress, select, separator, sheet, skeleton, switch, table, tabs, textarea, toast/toaster`, plus custom `google-map`, `fallback-map`, `user-avatar`. This is the base component layer the redesign styles via tokens — no new primitives need generating, the scaffold already has more (`accordion`, `alert-dialog`, `dropdown-menu`, `tooltip`, etc.) sitting unused for future use if a screen's revamp calls for one.

### 1d. Current styling baseline (being replaced)

Tailwind v4 (CSS-first, `@theme inline` in `app/globals.css`, no `tailwind.config.ts`). Brand color today: green (`#2E6A56` primary, `#5C9479` secondary, `#1F4A3A` dark), duplicated as literal hex in dozens of components rather than consistently referencing CSS vars — the token migration fixes this by construction (every color reference moves to `var(--token)`). `.dark` variant fully defined but unreachable (no toggle). Two `globals.css` files exist; `styles/globals.css` is dead/unused — consolidating to one file (`app/globals.css`) as part of the token migration, since carrying a duplicate is directly relevant to "a real token set, not ad hoc values." Font stack references Montserrat/Geist Mono that are declared but never loaded — moot, replaced by Space Grotesk/Inter.

---

## 2. Visual Direction — "Signal" (decided, applying as specified)

**Light mode:**
```css
--background: #FFFFFF
--foreground: #26215C
--primary: #534AB7
--primary-foreground: #FFFFFF
--primary-hover: #3C3489
--secondary: #3C3489
--muted: #F1EFF9
--muted-foreground: #6B6580
--border: #E4E1F0
--ring: #7F77DD
--accent: #D85A30
--accent-foreground: #FFFFFF
--accent-tint: #FAECE7
--warning: #E0A72E
--success: #2F8F5B
```

**Dark mode:**
```css
--background: #26215C
--foreground: #F5F3FA
--primary: #7F77DD
--primary-foreground: #26215C
--secondary: #3C3489
--muted: #322C6E
--muted-foreground: #B3ADD9
--border: #453D8F
--ring: #7F77DD
--accent: #D85A30
--accent-foreground: #FFFFFF
--accent-tint: #3D2A26
--warning: #E0A72E
--success: #3AA873
```

**Typography:** Space Grotesk (headings) / Inter (body), via `next/font/google`, replacing Poppins/Inter in `app/layout.tsx`.

**Spacing/radius/shadow:**
```css
--space-1: 4px  --space-2: 8px  --space-3: 12px  --space-4: 16px
--space-5: 24px --space-6: 32px --space-7: 48px  --space-8: 64px
--radius-sm: 6px  --radius-md: 10px  --radius-lg: 16px  --radius-full: 9999px
--shadow-sm: 0 1px 2px rgba(38,33,92,0.06)
--shadow-md: 0 4px 12px rgba(38,33,92,0.08)
--shadow-lg: 0 12px 32px rgba(38,33,92,0.12)
```

**Status-color mapping (preserving the existing semantic system found in the audit):** `submitted` → neutral/muted, `review`/`in_progress` → `--primary`/`--secondary` family, `resolved` → `--success`, urgent/high-priority tags → `--accent` (coral, reserved exclusively for this + primary CTAs per the brief). This directly replaces the current `--status-*` HSL tokens in `app/globals.css` with Signal-derived equivalents, same semantic mapping, new palette.

**Dark-mode toggle:** `theme-provider.tsx` (currently unmounted) gets mounted in `app/layout.tsx`; a toggle control is added to both `citizen-nav.tsx` and `admin-nav.tsx` (desktop nav bar + mobile sheet menu), using `next-themes`'s existing hook — no new state-management library needed.

---

## 3. Animation & Interaction Layer

**GSAP + ScrollTrigger** (confirmed free for commercial use, full plugin ecosystem including ScrollTrigger, no license required as of 2025's Webflow-driven licensing change):
- Landing page (`/`): hero section pin-and-reveal on scroll, stats-strip counter/stagger reveal, features-grid scroll-scrubbed stagger-in, replacing the current CSS-only `animate-pulse`/`animate-bounce` decorative blobs with scroll-linked parallax.
- Citizen & admin dashboards: KPI-card stagger reveal on mount/scroll, analytics-chart section scroll-triggered reveal (`analytics-charts.tsx`, admin dashboard's Recharts panels).
- Any other long-scroll page (issue list, resolved-issues grid): scroll-scrubbed fade/slide-in per card batch, not per-card-individually (performance).

**Framer Motion** (all React-lifecycle-tied motion):
- Every `Dialog`/`Sheet` (18+ usages across profile, account-management, admin actions, mobile nav) — real enter/exit transitions replacing today's default Radix fade.
- `VapiWidget` state transitions (idle/connecting/listening/speaking) — replacing the current inline-style/CSS-keyframe approach with declarative `AnimatePresence` state transitions.
- Toast enter/exit (`components/ui/toast.tsx`).
- Card hover-lift (replacing the existing ad hoc `.hover-lift`/`.hover-scale`/`hover:scale-105` utility classes with a consistent Framer Motion `whileHover`/`whileTap` pattern) across issue cards, KPI cards, feature cards.
- Staggered list mount: issue feeds, notification lists, comment threads.
- Route-level page transitions (App Router layout-level, subtle fade/slide — kept minimal so navigation doesn't feel slow).
- RBAC/status-change transitions: status `Badge` color/label change, role-based nav item visibility change — cross-fade rather than instant swap.

**Loading states:** every ad hoc `animate-pulse` block and every `Loader2`/spinner-`div` pattern found in the audit (auth page, dashboard "Loading issues…" text, most `loading.tsx` route files that currently just `return null`) gets replaced with the existing-but-unused `components/ui/skeleton.tsx` primitive, shaped per-screen (card skeletons for feeds, row skeletons for the admin issues table, avatar+text skeleton for profile). `admin/profile/loading.tsx` already does this correctly — it becomes the reference pattern applied everywhere else.

**`prefers-reduced-motion`:** one shared convention — GSAP animations wrapped in `gsap.matchMedia()` with a reduced-motion match that disables scroll-scrub/parallax (keeps content visible, no motion); Framer Motion components use `useReducedMotion()` to swap spring/duration-based transitions for instant or opacity-only ones. Applied consistently, not per-component ad hoc.

---

## 4. Component-by-component revamp plan

Grouped by screen family — routes sharing near-identical structure get one treatment description.

### Landing (`/`)
New treatment: Signal indigo hero background (subtle gradient, `--background` → `--secondary` wash) replacing the green gradient blobs; Space Grotesk headline at hero scale; primary CTA ("Get Started Free") in coral `--accent` (the one CTA-worthy use of coral on this page), secondary "Sign In" as an outline/ghost button in indigo. GSAP: hero content reveals on load (fade+rise), stats-strip numbers count up on scroll-into-view, features grid staggers in via ScrollTrigger batch. Framer Motion: feature-card hover lift, CTA button press feedback.

### Auth (`/auth`, `/citizen/signup` [duplicate, same treatment])
Card-centered layout stays; Signal tokens applied to the segmented Sign In/Sign Up toggle (active state = `--primary` fill), role-select icons recolored to the palette, inputs get the new `--radius-md`/`--border` treatment. Framer Motion: form-field validation-error banner slide-in, password show/hide icon cross-fade, sign-in/sign-up mode toggle content cross-fades instead of an instant swap, Google-button hover/press state. Loading: full-screen spinner → a centered skeleton card matching the form's shape.

### Citizen Dashboard (`/citizen/dashboard`)
KPI cards restyled with Signal gradient treatment (indigo, not the current green), `AIUrgencyBadge` recolored (high urgency → `--accent` coral, medium → `--warning`, low → `--success` — replacing the current ad hoc red/yellow/green). List/map toggle becomes a proper segmented control. GSAP: KPI-card stagger-in on mount, list-card batch reveal on scroll. Framer Motion: card hover-lift, filter-bar `Select` open/close, view-toggle transition. Skeleton loading replaces the current plain "Loading issues…" text.

### Report form (`/citizen/report`)
The most form-heavy screen — no field, tab, or button removed. Quick-photo card keeps its "hero" treatment but recolored (coral reserved for the AI-processing state indicator only, not the whole card — indigo/neutral base instead of today's amber/orange gradient, since coral is reserved for urgency per the brief). Text/Audio `Tabs` restyled; recording state (red pulsing dot + timer) is the one place a non-palette red stays, since it signals active recording, not urgency — flagged for your call in section 6. Framer Motion: photo-upload success-banner slide-in, tab content cross-fade, form-field focus-ring animation (`--ring` token), submit-button loading state. `MapPicker` gets updated marker/pin styling to match Signal (pin color = `--accent`, matching how urgent issues are tagged elsewhere).

### Citizen issue lists & detail (`/citizen/issues`, `/citizen/my-issues` [+ `[id]`], `/citizen/issues/[id]`)
Status `Badge`s and `Progress` bars remapped to Signal status-color system (section 2). Tabs (Active/Resolved) restyled. Detail sidebar pattern (select-a-card → detail panel) gets a Framer Motion slide/fade transition instead of an instant content swap. `IssueStatusTracker`'s vertical timeline restyled with Signal connecting-line/icon colors, each stage-completion transition animated (not just instant highlight-jump). `IssueCommentsAndVoting`: upvote/downvote button press feedback, comment-list stagger-in.

### Map views (`/citizen/issues/map`, `/admin/issues/map`, embedded map-picker/pin components)
Google Maps pin/marker recolored to Signal palette (status-color-coded pins), sidebar detail card restyled, GSAP-driven "find my location" button loading pulse. `FallbackMap`'s mock grid gets a Signal-consistent treatment (indigo grid lines instead of generic gray) so it doesn't look broken when the Maps API key is absent.

### Notifications, Profile, Resolved, Leaderboard (citizen)
`RealTimeNotifications` dropdown: unread-badge in `--accent`, Framer Motion dropdown enter/exit, new-notification stagger-in. Profile: avatar-upload button hover state, Edit/Save/Cancel button-group restyled, stat cards recolored, `Switch` toggles restyled to Signal tokens. `AccountManagement` dialogs get Framer Motion modal transitions (delete-account destructive button stays semantically red — not coral — since coral is reserved for urgency, not destructive actions; a distinct destructive-red token is defined separately from `--accent`). Resolved-issues category tabs + grid: GSAP scroll-stagger. Leaderboard: rank cards (top-3 trophy/medal treatment) recolored, `Progress` bars restyled.

### Crowdfunding & Abhiyaan (citizen + admin variants, currently raw HTML)
Rebuilt using shadcn primitives (`Card`, `Input`, `Textarea`, `Button`, `Progress` for funding-goal completion) styled with Signal tokens — same fields, same submit/donate actions, same Razorpay integration untouched. Campaign progress bar uses `--primary`→`--accent` gradient as it approaches goal (a genuinely new but purely-visual touch, not a functional change — the underlying `raised_amount`/`target_amount` data and calculation are untouched).

### Admin Dashboard (`/admin/dashboard`)
Its own internal sidebar (Dashboard/Reports real, others dead-linked — left exactly as-is, not fixing the dead links) restyled with Signal tokens. KPI cards match citizen dashboard's new treatment for visual consistency across roles. Recharts panels (`analytics-charts.tsx` + this page's line/pie charts): color scales pulled from `--chart-*` tokens (now Signal-derived) instead of today's hardcoded hex fills — same data, same chart types, recolored. GSAP scroll-reveal on the charts row, matching the citizen dashboard's stagger pattern.

### Admin Issues table & detail (`/admin/issues`, `/admin/issues/[id]`, `/admin/issues/map`, `/admin/issues/debug`)
Table restyled (row hover state, status/priority `Badge`s via Signal status colors, checkbox styling). `SimpleAdminActions` dropdown menu (portal-rendered) gets Framer Motion open/close instead of instant show/hide. Bulk-actions bar slide-in when rows are selected. Detail page: the three admin action components (`admin-issue-status-updater`, `admin-department-assigner`, `admin-user-assigner`) each get their "preview banner" (shown before confirming a change) animated in via Framer Motion rather than appearing instantly — reinforces the RBAC-transition smoothness called for in the brief.

### Admin Users, Notifications, Reports (`/admin/users`, `/admin/notifications`, `/admin/reports`)
User cards restyled; Suspend/Activate buttons get the same visual hover/press treatment as any other button **but remain non-functional** — this preserves current behavior exactly, per "functionally wired exactly as-is." Notifications Send/History tabs restyled, live preview card updates with a subtle cross-fade as fields change. Reports: date-range `Popover`+`Calendar` restyled to Signal tokens, report-card list gets GSAP stagger-in.

### Global shell (`citizen-nav`, `admin-nav`, `VapiWidget`, toasts, all dialogs/sheets app-wide)
Nav bars: Signal `--secondary` background (indigo, replacing today's white/green), active-route indicator restyled, mobile `Sheet` slide-in gets a refined Framer Motion transition (replacing the current CSS-keyframe `slideIn`), theme toggle added (light/dark). `VapiWidget`: idle/connecting/listening/speaking states rebuilt as Framer Motion `AnimatePresence` variants — idle = `--primary` indigo (not today's arbitrary blue `#2563eb`), listening = `--success` green, speaking = `--accent` coral (repurposing "active/attention" coral here is the one exception to "CTA/urgent only," flagged for your call in section 6), connecting = neutral spinner. All toasts (`components/ui/toast.tsx`) restyled + Framer Motion enter/exit, replacing Radix's default transition.

---

## 5. Stack (confirmed)

| Package | Status |
|---|---|
| Tailwind CSS | Already in use — tokens move to CSS variables |
| shadcn/ui | Already in use — `components.json` + `components/ui/` confirmed as the active base layer |
| Lucide icons | Already in use |
| `next-themes` (via `theme-provider.tsx`) | Already present, currently unmounted — **now mounted** for the dark-mode toggle |
| GSAP + ScrollTrigger | New — confirmed free for commercial use (Webflow's 2025 licensing change opened the full plugin ecosystem) |
| Framer Motion | New (published as `motion` on npm, commonly still imported as `framer-motion`) |

No other new dependencies.

---

## 6. Open calls for your review (flagged during planning, not yet decided)

1. **Recording-active red** (report form's audio recorder) and **destructive-action red** (delete-account confirm) both need a red outside the Signal palette (coral is reserved for urgency/CTA only, per your brief). Proposing a single neutral `--destructive: #C23B3B` token, distinct from `--accent` coral, used only for these two non-urgency "danger" cases. Confirm or adjust.
2. **VapiWidget's "speaking" state** repurposes coral (`--accent`) for an active-voice indicator, not urgency/CTA. This is a deliberate exception noted above — confirm it's acceptable, or should "speaking" use a different color (e.g. `--primary`) to keep coral 100% reserved.

## Non-goals (explicitly out of scope this pass)

- No functional changes anywhere: identical routes, API calls, data flow, and button behavior — including preserving the non-functional Suspend/Activate buttons on `/admin/users` exactly as they are today.
- No deletion of dead components/files found during the audit (`admin-notifications.tsx`, `interactive-map.tsx`, `search-filter.tsx`, `page-real.tsx`, `styles/globals.css`, etc.) — flagged as known dead weight, cleanup is a separate future task, not part of a visual-layer redesign.
- No fixing of the admin dashboard's dead sidebar links (Bidding/Zones/Wards/Departments/Export/Settings) — out of scope, purely a routing/feature gap unrelated to visual design.
- No consolidation of the duplicate near-identical pages (`my-issues` vs `issues`, `citizen/signup` vs `/auth`) into one — both get the redesign treatment independently, merging them is a code-structure decision outside "visual and interaction layer redesign only."
- No consolidation of the two toast systems (Radix `toast`, wired and used; shadcn `sonner`, present but unused) — Radix stays the one in use, Sonner stays untouched/unused.
