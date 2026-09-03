# Final-web UI/UX Design System Specification

> **Status:** Provisional Baseline (Phase 2 Design Gate)<br>
> **Authority:** Subordinate to repository governance and rubric; source of truth for UI/UX implementation.<br>
> **Future Adaptability:** This is a provisional design system and may be refined when user-selected visual references are provided. Refinement must preserve interaction semantics and component APIs where possible.

---

## 1. Product Context & UX Principles

### Product Identity
**Collaborative Intelligent Note Management Web Application** (`Final-web`) is a high-performance productivity tool designed for personal note-taking, fast organization, multi-user collaboration, and note-grounded AI knowledge work.

### Core UX Principles
1. **Content-First & Low Noise:** The user's notes and ideas take precedence over decorative UI chrome. Chrome is quiet, precise, and unobtrusive.
2. **Speed & Predictability:** Interactions respond instantly. State changes (saving, syncing, erroring) are immediately perceptible through subtle indicators, never blocking thought.
3. **Calm Productivity:** Avoid aggressive high-saturation palettes, distracting gradients, or unmotivated animation. Use whitespace and typography to establish hierarchy.
4. **Progressive Disclosure:** Secondary actions (metadata, version history, export options) remain tucked away until requested, keeping the primary workspace uncluttered.
5. **Accessible by Default:** Keyboard-driven workflows, strict WCAG 2.2 AA contrast, screen-reader announcements, and visible focus boundaries are intrinsic to every component.

### Design Dial Settings
- **Variance:** `4 / 10` (Balanced, clean, disciplined structure; avoiding chaotic novelty or rigid corporate stagnation)
- **Motion:** `3 / 10` (Subtle micro-interactions, 150–200ms transitions; purely functional state changes; strict respect for `prefers-reduced-motion`)
- **Density:** `6 / 10` (Standard productivity density; compact enough for list/card views, comfortable for extended writing)

---

## 2. Visual Direction: "Calm Collaborative Workspace"

### Aesthetic Influences
- **Linear:** Precision typography, subtle 1px border hierarchy, keyboard ergonomics, restrained contrast tiers.
- **Notion:** Document focus, distraction-free writing surface, fluid layout flexibility.
- **Google Keep:** Color-accent metadata, rapid card scanning, clear informational hierarchy.

### What We Avoid (Anti-Patterns)
- ❌ Generic AI purple/pink neon gradients.
- ❌ Heavy glassmorphism or muddy backdrop blurs that compromise contrast.
- ❌ Deep floating drop-shadows with blurred silhouettes.
- ❌ Emoji characters as functional interface icons.
- ❌ Hover-only interactions that fail on touch devices or for keyboard navigation.
- ❌ Low-contrast light-gray body text (`#94A3B8` on white is strictly prohibited for readable text).
- ❌ Wrapping every trivial piece of metadata in heavy bordered cards.

---

## 3. Semantic Color System

Colors are defined by **semantic role**, enabling seamless light/dark mode adaptation without altering layout contracts.

### Light Mode (`:root` / default)

| Semantic Role | Hex Value | Tailwind Class Mapping | Intended Usage |
| :--- | :--- | :--- | :--- |
| **`bg-canvas`** | `#F8FAFC` (Slate 50) | `bg-slate-50` | Full page viewport background |
| **`bg-surface`** | `#FFFFFF` (White) | `bg-white` | Cards, modals, sidebars, active workspaces |
| **`bg-surface-muted`** | `#F1F5F9` (Slate 100) | `bg-slate-100` | Table headers, secondary toolbars, disabled inputs |
| **`text-primary`** | `#0F172A` (Slate 900) | `text-slate-900` | Headings, primary body text (contrast > 14:1) |
| **`text-secondary`** | `#475569` (Slate 600) | `text-slate-600` | Subtitles, labels, timestamps (contrast > 5.5:1) |
| **`text-muted`** | `#64748B` (Slate 500) | `text-slate-500` | Placeholder text, auxiliary metadata (contrast > 4.5:1) |
| **`border-subtle`** | `#E2E8F0` (Slate 200) | `border-slate-200` | Component dividers, input outlines, table borders |
| **`border-emphasis`** | `#CBD5E1` (Slate 300) | `border-slate-300` | Hovered cards, selected tabs, focused container borders |
| **`accent`** | `#2563EB` (Blue 600) | `bg-blue-600` / `text-blue-600` | Primary buttons, active tab indicators, links |
| **`accent-hover`** | `#1D4ED8` (Blue 700) | `bg-blue-700` | Hover state for primary buttons |
| **`accent-subtle`** | `#EFF6FF` (Blue 50) | `bg-blue-50` | Active row highlight, badge background |
| **`success`** | `#16A34A` (Green 600) | `text-green-600` / `bg-green-600` | Saved state, connected indicator, success banners |
| **`warning`** | `#D97706` (Amber 600) | `text-amber-600` / `bg-amber-600` | Pending verification, offline draft warning |
| **`danger`** | `#DC2626` (Red 600) | `text-red-600` / `bg-red-600` | Validation errors, deletion actions, auth failure |
| **`focus-ring`** | `#3B82F6` (Blue 500) | `ring-blue-500` | Keyboard focus indicator outline |

