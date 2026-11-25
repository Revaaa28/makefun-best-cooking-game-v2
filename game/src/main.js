// Saffron Hour — Rooftop Kitchen: boot, the day cycle, input and the game
// loop. Owns the run state (money, combo, timer, screen) and wires the
// kitchen, the order book and the renderer together.

import { VIEW, LAYOUT, SHIFT_SECONDS, DAYS } from './config.js';
import { INGREDIENTS, recipesForDay, plateMatches, tipFor } from './recipes.js';
import { OrderBook } from './orders.js';
import { Kitchen, binRect, plateRect } from './kitchen.js';
import { Particles } from './particles.js';
import { drawScene, RESULTS_BUTTON } from './render.js';
import { stageShot } from './shots.js';
import { sfx, unlockAudio, toggleMute } from './audio.js';

const params = new URLSearchParams(location.search);

// Small seeded RNG so staged screenshots and tests are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const statusEl = document.getElementById('status');

const state = {
  screen: 'title',
  paused: false,
  timeSec: 0,
  day: 1,
  dayCfg: { ...DAYS[0], day: 1 },
  timeLeft: SHIFT_SECONDS,
  rush: false,
  money: 0,
  bank: 0,
  served: 0,
  lost: 0,
  combo: 0,
  bestCombo: 0,
  hint: { text: 'Click a crate to grab an ingredient.', t: 0 },
  banner: null,
  passGlow: false,
  results: null,
  rng: mulberry32(Number(params.get('seed') || 7)),
  orders: null,
  kitchen: null,
  particles: new Particles(),
  _rushWarned: false,
  _rushStarted: false,
  _botTimer: 0,
};
state.orders = new OrderBook(state.rng);

function setHint(text) {
  state.hint = { text, t: 0 };
}

function hintForCarry(carry) {
  if (!carry || carry.plateItems) return;
  const prep = INGREDIENTS[carry.ing].prep;
  if (carry.state === 'ready') setHint(`${INGREDIENTS[carry.ing].name} is ready — click a plate on the ASSEMBLY counter.`);
  else if (prep === 'grill') setHint(`Click the GRILL to cook the ${INGREDIENTS[carry.ing].name.toLowerCase()}.`);
  else if (prep === 'fryer') setHint(`Click the FRYER to cook the ${INGREDIENTS[carry.ing].name.toLowerCase()}.`);
  else if (prep === 'board') setHint(`Click the CHOPPING BOARD to chop the ${INGREDIENTS[carry.ing].name.toLowerCase()}.`);
}

function servePlate(items, x, y) {
  const menu = recipesForDay(state.day);
  const recipe = menu.find((r) => plateMatches(items, r));
  if (!recipe) {
    setHint('That plate matches no dish on the menu — check a ticket and rebuild.');
    return { ok: false };
  }
  const ticket = state.orders.matchFor(recipe.id);
  if (!ticket) {
    setHint(`No guest is waiting for a ${recipe.name} right now.`);
    return { ok: false };
  }
  const tip = Math.round(tipFor(ticket) * (1 + 0.2 * Math.min(state.combo, 10)));
  const payout = recipe.price + tip;
  state.money += payout;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders.remove(ticket);
  state.particles.popup(x, y - 24, `+$${payout}`, '#ffd97a');
  if (tip >= 6) state.particles.popup(x, y - 52, 'nice tip!', '#b6f09a');
  state.particles.sparkle(x, y, 14);
  sfx.serve();
  setHint(`${ticket.customer.name} loved the ${recipe.name}! Combo ×${state.combo}.`);
  statusEl.textContent = `Served ${recipe.name} to ${ticket.customer.name} for $${payout}.`;
  return { ok: true };
}

state.kitchen = new Kitchen({
  serve: servePlate,
  hint: setHint,
  hintForCarry,
  fx(kind, x, y) {
    if (kind === 'steam') state.particles.steam(x, y, 1);
    else if (kind === 'sparkle') state.particles.sparkle(x, y, 8);
    else if (kind === 'puff') state.particles.sparkle(x, y, 8, '#9aa3ad');
    else if (kind === 'ready') state.particles.popup(x, y, 'READY!', '#b6f09a');
  },
});

function dayConfig(day) {
  const base = DAYS[Math.min(day - 1, DAYS.length - 1)];
  if (day <= DAYS.length) return { ...base, day };
  const extra = day - DAYS.length;
  return {
    goal: Math.round(base.goal * Math.pow(1.18, extra)),
    spawnEvery: Math.max(4.6, base.spawnEvery - extra * 0.4),
    patience: Math.max(40, base.patience - extra * 2),
    unlocks: [],
    day,
  };
}

