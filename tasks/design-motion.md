# GeekVault Motion & Animation Language

## Animation Principles

1. **Purposeful over decorative** — Every animation communicates something: a state change, spatial relationship, or feedback signal. If removing the animation loses no information, remove it.
2. **Fast by default** — UI animations should feel instant and responsive. Longer durations are reserved for deliberate, high-importance transitions (page changes, modal entrances). Users should never wait for an animation to finish before they can act.
3. **Physics-based feel** — Prefer spring-based easing for interactive elements (drag, press, resize). Use cubic-bezier curves for non-interactive transitions (page enter/exit, fade). Springs feel alive; curves feel polished.
4. **Consistent directionality** — Elements enter from below/right (content flowing in) and exit upward/left (content flowing out). Modals/sheets enter from their origin edge. This creates a spatial model users internalize.
5. **Warm and grounded** — Matching the Warm Obsidian identity, motion should feel weighty and grounded — no floaty, drifty animations. Elements have mass. They settle into place rather than bouncing endlessly.

---

## Duration Tokens

| Token | Value | Use Case |
|---|---|---|
| `--duration-instant` | `50ms` | Hover color changes, focus ring appearance, checkbox toggles |
| `--duration-fast` | `150ms` | Button press feedback, tooltip appear, dropdown open, icon transitions |
| `--duration-normal` | `250ms` | Page transitions, card entrance, modal/sheet entrance, fade-in content |
| `--duration-slow` | `400ms` | Complex layout shifts, stagger container completion, skeleton pulse cycle |
| `--duration-deliberate` | `600ms` | Onboarding sequences, first-load hero animations, celebration effects |

### CSS Custom Properties

```css
:root {
  --duration-instant: 50ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-deliberate: 600ms;
}
```

---

## Easing Curves

### CSS Cubic-Bezier Curves

| Token | Value | Use Case |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` | General-purpose: color transitions, opacity fades, most UI changes |
| `--ease-enter` | `cubic-bezier(0.0, 0.0, 0.2, 1.0)` | Elements entering the viewport — starts fast, decelerates into place |
| `--ease-exit` | `cubic-bezier(0.4, 0.0, 1.0, 1.0)` | Elements leaving the viewport — starts slow, accelerates away |
| `--ease-emphasized` | `cubic-bezier(0.2, 0.0, 0.0, 1.0)` | High-importance transitions: page changes, modal backdrop, navigation shifts |

### CSS Custom Properties

```css
:root {
  --ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1.0);
  --ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1.0);
  --ease-exit: cubic-bezier(0.4, 0.0, 1.0, 1.0);
  --ease-emphasized: cubic-bezier(0.2, 0.0, 0.0, 1.0);
}
```

### Framer Motion Spring Configs

```typescript
// Default spring — snappy, minimal overshoot. Use for most interactive elements.
const springDefault = { type: "spring", stiffness: 500, damping: 30, mass: 1 }

// Gentle spring — softer landing. Use for page transitions, layout shifts.
const springGentle = { type: "spring", stiffness: 300, damping: 28, mass: 1 }

// Bouncy spring — playful settle. Use sparingly: completion celebrations, drag-drop snap-back.
const springBouncy = { type: "spring", stiffness: 400, damping: 15, mass: 0.8 }

// Stiff spring — near-instant. Use for micro-interactions: button press, toggle snap.
const springStiff = { type: "spring", stiffness: 700, damping: 35, mass: 0.5 }
```

---

## Page Transitions

### Enter Animation
- **Properties**: `opacity: 0 → 1`, `y: 12px → 0`
- **Transition**: `duration: 250ms`, easing: `ease-enter` / Framer: `springGentle`
- **Behavior**: Content fades in and slides up slightly from below

### Exit Animation
- **Properties**: `opacity: 1 → 0`, `y: 0 → -8px`
- **Transition**: `duration: 150ms`, easing: `ease-exit`
- **Behavior**: Content fades out and drifts up slightly — faster than enter so the new page feels prompt

### Between-Page Sequencing
- **Pattern**: Wait — old page exits fully, then new page enters
- **No crossfade** — crossfading creates visual noise when layouts differ significantly
- **Exit completes in 150ms**, then enter begins immediately (no gap)
- **Total perceived transition**: ~400ms (150ms exit + 250ms enter)

### Framer Motion Implementation

```typescript
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const pageTransition = {
  enter: { duration: 0.25, ease: [0.0, 0.0, 0.2, 1.0] },
  exit: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] },
}

// AnimatePresence with mode="wait" for sequential exit → enter
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition.enter}
  />
