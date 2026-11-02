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
- [ ] Phase 1 design plan — `_planning/תוכנית עיצוב.html` (darkroom palette, Karantina + IBM Plex Sans Hebrew, red grease-pencil circle as the one memorable element), waiting for her approval + the open questions listed at the bottom of the plan
- [ ] Phase 2 build
- [ ] Phase 3 verify
- [ ] Phase 4 deploy

## Local preview

`node _tools/serve.cjs` (Range-capable static server). The Claude desktop preview config lives in
`C:\Users\yoche\Desktop\.claude\launch.json` as `yoch-site`; the app may move it to port 8766, and the script honours `PORT`.
