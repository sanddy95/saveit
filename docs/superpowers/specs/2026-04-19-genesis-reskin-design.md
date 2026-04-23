# SaveIt Genesis Reskin — Design Spec

Apply the Genesis design system aesthetic to SaveIt. This is a visual reskin — no feature changes, no data model changes. Same app, new look.

## Scope

Update all visual tokens (colors, typography, spacing, elevation, border-radius) and component styles to match the Genesis design guide. Both light and dark modes.

### What Changes
- CSS custom properties (colors, radii, spacing)
- Font loading (General Sans, DM Sans, JetBrains Mono)
- Component styles (buttons, cards, inputs, badges, nav, focus states)
- Elevation patterns (hover-lift, glow shadows, backdrop-blur)

### What Doesn't Change
- App structure, routing, layouts
- Data model, API, auth
- Feature set, business logic
- Component architecture (slots, CVA variants, Base UI)

---

## 1. Color System

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | #6366F1 | CTAs, active states, links, focus rings |
| `--primary-hover` | #4F46E5 | Hover on primary elements |
| `--primary-foreground` | #FFFFFF | Text on primary bg |
| `--background` | #FAFAFA | Page background |
| `--surface` / `--card` | #FFFFFF | Cards, panels, modals, nav |
| `--foreground` / `--text-primary` | #0A0A0A | Headings, body text, primary labels |
| `--text-secondary` | #6B6B6B | Descriptions, metadata |
| `--muted` | #F5F5F7 | Muted backgrounds |
| `--muted-foreground` | #9C9C9C | Placeholders, timestamps, disabled |
| `--border` | #E8E8EC | Card borders, dividers, input borders |
| `--input` | #E8E8EC | Input borders |
| `--ring` | rgba(99,102,241,0.12) | Focus ring color |
| `--success` | #10B981 | Completed status, confirmations |
| `--warning` | #F59E0B | Pending states |
| `--destructive` | #EF4444 | Destructive actions, errors |
| `--destructive-foreground` | #FFFFFF | Text on destructive bg |
| `--secondary` | #F5F5F7 | Secondary button bg |
| `--secondary-foreground` | #0A0A0A | Text on secondary bg |
| `--accent` | #F5F5F7 | Accent backgrounds |
| `--accent-foreground` | #0A0A0A | Text on accent bg |
| `--sidebar` | #F5F5F7 | Sidebar background |
| `--sidebar-foreground` | #0A0A0A | Sidebar text |
| `--sidebar-primary` | #6366F1 | Active sidebar item |
| `--sidebar-primary-foreground` | #FFFFFF | Text on active sidebar item |
| `--sidebar-accent` | #EDEDF0 | Sidebar hover bg |
| `--sidebar-accent-foreground` | #0A0A0A | Sidebar hover text |
| `--sidebar-border` | #E8E8EC | Sidebar border |

### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | #818CF8 | Lighter indigo for dark bg contrast |
| `--primary-hover` | #6366F1 | Hover state |
| `--primary-foreground` | #FFFFFF | Text on primary bg |
| `--background` | #0F0F14 | Page background — dark with blue undertone |
| `--surface` / `--card` | #1A1A24 | Cards, panels, modals |
| `--foreground` / `--text-primary` | #F0F0F2 | Headings, body text |
| `--text-secondary` | #9C9CA8 | Descriptions, metadata |
| `--muted` | #1E1E2A | Muted backgrounds |
| `--muted-foreground` | #6B6B78 | Placeholders, timestamps |
| `--border` | rgba(255,255,255,0.1) | Borders |
| `--input` | rgba(255,255,255,0.15) | Input borders |
| `--ring` | rgba(129,140,248,0.2) | Focus ring — lighter indigo |
| `--success` | #34D399 | Lifted for dark bg |
| `--warning` | #FBBF24 | Lifted for dark bg |
| `--destructive` | #F87171 | Lifted for dark bg |
| `--destructive-foreground` | #FFFFFF | Text on destructive bg |
| `--secondary` | #1E1E2A | Secondary bg |
| `--secondary-foreground` | #F0F0F2 | Text on secondary |
| `--accent` | #1E1E2A | Accent bg |
| `--accent-foreground` | #F0F0F2 | Text on accent |
| `--sidebar` | #141419 | Sidebar background |
| `--sidebar-foreground` | #F0F0F2 | Sidebar text |
| `--sidebar-primary` | #818CF8 | Active sidebar item |
| `--sidebar-primary-foreground` | #FFFFFF | Text on active sidebar item |
| `--sidebar-accent` | #252530 | Sidebar hover bg |
| `--sidebar-accent-foreground` | #F0F0F2 | Sidebar hover text |
| `--sidebar-border` | rgba(255,255,255,0.1) | Sidebar border |

---

## 2. Typography

### Font Loading

| Role | Font | Source | Weights | CSS Variable |
|------|------|--------|---------|--------------|
| Display/Headings | General Sans | Fontshare CDN | 600, 700 | `--font-heading` |
| Body/UI | DM Sans | Google Fonts (next/font) | 400, 500 | `--font-sans` |
| Code | JetBrains Mono | Google Fonts (next/font) | 400 | `--font-mono` |

**General Sans**: Load via `@font-face` from Fontshare CDN (not available in next/font). Define in `globals.css`.

**DM Sans + JetBrains Mono**: Load via `next/font/google` in `layout.tsx`.

### Type Scale

