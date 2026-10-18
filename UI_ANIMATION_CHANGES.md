# Premium UI Animation Updates

This document describes the subtle, premium, responsive UI animation updates introduced across the Academic Venture Pipeline (AVP) frontend.

## Summary of Changes

The goal was to introduce fluid, modern micro-interactions and transitions without altering application layout, business logic, endpoints, or data flow.

### 1. Fixed Top-of-Page Scroll Progress
- **File**: `app/ScrollProgress.tsx`
- **Implementation**: Utilizes `motion/react` (`useScroll`, `useSpring`, and `useReducedMotion`).
- **Behavior**: Smooth progress bar fixed to the top of the viewport tracking document scroll with physics-based spring smoothing (`stiffness: 180`, `damping: 24`). Automatically disables rendering when `prefers-reduced-motion` is active.
- **Integration**: Mounted inside RootLayout (`app/layout.tsx`) without altering existing fonts, scripts, or layout structure.

### 2. Viewport Scroll Reveals
- **File**: `app/(app)/ScrollReveals.tsx`
- **Implementation**: Uses `IntersectionObserver` to detect `.panel` and `.app-page-header` elements within `#main`.
- **Behavior**: Applies a subtle upward translate and fade entrance (`.scroll-reveal.revealed`) when elements enter viewport.
- **Accessibility & Exclusions**:
  - Automatically skipped if `prefers-reduced-motion` is requested.
  - Automatically excludes elements that are collapsed (`[hidden]`, `[inert]`), loading/busy (`aria-busy="true"`), hidden (`aria-hidden="true"`), or flagged with `no-reveal` / `data-no-reveal`.
- **Integration**: Mounted in `app/(app)/Shell.tsx` and re-observes on route/path changes.

### 3. Navigation Spring Indicator & Content Transitions
- **File**: `app/(app)/Shell.tsx`
- **Implementation**:
  - Integrated `motion.span` layout animations (`layoutId="desktop-active-indicator"` and `layoutId="mobile-active-indicator"`) with spring physics (`stiffness: 380`, `damping: 30`) behind the active navigation item in both desktop and mobile menus.
  - Main content container includes `.route-content-fade` for smooth route-to-route crossfades.
  - Preserved all routing, sidebar keyboard toggle (`[`), drawer states, authentication, and logout behaviors.

### 4. Page Header & In-Progress Spinners
- **File**: `app/(app)/ui.tsx`
- **Implementation**:
  - Added `.app-page-header` class to `PageHeader` for coordination with scroll reveal and styling.
  - Updated `ProcessingStatus`: dynamically applies `.status-spinner` whenever the status belongs to the `IN_PROGRESS` set (`UPLOADED`, `VALIDATING`, `EXTRACTING`, `ENRICHING`, `NORMALIZING`, `VALIDATING_FIELDS`). Static dot is maintained for non-spinning states.

### 5. Design Tokens & Component Micro-Interactions
- **File**: `app/globals.css`
- **Tokens Added**:
  - `--ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)`
  - `--ease-in-out`: `cubic-bezier(0.4, 0, 0.2, 1)`
  - `--ease-spring`: `cubic-bezier(0.2, 0.8, 0.2, 1)`
  - `--ease-subtle`: `cubic-bezier(0.2, 0, 0, 1)`
  - `--duration-fast`: `150ms`, `--duration-base`: `220ms`, `--duration-smooth`: `350ms`
- **Enhancements**:
  - Buttons: tactile click scale (`scale(0.975)`) and smooth glow/border transitions.
  - Inputs & Chips: border and background smoothing with gentle hover lifts.
  - Table Rows: soft background hover transitions.
  - `.panel-interactive`: subtle elevation lift (`translateY(-2px)`) and diffused shadow for interactive cards.
  - `.brand-link-motion` & `.brand-mark-motion`: gentle rotation (`-6deg`) and subtle scale on brand mark hover.
  - `.status-spinner`: spinning ring for active in-progress processing.
  - `.scroll-reveal`: smooth fade-in and slide-up with `will-change: opacity, transform`.
  - Accessible `prefers-reduced-motion: reduce`: instantly disables transitions, cancels infinite animations, and forces full visibility for scroll reveals.

### 6. Brand Component Hooks
- **File**: `app/_brand/Logo.tsx`
- **Implementation**: Added `brand-mark-motion` to `Mark` and `brand-link-motion` to `BrandLink` without altering image paths, dimensions, layout, or accessibility.

### 7. Senior Review Queue Interactive Cards
- **File**: `app/(app)/senior/page.tsx`
- **Implementation**: Added `.panel-interactive` class to the review queue card link items, giving them the elevation lift on hover while preserving URLs and query parameters (`?tab=dossier`).

---

## Validation & Verification

1. **Linter**:
   - Command: `npx eslint`
   - Result: 0 errors, 3 pre-existing warnings in untouched auth redirect code.
2. **Production Build**:
   - Command: `npm run build`
   - Result: Next.js 16.3.7 (Turbopack) compiled successfully; TypeScript verified without type errors; static and dynamic pages generated.
3. **Pnpm Notice**:
   - Note: Standalone global `pnpm` binary was not present in the Windows PATH (`CommandNotFoundException`), but scripts were verified via standard Node/npm/npx tooling.
