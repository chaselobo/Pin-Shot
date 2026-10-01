# Pin Shot 3D Studio

Static GitHub Pages route: `/Pin-Shot/studio/`. No backend or build step.

The VSL bottle preserves the central front artwork from **the actual approved image**, `assets/pin-shot-vsl.jpeg`. `vsl-source.jpeg` is a byte-for-byte copy. A feathered front projection preserves the typography and central artwork. The side/rear surface uses a continuous cylindrical wrap (`vsl-rear-texture.png`) generated from the reference using the built-in imagegen tool. See `tools/rear-texture-prompt.txt` for the generation prompt.

The reconstructed cap has a smooth closed crown, grip ribs and molded seams. The recessed glass underside and circular contact ring have independent geometry and materials. Neither pole stretches the source photograph. Copper hardware uses the photographed front and a separate copper rear material.

The bottle has full depth and rotates through 360 degrees. A single image cannot establish exact depth or hidden surfaces. These are inferred, including the generated rear texture; this is a visual reconstruction, not a scan or manufacturing model. Source-image reflections remain baked into the front. Studio lights illuminate the newly modeled surfaces without recoloring the unlit front artwork.

Drag or touch to orbit; scroll or pinch to zoom. Buttons provide front, three-quarter, ring side, left side, back, top and base views. The focused viewport accepts arrow keys, plus/minus and Home. Auto rotation starts only when requested. **Compare original image** shows the unchanged photograph at the front camera's matching size and position. Light/dark controls change the background while preserving product colors.

`models/pin-shot-vsl.glb` is a self-contained binary glTF with both images embedded, unlit artwork and physical materials for the reconstructed surfaces. Three.js dependencies are vendored with their license. Google Fonts supply page typography only; they do not affect the product.

## Preview, export and verify

```sh
python3 -m http.server 8140 --directory docs
```

Open `/studio/` for the viewer, or `/studio/tools/export.html` and click **Export GLB** after editing `model.js`. Save the result to `docs/studio/models/pin-shot-vsl.glb`.

```sh
python3 docs/studio/tools/validate-model.py
# Optional automated browser check with Playwright available:
node docs/studio/tools/check-studio.cjs
```

The offline validator checks the GLB, compares the embedded source-image texture against the original photograph (accounting for glTF's vertical texture orientation), verifies the front UV projection, checks actual 3D depth, monotonic wrap UVs and separate untextured end surfaces. The browser check exercises the seven camera views, pointer/keyboard rotation, comparison, zoom, auto rotation, backgrounds, mobile overflow, and model export. Set `CHROMIUM_EXECUTABLE` to use an installed Chromium browser or `STUDIO_URL` to check another server.
