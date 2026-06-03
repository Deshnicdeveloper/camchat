# CamChat — Animated System Presentation (HTML)

A self-contained, animated slide deck built on **reveal.js**, covering the
**entire CamChat system** as defined in `SOFTWARE_REQUIREMENTS_SPECIFICATION_v2.docx`
(not just the mobile app). It uses real motion (entrance builds, SVG line-draw
diagrams, count-up metrics, flowing connectors), **inline SVG icons only — no emojis**,
and embeds optimized screenshots of the actual app screens.

## Open it

Everything is local — no internet required.

```bash
# from this folder:
python3 -m http.server 8088
# then open http://localhost:8088 in any browser
```

Or simply open `index.html` directly in a browser (Chrome/Edge/Firefox/Safari).

### Presenting
- **Arrow keys / Space** — next / previous slide
- **F** — fullscreen · **Esc / O** — slide overview · **S** — speaker view
- **?** — keyboard help

### Export to PDF
Open with `?print-pdf` appended to the URL, then use the browser's *Print → Save as PDF*
(A4/Letter, Landscape, background graphics ON):

```
http://localhost:8088/?print-pdf
```

## What's inside (19 slides)
1. Title · 2. Agenda · 3. Introduction (purpose & scope) ·
4. **System architecture** (BaaS perspective) · 5. User classes ·
6. **Use Case diagram** · 7. Functional requirements overview ·
8. Authentication · 9. Messaging · 10. Groups & Status · 11. Calls ·
12. Settings / i18n / Dark mode · 13. **Class diagram (UML)** ·
14. Firestore data model · 15. External interfaces ·
16. Non-functional requirements · 17. Tech stack · 18. Design system · 19. Closing.

## Structure
```
deck/
├── index.html            # entry point + SVG icon sprite
├── assets/
│   ├── theme.css          # custom Egyptian-Blue theme + animations
│   ├── slides.js          # all slide content + SVG diagrams
│   ├── deck.js            # reveal init, replayable animations, count-up
│   └── shots/             # optimized app screenshots (.jpg)
└── vendor/reveal/         # vendored reveal.js 5 (offline)
```

## Regenerating screenshots
Source PNGs live in `../` (the `presentation/` folder). To re-optimize:

```bash
bash optimize-shots.sh
```
