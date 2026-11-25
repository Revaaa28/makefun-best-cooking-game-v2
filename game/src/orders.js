// Saffron Hour — Rooftop Kitchen: order tickets. An order pairs a customer
// with a recipe; patience drains in real time and faster during a rush.
// Serving is matched by the kitchen against the recipes module.

import { makeCustomer } from './customers.js';
import { recipesForDay, tipFor } from './recipes.js';
import { MAX_TICKETS } from './config.js';

let nextOrderId = 1;

export class OrderBook {
  constructor(rng) {
    this.rng = rng;
    this.tickets = [];
    this.spawnTimer = 1.2; // first guest arrives almost at once
  }

  reset() {
    this.tickets = [];
    this.spawnTimer = 1.2;
  }

  // Spawns guests on the day's cadence. Returns events for sound and popups:
  // { arrived: order } and { lost: order }.
  update(dt, dayCfg, rush, onLost) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.tickets.length < MAX_TICKETS) {
      this.spawn(dayCfg);
      const jitter = 0.75 + this.rng() * 0.5;
      this.spawnTimer = dayCfg.spawnEvery * jitter * (rush ? 0.55 : 1);
    }
    const drain = dt * (rush ? 1.18 : 1);
    for (const ticket of this.tickets) ticket.patience -= drain;
    const lost = this.tickets.filter((t) => t.patience <= 0);
    this.tickets = this.tickets.filter((t) => t.patience > 0);
    for (const ticket of lost) onLost(ticket);
  }

  spawn(dayCfg) {
    const menu = recipesForDay(dayCfg.day);
    const recipe = menu[Math.floor(this.rng() * menu.length)];
    const patience = dayCfg.patience * (0.9 + this.rng() * 0.25);
    const ticket = {
      id: nextOrderId++,
      customer: makeCustomer(this.rng),
      recipe,
      patience,
      patienceMax: patience,
      bornAt: performance.now() / 1000,
    };
    this.tickets.push(ticket);
    return ticket;
  }

  // Finds the happiest match for a finished plate: the ticket asking for
  // this recipe with the least patience left (serve the urgent one first).
  matchFor(recipeId) {
    let best = null;
    for (const ticket of this.tickets) {
      if (ticket.recipe.id !== recipeId) continue;
      if (!best || ticket.patience < best.patience) best = ticket;
    }
    return best;
  }

  remove(ticket) {
    this.tickets = this.tickets.filter((t) => t !== ticket);
  }

  moodOf(ticket) {
    return Math.max(0, Math.min(1, ticket.patience / ticket.patienceMax));
  }

  payoutFor(ticket) {
    return ticket.recipe.price + tipFor(ticket);
  }
}
