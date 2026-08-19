# Beacon Backend Rebuild, Vapi Completion, and Deploy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore this civic-issue-reporting app to a working, deployed state after its Supabase backend and all API keys were lost — new Supabase project, a completed Vapi voice-reporting path, a new public GitHub repo ("Beacon"), and a live Vercel deployment.

**Architecture:** Next.js 14 app router monolith backed by Supabase (Postgres/Auth/Storage). No new services are introduced except what's already in the codebase (Gemini, HuggingFace, Google Maps, Razorpay, Vapi) — this plan re-provisions infrastructure and closes one functional gap (Vapi never persisted anything) rather than adding features.

**Tech Stack:** Next.js 14 (App Router, TypeScript), Supabase (Postgres, Auth, Storage), `@supabase/supabase-js`, `@vapi-ai/web`, `razorpay`, `gh` CLI, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-17-beacon-backend-rebuild-design.md`

## Global Constraints

- No Stripe code anywhere — Razorpay is the sole payment provider (spec: Stripe is invite-only and export-only for India accounts, incompatible with this app's domestic ₹ donations).
- No local folders are renamed. Only the remote GitHub repo is named `Beacon`.
- New Supabase project region: `ap-south-1` (Mumbai).
- GitHub repo: `Beacon`, public, created via the already-authenticated `gh` CLI (account `ShiBui2003`, full path `C:\Program Files\GitHub CLI\gh.exe` since it isn't yet on this shell's PATH).
- Vercel deploy target: team "Rahul Jha's projects".
- This codebase has no test runner configured (`package.json` has no `test` script, no jest/vitest; the existing root-level `test-*.js` files are empty stubs). Do not introduce one. Verification for code tasks uses `npm run build` (Next's build includes full TypeScript type-checking) plus manual `curl` checks against `npm run dev`, not a unit-test framework.
- Every task that changes tracked files ends with a git commit. Every task that only calls Supabase MCP tools (no local file changes) does not need a commit unless it also updates a local file (e.g. regenerated types).
- Razorpay work (Task 12) is explicitly the **lowest priority** — it runs last, after the app is otherwise back up and deployed.

---

## Task 1: Initialize git and baseline commit

**Files:**
- Create: `.git/` (via `git init`)
- No source files change

**Interfaces:**
- Produces: a git repository at the project root with one commit containing the entire current codebase, which every later task builds on.

- [ ] **Step 1: Confirm the project root and check there's no existing repo**

Run (from `c:\Users\irahu\Desktop\pikachu-05-main\pikachu-05-main`):
```bash
git status
```
Expected: `fatal: not a git repository...` (confirms no repo exists yet here).

- [ ] **Step 2: Initialize the repository**

```bash
git init
git branch -M main
```

- [ ] **Step 3: Verify `.gitignore` excludes secrets and build output**

Read `.gitignore` and confirm it contains `.env*`, `/node_modules`, `/.next/`, `/out/`, `.vercel`. It already does — no edit needed. If any of these were missing, add them before staging.

- [ ] **Step 4: Stage and commit everything**

```bash
git add -A
git status
```
Expected: no `.env*` file listed as staged. If one appears, stop and unstage it (`git restore --staged <file>`) before continuing — do not commit secrets.

```bash
git commit -m "Initial commit: Beacon civic issue reporting platform"
```

- [ ] **Step 5: Verify the commit**

```bash
git log --oneline -1
git status
```
Expected: one commit listed, working tree clean.

---

## Task 2: Provision the new Supabase project

**Files:** none (infrastructure only)

**Interfaces:**
- Produces: a `project_id` (Supabase project ref) used by every later Supabase task in this plan.

- [ ] **Step 1: List organizations and pick the target org**

Call the Supabase MCP `list_organizations` tool. There should be one organization (the same one that owns the existing unrelated "STRIDE" project, `biopquxhzjbmxbtjljhz`). Confirm the org id to use.

- [ ] **Step 2: Get and confirm the cost**

Call `get_cost` with `type: "project"` and the org id from Step 1. This is a **paid resource** — read the returned amount/recurrence back to the user in chat and get explicit approval before continuing. Do not proceed to Step 3 without that approval.

- [ ] **Step 3: Confirm the cost**

Call `confirm_cost` with `type: "project"`, the `recurrence` and `amount` returned in Step 2. Save the returned confirmation id.

- [ ] **Step 4: Create the project**

Call `create_project` with:
- `name`: `"beacon"`
- `region`: `"ap-south-1"`
- `organization_id`: from Step 1
- `confirm_cost_id`: from Step 3

Save the returned `project_id` — every subsequent Supabase task in this plan needs it.

- [ ] **Step 5: Wait for the project to finish initializing**

Call `get_project` (or `list_projects`) with the new `project_id` every ~15s until `status` is `ACTIVE_HEALTHY`. New projects typically take 1-3 minutes.

- [ ] **Step 6: Record the project id locally for later steps**

Create a scratch note (not committed) with the `project_id`, e.g. in your working notes — Task 5 (env checklist) and Task 4 (SETUP.md) both need it. No repo file changes in this task, so no commit.

---

## Task 3: Replay the 26 existing migrations into the new project

**Files:**
- Read only: `supabase/migrations/*.sql` (26 files, already in the repo)

**Interfaces:**
- Consumes: `project_id` from Task 2.
- Produces: a fully-populated schema in the new Supabase project matching what the app code expects (`profiles`, `issues`, `issue_votes`, `comments`, `issue_updates`, `issue_workflow_states`, `issue_assignments`, `departments`, `notifications`, plus supporting functions/triggers/policies).

- [ ] **Step 1: List migration files in apply order**

```bash
ls supabase/migrations/*.sql | sort
```
This is lexicographic order — since every filename is unique (even where the leading number repeats, e.g. `0002_departments_and_workflow.sql` vs `0002_rls_policies.sql`), sorted-by-filename order is deterministic and matches what `supabase db push` would do.

- [ ] **Step 2: Apply each migration in order**

For each file from Step 1, in order: read its contents, then call the Supabase MCP `apply_migration` tool with `project_id` from Task 2, `name` set to the filename without the `.sql` extension (e.g. `0001_initial_schema`), and `query` set to the file's full SQL content.

- [ ] **Step 3: Handle failures without skipping ahead**

If any `apply_migration` call fails, stop, read the error, open that specific migration file, and fix the actual SQL problem (e.g. a table/column referenced before it exists, a duplicate constraint name). Common causes given this migration history: a later "fix" migration assuming a column added in a sibling same-numbered migration already ran — check apply order against Step 1's list if this happens. Re-run `apply_migration` for the fixed file before moving to the next one. Do not proceed past a failing migration.

- [ ] **Step 4: Verify all 26 applied**

Call `list_migrations` with `project_id`. Expected: 26 entries, matching the 26 filenames from Step 1.

- [ ] **Step 5: Spot-check core tables exist**

Call `apply_migration` is not for reads — instead use the Supabase MCP SQL execution tool (`execute_sql`) with:
```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```
Expected: includes at minimum `profiles`, `issues`, `issue_votes`, `comments`, `issue_updates`, `issue_workflow_states`, `issue_assignments`, `departments`, `notifications`.

No local files changed in this task — no commit.

---

## Task 4: Add the missing `campaigns` table migration

**Files:**
- Create: `supabase/migrations/0027_campaigns.sql`

**Interfaces:**
- Consumes: `project_id` from Task 2 (must run after Task 3, since it's migration `0027` and depends on `public.profiles`/`auth.users` already existing... actually it has no FK to profiles, see below).
- Produces: a `campaigns` table matching exactly what `components/CampaignForm.tsx` and `app/citizen/crowdfunding/page.tsx` / `app/admin/crowdfunding/page.tsx` already read/write: `id`, `title`, `description`, `target_amount`, `raised_amount`, `role`.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/0027_campaigns.sql`:

```sql
-- 0027_campaigns.sql
-- Crowdfunding campaigns table. Reconstructed from frontend usage in
-- components/CampaignForm.tsx and app/citizen|admin/crowdfunding — this
-- table previously existed only as a hand-created table in the old
-- Supabase project, with no migration file.

BEGIN;

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  raised_amount NUMERIC NOT NULL DEFAULT 0,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'government')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_role ON public.campaigns(role);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can view campaigns.
CREATE POLICY "campaigns_select_all" ON public.campaigns
  FOR SELECT USING (true);

-- Any authenticated user can create a campaign.
CREATE POLICY "campaigns_insert_authenticated" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Client-side raised_amount updates are intentionally NOT allowed by RLS.
-- Task 12 adds a server route that updates raised_amount using the
-- service-role key after verifying the Razorpay payment signature, which
-- bypasses RLS by design — this policy set exists so that, until Task 12
-- ships, no anonymous/authenticated client can forge a raised_amount bump.

COMMIT;
```

- [ ] **Step 2: Apply it**

Call the Supabase MCP `apply_migration` tool with `project_id` from Task 2, `name: "0027_campaigns"`, and the SQL from Step 1.

- [ ] **Step 3: Verify**

Use `execute_sql` with:
```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'campaigns'
order by ordinal_position;
```
Expected: `id, title, description, target_amount, raised_amount, role, created_by, created_at, updated_at`.

- [ ] **Step 4: Commit the migration file**

```bash
git add supabase/migrations/0027_campaigns.sql
git commit -m "Add missing campaigns table migration"
```

---

## Task 5: Regenerate Supabase TypeScript types

**Files:**
- Modify: `lib/supabase/database.types.ts`

**Interfaces:**
- Consumes: `project_id` from Task 2, and the full schema produced by Tasks 3-4.
- Produces: an up-to-date `Database` type used by `lib/supabase/client.ts` and `lib/supabase/server.ts` (`createBrowserClient<Database>`, `createSupabaseServerClient<Database>`).

- [ ] **Step 1: Generate the types**

Call the Supabase MCP `generate_typescript_types` tool with `project_id` from Task 2.

- [ ] **Step 2: Write the output to the repo**

Replace the full contents of `lib/supabase/database.types.ts` with the generated output.

- [ ] **Step 3: Verify the app still type-checks**

```bash
npm install
npm run build
```
Expected: build completes (warnings about missing env vars at build time are fine and expected since `.env.local` doesn't exist yet — Task 6/Task 9 create it; a hard TypeScript error referencing `database.types.ts` is not fine and must be fixed before continuing).

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "Regenerate Supabase types for new beacon project"
```

---

## Task 6: Run Supabase advisors and address findings

**Files:**
- Possibly modify: additional migration file(s) if advisors flag missing RLS or indexes.

**Interfaces:**
- Consumes: `project_id` from Task 2.

- [ ] **Step 1: Run the security advisor**

Call `get_advisors` with `project_id` and `type: "security"`.

- [ ] **Step 2: Run the performance advisor**

Call `get_advisors` with `project_id` and `type: "performance"`.

- [ ] **Step 3: Triage findings**

For each finding: if it's something this rebuild introduced (e.g. a table from Task 4 missing an expected index, or a policy gap), fix it with a new migration file (`0028_advisor_fixes.sql`) and apply it via `apply_migration`, then note the fix. If it's a pre-existing condition inherited from the original 26 migrations unrelated to this rebuild (e.g. a long-standing missing index on an old table), record it in `SETUP.md` (Task 9) as a known item rather than silently expanding scope — this plan restores the app, it doesn't audit the entire original schema.

- [ ] **Step 4: Commit if a fix migration was added**

```bash
git add supabase/migrations/0028_advisor_fixes.sql
git commit -m "Address Supabase advisor findings from new project"
```
(Skip this step if Step 3 produced no new file.)

---

## Task 7: Pass the signed-in user's id into the Vapi call

**Files:**
- Modify: `components/VapiWidget.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `@/contexts/auth-context` (already exported, returns `{ user, ... }` where `user` is a Supabase `User | null` with `.id`).
- Produces: a `userId` value included in the `variableValues` passed to `vapi.start(...)`, which Task 8's webhook reads via `call.function.arguments.userId` to attribute the created issue to the right `profiles.id` (required — `issues.user_id` is `NOT NULL`).

This closes the identity half of the voice-reporting gap: without this, the webhook has no legal way to satisfy the `issues.user_id` foreign key for a voice-submitted report.

- [ ] **Step 1: Import the auth hook**

In `components/VapiWidget.tsx`, add near the top:
```tsx
import { useAuth } from "@/contexts/auth-context";
```

- [ ] **Step 2: Read the current user inside the component**

Inside `VapiVoiceButton`, right after the existing `useState` declarations, add:
```tsx
const { user } = useAuth();
```

- [ ] **Step 3: Include `userId` in the call variables**

Find the existing block in `handleVoiceToggle`:
```tsx
const extraVars = config?.variables ?? {};
const variables = {
    ...extraVars,
    lat: finalLat,
    lng: finalLng,
};
```
Replace it with:
```tsx
const extraVars = config?.variables ?? {};
const variables = {
    ...extraVars,
    lat: finalLat,
    lng: finalLng,
    userId: user?.id ?? null,
};
```

- [ ] **Step 4: Guard the button when signed out**

Right before the existing `if (!vapi) return;` line at the top of `handleVoiceToggle`, add:
```tsx
if (!user) {
    console.warn("Vapi: cannot start a voice report while signed out.");
    return;
}
```
(The webhook in Task 8 also rejects calls with no `userId` as defense in depth, but failing fast here avoids starting a call the assistant can't ever successfully submit.)

- [ ] **Step 5: Type-check**

```bash
npm run build
```
Expected: no new TypeScript errors introduced by this file.

- [ ] **Step 6: Commit**

```bash
git add components/VapiWidget.tsx
git commit -m "Pass authenticated user id into Vapi call variables"
```

---

## Task 8: Build the Vapi webhook that actually creates issues

**Files:**
- Create: `app/api/vapi/webhook/route.ts`
- Modify: `middleware.ts` (add the new route to `publicRoutes` — Vapi's servers call this with no browser session/cookies, so it must bypass the Supabase-cookie auth check; the route does its own secret-header check instead)

**Interfaces:**
- Consumes: `detectAIUrgency` from `@/lib/aiUrgency` (`(issueData: AIUrgencyRequest) => Promise<AIUrgencyResult>`, already exists), the existing `/api/verify-issue` POST endpoint (`{ title, category, description } -> { decision: "Yes"|"No", category: string }`), `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL` (same pattern already used in `app/api/issues/[id]/ai-urgency/route.ts`), and a new env var `VAPI_WEBHOOK_SECRET`.
- Produces: `POST /api/vapi/webhook`, which Vapi's dashboard "Tool" configuration points at as its Server URL. Returns Vapi's expected `{ results: [{ toolCallId, result }] }` shape.

- [ ] **Step 1: Add the route to `middleware.ts`'s public routes**

In `middleware.ts`, find:
```ts
const publicRoutes = [
    "/",
    "/auth",
    ...
    "/api/verify-issue",
    "/api/analyze-photo",
    "/_next",
    "/favicon.ico",
];
```
Add `"/api/vapi/webhook"` to the list (this route authenticates via its own shared-secret header, not Supabase cookies, since Vapi calls it server-to-server).

- [ ] **Step 2: Create the webhook route**

Create `app/api/vapi/webhook/route.ts`:

```ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface VapiToolCall {
    id: string;
    function?: {
        name?: string;
        arguments?: string | Record<string, unknown>;
    };
}

function extractToolCalls(body: any): VapiToolCall[] {
    const message = body?.message ?? body;
    return (
        message?.toolCallList ??
        message?.toolCalls ??
        message?.tool_calls ??
        []
    );
}

function parseArguments(
    raw: string | Record<string, unknown> | undefined
): Record<string, any> {
    if (!raw) return {};
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }
    return raw;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
    const configuredSecret = process.env.VAPI_WEBHOOK_SECRET;
    if (configuredSecret) {
        const provided = request.headers.get("x-vapi-secret");
        if (provided !== configuredSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ results: [] });
    }

    const toolCalls = extractToolCalls(body);
    if (toolCalls.length === 0) {
        return NextResponse.json({ results: [] });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results = await Promise.all(
        toolCalls.map(async (call) => {
            const args = parseArguments(call.function?.arguments);
            const { title, description, category, lat, lng, userId } = args;

            if (!userId) {
                return {
                    toolCallId: call.id,
                    result:
                        "I couldn't submit that because you're not signed in. Please log in to the app and try again.",
                };
            }
            if (!title || !description || !category) {
                return {
                    toolCallId: call.id,
                    result:
                        "I'm missing some details — I need a title, description, and category before I can submit this.",
                };
            }

            const verifyResponse = await fetch(`${SITE_URL}/api/verify-issue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, category, description }),
            }).catch(() => null);
            const verifyData = verifyResponse
                ? await verifyResponse.json().catch(() => null)
                : null;

            if (!verifyData || verifyData.decision !== "Yes") {
                return {
                    toolCallId: call.id,
                    result:
                        "That doesn't sound like a civic issue I can submit — I can report things like potholes, streetlights, garbage, or water leaks.",
                };
            }

            const finalCategory = verifyData.category || category;
            const latNum = Number(lat);
            const lngNum = Number(lng);

            const { data: departments } = await supabase
                .from("departments")
                .select("id, name")
                .eq("name", finalCategory);
            const departmentId =
                departments && departments.length > 0
                    ? (departments[0] as any).id
                    : null;

            const { data: issue, error } = await supabase
                .from("issues")
                .insert({
                    title,
                    description,
                    category: finalCategory,
                    priority: "medium",
                    location_address:
                        Number.isFinite(latNum) && Number.isFinite(lngNum)
                            ? `${latNum}, ${lngNum}`
                            : "Reported via voice — location unavailable",
                    location_lat: Number.isFinite(latNum) ? latNum : null,
                    location_lng: Number.isFinite(lngNum) ? lngNum : null,
                    user_id: userId,
                    department_id: departmentId,
                })
                .select("id")
                .single();

            if (error || !issue) {
                console.error("Vapi webhook: failed to insert issue", error);
                return {
                    toolCallId: call.id,
                    result:
                        "Something went wrong saving that report — please try again in a moment.",
                };
            }

            fetch(`${SITE_URL}/api/issues/${(issue as any).id}/ai-urgency`, {
                method: "POST",
            }).catch((err) =>
                console.error("Vapi webhook: failed to trigger AI urgency", err)
            );

            return {
                toolCallId: call.id,
                result: `Got it — I've submitted "${title}" under ${finalCategory}. Thanks for reporting it!`,
            };
        })
    );

    return NextResponse.json({ results });
}
```

- [ ] **Step 3: Type-check**

```bash
npm run build
```
Expected: build succeeds with no new errors.

- [ ] **Step 4: Manual verification against the dev server**

```bash
npm run dev
```
In a second terminal, with the dev server running and `VAPI_WEBHOOK_SECRET` unset (so the check is skipped) or set and passed as a header:
```bash
curl -X POST http://localhost:3000/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"toolCalls":[{"id":"test-1","function":{"name":"submit_issue","arguments":{"title":"Broken streetlight","description":"The streetlight outside the market has been off for a week.","category":"Electrical Services","lat":19.076,"lng":72.8777,"userId":"<paste a real profiles.id from your new project>"}}}]}}'
```
Expected: JSON response with a `results` array containing one item whose `result` string either confirms the submission or explains why it was rejected (e.g. `userId` not a real profile id gives a foreign-key error caught and reported as the generic "something went wrong" message — that's acceptable for this manual check, it confirms the route round-trips correctly). Confirm via `execute_sql` (`select * from issues order by created_at desc limit 1;`) that a row was inserted end-to-end when a real `userId` is used.

- [ ] **Step 5: Commit**

```bash
git add app/api/vapi/webhook/route.ts middleware.ts
git commit -m "Add Vapi webhook to persist voice-reported issues"
```

---

## Task 9: Write the SETUP.md secrets checklist

**Files:**
- Create: `SETUP.md`

**Interfaces:** none (documentation only)

- [ ] **Step 1: Write the checklist**

Create `SETUP.md` at the project root:

```markdown
# Setup checklist — Beacon

Every key below was lost with the old Supabase backend. Get each one and
put it in `.env.local` for local dev, and in the Vercel project's
Environment Variables for production (Task 11).

## Supabase
- Project: created in Task 2 of the rebuild plan (region ap-south-1).
- `NEXT_PUBLIC_SUPABASE_URL` — Project Settings → API → Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API → anon/public key.
- `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → service_role key.
  Server-only, never exposed to the browser, never committed.

## Gemini (Google AI Studio)
- Go to https://aistudio.google.com/apikey, create an API key.
- `GEMINI_API_KEY` — used by `/api/analyze-photo` and `/api/verify-issue`.

## HuggingFace
- Sign in at https://huggingface.co, go to Settings → Access Tokens,
  create a token with "Read" access (Inference API access included).
- `HF_TOKEN` — used by `lib/aiUrgency.ts` for urgency classification.

## Google Maps
- Go to Google Cloud Console → APIs & Services → Credentials.
- Enable "Maps JavaScript API" and "Places API" on the project.
- Create an API key, restrict it to your domain(s) once you know the
  production URL.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

## Razorpay
- Sign in / sign up at https://dashboard.razorpay.com.
- Settings → API Keys → Generate Test Key (sufficient to get the app
  working end-to-end). Live mode requires completing Razorpay's KYC.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same value as `RAZORPAY_KEY_ID`, exposed
  to the browser (used by `app/citizen/crowdfunding/page.tsx` to open the
  Razorpay checkout widget).

## Vapi

**Architecture note:** this was originally planned as a Next.js webhook
(`/api/vapi/webhook`), but you already had a pre-built Vapi assistant
("civic", id `5a9640cd-3c4f-4053-ade4-c23a27b876fe`) whose `send_report`
Tool calls a Supabase Postgres RPC function directly over PostgREST —
no Next.js server involved at all. We matched that instead of building a
parallel path: `supabase/migrations/0029_anon_report_rpc.sql` recreates
`public.api_create_issue_anon_by_dept(p_lat, p_lng, p_title, p_priority,
p_description, p_department_name DEFAULT NULL, p_assign DEFAULT FALSE)`
in the new `beacon` project, granted to `anon` — so voice reports need no
signed-in user. `0030_fix_notification_trigger_null_user.sql` fixes a
notification trigger that would otherwise throw when `p_assign=true`
inserts an anonymous (`user_id IS NULL`) issue. The webhook route and the
`userId`-passing change to `VapiWidget.tsx` were built, then reverted
(commits `8cb7388`/`4314199` reverted by `bd08cb3`/`d8a7712`) once this
became clear — `VapiWidget.tsx` and `middleware.ts` are unchanged from
their original state; no webhook route exists in `app/api/`.

- The assistant already exists — nothing to create at vapi.ai. In its
  dashboard, open the `send_report` Tool's HTTP request config and update
  two fields to point at the new `beacon` project instead of the dead one:
  - **Request URL** → `https://rqroajihogcxrdsjglyj.supabase.co/rest/v1/rpc/api_create_issue_anon_by_dept`
  - **Authorization header** → the new project's `anon` key (from
    `NEXT_PUBLIC_SUPABASE_ANON_KEY` below), typically as both `apikey:
    <anon key>` and `Authorization: Bearer <anon key>` headers (PostgREST's
    usual pair) — check what header names the existing Tool config uses
    and update their values, don't change the header names/shape.
  - Leave the Tool's parameter schema (`p_lat`, `p_lng`, `p_title`,
    `p_priority`, `p_description`, `p_department_name`, `p_assign`)
    exactly as it already is — it already matches the recreated function.
- `NEXT_PUBLIC_VAPI_API_KEY` — Vapi dashboard → your public/web key. Prior
  value on file: `3a9f1c6f-607d-48b8-86e4-d75d111dd171` (confirm it's
  still valid in the dashboard before using it).
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID` — `5a9640cd-3c4f-4053-ade4-c23a27b876fe`
  (the "civic" assistant).

## Site URL
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` for local dev, your
  Vercel production URL once deployed (Task 11). Used by the AI-urgency
  trigger in `POST /api/issues`.
```

- [ ] **Step 2: Commit**

```bash
git add SETUP.md
git commit -m "Add SETUP.md secrets checklist"
```

---

## Task 10: Push to the new GitHub repo "Beacon"

**Files:** none (remote operation)

**Interfaces:**
- Consumes: the local git repo from Task 1 plus every commit made through Task 9.

- [ ] **Step 1: Confirm gh auth (already done, but re-verify)**

```bash
"C:\Program Files\GitHub CLI\gh.exe" auth status
```
Expected: logged in to github.com as `ShiBui2003` with `repo` scope present.

- [ ] **Step 2: Create the repo and push in one step**

From the project root:
```bash
"C:\Program Files\GitHub CLI\gh.exe" repo create Beacon --public --source=. --remote=origin --push
```
Expected: repo created at `github.com/ShiBui2003/Beacon`, `origin` remote added, `main` pushed.

- [ ] **Step 3: Verify**

```bash
git remote -v
"C:\Program Files\GitHub CLI\gh.exe" repo view ShiBui2003/Beacon --web
```
Expected: `origin` points at the new repo; the web view opens (or prints the URL) showing the pushed commits.

No new local files — no additional commit for this task.

---

## Task 11: Deploy to Vercel and wire up production config

**Files:** none tracked (Vercel project config + Supabase dashboard config; may add `.vercel` locally but that's gitignored)

**Interfaces:**
- Consumes: the `Beacon` GitHub repo from Task 10, the full env var list from `SETUP.md` (Task 9) with real values the user has by now obtained, and `project_id` from Task 2.

- [ ] **Step 1: Create the Vercel project from the GitHub repo**

Use the Vercel MCP to create a new project linked to `ShiBui2003/Beacon` under team "Rahul Jha's projects", framework preset Next.js.

- [ ] **Step 2: Set environment variables**

In the Vercel project's settings, add every variable listed in `SETUP.md`'s per-service sections (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `HF_TOKEN`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_VAPI_API_KEY`, `NEXT_PUBLIC_VAPI_ASSISTANT_ID`, `VAPI_WEBHOOK_SECRET`) for the Production environment. `NEXT_PUBLIC_SITE_URL` gets set after Step 3 once the production domain is known.

- [ ] **Step 3: Deploy to production**

Trigger a production deployment. Once it succeeds, note the assigned `*.vercel.app` domain (or custom domain if configured).

- [ ] **Step 4: Set `NEXT_PUBLIC_SITE_URL` and redeploy**

Add `NEXT_PUBLIC_SITE_URL` = the domain from Step 3 to the Vercel env vars, then redeploy (this var is read server-side by the AI-urgency trigger in `/api/issues` and by the Vapi webhook from Task 8 — without it both fall back to `localhost:3000`, which is wrong in production).

- [ ] **Step 5: Update Supabase auth redirect URLs**

In the new Supabase project's dashboard, go to Authentication → URL Configuration. Set Site URL to the Vercel production domain, and add `https://<domain>/auth/callback` to the allowed redirect URLs (matches `app/auth/callback` referenced in `contexts/auth-context.tsx`'s Google OAuth flow). Without this, Google sign-in and email confirmation links will redirect to the wrong place.

- [ ] **Step 6: Update the Vapi Tool's server URL**

Go back to the Vapi dashboard assistant Tool config from `SETUP.md` and change the `server.url` from a placeholder to `https://<domain>/api/vapi/webhook`.

- [ ] **Step 7: Smoke test in production**

Load the production URL. Sign up as a citizen, submit one issue through the manual report form (exercises Supabase, Gemini verify, HF urgency), and confirm it appears in `/citizen/issues`. This is the final verification that the whole chain (Task 2-9) works end-to-end in production, not just locally.

---

## Task 12 (lowest priority): Verify Razorpay payment signatures server-side

**Files:**
- Create: `app/api/razorpay/verify/route.ts`
- Modify: `app/citizen/crowdfunding/page.tsx:38-73` (`handleDonate`'s `handler` callback)

**Interfaces:**
- Consumes: `RAZORPAY_KEY_SECRET`, the existing `/api/razorpay` order-creation route (unchanged), `SUPABASE_SERVICE_ROLE_KEY`.
- Produces: `POST /api/razorpay/verify`, which the crowdfunding page calls instead of updating `campaigns.raised_amount` directly from the browser.

This is explicitly the lowest-priority task in this plan — everything needed to get the app running again (Tasks 1-11) comes first. This closes a real gap: currently, anyone can call the browser-side update and inflate `raised_amount` without ever paying, since there's no server-side check that a genuine payment happened.

- [ ] **Step 1: Create the verification route**

Create `app/api/razorpay/verify/route.ts`:

```ts
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            campaignId,
            amount,
        } = await req.json();

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !campaignId ||
            !amount
        ) {
            return NextResponse.json(
                { error: "Missing verification fields" },
                { status: 400 }
            );
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json(
                { error: "Invalid payment signature" },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: campaign, error: fetchError } = await supabase
            .from("campaigns")
            .select("raised_amount")
            .eq("id", campaignId)
            .single();

        if (fetchError || !campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        const { error: updateError } = await supabase
            .from("campaigns")
            .update({
                raised_amount: (campaign as any).raised_amount + Number(amount),
            })
            .eq("id", campaignId);

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to update campaign" },
                { status: 500 }
            );
        }

        return NextResponse.json({ verified: true });
    } catch (err: any) {
        console.error("Razorpay verification failed:", err);
        return NextResponse.json(
            { error: err.message || "Verification failed" },
            { status: 500 }
        );
    }
}
```

- [ ] **Step 2: Update the crowdfunding page to call it**

In `app/citizen/crowdfunding/page.tsx`, replace the `handler` function inside `handleDonate`:
```tsx
handler: async function (response: any) {
    alert(
        "✅ Payment Successful! Payment ID: " +
            response.razorpay_payment_id
    );
    await (supabase as any)
        .from("campaigns")
        .update({ raised_amount: campaign.raised_amount + amount })
        .eq("id", campaign.id);
    fetchCampaigns();
},
```
with:
```tsx
handler: async function (response: any) {
    const verifyRes = await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            campaignId: campaign.id,
            amount,
        }),
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.verified) {
        alert("❌ Payment verification failed: " + (verifyData.error || "unknown error"));
        return;
    }

    alert(
        "✅ Payment Successful! Payment ID: " +
            response.razorpay_payment_id
    );
    fetchCampaigns();
},
```

- [ ] **Step 3: Type-check**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Manual verification**

```bash
npm run dev
```
With a test-mode Razorpay order already created via the existing `/api/razorpay` route, POST a deliberately wrong signature to confirm rejection:
```bash
curl -X POST http://localhost:3000/api/razorpay/verify \
  -H "Content-Type: application/json" \
  -d '{"razorpay_order_id":"order_test","razorpay_payment_id":"pay_test","razorpay_signature":"deliberately-wrong","campaignId":"<a real campaign id>","amount":500}'
```
Expected: `{"error":"Invalid payment signature"}` with a 400 status, and `campaigns.raised_amount` unchanged (confirm via `execute_sql`). A full "correct signature" test requires an actual completed Razorpay test-mode checkout, which can only happen through the real browser flow once `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are in place — do that as the final check by actually clicking "Donate" in the running app.

- [ ] **Step 5: Commit**

```bash
git add app/api/razorpay/verify/route.ts app/citizen/crowdfunding/page.tsx
git commit -m "Verify Razorpay payment signature server-side before crediting campaigns"
```

- [ ] **Step 6: Push**

```bash
git push origin main
```

---

## Self-review notes

- **Spec coverage:** every section of `2026-08-17-beacon-backend-rebuild-design.md` maps to a task — git init (§5), Supabase rebuild (§1), Vapi webhook (§2), Razorpay keys-only-then-signature-fix (§3, lowest priority), SETUP.md (§4), GitHub push (§5), Vercel deploy + auth redirect (§6). Non-goals (Stripe, folder rename, branding) are not touched by any task.
- **Known limitation carried forward, not fixed:** Task 8's webhook re-uses `/api/verify-issue`'s Gemini call, which was originally designed to sometimes receive an image; voice reports never have one. This is fine — that route already handles the no-image case (see its existing `if (imageBase64)` guard) — but the verification prompt is tuned for the general case, not voice specifically. If false negatives turn out to be common in practice, tightening that prompt is a follow-up, not part of this plan.
