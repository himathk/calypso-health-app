<p align="center">
  <img src="public/icons/icon-192.png" width="96" alt="Calypso logo" />
</p>

<h1 align="center">Calypso</h1>
<p align="center"><b>The calorie coach that knows your 9-to-5.</b><br/>Snap your food, hit your deficit, and keep moving through the workday.</p>

---

Calypso is an installable, offline-capable, heavily animated web app for losing weight without
losing your mind. It works out the calorie deficit you should run, recognises food (and its
calories) from a photo, and nudges you through the workday — water, a walk every 30 minutes,
lunch on time — then relaxes on evenings and days off.

## Why a web app (PWA), not a native app

| Need | How a PWA covers it |
| --- | --- |
| Reminders during a 9-to-5 | You're at a computer all day — Calypso runs in a browser tab or as an installed desktop app, which is exactly where reminders are reliable. |
| Snap food on the go | Installs to the phone home screen (Android & iOS 16.4+), opens the camera, works full-screen and offline. |
| One codebase, no app store | Ship updates instantly; nothing to review or download. |

The trade-off: browsers pause web apps that are fully closed, so phone reminders only fire while
Calypso is open or recently backgrounded. If you need guaranteed lock-screen alarms, the app can
be wrapped with Capacitor (local notifications) later without rewriting the UI — see the roadmap.

## Features

- **Personal plan** — onboarding builds your profile, then calculates BMR (Mifflin–St Jeor), TDEE,
  a safe daily deficit for the pace you choose, macros, a water goal and your projected goal date.
  Safety rails: pace is capped at ~1 % of body weight per week and intake never drops below
  1,200 kcal (women) / 1,500 kcal (men).
- **Photo → calories** — snap or upload a meal; Claude's vision model identifies each item,
  estimates portions (including hidden oils and sauces), and returns calories and macros. Adjust
  portions (½× … 2×), untick items, then log. Includes a "lighter swap" tip.
- **Schedule-aware reminders** — work days get water every 60 min, a move break every 30 min
  (skipping lunch), lunch on time, an afternoon-snack window, an end-of-day walk and a "kitchen
  closing" nudge. Days off get relaxed water/meal reminders and a walk. Nothing fires while you
  sleep. Reminders can be completed with one tap ("Drank 250 ml", "Did it") or snoozed, both
  in-app and from OS notifications.
- **Activity logging** — 25 activities with MET-based active-calorie estimates (intensity aware);
  a share of what you burn is added back to the day's budget (configurable).
- **Progress** — animated weight trend with goal line and projection, 7-day calories vs target,
  streaks, weekly deficit, and 14 unlockable achievements.
- **Menus** — 40+ curated meal ideas tagged *cook*, *no-cook* or *buy it* (with ordering tips),
  ranked to fit what's left of your budget, plus a one-tap "plan my whole day" generator.
- **Food search & quick add** — 115+ common foods (international and South Asian staples).
- **Heavily animated** — aurora background that shifts with the time of day, animated rings,
  a liquid water glass, spring physics, shared-layout transitions, a photo scanning sequence,
  confetti and achievement pop-ups. Respects "reduce motion".
- **Private by default** — everything is stored on the device (IndexedDB). Export/import backups.
- Dark & light themes, metric & imperial units, 12/24-hour clock.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

### Turn on AI food recognition

Choose one:

1. **Server key (recommended for deployments)** — create `.env.local`:

   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   `npm run dev` / `npm run preview` serve `POST /api/analyze-food` with that key, and so does
   the Vercel function in `api/` once the variable is set in the project settings.

2. **Personal key** — open *Profile → AI food scanner* and paste your key. It's stored only in
   that browser and sent only to `api.anthropic.com`. Handy for static hosting.

Without either, snapping a photo shows a setup card and search/quick-add still work.

### Other scripts

```bash
npm run build        # typecheck + production build (with service worker)
npm run preview      # serve the production build locally
npm test             # unit tests (calorie maths, scheduling, recommendations, AI parsing)
```

## Deploy

**Vercel**: import the repo, set `ANTHROPIC_API_KEY`, deploy. `vercel.json` configures the
function timeout. Any static host also works (Netlify, GitHub Pages, Cloudflare Pages) — use the
personal-key option for AI there.

## How the numbers work

| Step | Formula |
| --- | --- |
| BMR | 10 × kg + 6.25 × cm − 5 × age + 5 (men) / −161 (women) |
| TDEE | BMR × activity multiplier (1.2 desk-bound … 1.9 athlete) |
| Deficit | pace (kg/week) × 7,700 kcal ÷ 7 |
| Target | TDEE − deficit, never below 1,200 / 1,500 kcal |
| Budget today | Target + (logged active kcal × eat-back %, default 50 %) |
| Activity | (MET × intensity − 1) × kg × hours (active calories only) |
| Protein | 2 g per kg of goal weight (≤ 40 % of calories); fat 28 %; carbs the rest |

Estimates, not medical advice.

## Project structure

```
api/analyze-food.ts        Vercel function → server/analyzeFood.ts
server/                    Framework-agnostic handler + Vite dev/preview middleware
src/lib/foodAi/            Shared Claude request/response code, browser client
src/lib/nutrition.ts       BMR/TDEE/deficit/macros
src/lib/schedule.ts        Day modes and reminder generation
src/lib/recommend.ts       Meal ranking and day planner
src/data/                  Foods, meal ideas, activities (MET values)
src/screens/               Onboarding, Today, Food logger, Menus, Move, Progress, Profile
src/components/            Animated building blocks (rings, water glass, charts, sheets…)
src/sw.ts                  Service worker: offline cache + notification actions
```

## Roadmap ideas

- Capacitor wrapper for native lock-screen reminders and step counting (Health Connect / HealthKit)
- Barcode scanning for packaged food
- Optional account + cloud sync across phone and work computer
- AI-generated menus from what's in your fridge
- Weekly email/Slack summary
