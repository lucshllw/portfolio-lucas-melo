import { describe, expect, it } from "vitest";
import * as levels from "../src/lib/game-levels";

describe("moving deck anticipation", () => {
  it("warns before both ends, then clears after the reversal", () => {
    expect(levels).toHaveProperty("reversalCue");
    const deck = levels.gameLevels.travessia.platforms[1];
    const cue = (time: number) => levels.reversalCue(deck, time);
    expect(cue(0).warning).toBe(0);
    expect(cue(1.5).warning).toBeGreaterThan(0);
    expect(cue(1.9).warning).toBeGreaterThan(cue(1.5).warning);
    expect(cue(2.01).warning).toBe(0);
    expect(cue(2.01).direction).toBe(-1);
    expect(cue(5.8).warning).toBeGreaterThan(0);
    expect(cue(6.01).direction).toBe(1);
    expect(cue(6.01).warning).toBe(0);
  });
  it("never signals an immobile landing", () => {
    expect(levels).toHaveProperty("reversalCue");
    expect(levels.reversalCue(levels.gameLevels.percurso.platforms[0], 1.8))
      .toEqual({ warning: 0, direction: 0 });
  });
});

describe("visible sculpture assembly", () => {
  it("does not complete immediately and remains bounded at the final pose", () => {
    expect(levels).toHaveProperty("advanceAssembly");
    expect(levels.advanceAssembly(0, 1 / 60, false)).toBeLessThan(0.02);
    expect(levels.advanceAssembly(0, 1, false)).toBeLessThan(1);
    expect(levels.advanceAssembly(0.99, 0.1, false)).toBe(1);
    expect(levels.advanceAssembly(0.4, 0, false)).toBe(0.4);
    expect(levels.advanceAssembly(0, 1 / 60, true)).toBe(1);
  });
});
