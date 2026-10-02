# Pin Shot 3D Studio

Static GitHub Pages route: `/studio/` (https://thepinshot.com/studio/). No backend or build step.

The bottle is rendered in Three.js with separate layers: clear glass, fixed printed artwork, translucent lime soda, rising carbonation, and a clear lid containing a separate shot cup. The original `assets/pin-shot-vsl.jpeg` remains untouched and is copied byte-for-byte as `vsl-source.jpeg`.

The front print is sampled from the original image. A runtime alpha mask retains dark lettering and saturated lime areas while removing the pale photographed drink. The rear print uses the previously generated `vsl-rear-texture.png` with the same background separation. RGB artwork is sampled from those images; the mask is approximate because the source is a flattened product render, not a print production file. Hidden geometry remains inferred. See `tools/rear-texture-prompt.txt` for the rear texture provenance.

The clear lid has no opaque photo wrapped around it. Its inner shot cup, clear spirit, ribs, seals and crown are actual geometry. Softbox reflections reveal the transparent wall and base on both light and dark backgrounds.

The soda is an independent tinted volume with a moving meniscus and 100 instanced bubbles. Dragging or **Swirl soda** adds an impulse to a damped wave model. **Pause liquid** freezes waves and carbonation. Reduced-motion preferences start the liquid paused. This is a bounded visual simulation, not CFD; orbiting the camera does not simulate inverting the bottle under gravity. The artwork stays fixed on the glass.

Drag or touch to orbit; scroll or pinch to zoom. Seven view presets expose the front, quarter, both sides, rear, top and base. Arrow keys rotate, plus/minus zoom and Home resets. **Compare original image** displays the untouched reference. Bottle auto rotation is independently controlled.

`models/pin-shot-vsl.glb` contains all geometry, embedded original/print textures, clear materials, instanced bubbles and a **static liquid pose**. The interactive simulation runs in `liquid-motion.mjs` and `model.js`, not in the GLB. Three.js dependencies are vendored with their license.

## Pin mechanism cutaway

**Show pin cutaway** opens a section through the cap and neck. The A2 reference in `output/pin-shot-a2-concept/README.md` and `a2-concept.html` defines a one-piece pin with a flat sealing paddle clamped between two gaskets. The model includes the paddle, stem, upper/lower gasket rings, exit seal lips and retained flap. The funnel now terminates in an open throat resting on that gate.

**Pull pin** animates withdrawal and draining. Inline and sidebar sliders scrub the same timeline; pause/resume and reset are supported. Flow begins only after the paddle exposes the throat and stops once the shot is empty. The shot is tinted blue in the cutaway for clarity. This explains the unvalidated concept; the seal, carbonation performance and drainage timing are not engineering test results. Returning to the whole bottle restores the original clear spirit and locked pose. The GLB includes the mechanism in its locked pose; animation and labels are website features.

## Preview, export and verify

```sh
python3 -m http.server 8140 --directory docs
```

Open `/studio/` for the viewer, or `/studio/tools/export.html` and click **Export GLB** after editing `model.js`. Save the result to `docs/studio/models/pin-shot-vsl.glb`.

```sh
node docs/studio/tools/check-liquid.mjs
node docs/studio/tools/check-mechanism.mjs
python3 docs/studio/tools/validate-model.py
# Optional automated browser check with Playwright available:
node docs/studio/tools/check-studio.cjs
```

The motion test checks pause, frame-rate independence, bounds under repeated impulses and settling. The offline model validator checks GLB integrity, unchanged original image pixels, source-aligned front UVs, continuous rear UVs, transparent glass/lid/print materials, separate liquid geometry and closed ends. The optional browser check also exercises camera controls, comparison, liquid motion/pause, mobile layout and export. Set `CHROMIUM_EXECUTABLE` to use an installed Chromium browser or `STUDIO_URL` to check another server.
