# Bobert × LG Merch

Source for [bobert-merch.github.io](https://bobert-merch.github.io) — a small, hand-run merch drop for the Light Garden (LG) Valorant Draft Circuit community.

Plain HTML/CSS/JS, no build step, no framework: `index.html` (shop), `feedback.html` (concept voting + feedback form), `about.html` (the story behind the collab), one shared `styles.css`, one shared `site.js`.

## Local preview

```
python -m http.server 8000
```
Then visit `http://localhost:8000/`.

## Deploy

GitHub Pages serves directly from the `main` branch. Push to `main` and the live site updates within a minute or two.

## Maintaining this repo

See [CLAUDE.md](./CLAUDE.md) for the file organization rationale, the cart data model, how to edit products, and the image pipeline.
