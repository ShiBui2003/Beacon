# UI Revamp Phase 1: Foundation (tokens, fonts, theme toggle, landing, auth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the "Signal" design-token system, typography, animation dependencies, and a working dark-mode toggle, then apply them to the landing page and both auth-page implementations. This is Phase 1 of a multi-phase UI/UX revamp — later phases (citizen pages, admin pages) consume the CSS variables, fonts, and theme-toggle mechanism this phase creates.

**Architecture:** Pure styling/animation layer change. No route, API, or data-flow changes anywhere. Design tokens live as CSS custom properties in `app/globals.css` (the file this repo's shadcn config and Tailwind v4 `@theme inline` block already point at) — replacing the current green-palette HSL triplets with Signal-derived ones, same mechanism. GSAP handles scroll-linked animation on the landing page; Framer Motion handles component-level transitions on the auth pages.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS v4 (CSS-first config, no `tailwind.config.ts`), shadcn/ui ("new-york" style, `components/ui/*`), `next-themes` (already a dependency, currently unmounted), GSAP + ScrollTrigger (new), Framer Motion (new).

**Spec:** `docs/superpowers/specs/2026-08-19-ui-ux-revamp-design.md`

## Global Constraints

- Zero functional changes anywhere: identical routes, API calls, data flow, and button behavior. This phase only changes CSS custom property values, font loading, adds a theme toggle, and adds animation — no `onClick` handler, form field, or data fetch changes.
- The Signal palette values (light + dark) are fixed by the spec — do not adjust hex/HSL values while implementing.
- `--destructive: hsl(0, 53%, 50%)` (from `#C23B3B`) is the only red in the system; coral (`--accent`) is reserved for urgency tags and CTAs only, per spec section 6 — do not use `--accent` for anything else in this phase's scope (recording indicators, delete buttons, etc. use `--destructive`).
- CSS variable names introduced here (`--primary`, `--secondary`, `--muted`, `--accent`, `--accent-tint`, `--warning`, `--success`, `--destructive`, `--ring`, `--border`, `--radius-*`, `--shadow-*`, `--space-*`) are a stable interface — later phases reference these exact names. Do not rename any of them mid-task.
- No test runner exists in this codebase (confirmed in an earlier rebuild plan for this repo) — verification is `npm run build` (full TypeScript + Next.js build) plus manual visual check via `npm run dev`, not unit tests.
- Every task ends with a commit.

---

## Task 1: Install animation dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm install`)

**Interfaces:**
- Produces: `gsap` (with `ScrollTrigger` plugin, imported from `gsap/ScrollTrigger`) and `framer-motion` importable from any component in later tasks.

- [ ] **Step 1: Install the packages**

```bash
npm install gsap framer-motion
```

- [ ] **Step 2: Verify they resolve**

```bash
node -e "require.resolve('gsap'); require.resolve('framer-motion'); console.log('OK')"
```
Expected: prints `OK` with no error.

- [ ] **Step 3: Confirm the build still passes**

```bash
npm run build
```
Expected: build succeeds (these packages aren't used by any code yet, so this just confirms the install didn't break anything).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add GSAP and Framer Motion for the UI revamp animation layer"
```

---

## Task 2: Build the Signal design-token system

**Files:**
- Modify: `app/globals.css` (full token block replacement)
- Delete: `styles/globals.css` (confirmed dead — not imported anywhere, per the audit in the spec)

**Interfaces:**
- Produces: every CSS variable later tasks and later phases style against — `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--border`, `--ring`, `--accent`, `--accent-foreground`, `--accent-tint`, `--warning`, `--success`, `--destructive`, `--destructive-foreground`, `--radius-sm/md/lg/full`, `--shadow-sm/md/lg`, `--space-1..8`, plus the existing `--status-submitted/review/progress/resolved` tokens remapped to Signal-derived values (same variable names, so nothing consuming `.status-*`/`.bg-status-*` utility classes elsewhere in the codebase breaks).
- Consumes: nothing (this is the foundation).

The existing file mixes two patterns: raw hex vars (`--primary-green: #2e6a56`) and shadcn-style space-separated HSL triplets consumed via `hsl(var(--x))` (e.g. `.bg-status-submitted { background-color: var(--status-submitted); }` uses the triplet directly as it's already itself a valid `<hue> <sat>% <light>%` value once wrapped, and the `@theme inline` block maps `--color-primary: var(--primary)` the same way). This task keeps that exact mechanism — only the values change, converted from the spec's hex to HSL triplets (computed below).

- [ ] **Step 1: Delete the dead stylesheet**

```bash
git rm styles/globals.css
```

- [ ] **Step 2: Replace `app/globals.css`'s `:root` and `.dark` blocks**

In `app/globals.css`, replace lines 6–74 (the entire `:root { ... }` block through the closing brace before `.dark {`) with:

```css
:root {
    /* Signal palette — indigo structure + coral accent (reserved for
       urgency tags and primary CTAs only) */
    --background: #ffffff;
    --foreground: 245 47% 25%; /* #26215C */

    --primary: 245 43% 50%; /* #534AB7 */
    --primary-foreground: 0 0% 100%;
    --primary-hover: 246 45% 37%; /* #3C3489 */

    --secondary: 246 45% 37%; /* #3C3489 — structural surfaces (nav, headers) */
    --secondary-foreground: 0 0% 100%;

    --muted: 252 50% 95%; /* #F1EFF9 */
    --muted-foreground: 253 12% 42%; /* #6B6580 */

    --card: 0 0% 100%;
    --card-foreground: 245 47% 25%;
    --popover: 0 0% 100%;
    --popover-foreground: 245 47% 25%;

    --border: 252 41% 92%; /* #E4E1F0 */
    --input: 252 41% 92%;
    --ring: 245 60% 67%; /* #7F77DD */

    --accent: 15 68% 52%; /* #D85A30 — coral, urgency/CTA only */
    --accent-foreground: 0 0% 100%;
    --accent-tint: 15 66% 94%; /* #FAECE7 */

    --warning: 41 74% 53%; /* #E0A72E */
    --success: 148 50% 37%; /* #2F8F5B */
    --destructive: 0 53% 50%; /* #C23B3B */
    --destructive-foreground: 0 0% 100%;

    --radius: 0.625rem; /* 10px, backs --radius-md below */
    --radius-sm: 0.375rem; /* 6px */
    --radius-md: 0.625rem; /* 10px */
    --radius-lg: 1rem; /* 16px */
    --radius-full: 9999px;

    --shadow-sm: 0 1px 2px rgba(38, 33, 92, 0.06);
    --shadow-md: 0 4px 12px rgba(38, 33, 92, 0.08);
    --shadow-lg: 0 12px 32px rgba(38, 33, 92, 0.12);

    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 24px;
    --space-6: 32px;
    --space-7: 48px;
    --space-8: 64px;

    /* Status colors for issue tracking — same variable names as before,
       Signal-derived values so every .status-*/.bg-status-* usage across
       the app (unchanged in this phase) picks up the new palette automatically */
    --status-submitted: 253 12% 55%; /* neutral, muted-foreground family */
    --status-review: 245 43% 50%; /* --primary */
    --status-progress: 246 45% 37%; /* --secondary */
    --status-resolved: 148 50% 37%; /* --success */
}
```

- [ ] **Step 3: Replace the `.dark` block**

Replace the `.dark { ... }` block (originally lines 56–74) with:

```css
.dark {
    --background: 245 47% 25%; /* #26215C — dark-mode surface base */
    --foreground: 258 41% 97%; /* #F5F3FA */

    --primary: 245 60% 67%; /* #7F77DD — lighter indigo for contrast on dark */
    --primary-foreground: 245 47% 25%;
    --primary-hover: 245 43% 50%;

    --secondary: 246 45% 37%; /* #3C3489 — elevated panels/cards */
    --secondary-foreground: 258 41% 97%;

    --muted: 245 43% 30%; /* #322C6E */
    --muted-foreground: 248 37% 77%; /* #B3ADD9 */

    --card: 246 45% 37%;
    --card-foreground: 258 41% 97%;
    --popover: 246 45% 37%;
    --popover-foreground: 258 41% 97%;

    --border: 246 40% 40%; /* #453D8F */
    --input: 246 40% 40%;
    --ring: 245 60% 67%;

    --accent: 15 68% 52%; /* same coral, both modes per spec */
    --accent-foreground: 0 0% 100%;
    --accent-tint: 11 23% 19%; /* #3D2A26 */

    --warning: 41 74% 53%;
    --success: 151 49% 44%; /* #3AA873 */
    --destructive: 0 53% 50%; /* same value both modes — a danger signal shouldn't shift with theme */
    --destructive-foreground: 0 0% 100%;

    --status-submitted: 248 37% 77%;
    --status-review: 245 60% 67%;
    --status-progress: 246 45% 37%;
    --status-resolved: 151 49% 44%;
}
```

- [ ] **Step 4: Update the `@theme inline` font declaration**

In the `@theme inline { ... }` block, change:
```css
--font-sans: "Poppins", "Inter", "Montserrat", sans-serif;
```
to:
```css
--font-sans: "Space Grotesk", "Inter", sans-serif;
```
(Montserrat is removed — it was declared but never actually loaded via `next/font`, a pre-existing dead reference. Task 3 loads Space Grotesk properly.)

- [ ] **Step 5: Add design-token utility classes for radius/shadow/spacing**

At the end of `app/globals.css`, before the final `.animate-bounce-in` rule, add:

```css
/* Signal design-token utilities — radius/shadow/spacing as real tokens,
   for use alongside Tailwind's own utilities where a component needs the
   exact system value rather than a Tailwind scale step. */
.radius-sm {
    border-radius: var(--radius-sm);
}
.radius-md {
    border-radius: var(--radius-md);
}
.radius-lg {
    border-radius: var(--radius-lg);
}
.radius-full {
    border-radius: var(--radius-full);
}
.shadow-signal-sm {
    box-shadow: var(--shadow-sm);
}
.shadow-signal-md {
    box-shadow: var(--shadow-md);
}
.shadow-signal-lg {
    box-shadow: var(--shadow-lg);
}
```

- [ ] **Step 6: Verify the build**

```bash
npm run build
```
Expected: build succeeds. (CSS-only change — a failure here would mean a syntax error in the CSS, check the error output for the exact line.)

- [ ] **Step 7: Manual visual spot-check**

```bash
npm run dev
```
Open `http://localhost:3000` — the page should still render (unstyled-looking is fine/expected, since no component classes reference the new tokens by name yet until later tasks/phases — this step only confirms no CSS parse error broke the page).

- [ ] **Step 8: Commit**

```bash
git add app/globals.css styles/globals.css
git commit -m "Replace green palette with Signal indigo/coral design tokens (light + dark)"
```

---

## Task 3: Swap font loading to Space Grotesk / Inter

**Files:**
- Modify: `app/layout.tsx:1-19` (font imports and loading)
- Modify: `app/globals.css:121-155` (body font-family + `.font-poppins`/`.font-inter` utility classes)

**Interfaces:**
- Consumes: none new.
- Produces: `--font-space-grotesk` CSS variable (heading font) alongside the existing `--font-inter` (body font, unchanged), and `font-space-grotesk`/`font-inter` utility classes for later tasks/phases to apply to headings vs. body text.

- [ ] **Step 1: Update the font imports in `app/layout.tsx`**

Replace:
```tsx
import { Poppins, Inter } from "next/font/google"
```
with:
```tsx
import { Space_Grotesk, Inter } from "next/font/google"
```

Replace:
```tsx
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})
```
with:
```tsx
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})
```

Replace the `<body>` tag's className:
```tsx
<body className={`${poppins.variable} ${inter.variable} overflow-x-hidden font-poppins`}>
```
with:
```tsx
<body className={`${spaceGrotesk.variable} ${inter.variable} overflow-x-hidden font-inter`}>
```
(Body defaults to Inter now — headings opt into Space Grotesk explicitly via the utility class added in Step 3, matching the spec's "Space Grotesk for headings, Inter for body.")

- [ ] **Step 2: Update `app/globals.css`'s body font-family**

Replace:
```css
body {
    @apply bg-background text-foreground;
    font-family: "Poppins", "Inter", "Montserrat", sans-serif;
    transition: all ease-in-out 300ms, background 0.3s, color 0.3s;
}
```
with:
```css
body {
    @apply bg-background text-foreground;
    font-family: "Inter", sans-serif;
    transition: all ease-in-out 300ms, background 0.3s, color 0.3s;
}
```

- [ ] **Step 3: Replace the `.font-poppins`/`.font-inter` utility classes**

Replace:
```css
/* Custom Font Classes */
.font-poppins {
    font-family: "Poppins", sans-serif;
}

.font-inter {
    font-family: "Inter", sans-serif;
}
```
with:
```css
/* Custom Font Classes */
.font-space-grotesk {
    font-family: "Space Grotesk", sans-serif;
}

.font-inter {
    font-family: "Inter", sans-serif;
}
```

- [ ] **Step 4: Verify the build**

```bash
npm run build
```
Expected: succeeds — `next/font/google` fetches Space Grotesk at build time the same way it already fetches Poppins/Inter, no new config needed.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "Swap heading font from Poppins to Space Grotesk"
```

---

## Task 4: Mount the theme provider and build a toggle component

**Files:**
- Modify: `app/layout.tsx` (mount `ThemeProvider`)
- Create: `components/theme-toggle.tsx`

**Interfaces:**
- Consumes: `ThemeProvider` from `components/theme-provider.tsx` (already exists, already wraps `next-themes`, unchanged).
- Produces: a default-exported `ThemeToggle` component (no props) that Task 5 imports into both nav bars — renders a button that calls `next-themes`'s `useTheme().setTheme()` to flip between `"light"` and `"dark"`.

- [ ] **Step 1: Mount `ThemeProvider` in `app/layout.tsx`**

Add the import:
```tsx
import { ThemeProvider } from "@/components/theme-provider"
```

Wrap the existing `<body>` contents in it — replace:
```tsx
<body className={`${spaceGrotesk.variable} ${inter.variable} overflow-x-hidden font-inter`}>
  <AuthProvider>
    {children}
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
    {/* Global sticky voice widget (renders once, bottom-right) */}
    {vapiApiKey && vapiAssistantId ? <VapiWidget apiKey={vapiApiKey} assistantId={vapiAssistantId} /> : null}
  </AuthProvider>

  {/* Razorpay Checkout Script */}
  <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
</body>
```
with:
```tsx
<body className={`${spaceGrotesk.variable} ${inter.variable} overflow-x-hidden font-inter`}>
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <AuthProvider>
      {children}
      <ToastProvider>
        <ToastViewport />
      </ToastProvider>
      {/* Global sticky voice widget (renders once, bottom-right) */}
      {vapiApiKey && vapiAssistantId ? <VapiWidget apiKey={vapiApiKey} assistantId={vapiAssistantId} /> : null}
    </AuthProvider>
  </ThemeProvider>

  {/* Razorpay Checkout Script */}
  <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
</body>
```
(`attribute="class"` matches the codebase's existing `.dark` class-selector convention in `app/globals.css` — `next-themes` toggles the `dark` class on `<html>`. `defaultTheme="light"` + `enableSystem={false}` means the app opens in light mode by default rather than following the OS preference, avoiding a surprise all-dark first render — reasonable since dark mode is a brand-new, opt-in feature today.)

- [ ] **Step 2: Create `components/theme-toggle.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // next-themes reads localStorage on mount; rendering the real icon
    // before that resolves would mismatch server/client HTML.
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-9 w-9" aria-hidden="true" />;
    }

    const isDark = theme === "dark";

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
        >
            {isDark ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
        </Button>
    );
}
```

- [ ] **Step 3: Verify the build**

```bash
npm run build
```
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/theme-toggle.tsx
git commit -m "Mount ThemeProvider and add a ThemeToggle component"
```

