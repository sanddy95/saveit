# Genesis Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the SaveIt app with the Genesis design system — new fonts, indigo color palette, updated component styles, and elevation patterns for both light and dark modes.

**Architecture:** Pure CSS/styling changes. Replace OKLch color tokens with Genesis hex values, swap fonts (General Sans + DM Sans + JetBrains Mono), update component border-radius and elevation patterns. No data model, routing, or feature changes.

**Tech Stack:** Tailwind CSS 4 (CSS custom properties), next/font/google (DM Sans, JetBrains Mono), Fontshare CDN (General Sans), CVA variants

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/globals.css` | Modify | Color tokens, font-face, radius tokens, utility classes |
| `src/app/layout.tsx` | Modify | Font imports (DM Sans, JetBrains Mono), remove Geist/Space Grotesk |
| `src/components/ui/button.tsx` | Modify | Radius 6px, hover-lift, indigo glow |
| `src/components/ui/card.tsx` | Modify | Radius 12px, hover-lift + shadow transition |
| `src/components/ui/input.tsx` | Modify | Radius 6px, indigo focus ring |
| `src/components/ui/badge.tsx` | Modify | Pill shape, status color variants |
| `src/components/layout/TopBar.tsx` | Modify | Height 56px, backdrop-blur, border |
| `src/components/layout/BottomNav.tsx` | Modify | Indigo active state |
| `src/components/layout/Sidebar.tsx` | Modify | Genesis sidebar tokens |
| `src/components/dashboard/DashboardHero.tsx` | Modify | Replace Space Grotesk refs with font-heading |
| `src/components/dashboard/RecentBoards.tsx` | Modify | Replace Space Grotesk ref |
| `src/components/dashboard/UpcomingTodos.tsx` | Modify | Replace Space Grotesk ref |
| `src/components/dashboard/CompletionRing.tsx` | Modify | Replace Space Grotesk ref |

---

### Task 1: Color Tokens & Font-Face in globals.css

**Files:**
- Modify: `src/app/globals.css:1-130`

- [ ] **Step 1: Replace the `:root` color block (lines 51-84) with Genesis light mode colors**

Replace the entire `:root { ... }` block with:

```css
:root {
  --background: #FAFAFA;
  --foreground: #0A0A0A;
  --card: #FFFFFF;
  --card-foreground: #0A0A0A;
  --popover: #FFFFFF;
  --popover-foreground: #0A0A0A;
  --primary: #6366F1;
  --primary-foreground: #FFFFFF;
  --secondary: #F5F5F7;
  --secondary-foreground: #0A0A0A;
  --muted: #F5F5F7;
  --muted-foreground: #9C9C9C;
  --accent: #F5F5F7;
  --accent-foreground: #0A0A0A;
  --destructive: #EF4444;
  --destructive-foreground: #FFFFFF;
  --border: #E8E8EC;
  --input: #E8E8EC;
  --ring: rgba(99, 102, 241, 0.12);
  --chart-1: #6366F1;
  --chart-2: #818CF8;
  --chart-3: #A5B4FC;
  --chart-4: #C7D2FE;
  --chart-5: #E0E7FF;
  --radius: 0.625rem;
  --sidebar: #F5F5F7;
  --sidebar-foreground: #0A0A0A;
  --sidebar-primary: #6366F1;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #EDEDF0;
  --sidebar-accent-foreground: #0A0A0A;
  --sidebar-border: #E8E8EC;
  --sidebar-ring: rgba(99, 102, 241, 0.12);
  --success: #10B981;
  --warning: #F59E0B;
}
```

- [ ] **Step 2: Replace the `.dark` color block (lines 86-118) with Genesis dark mode colors**

Replace the entire `.dark { ... }` block with:

```css
.dark {
  --background: #0F0F14;
  --foreground: #F0F0F2;
  --card: #1A1A24;
  --card-foreground: #F0F0F2;
  --popover: #1A1A24;
  --popover-foreground: #F0F0F2;
  --primary: #818CF8;
  --primary-foreground: #FFFFFF;
  --secondary: #1E1E2A;
  --secondary-foreground: #F0F0F2;
  --muted: #1E1E2A;
  --muted-foreground: #6B6B78;
  --accent: #1E1E2A;
  --accent-foreground: #F0F0F2;
  --destructive: #F87171;
  --destructive-foreground: #FFFFFF;
  --border: rgba(255, 255, 255, 0.1);
  --input: rgba(255, 255, 255, 0.15);
  --ring: rgba(129, 140, 248, 0.2);
  --chart-1: #818CF8;
  --chart-2: #6366F1;
  --chart-3: #4F46E5;
  --chart-4: #4338CA;
  --chart-5: #3730A3;
  --sidebar: #141419;
  --sidebar-foreground: #F0F0F2;
  --sidebar-primary: #818CF8;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #252530;
  --sidebar-accent-foreground: #F0F0F2;
  --sidebar-border: rgba(255, 255, 255, 0.1);
  --sidebar-ring: rgba(129, 140, 248, 0.2);
  --success: #34D399;
  --warning: #FBBF24;
}
```

- [ ] **Step 3: Add General Sans @font-face declarations before the @theme block**

Insert after line 5 (`@custom-variant dark (&:is(.dark *));`):

```css
/* General Sans from Fontshare */
@font-face {
  font-family: 'General Sans';
  src: url('https://api.fontshare.com/v2/css?f[]=general-sans@600,700&display=swap') format('woff2');
  font-weight: 600 700;
  font-display: swap;
}
```

- [ ] **Step 4: Update the `--font-heading` and `--font-mono` mappings in @theme inline (lines 10-12)**

Change:
```css
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-sans);
```
To:
```css
  --font-sans: var(--font-dm-sans);
  --font-mono: var(--font-jetbrains-mono);
  --font-heading: 'General Sans', var(--font-dm-sans), sans-serif;
