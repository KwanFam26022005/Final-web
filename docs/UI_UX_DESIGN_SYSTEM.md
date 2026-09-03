# Final-web UI/UX Design System Specification

> **Status:** Accepted & Frozen Baseline (Phase 2 M3 Acceptance)<br>
> **Authority:** Subordinate to repository governance and rubric; authoritative source of truth for UI/UX implementation.<br>
> **Approved Direction:** **Concept A — Academic Light** (`Academic Light — Living Knowledge`).

---

## 1. Product Context & Brand Identity

### Product Identity
**Collaborative Intelligent Note Management Web Application** (`Final-web`) is a high-performance productivity tool crafted for personal note-taking, fast organization, multi-user collaboration, and note-grounded AI knowledge work.

### Brand DNA Ratio
- **65% Personal Modern Productivity:** Clean, distraction-free writing surface, precision typography, instantaneous responsiveness, and low cognitive noise.
- **25% TDTU Cultural Homage:** Subtle academic inspiration drawn from university life—academic navy and blue palette, knowledge-light motif, subtle lotus-red accent, and disciplined structure.
- **10% Mascot Personality:** Original minimal geometric "Wise Cat" providing subtle intellectual warmth and context across system states.

> [!IMPORTANT]
> **Cultural Homage & Student Identity Boundary:**
> This application is an independent personal productivity platform created by students. It is **NOT** an official university website or portal. It does **NOT** use the official university logo, and makes no claim of official university sponsorship or affiliation.

### Visual Character Blend
- **70% Academic Light:** Clean, bright, calm, light-first canvas (~80% light/neutral surfaces) evoking study halls, libraries, and open notebooks.
- **20% Tech Scholar Precision:** 1px hairline border hierarchy, monospace code accents, crisp alignment, and high-contrast typography.
- **10% Scholar Cat Warmth:** Minimalist geometric Wise Cat vector mascot expressing friendly academic states without kawaii overload or emoji clutter.

### Design Dial Settings
- **Variance:** `4 / 10` (Disciplined, clean, structured; avoiding chaotic novelty or rigid enterprise stagnation)
- **Motion:** `6 / 10` (Balanced, expressive yet functional motion; staged entrances and ambient light glow; strict reduced-motion fallback)
- **Density:** `5 / 10` (Comfortable productivity density; compact enough for list scanning, generous enough for deep reading)

---

## 2. Visual Direction & Color System

The color architecture follows a disciplined **80 / 15 / 5** visual ratio:
1. **Neutral & Light Surfaces (≈ 80%):** Clean canvas (`#F8FAFC`), crisp white cards (`#FFFFFF`), and muted borders (`#E2E8F0`).
2. **Academic Navy & Blue (≈ 15%):** Deep academic navy (`#1E3A8A`), primary action blue (`#2563EB`), and focus highlights (`#3B82F6`).
3. **Lotus-Pink / Crimson Accent (≈ 5%):** Subtle warm accent (`#E11D48` / `#F43F5E`) used exclusively for small details, ear accents, and highlight dots—never overpowering primary actions.

### Light Mode (`:root` / default)

| Semantic Role | Hex Value | Tailwind Class Mapping | Intended Usage |
| :--- | :--- | :--- | :--- |
| **`bg-canvas`** | `#F8FAFC` (Slate 50) | `bg-slate-50` / `bg-academic-light` | Full viewport canvas with subtle radial light |
| **`bg-surface`** | `#FFFFFF` (White) | `bg-white` | Form cards, workspace panels, headers |
| **`bg-surface-muted`** | `#F1F5F9` (Slate 100) | `bg-slate-100` | Table headers, secondary toolbars, disabled states |
| **`text-primary`** | `#0F172A` (Slate 900) | `text-slate-900` | Headings, primary body text (contrast > 14:1) |
| **`text-secondary`** | `#475569` (Slate 600) | `text-slate-600` | Subtitles, labels, timestamps (contrast > 5.5:1) |
| **`text-muted`** | `#64748B` (Slate 500) | `text-slate-500` | Placeholder text, auxiliary metadata (contrast > 4.5:1) |
| **`border-subtle`** | `#E2E8F0` (Slate 200) | `border-slate-200` | Component dividers, input outlines, table borders |
| **`border-emphasis`** | `#CBD5E1` (Slate 300) | `border-slate-300` | Hovered cards, selected tabs, focused container borders |
| **`accent`** | `#2563EB` (Blue 600) | `bg-blue-600` / `text-blue-600` | Primary buttons, active tab indicators, links |
| **`accent-hover`** | `#1D4ED8` (Blue 700) | `bg-blue-700` | Hover state for primary interactive elements |
| **`brand-navy`** | `#1E3A8A` (Blue 900) | `bg-blue-900` / `text-blue-900` | Brand badges, mortarboard, deep structural accents |
| **`lotus-accent`** | `#E11D48` (Rose 600) | `text-rose-600` / `bg-rose-600` | Subtle cultural accent dot, inner ear, highlight spark |
| **`success`** | `#16A34A` (Green 600) | `text-green-600` / `bg-green-600` | Saved state, connected indicator, success banners |
| **`warning`** | `#D97706` (Amber 600) | `text-amber-600` / `bg-amber-600` | Pending verification banner, warning alerts |
| **`danger`** | `#DC2626` (Red 600) | `text-red-600` / `bg-red-600` | Validation errors, deletion actions, auth failure |
| **`focus-ring`** | `#3B82F6` (Blue 500) | `ring-blue-500` | Keyboard focus indicator outline |

