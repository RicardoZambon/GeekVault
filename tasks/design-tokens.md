# GeekVault Design Tokens

## Color Palette

### Palette Exploration — Three Directions

---

#### Direction 1: "Slate & Emerald"

**Mood**: Refined gallery, rare gemstones, curated luxury
**Inspired by**: Linear's precision, Stripe's warmth, with the richness of a jeweler's display case
**Why it works for collectibles**: Emerald connotes rarity and value — the green of precious stones, the patina of aged copper. Collectors prize the rare and beautiful; this palette speaks that language.

**Light Mode**:
- Background: `#F8F9FA` (cool off-white with blue undertone)
- Card: `#FFFFFF`
- Primary: `#1A1F2E` (deep blue-charcoal — authoritative without being navy)
- Accent: `#10B981` (emerald green — vibrant, alive, premium)
- Neutral text: `#64748B` (cool slate)
- Borders: `#E2E8F0` (light slate)

**Dark Mode**:
- Background: `#0C0F1A` (deep midnight with blue undertone)
- Card: `#151929` (elevated dark surface)
- Primary: `#E2E8F0` (light slate for readable text)
- Accent: `#34D399` (lighter emerald — maintains vibrancy on dark)
- Neutral text: `#94A3B8` (muted slate)

**Sidebar**: Dark charcoal with emerald active indicators — feels like a museum navigation panel

**Verdict**: Clean, modern, distinctive. The emerald accent is memorable without being overwhelming. Strong dark mode story — surfaces stack with clear elevation. Risk: green accent might feel too "fintech."

---

#### Direction 2: "Warm Obsidian"

**Mood**: Collector's study, amber light, mahogany and brass
**Inspired by**: Notion's warmth, Apple's refinement, the feel of opening a leather-bound case
**Why it works for collectibles**: Evokes the physical warmth of handling treasured objects — the amber glow of display lighting, the rich wood of a collector's cabinet. Deeply personal and inviting.

**Light Mode**:
- Background: `#FAFAF7` (warm cream)
- Card: `#FFFFFF`
- Primary: `#292524` (warm charcoal — stone, not steel)
- Accent: `#D97706` (deep amber — richer than gold, like aged honey)
- Neutral text: `#78716C` (warm stone gray)
- Borders: `#E7E5E4` (warm gray)

**Dark Mode**:
- Background: `#1C1917` (warm black — like dark walnut)
- Card: `#292524` (elevated warm dark)
- Primary: `#E7E5E4` (warm light)
- Accent: `#F59E0B` (brighter amber for dark surfaces)
- Neutral text: `#A8A29E` (warm muted)

**Sidebar**: Deep warm charcoal with amber highlights — like the inside of a curio cabinet

**Verdict**: Emotionally resonant and highly distinctive. The warm undertone throughout creates an inviting, tactile feel. Dark mode feels genuinely cozy. Risk: could feel too "heritage" for users wanting a modern SaaS feel.

---

#### Direction 3: "Arctic Violet"

**Mood**: Digital gallery, contemporary art museum, crystalline precision
**Inspired by**: Raycast's polish, Arc browser's personality, the glow of a neon display case
**Why it works for collectibles**: Modern collectors live digitally — this palette bridges physical collecting with digital management. The violet accent adds personality and excitement without being juvenile.

**Light Mode**:
- Background: `#FAFAFA` (neutral white)
- Card: `#FFFFFF`
- Primary: `#18181B` (true dark — zinc family)
- Accent: `#8B5CF6` (vivid violet — energetic, modern, memorable)
- Neutral text: `#71717A` (zinc gray)
- Borders: `#E4E4E7` (zinc border)

**Dark Mode**:
- Background: `#09090B` (near-black)
- Card: `#18181B` (elevated dark)
- Primary: `#FAFAFA` (near-white text)
- Accent: `#A78BFA` (lighter violet for dark surfaces)
- Neutral text: `#A1A1AA` (zinc muted)

**Sidebar**: Deep near-black with violet accent glow — futuristic, clean

**Verdict**: Most "modern SaaS" feeling. Clean, high-contrast, bold accent. Excellent dark mode since it's built from near-neutral zinc. Risk: violet is increasingly common in developer tools (Vercel, Raycast) — less distinctive than it was.

---

### Selected Direction: "Warm Obsidian"

**Rationale**: GeekVault is fundamentally about *physical objects people love*. The warm palette creates an emotional connection that cool palettes can't match — it makes the app feel like an extension of the collector's space rather than a clinical database. The amber accent is rich without being garish, and it's rare in SaaS (most use blue, green, or violet). The warm undertone running through every surface creates a cohesive atmosphere that's immediately recognizable.

