// Saffron Hour — Rooftop Kitchen: visual juice. Steam wisps over hot
// stations, sparkles when a dish lands, and floating score popups. Purely
// cosmetic — nothing here touches game state.

export class Particles {
  constructor() {
    this.bits = [];
    this.texts = [];
  }

  steam(x, y, n = 1) {
    for (let i = 0; i < n; i++) {
      this.bits.push({
        kind: 'steam', x: x + (Math.random() - 0.5) * 26, y,
        vx: (Math.random() - 0.5) * 8, vy: -34 - Math.random() * 26,
        life: 0, ttl: 1.1 + Math.random() * 0.7, size: 5 + Math.random() * 7,
      });
    }
  }

  sparkle(x, y, n = 10, color = '#ffd97a') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 110;
      this.bits.push({
        kind: 'spark', x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 30,
        life: 0, ttl: 0.45 + Math.random() * 0.35, size: 2 + Math.random() * 2.5, color,
      });
    }
  }

  popup(x, y, text, color = '#ffd97a') {
    this.texts.push({ x, y, text, color, life: 0, ttl: 1.15 });
  }

  update(dt) {
    for (const p of this.bits) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'spark') p.vy += 190 * dt;
      if (p.kind === 'steam') p.size += 9 * dt;
    }
    this.bits = this.bits.filter((p) => p.life < p.ttl);
    for (const t of this.texts) {
      t.life += dt;
      t.y -= 34 * dt;
    }
    this.texts = this.texts.filter((t) => t.life < t.ttl);
  }

  draw(ctx) {
    for (const p of this.bits) {
      const k = 1 - p.life / p.ttl;
      if (p.kind === 'steam') {
        ctx.fillStyle = `rgba(255, 246, 230, ${0.28 * k})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = k;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * k + 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const k = 1 - t.life / t.ttl;
      ctx.font = '800 21px "Trebuchet MS", Verdana, sans-serif';
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(43, 26, 18, 0.85)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.globalAlpha = 1;
    }
  }
}