### Dark Mode (`.dark`)

| Semantic Role | Hex Value | Tailwind Class Mapping | Intended Usage |
| :--- | :--- | :--- | :--- |
| **`bg-canvas`** | `#090D16` (Near Black) | `dark:bg-[#090D16]` | Base viewport background |
| **`bg-surface`** | `#131B2E` (Deep Navy) | `dark:bg-slate-900` | Main application cards and content surfaces |
| **`bg-surface-muted`** | `#1E293B` (Slate 800) | `dark:bg-slate-800` | Toolbars, secondary panels, inactive tabs |
| **`text-primary`** | `#F8FAFC` (Slate 50) | `dark:text-slate-50` | Primary headings and text |
| **`text-secondary`** | `#94A3B8` (Slate 400) | `dark:text-slate-400` | Labels, supporting copy |
| **`text-muted`** | `#64748B` (Slate 500) | `dark:text-slate-500` | Muted hints, disabled text |
| **`border-subtle`** | `#1E293B` (Slate 800) | `dark:border-slate-800` | Structural dividers and cards |
| **`border-emphasis`** | `#334155` (Slate 700) | `dark:border-slate-700` | Interactive border hover states |
| **`accent`** | `#3B82F6` (Blue 500) | `dark:bg-blue-500` | Primary interactive elements |
| **`accent-hover`** | `#60A5FA` (Blue 400) | `dark:bg-blue-400` | Primary interactive hover |
| **`accent-subtle`** | `#1E293B` (Slate 800/60) | `dark:bg-blue-950/40` | Subtle active item background |
| **`focus-ring`** | `#60A5FA` (Blue 400) | `dark:ring-blue-400` | Visible focus outline in dark mode |

---

## 4. Typography Scale & Hierarchy

We employ a unified, clean sans-serif system font stack:
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Type Hierarchy Specifications

| Level | Size | Weight | Line Height | Tracking | Tailwind Classes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | 30px (`1.875rem`) | Bold (700) | 36px (`2.25rem`) | `-0.025em` | `text-2xl sm:text-3xl font-bold tracking-tight` |
| **Page Title (H1)** | 24px (`1.5rem`) | Bold (700) | 32px (`2.0rem`) | `-0.02em` | `text-xl sm:text-2xl font-bold tracking-tight` |
| **Section Head (H2)**| 18px (`1.125rem`)| SemiBold (600)| 24px (`1.5rem`) | `-0.01em` | `text-lg font-semibold tracking-tight` |
| **Subheading (H3)** | 15px (`0.9375rem`)| Medium (500) | 22px (`1.375rem`)| `0` | `text-sm sm:text-base font-medium` |
| **Body (Default)** | 14px (`0.875rem`) | Regular (400) | 20px (`1.25rem`) | `0` | `text-sm leading-relaxed` |
| **Label / Button** | 13px (`0.8125rem`)| Medium (500) | 16px (`1.0rem`) | `+0.01em` | `text-xs sm:text-sm font-medium` |
| **Small / Caption** | 12px (`0.75rem`)  | Regular (400) | 16px (`1.0rem`) | `+0.01em` | `text-xs text-slate-500` |
| **Mono / Code** | 12px (`0.75rem`)  | Regular (400) | 16px (`1.0rem`) | `0` | `font-mono text-xs` |

---

## 5. Spacing, Sizing & Layout Grid

