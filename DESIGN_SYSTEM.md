# Ateles — Design System

> Single source of truth for design tokens, component guidelines, and visual language.
> Mobile-first · 60-30-10 color rule · Elms Sans typography

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Typography](#typography)
3. [Color System (60-30-10)](#color-system-60-30-10)
4. [Spacing & Layout](#spacing--layout)
5. [Elevation & Depth](#elevation--depth)
6. [Border Radius](#border-radius)
7. [Motion & Animation](#motion--animation)
8. [Responsive Breakpoints](#responsive-breakpoints)
9. [Component Token Map](#component-token-map)
10. [Implementation Reference](#implementation-reference)

---

## Design Philosophy

Ateles is a **mobile-first wellness journal** that uses generative visuals (p5.js) to help users process emotions. The design must feel:

- **Calm & intentional** — wide whitespace, minimal chrome
- **Alive** — micro-animations, breathing effects, gesture responses
- **Premium** — precise typography, deliberate color ratios, glass surfaces

Every decision below serves that philosophy.

---

## Typography

### Typeface

| Property       | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| **Family**     | `Elms Sans`                                                                  |
| **Source**      | [Google Fonts](https://fonts.google.com/specimen/Elms+Sans)                  |
| **Category**   | Geometric Sans-Serif                                                         |
| **Fallback**   | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| **Loading**    | Google Fonts CDN with `display=swap`                                         |

### Font Import

```html
<link href="https://fonts.googleapis.com/css2?family=Elms+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
```

### Type Scale (Mobile-First)

All sizes use `rem` relative to a `16px` base. Scale follows a **1.200 (Minor Third)** ratio.

| Token                    | Size     | Weight   | Line Height | Letter Spacing | Usage                        |
| ------------------------ | -------- | -------- | ----------- | -------------- | ---------------------------- |
| `--font-display`         | `2.488rem` | 300 Thin | 1.1         | `-0.02em`      | Hero / splash text           |
| `--font-h1`              | `2.074rem` | 400 Regular | 1.15     | `-0.015em`     | Page titles                  |
| `--font-h2`              | `1.728rem` | 400 Regular | 1.2      | `-0.01em`      | Section headings             |
| `--font-h3`              | `1.44rem`  | 500 Medium  | 1.25     | `0`            | Sub-section headings         |
| `--font-body-lg`         | `1.2rem`   | 400 Regular | 1.6      | `0.01em`       | Large body / prompts         |
| `--font-body`            | `1rem`     | 400 Regular | 1.6      | `0.01em`       | Default body text            |
| `--font-body-sm`         | `0.875rem` | 400 Regular | 1.5      | `0.015em`      | Secondary text / captions    |
| `--font-caption`         | `0.75rem`  | 500 Medium  | 1.4      | `0.03em`       | Labels, metadata, dates      |
| `--font-button`          | `1rem`     | 500 Medium  | 1         | `0.02em`       | Button labels                |

### Weight Tokens

| Token               | Value | Usage                    |
| -------------------- | ----- | ----------------------- |
| `--weight-light`     | 300   | Display / decorative    |
| `--weight-regular`   | 400   | Body copy               |
| `--weight-medium`    | 500   | Buttons, emphasis       |
| `--weight-semibold`  | 600   | Strong emphasis         |
| `--weight-bold`      | 700   | Headings (desktop only) |

---

## Color System (60-30-10)

The **60-30-10 rule** creates visual hierarchy by distributing color across three tiers:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                60% — DOMINANT                        │
│        Background, canvas, large surfaces            │
│                                                      │
│    ┌──────────────────────────────────────┐           │
│    │                                      │           │
│    │        30% — SECONDARY               │           │
│    │  Cards, panels, interactive areas    │           │
│    │                                      │           │
│    │    ┌──────────────────────┐           │           │
│    │    │   10% — ACCENT      │           │           │
│    │    │  CTAs, focus states  │           │           │
│    │    └──────────────────────┘           │           │
│    └──────────────────────────────────────┘           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Core Palette

| Tier         | Role       | Token               | Value       | Hex       | Usage                                        |
| ------------ | ---------- | -------------------- | ----------- | --------- | --------------------------------------------- |
| **60%**      | Dominant   | `--color-bg`         | White       | `#FFFFFF` | Page background, canvas, large empty space    |
| **30%**      | Secondary  | `--color-surface`    | Light Grey  | `#E0E0E0` | Glass panels, cards, input fields, overlays   |
| **10%**      | Accent     | `--color-accent`     | Black       | `#000000` | Primary buttons, active states, key text      |

### Premium Theme Options

The system supports eight premium cohesive themes, mapped directly to the 60-30-10 ratios:

| Theme Name | 60% Dominant (Bg) | 30% Secondary (Surface) | 10% Accent (CTAs) | Mood & Feeling |
| ---------- | ----------------- | ----------------------- | ----------------- | -------------- |
| **Light**  | `#FFFFFF`         | `#E0E0E0`               | `#000000`         | Clean, high-contrast, stark |
| **Dark**   | `#161616`         | `#2C2C2C`               | `#E3E3E3`         | Deep, immersive, peaceful |
| **Warm**   | `#FDFBF7`         | `#EBE5D9`               | `#3D2A1C`         | Cosy, organic, comforting |
| **Cool**   | `#F4F7FB`         | `#DCE4F0`               | `#1C2D4A`         | Crisp, focused, fresh |
| **Japandi**| `#E8E0D5`         | `#8C7B6B`               | `#2F2F2F`         | Wabi-sabi, zen, minimal warm |
| **Cyberpunk**| `#0D0D0D`       | `#1A1A1A` (Neon borders)| `#00E5FF`         | Futuristic, gritty, dark city |
| **Retro**  | `#E8A838`         | `#C75B3A`               | `#4A6741`         | 70s, groovy, warm vintage |
| **Bauhaus**| `#D62828`         | `#1A3A8F`               | `#F7B731`         | Bold, primary, modernist |

### Extended Tokens

| Token                      | Value                     | Usage                                  |
| -------------------------- | ------------------------- | -------------------------------------- |
| `--color-text-primary`     | `#000000`                 | Headings, body text                    |
| `--color-text-secondary`   | `#555555`                 | Captions, placeholders, muted text     |
| `--color-text-tertiary`    | `#888888`                 | Disabled text, hints                   |
| `--color-text-inverse`     | `#FFFFFF`                 | Text on dark / accent backgrounds      |
| `--color-border`           | `rgba(0, 0, 0, 0.10)`    | Subtle dividers, card outlines         |
| `--color-border-strong`    | `rgba(0, 0, 0, 0.20)`    | Active input borders                   |
| `--color-overlay`          | `rgba(255, 255, 255, 0.78)` | Journal mode background dim         |
| `--color-glass`            | `rgba(224, 224, 224, 0.60)` | Frosted glass panels                 |

### 60-30-10 Application Map

| UI Region                     | Tier   | Tokens Used                          |
| ----------------------------- | ------ | ------------------------------------ |
| Page background               | 60%    | `--color-bg`                         |
| Canvas area (p5.js)           | 60%    | `--color-bg` (white clear)           |
| Glass card panels             | 30%    | `--color-surface`, `--color-glass`   |
| Input field backgrounds       | 30%    | `--color-surface`                    |
| Stroke selector (inactive)    | 30%    | `--color-border`                     |
| Primary buttons               | 10%    | `--color-accent`                     |
| Active stroke selector        | 10%    | `--color-accent` + `--color-text-inverse` |
| Active color dot ring         | 10%    | `--color-accent`                     |
| Prompt / heading text         | 10%    | `--color-text-primary`               |

### P5.js Canvas Colors

The generative canvas uses the same palette so that visuals feel integrated:

| Token (in-canvas)      | Value     | Usage                              |
| ---------------------- | --------- | ---------------------------------- |
| Shard fill — dark      | `#000000` | Default drawing stroke             |
| Shard fill — mid       | `#888888` | Grey drawing option                |
| Shard fill — light     | `#FFFFFF` | White drawing option (on bg)       |
| Canvas clear           | `#FFFFFF` | `p.background(255)`               |

---

## Spacing & Layout

### Base Unit

`--space-unit: 4px` — all spacing is a multiple of 4.

### Scale

| Token           | Value   | px   | Usage                                  |
| --------------- | ------- | ---- | -------------------------------------- |
| `--space-0`     | `0`     | 0    | Reset                                  |
| `--space-1`     | `4px`   | 4    | Tight inline gaps                      |
| `--space-2`     | `8px`   | 8    | Icon padding, small gaps               |
| `--space-3`     | `12px`  | 12   | Compact component padding              |
| `--space-4`     | `16px`  | 16   | Default content gap                    |
| `--space-5`     | `20px`  | 20   | Section gaps, card internal spacing    |
| `--space-6`     | `24px`  | 24   | Page horizontal padding (mobile)       |
| `--space-8`     | `32px`  | 32   | Large section margins                  |
| `--space-10`    | `40px`  | 40   | Bottom page padding                    |
| `--space-12`    | `48px`  | 48   | Top safe-area offset                   |
| `--space-16`    | `64px`  | 64   | Extra-large desktop spacing            |

### Layout Constraints

| Token                    | Value   | Usage                          |
| ------------------------ | ------- | ------------------------------ |
| `--content-max-width`    | `480px` | Mobile content width cap       |
| `--page-padding-x`      | `24px`  | Horizontal page gutters        |
| `--page-padding-top`     | `60px`  | Top padding (below status bar) |
| `--page-padding-bottom`  | `40px`  | Bottom safe area               |

---

## Elevation & Depth

Glass-morphism surfaces use layered elevation:

| Token                 | Value                                  | Usage                           |
| --------------------- | -------------------------------------- | ------------------------------- |
| `--shadow-sm`         | `0 2px 4px rgba(0, 0, 0, 0.06)`       | Subtle lift (color dots)        |
| `--shadow-md`         | `0 4px 15px rgba(0, 0, 0, 0.10)`      | Buttons, floating controls      |
| `--shadow-lg`         | `0 8px 32px rgba(0, 0, 0, 0.04)`      | Glass panels, cards             |
| `--shadow-hover`      | `0 6px 20px rgba(0, 0, 0, 0.15)`      | Button hover state              |
| `--blur-glass`        | `blur(12px)`                           | Glass panel backdrop            |

---

## Border Radius

| Token                | Value   | Usage                              |
| -------------------- | ------- | ---------------------------------- |
| `--radius-sm`        | `8px`   | Small inputs, chips                |
| `--radius-md`        | `16px`  | Action buttons, cards              |
| `--radius-lg`        | `24px`  | Glass panels, modals               |
| `--radius-pill`      | `30px`  | Pill buttons, full-round controls  |
| `--radius-circle`    | `50%`   | Color selectors, avatars           |

---

## Motion & Animation

### Timing

| Token                    | Value                | Usage                              |
| ------------------------ | -------------------- | ---------------------------------- |
| `--duration-fast`        | `150ms`              | Micro-interactions (active press)  |
| `--duration-normal`      | `200ms`              | Hover states, toggles             |
| `--duration-slow`        | `500ms`              | Page transitions (Svelte fade)     |
| `--duration-xslow`       | `1000ms`             | Fade-in animations                 |
| `--easing-default`       | `ease`               | General transitions                |
| `--easing-out`           | `cubic-bezier(0.0, 0, 0.2, 1)` | Enter / appear          |
| `--easing-in`            | `cubic-bezier(0.4, 0, 1, 1)`   | Exit / disappear        |
| `--easing-spring`        | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy micro-feedback |

### Standard Transitions

```css
/* Button press */
button {
  transition: all var(--duration-normal) var(--easing-default);
}
button:active {
  transform: scale(0.96);
}

/* Fade-in entrance */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in {
  animation: fadeIn var(--duration-xslow) var(--easing-out);
}
```

### Haptic Scale

For gesture-driven shake interactions, intensity maps to visual response:

| Shake Level     | Threshold    | Visual Response                        |
| --------------- | ------------ | -------------------------------------- |
| Idle            | `< 5`        | No movement                            |
| Trigger         | `> 8`        | Enter breaking phase                   |
| Active break    | `8 – 50`     | Chaotic shard physics                  |
| Calm detected   | `< 5` 30 frames | Transition → bloom                  |
| Reshake         | `> 25`       | Re-scatter existing shards             |

---

## Responsive Breakpoints

**Mobile-first** — base styles target `320px+` screens. Breakpoints scale up.

| Token        | Value     | Target                       |
| ------------ | --------- | ---------------------------- |
| `--bp-sm`    | `375px`   | Standard mobile              |
| `--bp-md`    | `428px`   | Large mobile / phablet       |
| `--bp-lg`    | `768px`   | Tablet                       |
| `--bp-xl`    | `1024px`  | Desktop                      |
| `--bp-2xl`   | `1440px`  | Wide desktop                 |

### Media Query Pattern

```css
/* Mobile-first: base styles apply to smallest screens */

/* Standard mobile (375px+) */
@media (min-width: 23.4375rem) { }

/* Large mobile (428px+) */
@media (min-width: 26.75rem) { }

/* Tablet (768px+) */
@media (min-width: 48rem) { }

/* Desktop (1024px+) */
@media (min-width: 64rem) { }
```

### Responsive Token Adjustments

| Property              | Mobile (base)    | Tablet (768px+) | Desktop (1024px+) |
| --------------------- | ---------------- | --------------- | ------------------ |
| `--page-padding-x`    | `24px`           | `32px`          | `48px`             |
| `--font-display`      | `2.488rem`       | `3rem`          | `3.5rem`           |
| `--font-h1`           | `2.074rem`       | `2.4rem`        | `2.8rem`           |
| Content max-width     | `100%`           | `600px`         | `720px`            |

---

## Component Token Map

How tokens map to each Svelte component:

### `Home.svelte`

| Element             | Token(s)                                                              |
| ------------------- | --------------------------------------------------------------------- |
| Container           | Full viewport, `pointer-events: none`, flex-end                      |
| Prompt text         | `--font-body-lg`, `--weight-regular`, `--color-text-primary`         |
| Prompt glow         | `text-shadow` with `--color-bg` at 80-90% opacity                   |
| Color selector dot  | `24px` circle, `--shadow-sm`, `--radius-circle`                     |
| Color dot active    | `border: 2px solid --color-accent`, `scale(1.2)`                    |
| Stroke button       | `--font-body-sm`, `--radius-pill`, border `--color-accent`          |
| Stroke button active| `fill: --color-accent`, `color: --color-text-inverse`               |
| Primary button      | `--font-button`, `--color-accent`, `--color-text-inverse`, `--radius-pill`, `--shadow-md` |
| Button hover        | `translateY(-2px)`, `--shadow-hover`                                |

### `JournalInput.svelte`

| Element             | Token(s)                                                              |
| ------------------- | --------------------------------------------------------------------- |
| Container           | `--page-padding-top`, `--page-padding-x`, `--page-padding-bottom`   |
| Header title        | `--font-h2`, `--weight-regular`, center aligned                     |
| Editor card         | `.glass-panel`, `--color-surface`, `--radius-lg`, `--shadow-lg`     |
| Title input          | `--font-h1`, `--weight-medium`, transparent bg                     |
| Content textarea    | `--font-body-lg`, `--weight-regular`, `line-height: 1.5`           |
| Placeholder text    | `--color-text-secondary`                                             |
| Secondary button    | `rgba(0,0,0,0.05)` bg, `--color-text-primary`                      |
| Primary button      | `--color-accent`, `--color-text-inverse`, `--radius-md`             |

### `JournalView.svelte`

| Element             | Token(s)                                                              |
| ------------------- | --------------------------------------------------------------------- |
| Title               | `--font-display`, `--weight-regular`                                 |
| Date                | `--font-caption`, `--color-text-secondary`, uppercase, `--space-6` bottom |
| Body text           | `--font-body-lg`, `line-height: 1.6`, `white-space: pre-wrap`      |

### `P5Canvas.svelte`

| Element             | Token(s)                                                              |
| ------------------- | --------------------------------------------------------------------- |
| Container           | Absolute fill, `z-index: 0`                                         |
| Canvas background   | `--color-bg` (white: `p.background(255)`)                           |
| Journal overlay     | `--color-overlay` (`rgba(255,255,255,200/255)`)                     |

---

## Implementation Reference

### CSS Custom Properties (app.css)

```css
:root {
  /* ── 60-30-10 Color Tokens ── */
  --color-bg:              #FFFFFF;     /* 60% — Dominant */
  --color-surface:         #E0E0E0;     /* 30% — Secondary */
  --color-accent:          #000000;     /* 10% — Accent */

  --color-text-primary:    #000000;
  --color-text-secondary:  #555555;
  --color-text-tertiary:   #888888;
  --color-text-inverse:    #FFFFFF;
  --color-border:          rgba(0, 0, 0, 0.10);
  --color-border-strong:   rgba(0, 0, 0, 0.20);
  --color-overlay:         rgba(255, 255, 255, 0.78);
  --color-glass:           rgba(224, 224, 224, 0.60);

  /* ── Typography ── */
  --font-family:           'Elms Sans', -apple-system, BlinkMacSystemFont,
                           "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-display:          2.488rem;
  --font-h1:               2.074rem;
  --font-h2:               1.728rem;
  --font-h3:               1.44rem;
  --font-body-lg:          1.2rem;
  --font-body:             1rem;
  --font-body-sm:          0.875rem;
  --font-caption:          0.75rem;
  --font-button:           1rem;

  --weight-light:          300;
  --weight-regular:        400;
  --weight-medium:         500;
  --weight-semibold:       600;
  --weight-bold:           700;

  /* ── Spacing (4px base) ── */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;

  /* ── Layout ── */
  --content-max-width:     480px;
  --page-padding-x:        24px;
  --page-padding-top:      60px;
  --page-padding-bottom:   40px;

  /* ── Elevation ── */
  --shadow-sm:    0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md:    0 4px 15px rgba(0, 0, 0, 0.10);
  --shadow-lg:    0 8px 32px rgba(0, 0, 0, 0.04);
  --shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.15);
  --blur-glass:   blur(12px);

  /* ── Border Radius ── */
  --radius-sm:     8px;
  --radius-md:     16px;
  --radius-lg:     24px;
  --radius-pill:   30px;
  --radius-circle: 50%;

  /* ── Motion ── */
  --duration-fast:    150ms;
  --duration-normal:  200ms;
  --duration-slow:    500ms;
  --duration-xslow:   1000ms;
  --easing-default:   ease;
  --easing-out:       cubic-bezier(0.0, 0, 0.2, 1);
  --easing-in:        cubic-bezier(0.4, 0, 1, 1);
  --easing-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ── Breakpoints (reference only, use in media queries) ── */
  /* --bp-sm:  375px  */
  /* --bp-md:  428px  */
  /* --bp-lg:  768px  */
  /* --bp-xl:  1024px */
  /* --bp-2xl: 1440px */
}
```

### Google Fonts CDN (index.html)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Elms+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
```

---

## Quick Reference Card

```
ATELES DESIGN TOKENS — CHEAT SHEET

COLORS (60-30-10)
  THEMES: Light, Dark, Warm, Cool, Japandi, Cyberpunk, Retro, Bauhaus
  Ratio: 60% Dominant (Bg) · 30% Secondary (Surface) · 10% Accent (CTAs)

FONT
  Elms Sans  300 · 400 · 500 · 600 · 700

SPACING
  Base: 4px
  Scale: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64

RADII
  8 · 16 · 24 · 30 · 50%

BREAKPOINTS (mobile-first)
  375 · 428 · 768 · 1024 · 1440
```

---

*Last updated: 2026-05-27*

