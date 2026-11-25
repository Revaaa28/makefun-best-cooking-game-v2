// Saffron Hour — Rooftop Kitchen: shared constants, palette and layout.
// Every other module reads its sizes, colours and timings from here so the
// kitchen geometry lives in exactly one place.

export const VIEW = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 180;
export const MAX_TICKETS = 4;

export const COLORS = {
  ink: '#2b1a12',
  cream: '#fff3d6',
  paper: '#ffedb8',
  wallTop: '#5a2e2b',
  wallBottom: '#7a3b2e',
  tileLine: 'rgba(255, 190, 120, 0.10)',
  floorTop: '#a5672f',
  floorBottom: '#8a4f22',
  plankLine: 'rgba(59, 30, 10, 0.35)',
  counterTop: '#c97b3f',
  counterFace: '#8a4a24',
  counterEdge: '#e8a35c',
  teal: '#0f766e',
  tealDark: '#0b4f4a',
  gold: '#f5b93f',
  goldSoft: '#ffd97a',
  red: '#e2483d',
  green: '#58b368',
  amber: '#f59e0b',
  steel: '#3d4451',
  steelLight: '#6b7280',
};

// Screen layout, in canvas pixels. The HUD bar sits on top, order tickets
// hang on a rail under it, and the kitchen floor fills the rest.
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 64 },
  rail: { x: 24, y: 76, w: 1232, h: 148 },
  ticket: { w: 296, h: 140, gap: 16 },
  bins: { x: 24, y: 240, w: 1232, h: 86 },
  bin: { w: 124, h: 86, gap: 12 },
  stations: { y: 344, h: 128 },
  chop: { x: 24, y: 344, w: 250, h: 128 },
  grill: { x: 290, y: 344, w: 300, h: 128 },
  fryer: { x: 606, y: 344, w: 250, h: 128 },
  tap: { x: 872, y: 344, w: 150, h: 128 },
  pass: { x: 1038, y: 344, w: 218, h: 128 },
  assembly: { x: 24, y: 492, w: 760, h: 120 },
  plate: { w: 330, h: 120, gap: 24 },
  trash: { x: 1038, y: 492, w: 218, h: 120 },
  hint: { x: 24, y: 636, w: 900, h: 52 },
  chefHome: { x: 900, y: 560 },
};

// Station timings in seconds. Grill and fryer keep cooking while the chef
// works elsewhere, then burn if left too long past ready.
export const TIMING = {
  chopSeconds: 1.6,
  grillSeconds: 5.0,
  frySeconds: 4.2,
  pourSeconds: 1.6,
  burnGraceSeconds: 6.5,
  walkSpeed: 620, // pixels per second
  pickupSeconds: 0.28,
};

// Day ladder: goal is the earnings target for three stars; spawnEvery and
// patience scale the pressure; unlocks are recipe ids added that day.
export const DAYS = [
  { goal: 110, spawnEvery: 9.5, patience: 62, unlocks: [] },
  { goal: 150, spawnEvery: 8.0, patience: 56, unlocks: ['double-ember', 'fry-basket'] },
  { goal: 195, spawnEvery: 6.8, patience: 50, unlocks: ['saffron-supreme', 'full-brunch'] },
  { goal: 240, spawnEvery: 6.0, patience: 46, unlocks: [] },
];