The layout adheres to a predictable **4px / 0.25rem scale**:

| Token | Pixels | Rem | Typical Usage |
| :--- | :--- | :--- | :--- |
| `0.5` | 2px | `0.125rem` | Micro border offsets, badge gaps |
| `1` | 4px | `0.25rem` | Icon-to-text spacing, inline tag paddings |
| `1.5` | 6px | `0.375rem` | Compact button padding vertical |
| `2` | 8px | `0.5rem` | Standard input vertical padding, item gap |
| `3` | 12px | `0.75rem` | Input horizontal padding, card content padding |
| `4` | 16px | `1.0rem` | Default component spacing, form row gap |
| `6` | 24px | `1.5rem` | Section grouping, card internal padding |
| `8` | 32px | `2.0rem` | Page gutter, large section separators |
| `12` | 48px | `3.0rem` | Hero margins, major modal spacing |

### Layout Boundaries
- **Auth & Dialog Max Width:** `440px` (`max-w-md`) centered with responsive gutters.
- **Content Main Viewport:** Max `1280px` (`max-w-7xl`), centered with `px-4 sm:px-6 lg:px-8`.
- **Note Reading Width:** Optimal reading line length capped at `720px` (`max-w-prose` or `max-w-2xl`).

---

## 6. Border Radius & Shadows

### Corner Radius Hierarchy
- **`rounded-sm` (4px):** Badges, inline tags, toast messages.
- **`rounded-md` (6px):** Standard inputs, textareas, dropdown menus, button controls.
- **`rounded-lg` (8px):** Cards, list panels, modal headers.
- **`rounded-xl` (12px):** Main modal dialogs, floating panels, auth containers.
- **`rounded-full` (9999px):** User avatars, status pills, circular icon buttons.

### Elevation & Shadows
We favor **border hierarchy over heavy drop-shadows**:
- **Flat (Default):** `border border-slate-200 dark:border-slate-800` (No shadow).
- **Subtle Elevation (`shadow-sm`):** Form containers, active note cards (`0 1px 2px 0 rgb(0 0 0 / 0.05)`).
- **Overlay Elevation (`shadow-lg`):** Modals, popovers, dropdown menus (`0 10px 15px -3px rgb(0 0 0 / 0.1)`).

---

## 7. Component Interaction States

Every interactive element MUST support 8 standardized states:

