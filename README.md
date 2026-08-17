**Civik**

A civic issue reporting platform where citizens report infrastructure problems, AI prioritizes them, and municipal authorities manage resolution — all in real time.

->What it does

Citizens submit reports for things like potholes, broken streetlights, garbage overflow, or water leaks. They can type a description, record audio, or just snap a photo and let the AI fill everything in. Reports get an AI-assigned urgency score, show up on a map, and can be upvoted by the community. On the other side, administrators get a dashboard with charts, department-level filters, and workflow tools to assign and resolve issues.

**Stack**

- **Next.js 14** (App Router) with TypeScript
- **Supabase** — Postgres database, Auth, Storage, Realtime
- **Tailwind CSS** + Radix UI / shadcn/ui for components
- **Gemini 2.0 Flash** — image analysis and issue verification
- **HuggingFace BART-large-MNLI** — zero-shot urgency classification
- **Vapi AI** — voice-based issue reporting
- **Google Maps JS API** — location picking and map views
- **Recharts** — admin analytics charts
- **Razorpay** — crowdfunding for community campaigns

**Getting started**

Clone the repo and install dependencies:

```bash
npm install
```

Create a `.env.local` file with these keys:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=
HF_TOKEN=

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

NEXT_PUBLIC_VAPI_API_KEY=
NEXT_PUBLIC_VAPI_ASSISTANT_ID=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Run the database migrations (paste each file from `supabase/migrations/` into the Supabase SQL editor, or use the CLI):

```bash
supabase db push
```

Start the dev server:

```bash
npm run dev
```

Citizen signup is at `/auth?mode=signup`. Admin signup is at `/admin/signup` where you pick a role and department.

**How reports work**

The report form supports three input modes. In Quick Photo mode, the citizen uploads or takes a photo and Gemini Vision automatically extracts the title, description, category, urgency level, and confidence. The form pre-fills instantly and the user just reviews and submits.

In manual mode, the description can be typed or recorded as audio. The audio recording uses the browser's MediaRecorder API and Web Speech API for live transcription. Supported languages include English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Urdu, and more. The audio file uploads to Supabase Storage on submit.

Before any issue hits the database, it passes through a Gemini verification call (`POST /api/verify-issue`) that checks whether the report is a genuine civic issue. If not, it's rejected before insertion.

After creation, a background call to HuggingFace's BART model classifies the urgency as `low`, `medium`, or `high` using zero-shot classification. The result is stored on the issue and used to rank the feed:


score = 0.7 × urgency_weight + 0.3 × log(1 + upvotes).

This keeps safety-critical issues visible even when they have no upvotes yet.

**Voice reporting**

A floating Vapi button lives in the bottom-right corner on every page (rendered in `app/layout.tsx`). It connects to a Vapi AI assistant and passes the user's GPS coordinates as variables, so voice-reported issues can be geotagged.

**Dashboards**

The citizen dashboard shows a real-time issue feed with list and map views, filters by status and category, and a nearby-issues panel (5km radius via Haversine formula). Issues update live via a Supabase Realtime subscription on the `issues` table.

The admin dashboard shows KPI cards, a monthly trends line chart, a category pie chart, department efficiency bars, and a recent issues list. Staff accounts only see issues assigned to their department — the filter runs server-side using a department-routing utility in `lib/departments.ts`.

**Access control**

Middleware at the edge (`middleware.ts`) enforces role-based routing. Citizens are redirected away from `/admin/*` routes and staff are redirected away from `/citizen/*` routes. Roles available: `citizen`, `department_head`, `supervisor`, `field_worker`, `clerk_operator`, `technician`, `admin`.

**Database**

26 Supabase migrations cover the full schema. Core tables:

| Table | What it holds |
|---|---|
| `profiles` | User data mirroring `auth.users` |
| `issues` | Civic reports with AI fields, location, media |
| `issue_votes` | Community voting (up/down/disputed) |
| `comments` | Citizen and admin comments per issue |
| `issue_updates` | Status change history |
| `issue_workflow_states` | Full audit trail of workflow transitions |
| `issue_assignments` | Staff assignments with timestamps |
| `departments` | Municipal departments |
| `notifications` | Per-user notification inbox |
| `abhiyaans` | Community campaigns |

**Project structure**

```
app/
  admin/          admin portal pages
  citizen/        citizen portal pages
  api/            ~30 API route handlers
  layout.tsx      root layout (auth, voice widget, Razorpay)
  middleware.ts   edge route guard

components/
  ui/             shadcn/ui component library
  VapiWidget.tsx  global voice button
  map-picker.tsx  Google Maps location picker

lib/
  aiUrgency.ts          urgency detection + ranking formula
  supabase/             client, server, and database types
  departments.ts        department routing helpers

contexts/
  auth-context.tsx      global auth state

supabase/
  migrations/     26 SQL migration files
```