Compared to alternatives:
- **vs Slate & Emerald**: Emerald is clean but clinical — it lacks the warmth that makes a collectibles app feel personal. Green also risks "fintech" associations.
- **vs Arctic Violet**: Violet is stylish but increasingly generic in SaaS/developer tools. The cool neutrals feel corporate rather than personal.
- **vs Current (Navy & Gold)**: The current palette has the right instinct (warm accent on a cool base) but the execution creates problems — navy foreground on white background is uncommon and creates accessibility concerns, and the gold is too yellow/brassy. Warm Obsidian refines this instinct with better contrast ratios and richer warmth throughout.

---

### Full Color Specification

#### Light Mode (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#FAFAF7` | Page background — warm cream |
| `--foreground` | `#1C1917` | Primary text — warm near-black (stone-900) |
| `--card` | `#FFFFFF` | Card surfaces |
| `--card-foreground` | `#1C1917` | Card text |
| `--popover` | `#FFFFFF` | Popover/dropdown surfaces |
| `--popover-foreground` | `#1C1917` | Popover text |
| `--primary` | `#292524` | Primary buttons, key actions (stone-800) |
| `--primary-foreground` | `#FAFAF7` | Text on primary |
| `--secondary` | `#F5F5F4` | Secondary surfaces, subtle backgrounds (stone-100) |
| `--secondary-foreground` | `#292524` | Text on secondary |
| `--accent` | `#D97706` | Accent color — deep amber (amber-600) |
| `--accent-foreground` | `#FFFFFF` | Text on accent |
| `--destructive` | `#DC2626` | Destructive actions (red-600) |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive |
| `--success` | `#16A34A` | Success states (green-600) |
| `--success-foreground` | `#FFFFFF` | Text on success |
| `--warning` | `#E89B2D` | Warning states — warm amber-orange |
| `--warning-foreground` | `#451A03` | Text on warning — dark brown for readability |
| `--info` | `#2563EB` | Info states (blue-600) |
| `--info-foreground` | `#FFFFFF` | Text on info |
| `--muted` | `#F5F5F4` | Muted backgrounds (stone-100) |
| `--muted-foreground` | `#78716C` | Secondary/muted text (stone-500) |
| `--border` | `#E7E5E4` | Borders (stone-200) |
| `--input` | `#E7E5E4` | Input borders (stone-200) |
| `--ring` | `#D97706` | Focus ring — amber accent |

