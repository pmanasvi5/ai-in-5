# AI in 5

**Your daily 5-minute AI catch-up.**

Every day, AI in 5 collects real AI news from public RSS feeds, picks the five
most important, distinct stories, and explains each one in five short,
plain-English bullet points — plus one new AI term to learn. It's a free,
installable web app (PWA) built on a strict $0 budget: no paid APIs, no paid
hosting, no accounts.

---

## What is AI in 5?

AI is moving fast, and most coverage is either too technical, too long, or
scattered across a dozen sites. AI in 5 is a five-minute daily briefing for
people who want to stay informed about AI without needing a technical
background — students, professionals, or anyone curious. It also includes a
**Learn AI** glossary that gently builds your AI vocabulary over time, one
term at a time, with no repeats once you've learned something.

## Features

- **Today** — the daily digest: up to 5 real stories, each with 5 plain-English
  bullets, a "Why it matters" line, category, source, publish date, and a link
  to the original article. Cards expand/collapse, and tapping a bolded term
  (like *AI Agent*) shows its glossary definition inline.
- **Learn AI** — an AI Term of the Day with a **Got it! ✓** button, a 44-term
  searchable glossary, a learning-progress tracker, a Learned Terms library,
  and **Review Again** to bring a learned term back into rotation. Once you
  mark a term learned, it never appears as the featured term again until you
  explicitly review it again — this works across refreshes, restarts, and
  new glossary terms being added later.
- **Saved** — bookmark any story to read again later.
- **Archive** — browse and reopen any previous day's digest.
- **Light & dark mode**, adjustable text size, and full offline support for
  whatever was last successfully loaded.
- **Installable** on iPhone, macOS, and Windows as a standalone app (no app
  store) — see the in-app Install button (top-right download icon) or the
  instructions below.
- **No accounts, no API keys for users.** All personalization (learning
  progress, bookmarks, preferences) lives in your browser's `localStorage`
  and can be exported/imported as a JSON backup.

## Technology stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS | Fast dev loop, small production bundle, strong typing for a data-shaped app like this. |
| Icons | lucide-react | Free, consistent icon set. |
| Routing | react-router-dom (`HashRouter`) | Hash-based routing works correctly on GitHub Pages' static hosting without extra server config or 404 redirects. |
| News pipeline | Python (`feedparser`, `requests`) | Simple, dependency-light RSS fetching and parsing. |
| Summarization | Gemini API free tier (optional) **or** a built-in non-generative extractive summarizer | Zero-cost by default; Gemini is opt-in via a repo secret. Never fabricates — see below. |
| Hosting | GitHub Pages | Free static hosting for a public repo. |
| Automation | GitHub Actions (scheduled + manual) | Free compute minutes for public repos; runs the pipeline and deploys daily. |
| User data | `localStorage` | No backend, no database, no accounts needed. |

## Local setup

Requirements: Node.js 18+ and Python 3.10+.

