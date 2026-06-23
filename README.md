# Localism Fund — Round 01 Retrospective (website)

A storytelling retrospective on the twelve Round 01 grantees, organised by grant round. Static, dependency-free: a small Node generator turns JSON data + the design system into plain HTML.

## Run it locally

```bash
cd site
node build.mjs                              # generates dist/
python3 -m http.server 8042 --directory dist
# open http://localhost:8042
```

Rebuild after any data or template change: `node build.mjs` (overwrites `dist/`).

## How it's organised

```
site/
  data/
    round01.json              # cohort copy, ordering, accents, cross-cohort findings
    grantees/<slug>.json      # one story file per grantee (12)
  src/
    styles.css                # design system (brand: forest #1a2b19 · lime #e5e760 · Aquavit)
    app.js                    # scroll-reveal + nav state, no dependencies
  assets/                     # fonts, logo, imagery (copied into dist/)
  build.mjs                   # generator: data + templates -> dist/*.html
  dist/                       # GENERATED output served on localhost (index + 12 project pages)
```

## Editing content

- **A project's story** — edit `data/grantees/<slug>.json` (tagline, whyItMattered, 3 stats, story paragraphs, signature story, delivered, outcomes, honest read, verdict). Rebuild.
- **Round-level copy / order / accent colours** — edit `data/round01.json`.
- **Look & feel** — edit `src/styles.css`. All per-project colour comes from `--accent` set per page.

Each project JSON is generated from that grantee's verified AI evaluation, steward companion, and grantee report under `rounds/01-local-grant-programs/`. Source documents link out (GitHub) from each project page under "the honest read".

## Status

Working draft. The evaluations it draws on are themselves `status: draft`, pending steward review. Imagery is currently the brand stock photo + type-driven per-project identity; real project photos can be dropped into `assets/img/` and wired per grantee.
