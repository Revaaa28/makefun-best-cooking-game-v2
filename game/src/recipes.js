// Saffron Hour — Rooftop Kitchen: the menu. Ingredients say where they are
// prepped (bin = straight to the plate, board = chopped, grill / fryer =
// cooked, tap = poured); recipes are the dishes orders ask for.

export const INGREDIENTS = {
  bun:     { name: 'Bun',     prep: 'bin',   color: '#e8a54b' },
  patty:   { name: 'Patty',   prep: 'grill', color: '#7a4a21' },
  chicken: { name: 'Chicken', prep: 'fryer', color: '#d98e32' },
  cheese:  { name: 'Cheese',  prep: 'bin',   color: '#f6b73c' },
  tomato:  { name: 'Tomato',  prep: 'board', color: '#e2483d' },
  lettuce: { name: 'Lettuce', prep: 'board', color: '#58b368' },
  onion:   { name: 'Onion',   prep: 'board', color: '#b388d9' },
  egg:     { name: 'Egg',     prep: 'grill', color: '#f8e08a' },
  potato:  { name: 'Potato',  prep: 'fryer', color: '#d9b06a', makes: 'fries' },
  fries:   { name: 'Fries',   prep: 'fryer', color: '#f2c14e' },
  drink:   { name: 'Berry Fizz', prep: 'tap', color: '#c93b5e' },
};

// What a bin hands the chef. The potato bin hands over raw potato, which the
// fryer turns into fries; every other bin maps to its own finished item once
// its prep is done.
export const BIN_ORDER = ['bun', 'patty', 'chicken', 'cheese', 'tomato', 'lettuce', 'onion', 'egg', 'potato'];

export const RECIPES = [
  { id: 'ladle-classic',   name: 'Ladle Classic',   items: ['bun', 'patty', 'cheese'],                          price: 13, day: 1 },
  { id: 'garden-stack',    name: 'Garden Stack',    items: ['bun', 'patty', 'lettuce', 'tomato'],               price: 15, day: 1 },
  { id: 'crispy-chick',    name: 'Crispy Chick',    items: ['bun', 'chicken', 'lettuce'],                       price: 14, day: 1 },
  { id: 'sunrise-melt',    name: 'Sunrise Melt',    items: ['bun', 'egg', 'cheese', 'tomato'],                   price: 15, day: 1 },
  { id: 'market-salad',    name: 'Market Salad',    items: ['lettuce', 'tomato', 'onion', 'egg'],               price: 14, day: 1 },
  { id: 'double-ember',    name: 'Double Ember',    items: ['bun', 'patty', 'patty', 'cheese', 'onion'],        price: 19, day: 2 },
  { id: 'fry-basket',      name: 'Fry Basket',      items: ['fries', 'chicken'],                                price: 16, day: 2 },
  { id: 'saffron-supreme', name: 'Saffron Supreme', items: ['bun', 'chicken', 'cheese', 'tomato', 'onion'],     price: 20, day: 3 },
  { id: 'full-brunch',     name: 'Full Brunch',     items: ['bun', 'egg', 'patty', 'cheese', 'fries', 'drink'], price: 24, day: 3 },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function recipesForDay(day) {
  return RECIPES.filter((r) => r.day <= day);
}

// A plate matches a recipe when it holds exactly the recipe's items, in any
// order (the two patties of a Double Ember count twice).
export function plateMatches(items, recipe) {
  if (items.length !== recipe.items.length) return false;
  const need = [...recipe.items].sort();
  const have = [...items].sort();
  return need.every((item, i) => item === have[i]);
}

// Tip grows with the patience left at serve time; the combo multiplier is
// applied by the caller on top of this.
export function tipFor(order) {
  const left = Math.max(0, order.patience / order.patienceMax);
  return Math.round(order.recipe.price * 0.5 * left);
}
