# Pin Shot

Pull the pin. The shot's already in it.

**Live site:** https://chaselobo.github.io/Pin-Shot/

**Waitlist:** https://chaselobo.github.io/Pin-Shot/waitlist/ — single-screen launch page with the flavors rotating on a bar top and a join-the-waitlist form.

**3D Studio:** https://chaselobo.github.io/Pin-Shot/studio/ — rotate and zoom the VSL bottle, inspect every side, switch backgrounds, or download the self-contained GLB model.

## Working on this with Claude Code (easiest)

1. Get access: ask Chase to add you as a collaborator on this repo.
2. Copy the project to your computer once. In Claude Code, say:
   > Clone https://github.com/chaselobo/Pin-Shot.git into my Documents folder
3. Open that folder in Claude Code and just ask for what you want changed.

Claude reads `CLAUDE.md` and handles Git for you every time: it **pulls** everyone's latest changes before editing, then **pushes** your changes when it's done. The live site updates about a minute after a push.

## Working without Claude

Use [GitHub Desktop](https://desktop.github.com/). The routine is the same:

1. Click **Fetch / Pull origin** before you start.
2. Make your changes.
3. Write a short summary, click **Commit to main**, then **Push origin**.

## What's in here

| Folder | What it holds |
|---|---|
| `docs/` | The website. `docs/index.html` is the whole page, `docs/img/` its images. |
| `assets/` | Full-size product renders for every flavor, group shots and the blank template bottle. |
| `output/` | Mechanism concepts, branding directions and image-generation prompts. |
