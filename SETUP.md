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
