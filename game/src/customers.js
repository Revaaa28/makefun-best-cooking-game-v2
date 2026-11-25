// Saffron Hour — Rooftop Kitchen: the guests. Each customer is a small
// generated portrait — skin tone, hair style and colour, a name — drawn on
// their order ticket; their face follows their patience (smile, flat,
// frown, sweat) so the rush reads at a glance.

const SKIN_TONES = ['#f6cfa5', '#eeb98a', '#d99e63', '#b97a45', '#8a5427', '#6e3f1d'];
const HAIR_COLORS = ['#2b1a12', '#4a2c14', '#7a4a21', '#a5672f', '#c93b3b', '#3d5a80', '#6b7280', '#e8e3d5'];
const HAIR_STYLES = ['cap', 'bun', 'spiky', 'long', 'bald', 'curls'];
const NAMES = [
  'Maya', 'Rafi', 'Ines', 'Tomas', 'Priya', 'Kenji', 'Lola', 'Omar',
  'Nina', 'Bram', 'Sari', 'Felix', 'Anya', 'Dario', 'Mina', 'Hugo',
  'Tara', 'Elio', 'Noor', 'Pavel', 'Rosa', 'Sam', 'Ivy', 'Marco',
];

let namePool = [];

export function makeCustomer(rng) {
  if (namePool.length === 0) namePool = [...NAMES];
  const nameIndex = Math.floor(rng() * namePool.length);
  const name = namePool.splice(nameIndex, 1)[0];
  return {
    name,
    skin: SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)],
    hair: HAIR_COLORS[Math.floor(rng() * HAIR_COLORS.length)],
    style: HAIR_STYLES[Math.floor(rng() * HAIR_STYLES.length)],
    seed: rng() * 1000,
  };
}

// mood: 1 = delighted, 0.5 = waiting, 0 = about to walk out.
export function drawCustomer(ctx, customer, cx, cy, r, mood, time) {
  const { skin, hair, style, seed } = customer;
  ctx.save();
  ctx.translate(cx, cy);
  // Head.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // Hair by style.
  ctx.fillStyle = hair;
  if (style === 'cap') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.12, r * 0.98, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
  } else if (style === 'bun') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.95, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r * 1.02, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'spiky') {
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.32 - r * 0.14, -r * 0.72);
      ctx.lineTo(i * r * 0.32, -r * 1.18);
      ctx.lineTo(i * r * 0.32 + r * 0.14, -r * 0.72);
      ctx.closePath();
      ctx.fill();
    }
  } else if (style === 'long') {
    ctx.fillRect(-r * 1.02, -r * 0.75, r * 0.3, r * 1.5);
    ctx.fillRect(r * 0.72, -r * 0.75, r * 0.3, r * 1.5);
    ctx.beginPath();
    ctx.arc(0, -r * 0.2, r * 0.96, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (style === 'curls') {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78 - r * 0.1, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Eyes (blink shut briefly on a per-customer rhythm).
  const blink = (time * 0.7 + seed) % 3.4 < 0.12 ? 0.15 : 1;
  ctx.fillStyle = '#2b1a12';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * r * 0.36, -r * 0.05, r * 0.09, r * 0.11 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Brows rise as patience runs out.
  ctx.strokeStyle = '#2b1a12';
  ctx.lineWidth = r * 0.07;
  ctx.lineCap = 'round';
  const browLift = (1 - mood) * r * 0.14;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.2, -r * 0.34 - browLift);
    ctx.lineTo(side * r * 0.52, -r * 0.3 - browLift * 0.4);
    ctx.stroke();
  }
  // Mouth: smile to flat to frown by mood.
  ctx.beginPath();
  if (mood > 0.55) {
    ctx.arc(0, r * 0.28, r * 0.42, Math.PI * 0.15, Math.PI * 0.85);
  } else if (mood > 0.28) {
    ctx.moveTo(-r * 0.3, r * 0.48);
    ctx.lineTo(r * 0.3, r * 0.48);
  } else {
    ctx.arc(0, r * 0.78, r * 0.4, Math.PI * 1.15, Math.PI * 1.85);
  }
  ctx.stroke();
  // Cheeks.
  ctx.fillStyle = 'rgba(226, 72, 61, 0.25)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * r * 0.58, r * 0.3, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sweat drop when nearly out of patience.
  if (mood <= 0.28) {
    const bob = Math.sin(time * 5 + seed) * r * 0.06;
    ctx.fillStyle = '#7cc7e8';
    ctx.beginPath();
    ctx.moveTo(r * 0.86, -r * 0.5 + bob);
    ctx.quadraticCurveTo(r * 1.08, -r * 0.1 + bob, r * 0.86, -r * 0.02 + bob);
    ctx.quadraticCurveTo(r * 0.64, -r * 0.1 + bob, r * 0.86, -r * 0.5 + bob);
    ctx.fill();
  }
  ctx.restore();
}
