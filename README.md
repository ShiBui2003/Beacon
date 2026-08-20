```
██████╗ ███████╗ █████╗  ██████╗ ██████╗ ███╗   ██╗
██╔══██╗██╔════╝██╔══██╗██╔════╝██╔═══██╗████╗  ██║
██████╔╝█████╗  ███████║██║     ██║   ██║██╔██╗ ██║
██╔══██╗██╔══╝  ██╔══██║██║     ██║   ██║██║╚██╗██║
██████╔╝███████╗██║  ██║╚██████╗╚██████╔╝██║ ╚████║
╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝
```

### Snap a photo. AI ranks the danger. The queue can't bury it.

![build](https://img.shields.io/badge/build-passing-brightgreen)
![deploy](https://img.shields.io/badge/Vercel-live-black?logo=vercel&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)

Civic complaint systems treat a cracked sidewalk and a live wire the same way: a ticket number and a queue. Beacon exists because triage shouldn't depend on who shouts loudest — AI reads every report the second it's filed and ranks it by what's actually dangerous.

**Live:** [beacon-beige-delta.vercel.app](https://beacon-beige-delta.vercel.app)

## Features

- **AI urgency scoring** — zero-shot classification ranks every report low / medium / high, so safety-critical issues surface even with zero upvotes.
  Runs `facebook/bart-large-mnli` on Hugging Face's Inference API against three candidate labels; the top-scoring label overwrites the issue's `priority` outright, and list ordering blends it with community signal as `0.7 × urgency weight + 0.3 × log(1 + upvotes)`. On API failure it falls back to "medium" at confidence `0` rather than blocking the report — the classifier runs async, after the issue is already saved.

- **Photo-to-report** — Gemini Vision reads the photo and fills in title, category, urgency, and confidence automatically.
  Calls `gemini-2.0-flash` with a prompt that forces structured JSON output; there's no hard confidence cutoff that gates anything — the score is stored and shown in the UI rather than used to auto-accept or auto-reject. If Gemini errors, returns unparseable text, or the photo isn't a civic issue at all, the endpoint still responds `200` with a manual-entry fallback so the form never breaks. A second, independent Gemini call (`/api/verify-issue`) re-checks the description against the photo and corrects the category at submit time.

- **Voice reporting** — a floating voice assistant files a fully geotagged report, no typing required.
  Browser geolocation is captured client-side and passed as call variables to a Vapi assistant; its `send_report` tool then calls a Postgres RPC (`api_create_issue_anon_by_dept`) directly over PostgREST, skipping the Next.js API entirely. The function is `SECURITY DEFINER` and granted to the `anon` role, so a voice report needs no signed-in user.

- **Multi-language input** — spoken or typed, in Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Urdu, and more.
  Typed dictation uses the browser's native Web Speech API with a selectable locale (`hi-IN`, `bn-IN`, `ta-IN`, ...); it transcribes, it doesn't translate — the report is submitted in the reporter's own language and Gemini/BART classify directly from that text.

- **Role-based dashboards** — citizens track their own reports; department heads, field workers, and admins get scoped, real-time workflow views.
  A six-level role hierarchy (Citizen, then staff levels Technician, Clerk/Operator, Field Worker, Supervisor, up to Department Head) drives a JSONB permissions blob per role. Next.js middleware splits citizen vs. staff routing; API queries additionally scope staff to `department_id = mine OR unassigned`, so no department sees another's queue.

- **Civic crowdfunding** — citizens back department-run campaigns with a real payment, without leaving the app.
  Razorpay Checkout opens against an order created by `/api/razorpay`; on success, campaign progress updates against the `campaigns` table.

## Tech stack

| Library | Purpose | Version |
|---|---|---|
| Next.js (App Router) | Frontend framework and routing | 14.2.16 |
| TypeScript | Strict typing across the whole codebase | 5.x |
| Tailwind CSS | Utility-first styling with a custom design-token theme | 4.1.13 |
| Radix UI + shadcn/ui | Accessible component primitives ("new-york" style) | latest |
| Supabase JS | Auth, Postgres access, storage, realtime | latest |
| react-hook-form + Zod | Form state and schema validation | 7.60 / 3.25 |
| Framer Motion | Component and page-level animation | 13.x |
| GSAP + ScrollTrigger (`@gsap/react`) | Scroll-linked reveals on the landing page | 3.15 / 2.1 |
| next-themes | Light/dark theme switching | latest |
| Vapi web SDK | In-browser voice assistant | 2.3.10 |
| Razorpay | Checkout + orders for crowdfunding | 2.9.6 |
| Recharts | Admin analytics charts | latest |

## Architecture

The frontend is a Next.js App Router app: citizen and admin surfaces behind role-scoped middleware, a marketing landing page in front of the auth wall. All AI calls happen server-side in route handlers — no model keys ever reach the browser. Supabase is the entire backend: Postgres with row-level security on every table, Auth (email/password + Google OAuth), and Storage for photos and voice-note audio. The one path that bypasses the Next.js server entirely is voice intake, which calls a `SECURITY DEFINER` Postgres RPC directly over PostgREST.

```
Citizen reports an issue
   │
   ├─ Photo/text (web form) ──▶ Gemini Vision (gemini-2.0-flash)
   │                             extracts title / category / urgency
   │                                    │
   │                                    ▼
   │                          POST /api/issues → row inserted
   │                                    │
   │                                    ▼ (async, non-blocking)
   │                          BART zero-shot urgency classification
   │                          (facebook/bart-large-mnli) → overwrites priority
   │
   └─ Voice (Vapi assistant) ──▶ send_report tool
                                       │
                                       ▼
                       Postgres RPC over PostgREST (anon role,
                       no Next.js server involved)
                                       │
                                       ▼
        issue row: category, priority, ai_urgency, ai_confidence,
              department_id, location_lat / location_lng
                                       │
                                       ▼
        Role-scoped dashboard (RLS + middleware): citizen · clerk/operator
        · technician · field worker · supervisor · department head
                                       │
                                       ▼
        submitted → assigned → in_progress → resolved
        (notification fired to the reporter on every transition)
```

## Notable technical decisions

- **Zero-shot over fine-tuned, and it runs twice.** There's no labeled "urgency" dataset for civic reports to fine-tune against, so urgency classification is zero-shot NLI over three candidate labels — redefining a level is a string-array edit, not a retrain. That choice means urgency actually gets scored twice: Gemini's guess seeds the initial priority at intake, and BART's async pass overwrites it moments later. They're allowed to disagree.
- **Voice reports never touch the app server.** Rather than building a Next.js webhook for Vapi's tool calls, the assistant calls a `SECURITY DEFINER` Postgres RPC directly over PostgREST, granted to `anon`. Fewer moving parts and no auth handshake for a citizen mid-call — the tradeoff is that voice reports skip BART entirely; the voice agent sets priority itself, in conversation.
- **Multi-language is transcription, not translation.** The Web Speech API transcribes in whatever language the reporter speaks and that text goes straight to Gemini and BART as-is. No translation hop, no translation-induced drift — at the cost of leaning on both models' multilingual understanding rather than a dedicated language pipeline.
- **Dark mode is scoped, not blanket.** The landing and auth pages ship a real light/dark toggle built on design tokens. Citizen and admin dashboards predate that system and aren't dark-mode-safe yet, so the whole site is currently pinned to light (`forcedTheme="light"`) rather than letting a stored preference leak an unstyled dark dashboard into production. The toggle comes back once those pages get their own pass.

## Scale

Beacon is live and deployed (see below) as a full-stack platform, not a prototype: 37 Postgres migrations, a 6-role permission hierarchy across 7 departments, and two independently-triggered AI pipelines running in production. No usage numbers are published here — nothing invented to fill the section.

## Getting started

```bash
git clone https://github.com/ShiBui2003/Beacon.git
cd Beacon
npm install
```

Create `.env.local` in the project root (variables below), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Full per-service walkthrough (where to get each key, Google OAuth setup, the Vapi assistant config) is in [SETUP.md](./SETUP.md).

## Environment variables

Public — exposed to the browser:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS + Places API key |
| `NEXT_PUBLIC_VAPI_API_KEY` | Vapi public/web key |
| `NEXT_PUBLIC_VAPI_ASSISTANT_ID` | Vapi assistant ID (voice reporting) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key ID, opens the checkout widget |
| `NEXT_PUBLIC_SITE_URL` | Deployed app URL, used by the AI-urgency trigger |

Server-only — never committed, never sent to the browser:

| Variable | Description |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Elevated Supabase access for admin routes |
| `GEMINI_API_KEY` | Powers `/api/analyze-photo` and `/api/verify-issue` |
| `HF_TOKEN` | Hugging Face Inference API, urgency classification |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Order creation in `/api/razorpay` |

## Deployment

| Setting | Value |
|---|---|
| Platform | Vercel |
| Framework preset | Next.js (auto-detected, zero config) |
| Build command | `next build` (default) |
| Node version | 18.x+ |

Pushing to `main` triggers an automatic build and deploy through Vercel's GitHub integration. All variables above are set per-environment in the Vercel project's dashboard.

## Database schema

15 tables in Supabase Postgres, all with row-level security enabled.

| Table | Holds |
|---|---|
| `profiles` | User accounts, linked 1:1 to Supabase Auth |
| `issues` | Every civic report — category, priority, `ai_urgency`, `ai_confidence`, location, status |
| `issue_updates` | Timeline of status changes per issue |
| `issue_votes` | Community upvotes, feed into list ranking |
| `comments` | Discussion thread per issue |
| `departments` | The 7 government departments issues route to |
| `category_department_mapping` | Which issue category belongs to which department |
| `issue_assignments` | Staff-to-issue assignment records |
| `issue_workflow_states` / `workflow_states` | Full workflow history per issue |
| `roles` / `user_roles` | The 6-level role hierarchy and each user's assignment |
| `notifications` / `admin_notifications` | Citizen-facing and staff-facing notification feeds |
| `campaigns` | Crowdfunding campaigns and their raised/target amounts |