| Token | Size | Weight | Letter-spacing | Font | Usage |
|-------|------|--------|----------------|------|-------|
| display | 72px | 700 | -0.04em | General Sans | Hero only (if needed) |
| section-heading | 32px | 700 | -0.03em | General Sans | Page titles |
| subhead | 24px | 600 | -0.03em | General Sans | Card titles, section heads |
| body | 15px | 400 | normal | DM Sans | Default text |
| body-medium | 15px | 500 | normal | DM Sans | Emphasized body |
| small | 13px | 400 | normal | DM Sans | Secondary labels |
| caption | 12px | 400 | normal | DM Sans | Timestamps, muted |
| overline | 11px | 500 | 0.05em | DM Sans | Uppercase category labels |

### Heading Treatment
- All headings use General Sans
- `letter-spacing: -0.03em` on section headings and subheads
- Max two font weights per screen

---

## 3. Components

### Buttons

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `--primary` | white | none | `--primary-hover` bg + glow shadow `0 4px 12px rgba(99,102,241,0.35)` + 1px lift |
| Secondary | transparent | `--foreground` | 1px `--border` | 1px lift |
| Ghost | transparent | `--foreground` | none | subtle bg change |
| Destructive | transparent | `--destructive` | 1px `--destructive` | destructive bg + white text |
| Link | transparent | `--primary` | none | underline |

**Sizes**: small (h-8/32px), medium (h-[38px]), large (h-11/44px)
**Radius**: 6px for all buttons
**Font**: DM Sans, weight 500, 14px

### Cards

- Background: `--surface`
- Border: 1px `--border`
- Radius: 12px
- Padding: 16px
- Hover: `transform: translateY(-2px)` + `box-shadow: 0 8px 30px rgba(0,0,0,0.08)`
- Transition: `all 200ms ease`
- Dark hover shadow: `0 8px 30px rgba(0,0,0,0.3)`

### Inputs

- Border: 1px `--border`
- Background: `--surface`
- Radius: 6px
- Padding: 10px vertical, 14px horizontal
- Font: DM Sans, 14px
- Focus: border `--primary` + ring `0 0 0 3px var(--ring)`
- Error: border `--destructive` + ring `0 0 0 3px rgba(239,68,68,0.12)`
- Placeholder: `--muted-foreground`

### Badges / Chips

- Shape: rounded-full (pill)
- Padding: 4px 12px
- Font: 12px
- Default: `--muted` bg, `--text-secondary` text
- Active: `--primary` bg, white text
- Status variants: success (green), warning (yellow), destructive (red)

### Navigation

- Sticky top, height 56px
- Background: `--surface` with `backdrop-filter: blur(12px)` and slight transparency
- Border: 1px bottom `--border`
- No shadow
- Links: 14px, weight 500, hover shows subtle bg
- Dark mode: same pattern, dark surface

### Focus States

All interactive elements: `0 0 0 3px var(--ring)` — indigo-tinted ring in light, lighter indigo in dark. Replaces current `ring-ring/50`.

---

## 4. Elevation

| Element | Rest | Hover/Focus |
|---------|------|-------------|
| Cards | flat (border only) | `-2px` lift + `0 8px 30px rgba(0,0,0,0.08)` |
| Primary buttons | flat | `0 4px 12px rgba(99,102,241,0.35)` glow |
| Nav | `backdrop-filter: blur(12px)` | — |
| Dropdowns/popovers | `shadow-lg` | — |
| Focus | — | `0 0 0 3px var(--ring)` |

**Rule**: No shadows on static elements. Shadow = interaction feedback only.

---

## 5. Spacing

**Base unit**: 4px

**Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

**Component padding**:
- Small: 8px × 12px
- Medium: 10px × 16px
- Large: 12px × 24px

**Section spacing**: 32px mobile, 48px tablet, 64px desktop

**Container**: max-width 1280px, 24px horizontal padding

**Card grid gap**: 20-24px

---

## 6. Border Radius

| Value | Usage |
|-------|-------|
| 4px | Tags, chips, badges, inline code |
| 6px | Buttons, inputs, selects |
| 8px | Metadata cards, dropdowns, panels |
| 12px | Main cards, search bar, featured sections |
| 9999px | Avatars, status dots, pill badges |

---

## 7. Files to Modify

1. **`src/app/globals.css`** — Replace color variables (OKLch → hex), update border-radius tokens, add elevation utilities, add General Sans `@font-face`
2. **`src/app/layout.tsx`** — Replace Geist/Space Grotesk with DM Sans/JetBrains Mono via next/font, remove Geist imports
3. **`src/components/ui/button.tsx`** — Update radius to 6px, add hover-lift + glow shadow for primary, update sizes
4. **`src/components/ui/card.tsx`** — Update radius to 12px, add hover-lift + shadow transition
5. **`src/components/ui/input.tsx`** — Update radius to 6px, update focus ring to indigo
6. **`src/components/ui/badge.tsx`** — Update to pill shape with Genesis color variants
7. **`src/components/layout/Sidebar.tsx`** — Update with new sidebar tokens
8. **`src/components/layout/TopBar.tsx`** — Add backdrop-blur, update height to 56px
9. **`src/components/layout/BottomNav.tsx`** — Apply indigo active state
10. **`src/components/dashboard/DashboardHero.tsx`** — Update font references to General Sans
11. **Any component using `font-heading`** — Verify it picks up General Sans

---

## 8. Do's and Don'ts

- Do use indigo only for interactive elements — never decoration
- Do maintain 4px spacing grid
- Do use General Sans for headings, DM Sans for body — never swap
- Do keep cards at 12px radius, buttons/inputs at 6px
- Do provide sufficient contrast in both light and dark
- Don't use pure #000 or #FFF for text — use palette values
- Don't add decorative gradients or illustrations
- Don't add shadows on static elements
- Don't use more than two font weights per screen
- Don't place more than one primary button per view section