</AnimatePresence>
```

---

## Component Entrance Patterns

### Stagger Children

Container orchestrates children entering sequentially. Each child uses the same entrance animation but with incremental delay.

- **Stagger delay**: `60ms` between children (default)
- **Fast stagger**: `40ms` for dense lists (table rows, grid items > 8)
- **Max visible stagger**: Cap at 8–10 items — remaining items enter simultaneously at the 8th delay to avoid slow-feeling sequences

### Individual Entrance Types

| Type | Properties | Duration | Use Case |
|---|---|---|---|
| **Fade** | `opacity: 0 → 1` | `250ms` | Text blocks, labels, subtle content |
| **Scale** | `opacity: 0 → 1, scale: 0.95 → 1` | `200ms` | Cards, badges, stat values, avatars |
| **Slide Up** | `opacity: 0 → 1, y: 16px → 0` | `250ms` | List items, stagger children, grid cards |
| **Slide In** | `opacity: 0 → 1, x: -12px → 0` | `200ms` | Sidebar items, left-anchored content |

### Framer Motion Variants

```typescript
const entranceVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
  },
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  },
  slideIn: {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
  },
}

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
}

const fastStaggerContainer = {
  animate: {
    transition: { staggerChildren: 0.04 },
  },
}
```

---

## Hover / Press Micro-Interactions

### Buttons (Primary, Secondary, Ghost)

| State | Effect | Transition |
|---|---|---|
| **Hover** | `scale: 1.02`, shadow increases one level (e.g., `--shadow-sm` → `--shadow-md`) | `springStiff` |
| **Press** | `scale: 0.98` | `springStiff` |
| **Focus-visible** | Focus ring appears (`--ring`) | `duration-instant` |

```typescript
// Framer Motion whileHover / whileTap
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 700, damping: 35, mass: 0.5 }}
/>
```

### Cards (Collection cards, stat cards, item cards)

| State | Effect | Transition |
|---|---|---|
| **Hover** | `y: -2px`, shadow increases one level, subtle border color shift to `--accent/10` | `springDefault` |
| **Press** | `y: 0, scale: 0.99` | `springStiff` |

```typescript
<motion.div
  whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
  whileTap={{ y: 0, scale: 0.99 }}
  transition={{ type: "spring", stiffness: 500, damping: 30 }}
/>
```

### Links (Text links, navigation items)

| State | Effect | Transition |
|---|---|---|
| **Hover** | Color shifts to `--accent`, underline slides in from left (width `0% → 100%`) | `duration-fast`, `ease-standard` |
| **Active** | Color: `--accent`, underline stays | Instant |

### Icon Buttons (Action buttons, toolbar icons)

| State | Effect | Transition |
|---|---|---|
| **Hover** | Background: `--accent/10`, subtle `rotate: 3deg` for tool icons (optional — only decorative icons, not navigation) | `duration-fast` |
| **Press** | `scale: 0.9` | `springStiff` |

---

## Loading Patterns

### Skeleton Pulse

- **Animation**: Opacity pulse between `0.4` and `1.0`
- **Duration**: `1.5s` per cycle (one full pulse = `--duration-slow` × 3.75)
- **Easing**: `ease-in-out` (smooth, non-jarring)
- **Color**: `--muted` background with pulse overlaying `--muted-foreground/5`
- **Shape**: Matches the final content layout — rounded rectangles matching `--radius-md`

```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  background: hsl(var(--muted));
  border-radius: var(--radius-md);
}
```

### Spinner

- **Style**: Simple ring spinner (not dots — too playful for the warm, grounded identity)
- **Size**: 16px (inline), 24px (button), 40px (page-level)
- **Color**: `--accent` stroke on transparent ring
- **Speed**: `0.75s` per rotation
- **Easing**: `linear` rotation (constant speed)

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  border: 2px solid hsl(var(--muted));
  border-top-color: hsl(var(--accent));
  border-radius: 9999px;
  animation: spin 0.75s linear infinite;
}
```

### Progress Bar

- **Track**: `--muted` background, `--radius-full` border radius, height `4px`
- **Fill**: `--accent` with subtle gradient overlay for depth
- **Animation**: Width transition using `duration-normal` + `ease-standard`
- **Indeterminate**: Sliding highlight pulse across the track (shimmer effect)

---

## Overlay & Panel Animations

### Modal / Dialog

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Backdrop enter** | `opacity: 0 → 1` | `200ms` | `ease-enter` |
| **Content enter** | `opacity: 0 → 1, scale: 0.95 → 1, y: 8px → 0` | `250ms` | `springGentle` |
| **Content exit** | `opacity: 1 → 0, scale: 1 → 0.97` | `150ms` | `ease-exit` |
| **Backdrop exit** | `opacity: 1 → 0` | `150ms` | `ease-exit` |

- Backdrop uses `background: rgba(0, 0, 0, 0.5)` light / `rgba(0, 0, 0, 0.7)` dark + `backdrop-filter: blur(4px)`
- Content and backdrop enter simultaneously
- Exit: content exits first, backdrop follows (slight overlap OK)

```typescript
const dialogVariants = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97 },
}

const dialogTransition = {
  enter: { type: "spring", stiffness: 300, damping: 28 },
  exit: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1.0] },
}
```

### Sheet (Mobile navigation, side panels)

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Enter** | `x: -100% → 0` (left sheet) or `x: 100% → 0` (right sheet) | `300ms` | `springGentle` |
| **Exit** | Reverse of enter direction | `200ms` | `ease-exit` |

