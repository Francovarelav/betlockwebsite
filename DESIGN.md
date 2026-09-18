# BETLOCK — Design System

> Casino de screentime. Apuesta tus horas. Gana o pierde acceso.

---

## 1. Visual Theme & Atmosphere

- **Mood:** Dark, premium, high-stakes. Think underground casino meets sleek tech startup.
- **Density:** Generous whitespace. Let elements breathe. Every section gets full viewport height or close to it.
- **Philosophy:** Minimal but bold. Big type, cinematic spacing, subtle motion. No clutter. Every pixel earns its place.
- **Inspiration:** Awwwards-level — Linear, Vercel, Raycast, Nothing Phone.

---

## 2. Color Palette & Roles

| Token              | Hex       | Role                                      |
|---------------------|-----------|-------------------------------------------|
| `--bg-primary`      | `#050507` | Page background — near-black              |
| `--bg-elevated`     | `#0A0A0F` | Cards, elevated surfaces                  |
| `--bg-subtle`       | `#111118` | Section alternates, hover states          |
| `--border-subtle`   | `#1A1A24` | Dividers, card borders (barely visible)   |
| `--text-primary`    | `#F5F5F7` | Headlines, primary content                |
| `--text-secondary`  | `#8A8A9A` | Body copy, descriptions                   |
| `--text-muted`      | `#4A4A5A` | Captions, footnotes                       |
| `--accent`          | `#8B5CF6` | Primary purple — CTAs, highlights         |
| `--accent-hover`    | `#A78BFA` | Hover state for accent                    |
| `--accent-glow`     | `rgba(139,92,246,0.15)` | Glow/shadow for accent elements |
| `--win`             | `#22C55E` | Positive values, gains                    |
| `--loss`            | `#EF4444` | Negative values, losses                   |
| `--gradient-hero`   | `linear-gradient(135deg, #8B5CF6 0%, #6D28D9 50%, #4C1D95 100%)` | Accent gradient |

---

## 3. Typography Rules

- **Font Family:** `'Satoshi', system-ui, -apple-system, sans-serif`
- **Fallback:** System font stack
- **Style:** Variable weight (300–900)

| Element         | Size       | Weight | Letter-spacing | Line-height | Case       |
|-----------------|------------|--------|----------------|-------------|------------|
| Hero H1         | 80px / 5rem | 800    | -0.03em        | 0.95        | Normal     |
| Section H2      | 48px / 3rem | 700    | -0.025em       | 1.1         | Normal     |
| Subtitle        | 20px / 1.25rem | 400 | 0              | 1.5         | Normal     |
| Body            | 16px / 1rem | 400    | 0              | 1.6         | Normal     |
| Button          | 16px / 1rem | 600    | 0.01em         | 1           | Normal     |
| Nav link        | 14px / 0.875rem | 500 | 0.02em        | 1           | Normal     |
| Caption/Badge   | 12px / 0.75rem | 500 | 0.06em         | 1           | Uppercase  |
| Logo "BET"      | 18px       | 800    | 0.02em         | 1           | Uppercase  |
| Logo "LOCK"     | 18px       | 400    | 0.02em         | 1           | Uppercase  |

---

## 4. Page Structure (Linear Flow)

```
┌─────────────────────────────────────────────┐
│  NAVBAR                                      │
│  Logo left · Nav links center · CTA right    │
├─────────────────────────────────────────────┤
│  HERO (100vh)                                │
│  Centered layout:                            │
│  · Badge pill: "Disponible pronto en iOS"    │
│  · H1: "Tu screentime\nes tu apuesta"       │
│  · Subtitle: 2 lines max                    │
│  · CTA button + secondary link              │
│  · Hero image below (phone/field)           │
├─────────────────────────────────────────────┤
│  SOCIAL PROOF / LOGOS                        │
│  "Únete a +2,000 en waitlist"               │
│  Logo strip or counter                       │
├─────────────────────────────────────────────┤
│  HOW IT WORKS (3 steps)                      │
│  Step 1 → Step 2 → Step 3                   │
│  Icon + title + description each             │
├─────────────────────────────────────────────┤
│  FEATURES (bento grid)                       │
│  2x2 or 3-col grid of feature cards          │
│  · Blackjack · Coin Flip · Ruleta · Stats   │
├─────────────────────────────────────────────┤
│  CTA FINAL                                   │
│  Big centered block with gradient bg         │
│  "¿Listo para apostar tu tiempo?"            │
│  CTA button                                  │
├─────────────────────────────────────────────┤
│  FOOTER                                      │
│  Logo · Links · Social · Copyright           │
└─────────────────────────────────────────────┘
```