---

## Task 5: Add the theme toggle to both nav bars

**Files:**
- Modify: `components/citizen-nav.tsx` (desktop bar + mobile `Sheet`)
- Modify: `components/admin-nav.tsx` (desktop bar + mobile `Sheet`)

**Interfaces:**
- Consumes: `ThemeToggle` from `@/components/theme-toggle` (Task 4).

- [ ] **Step 1: Add the toggle to `citizen-nav.tsx`'s desktop bar**

Add the import at the top:
```tsx
import ThemeToggle from "@/components/theme-toggle";
```

In the "Desktop User Actions" section, find:
```tsx
                        {/* Desktop User Actions */}
                        <div className="hidden lg:flex lg:items-center lg:space-x-2">
```
and right after that opening `<div>`, before the `{/* Additional Desktop Buttons */}` comment, add:
```tsx
                            <ThemeToggle />
```

- [ ] **Step 2: Add the toggle to `citizen-nav.tsx`'s mobile Sheet**

In the Sheet's "User Profile Section" (the `<div className="border-t pt-4 space-y-3">` block near the end), right before the "Logout" `<Button>`, add:
```tsx
                                            <div className="flex items-center justify-between px-2 py-2">
                                                <span className="text-sm text-muted-foreground">
                                                    Theme
                                                </span>
                                                <ThemeToggle />
                                            </div>
```