function startDay(day) {
  state.day = day;
  state.dayCfg = dayConfig(day);
  state.timeLeft = SHIFT_SECONDS;
  state.money = 0;
  state.served = 0;
  state.lost = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.rush = false;
  state.banner = null;
  state._rushWarned = false;
  state._rushStarted = false;
  state.orders.reset();
  state.kitchen.reset();
  state.screen = 'play';
  const unlocks = state.dayCfg.unlocks || [];
  setHint(unlocks.length
    ? `Day ${day}: new on the menu — ${unlocks.map((id) => recipesForDay(day).find((r) => r.id === id).name).join(' and ')}!`
    : `Day ${day}: goal $${state.dayCfg.goal}. Click a crate to grab an ingredient.`);
  statusEl.textContent = `Day ${day} started. Goal $${state.dayCfg.goal}.`;
}

function endDay() {
  const goal = state.dayCfg.goal;
  const stars = state.money >= goal ? 3 : state.money >= goal * 0.85 ? 2 : state.money >= goal * 0.55 ? 1 : 0;
  state.bank += state.money;
  state.results = {
    day: state.day, money: state.money, goal,
    served: state.served, lost: state.lost, bestCombo: state.bestCombo,
    bank: state.bank, stars,
  };
  state.screen = 'results';
  if (stars > 0) sfx.star(); else sfx.bell();
  statusEl.textContent = `Day ${state.day} over: earned $${state.money}, ${stars} stars.`;
}

function onLost(ticket) {
  state.lost += 1;
  state.combo = 0;
  sfx.lost();
  setHint(`${ticket.customer.name} walked out — the ${ticket.recipe.name} took too long. Combo lost.`);
}

function computePassGlow() {
  const menu = recipesForDay(state.day);
  state.passGlow = state.kitchen.plates.some((plate) => {
    if (plate.items.length === 0) return false;
    const recipe = menu.find((r) => plateMatches(plate.items, r));
    return recipe && state.orders.matchFor(recipe.id);
  });
}

// A simple autoplayer used by the maker's playtest (?auto=1): it plays the
// real game through the same click path a person uses. It counts food that
// is already cooking as on its way, so it never loads a station twice with
// the same ingredient while one is still in the pan.
function inflightItems(k) {
  const items = [];
  for (const slot of k.board) if (slot) items.push(slot.ing);
  for (const slot of k.grill) if (slot) items.push(slot.ing);
  for (const slot of k.fryer) if (slot) items.push(slot.ing === 'potato' ? 'fries' : slot.ing);
  if (k.tap.ready) items.push('drink');
  return items;
}

function cookedForm(ing) {
  return ing === 'potato' ? 'fries' : ing;
}

function botStep() {
  const k = state.kitchen;
  const chef = k.chef;
  if (chef.task || chef.queue.length) return;
  const click = (r) => k.click(r.x + r.w / 2, r.y + r.h / 2);
  const carry = chef.carry;
  if (carry && carry.plateItems) return click(LAYOUT.pass);
  const tickets = [...state.orders.tickets].sort((a, b) => a.patience - b.patience);
  if (!tickets.length) return;
  const recipe = tickets[0].recipe;
  const plate = k.plates[0];
  const stillNeeded = (list) => {
    const missing = [...recipe.items];
    for (const item of list) {
      const idx = missing.indexOf(item);
      if (idx !== -1) missing.splice(idx, 1);
    }
    return missing;
  };
  const plateNeeds = stillNeeded(plate.items);
  if (plateNeeds.length === 0) {
    if (carry) return click(LAYOUT.trash);
    return click(plateRect(0));
  }
  // Whatever is in hand goes where it belongs first: a ready item the plate
  // still needs is plated at once, a raw one goes to its station — never
  // trashed just because another ingredient is nominally "next".
  if (carry && carry.state === 'ready' && plateNeeds.includes(carry.ing)) return click(plateRect(0));
  if (carry && carry.state === 'raw' && plateNeeds.includes(cookedForm(carry.ing))) {
    const prep = INGREDIENTS[carry.ing].prep;
    if (prep === 'grill') return click(LAYOUT.grill);
    if (prep === 'fryer') return click(LAYOUT.fryer);
    if (prep === 'board') return click(LAYOUT.chop);
  }
  const covered = stillNeeded([...plate.items, ...inflightItems(k),
    ...(carry ? [cookedForm(carry.ing)] : [])]);
  const next = covered[0];
  if (!next) {
    // Everything the plate needs is already cooking or in hand.
    if (carry && carry.state === 'ready' && plateNeeds.includes(carry.ing)) return click(plateRect(0));
    if (carry) return click(LAYOUT.trash);
    if (k.board.some((s) => s && s.ready && plateNeeds.includes(s.ing))) return click(LAYOUT.chop);
    if (k.grill.some((s) => s && s.state === 'ready' && plateNeeds.includes(s.ing))) return click(LAYOUT.grill);
    if (k.fryer.some((s) => s && s.state === 'ready' && plateNeeds.includes(s.ing))) return click(LAYOUT.fryer);
    if (k.tap.ready && plateNeeds.includes('drink')) return click(LAYOUT.tap);
    return; // just wait for the pans
  }
  if (carry && carry.state === 'ready' && carry.ing === next) return click(plateRect(0));
  if (carry && carry.state === 'raw' && cookedForm(carry.ing) === next) {
    const prep = INGREDIENTS[carry.ing].prep;
    if (prep === 'grill') return click(LAYOUT.grill);
    if (prep === 'fryer') return click(LAYOUT.fryer);
    if (prep === 'board') return click(LAYOUT.chop);
    return click(LAYOUT.trash);
  }
  if (carry) return click(LAYOUT.trash);
  if (k.board.some((s) => s && s.ready && s.ing === next)) return click(LAYOUT.chop);
  if (k.grill.some((s) => s && s.state === 'ready' && s.ing === next)) return click(LAYOUT.grill);
  if (k.fryer.some((s) => s && s.state === 'ready' && s.ing === next)) return click(LAYOUT.fryer);
  if (next === 'drink') return click(LAYOUT.tap);
  if (k.grill.some((s) => s && s.state === 'burnt')) return click(LAYOUT.grill);
  if (k.fryer.some((s) => s && s.state === 'burnt')) return click(LAYOUT.fryer);
  const binId = next === 'fries' ? 'potato' : next;
  const binIndex = ['bun', 'patty', 'chicken', 'cheese', 'tomato', 'lettuce', 'onion', 'egg', 'potato'].indexOf(binId);
  if (binIndex !== -1) return click(binRect(binIndex));
}

