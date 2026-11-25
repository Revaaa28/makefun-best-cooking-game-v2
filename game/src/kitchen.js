// Saffron Hour — Rooftop Kitchen: the working kitchen. Owns the chef (who
// walks to what you click and works there), the ingredient bins, the four
// prep stations, the assembly plates and the pass. Grill and fryer keep
// cooking while the chef is elsewhere — and burn if forgotten.

import { LAYOUT, TIMING } from './config.js';
import { BIN_ORDER, INGREDIENTS } from './recipes.js';
import { sfx } from './audio.js';

export function binRect(i) {
  const { bins, bin } = LAYOUT;
  return { x: bins.x + i * (bin.w + bin.gap), y: bins.y, w: bin.w, h: bin.h };
}

export function plateRect(i) {
  const { assembly, plate } = LAYOUT;
  return { x: assembly.x + 24 + i * (plate.w + plate.gap), y: assembly.y, w: plate.w, h: plate.h };
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function slotPos(rect, i, n) {
  return { x: rect.x + ((i + 1) * rect.w) / (n + 1), y: rect.y + rect.h * 0.52 };
}

export class Kitchen {
  // hooks: { serve(items) -> {ticket, payout} | {error}, fx(kind, x, y, text?), hint(text) }
  constructor(hooks) {
    this.hooks = hooks;
    this.reset();
  }

  reset() {
    this.chef = { x: LAYOUT.chefHome.x, y: LAYOUT.chefHome.y, carry: null, task: null, queue: [], facing: 1, walkPhase: 0 };
    this.board = [null, null]; // {ing, ready}
    this.grill = [null, null, null]; // {ing, t, state: cooking|ready|burnt}
    this.fryer = [null, null];
    this.tap = { t: -1, ready: false }; // t<0 idle
    this.plates = [{ items: [] }, { items: [] }];
  }

  // ---- chef task machinery -------------------------------------------------
  sendChef(x, y, work, anim, onStart, onDone) {
    const task = { x, y, work, t: 0, anim, onStart, onDone, started: false };
    if (!this.chef.task) this.chef.task = task;
    else if (this.chef.queue.length < 3) this.chef.queue.push(task);
  }

  update(dt) {
    const chef = this.chef;
    if (chef.task) {
      const task = chef.task;
      const dx = task.x - chef.x;
      const dy = task.y - chef.y;
      const dist = Math.hypot(dx, dy);
      const step = TIMING.walkSpeed * dt;
      if (dist > step) {
        chef.x += (dx / dist) * step;
        chef.y += (dy / dist) * step;
        chef.facing = dx >= 0 ? 1 : -1;
        chef.walkPhase += dt * 11;
      } else {
        chef.x = task.x;
        chef.y = task.y;
        if (!task.started) {
          task.started = true;
          if (task.onStart) task.onStart();
        }
        task.t += dt;
        if (task.t >= task.work) {
          const done = task.onDone;
          chef.task = chef.queue.shift() || null;
          if (done) done();
        }
      }
    }
    // Grill and fryer run on their own once loaded.
    for (const [slots, seconds, kind] of [[this.grill, TIMING.grillSeconds, 'grill'], [this.fryer, TIMING.frySeconds, 'fryer']]) {
      slots.forEach((slot, i) => {
        if (!slot || slot.state !== 'cooking') return;
        slot.t += dt;
        if (Math.random() < dt * 6) {
          const rect = kind === 'grill' ? LAYOUT.grill : LAYOUT.fryer;
          const pos = slotPos(rect, i, slots.length);
          this.hooks.fx('steam', pos.x, pos.y - 18);
        }
        if (slot.t >= seconds) {
          slot.state = 'ready';
          if (kind === 'fryer' && slot.ing === 'potato') slot.ing = 'fries';
          const rect = kind === 'grill' ? LAYOUT.grill : LAYOUT.fryer;
          const pos = slotPos(rect, i, slots.length);
          this.hooks.fx('ready', pos.x, pos.y - 30);
          sfx.ding();
        }
      });
      slots.forEach((slot) => {
        if (slot && slot.state === 'ready') {
          slot.over = (slot.over || 0) + dt;
          if (slot.over >= TIMING.burnGraceSeconds) {
            slot.state = 'burnt';
            this.hooks.hint('Something burned! Clear it at the station.');
            sfx.error();
          }
        }
      });
    }
    if (this.tap.t >= 0 && !this.tap.ready) {
      this.tap.t += dt;
      if (this.tap.t >= TIMING.pourSeconds) this.tap.ready = true;
    }
  }

  // ---- clicking -------------------------------------------------------------
  click(x, y) {
    const chef = this.chef;
    // Ingredient bins.
    for (let i = 0; i < BIN_ORDER.length; i++) {
      if (!inRect(x, y, binRect(i))) continue;
      const ing = BIN_ORDER[i];
      if (chef.carry) return this.hooks.hint('Hands full — put that down first.');
      const rect = binRect(i);
      this.sendChef(rect.x + rect.w / 2, LAYOUT.bins.y + LAYOUT.bins.h + 30, TIMING.pickupSeconds, 'pickup', null, () => {
        const prep = INGREDIENTS[ing].prep;
        chef.carry = { ing, state: prep === 'bin' ? 'ready' : 'raw' };
        sfx.pickup();
        this.hooks.hintForCarry(chef.carry);
      });
      return;
    }
    if (inRect(x, y, LAYOUT.chop)) return this.clickBoard();
    if (inRect(x, y, LAYOUT.grill)) return this.clickCooker('grill');
    if (inRect(x, y, LAYOUT.fryer)) return this.clickCooker('fryer');
    if (inRect(x, y, LAYOUT.tap)) return this.clickTap();
    if (inRect(x, y, LAYOUT.pass)) return this.clickPass();
    if (inRect(x, y, LAYOUT.trash)) return this.clickTrash();
    for (let i = 0; i < this.plates.length; i++) {
      if (inRect(x, y, plateRect(i))) return this.clickPlate(i);
    }
  }

  clickBoard() {
    const chef = this.chef;
    const rect = LAYOUT.chop;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h + 16;
    if (chef.carry && chef.carry.state === 'raw' && INGREDIENTS[chef.carry.ing].prep === 'board') {
      const slotIndex = this.board.findIndex((s) => s === null);
      if (slotIndex === -1) return this.hooks.hint('The chopping board is full.');
      const ing = chef.carry.ing;
      this.sendChef(cx, cy, TIMING.chopSeconds, 'chop',
        () => { this.board[slotIndex] = { ing, ready: false }; chef.carry = null; sfx.chop(); },
        () => { this.board[slotIndex].ready = true; sfx.ding(); });
      return;
    }
    if (!chef.carry) {
      const slotIndex = this.board.findIndex((s) => s && s.ready);
      if (slotIndex === -1) return this.hooks.hint('Chop something first: tomato, lettuce or onion.');
      this.sendChef(cx, cy, TIMING.pickupSeconds, 'pickup', null, () => {
        chef.carry = { ing: this.board[slotIndex].ing, state: 'ready' };
        this.board[slotIndex] = null;
        sfx.pickup();
        this.hooks.hintForCarry(chef.carry);
      });
      return;
    }
    this.hooks.hint('That does not need chopping.');
  }

  clickCooker(kind) {
    const chef = this.chef;
    const rect = kind === 'grill' ? LAYOUT.grill : LAYOUT.fryer;
    const slots = kind === 'grill' ? this.grill : this.fryer;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h + 16;
    if (chef.carry && chef.carry.state === 'raw' && INGREDIENTS[chef.carry.ing].prep === kind) {
      const slotIndex = slots.findIndex((s) => s === null);
      if (slotIndex === -1) return this.hooks.hint(kind === 'grill' ? 'The grill is full.' : 'The fryer is full.');
      const ing = chef.carry.ing;
      this.sendChef(cx, cy, TIMING.pickupSeconds, 'place',
        () => { slots[slotIndex] = { ing, t: 0, state: 'cooking', over: 0 }; chef.carry = null; sfx.sizzle(); },
        null);
      return;
    }
    if (!chef.carry) {
      const burntIndex = slots.findIndex((s) => s && s.state === 'burnt');
      if (burntIndex !== -1) {
        this.sendChef(cx, cy, TIMING.pickupSeconds, 'place', null, () => {
          const pos = slotPos(rect, burntIndex, slots.length);
          slots[burntIndex] = null;
          this.hooks.fx('puff', pos.x, pos.y);
        });
        return;
      }
      const readyIndex = slots.findIndex((s) => s && s.state === 'ready');
      if (readyIndex === -1) return this.hooks.hint(kind === 'grill' ? 'Grill a patty or an egg here.' : 'Fry chicken or potato here.');
      this.sendChef(cx, cy, TIMING.pickupSeconds, 'pickup', null, () => {
        chef.carry = { ing: slots[readyIndex].ing, state: 'ready' };
        slots[readyIndex] = null;
        sfx.pickup();
        this.hooks.hintForCarry(chef.carry);
      });
      return;
    }
    this.hooks.hint('That does not cook there.');
  }

  clickTap() {
    const chef = this.chef;
    const rect = LAYOUT.tap;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h + 16;
    if (chef.carry) return this.hooks.hint('Hands full — the Berry Fizz needs a free hand.');
    if (this.tap.ready) {
      this.sendChef(cx, cy, TIMING.pickupSeconds, 'pickup', null, () => {
        chef.carry = { ing: 'drink', state: 'ready' };
        this.tap = { t: -1, ready: false };
        sfx.pickup();
        this.hooks.hintForCarry(chef.carry);
      });
      return;
    }
    if (this.tap.t >= 0) return this.hooks.hint('The fizz is pouring…');
    this.sendChef(cx, cy, TIMING.pourSeconds, 'pour',
      () => { this.tap.t = 0; sfx.pour(); },
      () => { /* the cup waits on the tap until picked up */ });
  }

  clickPlate(i) {
    const chef = this.chef;
    const rect = plateRect(i);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y - 14;
    const plate = this.plates[i];
    if (chef.carry && chef.carry.plateItems) return this.hooks.hint('You are already carrying a plate.');
    if (chef.carry) {
      if (chef.carry.state !== 'ready') return this.hooks.hint('Cook it first — raw food cannot go on a plate.');
      const ing = chef.carry.ing;
      this.sendChef(cx, cy, TIMING.pickupSeconds, 'place', null, () => {
        plate.items.push(ing);
        chef.carry = null;
        sfx.pickup();
        this.hooks.fx('sparkle', cx, rect.y + 30);
      });
      return;
    }
    if (plate.items.length === 0) return this.hooks.hint('An empty plate. Build a dish here.');
    this.sendChef(cx, cy, TIMING.pickupSeconds, 'pickup', null, () => {
      chef.carry = { plateItems: [...plate.items], state: 'plate' };
      plate.items = [];
      sfx.pickup();
      this.hooks.hint('Plate in hand — serve it at the window, or set it back down.');
    });
  }

  clickPass() {
    const chef = this.chef;
    const rect = LAYOUT.pass;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h + 16;
    if (!chef.carry || !chef.carry.plateItems) {
      return this.hooks.hint('Pick up a finished plate, then serve it here.');
    }
    const items = chef.carry.plateItems;
    this.sendChef(cx, cy, 0.4, 'serve', null, () => {
      const result = this.hooks.serve(items, cx, rect.y + 20);
      if (result && result.ok) chef.carry = null;
      else sfx.error();
    });
  }

  clickTrash() {
    const chef = this.chef;
    const rect = LAYOUT.trash;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y - 14;
    if (!chef.carry) return this.hooks.hint('Nothing to throw away.');
    this.sendChef(cx, cy, TIMING.pickupSeconds, 'place', null, () => {
      chef.carry = null;
      this.hooks.fx('puff', cx, rect.y + 40);
      sfx.error();
    });
  }
}