---

## 5. Component Styles

### Buttons

| Variant   | Background                     | Text     | Border          | Hover                          |
|-----------|--------------------------------|----------|-----------------|--------------------------------|
| Primary   | `--accent`                     | `#fff`   | none            | `--accent-hover` + glow shadow |
| Secondary | `transparent`                  | `--text-primary` | `--border-subtle` | `--bg-subtle`            |
| Ghost     | `transparent`                  | `--text-secondary` | none          | text → `--text-primary`    |

- Border-radius: `12px`
- Padding: `14px 28px`
- Transition: `all 0.2s ease`
- Primary hover glow: `0 0 32px rgba(139,92,246,0.4)`

### Cards

- Background: `--bg-elevated`
- Border: `1px solid --border-subtle`
- Border-radius: `16px`
- Padding: `32px`
- Hover: border lightens to `#2A2A34`, subtle translateY(-2px)

### Badge Pill

- Background: `rgba(139,92,246,0.1)`
- Border: `1px solid rgba(139,92,246,0.25)`
- Border-radius: `999px`
- Padding: `8px 16px`
- Font: Caption style (12px, uppercase, 600 weight)
- Color: `--accent`

---

## 6. Layout Principles

- **Max width:** `1200px` for content, centered with auto margins
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160
- **Section padding:** `128px 0` minimum (desktop), `80px 0` (mobile)
- **Hero:** Full viewport height, content vertically + horizontally centered
- **Grid gap:** `24px` default
- **Whitespace philosophy:** When in doubt, add more space. Density kills premium feel.

---

## 7. Depth & Elevation

| Level    | Shadow                                                  | Use case              |
|----------|----------------------------------------------------------|-----------------------|
| None     | —                                                        | Flat elements         |
| Subtle   | `0 1px 2px rgba(0,0,0,0.3)`                             | Buttons resting       |
| Medium   | `0 4px 16px rgba(0,0,0,0.4)`                            | Cards                 |
| High     | `0 8px 32px rgba(0,0,0,0.5)`                            | Modals, phone mockup  |
| Glow     | `0 0 32px rgba(139,92,246,0.3)`                          | Accent hover states   |

---

## 8. Motion & Animation

- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — smooth deceleration
- **Duration:** 200ms (micro), 500ms (reveal), 800ms (hero entrance)
- **Scroll reveal:** Elements fade up 24px with stagger (100ms between siblings)
- **Hero entrance:** Title → subtitle → CTA → image, staggered 150ms each
- **Hover transitions:** 200ms ease for all interactive elements
- **Reduced motion:** Respect `prefers-reduced-motion` — disable all animations

---

## 9. Do's and Don'ts

### Do
- Use generous whitespace between sections
- Keep text lines under 50 characters for headlines
- Use accent color sparingly — only CTAs and key highlights
- Animate on scroll with subtle fade-up reveals
- Keep the dark theme consistent — no white backgrounds

### Don't
- Use more than 2 font weights per element
- Add decorative borders or ornaments
- Use gradients on text (except the hero keyword)
- Put more than 3 items in a row on mobile
- Use stock-looking icons — keep minimal or use custom

---

## 10. Responsive Behavior

| Breakpoint | Width    | Adjustments                                    |
|------------|----------|------------------------------------------------|
| Desktop    | ≥1024px  | Full layout, 80px hero text                    |
| Tablet     | 768–1023 | 56px hero text, 2-col grids                    |
| Mobile     | <768px   | 40px hero text, single column, 48px section pad |

- Touch targets: minimum 44x44px
- Nav collapses to hamburger below 768px
- Cards stack vertically on mobile
- Hero image scales down proportionally

---

## 11. Agent Quick Reference

```
Background:    #050507
Surface:       #0A0A0F
Accent:        #8B5CF6
Text:          #F5F5F7
Muted:         #8A8A9A
Win:           #22C55E
Loss:          #EF4444
Font:          Satoshi, 800 for headings, 400 for body
Radius:        12px buttons, 16px cards
Spacing:       128px between sections
Animation:     cubic-bezier(0.16, 1, 0.3, 1)
```