### Dark Mode (`.dark`)

| Semantic Role | Hex Value | Tailwind Class Mapping | Intended Usage |
| :--- | :--- | :--- | :--- |
| **`bg-canvas`** | `#090D16` (Near Black) | `dark:bg-[#090D16]` | Base viewport background |
| **`bg-surface`** | `#111827` (Gray 900) | `dark:bg-slate-900` | Main application cards and content surfaces |
| **`bg-surface-muted`** | `#1E293B` (Slate 800) | `dark:bg-slate-800` | Toolbars, secondary panels, inactive tabs |
| **`text-primary`** | `#F8FAFC` (Slate 50) | `dark:text-slate-50` | Primary headings and text |
| **`text-secondary`** | `#94A3B8` (Slate 400) | `dark:text-slate-400` | Labels, supporting copy |
| **`text-muted`** | `#64748B` (Slate 500) | `dark:text-slate-500` | Muted hints, disabled text |
| **`border-subtle`** | `#1E293B` (Slate 800) | `dark:border-slate-800` | Structural dividers and cards |
| **`border-emphasis`** | `#334155` (Slate 700) | `dark:border-slate-700` | Interactive border hover states |
| **`accent`** | `#3B82F6` (Blue 500) | `dark:bg-blue-500` | Primary interactive elements |
| **`accent-hover`** | `#60A5FA` (Blue 400) | `dark:bg-blue-400` | Primary interactive hover |
| **`lotus-accent`** | `#F43F5E` (Rose 500) | `dark:text-rose-400` | Dark mode lotus accent highlight |
| **`focus-ring`** | `#60A5FA` (Blue 400) | `dark:ring-blue-400` | Visible focus outline in dark mode |

---

## 3. Motion Architecture (`MOTION_INTENSITY = 6 / 10`)

Motion is structured into **4 distinct layers**, ensuring smooth, GPU-accelerated execution without cognitive fatigue or performance degradation:

### The 4 Motion Layers
1. **Layer 1: Ambient Motion (Macro):**
   - Soft, slow radial illumination pulses (`12s` ease-in-out).
   - Subtle vertical breathing on mascot (`6s` ease-in-out).
   - Never blocks interaction, automatically disabled under reduced-motion.
2. **Layer 2: Page & Surface Transitions (Meso):**
   - Staged entrance sequence on navigation:
     `Background / Ambient Light -> Brand & Headline -> Mascot -> Form Card`.
   - Stagger intervals: `60ms` increments (`stagger-1`, `stagger-2`, `stagger-3`).
   - Duration: `220ms` (`--duration-standard`).
3. **Layer 3: Component Interactions (Micro):**
   - Active button press: tactile scale `active:scale-[0.99]` over `100ms` (`--duration-instant`).
   - Focus ring appearance: `150ms` (`--duration-micro`).
   - Tab underline transition: `200ms` smooth border color/fill transition.
4. **Layer 4: State & Feedback (Reactive):**
   - Form validation shake: gentle `3px` horizontal vibration (`260ms`, 2 cycles).
   - Password visibility toggle: instant glyph transition with zero layout shift (`CLS = 0`).
   - Alert toast appearance: smooth slide-in and fade (`200ms`).

### Motion Token Registry

