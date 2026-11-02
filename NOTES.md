# Yoch AI — portfolio site · NOTES

Decisions and what's left, so a new session can pick up. Owner: Yocheved Polonsky (talk to her in Hebrew).
The build brief she pasted (phases 0–4) is the contract: plain HTML/CSS/JS, no build step, GitHub Pages, free only,
never invent results / client names / numbers.

## Phase 0 — interview (answered 2.11.2026)

| # | Topic | Answer |
|---|---|---|
| 1 | Brand | **Yoch AI**, Yocheved Polonsky. Photographer who makes AI videos: ads, brand films, clips, script to finished film. Never type "YAi Studio" as text (the logo image itself is fine). |
| 2 | Audience + action | **Not only small businesses** (her correction): businesses and brands of any size, developers, boutiques; personal films too. One action: **WhatsApp**. Email + Instagram small in the footer. No form, no "send a brief". |
| 3 | Contact | 050-780-0412 (WhatsApp), yocheved1190@gmail.com, @yocheved_polonsky. Prefilled WA text: "היי יוכבד, ראיתי את האתר ואשמח לשמוע על סרטון לעסק שלי." |
| 4 | Language | Hebrew only, full RTL. |
| 5 | Works | Source folder `..\סירטונים סופים\`. Show everything except duplicates. **Where two versions exist, use the one with her logo/signature** (her words: "תשים את זה עם הלוגו"). |
| 6 | Titles | Old 7 keep their approved titles (from `..\תיק עבודות\תיק-עבודות.html`). New ones: drafts in the design plan, waiting for her OK. Featured = shoes ad. |
| 7 | Proof numbers | **None given yet — do not invent.** Asked in the design plan. |
| 8 | Brand assets | Logo: `..\תיק עבודות\לוגו\YAi-studio-white-transparent.png` (white script, 1254², transparent). No colors/fonts → proposed. |
| 9 | Inspiration | None given → researched by me (reference site studied: structure only). |
| 10 | Photo + process | Photo: **still missing**. Process: brief · concept+script (she writes it) · refs+stills for approval · animation · edit+sound · delivery. |
| 11 | Hosting | Free `*.github.io`. No GitHub account info yet. `gh` CLI not installed. |

**Categories (her request, 2.11.2026):** the work grid is split by field: נדל"ן · אופנה וכלות · סרטים וקליפים, etc.
Tabs are generated from `works.json`, so a food tab appears by itself when a food film is added.

## Copy rules carried over from the old portfolio (her words, 13.10.2026)

- No "send a brief" button, no "I'll get back to you with an idea". Contact heading: "אשמח לשמוע מכם."
- No revision count, no list of tools. Length: "כל מה שתצטרכו". Format: "אנכי או לרוחב, לפי הצורך".
- About = she is a photographer and has that eye; no per-shot camera/lens detail.
- Bar mitzvah belongs under "short films and clips", never its own category or a standalone line. Never the word "משפחה" in site copy.
- She creates to the client's wishes, is a partner in the idea, and always writes the script herself.
- Don't state details about a work that you can't see in the film or its production folder.

## Video file map (identified from contact sheets, 2.11.2026)

| Film | File (logo version) | Notes |
|---|---|---|
| Real estate "משרטוט אחד" | `נדלן 2.mp4` | 0:41, text overlays + logo. `נדלן.mp4` = clean version. |
| Cabin (צימר) | `צימר 2.mp4` | 0:27, logo. `צימר.mp4` = clean. |
| Shibro Haifa developer ad | `שבירו חיפה 2.mp4` | 0:36, made from the official renders. Ask before naming Shibro as a client. |
| Bridal | `שמלות כלה 2.mp4` | 0:28, logo at the end. `שמלת כלה .mp4` = clean. |
| NUVELIE boutique | `סירטון אופנה 2.mp4` (burgundy) / `סירטון פירסום אופנה.mp4` (plaid) | both carry the logo. 4K clean masters: `Upscale video  2 ...` (burgundy), `m1rg...` (plaid). |
| Hadas boutique | `seedance_video_1791473614994_b5b4e6ca.mp4` | same template/model/shots as NUVELIE. |
| Shoes, jewelry, chess, tennis, dancer, bar mitzvah | see old portfolio | bar mitzvah 7:12 16:9, jewelry 16:9. |
| Yoch AI self-promo 15 s | `..\תיק עבודות\פרסומת 15 שניות\פרסומת Yoch AI - גרסה 22.mp4` | latest version found. |

## Status

- [x] Phase 0 interview
- [x] Phase 1 design plan — `_planning/תוכנית עיצוב.html` (darkroom palette, Karantina + IBM Plex Sans Hebrew, red grease-pencil circle as the one memorable element). **Approved 2.11.2026** ("מאשרת, תבנה") without answering the open questions, so the plan's defaults stand: headline A, NUVELIE burgundy only (Hadas `hidden`), draft titles, no proof numbers, no client wording, no photo yet.
- [x] Phase 2 build (2.11.2026)
- [x] Phase 3 verify (2.11.2026) — see below
- [x] Phase 4 deploy (2.11.2026) — **live at https://yoch-ai.github.io/**

## Phase 4 — hosting

- GitHub account: she already had one (`yocheved1190`) and renamed it to **`yoch-ai`** herself so the address carries the brand. Repo `yoch-ai/yoch-ai.github.io`, public, Pages from `main` / root (enabled automatically for a `<user>.github.io` repo). Free plan, no subscription.
- Push over HTTPS through Git Credential Manager (her sign-in is cached now). `http.postBuffer` raised for the 170 MB first push. GitHub warns about `barmitzvah/full.mp4` (76 MB > 50 MB recommended) but accepts it (hard limit 100 MB).
- Before the first push the history was rewritten once (nothing had been published) so the bar mitzvah boy's first name, which is in the source file name, appears nowhere in the repo. `works.json` points at that file with `*` in place of the name; `build.cjs` resolves the pattern.
- Live checks: private files (NOTES, README, `assets/data`, `_meta.json`, `_tools`, `_planning`, `.claude`) all 404; Range requests return 206; behaviour checks pass; Lighthouse mobile on the live URL 96 / 100 / 100 / 100.
- To update the site: change files → `node _tools/build.cjs` (or `--html`) → commit → `git push`. Pages republishes in about a minute.
- Custom domain would cost money (yearly domain fee); not set up. If she buys one: Settings → Pages → Custom domain, plus A records 185.199.108–111.153 (apex) or a CNAME to `yoch-ai.github.io` (www), then Enforce HTTPS, and update `site.json → url`.

## Phase 2 decisions

- Works render into `index.html` by `node _tools/build.cjs` (static HTML: crawlable, works from file://, no JS needed to see cards). `works.json` stays the one file she edits.
- Media per work in `assets/media/<id>/`: `preview.mp4` (8 s, 720 long side, no audio, CRF 27 ≤1.2 Mb/s), `hero.mp4` (hero tiles only, 1080), `full.mp4` (with audio, 1080 vertical / 720p wide), `poster.webp` + `poster-lg.webp`, LQIP inlined from `meta.json`.
- Hero tiles: bridal, chess, NUVELIE, zimmer. Her call (round 3): the shoes ad is already the featured film ("הבחירה שלי") and the top had three fashion tiles, so real estate (zimmer, small subtitles only) took its place.
- Fonts self-hosted (Hebrew + Latin subsets, OFL in `assets/fonts/OFL.txt`): moving off Google's CDN took Lighthouse performance from 90 to 96.
- Bar mitzvah `full.mp4` is 76 MB: under GitHub's 100 MB hard limit, over its 50 MB warning. Total media ≈167 MB.
- `_config.yml` keeps NOTES/README/.claude off the published site; `_tools/`, `_planning/` are skipped by Jekyll already.
- Proof strip renders only when `site.json → proof` has entries. Photo slot: `site.json → photo`.
- Canonical / og:url / absolute og:image are written only when `site.json → url` is set (never guess the address).

## Phase 3 results (2.11.2026)

- Playwright (playwright-core + installed Chrome, scratchpad only) screenshots at 390 / 768 / 1440: no console errors, no horizontal scroll. Copies in `_planning/צילומי מסך/`.
- Lighthouse mobile: performance 93–96, accessibility 100, best practices 100, SEO 100 (report in `_planning/צילומי מסך/Lighthouse.html`).
- 25 behaviour checks pass: player opens + plays with sound, Esc / close button / Back close it, focus in and back out, 16:9 wide player, keyboard Enter, tabs filter, WhatsApp prefilled link on all 4 buttons, tel/mail/IG, all film files 200, phone plays ≤2 previews, floating button hidden on hero and at contact, reduced motion = no video loads + no animation + circle drawn, no-JS = all cards visible and link to the film file.
- Bug found and fixed: the global `svg { max-inline-size: 100% }` squeezed the pencil circle and the featured pencil box.
- Art-director pass: weakest section was About (no photo, a poster frame with out-of-context burnt-in text). Fixed once: her signature under the sentence like a signed print, promo poster = its Yoch AI end card.

## Local preview

`node _tools/serve.cjs` (Range-capable static server). The Claude desktop preview config lives in
`C:\Users\yoche\Desktop\.claude\launch.json` as `yoch-site`; the app may move it to port 8766, and the script honours `PORT`.

## Round 2 — her feedback on the live site (2.11.2026)

- "לא אהבתי את בעין של צלמת כל כך גדול" → the second headline line (`.headline-sub`) is now half the size of the first. First line untouched. Share image re-rendered the same way.
- "עמוד של נדל"ן עמוד של אופנה וכו'" → one page per category (`realestate/`, `fashion/`, `films/`; `food/` appears when it has a work), generated by `build.cjs` from `_tools/category-template.html`. Home: the tabbed grid is replaced by one big card per category (cover film from `site.json → categories[].cover`). Header and footer link to every category page; category pages have a switcher + "כל התחומים" back link.
- "על עצמי צריך לכתוב יותר... צלמת שיוצרת גם וידאו ב־AI" → About heading is her wording; two short paragraphs, facts only (photographer, AI video for businesses and brands, builds what's hard to shoot: model, location, a building that doesn't exist yet). No years, no clients. Principles kept.

## Round 3 — same day

- Headline is her wording: **"סרטוני פרסום לעסק וקליפים ב־AI"** (also the page title, og:title and the share image).
- "בעין של צלמת" removed everywhere, and **no pencil circle** around a word ("במיוחד לא לסמן עיגול מסביב לצלמת"). The circle CSS is gone. The red frame around the featured film ("הבחירה שלי") is still there; she has not commented on it.
- New category **פרסומות** (`ads/`): chess ("פרסומת לשולחן שחמט") and tennis ("פרסומת לסטודיו") — her call: they are ads, not short films. Shoes and jewelry stay in fashion. סרטים וקליפים = dancer + bar mitzvah, cover = dancer.
- "את התסריט אני כותבת בעצמי" removed from the hero ("לא צריך בהתחלה"). The About principle "התסריט שלי" stays.
- **Category rule (her words, 2.11.2026):** an ad goes in its field's category when one exists (shoes and jewelry ads stay in אופנה וכלות, a developer ad in נדל"ן). Only an ad with no field category of its own goes in פרסומות (chess table, the studio's own tennis ad).
- Round 3, last: "הבחירה שלי" label and the red pencil frame around the featured film removed at her request. The featured section itself (film, title, text, button) stays. No pencil marks are left anywhere on the site.