- Includes backdrop (same as modal)
- Sheet slides over content — content does not shift

```typescript
const sheetVariants = {
  left: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },
  right: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
}
```

### Toast Notifications

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Enter** | `opacity: 0 → 1, y: 16px → 0, scale: 0.95 → 1` | `250ms` | `springDefault` |
| **Exit** | `opacity: 1 → 0, x: 0 → 100%` | `200ms` | `ease-exit` |

- Toasts stack from bottom-right (desktop) or bottom-center (mobile)
- Stack gap: `--space-2` (8px)
- Existing toasts slide up when new toast enters (stacking animation: `springGentle`)
- Auto-dismiss after 5 seconds with swipe-to-dismiss on mobile

### Dropdown Menu

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| **Enter** | `opacity: 0 → 1, scale: 0.95 → 1, y: -4px → 0` | `150ms` | `ease-enter` |
| **Exit** | `opacity: 1 → 0, scale: 0.97 → 1` | `100ms` | `ease-exit` |

- Transform origin matches anchor point (top-left, top-right, etc.)
- Menu items don't individually animate — the container animates as one unit

---

## Drag-and-Drop Feedback

### Lift (Drag Start)
- **Effect**: `scale: 1.03`, shadow jumps to `--shadow-lg`, slight `rotate: 1deg` for organic feel
- **Transition**: `springDefault` (snappy pickup)
- **Cursor**: `grabbing`
- **Background**: Slightly elevated color (e.g., `--card` → `--accent/5` tint)

### Placeholder
- **Style**: Dashed border (`2px dashed --border`), `--muted` background, `--radius-md`
- **Height**: Matches dragged item height
- **Enter animation**: `opacity: 0 → 1, scale: 0.98 → 1` over `duration-fast`

### Drop (Release)
- **Effect**: `scale: 1.03 → 1`, shadow returns to resting, `rotate: 0deg`
- **Transition**: `springBouncy` — slight overshoot for satisfying "snap into place" feel
- **Placeholder**: Fades out over `duration-fast`

### While Dragging Over
- Adjacent items smoothly shift position using `springGentle` — no instant jumps

```typescript
// @dnd-kit sortable item styling during drag
const dragStyles = {
  lifted: {
    scale: 1.03,
    boxShadow: "var(--shadow-lg)",
    rotate: 1,
    zIndex: 50,
  },
  dropped: {
    scale: 1,
    boxShadow: "var(--shadow-sm)",
    rotate: 0,
    transition: { type: "spring", stiffness: 400, damping: 15, mass: 0.8 },
  },
}
```

---

## Reduced Motion Strategy

When `prefers-reduced-motion: reduce` is set:

### What Gets Removed
- All `transform` animations (scale, translate/y/x, rotate)
- All spring physics (replaced with instant state changes)
- Page transition slide (y movement)
- Drag-and-drop lift/scale effects
- Skeleton pulse animation
- Stagger delays between children

### What Gets Preserved (as instant state changes)
- `opacity` transitions — reduced to `duration-instant` (50ms) fade
- Color changes — still transition but at `duration-instant`
- Focus ring appearance — stays at `duration-instant`
- Spinner rotation — **preserved** (functional, indicates loading)

### Implementation Approach

```typescript
// Module-level check (existing pattern in motion.tsx)
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false

// Variant factory — returns noop variants when reduced motion is on
function getVariants(variants: Variants): Variants {
  return prefersReducedMotion ? noopVariants : variants
}

// For CSS animations, use media query
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; opacity: 0.7; }
  * { transition-duration: 50ms !important; }
  /* Preserve spinner */
  .spinner { animation: spin 0.75s linear infinite; }
}
```

### Key Rule
Reduced motion should **never break functionality**. Loading states still show (just without pulse), drag-and-drop still works (just without lift effect), navigation still transitions (just instant). The app should be fully usable and understandable without any animation.

---

## Summary of Motion Tokens for CSS

```css
:root {
  /* Durations */
  --duration-instant: 50ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-deliberate: 600ms;

  /* Easings */
  --ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1.0);
  --ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1.0);
  --ease-exit: cubic-bezier(0.4, 0.0, 1.0, 1.0);
  --ease-emphasized: cubic-bezier(0.2, 0.0, 0.0, 1.0);
}
```

## Summary of Framer Motion Configs

```typescript
export const springs = {
  default: { type: "spring", stiffness: 500, damping: 30, mass: 1 },
  gentle: { type: "spring", stiffness: 300, damping: 28, mass: 1 },
  bouncy: { type: "spring", stiffness: 400, damping: 15, mass: 0.8 },
  stiff: { type: "spring", stiffness: 700, damping: 35, mass: 0.5 },
} as const

export const durations = {
  instant: 0.05,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  deliberate: 0.6,
} as const

export const easings = {
  standard: [0.25, 0.1, 0.25, 1.0],
  enter: [0.0, 0.0, 0.2, 1.0],
  exit: [0.4, 0.0, 1.0, 1.0],
  emphasized: [0.2, 0.0, 0.0, 1.0],
} as const
```
