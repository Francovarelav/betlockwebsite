# Betlock Website Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Betlock landing page in English with real app screenshots, Awwwards-level animations, Firebase-backed waitlist, and an admin panel to view signups.

**Architecture:** Single React app (Vite + Tailwind v4) with hash-based routing (`/` landing, `#admin` panel). Firebase Firestore stores waitlist emails. Firebase Auth gates the admin panel to `franco@varelta.com` only. No external router dependency.

**Tech Stack:** Vite 8, React 19, Tailwind CSS v4, Firebase (Firestore + Auth)

**Spec:** Design approved in conversation — no separate spec file.

## Global Constraints

- All user-facing copy in English
- Color palette: `#050507` bg, `#8B5CF6` accent, `#F5F5F7` text, `#22C55E` win, `#EF4444` loss
- Font: Satoshi (already loaded via Fontshare)
- Mobile-first, dark theme only
- No additional npm dependencies (Firebase, React, Tailwind already present)
- Firebase project: `betlockapp` (already configured in `src/firebase.js`)

---

### Task 1: Capture Real App Screenshots

**Files:**
- Create: `public/screenshots/home.png`
- Create: `public/screenshots/blackjack.png`
- Create: `public/screenshots/roulette.png`
- Create: `public/screenshots/games.png`
- Create: `public/screenshots/shield.png`

**Interfaces:**
- Produces: PNG screenshots at `public/screenshots/*.png` used by Tasks 3-4

- [ ] **Step 1: Boot iPhone 17 Pro simulator**

```bash
xcrun simctl boot F95728F1-C7EF-4967-8CD2-71216ADAEF65
open -a Simulator
```

- [ ] **Step 2: Build and install BETLOCKAPP**

```bash
cd ~/Desktop/BETLOCKAPP
xcodebuild -scheme BETLOCKAPP -destination 'id=F95728F1-C7EF-4967-8CD2-71216ADAEF65' -derivedDataPath /tmp/betlock-build build 2>&1 | tail -5
```

- [ ] **Step 3: Launch app and navigate to each screen using BL_SCREEN env var**

For each screen (home, blackjack, roulette, games, shield), launch with the appropriate environment variable and capture:

```bash
# Example for home screen:
xcrun simctl launch --terminate-existing F95728F1-C7EF-4967-8CD2-71216ADAEF65 com.betlock.app
sleep 2
xcrun simctl io F95728F1-C7EF-4967-8CD2-71216ADAEF65 screenshot ~/Library/CloudStorage/OneDrive-Personal/betlockwebsite/public/screenshots/home.png
```

Repeat for each screen variant using BL_TAB and BL_SCREEN environment variables documented in the app.

- [ ] **Step 4: Verify screenshots exist and look correct**

```bash
ls -la ~/Library/CloudStorage/OneDrive-Personal/betlockwebsite/public/screenshots/
```

- [ ] **Step 5: Commit**

```bash
cd ~/Library/CloudStorage/OneDrive-Personal/betlockwebsite
git add public/screenshots/
git commit -m "feat: add real app screenshots from iOS simulator"
```

---

### Task 2: Firebase Services Setup (Firestore + Auth)

**Files:**
- Modify: `src/firebase.js`

**Interfaces:**
- Produces: `db` (Firestore instance), `auth` (Auth instance) exports from `src/firebase.js`

- [ ] **Step 1: Add Firestore and Auth exports to firebase.js**

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCML5WbLQ2QwDI0zmVuQuiDd-RnhRgAYhw",
  authDomain: "betlockapp.firebaseapp.com",
  projectId: "betlockapp",
  storageBucket: "betlockapp.firebasestorage.app",
  messagingSenderId: "943260438241",
  appId: "1:943260438241:web:aaf14b9a02b9d7c3b1b1a0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
```

- [ ] **Step 2: Verify dev server still loads without errors**

Open `http://localhost:5173` — no console errors related to Firebase.

- [ ] **Step 3: Commit**

```bash
git add src/firebase.js
git commit -m "feat: add Firestore and Auth exports to firebase config"
```

---

### Task 3: Landing Page Rewrite (English + Awwwards + Real Screenshots)

**Files:**
- Modify: `src/App.jsx` (complete rewrite)
- Modify: `src/index.css` (update animations)
- Modify: `index.html` (English meta tags)

**Interfaces:**
- Consumes: screenshots from `public/screenshots/*.png` (Task 1), `db` from `src/firebase.js` (Task 2)
- Produces: `<App />` component with hash routing — renders landing at `#` (default) and admin at `#admin`

- [ ] **Step 1: Update index.html meta tags to English**

Change `lang="es"` to `lang="en"`, update title to "BETLOCK — Your screentime is your bet", update all OG/Twitter meta to English.

- [ ] **Step 2: Update index.css with enhanced animations**

Add: grain texture overlay keyframes, parallax helper classes, cursor-glow styles, smooth counter animation, enhanced stagger delays (up to 8 children).

- [ ] **Step 3: Rewrite App.jsx — routing shell and shared components**

Create the hash router shell:
```jsx
export default function App() {
  const [route, setRoute] = useState(window.location.hash)
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === '#admin') return <AdminPanel />
  return <Landing />
}
```

Shared components: `Reveal`, `PhoneMockup` (wraps real screenshot `<img>` instead of simulated JSX screens), `GrainOverlay`.

- [ ] **Step 4: Rewrite Landing — Hero section**