- [ ] **Step 3: Add the toggle to `admin-nav.tsx`'s desktop bar**

Add the import:
```tsx
import ThemeToggle from "@/components/theme-toggle";
```

In "Desktop User Actions", find:
```tsx
                        {/* Desktop User Actions */}
                        <div className="hidden lg:flex lg:items-center lg:space-x-2 flex-shrink-0">
```
and right after it, before the Profile `<Button>`, add:
```tsx
                            <ThemeToggle />
```

- [ ] **Step 4: Add the toggle to `admin-nav.tsx`'s mobile Sheet (both the tablet and phone Sheets)**

`admin-nav.tsx` has two separate `Sheet`s (tablet `md`-to-`lg`, and phone below-`md`) — both share the same "User Profile Section" structure. In each, right before the "Logout" `<Button>` in the `<div className="border-t pt-4 space-y-3">` block, add:
```tsx
                                            <div className="flex items-center justify-between px-2 py-2">
                                                <span className="text-sm text-muted-foreground">
                                                    Theme
                                                </span>
                                                <ThemeToggle />
                                            </div>
```
(There are two such blocks in this file — one per Sheet — add it to both.)

- [ ] **Step 5: Verify the build**

```bash
npm run build
```
Expected: succeeds.

- [ ] **Step 6: Manual verification**

