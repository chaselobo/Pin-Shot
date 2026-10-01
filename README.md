# Pin Shot

Pull the pin. The shot's already in it.

Pin Shot is a single-serve cocktail with a full 44 mL shot sealed in the cap. Pull the ring and the shot drops into the mixer below. This repo holds the website, the product images and all the design work behind it.

## Pages

### Live website

These are on GitHub Pages and update about a minute after a push. Anyone with the link can open them.

| Page | Link | File | What it's for |
|---|---|---|---|
| **Home** | [chaselobo.github.io/Pin-Shot](https://chaselobo.github.io/Pin-Shot/) | `docs/index.html` | The main brand site in the After Dark style. Opening section over the bar photo, a live demo where you drag the ring to pull the pin, the eight-flavor lineup, a gallery and an FAQ. Use it to explain what Pin Shot is and how the pull works. |
| **Waitlist** | [/waitlist/](https://chaselobo.github.io/Pin-Shot/waitlist/) | `docs/waitlist/index.html` | A one-screen launch page with no scrolling. The flavors rotate on a bar top (swipe to change, auto-slides after 5 seconds) above a join-the-waitlist form with a 21+ checkbox. Use it to collect signups before launch. **The form doesn't save emails yet.** It needs a form service URL such as Formspree set in `WAITLIST_ENDPOINT`. |
| **Shop preview** | [/shop/](https://chaselobo.github.io/Pin-Shot/shop/) | `docs/shop/index.html` | A mockup store to get a feel for selling. It has a 21+ gate, pack sizes (single, six, twelve, case of 24), mockup prices, a build-your-own twelve, ready-made boxes and a cart. Nothing is for sale; checkout points to the waitlist. |
| **3D Studio** | [/studio/](https://chaselobo.github.io/Pin-Shot/studio/) | `docs/studio/index.html` | An interactive 3D model of the VSL bottle. Rotate and zoom, view every side, swirl the soda, switch lighting and backgrounds, compare against the original render, and download the GLB model. More detail in `docs/studio/README.md`. |
| **Studio export tool** | [/studio/tools/export.html](https://chaselobo.github.io/Pin-Shot/studio/tools/export.html) | `docs/studio/tools/export.html` | A behind-the-scenes tool, not for visitors. It re-exports the 3D bottle as a `.glb` file after someone edits the model. |

### Design and planning pages

These live in `output/` and aren't on the website. Open them by double-clicking the file on your computer.

| Page | File | What it's for |
|---|---|---|
| **First mechanism ideas** | `output/pin-shot-mechanics/mechanics.html` | The first three ways the pull could work (Gate Pin, Peel Strip, Pull & Slam), each as an animated cutaway with pros, cons and a comparison. |
| **Gate pin variants** | `output/pin-shot-gate-variants/gate-variants.html` | The drink-through version of the gate pin, where you drink through the empty shot cup. A base design plus three add-ons: Flap-Back, Hiss Notch and Balanced Vent. Also explains why carbonation makes the pull stiff. |
| **A2 concept sheet** | `output/pin-shot-a2-concept/a2-concept.html` | The full concept for the chosen mechanism, A2 Flap-Back Gate. Animated cutaway with a gate close-up, how it's used, the parts and materials, key dimensions, how it gets filled in a factory, and the risks to bench-test. |
| **Website branding directions** | `output/pin-shot-web-directions/directions.html` | The four website looks we considered (Field Manual, After Dark, Cooler Pop, Clear Glass). After Dark was picked. |

### Notes and prompts

| File | What it's for |
|---|---|
| `output/pin-shot-a2-concept/README.md` | Notes on the approved bottle look and the edits that produced it. |
| `output/pin-shot-a2-concept/FLAVOR-PROMPTS.md` | Image-generation prompts for every flavor, starting from the blank template bottle. |
| `output/pin-shot-a2-concept/GEMINI-SHOT-PROMPTS.md` | Prompts for extra angles, opened bottles and group photos. |
| `assets/logo/README.md` | Notes on the logo files, black and white versions. |
| `docs/studio/README.md` | How the 3D Studio is built, exported and checked. |
| `CLAUDE.md` | Instructions Claude follows in this project: the pull-then-push routine, where things are, and the brand rules. |

## Working on this with Claude Code (easiest)

1. Get access: ask Chase to add you as a collaborator on this repo.
2. Copy the project to your computer once. In Claude Code, say:
   > Clone https://github.com/chaselobo/Pin-Shot.git into my Documents folder
3. Open that folder in Claude Code and just ask for what you want changed.

Claude reads `CLAUDE.md` and handles Git for you every time: it **pulls** everyone's latest changes before editing, then **pushes** your changes when it's done. The live site updates about a minute after a push.

To see changes before they go live, ask Claude to start the local preview. It serves the site at http://localhost:8770, and the waitlist and shop pages reload themselves as files change, including in the iPhone simulator.

## Working without Claude

Use [GitHub Desktop](https://desktop.github.com/). The routine is the same:

1. Click **Fetch / Pull origin** before you start.
2. Make your changes.
3. Write a short summary, click **Commit to main**, then **Push origin**.

## What's in here

| Folder | What it holds |
|---|---|
| `docs/` | The live website: home page, `waitlist/`, `shop/` and `studio/`. Web-sized images are in `docs/img/` and `docs/waitlist/img/`. |
| `assets/` | Full-size product renders for every flavor, group shots, the blank template bottle, and the logo in `assets/logo/`. |
| `output/` | Mechanism concepts, the A2 concept sheet, branding directions and image-generation prompts. |
