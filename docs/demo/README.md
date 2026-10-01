# Standalone Pin Shot demo

Endpoint: `/Pin-Shot/demo/`. The existing `/Pin-Shot/studio/` stays unchanged.

A minimal full-viewport viewer. It opens on the sealed A2 pin cutaway and offers Bottle / Inside cap modes, pull/pause/replay/reset, sequence scrubbing, orbit/pinch zoom, and soda swirl/pause. A small link returns to the full studio. The mechanism remains a concept illustration, with blue tint identifying clear spirit.

`demo.js` imports the existing studio model, lighting and OrbitControls. It does not copy or alter the model assets. The GLB is not fetched by the viewer. Mobile layout uses dynamic viewport height, safe-area padding, touch controls, and a compact landscape layout. The camera expands its framing as the pin is withdrawn. Coarse-pointer devices cap rendering at 30 fps and device pixel ratio at 1.5; paused scenes stop redrawing when the camera settles, and hidden tabs stop the animation loop. Reduced-motion users start with soda animation paused.

Preview with the existing static server: `python3 -m http.server 8140 --directory docs`, then open `/demo/`.

Verified layouts: 390 × 844, 320 × 568, 844 × 390, and desktop. Browser checks cover pull completion, scrubbing/reset, switching modes and liquid pause. Existing studio source is deliberately untouched. Bump the local `?v=` references when publishing future changes to demo CSS/JS.
