// Damped surface motion, independent of rendering and frame rate.
export function createMotion() { return {time:0,x:0,z:0,vx:0,vz:0,energy:0}; }
export function stir(state, x = 1, z = .65) {
  state.vx = Math.max(-1.2, Math.min(1.2, state.vx + x * .65));
  state.vz = Math.max(-1.2, Math.min(1.2, state.vz + z * .65));
  state.energy = Math.min(1, state.energy + .7);
}
export function advance(state, delta, playing = true) {
  if (!playing) return state;
  let remaining = Math.min(.1, Math.max(0, delta));
  while (remaining > 1e-8) {
    const dt = Math.min(remaining, 1 / 240); remaining -= dt;
    state.vx += (-20 * state.x - 2.8 * state.vx) * dt;
    state.vz += (-23 * state.z - 3 * state.vz) * dt;
    state.x += state.vx * dt; state.z += state.vz * dt;
    state.energy *= Math.exp(-1.1 * dt); state.time += dt;
  }
  return state;
}
export function waveAt(state, x, z) {
  const ripple = Math.sin(x * 7 + state.time * 2.8) * Math.cos(z * 6 - state.time * 2.1);
  return Math.max(-.11, Math.min(.11, state.x * x + state.z * z + ripple * (.008 + state.energy * .035)));
}