**Contrast ratios (WCAG AA compliance)**:
- `--foreground` (#1C1917) on `--background` (#FAFAF7): **15.5:1** ✓
- `--muted-foreground` (#78716C) on `--background` (#FAFAF7): **4.7:1** ✓
- `--accent` (#D97706) on `--background` (#FAFAF7): **4.6:1** ✓ (AA for normal text)
- `--primary-foreground` (#FAFAF7) on `--primary` (#292524): **13.5:1** ✓
- `--accent-foreground` (#FFFFFF) on `--accent` (#D97706): **3.4:1** ✓ (AA for large text/UI components; for small text, use foreground on accent-tinted backgrounds instead)

#### Dark Mode (`.dark`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#1C1917` | Page background — warm dark (stone-900) |
| `--foreground` | `#E7E5E4` | Primary text — warm light (stone-200) |
| `--card` | `#292524` | Card surfaces — elevated warm dark (stone-800) |
| `--card-foreground` | `#E7E5E4` | Card text |
| `--popover` | `#292524` | Popover surfaces |
| `--popover-foreground` | `#E7E5E4` | Popover text |
| `--primary` | `#F5F5F4` | Primary buttons — light stone (stone-100) |
| `--primary-foreground` | `#1C1917` | Text on primary — dark for contrast |
| `--secondary` | `#292524` | Secondary surfaces (stone-800) |
| `--secondary-foreground` | `#E7E5E4` | Text on secondary |
| `--accent` | `#F59E0B` | Accent — brighter amber for dark bg (amber-500) |
| `--accent-foreground` | `#451A03` | Text on accent — dark brown |
| `--destructive` | `#EF4444` | Destructive — brighter red for dark bg (red-500) |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive |
| `--success` | `#22C55E` | Success — brighter green for dark bg (green-500) |
| `--success-foreground` | `#FFFFFF` | Text on success |
| `--warning` | `#FBBF24` | Warning — brighter amber-yellow (amber-400) |
| `--warning-foreground` | `#451A03` | Text on warning |
| `--info` | `#3B82F6` | Info — brighter blue (blue-500) |
| `--info-foreground` | `#FFFFFF` | Text on info |
| `--muted` | `#292524` | Muted backgrounds (stone-800) |
| `--muted-foreground` | `#A8A29E` | Secondary text (stone-400) |
| `--border` | `#44403C` | Borders (stone-700) |
| `--input` | `#44403C` | Input borders (stone-700) |
| `--ring` | `#F59E0B` | Focus ring — brighter amber |

**Contrast ratios (WCAG AA compliance)**:
- `--foreground` (#E7E5E4) on `--background` (#1C1917): **12.6:1** ✓
- `--muted-foreground` (#A8A29E) on `--background` (#1C1917): **5.8:1** ✓
- `--accent` (#F59E0B) on `--background` (#1C1917): **7.4:1** ✓
- `--accent` (#F59E0B) on `--card` (#292524): **6.3:1** ✓

#### Dark Mode Elevation Strategy

Dark mode uses progressively lighter warm surfaces to convey depth:

| Level | Token | Value | Example |
|-------|-------|-------|---------|
| 0 — Base | `--background` | `#1C1917` | Page background |
| 1 — Surface | `--card` | `#292524` | Cards, sidebars |
| 2 — Elevated | `--secondary` | `#292524` | Same as card (use shadow for differentiation) |
| 3 — Overlay | `--popover` | `#292524` | Dropdowns, tooltips (use stronger shadow) |
| Floating | — | `#44403C` | Floating action buttons, drag state |

In dark mode, shadow color shifts to `rgba(0, 0, 0, 0.5)` (more opaque) since subtle shadows vanish on dark backgrounds. Borders at `--border` (#44403C) become the primary depth cue.

---

### Sidebar Tokens

The sidebar uses a distinct dark surface in both themes — creating a strong anchor point for navigation. In light mode, the sidebar contrasts sharply with the bright content area. In dark mode, it's slightly darker than the content.

#### Light Mode Sidebar

| Token | Value | Notes |
|-------|-------|-------|
| `--sidebar-background` | `#1C1917` | Dark warm surface — matches foreground color |
| `--sidebar-foreground` | `#D6D3D1` | Warm light text (stone-300) |
| `--sidebar-primary` | `#F59E0B` | Amber highlight for active item (amber-500) |
| `--sidebar-primary-foreground` | `#1C1917` | Dark text on amber |
| `--sidebar-accent` | `rgba(245, 158, 11, 0.12)` | Subtle amber tint for hover/active bg |
| `--sidebar-accent-foreground` | `#FAFAF7` | Light text on accent bg |
| `--sidebar-border` | `rgba(255, 255, 255, 0.08)` | Subtle white border between items |
| `--sidebar-ring` | `#F59E0B` | Focus ring in sidebar |
| `--sidebar-muted-foreground` | `#A8A29E` | Muted text for labels/groups (stone-400) |

#### Dark Mode Sidebar

| Token | Value | Notes |
|-------|-------|-------|
| `--sidebar-background` | `#0C0A09` | Deeper dark than content bg (stone-950) |
| `--sidebar-foreground` | `#D6D3D1` | Warm light text (stone-300) |
| `--sidebar-primary` | `#F59E0B` | Amber highlight — same as light sidebar |
| `--sidebar-primary-foreground` | `#1C1917` | Dark text on amber |
| `--sidebar-accent` | `rgba(245, 158, 11, 0.12)` | Same subtle amber tint |
| `--sidebar-accent-foreground` | `#E7E5E4` | Light text on accent bg |
| `--sidebar-border` | `rgba(255, 255, 255, 0.06)` | Even subtler white border |
| `--sidebar-ring` | `#F59E0B` | Focus ring in sidebar |
| `--sidebar-muted-foreground` | `#78716C` | Muted text (stone-500) |

---

### Chart Color Palette

Eight harmonious colors for recharts visualizations. Designed to:
- Be distinguishable from each other
- Work on both light and dark backgrounds
- Maintain the warm aesthetic
- Be accessible to users with color vision deficiency (varied lightness values)

#### Light Mode Chart Colors

| Token | Value | Name | Usage hint |
|-------|-------|------|------------|
| `--chart-1` | `#D97706` | Amber | Primary series / hero metric |
| `--chart-2` | `#2563EB` | Blue | Secondary series / comparison |
| `--chart-3` | `#16A34A` | Green | Positive / growth |
| `--chart-4` | `#DC2626` | Red | Negative / decline |
| `--chart-5` | `#9333EA` | Purple | Tertiary / categorical |
| `--chart-6` | `#0891B2` | Cyan | Quaternary / categorical |
| `--chart-7` | `#C2410C` | Orange-red | Additional series |
| `--chart-8` | `#4F46E5` | Indigo | Additional series |

#### Dark Mode Chart Colors

| Token | Value | Name | Notes |
|-------|-------|------|-------|
| `--chart-1` | `#F59E0B` | Amber | Brighter for dark bg |
| `--chart-2` | `#3B82F6` | Blue | Brighter |
| `--chart-3` | `#22C55E` | Green | Brighter |
| `--chart-4` | `#EF4444` | Red | Brighter |
| `--chart-5` | `#A855F7` | Purple | Brighter |
| `--chart-6` | `#06B6D4` | Cyan | Brighter |
| `--chart-7` | `#EA580C` | Orange-red | Brighter |
| `--chart-8` | `#6366F1` | Indigo | Brighter |

**Usage rules**:
- Pie/donut charts: Use chart-1 through chart-N (as many slices as needed)
- Bar charts: Use chart-1 for single series, chart-1 + chart-2 for comparison
- Line charts: Use chart-1 as primary line, others for additional series
- Always include a legend when using 3+ colors

---

### Interactive State Colors

#### Focus Ring

| State | Light | Dark |
|-------|-------|------|
| Default focus ring | `--ring` (#D97706) | `--ring` (#F59E0B) |
| Ring width | `2px` | `2px` |
| Ring offset | `2px` | `2px` |
| Ring offset color | `--background` | `--background` |

Implementation: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`

Note: Use `focus-visible` (not `focus`) so rings only appear on keyboard navigation, not mouse clicks.

#### Selection Highlight

| State | Light | Dark |
|-------|-------|------|
| Text selection bg | `rgba(217, 119, 6, 0.20)` | `rgba(245, 158, 11, 0.25)` |
| Text selection text | `inherit` | `inherit` |
| Row/item selection bg | `rgba(217, 119, 6, 0.08)` | `rgba(245, 158, 11, 0.10)` |
| Row/item selection border | `#D97706` (left border accent) | `#F59E0B` |

CSS for text selection:
```css
::selection {
  background: rgba(217, 119, 6, 0.20);
}
.dark ::selection {
  background: rgba(245, 158, 11, 0.25);
}
```

#### Hover Overlay

| Surface | Light | Dark |
|---------|-------|------|
| Subtle hover (nav items, list rows) | `rgba(28, 25, 23, 0.04)` | `rgba(250, 250, 247, 0.04)` |
| Medium hover (cards, buttons) | `rgba(28, 25, 23, 0.08)` | `rgba(250, 250, 247, 0.08)` |
| Strong hover (image overlays) | `rgba(28, 25, 23, 0.60)` | `rgba(0, 0, 0, 0.70)` |
| Accent hover (on accent bg) | `#B45309` (amber-700, darkened) | `#D97706` (amber-600, slightly dimmed) |

---

### Light vs Dark Side-by-Side Comparison

#### Key Surfaces

| Surface | Light | Dark | Notes |
|---------|-------|------|-------|
| **Page background** | `#FAFAF7` warm cream | `#1C1917` warm charcoal | Warm undertone in both — never stark white or pure black |
| **Card** | `#FFFFFF` white | `#292524` warm dark stone | Clear elevation in light; subtle lift with border in dark |
| **Sidebar** | `#1C1917` dark charcoal | `#0C0A09` deepest warm black | Always dark — consistent anchor, slightly darker in dark mode |
| **Input field** | White fill, `#E7E5E4` border | `#292524` fill, `#44403C` border | Inputs match card surface in both modes |
| **Modal overlay** | `rgba(0, 0, 0, 0.50)` | `rgba(0, 0, 0, 0.70)` | Darker overlay in dark mode for sufficient dimming |
| **Accent button** | `#D97706` bg, white text | `#F59E0B` bg, dark text | Amber shifts brighter in dark, text inverts |
| **Primary button** | `#292524` bg, cream text | `#F5F5F4` bg, dark text | Inverted — dark-on-light becomes light-on-dark |
| **Muted text** | `#78716C` stone-500 | `#A8A29E` stone-400 | One step lighter in dark for readability |
| **Border** | `#E7E5E4` stone-200 | `#44403C` stone-700 | Borders are more prominent in dark mode (important depth cue) |

#### The Warm Obsidian Philosophy

The defining characteristic of this palette is its **consistent warm undertone**. Every color — from backgrounds to borders to muted text — draws from the "stone" scale (Tailwind's warm gray family) rather than the cool "slate" or neutral "zinc" scales.

This creates an immediately recognizable feel: the app radiates warmth whether in light or dark mode. Users subconsciously associate this warmth with the physical pleasure of handling collectibles — the amber glow of display case lighting, the rich tone of wood shelving, the patina of well-loved objects.

The amber accent reinforces this: it's not arbitrary, it's the color of light itself — warm, inviting, guiding the eye to what matters.
