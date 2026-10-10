import { expect, it } from "vitest";
import {
  gameLevels,
  platformPosition,
  fixedBudget,
  fragmentReached,
  savedLanding,
} from "../src/lib/game-levels";

it("preserves Percurso checkpoints and gives Travessia real moving gaps", () => {
  expect(gameLevels.percurso.platforms).toHaveLength(14);
  expect(savedLanding(gameLevels.percurso, 5, 0)).toBe(5);
  expect(savedLanding(gameLevels.percurso, 10, 5)).toBe(10);
  const moving = gameLevels.travessia.platforms[1];
  expect(platformPosition(moving, 1)).not.toEqual(platformPosition(moving, 0));
  expect(savedLanding(gameLevels.travessia, 4, 0)).toBe(4);
});
it("advances equal simulation time at 60 and 144 Hz and caps a stalled frame", () => {
  for (const hz of [60, 144]) {
    let remainder = 0,
      steps = 0;
    for (let i = 0; i < hz; i++) {
      const budget = fixedBudget(remainder, 1 / hz);
      remainder = budget.remainder;
      steps += budget.steps;
    }
    expect(steps).toBe(60);
  }
  expect(fixedBudget(0, 2).steps).toBe(5);
});
it("collects only within real three-dimensional proximity", () => {
  expect(
    fragmentReached({ x: 0, y: 0.55, z: 0 }, { x: 0.5, y: 0.7, z: 0 }),
  ).toBe(true);
  expect(fragmentReached({ x: 0, y: 3, z: 0 }, { x: 0, y: 0.7, z: 0 })).toBe(
    false,
  );
  expect(fragmentReached({ x: 0, y: 0.55, z: 0 }, { x: 2, y: 0.7, z: 0 })).toBe(
    false,
  );
});
