# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Cocos  
**Category:** Fintech / Trading (Dark-only mobile SaaS)  
**Stack:** React Native, Expo Router, Uniwind, Tailwind CSS v4

---

## Global Rules

### Theme mode

- **Dark only** — `Uniwind.setTheme("dark")` at app boot; no light mode toggle.
- All UI uses semantic tokens from [`src/global.css`](../../src/global.css) (`bg-background`, `text-foreground`, etc.).

### Semantic color palette

| Token              | Hex                             | Usage                      |
| ------------------ | ------------------------------- | -------------------------- |
| `background`       | `#0F172A`                       | App canvas                 |
| `card`             | `#1E293B`                       | Cards, elevated surfaces   |
| `muted`            | `#334155`                       | Segmented controls, inputs |
| `border`           | `#334155`                       | Dividers, card borders     |
| `foreground`       | `#F8FAFC`                       | Primary text               |
| `muted-foreground` | `#94A3B8`                       | Labels, subtitles          |
| `primary`          | `#F59E0B`                       | Brand gold, buy actions    |
| `secondary`        | `#FBBF24`                       | Secondary brand            |
| `accent`           | `#8B5CF6`                       | CTA / submit buttons       |
| `profit`           | `#34D399`                       | Gains                      |
| `loss`             | `#F87171`                       | Losses                     |
| `chart-1…5`        | gold, purple, amber, green, red | Chart series               |
| `chart-grid`       | `#334155`                       | Chart grid lines           |
| `chart-label`      | `#94A3B8`                       | Chart axis labels          |

**Notes:** Gold trust + purple tech on slate dark canvas.

### Typography

- **Font:** Plus Jakarta Sans (Regular, Medium, SemiBold, Bold)
- **Loading:** `expo-font` via [`src/config/fonts.config.ts`](../../src/config/fonts.config.ts)
- **CSS token:** `--font-sans: "PlusJakartaSans-Regular"`
- **Mood:** Modern SaaS fintech — clean, approachable, professional

### Spacing

| Token    | Value | Usage                                   |
| -------- | ----- | --------------------------------------- |
| `street` | 16px  | Screen horizontal padding (`px-street`) |
| `md`     | 12px  | Standard gaps                           |
| `lg`     | 16px  | Section gaps                            |

### Radius

| Token       | Value       | Usage           |
| ----------- | ----------- | --------------- |
| `md`        | 8px         | Buttons, inputs |
| `lg` / `xl` | 12px / 16px | Cards           |

---

## Component Specs

### Buttons

- **Primary (gold):** `variant="default"` — brand actions, buy side
- **CTA (purple):** `variant="accent"` — submit order, key conversions
- **Destructive:** sell side, errors
- **Outline / ghost:** secondary actions on dark cards
- Min height 44px on primary CTAs; use `active:` not hover on native

### Cards

- Flat dark SaaS: `bg-card border-border rounded-xl border`
- No light-mode shadows; subtle border for elevation
- List rows: inset cards (`mx-street rounded-lg border mb-sm`)

### Inputs

- `bg-muted/50 border-border rounded-lg h-12`
- Focus ring: gold (`ring-primary`)

### Charts

- Wrapped in `bg-card border-border rounded-xl border p-md`
- Line colors from theme tokens (gold primary, profit/loss for portfolio direction)
- Plus Jakarta Medium 12px for axis labels

### Segmented controls (orders)

- Track: `bg-muted p-xs rounded-md`
- Selected: gold (quantity), purple (type), gold/destructive (buy/sell)

---

## Style Guidelines

**Style:** Dark Mode OLED + Flat SaaS

- High contrast text on slate backgrounds
- Minimal shadows, border-based depth
- 150–200ms transitions on web only
- Lucide icons only — no emoji icons

---

## React Native Notes

- Touch targets: minimum 44×44px
- Use `active:opacity-70` on list rows
- StatusBar: `style="light"` on all screens
- Stack headers: `#0F172A` background, `#F8FAFC` tint

---

## Anti-Patterns (Do NOT Use)

- Light backgrounds or cream/white page canvases
- Hardcoded hex in feature components (use semantic tokens)
- `dark:` variant overrides (app is dark-only)
- Layout-shifting hover scales on mobile
- Emojis as icons

---

## Pre-Delivery Checklist

- [ ] Semantic tokens used (`bg-card`, not `#1E293B`)
- [ ] Contrast 4.5:1 for body and muted text
- [ ] Charts use theme chart tokens
- [ ] Plus Jakarta Sans loaded before render
- [ ] All primary buttons ≥ 44px touch height
- [ ] No light-mode flash on launch
