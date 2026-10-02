# Pin Shot

A pull-pin cocktail concept: a 44 mL shot sealed in the cap drops into the mixer when you pull the ring. This repo holds the concept website, product images and design work. Several friends work on it, most of them new to Git.

## Git workflow: do this on every request

Everyone works directly on `main`. Keep it simple and never lose anyone's work.

1. **Before changing anything:** run `git pull --rebase`. If the working tree has uncommitted changes, commit them first (or stash, pull, then re-apply).
2. **Make the changes** the user asked for.
3. **After the changes:** `git add -A`, commit with a short plain-English message describing what changed, then `git push`.
4. **If the push is rejected** because someone else pushed first: `git pull --rebase`, then push again.
5. **If there's a conflict:** keep both people's work. Read both sides, combine them sensibly, and tell the user in plain words what overlapped and what you kept. Never discard someone else's changes without asking.
6. **Never** force-push, rewrite published history, or delete branches.

Explain Git steps to the user in plain language. They don't need the commands, just what happened (for example "pulled 2 new changes from Sam, then pushed your update").

## Where things are

- `docs/` is the live website, served by GitHub Pages from the `main` branch's `/docs` folder at https://thepinshot.com (custom domain set by `docs/CNAME`; DNS is at GoDaddy; the old https://chaselobo.github.io/Pin-Shot/ link redirects there)
  - `docs/index.html` is the homepage, which is the store preview: pack sizes, mockup prices (single $3.99, six $19.99, twelve $35.99, case of 24 $64.99, sampler 8 $25.99), mix-your-own twelve, cart drawer and a 21+ gate. Prices live in the `PACKS` and `BUNDLES` lists in its script; savings badges, the mix-your-own price and the "from $x a bottle" line are worked out from them. It reuses the bottle cutouts and logo from `docs/waitlist/img/`. Checkout links to the waitlist; nothing is actually sold.
  - `docs/about/index.html` is the concept page (the pull demo, lineup, gallery, FAQ), one file with HTML, CSS and JS. Images are in `docs/img/` (web-sized copies).
  - `docs/shop/index.html` only redirects old `/shop/` links to the homepage.
  - Changes go live about a minute after pushing.
- `docs/waitlist/index.html` is the one-screen waitlist page (no scrolling). Bottles there are transparent PNG cutouts in `docs/waitlist/img/`. Signups only save once `WAITLIST_ENDPOINT` at the top of its script is set to a form service URL (for example Formspree).
- Local preview: `.claude/launch.json` serves `docs/` at http://localhost:8770 (`python3 -m http.server 8770 --directory docs`). The waitlist page reloads itself on localhost when its file changes, so a phone simulator pointed at http://localhost:8770/waitlist/ shows edits live.
- `assets/` holds the full-size product images, named `pin-shot-<flavor>.jpeg` and `pin-shot-group-<scene>.jpeg`. `pin-shot-template.jpeg` is the blank bottle used to make new flavors.
- `output/` holds design and engineering work:
  - `pin-shot-a2-concept/` is the chosen mechanism (A2 Flap-Back Gate): concept sheet, approved mockups, `FLAVOR-PROMPTS.md` and `GEMINI-SHOT-PROMPTS.md` for image generation.
  - `pin-shot-web-directions/` holds the four website branding directions. After Dark was chosen.
  - Older folders are earlier mechanism explorations.

## Brand and site rules

- Website style is **After Dark**: back-bar black, Anton for headlines, Manrope for body, flavor colors used as glows, copper-orange ring color (`#d0703a`) as the pin accent.
- Flavors (in lineup order): Gin & Tonic, VSL (vodka, soda, lime), Moscow Mule, Rum Punch, Paloma, Hard Shirley, Vodka Cran, Whiskey Cola.
- Keep it 21+: no college settings, drinking games or fast-drinking cues. Keep the footer's drink-responsibly line.
- The product is in development. Don't add "buy now" claims; images are renders.
- When adding images to the site, put a web-sized copy (about 800–1800 px wide, JPEG) in `docs/img/` rather than linking the full-size files in `assets/`.
