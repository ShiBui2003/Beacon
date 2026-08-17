# Beacon backend rebuild, Vapi completion, and deploy — design

Date: 2026-08-17
Status: Approved for implementation planning

## Context

This repo (originally "Civik" / page-titled "Janmarg") is a Next.js 14 civic-issue
reporting platform. Its Supabase backend was erased — all data and the project
itself are gone, and all external API keys (Gemini, HuggingFace, Google Maps,
Razorpay, Vapi) were lost with it. The codebase itself is intact and was not
previously in a git repository.

Goal: get this app back to a working, deployed state under a new identity
("Beacon"), with a rebuilt Supabase backend, working Vapi voice reporting
(currently incomplete — see below), and pushed to a new GitHub repo.

## Decisions already made

- **Payments:** Keep Razorpay as the sole payment provider. Stripe was
  evaluated and rejected: new Stripe accounts from India are invite-only, and
  even approved India accounts are scoped to international/export
  transactions only — this app's crowdfunding flow is domestic ₹
  citizen-to-campaign donations, which Stripe explicitly does not support for
  India-based accounts. No Stripe code is added.
- **Supabase:** provision a brand-new project (not the existing unrelated
  "STRIDE" project already in the account). Region: `ap-south-1` (Mumbai),
  closest to the app's India user base.
- **GitHub:** new repo named `Beacon`, public, under the `gh`-authenticated
  account (ShiBui2003, already logged in with `repo`/`workflow` scopes).
  The local folder name is *not* being renamed to match — only the remote
  repo name changes.
- **Deploy target:** Vercel, team "Rahul Jha's projects" (already connected).
- **Vapi/Gemini:** the frontend skeleton for both already exists in the
  codebase (`VapiWidget.tsx`, `/api/analyze-photo`, `/api/verify-issue`).
  Nothing structural needs to change there except closing the gap described
  below and re-supplying API keys.
- **Out of scope:** renaming local folders, fixing the Civik/Janmarg branding
  inconsistency, any other feature work.

## Gaps found during audit (must fix as part of this rebuild)

1. **`campaigns` table has no migration.** The crowdfunding feature
   (`CampaignForm.tsx`, `app/citizen/crowdfunding`, `app/admin/crowdfunding`)
   reads/writes a `campaigns` table that was hand-created in the old Supabase
   project's dashboard and never captured in `supabase/migrations/`. It must
   be reconstructed from the fields the frontend code depends on: `title`,
   `description`, `target_amount`, `raised_amount`, `role`.
2. **Vapi voice reporting doesn't persist anything.** `VapiWidget.tsx` starts
   a Vapi call and passes `lat`/`lng` as assistant variables, but there is no
   server-side webhook anywhere in `app/api/`. The assistant currently has no
   way to actually create an issue record — voice reporting is a dead end
   functionally, despite being a headline feature in the README. This needs
   a new webhook endpoint implementing Vapi's server-tool-call contract, plus
   a Vapi-side "tool" configuration pointing at it.
3. **26 migration files, several with duplicate number prefixes** (two each
   at `0002`, `0004`, `0005`, `0006`, `0009`, `0014`). Filenames are still
   unique so lexicographic replay order is deterministic, but this needs to
   be applied carefully and any actual SQL failures fixed as encountered
   rather than assumed safe.

## Architecture

### 1. Supabase project rebuild
- Create a new Supabase project, region `ap-south-1`.
- Replay all 26 existing migrations in filename order via the Supabase
  management API/MCP, fixing any apply-time failures.
- Add a new migration `0027_campaigns.sql`: `campaigns` table (id, title,
  description, target_amount numeric, raised_amount numeric default 0, role
  text check in ('citizen','government'), created_at) with RLS — public
  read, authenticated insert, and update restricted appropriately (raised
  amount updates should really happen server-side after payment
  verification rather than client-side, see below).
- Regenerate `lib/supabase/database.types.ts` from the new schema.
- Run Supabase's advisors (security + performance) against the new project
  and address anything material before considering this step done.

### 2. Vapi webhook (closes the voice-reporting gap)
- New route: `app/api/vapi/webhook/route.ts`. Implements Vapi's
  server-message contract for a custom "tool": receives the structured
  arguments the assistant collected (title, description, category, lat,
  lng), runs the same Gemini verify (`/api/verify-issue` logic) and
  HuggingFace urgency classification (`lib/aiUrgency.ts`) the manual report
  form uses, inserts into `issues`, and returns a result message the
  assistant speaks back to the citizen.
- Assistant configuration itself (system prompt, the tool's JSON schema,
  pointing the tool's URL at this route) happens in the Vapi dashboard —
  provided as copy-paste instructions in `SETUP.md`, since there's no
  Vapi API/MCP access available to do this programmatically.

### 3. Razorpay — keys only now, signature-verification fix last
- Existing `/api/razorpay` order-creation route and checkout flow are kept
  as-is structurally. Only new API keys are needed (test-mode keys are
  sufficient to get the app working end-to-end; live mode requires Razorpay
  KYC, which is the user's responsibility outside this session).
- Known pre-existing gap: `CitizenCrowdfundingPage` updates `raised_amount`
  from the browser after the Razorpay `handler` fires, with no server-side
  verification of the payment signature — anyone can call that update
  without actually paying. This **is** in scope to fix (add a
  `/api/razorpay/verify` route that checks the HMAC signature server-side
  before updating `raised_amount`), but it's explicitly the **lowest
  priority item** in the execution order — everything needed to get the app
  running again (Supabase, Vapi webhook, keys, repo, deploy) comes first.

### 4. Secrets / setup checklist
- New `SETUP.md` at the repo root listing, for each of Supabase, Gemini
  (Google AI Studio), HuggingFace, Google Maps (Cloud Console), Razorpay,
  and Vapi: where to get the key, and which `.env.local` / Vercel env var
  name it goes into. This exists because every previous key was lost.

### 5. GitHub
- `git init` at the project root (this becomes the working repo).
- Initial commit of the current codebase (env files already gitignored).
- `gh repo create Beacon --public --source=. --push` using the already
  logged-in `gh` session.

### 6. Vercel deploy
- Create/link a new Vercel project from the `Beacon` GitHub repo under team
  "Rahul Jha's projects".
- Set all env vars (Supabase, Gemini, HF, Google Maps, Razorpay, Vapi) in
  the Vercel project settings — actual key values supplied by the user via
  `SETUP.md`.
- Deploy to production.
- Update the new Supabase project's Auth → URL Configuration (site URL +
  redirect URLs) to point at the deployed Vercel domain, otherwise Google
  OAuth and email links will redirect to nowhere.

## Testing

- After migrations replay: verify via Supabase advisors + a manual spot
  query that core tables (`profiles`, `issues`, `campaigns`, etc.) exist
  with expected columns.
- After webhook is added: `npm run build` must pass; manual test of the
  webhook route with a synthetic Vapi tool-call payload (curl) once keys are
  in place, since a live Vapi call requires the user's dashboard-side
  assistant to exist first.
- `npm run dev` smoke test locally before pushing, using freshly obtained
  test-mode keys.
- Vercel deployment verified by loading the production URL and checking the
  citizen report flow and admin login redirect at minimum.

## Non-goals

- Stripe integration.
- Renaming local folders or fixing the Civik/Janmarg naming inconsistency.
- Any new feature work beyond restoring existing documented functionality.
