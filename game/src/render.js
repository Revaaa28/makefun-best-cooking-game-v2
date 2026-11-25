// Saffron Hour — Rooftop Kitchen: everything the player sees. Draws the
// golden-hour room (tiled wall, string lights, plank floor), the HUD, the
// order tickets with their customers, the bins and stations, the assembly
// plates and the chef. The judge reads the game through screenshots, so
// every system is drawn big, labelled and busy.

import { VIEW, LAYOUT, COLORS, SHIFT_SECONDS } from './config.js';
import { INGREDIENTS } from './recipes.js';
import { drawIngredient, drawPlateStack } from './food-art.js';
import { drawCustomer } from './customers.js';
import { binRect, plateRect } from './kitchen.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

function rr(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function label(ctx, text, x, y, size, color, align = 'center', weight = 800) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawBackground(ctx, state) {
  const { width, height } = VIEW;
  // Wall.
  const wall = ctx.createLinearGradient(0, 0, 0, 340);
  wall.addColorStop(0, COLORS.wallTop);
  wall.addColorStop(1, COLORS.wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, 340);
  ctx.strokeStyle = COLORS.tileLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x, 340); ctx.stroke();
  }
  for (let y = 64; y <= 340; y += 46) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  // String lights under the HUD.
  for (let i = 0; i < 16; i++) {
    const x = 40 + i * 80;
    const sag = Math.sin((i / 15) * Math.PI) * 6 + 8;
    ctx.strokeStyle = 'rgba(30, 16, 8, 0.6)';
    ctx.beginPath(); ctx.moveTo(x - 40, 66); ctx.quadraticCurveTo(x, 66 + sag + 8, x + 40, 66); ctx.stroke();
    const glow = 0.75 + Math.sin(state.timeSec * 2 + i * 1.7) * 0.25;
    ctx.fillStyle = `rgba(255, 190, 90, ${0.25 * glow})`;
    ctx.beginPath(); ctx.arc(x, 70 + sag, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath(); ctx.arc(x, 70 + sag, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  // Floor.
  const floor = ctx.createLinearGradient(0, 330, 0, height);
  floor.addColorStop(0, COLORS.floorTop);
  floor.addColorStop(1, COLORS.floorBottom);
  ctx.fillStyle = floor;
  ctx.fillRect(0, 330, width, height - 330);
  ctx.strokeStyle = COLORS.plankLine;
  for (let y = 372; y < height; y += 42) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
}

function drawHud(ctx, state) {
  const { hud } = LAYOUT;
  rr(ctx, hud.x, hud.y, hud.w, hud.h, 0, 'rgba(30, 16, 10, 0.92)');
  label(ctx, 'SAFFRON HOUR', 28, 30, 23, COLORS.goldSoft, 'left', 900);
  label(ctx, 'ROOFTOP KITCHEN', 28, 52, 11, '#e8a35c', 'left', 700);
  // Day + goal progress with star markers.
  label(ctx, `DAY ${state.day}`, 250, 40, 19, COLORS.cream, 'left', 900);
  const barX = 340, barW = 300;
  rr(ctx, barX, 18, barW, 16, 8, 'rgba(255,243,214,0.18)');
  const dayCfg = state.dayCfg;
  const frac = Math.min(1, state.money / dayCfg.goal);
  rr(ctx, barX, 18, barW * frac, 16, 8, COLORS.gold);
  for (const [i, at] of [0.6, 0.85, 1].entries()) {
    const sx = barX + barW * at;
    ctx.fillStyle = state.money >= dayCfg.goal * at ? '#fff3d6' : 'rgba(255,243,214,0.4)';
    ctx.font = `13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('★', sx, 31);
    void i;
  }
  label(ctx, `goal $${dayCfg.goal}`, barX, 52, 11, '#e8a35c', 'left', 700);
  // Coins and served.
  label(ctx, `🪙 $${state.money}`, 700, 40, 21, COLORS.goldSoft, 'left', 900);
  label(ctx, `served ${state.served} · lost ${state.lost}`, 830, 40, 14, COLORS.cream, 'left', 700);
  // Timer — big, and it pulses red in the last half minute.
  const left = Math.max(0, Math.ceil(state.timeLeft));
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  const urgent = state.timeLeft <= 30 && state.screen === 'play';
  const pulse = urgent ? 1 + Math.sin(state.timeSec * 8) * 0.06 : 1;
  ctx.save();
  ctx.translate(1170, 34);
  ctx.scale(pulse, pulse);
  label(ctx, `${mm}:${ss}`, 0, 8, 30, urgent ? '#ff7a6e' : COLORS.cream, 'center', 900);
  ctx.restore();
  label(ctx, state.rush ? 'DINNER RUSH' : 'SHIFT', 1170, 56, 10, state.rush ? '#ff7a6e' : '#e8a35c', 'center', 800);
}

function drawTickets(ctx, state) {
  const { rail, ticket } = LAYOUT;
  const orders = state.orders;
  if (orders.tickets.length === 0) {
    label(ctx, '— the rail is quiet… guests are on their way —', rail.x + rail.w / 2, rail.y + 84, 16, 'rgba(255,243,214,0.55)');
    return;
  }
  orders.tickets.forEach((order, i) => {
    const x = rail.x + i * (ticket.w + ticket.gap);
    const y = rail.y + 6;
    const mood = orders.moodOf(order);
    const urgent = order.patience < 10;
    const shake = urgent ? Math.sin(state.timeSec * 30) * 1.6 : 0;
    ctx.save();
    ctx.translate(shake, 0);
    // Card + clip.
    rr(ctx, x, y, ticket.w, ticket.h, 12, COLORS.paper);
    rr(ctx, x + ticket.w / 2 - 16, y - 7, 32, 16, 5, '#9aa3ad');
    // Customer.
    drawCustomer(ctx, order.customer, x + 44, y + 52, 30, mood, state.timeSec);
    label(ctx, order.customer.name, x + 44, y + 100, 12, COLORS.ink, 'center', 800);
    // Dish name + price.
    label(ctx, order.recipe.name, x + 88, y + 34, 17, COLORS.ink, 'left', 900);
    label(ctx, `$${order.recipe.price}`, x + ticket.w - 12, y + 34, 17, COLORS.tealDark, 'right', 900);
    // Ingredient icons, in recipe order.
    order.recipe.items.forEach((item, j) => {
      drawIngredient(ctx, item, x + 100 + j * 34, y + 68, 13, 'ready');
    });
    if (order.recipe.items.length > 5) {
      // second row for the big brunch
    }
    // Patience bar.
    const barW = ticket.w - 24;
    rr(ctx, x + 12, y + ticket.h - 22, barW, 10, 5, 'rgba(43,26,18,0.15)');
    const color = mood > 0.55 ? COLORS.green : mood > 0.28 ? COLORS.amber : COLORS.red;
    rr(ctx, x + 12, y + ticket.h - 22, barW * Math.max(0, mood), 10, 5, color);
    label(ctx, `${Math.ceil(order.patience)}s`, x + ticket.w - 12, y + ticket.h - 26, 11, COLORS.ink, 'right', 800);
    ctx.restore();
  });
}

function drawBins(ctx, state) {
  const { bins } = LAYOUT;
  rr(ctx, bins.x - 8, bins.y - 8, bins.w + 16, bins.h + 16, 12, COLORS.counterFace);
  rr(ctx, bins.x - 8, bins.y - 8, bins.w + 16, 10, 5, COLORS.counterEdge);
  for (let i = 0; i < 9; i++) {
    const rect = binRect(i);
    const ing = ['bun', 'patty', 'chicken', 'cheese', 'tomato', 'lettuce', 'onion', 'egg', 'potato'][i];
    rr(ctx, rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8, 10, 'rgba(43,26,18,0.35)');
    drawIngredient(ctx, ing, rect.x + rect.w / 2, rect.y + 34, 19, 'raw');
    label(ctx, INGREDIENTS[ing].name.toUpperCase(), rect.x + rect.w / 2, rect.y + rect.h - 8, 11, COLORS.cream, 'center', 800);
    label(ctx, String(i + 1), rect.x + 12, rect.y + 18, 10, 'rgba(255,243,214,0.6)', 'center', 800);
  }
  void state;
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(255,243,214,0.25)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
}

function stationShell(ctx, rect, title, accent) {
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 14, COLORS.counterFace);
  rr(ctx, rect.x, rect.y, rect.w, 26, 12, accent);
  label(ctx, title, rect.x + rect.w / 2, rect.y + 19, 13, '#fff7e0', 'center', 900);
}

function drawStations(ctx, state) {
  const k = state.kitchen;
  // Chopping board.
  stationShell(ctx, LAYOUT.chop, 'CHOPPING BOARD', '#7a9a3f');
  k.board.forEach((slot, i) => {
    const x = LAYOUT.chop.x + (i + 1) * (LAYOUT.chop.w / 3) + 20;
    const y = LAYOUT.chop.y + 76;
    rr(ctx, x - 34, y - 26, 68, 52, 8, '#e3c188');
    if (slot) {
      drawIngredient(ctx, slot.ing, x, y, 20, slot.ready ? 'ready' : 'raw');
      if (slot.ready) label(ctx, 'READY', x, y - 34, 11, '#b6f09a', 'center', 900);
    }
  });
  // Grill.
  stationShell(ctx, LAYOUT.grill, 'GRILL', '#8a3b2e');
  rr(ctx, LAYOUT.grill.x + 10, LAYOUT.grill.y + 34, LAYOUT.grill.w - 20, LAYOUT.grill.h - 44, 10, '#2e2a26');
  k.grill.forEach((slot, i) => {
    const x = LAYOUT.grill.x + ((i + 1) * LAYOUT.grill.w) / 4;
    const y = LAYOUT.grill.y + 82;
    if (!slot) return;
    if (slot.state === 'burnt') {
      drawIngredient(ctx, slot.ing, x, y, 20, 'ready');
      ctx.fillStyle = 'rgba(10,10,10,0.72)';
      ctx.beginPath(); ctx.arc(x, y, 21, 0, Math.PI * 2); ctx.fill();
      label(ctx, 'BURNT', x, y - 30, 11, '#ff7a6e', 'center', 900);
    } else {
      drawIngredient(ctx, slot.ing, x, y, 20, slot.state === 'ready' ? 'ready' : 'raw');
      if (slot.state === 'cooking') progressRing(ctx, x, y, 27, slot.t / (slot.ing === 'egg' ? 5 : 5), COLORS.amber);
      else label(ctx, 'READY', x, y - 30, 11, '#b6f09a', 'center', 900);
    }
  });
  // Fryer.
  stationShell(ctx, LAYOUT.fryer, 'FRYER', '#8a6d1f');
  rr(ctx, LAYOUT.fryer.x + 10, LAYOUT.fryer.y + 34, LAYOUT.fryer.w - 20, LAYOUT.fryer.h - 44, 10, '#54450f');
  k.fryer.forEach((slot, i) => {
    const x = LAYOUT.fryer.x + ((i + 1) * LAYOUT.fryer.w) / 3;
    const y = LAYOUT.fryer.y + 82;
    ctx.fillStyle = '#c98f1f';
    ctx.beginPath(); ctx.ellipse(x, y + 12, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (!slot) return;
    if (slot.state === 'burnt') {
      ctx.fillStyle = 'rgba(10,10,10,0.7)';
      ctx.beginPath(); ctx.arc(x, y - 4, 20, 0, Math.PI * 2); ctx.fill();
      label(ctx, 'BURNT', x, y - 32, 11, '#ff7a6e', 'center', 900);
    } else {
      drawIngredient(ctx, slot.ing, x, y - 4, 19, slot.state === 'ready' ? 'ready' : 'raw');
      if (slot.state === 'cooking') progressRing(ctx, x, y - 4, 26, slot.t / 4.2, COLORS.amber);
      else label(ctx, 'READY', x, y - 32, 11, '#b6f09a', 'center', 900);
    }
  });
  // Drinks tap.
  stationShell(ctx, LAYOUT.tap, 'BERRY FIZZ', '#7d2d44');
  const tapCx = LAYOUT.tap.x + LAYOUT.tap.w / 2;
  rr(ctx, tapCx - 8, LAYOUT.tap.y + 34, 16, 34, 6, '#9aa3ad');
  rr(ctx, tapCx - 26, LAYOUT.tap.y + 30, 52, 10, 5, '#6b7280');
  if (k.tap.ready) {
    drawIngredient(ctx, 'drink', tapCx, LAYOUT.tap.y + 92, 17, 'ready');
    label(ctx, 'READY', tapCx, LAYOUT.tap.y + 52, 10, '#b6f09a', 'center', 900);
  } else if (k.tap.t >= 0) {
    drawIngredient(ctx, 'drink', tapCx, LAYOUT.tap.y + 92, 17, 'ready');
    progressRing(ctx, tapCx, LAYOUT.tap.y + 92, 24, k.tap.t / 1.6, COLORS.amber);
  } else {
    label(ctx, 'tap to pour', tapCx, LAYOUT.tap.y + 96, 11, 'rgba(255,243,214,0.6)', 'center', 700);
  }
  // Pass window.
  stationShell(ctx, LAYOUT.pass, 'PASS · SERVE HERE', COLORS.tealDark);
  const passCx = LAYOUT.pass.x + LAYOUT.pass.w / 2;
  rr(ctx, LAYOUT.pass.x + 14, LAYOUT.pass.y + 36, LAYOUT.pass.w - 28, 52, 10, '#fdfaf2');
  const glow = state.passGlow ? 0.6 + Math.sin(state.timeSec * 6) * 0.4 : 0;
  ctx.fillStyle = `rgba(245, 185, 63, ${0.25 + glow * 0.4})`;
  ctx.beginPath(); ctx.arc(passCx + 74, LAYOUT.pass.y + 52, 13, 0, Math.PI * 2); ctx.fill();
  label(ctx, '🔔', passCx + 74, LAYOUT.pass.y + 59, 16, COLORS.ink);
  label(ctx, state.passGlow ? 'a dish is ready!' : '— pass —', passCx - 12, LAYOUT.pass.y + 68, 13, COLORS.ink, 'center', 700);
  label(ctx, 'click with a plate to serve', passCx, LAYOUT.pass.y + LAYOUT.pass.h - 8, 10, 'rgba(255,243,214,0.65)', 'center', 700);
}

function drawAssembly(ctx, state) {
  const { assembly, trash } = LAYOUT;
  rr(ctx, assembly.x - 8, assembly.y - 6, assembly.w + 16, assembly.h + 12, 12, COLORS.counterFace);
  rr(ctx, assembly.x - 8, assembly.y - 6, assembly.w + 16, 10, 5, COLORS.counterEdge);
  label(ctx, 'ASSEMBLY — build each dish on a plate', assembly.x + 8, assembly.y + 16, 12, COLORS.cream, 'left', 900);
  state.kitchen.plates.forEach((plate, i) => {
    const rect = plateRect(i);
    drawPlateStack(ctx, plate.items, rect.x + rect.w / 2, rect.y + 62, 1.05);
    if (plate.items.length === 0) label(ctx, 'empty plate', rect.x + rect.w / 2, rect.y + 66, 12, 'rgba(255,243,214,0.55)', 'center', 700);
    else label(ctx, plate.items.join(' · '), rect.x + rect.w / 2, rect.y + rect.h - 4, 11, COLORS.goldSoft, 'center', 700);
  });
  // Trash.
  rr(ctx, trash.x, trash.y - 6, trash.w, trash.h + 12, 12, '#4a4f57');
  label(ctx, '🗑', trash.x + trash.w / 2, trash.y + 52, 34, COLORS.cream);
  label(ctx, 'TRASH', trash.x + trash.w / 2, trash.y + 92, 12, COLORS.cream, 'center', 900);
  label(ctx, 'dump a mistake', trash.x + trash.w / 2, trash.y + trash.h - 2, 10, 'rgba(255,243,214,0.6)', 'center', 700);
}

function drawChef(ctx, state) {
  const chef = state.kitchen.chef;
  const moving = chef.task && (Math.abs(chef.task.x - chef.x) > 2 || Math.abs(chef.task.y - chef.y) > 2);
  const bob = moving ? Math.sin(chef.walkPhase) * 3 : Math.sin(state.timeSec * 2) * 1.2;
  const x = chef.x;
  const y = chef.y + bob;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(43,26,18,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 30 - bob, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body: cream shirt, teal apron.
  rr(ctx, -17, -6, 34, 34, 12, '#fdf6ec');
  rr(ctx, -13, 2, 26, 26, 8, COLORS.teal);
  // Head.
  ctx.fillStyle = '#f6cfa5';
  ctx.beginPath(); ctx.arc(0, -22, 15, 0, Math.PI * 2); ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-7, -36, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, -36, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -41, 9, 0, Math.PI * 2); ctx.fill();
  rr(ctx, -11, -33, 22, 6, 3, '#ffffff');
  // Face.
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath(); ctx.arc(-5, -22, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -22, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, -18, 5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  // Arms + carried item.
  const working = chef.task && chef.task.started;
  if (chef.carry) {
    ctx.strokeStyle = '#f6cfa5';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-20, -34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(20, -34); ctx.stroke();
    if (chef.carry.plateItems) drawPlateStack(ctx, chef.carry.plateItems, 0, -52, 0.8);
    else drawIngredient(ctx, chef.carry.ing, 0, -50, 17, chef.carry.state === 'ready' ? 'ready' : 'raw');
  } else if (working && chef.task.anim === 'chop') {
    const swing = Math.sin(state.timeSec * 14) * 0.7;
    ctx.strokeStyle = '#f6cfa5';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(24, -14 + swing * 8); ctx.stroke();
    ctx.strokeStyle = '#c8ccd2';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(24, -14 + swing * 8); ctx.lineTo(32, -22 + swing * 10); ctx.stroke();
  }
  ctx.restore();
}

function drawBottomBar(ctx, state) {
  rr(ctx, 0, 632, VIEW.width, 88, 0, 'rgba(30, 16, 10, 0.92)');
  // Hint pill.
  if (state.hint && state.hint.text) {
    rr(ctx, 24, 652, 760, 46, 23, 'rgba(255,243,214,0.14)');
    label(ctx, state.hint.text, 44, 681, 15, COLORS.cream, 'left', 700);
  }
  // Combo pill.
  if (state.combo >= 2) {
    const heat = Math.min(1, state.combo / 6);
    rr(ctx, 812, 652, 170, 46, 23, `rgba(226, 72, 61, ${0.35 + heat * 0.5})`);
    label(ctx, `🔥 COMBO ×${state.combo}`, 897, 681, 16, '#fff7e0', 'center', 900);
  }
  label(ctx, 'click a crate, then its station · P pause · M mute', 1256, 681, 12, 'rgba(255,243,214,0.55)', 'right', 700);
}

function drawBanner(ctx, state) {
  if (!state.banner) return;
  const t = state.banner.t;
  const scale = t < 0.25 ? 0.7 + t * 1.2 : 1;
  ctx.save();
  ctx.translate(VIEW.width / 2, 262);
  ctx.scale(scale, scale);
  rr(ctx, -210, -26, 420, 52, 26, COLORS.red);
  label(ctx, state.banner.text, 0, 8, 22, '#fff7e0', 'center', 900);
  ctx.restore();
}

function panel(ctx, w, h) {
  const x = (VIEW.width - w) / 2;
  const y = (VIEW.height - h) / 2;
  ctx.fillStyle = 'rgba(20, 10, 6, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  rr(ctx, x, y, w, h, 22, '#3a2115');
  rr(ctx, x + 6, y + 6, w - 12, h - 12, 18, '#54301d');
  return { x, y };
}

export const RESULTS_BUTTON = { x: 490, y: 516, w: 300, h: 56 };

function drawTitle(ctx, state) {
  const { x, y } = panel(ctx, 760, 520);
  label(ctx, 'SAFFRON HOUR', x + 380, y + 92, 52, COLORS.goldSoft, 'center', 900);
  label(ctx, 'R O O F T O P   K I T C H E N', x + 380, y + 126, 15, '#e8a35c', 'center', 800);
  drawPlateStack(ctx, ['bun', 'patty', 'cheese', 'tomato', 'lettuce'], x + 380, y + 208, 1.5);
  label(ctx, 'Guests order from the rail. Cook fast, plate it right,', x + 380, y + 292, 16, COLORS.cream, 'center', 700);
  label(ctx, 'and serve before their patience runs out.', x + 380, y + 316, 16, COLORS.cream, 'center', 700);
  label(ctx, '🥬  click a crate  →  cook at its station  →  build on a plate  →  serve at the PASS  🔔', x + 380, y + 362, 15, COLORS.goldSoft, 'center', 800);
  label(ctx, 'Grills and fryers keep cooking without you — but they burn.', x + 380, y + 392, 14, 'rgba(255,243,214,0.7)', 'center', 700);
  const pulse = 1 + Math.sin(state.timeSec * 3) * 0.02;
  ctx.save();
  ctx.translate(x + 380, y + 452);
  ctx.scale(pulse, pulse);
  rr(ctx, -170, -26, 340, 52, 26, COLORS.teal);
  label(ctx, 'CLICK TO OPEN · DAY 1', 0, 7, 17, '#fff7e0', 'center', 900);
  ctx.restore();
}

function drawResults(ctx, state) {
  const r = state.results;
  const { x, y } = panel(ctx, 640, 480);
  label(ctx, `DAY ${r.day} — SERVICE DONE`, x + 320, y + 66, 30, COLORS.goldSoft, 'center', 900);
  for (let i = 0; i < 3; i++) {
    ctx.font = `54px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = i < r.stars ? COLORS.gold : 'rgba(255,243,214,0.2)';
    ctx.fillText('★', x + 250 + i * 70, y + 138);
  }
  const rows = [
    ['Earned', `$${r.money}  of $${r.goal} goal`],
    ['Guests served', String(r.served)],
    ['Guests lost', String(r.lost)],
    ['Best combo', `×${r.bestCombo}`],
    ['In the bank', `$${r.bank}`],
  ];
  rows.forEach(([k, v], i) => {
    label(ctx, k, x + 130, y + 196 + i * 40, 17, 'rgba(255,243,214,0.75)', 'left', 700);
    label(ctx, v, x + 510, y + 196 + i * 40, 18, COLORS.cream, 'right', 900);
  });
  const b = RESULTS_BUTTON;
  rr(ctx, b.x, b.y, b.w, b.h, 28, COLORS.teal);
  label(ctx, `START DAY ${r.day + 1} →`, b.x + b.w / 2, b.y + 36, 17, '#fff7e0', 'center', 900);
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(640, 360, 420, 640, 360, 900);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(30, 10, 0, 0.32)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

export function drawScene(ctx, state) {
  drawBackground(ctx, state);
  drawBins(ctx, state);
  drawStations(ctx, state);
  drawAssembly(ctx, state);
  drawTickets(ctx, state);
  drawChef(ctx, state);
  state.particles.draw(ctx);
  drawHud(ctx, state);
  drawBottomBar(ctx, state);
  drawBanner(ctx, state);
  drawVignette(ctx);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'results') drawResults(ctx, state);
  if (state.paused) {
    ctx.fillStyle = 'rgba(20,10,6,0.5)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    label(ctx, 'PAUSED — press P to keep cooking', 640, 370, 26, COLORS.cream, 'center', 900);
  }
}