```

- [ ] **Step 5: Add Genesis utility classes to the @layer base block (lines 120-130)**

Replace the `@layer base` block with:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-size: 15px;
  }
  html {
    @apply font-sans antialiased;
  }
}
```

- [ ] **Step 6: Verify the file is valid**

Run: `npx next build --no-lint 2>&1 | head -20` (or just start dev server and check for CSS errors)

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css
git commit -m "style: replace color tokens and fonts with Genesis design system"
```

---

### Task 2: Font Imports in layout.tsx

**Files:**
- Modify: `src/app/layout.tsx:1-54`

- [ ] **Step 1: Replace font imports and declarations (lines 1-21)**

Replace:
```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```

With:
```tsx
import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
});
```

- [ ] **Step 2: Update the html className (line 45)**

Replace:
```tsx
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
```

With:
```tsx
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
```

- [ ] **Step 3: Verify fonts load correctly**

Run: `npx next dev` and check browser dev tools — DM Sans should load for body text, General Sans for headings.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "style: swap fonts to DM Sans + JetBrains Mono + General Sans"
```

---

### Task 3: Button Component

**Files:**
- Modify: `src/components/ui/button.tsx:1-61`

- [ ] **Step 1: Update buttonVariants base class and variants (lines 8-43)**

Replace the entire `buttonVariants` definition:

```tsx
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[6px] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none hover:-translate-y-px focus-visible:ring-[3px] focus-visible:ring-[var(--ring)] focus-visible:border-primary active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#4F46E5] hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)] dark:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline hover:translate-y-0",
      },
      size: {
        default:
          "h-[38px] gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[6px] px-2 text-xs in-data-[slot=button-group]:rounded-[6px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[6px] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-[6px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-[38px]",
        "icon-xs":
          "size-6 rounded-[6px] in-data-[slot=button-group]:rounded-[6px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[6px] in-data-[slot=button-group]:rounded-[6px]",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

- [ ] **Step 2: Verify buttons render correctly**

Run dev server, navigate to dashboard — check "New Todo" and "New Board" buttons have indigo color, 6px radius, and glow on hover.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "style: update button to Genesis — 6px radius, indigo glow, hover lift"
```

---

### Task 4: Card Component

**Files:**
- Modify: `src/components/ui/card.tsx:1-104`