```bash
npm run dev
```
Sign in as any user, open the citizen (or admin) nav — desktop: a sun/moon icon button should appear; clicking it toggles the page between light and dark backgrounds (the Signal indigo dark background from Task 2 should be visible). Mobile: open the hamburger Sheet, confirm the "Theme" row with the same toggle appears above Logout.

- [ ] **Step 7: Commit**

```bash
git add components/citizen-nav.tsx components/admin-nav.tsx
git commit -m "Add dark-mode toggle to citizen and admin nav bars"
```

---

## Task 6: Redesign the landing page (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx` (full file — color/token updates throughout, GSAP scroll animations added)

**Interfaces:**
- Consumes: Signal tokens from Task 2 (`--primary`, `--accent`, `--secondary`, etc.), `gsap`/`ScrollTrigger` from Task 1.
- No new interfaces produced — this is a leaf page.

Every `<Link>` target, button label, and section stays exactly as today (per Global Constraints) — only classNames (color/token references) and the addition of GSAP-driven reveal animations change.

- [ ] **Step 1: Replace hardcoded brand-green hex with Signal token classes**

Throughout `app/page.tsx`, every literal `#2E6A56`/`#1f4a3a` hex reference and every `bg-gradient-to-br from-[#2E6A56]/... to-emerald-400/...`-style decorative gradient gets replaced with token-based Tailwind classes. Concretely:
- `text-[#2E6A56]` → `text-primary`
- `bg-[#2E6A56]` → `bg-primary`
- `hover:bg-[#1f4a3a]` → `hover:bg-[var(--primary-hover)]`
- `hover:text-[#1f4a3a]` → `hover:text-[var(--primary-hover)]`
- The nav logo icon background `bg-[#2E6A56]` → `bg-primary`
- The three decorative blurred blob divs (`from-[#2E6A56]/8 to-emerald-400/8`, etc.) → replace each with `from-primary/8 to-accent/8` variants, keeping the same opacity values, so the ambient background reads as Signal indigo-with-a-hint-of-coral instead of green.
- The hero "Get Started Free" primary CTA (`bg-[#2E6A56] hover:bg-[#1f4a3a]`) → `bg-accent hover:brightness-90` (this is the one CTA-worthy coral use on the page, per spec).
- The "Sign In"/"Admin Portal" secondary links (`text-[#2E6A56] hover:text-[#1f4a3a]`) → `text-primary hover:text-[var(--primary-hover)]`.
- Feature-card icon backgrounds (`from-[#2E6A56]/10 to-emerald-100`) → `from-primary/10 to-primary/20`.
- CTA-band section background (`from-[#2E6A56] to-emerald-700`) → `from-primary to-secondary`.
- Footer logo icon (`bg-[#2E6A56]`) → `bg-primary`.

