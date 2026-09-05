/**
 * The hero crow's scroll dissolve.
 *
 * Scrolling blows the bird apart: the vertex shader in CrowScene moves every
 * particle `uScroll^2 * SCROLL_EASE_K * SCROLL_EXPLODE` mesh widths outward,
 * where uScroll is the page's own scroll progress. That is a dispersion, not a
 * disappearance — the shader's alpha fade is calibrated to the whole page and
 * has barely started while the cloud is already uniform.
 *
 * A uniform field is the one thing the canvas's mask cannot sit on. Its ramp is
 * invisible against the tail because the tail is structured and thins out on its
 * own; against an even spread of dots the same ramp reads as a band with a wall
 * at its foot. So the layer's opacity tracks the spread instead: full while the
 * bird is still a bird, gone by the time it is a cloud, and the mask never has a
 * uniform field to be seen against.
 *
 * The two constants mirror literals in CrowScene's vertex shader — the spread
 * has to be the same number the particles are actually moving by, so if one
 * changes the other has to follow.
 */
export const SCROLL_EASE_K = 2.5;
export const SCROLL_EXPLODE = 45;

/** Spread, in mesh widths, past which none of the bird's shape is left. */
export const DISPERSED_SPREAD = 0.25;

/** Opacity for the crow's canvas layer at a given page scroll progress (0..1). */
export function crowLayerOpacity(scrollProgress: number): number {
  const spread = scrollProgress * scrollProgress * SCROLL_EASE_K * SCROLL_EXPLODE;
  const t = Math.min(1, Math.max(0, spread / DISPERSED_SPREAD));
  // Quadratic ease-out. The top of the fade is flat already — spread grows with
  // the square of the scroll, so nothing happens for the first pixels — and this
  // lands the bottom softly instead of on a corner.
  return (1 - t) * (1 - t);
}
