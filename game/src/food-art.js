// Saffron Hour — Rooftop Kitchen: the food itself. Every ingredient is drawn
// in code — layered shapes with highlights — in a raw state (as it leaves
// the bin) and a ready state (chopped / cooked / poured). drawPlateStack
// piles a plate's items into a little tower so a dish mid-assembly reads
// from across the room.

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// Draws one ingredient centred on (x, y) at the given radius.
// state: 'raw' | 'ready'. Cooking-in-progress is the caller's progress ring.
export function drawIngredient(ctx, id, x, y, r, state = 'ready') {
  ctx.save();
  ctx.translate(x, y);
  switch (id) {
    case 'bun': {
      // Bottom bun, then the domed top with sesame seeds.
      roundRect(ctx, -r, -r * 0.1, r * 2, r * 0.55, r * 0.25, '#d98e3f');
      ctx.fillStyle = '#f0b45c';
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 0.98, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffe9b8';
      for (const [sx, sy] of [[-0.45, -0.55], [0.05, -0.8], [0.5, -0.5], [-0.1, -0.35], [0.62, -0.78]]) {
        ctx.beginPath();
        ctx.ellipse(sx * r, sy * r, r * 0.1, r * 0.055, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'patty': {
      const cooked = state === 'ready';
      circle(ctx, 0, 0, r * 0.92, cooked ? '#6e3f1a' : '#9c5a3c');
      circle(ctx, -r * 0.2, -r * 0.2, r * 0.6, cooked ? '#7d4a20' : '#a96747');
      if (cooked) {
        ctx.strokeStyle = 'rgba(43, 26, 18, 0.55)';
        ctx.lineWidth = r * 0.09;
        for (const off of [-0.4, 0, 0.4]) {
          ctx.beginPath();
          ctx.moveTo(off * r - r * 0.3, -r * 0.55);
          ctx.lineTo(off * r + r * 0.3, r * 0.55);
          ctx.stroke();
        }
      }
      break;
    }
    case 'chicken': {
      const cooked = state === 'ready';
      // Drumstick: golden knob on a bone.
      ctx.fillStyle = '#f3e3c2';
      ctx.save();
      ctx.rotate(0.7);
      roundRect(ctx, -r * 0.12, -r * 0.2, r * 0.24, r * 1.05, r * 0.12, '#f3e3c2');
      ctx.restore();
      circle(ctx, -r * 0.18, -r * 0.28, r * 0.62, cooked ? '#d98e32' : '#e8b06a');
      if (cooked) {
        ctx.fillStyle = 'rgba(122, 58, 16, 0.5)';
        for (const [sx, sy] of [[-0.35, -0.45], [0.05, -0.2], [-0.15, -0.05]]) circle(ctx, sx * r, sy * r, r * 0.09, 'rgba(122,58,16,0.5)');
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f6b73c';
      ctx.beginPath();
      ctx.moveTo(-r, -r * 0.55);
      ctx.lineTo(r, -r * 0.55);
      ctx.lineTo(r * 0.72, r * 0.62);
      ctx.lineTo(r * 0.25, r * 0.3);
      ctx.lineTo(-r * 0.3, r * 0.68);
      ctx.lineTo(-r * 0.62, r * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(214, 144, 32, 0.65)';
      circle(ctx, -r * 0.3, -r * 0.1, r * 0.14, 'rgba(214,144,32,0.65)');
      circle(ctx, r * 0.35, r * 0.05, r * 0.11, 'rgba(214,144,32,0.65)');
      break;
    }
    case 'tomato': {
      if (state === 'ready') {
        // Two overlapping slices with seed pockets.
        for (const off of [-0.32, 0.32]) {
          circle(ctx, off * r, 0, r * 0.62, '#e2483d');
          circle(ctx, off * r, 0, r * 0.44, '#f0665a');
          ctx.fillStyle = '#ffd9a0';
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + off;
            circle(ctx, off * r + Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22, r * 0.07, '#ffd9a0');
          }
        }
      } else {
        circle(ctx, 0, 0, r * 0.85, '#e2483d');
        circle(ctx, -r * 0.28, -r * 0.3, r * 0.3, '#f0665a');
        ctx.fillStyle = '#3f7d33';
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.82, r * 0.3, r * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = state === 'ready' ? '#6fbf4a' : '#58b368';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.3, r * 0.5, r * 0.3, a, 0, Math.PI * 2);
        ctx.fill();
      }
      circle(ctx, 0, 0, r * 0.45, '#8fd45e');
      break;
    }
    case 'onion': {
      if (state === 'ready') {
        ctx.strokeStyle = '#c9a2e8';
        ctx.lineWidth = r * 0.14;
        for (const rad of [0.75, 0.45]) {
          ctx.beginPath();
          ctx.arc(0, 0, r * rad, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        circle(ctx, 0, 0, r * 0.82, '#d9c2f0');
        ctx.strokeStyle = '#b388d9';
        ctx.lineWidth = r * 0.07;
        for (const rad of [0.55, 0.3]) {
          ctx.beginPath();
          ctx.arc(0, 0, r * rad, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = '#8a6d3b';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.95);
        ctx.lineTo(r * 0.12, -r * 0.7);
        ctx.lineTo(-r * 0.12, -r * 0.7);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'egg': {
      if (state === 'ready') {
        ctx.fillStyle = '#fff7e0';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.95, r * 0.72, 0.3, 0, Math.PI * 2);
        ctx.fill();
        circle(ctx, r * 0.1, -r * 0.05, r * 0.38, '#f5b93f');
        circle(ctx, r * 0.02, -r * 0.14, r * 0.15, '#ffd97a');
      } else {
        ctx.fillStyle = '#fdf6ec';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.08, r * 0.68, r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(180, 150, 110, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      break;
    }
    case 'potato': {
      ctx.fillStyle = '#d9b06a';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.9, r * 0.62, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(150, 110, 50, 0.6)';
      for (const [sx, sy] of [[-0.3, -0.1], [0.25, 0.15], [0.05, -0.3]]) circle(ctx, sx * r, sy * r, r * 0.08, 'rgba(150,110,50,0.6)');
      break;
    }
    case 'fries': {
      // Red carton with golden sticks.
      ctx.fillStyle = '#f2c14e';
      for (const [off, tilt] of [[-0.45, -0.25], [-0.15, -0.08], [0.15, 0.08], [0.45, 0.25]]) {
        ctx.save();
        ctx.translate(off * r, -r * 0.35);
        ctx.rotate(tilt);
        roundRect(ctx, -r * 0.11, -r * 0.55, r * 0.22, r * 1.0, r * 0.06, '#f2c14e');
        ctx.restore();
      }
      ctx.fillStyle = '#d63c30';
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.15);
      ctx.lineTo(r * 0.8, -r * 0.15);
      ctx.lineTo(r * 0.6, r * 0.85);
      ctx.lineTo(-r * 0.6, r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.font = `800 ${r * 0.5}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('S', 0, r * 0.55);
      break;
    }
    case 'drink': {
      // Berry fizz in a tall cup with a straw and bubbles.
      ctx.fillStyle = 'rgba(220, 235, 245, 0.85)';
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.7);
      ctx.lineTo(r * 0.55, -r * 0.7);
      ctx.lineTo(r * 0.42, r * 0.85);
      ctx.lineTo(-r * 0.42, r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c93b5e';
      ctx.beginPath();
      ctx.moveTo(-r * 0.48, -r * 0.35);
      ctx.lineTo(r * 0.48, -r * 0.35);
      ctx.lineTo(r * 0.4, r * 0.8);
      ctx.lineTo(-r * 0.4, r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (const [sx, sy, sr] of [[-0.2, 0.2, 0.09], [0.15, 0.45, 0.07], [0.05, -0.05, 0.06]]) circle(ctx, sx * r, sy * r, sr * r, 'rgba(255,255,255,0.75)');
      ctx.strokeStyle = '#0f766e';
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.moveTo(r * 0.1, -r * 0.65);
      ctx.lineTo(r * 0.45, -r * 1.15);
      ctx.stroke();
      break;
    }
    default:
      circle(ctx, 0, 0, r * 0.8, '#cccccc');
  }
  ctx.restore();
}

// Layer heights on a plate: buns sit low and wide, patties stack flat, the
// drink stands beside the pile instead of on it.
const LAYER_H = { bun: 7, patty: 9, cheese: 4, tomato: 5, lettuce: 6, onion: 4, egg: 6, chicken: 10, fries: 12, drink: 0 };

// Draws a plate (or tray) with its items stacked at (x, y) — y is the plate's
// centre. Returns nothing; purely visual.
export function drawPlateStack(ctx, items, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Plate.
  ctx.fillStyle = 'rgba(43, 26, 18, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 52, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fdfaf2';
  ctx.beginPath();
  ctx.ellipse(0, 10, 54, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e2d2';
  ctx.beginPath();
  ctx.ellipse(0, 9, 40, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  let lift = 0;
  let drinkItem = null;
  for (const item of items) {
    if (item === 'drink') { drinkItem = item; continue; }
    lift += LAYER_H[item] ?? 6;
    drawIngredient(ctx, item, 0, 8 - lift, item === 'bun' ? 30 : 26, 'ready');
  }
  if (drinkItem) drawIngredient(ctx, 'drink', 62, -6, 20, 'ready');
  ctx.restore();
}
