# Citizen UI Improvements Applied

## Changes Made:

### 1. Global CSS Updates

-   Changed background color from `#efefef` to `#f3f4f6` (gray-50) for better contrast
-   Updated foreground text from `#4a4a4a` to `#1f2937` (gray-800) for better readability
-   Added softer borders (#e5e7eb instead of #d1d5db)
-   Increased border-radius to 0.75rem for modern look
-   Added utility classes for card-modern and content-container styles
-   Implemented shadow-based design instead of heavy borders

### 2. Design Philosophy

-   **Background**: Light gray (#f3f4f6) for page backgrounds
-   **Cards**: Pure white (#ffffff) with shadows instead of borders
-   **Text**: Dark gray (#1f2937) for high contrast
-   **Shadows**: Layered shadows for depth (sm → md → lg on hover)
-   **Borders**: Minimal or none, relying on shadows for separation
-   **Radius**: Rounded corners (0.75rem) for modern feel

### 3. Component Updates Needed

#### Dashboard (app/citizen/dashboard/page.tsx)

-   Change: `bg-background` → `bg-gray-50`
-   Change: `bg-card` → `bg-white shadow-sm`
-   Change: `text-muted-foreground` → `text-gray-600`
-   Cards: Add `shadow-md hover:shadow-lg border-0`
-   Stats cards: Use specific colors (blue for progress, green for resolved)

#### Profile Page (app/citizen/profile/page.tsx)

-   Add white card backgrounds with shadows
-   Improve stat cards with colored icons
-   Better form field contrast

#### Issues Page (app/citizen/issues/page.tsx)

-   White card backgrounds
-   Shadow-based separation
-   Better status badges with solid colors

#### Report Page (app/citizen/report/page.tsx)

-   Form fields with better backgrounds
-   Clear section separation with shadows
-   Improved button contrast

### 4. Color Palette

**Backgrounds:**

-   Page: `bg-gray-50` (#f3f4f6)
-   Card: `bg-white` (#ffffff)
-   Muted: `bg-gray-100` (#f3f4f6)

**Text:**

-   Primary: `text-gray-900` (#111827)
-   Secondary: `text-gray-600` (#4b5563)
-   Muted: `text-gray-500` (#6b7280)

**Borders:**

-   Minimal use, prefer shadows
-   When needed: `border-gray-200` (#e5e7eb)

**Shadows:**

-   Small: `shadow-sm`
-   Medium: `shadow-md`
-   Large: `shadow-lg`
-   Hover: Transition from md to lg

### 5. Status Colors (Keep Semantic)

-   Submitted: Blue (#3b82f6)
-   In Review: Yellow (#eab308)
-   In Progress: Orange (#f97316)
-   Resolved: Green (#22c55e)

## Implementation Notes:

-   All changes maintain accessibility (WCAG AA contrast ratios)
-   Mobile-first responsive design preserved
-   Smooth transitions on interactive elements
-   Shadow depths create visual hierarchy
-   Consistent spacing using Tailwind scale