const shotName = params.get('shot');
const speed = Math.max(1, Number(params.get('speed') || 1));
const auto = params.get('auto') === '1';
if (shotName) {
  startDay(1);
  stageShot(state, shotName);
  if (shotName !== 'results') state.screen = 'play';
} else if (auto) {
  startDay(1);
}

let lastTs = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const rawDt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  state.timeSec += rawDt;
  if (!shotName && state.screen === 'play' && !state.paused) {
    const dt = rawDt * speed;
    state.timeLeft -= dt;
    if (!state._rushWarned && state.timeLeft <= 120) {
      state._rushWarned = true;
      state.banner = { text: 'The rush is building…', t: 0 };
    }
    if (!state._rushStarted && state.timeLeft <= 60) {
      state._rushStarted = true;
      state.rush = true;
      state.banner = { text: '🍳 DINNER RUSH!', t: 0 };
      sfx.bell();
    }
    state.orders.update(dt, state.dayCfg, state.rush, onLost);
    state.kitchen.update(dt);
    state.particles.update(dt);
    computePassGlow();
    if (auto) {
      state._botTimer -= dt;
      if (state._botTimer <= 0) { botStep(); state._botTimer = 0.3; }
    }
    if (state.timeLeft <= 0) endDay();
  }
  if (state.banner) {
    state.banner.t += rawDt;
    if (state.banner.t > 2.4) state.banner = null;
  }
  drawScene(ctx, state);
}
requestAnimationFrame(frame);

// ---- input ------------------------------------------------------------------
function toGameCoords(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  unlockAudio();
  const { x, y } = toGameCoords(event);
  if (state.screen === 'title') { startDay(1); return; }
  if (state.screen === 'results') {
    const b = RESULTS_BUTTON;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) startDay(state.day + 1);
    return;
  }
  if (!state.paused) state.kitchen.click(x, y);
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'm') { toggleMute(); return; }
  if (key === 'p' && state.screen === 'play') { state.paused = !state.paused; return; }
  if (state.screen === 'title' && (key === 'enter' || key === ' ')) { startDay(1); return; }
  if (state.screen === 'results' && key === 'enter') { startDay(state.day + 1); return; }
  if (state.screen !== 'play' || state.paused) return;
  const k = state.kitchen;
  const click = (r) => k.click(r.x + r.w / 2, r.y + r.h / 2);
  if (key >= '1' && key <= '9') click(binRect(Number(key) - 1));
  else if (key === 'c') click(LAYOUT.chop);
  else if (key === 'g') click(LAYOUT.grill);
  else if (key === 'f') click(LAYOUT.fryer);
  else if (key === 'd') click(LAYOUT.tap);
  else if (key === 'a') click(plateRect(0));
  else if (key === 's') click(LAYOUT.pass);
  else if (key === 't') click(LAYOUT.trash);
});

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Hooks for the maker's playtest harness.
window.__saffron = { state, startDay };
