// A presentation study, authored from the supplied original walking/fishing art.
// This timeline is deliberately independent of the original saved story.
export const DURATION = 32;
export const positiveMod = (value, period) => ((value % period) + period) % period;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = t => t * t * (3 - 2 * t);

export function samplePilot(seconds) {
  const t = positiveMod(seconds, DURATION);
  let x, facing, action, phase;
  if (t < 6) {
    x = .10 - .34 * smooth(t / 6); facing = -1; action = 'walk'; phase = t / .88;
  } else if (t < 18) {
    x = -.24; facing = -1; action = 'fish'; phase = (t - 6) / 12;
  } else if (t < 26) {
    x = -.24 + .46 * smooth((t - 18) / 8); facing = 1; action = 'walk'; phase = (t - 18) / .88;
  } else if (t < 28) {
    x = .22; facing = t < 27 ? 1 : -1; action = 'idle'; phase = t - 26;
  } else {
    x = .22 - .12 * smooth((t - 28) / 4); facing = -1; action = 'walk'; phase = (t - 28) / .88;
  }
  const walking = action === 'walk';
  // Fade stride at starts/stops to avoid moving feet while standing still.
  const interval = t < 6 ? [0,6] : t < 26 ? [18,26] : [28,32];
  const stride = walking ? clamp(Math.min(t - interval[0], interval[1] - t) / .6, 0, 1) : 0;
  const travel = t < 6 ? .10-x : t < 18 ? .34 : t < 26 ? x+.24 : t < 28 ? .46 : .22-x;
  return {t,x,facing,action,phase,stride,travel,groundOffset:0};
}

// Coordinates are CSS pixels; raster density never changes composition.
export function layoutPilot(width, height, dpr = 1, quality = 1) {
  const w = Math.max(1, width), h = Math.max(1, height);
  const scale = Math.min(w / 1120, h / 850);
  const islandWidth = 940 * scale;
  const baseline = h * (h > w ? .65 : .77);
  const density = Math.min(Math.max(dpr, 1), 2, Math.sqrt(8_500_000 / (w * h))) * quality;
  return {
    width:w, height:h, scale, islandWidth,
    centerX:w * .5, baseline,
    horizon:h * (h > w ? .34 : .34),
    pixelWidth:Math.max(1, Math.round(w * density)),
    pixelHeight:Math.max(1, Math.round(h * density)),
    density,
    palmX:w * .5 + islandWidth * .15,
    palmY:baseline - 22 * scale,
    characterHeight:220 * scale,
  };
}

export const PILOT_CUES = Object.freeze([{time:7.1, kind:'cast'}, {time:13.4, kind:'bite'}]);

export function cuesBetween(from, to) {
  if (!(to > from) || to - from > DURATION) return [];
  const result = [];
  for (let cycle = Math.floor(from / DURATION); cycle <= Math.floor(to / DURATION); cycle++) {
    for (const cue of PILOT_CUES) {
      const at = cycle * DURATION + cue.time;
      if (at > from && at <= to) result.push({...cue, at});
    }
  }
  return result;
}