1. **Default:** Stable visual baseline; clearly affords clickability via cursor or clear contrast.
2. **Hover:** Gentle contrast adjustment (`hover:bg-slate-50`, `hover:border-slate-300`) over 150ms.
3. **Focus-Visible:** Prominent, uninterrupted 2px ring with 2px offset (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`).
4. **Active (Pressed):** Subtle tactile feedback (`active:scale-[0.99]` or `active:bg-slate-200`).
5. **Disabled:** Visual de-emphasis (`opacity-50 cursor-not-allowed pointer-events-none`) while retaining readable contrast.
6. **Loading:** Disabled state coupled with an inline spinner; retains width to avoid layout shift (CLS = 0).
7. **Error / Invalid:** Bold 1px error border (`border-red-500`), paired with `aria-invalid="true"` and an adjacent text error.
8. **Success / Valid:** Subtle emerald border or badge indicator affirming completion.

---

## 8. Accessibility Requirements (WCAG 2.2 AA Compliance)

1. **Contrast Ratio:** Minimum `4.5:1` for standard text and `3:1` for essential UI borders and large headings.
2. **Accessible Authentication:**
   - Allow clipboard paste on all credential inputs (`onPaste` prevention is prohibited).
   - Integrate programmatic `autocomplete` attributes (`email`, `current-password`, `new-password`).
   - Offer password visibility toggle button with programmatic `aria-label`.
3. **Form Error Accessibility:**
   - Every input has a linked `<label htmlFor="id">`.
   - Field errors are linked via `aria-describedby="field-error-id"`.
   - When a form submission fails, programmatic focus is transferred to the top-level error summary (`role="alert"`).
4. **Keyboard Operability:**
   - Full tab-index traversal across all inputs and buttons.
   - Escape key closes modals and popovers, restoring focus to the triggering element.
5. **Touch Targets:** Minimum `44px × 44px` interactive area on mobile devices (`sm:h-10 h-11`).
6. **Motion Sensitivity:** All transitions wrapped in `@media (prefers-reduced-motion: reduce)` to disable non-essential animations.

---

## 9. Primitive Component Contract

The following 12 core primitives constitute the project's atomic building blocks (implemented in React + Tailwind CSS):

### 1. `Button`
- **Purpose:** Primary user actions, form submissions, inline dialog confirmations.
- **Variants:** `primary` (solid blue), `secondary` (subtle gray border), `ghost` (transparent text-only), `danger` (solid or outline red).
- **Sizes:** `sm` (h-8, px-2.5, text-xs), `md` (h-10, px-4, text-sm), `lg` (h-12, px-6, text-base).
- **States:** Default, hover, focus-visible, active, disabled, loading (with SVG spinner).
- **Accessibility:** Native `<button type="...">`, `aria-busy` during loading, `aria-disabled` when inactive.

### 2. `Input`
- **Purpose:** Single-line alphanumeric text and email entry.
- **Variants:** `default`, `error` (red border).
- **Accessibility:** Explicit `id`, programmatic label link, `aria-invalid`, `aria-describedby`.

### 3. `PasswordInput`
- **Purpose:** Secure password entry with optional visibility toggle.
- **Contract:** Includes embedded visibility eye icon button (`type="button"`, `aria-label="Show password"` / `aria-label="Hide password"`).

### 4. `FormField`
- **Purpose:** Composed wrapper providing vertical alignment for `Label`, control child, and `ErrorMessage`.
- **Contract:** Generates stable unique IDs linking `label` and `aria-describedby` helper/error elements.

### 5. `Alert`
- **Purpose:** High-visibility banner for critical alerts (form validation errors, success confirmations, auth warnings).
- **Variants:** `info` (blue), `success` (green), `warning` (amber), `error` (red).
- **Accessibility:** `role="alert"` or `role="status"`, includes descriptive icon + text.

### 6. `Card`
- **Purpose:** Surface container for notes, profile sections, and authentication dialogs.
- **Variants:** `flat` (border only), `elevated` (border + shadow-sm), `interactive` (hover border highlight).

### 7. `Badge`
- **Purpose:** Compact status indicator (sync state, shared tag, role indicator).
- **Variants:** `neutral` (slate), `success` (emerald), `warning` (amber), `danger` (rose), `info` (blue).

### 8. `Avatar`
- **Purpose:** User representation in top navigation, collaboration badges, and account profile settings.
- **Contract:** Supports image URL with fallback to 2-letter user initials (e.g., "KF" on slate background).

### 9. `Spinner`
- **Purpose:** Indeterminate progress indicator for asynchronous actions.
- **Contract:** Pure SVG spinner, uses `animate-spin`, includes screen-reader-only text `<span className="sr-only">Loading...</span>`.

### 10. `Skeleton`
- **Purpose:** Content placeholder mimicking text and card lines during initial fetch, preventing layout shift.
- **Contract:** Shimmering gray block (`bg-slate-200 dark:bg-slate-800 animate-pulse rounded`).

### 11. `Modal`
- **Purpose:** Focused user interaction overlay (confirmation dialogs, note protection prompt).
- **Contract:** Accessible focus trap, backdrop blur/tint, `Escape` key close, focus restore on unmount.

### 12. `Toast`
- **Purpose:** Ephemeral non-blocking notifications (e.g., "Note autosaved", "Link copied to clipboard").
- **Accessibility:** Rendered in an `aria-live="polite"` viewport container.

---

## 10. Responsive Breakpoint Matrix

The application layout explicitly adapts across 4 distinct viewport tiers:

| Breakpoint | Target Device | Layout Strategy |
| :--- | :--- | :--- |
| **`375px` (`< 640px`)** | Mobile Phone | Single-column vertical flow, full-width inputs and buttons, bottom-sheet overlays, minimum 44px touch targets. |
| **`768px` (`sm` / `md`)** | Tablet & Foldables | Compact side navigation drawer, 2-column note masonry/grid, floating action buttons. |
| **`1024px` (`lg`)** | Laptop / Desktop | Persistent collapsible sidebar, 3-column note grid, split-pane note editor/preview. |
| **`1440px` (`xl` / `2xl`)| Widescreen Monitor | Max-width content constraint (`1280px`), comfortable reading line widths, multi-panel inspector. |
