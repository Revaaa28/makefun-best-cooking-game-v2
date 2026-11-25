# Saffron Hour — Rooftop Kitchen

[![Competition](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/Revaaa28/makefun-best-cooking-game-v2/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/Revaaa28/makefun-best-cooking-game-v2/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A golden-hour cooking game for the make.fun **best cooking game** bounty. Guests hang their orders on the rail — each with a face, a name and a patience bar. You run the kitchen: grab ingredients from the crates, chop on the board, grill and fry (they keep cooking without you, and burn if you forget them), pour the Berry Fizz, build each dish on a plate at the assembly counter, and serve it at the pass before patience runs out.

- **9 recipes** across 3+ days, unlocking as the week goes on (Double Ember on day 2, Saffron Supreme and the Full Brunch on day 3)
- **6 stations**: ingredient crates, chopping board, grill, fryer, drinks tap and the pass — plus a trash bin for mistakes
- **Pressure that grows**: faster arrivals and thinner patience each day, and a Dinner Rush in the last minute of every shift
- **Combos and tips**: fast service pays a tip, streaks multiply it, a walk-out breaks it
- **Star goals** every day, with earnings banked across the week

## Play it

Serve the `game/` folder with any static file server and open `index.html` in a desktop browser — it plays fully offline from its own files. Mouse first (click a crate, then its station), with keyboard shortcuts: `1–9` crates, `C` chop, `G` grill, `F` fryer, `D` drinks, `A` assembly, `S` serve, `T` trash, `P` pause, `M` mute.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output and writes `dossier.json` with the vendored library
- `game/src/` — the game, one job per file: `config` (layout and timings), `recipes` (the menu), `orders` (tickets and patience), `kitchen` (chef and stations), `food-art` (every ingredient drawn in code), `customers` (the guests' faces), `particles` (steam, sparkles, popups), `audio` (a tiny WebAudio synth), `render` (the whole scene), `shots` (the staged scenes the screenshots were taken from), `main` (the day cycle and input)
- `screenshots/` — real renders of the game at its busiest