- [ ] **Step 1: Update Card base class (line 15)**

Replace:
```tsx
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
```

With:
```tsx
        "group/card flex flex-col gap-4 overflow-hidden rounded-[12px] border border-border bg-card py-4 text-sm text-card-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-[12px] *:[img:last-child]:rounded-b-[12px]",
```

- [ ] **Step 2: Update CardTitle to use font-heading with Genesis letter-spacing (line 41)**

Replace:
```tsx
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
```

With:
```tsx
        "font-heading text-base leading-snug font-semibold tracking-[-0.03em] group-data-[size=sm]/card:text-sm",
```

- [ ] **Step 3: Verify card hover animation**

Run dev server, hover over cards on dashboard — should see subtle lift and shadow.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "style: update card to Genesis — 12px radius, hover-lift shadow"
```

---

### Task 5: Input Component

**Files:**
- Modify: `src/components/ui/input.tsx:1-21`

- [ ] **Step 1: Update Input className (line 12)**

Replace:
```tsx
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
```

With:
```tsx
        "h-[38px] w-full min-w-0 rounded-[6px] border border-input bg-card px-3.5 py-2.5 text-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
```

- [ ] **Step 2: Verify input focus ring**

Run dev server, click into any input field — should see indigo border with subtle indigo ring.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/input.tsx
git commit -m "style: update input to Genesis — 6px radius, indigo focus ring"
```

---

### Task 6: Badge Component

**Files:**
- Modify: `src/components/ui/badge.tsx:1-53`

- [ ] **Step 1: Update badgeVariants with Genesis styles and add status variants (lines 7-28)**

Replace the entire `badgeVariants` definition:

```tsx
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-3 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:ring-[var(--ring)] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-[var(--success)]/10 text-[var(--success)] dark:bg-[var(--success)]/20",
        warning:
          "bg-[var(--warning)]/10 text-[var(--warning)] dark:bg-[var(--warning)]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "style: update badge to Genesis — pill shape, status variants"
```

---

### Task 7: TopBar Component

**Files:**
- Modify: `src/components/layout/TopBar.tsx:1-17`

- [ ] **Step 1: Update TopBar with Genesis nav styles (lines 6-15)**

Replace the entire function body:

```tsx
export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-primary" />
        <span className="font-heading text-lg font-bold tracking-[-0.03em]">SaveIt</span>
      </div>
      <WorkspaceSwitcher />
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/TopBar.tsx
git commit -m "style: update TopBar to Genesis — backdrop-blur, sticky"
```

---

### Task 8: BottomNav Component

**Files:**
- Modify: `src/components/layout/BottomNav.tsx:1-59`

- [ ] **Step 1: Update BottomNav with Genesis styles (line 32)**

Replace:
```tsx
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
```

With:
```tsx
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl">
```

- [ ] **Step 2: Update the active icon fill (line 49)**

Replace:
```tsx
                className={cn("h-5 w-5", isActive && "fill-primary/20")}
```

With:
```tsx
                className={cn("h-5 w-5", isActive && "fill-primary/15")}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/BottomNav.tsx
git commit -m "style: update BottomNav to Genesis — backdrop-blur, indigo active"
```

---

### Task 9: Sidebar Component

**Files:**
- Modify: `src/components/layout/Sidebar.tsx:1-122`

- [ ] **Step 1: Update the sidebar container class (line 55)**

Replace:
```tsx
    <div className="flex h-full w-64 flex-col border-r bg-card">
```

With:
```tsx
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
```

- [ ] **Step 2: Update the logo text to use font-heading (line 59)**

Replace:
```tsx
        <span className="text-xl font-bold">SaveIt</span>
```

With:
```tsx
        <span className="font-heading text-xl font-bold tracking-[-0.03em]">SaveIt</span>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "style: update Sidebar to Genesis tokens"
```

---

### Task 10: Dashboard Font References

**Files:**
- Modify: `src/components/dashboard/DashboardHero.tsx:37,74,83`
- Modify: `src/components/dashboard/RecentBoards.tsx:14`
- Modify: `src/components/dashboard/UpcomingTodos.tsx:31`
- Modify: `src/components/dashboard/CompletionRing.tsx:48`

