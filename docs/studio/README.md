# Pin Shot 3D Studio

Static GitHub Pages route: `/Pin-Shot/studio/`. No backend or build step.

The VSL bottle uses the **actual approved image**, `assets/pin-shot-vsl.jpeg`, projected onto a full 3D mesh. `vsl-source.jpeg` is a byte-for-byte copy. There is no recreated typography, drawn fruit, replacement liquid, or generative image edit. The bottle and cap silhouettes, extruded hinge/latch, and copper ring are traced in source-image coordinates. The front orthographic camera preserves the image's proportions and artwork. Unlit materials prevent studio lighting or tone mapping from recoloring the original photograph.

The bottle has full depth and can be rotated through 360 degrees. A single image cannot establish the exact depth or hidden surfaces: the back blends the source's side artwork, and glass reflections/transparency are baked into the photograph. It is an image-based visual reconstruction, not a scan or manufacturing model.

Drag or touch to orbit; scroll or pinch to zoom. Buttons provide front, three-quarter, ring side, back, top and base views. The focused viewport accepts arrow keys, plus/minus and Home. Auto rotation starts only when requested. **Compare original image** shows the unchanged photograph at the front camera's matching size and position. Light/dark controls change the background while preserving product colors.

`models/pin-shot-vsl.glb` is a self-contained binary glTF with the source image embedded and unlit materials. Three.js dependencies are vendored with their license. Google Fonts supply page typography only; they do not affect the product.

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

The offline validator checks the GLB, compares every embedded texture pixel against the original photograph (accounting for glTF's vertical texture orientation), verifies the front UV projection, and checks actual 3D depth. The browser check exercises the six camera views, pointer/keyboard rotation, comparison, zoom, auto rotation, backgrounds, mobile overflow, and model export. Set `CHROMIUM_EXECUTABLE` to use an installed Chromium browser or `STUDIO_URL` to check another server.