| Token | Duration | Timing Function | Common Usage |
| :--- | :--- | :--- | :--- |
| **`--duration-instant`** | `100ms` | `linear` | Button active scale, toggle switches |
| **`--duration-micro`** | `150ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Focus rings, hover highlights, tooltip fades |
| **`--duration-standard`** | `220ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Card entrances, modal reveals, accordion slides |
| **`--duration-emphasis`** | `350ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Celebration checks, modal backdrops |
| **`--duration-ambient`** | `12s` | `ease-in-out` | Ambient radial glow, mascot idle float |

### GPU Acceleration & Performance Guardrails
- Animating `transform` and `opacity` exclusively.
- Zero layout thrashing: no continuous animation of `width`, `height`, `top`, `left`, or `box-shadow`.
- Animations never delay navigation, network requests, or form submission.

### Mandatory Accessibility: Reduced Motion
Under `@media (prefers-reduced-motion: reduce)`:
- All ambient loops (`animate-ambient-glow`, `animate-mascot-float`) are completely halted.
- Translating keyframe entrances collapse to immediate static rendering (`opacity: 1`, `transform: none`).
- Semantic state indicators (focus rings, error messages, loading spinners) remain fully functional and visible.

---

## 4. Original Wise Cat Mascot System

The **Wise Cat** is an original vector-based academic mascot providing emotional resonance and clarity across states:

### Design Language
- Clean geometric silhouettes rendered in academic navy/slate with subtle warm lotus-pink ear accents (`#F43F5E`).
- Intellectual rounded-square spectacles with clean bridge.
- Academic mortarboard cap with golden tassel.
- Contextual state props: books, student credentials, hourglass nodes, compass/gear tools.

### Supported States

| State | Contextual Page / Flow | Visual Behavior | Accessibility Name |
| :--- | :--- | :--- | :--- |
| **`welcome`** | `/login`, `/`, Workspace Shell | Holds student ID / notebook with lotus dot; friendly gaze | "Wise Cat greeting student warmly" |
| **`reading`** | `/register`, Study flows | Eyes lowered, reading open academic notebook | "Wise Cat focused on academic reading" |
| **`loading`** | Asynchronous operations | Orbiting CS knowledge nodes / hourglass | "Wise Cat thinking and processing knowledge" |
| **`success`** | Post-action confirmations | Cheerful curved eyes with golden star sparkle | "Wise Cat celebrating successful action" |
| **`verification`**| `/forgot-password`, Email warning | Holds academic credential envelope with wax seal | "Wise Cat holding verification credential" |
| **`settings`** | `/settings/*` | Holds drafting gear / compass badge | "Wise Cat organizing system preferences" |

### Planned Future States (Post-Phase 2)
- `writing`: Pen/pencil drafting posture for Note editor.
- `search`: Magnifying glass over node graph for Global search.
- `ai`: Neural sparkle antenna for AI note synthesis.
- `offline`: Cozy asleep posture on book for Offline draft cache.

---

## 5. Screen Layout & Composed Architectures

### 1. Authentication Split Layout (`/login`, `/register`, etc.)
- **Desktop (`lg`+):** Composed two-column split layout:
  - **Left Pane (45%):** Academic Light atmospheric illumination, brand identity badge, Wise Cat mascot, product philosophy bullet points, and independent student project disclaimer.
  - **Right Pane (55%):** Centered high-contrast card (`max-w-md`) containing title, subtitle, form fields, and auxiliary navigation.
- **Mobile (`< 1024px`):** Single-column form-first layout with compact header, mini mascot, and zero horizontal scroll.

### 2. Authenticated Workspace Shell (`/`)
- Persistent top bar with brand badge, avatar with initials fallback, user display name, settings shortcut, and sign-out button.
- Warning banner for unverified accounts (`role="status"`, amber semantics).
- Hero card with student welcome greeting and `welcome` mascot state.
- Runtime Foundation Diagnostics card verifying backend API and database connectivity.
- Clearly labeled Phase 2 boundary note confirming notes and AI modules are scheduled for subsequent milestones.

### 3. Account Settings Workspace (`/settings/*`)
- Persistent sub-navigation tabs: **Profile**, **Security**, **Preferences**.
- Mascot in `settings` state.
- Profile tab: Avatar upload with hover/focus affordance, live preview, removal button, display name and email editing.
- Security tab: Current password verification, new password with confirmation, and password visibility toggles.
- Preferences tab: Theme selector (System, Light, Dark) with immediate local toggle and default note view mode (Grid, List).

---

## 6. Accessibility & Compliance Verification

- **WCAG 2.2 AA Compliance:** High contrast text (> 4.5:1), visible 2px focus rings (`ring-2 ring-blue-500 ring-offset-2`), programmatic label associations (`for`/`id`), and `aria-describedby` error bindings.
- **Accessible Authentication:** Native clipboard paste allowed, standard autocomplete attributes (`email`, `current-password`, `new-password`), zero cognitive-test barriers.
- **Screen Reader Support:** Live status regions (`aria-live="polite"`), `role="status"` on verification alerts, descriptive `aria-label` on mascot states.