```bash
cd ai-in-5
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL. The dev server reads from
`public/data/*.json`, which already ships with a real digest and the full
glossary, so the app works immediately without running the pipeline.

To regenerate the digest from live news yourself:

```bash
pip install -r requirements.txt
python3 scripts/generate_digest.py
```

This fetches real RSS feeds, dedupes and ranks stories, summarizes them, and
writes `public/data/latest.json`, `public/data/archive/<date>.json`, and
`public/data/archive-index.json`.

Run the test suites:

```bash
npm test                              # TypeScript unit tests (vitest)
python3 tests/test_pipeline.py -v     # Python pipeline tests
```

Type-check and build:

```bash
npx tsc -b --noEmit
npm run build      # outputs to dist/
```

## The news pipeline

`scripts/generate_digest.py` orchestrates five stages, each its own script:

1. **`fetch_news.py`** — pulls real articles from 7 public RSS feeds: OpenAI,
   Google DeepMind, Google's AI blog, The Verge, TechCrunch, MIT Technology
   Review, and WIRED. A feed that times out or errors is skipped (logged to
   stderr) rather than failing the whole run.
2. **`normalize_news.py`** — filters to AI-relevant, recently-published
   articles (last 48 hours, widened only if that's too few), and
   **deduplicates** stories covered by multiple outlets (keeping the
   highest-credibility source), then tags each story's category and any
   glossary terms it mentions.
3. **`rank_stories.py`** — scores remaining candidates on recency, source
   credibility, impact keywords, multi-outlet corroboration, and how much
   real detail is available to summarize — then picks up to 5, favoring
   **category diversity** so one topic doesn't dominate the digest.
4. **`summarize_news.py`** — turns each selected article into exactly 5
   bullets + a "why it matters" line (see **Summarization** below).
5. **`generate_digest.py`** — assembles the final `DailyDigest` JSON, writes
   it to `latest.json` and a dated archive file, and updates the archive
   index. If anything fails or produces too little real content, it **keeps
   the last successful digest** (marked `stale`) instead of overwriting it
   with empty or fabricated content — the app shows this honestly in the UI.

## Summarization: how it avoids fabricating

Every bullet point is grounded in real, fetched article text. Two paths:

1. **Gemini (optional)** — if `GEMINI_API_KEY` is set, the pipeline calls the
   Gemini API free tier with the article's actual headline and fetched text,
   explicitly instructing the model to use *only* that material and to
   return an empty result rather than guess if there isn't enough
   information. Output is validated (exactly 5 non-empty bullets + a
   non-empty "why it matters" line) before being accepted.
2. **Extractive fallback (default, no API, no cost)** — pulls real sentences
   directly out of the fetched article text, filters out newsletter/CTA
   boilerplate ("sign up here", etc.), and composes them into bullets. If
   there isn't enough real source text to build a genuinely useful set of
   bullets, **the story is rejected** rather than padded with invented
   details — the digest will simply show fewer than 5 stories that day
   rather than make something up.

Because most public RSS feeds only include a short snippet (not the full
article), the extractive fallback produces good but not exhaustive summaries.
Adding a Gemini API key (still free-tier, still $0) improves bullet quality
without changing any of these grounding guarantees.

## API setup (optional)

The app works fully without this. To enable Gemini-based summaries:

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. In your GitHub repo: **Settings → Secrets and variables → Actions → New
   repository secret**, name it `GEMINI_API_KEY`, and paste the key.
3. That's it — the next scheduled or manual workflow run will use it
   automatically, and will fall back safely if the key is missing, invalid,
   or rate-limited.

For local testing, copy `.env.example` to `.env`, fill in the key, and
`export $(grep -v '^#' .env | xargs)` before running `generate_digest.py`.

## Deploying to GitHub Pages

1. Create a new **public** GitHub repository (GitHub Pages' free tier
   requires a public repo, or GitHub Pro/Team for private-repo Pages).
2. Push this project to it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
4. If your repository name isn't `ai-in-5`, update the `base` path in
   `vite.config.ts` and the `start_url`/`scope`/`id` in the same file's
   `manifest` block to match (e.g. `/your-repo-name/`).
5. Push to `main` (or use **Actions → Update digest and deploy → Run
   workflow** to trigger it manually). The workflow builds and deploys to
   `https://<you>.github.io/<repo>/`.

## Automatic daily updates

`.github/workflows/update-and-deploy.yml` runs on a daily schedule
(`cron: '0 11 * * *'`, targeting roughly 6–7am America/New_York — GitHub
Actions cron doesn't account for daylight saving, so the exact minute drifts
with EST/EDT; the app always shows the real last-updated time rather than
promising an exact one). It:

1. Runs the full news pipeline and commits any resulting change to
   `public/data/`.
2. Builds the frontend and deploys it to GitHub Pages — in the *same*
   workflow run, not a second workflow triggered by that commit (GitHub's
   default token doesn't trigger other workflows anyway, which avoids any
   loop).

You can also trigger it manually any time from the **Actions** tab
(**workflow_dispatch**) for testing or troubleshooting.

## Installing the app

### iPhone (Safari)
1. Open the site in Safari.
2. Tap the Share icon, then **Add to Home Screen**.
3. Tap Add — the icon appears on your home screen and opens standalone.

### macOS (Safari)
1. Open the site in Safari.
2. **File → Add to Dock** (on Safari versions that support it).

### Windows (Edge or Chrome)
1. Open the site in Edge or Chrome.
2. Click the install icon in the address bar, or **menu → Apps → Install
   this site as an app**.

These same instructions are also built into the app (tap the download icon
in the header).

AI in 5 is distributed only as a web app — it is **not** listed in the Apple
App Store or Microsoft Store.

## Troubleshooting

- **The digest looks stale / didn't update.** Check the **Actions** tab for
  the latest `Update digest and deploy` run. If the pipeline found too few
  qualifying stories, it intentionally keeps the previous digest rather than
  publishing something thin or fabricated — this is expected behavior, not
  a bug.
- **A feed looks empty.** Some sites rate-limit or temporarily block
  automated requests. The pipeline logs a `[skip]` line per failed source to
  the workflow's logs and continues with the rest; it doesn't fail the whole
  run.
- **Gemini summaries aren't showing up.** Confirm the `GEMINI_API_KEY`
  secret is set in the repo (not just locally), and check the workflow logs
  for a `[gemini]` line explaining why it fell back.
- **PWA won't install / icon looks wrong.** Make sure `vite.config.ts`'s
  `base` and the manifest's `start_url`/`scope`/`id` match your actual repo
  name, then rebuild. Browsers cache manifests aggressively — try a hard
  refresh or reinstalling.

## Customization

- **Colors / fonts** — `tailwind.config.js` (color tokens) and the Google
  Fonts `<link>` in `index.html`.
- **Logo** — `src/components/Logo.tsx` (inline SVG) and
  `scripts/generate_icons.py` (PWA icon generator; rerun it after editing).
- **News sources** — the `SOURCES` list in `scripts/common.py`.
- **AI model for summaries** — `GEMINI_MODEL` env var (see `.env.example`);
  defaults to a free-tier model.
- **Glossary terms** — `public/data/glossary.json`, a plain array; add an
  entry with a unique `id` and the app picks it up automatically.
- **Update schedule** — the `cron` line in
  `.github/workflows/update-and-deploy.yml`.
- **App name / tagline** — `index.html` `<title>`, `vite.config.ts` manifest
  fields, and the copy in `src/pages/TodayPage.tsx`.
- **Navigation** — `DESTINATIONS` in `src/components/Navigation.tsx`.

## Free-tier limitations

- **GitHub Pages**: free for public repositories; 1 GB storage, 100 GB/month
  bandwidth soft limits — far more than a small JSON-driven app like this
  needs.
- **GitHub Actions**: public repositories get unlimited free minutes on
  standard runners; private repos get a limited free monthly quota.
- **Gemini API free tier**: subject to Google's own rate limits and quota,
  which can change; the app is designed to keep working (via the extractive
  fallback) if a request is throttled or the key is removed.
- **RSS feeds**: some publishers occasionally rate-limit or block automated
  requests; the pipeline treats this as a per-source failure, not a
  pipeline failure.
- **localStorage**: typically a few MB per browser/device, which is more
  than enough for bookmarks and learning progress, but it is per-device —
  use the Export/Import buttons on the Learn AI page to move progress
  between devices.

## Project structure

```
ai-in-5/
  .github/workflows/update-and-deploy.yml   # daily pipeline + deploy
  public/
    icons/                                  # generated PWA icons
    data/
      latest.json, glossary.json,
      archive-index.json, archive/*.json
  src/
    components/   pages/   hooks/   utils/   types/
  scripts/
    common.py fetch_news.py normalize_news.py
    rank_stories.py summarize_news.py generate_digest.py
    generate_icons.py
  tests/
    *.test.ts (vitest)   test_pipeline.py (unittest)
  requirements.txt   package.json   vite.config.ts
```

## What's been tested, and what to verify yourself

**Tested in this environment:**
production build (`npm run build`), type-checking (zero errors), unit tests
(18 passing: 7 TS + 11 Python), the live pipeline run against real RSS feeds,
manifest/icon validity, and manual browser testing of the Today/Learn
AI/Saved/Archive pages, Got it!/Review Again, bookmarking, light/dark mode,
mobile (375px) and desktop layouts, and the install-instructions modal.

**Needs verification on your end** (this environment has no GitHub account
or real device access):
- Actually deploying to GitHub Pages and confirming the scheduled workflow
  runs successfully with real repo secrets.
- Installing on a real iPhone, Mac, and Windows machine — the PWA manifest
  and service worker are valid and build correctly, but installability can
  only be fully confirmed on real devices/browsers.
- Gemini API behavior with a real key (the fallback path is what's been
  exercised here, since no key was available in this environment).
