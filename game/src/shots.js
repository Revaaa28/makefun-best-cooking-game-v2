// Saffron Hour — Rooftop Kitchen: staged scenes for the maker's screenshots
// (shots.json names them). Each scene arranges a real, reachable game state
// — tickets, stations mid-work, a dish mid-assembly — and freezes it, so the
// screenshot is the game itself at its busiest, never a mock-up.

import { recipeById } from './recipes.js';
import { makeCustomer } from './customers.js';
import { SHIFT_SECONDS, DAYS } from './config.js';

function ticket(state, recipeId, patience, patienceMax) {
  return {
    id: 900 + state.orders.tickets.length,
    customer: makeCustomer(state.rng),
    recipe: recipeById(recipeId),
    patience,
    patienceMax,
    bornAt: 0,
  };
}

export function stageShot(state, name) {
  const k = state.kitchen;
  state.screen = 'play';
  state.day = 1;
  if (name === 'cover') {
    state.timeLeft = 83;
    state.money = 86;
    state.served = 5;
    state.combo = 4;
    state.orders.tickets = [
      ticket(state, 'garden-stack', 41, 62),
      ticket(state, 'ladle-classic', 54, 62),
      ticket(state, 'market-salad', 19, 62),
      ticket(state, 'sunrise-melt', 58, 62),
    ];
    k.grill[0] = { ing: 'patty', t: 3.1, state: 'cooking', over: 0 };
    k.grill[1] = { ing: 'patty', t: 5, state: 'ready', over: 0 };
    k.board[0] = { ing: 'tomato', ready: true };
    k.board[1] = { ing: 'lettuce', ready: false };
    k.fryer[0] = { ing: 'chicken', t: 2.2, state: 'cooking', over: 0 };
    k.tap = { t: -1, ready: true };
    k.plates[0].items = ['bun', 'patty'];
    k.plates[1].items = ['lettuce', 'tomato', 'onion', 'egg'];
    k.chef.x = 905; k.chef.y = 565;
    k.chef.carry = { ing: 'cheese', state: 'ready' };
    state.passGlow = true;
    state.hint = { text: 'Cheese onto the Ladle Classic, then serve it at the pass!', t: 0 };
    state.particles.popup(1090, 330, '+$14', '#ffd97a');
    state.particles.steam(390, 400, 6);
    state.particles.steam(700, 400, 4);
  } else if (name === 'orders') {
    state.timeLeft = 158;
    state.money = 12;
    state.served = 1;
    state.combo = 1;
    state.orders.tickets = [
      ticket(state, 'crispy-chick', 57, 62),
      ticket(state, 'garden-stack', 60, 62),
    ];
    k.plates[1].items = ['bun'];
    k.chef.x = 731; k.chef.y = 488;
    k.chef.carry = { ing: 'chicken', state: 'raw' };
    state.hint = { text: 'Chicken goes in the FRYER — the chef is on his way.', t: 0 };
  } else if (name === 'rush') {
    state.timeLeft = 38;
    state.rush = true;
    state.banner = { text: '🍳 DINNER RUSH!', t: 1 };
    state.money = 128;
    state.served = 11;
    state.combo = 5;
    state.orders.tickets = [
      ticket(state, 'double-ember', 9, 56),
      ticket(state, 'fry-basket', 30, 56),
      ticket(state, 'saffron-supreme', 44, 56),
      ticket(state, 'ladle-classic', 51, 56),
    ];
    state.day = 2;
    state.dayCfg = { ...DAYS[1], day: 2 };
    k.grill[0] = { ing: 'patty', t: 4.4, state: 'cooking', over: 0 };
    k.grill[1] = { ing: 'patty', t: 5, state: 'ready', over: 0 };
    k.grill[2] = { ing: 'egg', t: 1.5, state: 'cooking', over: 0 };
    k.fryer[0] = { ing: 'fries', t: 4.2, state: 'ready', over: 0 };
    k.fryer[1] = { ing: 'chicken', t: 2.8, state: 'cooking', over: 0 };
    k.board[0] = { ing: 'onion', ready: true };
    k.tap = { t: 0.9, ready: false };
    k.plates[0].items = ['bun', 'patty', 'patty', 'cheese'];
    k.plates[1].items = ['fries'];
    k.chef.x = 905; k.chef.y = 565;
    k.chef.carry = { ing: 'onion', state: 'ready' };
    state.passGlow = true;
    state.hint = { text: 'The Double Ember leaves in 9 seconds — onion on, plate up, serve!', t: 0 };
    state.particles.popup(1090, 330, '+$18', '#ffd97a');
    state.particles.steam(390, 400, 8);
    state.particles.steam(700, 400, 6);
  } else if (name === 'results') {
    state.screen = 'results';
    state.results = { day: 1, money: 132, goal: 110, served: 14, lost: 1, bestCombo: 6, bank: 132, stars: 3 };
    state.money = 132;
    state.served = 14;
    state.lost = 1;
    state.timeLeft = 0;
    state.orders.tickets = [ticket(state, 'garden-stack', 50, 62)];
  } else {
    state.timeLeft = SHIFT_SECONDS;
  }
}
