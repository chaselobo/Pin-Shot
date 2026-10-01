# Pin Shot 3D Studio

Static GitHub Pages route: `/Pin-Shot/studio/`. No backend or build step.

The VSL bottle is a 3D visual reconstruction of `assets/pin-shot-vsl.jpeg`, with modeled glass, lime soda, lime slices, soda bubbles, a smoky ribbed shot chamber, and copper pull ring. The printed front label uses the site's Anton font. Unseen surfaces are approximated, and dimensions are illustrative rather than engineering specifications.

Drag or touch to orbit; scroll or pinch to zoom. Buttons provide front, ring side, back, top and base views. The focused viewport also accepts arrow keys, plus/minus and Home. Auto rotation starts only when requested. All Three.js dependencies are vendored with their license; the site fonts are loaded from Google Fonts. A reference-image fallback appears if WebGL fails.

`models/pin-shot-vsl.glb` is a self-contained binary glTF with embedded label and lime textures. Edit `model.js`, then regenerate and validate it with:

```sh
python3 -m http.server 8140 --directory docs
# In another terminal, with Playwright available:
node docs/studio/tools/check-studio.cjs
```

Set `CHROMIUM_EXECUTABLE` to use an installed Chromium browser or `STUDIO_URL` to check another server. The check covers camera presets, pointer and keyboard rotation, zoom, animation, lighting, mobile overflow, and embedded model assets. It writes preview screenshots to `/private/tmp/`.