Full-viewport hero with:
- Logo icon + wordmark from `/logos/2.png` and `/logos/5.png`
- Badge pill: "Coming soon to iOS"
- H1: "Your screentime\nis your bet" with gradient "bet"
- Subtitle: "Play blackjack with your screen hours.\nWin and use them. Lose and your phone locks."
- CTA: "Join the waitlist" → scrolls to waitlist section
- Real Home screenshot in PhoneMockup with glow
- Cursor-follow glow effect
- Staggered entrance animations

- [ ] **Step 5: Rewrite Landing — How It Works section**

3 steps with icons, connecting line on desktop:
1. "Bet your time" — choose minutes for blackjack, roulette. Your screentime is the currency.
2. "Play and win (or lose)" — win = balance up. Lose = balance down.
3. "Zero balance = locked" — your phone locks for real. No Instagram until you earn your time back.

- [ ] **Step 6: Rewrite Landing — App Showcase section**

Horizontal scroll of real screenshots in PhoneMockup frames:
- Home, Blackjack, Roulette, Shield
- Labels below each
- Parallax subtle on scroll (desktop)

Title: "Not a productivity app. It's a casino."
Subtitle: "The same dopamine that keeps you glued to your phone, but working in your favor."

- [ ] **Step 7: Rewrite Landing — Features bento section**

Alternating text + screenshot rows:
1. "Your time bank" + Home screenshot
2. "Blackjack, roulette and more" + Blackjack screenshot
3. "The lock is real" + Shield screenshot

- [ ] **Step 8: Rewrite Landing — Social Proof section**

Stats grid:
- "4.5 hrs" — Average daily screentime
- "$4.99" — per month, less than a coffee
- "3 days" — free trial

- [ ] **Step 9: Rewrite Landing — Pricing section**

Two cards:
- Annual ($29.99/yr) — highlighted with accent border, "BEST VALUE" badge
- Monthly ($4.99/mo)
Feature checkmarks below.

- [ ] **Step 10: Rewrite Landing — FAQ section**

Accordion with English Q&As:
- Does it really lock my phone?
- Is this real gambling? Is it legal?
- Can I cheat and unlock my apps?
- Does it work on Android?
- Can I lose more time than I have?
- How much does it cost?
- Can I cancel?

- [ ] **Step 11: Rewrite Landing — Waitlist CTA + Form**

Inline email input with "Join the waitlist" button. On submit:
- Save to Firestore collection `waitlist`: `{ email, createdAt: serverTimestamp() }`
- Show success state: "You're in! We'll notify you when we launch."
- Show live waitlist count from Firestore

- [ ] **Step 12: Rewrite Landing — Footer**

Logo, links (Privacy, Terms, Contact, Instagram, TikTok), "Made in Monterrey", copyright 2026.

- [ ] **Step 13: Add grain texture overlay**

Subtle noise/grain SVG filter overlay on the entire page for that premium Awwwards feel.

- [ ] **Step 14: Verify in browser — all sections render, animations work, waitlist submits**

Open `http://localhost:5173`, scroll through all sections, submit a test email, check Firestore.

- [ ] **Step 15: Commit**

```bash
git add src/App.jsx src/index.css index.html
git commit -m "feat: complete English landing page with real screenshots and waitlist"
```

---

### Task 4: Admin Panel

**Files:**
- Create: `src/AdminPanel.jsx`
- Modify: `src/App.jsx` (import AdminPanel)

**Interfaces:**
- Consumes: `auth`, `db` from `src/firebase.js` (Task 2)
- Produces: `<AdminPanel />` component rendered at `#admin` route

- [ ] **Step 1: Create AdminPanel.jsx — Login screen**

```jsx
// When not authenticated: centered login form
// Email + password fields, "Sign In" button
// Uses signInWithEmailAndPassword(auth, email, password)
// On auth, checks if user.email === 'franco@varelta.com'
// If not, signs out and shows error
```

- [ ] **Step 2: Create AdminPanel.jsx — Dashboard (authenticated)**

```jsx
// Header: "BETLOCK Admin" + logout button
// Stats row: Total signups, Today's signups, This week
// Table: email | date joined | actions
// Fetches from Firestore collection 'waitlist' ordered by createdAt desc
// Pagination: 50 per page
```

- [ ] **Step 3: Add CSV export button**

Button that fetches all waitlist docs from Firestore, converts to CSV, and triggers browser download.

- [ ] **Step 4: Import AdminPanel in App.jsx router**

The hash router in App.jsx already routes `#admin` to `<AdminPanel />`.

- [ ] **Step 5: Verify admin panel — login, view data, export CSV**

Navigate to `http://localhost:5173/#admin`, login with `franco@varelta.com`, verify waitlist data shows.

- [ ] **Step 6: Commit**

```bash
git add src/AdminPanel.jsx src/App.jsx
git commit -m "feat: admin panel with Firebase Auth and waitlist dashboard"
```

---

### Task 5: Final Polish and Verification

**Files:**
- Possibly modify: `src/App.jsx`, `src/index.css`

- [ ] **Step 1: Responsive check — mobile, tablet, desktop**

Check all breakpoints in browser DevTools. Fix any overflow or layout issues.

- [ ] **Step 2: Performance check**

Ensure images are reasonable size (<500KB each), lazy-load below-fold screenshots.

- [ ] **Step 3: Accessibility basics**

Alt text on all images, focus states on interactive elements, reduced-motion support.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: responsive polish and accessibility improvements"
```