- [ ] **Step 2: Add the GSAP scroll-reveal setup**

Add imports at the top of `app/page.tsx`:
```tsx
"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
```
(This file currently has no `"use client"` directive since it's a server component with only `<Link>` interactivity — GSAP requires client-side execution, so this converts it to a client component. This doesn't change behavior since nothing in the file does server-only work.)

Register the plugin and add refs inside the `HomePage` function, before the `return`:
```tsx
    gsap.registerPlugin(ScrollTrigger)

    const heroRef = useRef<HTMLDivElement>(null)
    const statsRef = useRef<HTMLDivElement>(null)
    const featuresRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const mm = gsap.matchMedia()

        mm.add(
            {
                reduceMotion: "(prefers-reduced-motion: reduce)",
                noPreference: "(prefers-reduced-motion: no-preference)",
            },
            (context) => {
                const { reduceMotion } = context.conditions as {
                    reduceMotion: boolean
                }

                if (reduceMotion) {
                    // Reduced motion: content is already visible in the DOM
                    // (no opacity-0 initial state is set below), so there is
                    // nothing further to do here.
                    return
                }

                if (heroRef.current) {
                    gsap.from(heroRef.current.children, {
                        opacity: 0,
                        y: 24,
                        duration: 0.7,
                        stagger: 0.12,
                        ease: "power2.out",
                    })
                }

                if (statsRef.current) {
                    gsap.from(statsRef.current.querySelectorAll(".stat-item"), {
                        opacity: 0,
                        y: 16,
                        duration: 0.5,
                        stagger: 0.1,
                        scrollTrigger: {
                            trigger: statsRef.current,
                            start: "top 85%",
                        },
                    })
                }

                if (featuresRef.current) {
                    gsap.from(
                        featuresRef.current.querySelectorAll(".feature-item"),
                        {
                            opacity: 0,
                            y: 24,
                            duration: 0.6,
                            stagger: 0.1,
                            scrollTrigger: {
                                trigger: featuresRef.current,
                                start: "top 80%",
                            },
                        }
                    )
                }
            }
        )

        return () => mm.revert()
    }, [])
```
(`gsap.matchMedia()` is the mechanism the spec's Global Constraints calls for — the `reduceMotion` branch returns early and does nothing, leaving content at its default visible opacity, satisfying `prefers-reduced-motion` without a second code path to maintain.)

- [ ] **Step 3: Wire the refs and marker classes onto the existing JSX**

- The hero content `<div className="text-center space-y-8 max-w-4xl mx-auto">` (containing the badge, `<h1>`, `<p>`, and CTA row) gets `ref={heroRef}` added.
- The stats section's `<div className="grid grid-cols-2 lg:grid-cols-4 gap-8">` gets `ref={statsRef}`, and each individual stat `<div key={index} className="text-center group ...">` inside the `.map()` gets `stat-item` appended to its `className`.
- The features grid `<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">` gets `ref={featuresRef}`, and each feature `<div key={index} className="bg-white border ...">` inside its `.map()` gets `feature-item` appended to its `className`.

No other structural changes — every existing class, prop, and child stays.

- [ ] **Step 4: Verify the build**

```bash
npm run build
```
Expected: succeeds. (Adding `"use client"` to a page that only renders `<Link>`s and now GSAP hooks is safe — no server-only APIs were in use.)

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```
Load `/` — hero content should fade/rise in on load, stats and features should fade/rise in as you scroll them into view. Toggle OS-level "reduce motion" (or use browser devtools' `prefers-reduced-motion` emulation) and reload — content should appear immediately with no animation.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "Redesign landing page with Signal tokens and GSAP scroll reveals"
```

---

## Task 7: Redesign the auth pages (`app/auth/page.tsx` + `app/citizen/signup/page.tsx`)

**Files:**
- Modify: `app/auth/page.tsx` (full file)
- Modify: `app/citizen/signup/page.tsx` (full file — same treatment, applied twice since both implementations exist independently per the spec's decision to redesign duplicates too)

**Interfaces:**
- Consumes: Signal tokens (Task 2), `framer-motion`'s `motion`/`AnimatePresence` (Task 1).

Both files share near-identical structure (confirmed in the audit) — apply the same set of changes to each.

- [ ] **Step 1: Add Framer Motion imports**

At the top of both files, add:
```tsx
import { motion, AnimatePresence } from "framer-motion"
```

- [ ] **Step 2: Animate the error banner**

In both files, find the inline error block:
```tsx
{error && (
    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
        {error}
    </div>
)}
```
Replace with a Signal-token-colored, animated version:
```tsx
<AnimatePresence>
    {error && (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3 text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.08)] border border-[hsl(var(--destructive)/0.3)] rounded-md overflow-hidden"
        >
            {error}
        </motion.div>
    )}
</AnimatePresence>
```

- [ ] **Step 3: Cross-fade the sign-in/sign-up mode content instead of an instant swap**

In both files, the `authMode === "signup"` conditional blocks (role select, department select, full-name field, confirm-password field) currently mount/unmount instantly via `{authMode === "signup" && (...)}`. Wrap each such conditional block in `<AnimatePresence mode="wait">` + `<motion.div>` with a `key` tied to `authMode` so React (and Framer Motion) treats each mode's fields as a distinct animated block:

For example, the role-selection block in `app/auth/page.tsx` changes from:
```tsx
{authMode === "signup" && (
  <div className="space-y-2">
    <Label htmlFor="role">Select Your Role</Label>
    ...
  </div>
)}
```
to:
```tsx
<AnimatePresence mode="wait">
  {authMode === "signup" && (
    <motion.div
      key="role-select"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-2 overflow-hidden"
    >
      <Label htmlFor="role">Select Your Role</Label>
      ...
    </motion.div>
  )}
</AnimatePresence>
```
Apply the same wrapping pattern to every other `authMode === "signup" && (...)` block in both files (department select(s), full name field, confirm password field). The content inside each block is untouched — only the wrapping element and its animation props change.

- [ ] **Step 4: Animate the Sign In / Sign Up segmented toggle's active state**

In both files, the toggle buttons currently switch `variant={authMode === "signin" ? "default" : "ghost"}` instantly. Wrap the two-button toggle row in a `motion.div` container and add a `layout` prop to each `Button` so Framer Motion animates the active-state background transition:

Change:
```tsx
<div className="flex bg-muted rounded-lg p-1">
    <Button
        variant={authMode === "signin" ? "default" : "ghost"}
        size="sm"
        className="flex-1 text-white"
        onClick={() => setAuthMode("signin")}
    >
```
to:
```tsx
<motion.div layout className="flex bg-muted rounded-lg p-1">
    <Button
        variant={authMode === "signin" ? "default" : "ghost"}
        size="sm"
        className="flex-1 text-white transition-colors duration-200"
        onClick={() => setAuthMode("signin")}
    >
```
(and the matching closing `</div>` → `</motion.div>`; the same `transition-colors duration-200` class addition applies to the "Sign Up" button next to it). This keeps the change minimal — a CSS color transition on the existing variant swap, wrapped in a motion container for consistency with the rest of the page's animated elements, rather than introducing shared-layout-animation complexity for a two-button toggle.

- [ ] **Step 5: Add press feedback to the primary submit and Google buttons**

In both files, add `whileTap={{ scale: 0.98 }}` behavior to the submit button and the "Continue with Google" button. Since these are shadcn `Button` components (not raw `motion.button`), wrap each in a `motion.div`:

Change:
```tsx
<Button
    type="submit"
    className="w-full bg-primary hover:bg-[#1f4a3a] text-primary-foreground"
    disabled={isLoading}
>
```
to:
```tsx
<motion.div whileTap={{ scale: 0.98 }}>
    <Button
        type="submit"
        className="w-full bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground"
        disabled={isLoading}
    >
```
(closing the `motion.div` after the existing `</Button>`), and the same `motion.div whileTap` wrap for the "Continue with Google" `<Button variant="outline" ...>`. This also replaces the remaining hardcoded `#1f4a3a` hex with the `--primary-hover` token from Task 2.

- [ ] **Step 6: Replace remaining hardcoded colors with Signal tokens**

In both files: the password-show/hide toggle buttons, the "Back to Home" ghost button, and any other `text-primary`/`bg-primary` usage already correctly reference the Tailwind semantic classes (which now resolve to Signal indigo via Task 2's token swap) — no change needed there. Confirm via a search of both files for literal `#2E6A56`/`#1f4a3a`/`#3399cc`-style hex strings and replace any found with the equivalent `primary`/`primary-hover` token class, matching the pattern from Step 5.

- [ ] **Step 7: Verify the build**

```bash
npm run build
```
Expected: succeeds.

- [ ] **Step 8: Manual verification**

```bash
npm run dev
```
Visit `/auth` and `/citizen/signup` — confirm: toggling Sign In/Sign Up cross-fades the role/department/name/confirm-password fields in and out (not an instant jump), the primary submit and Google buttons visibly depress on click, and a deliberately-wrong login attempt shows the error banner sliding in with the new destructive-red styling (not the old raw `red-600`/`red-50` Tailwind defaults). Toggle dark mode (Task 5's toggle) on this page and confirm the card/background/text colors switch to the Signal dark-mode values from Task 2.

- [ ] **Step 9: Commit**

```bash
git add app/auth/page.tsx app/citizen/signup/page.tsx
git commit -m "Redesign auth pages with Signal tokens and Framer Motion transitions"
```

---

## Self-review notes

- **Spec coverage:** Task 1 covers spec §5 (stack). Task 2 covers §2's full token table (light+dark) plus §1's "consolidate away styles/globals.css" finding and §6's resolved destructive-token decision. Task 3 covers §2's typography line. Tasks 4–5 cover §2's dark-mode-toggle decision. Task 6 covers §4's "Landing" entry (including its GSAP requirement from §3). Task 7 covers §4's "Auth" entry (including both `/auth` and its `citizen/signup` duplicate, per the scope decision to redesign orphaned/duplicate pages too).
- **Placeholder scan:** no TBD/TODO; every code step contains real, complete code or an exact find/replace instruction against real current file content (verified by reading each file in full before writing this plan).
- **Type consistency:** CSS variable names are used identically across Tasks 2, 4 (theme toggle relies on the `.dark` class Task 2's selector already targets), 6, and 7 (Tailwind semantic classes `bg-primary`/`text-primary`/etc. resolve through the same `@theme inline` mapping Task 2 preserves unchanged).
- **Out of scope, confirmed against spec's Non-goals:** no functional/route/data changes were introduced in any task; the dead components/files noted in the spec's audit (other than the two explicitly listed for deletion: `styles/globals.css` in Task 2 dead-file cleanup, matching the spec's §1d finding) are untouched.