- [ ] **Step 1: In DashboardHero.tsx, replace all `font-[family-name:var(--font-space-grotesk)]` with `font-heading`**

Line 37 — replace:
```tsx
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">
```
With:
```tsx
            <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] font-heading">
```

Line 74 — replace:
```tsx
                <p className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] leading-none">
```
With:
```tsx
                <p className="text-lg font-bold font-heading leading-none">
```

Line 83 — replace:
```tsx
                <p className={`text-lg font-bold font-[family-name:var(--font-space-grotesk)] leading-none ${(stats?.overdue || 0) > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
```
With:
```tsx
                <p className={`text-lg font-bold font-heading leading-none ${(stats?.overdue || 0) > 0 ? "text-destructive" : ""}`}>
```

- [ ] **Step 2: In RecentBoards.tsx, replace the Space Grotesk reference**

Replace:
```tsx
        <h2 className="text-base font-semibold flex items-center gap-2 font-[family-name:var(--font-space-grotesk)]">
```
With:
```tsx
        <h2 className="text-base font-semibold flex items-center gap-2 font-heading tracking-[-0.03em]">
```

- [ ] **Step 3: In UpcomingTodos.tsx, replace the Space Grotesk reference**

Replace:
```tsx
        <h2 className="text-base font-semibold flex items-center gap-2 font-[family-name:var(--font-space-grotesk)]">
```
With:
```tsx
        <h2 className="text-base font-semibold flex items-center gap-2 font-heading tracking-[-0.03em]">
```

- [ ] **Step 4: In CompletionRing.tsx, replace the Space Grotesk reference**

Replace:
```tsx
        <span className="text-lg font-bold font-[family-name:var(--font-space-grotesk)]">
```
With:
```tsx
        <span className="text-lg font-bold font-heading">
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/DashboardHero.tsx src/components/dashboard/RecentBoards.tsx src/components/dashboard/UpcomingTodos.tsx src/components/dashboard/CompletionRing.tsx
git commit -m "style: replace Space Grotesk refs with font-heading across dashboard"
```

---

### Task 11: Dialog & Sheet Font References

**Files:**
- Modify: `src/components/ui/dialog.tsx:125`
- Modify: `src/components/ui/sheet.tsx:108`

- [ ] **Step 1: In dialog.tsx, update the title class (line 125)**

The `font-heading` class is already used — just add tracking:

Replace:
```tsx
        "font-heading text-base leading-none font-medium",
```
With:
```tsx
        "font-heading text-base leading-none font-semibold tracking-[-0.03em]",
```

- [ ] **Step 2: In sheet.tsx, update the title class (line 108)**

Replace:
```tsx
        "font-heading text-base font-medium text-foreground",
```
With:
```tsx
        "font-heading text-base font-semibold tracking-[-0.03em] text-foreground",
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/sheet.tsx
git commit -m "style: update dialog/sheet titles to Genesis heading style"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Run the dev server**

```bash
npx next dev
```

- [ ] **Step 2: Visual checks in browser**

Open `http://localhost:3000` and verify:
1. Page background is warm gray (#FAFAFA), not pure white
2. Primary buttons are indigo with glow on hover
3. Cards have 12px radius and lift on hover
4. Headings use General Sans (check in dev tools)
5. Body text uses DM Sans
6. Inputs have 6px radius and indigo focus ring
7. TopBar has backdrop-blur effect
8. Sidebar uses Genesis sidebar tokens

- [ ] **Step 3: Check dark mode**

Toggle dark mode and verify:
1. Background is dark blue-tinted (#0F0F14)
2. Cards are #1A1A24
3. Primary color is lighter indigo (#818CF8)
4. Borders are subtle white/10%
5. Text is readable on all surfaces

- [ ] **Step 4: Check mobile view**

Resize to mobile width and verify:
1. BottomNav has backdrop-blur
2. TopBar is sticky with blur
3. Cards still hover-lift on touch devices (acceptable)

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "style: Genesis reskin final adjustments"
```
