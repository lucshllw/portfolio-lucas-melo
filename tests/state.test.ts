import { describe, it, expect } from "vitest";
import {
  gateTransition,
  scrollProgress,
  selectionIndex,
} from "../src/lib/state";
import { level, checkpointAt } from "../src/lib/level";
describe("explicit activation", () => {
  it("wait, hover and scroll cannot enter", () => {
    for (const event of ["wait", "hover", "scroll"])
      expect(gateTransition("awaitingActivation", event)).toBe(
        "awaitingActivation",
      );
  });
  it("loading only becomes available; activation once then reveal", () => {
    expect(gateTransition("loading", "ready")).toBe("awaitingActivation");
    expect(gateTransition("awaitingActivation", "activate")).toBe("entering");
    expect(gateTransition("entering", "activate")).toBe("entering");
    expect(gateTransition("entering", "finished")).toBe("portfolio");
  });
});
it("progress is native, bounded, reversible and handles short documents", () => {
  expect(scrollProgress(0, 3000, 900)).toBe(0);
  expect(scrollProgress(1050, 3000, 900)).toBe(0.5);
  expect(scrollProgress(2100, 3000, 900)).toBe(1);
  expect(scrollProgress(-10, 3000, 900)).toBe(0);
  expect(scrollProgress(0, 700, 900)).toBe(0);
});
it("selection supports endpoints and reverse scroll", () => {
  expect([0, 0.5, 1, 0.5, 0].map((p) => selectionIndex(p, 3))).toEqual([
    0, 1, 2, 1, 0,
  ]);
});
it("level has 14 fixed platforms, two checkpoints and jumpable gaps", () => {
  expect(level.platforms).toHaveLength(14);
  expect(level.platforms.filter((p) => p.checkpoint)).toHaveLength(2);
  for (let i = 1; i < 14; i++) {
    const a = level.platforms[i - 1],
      b = level.platforms[i];
    expect(b.y - a.y).toBeLessThan(0.7);
    expect(b.z - a.z - (a.depth + b.depth) / 2).toBeLessThan(1.4);
  }
  expect(checkpointAt(4, 0)).toBe(0);
  expect(checkpointAt(5, 0)).toBe(5);
  expect(checkpointAt(3, 5)).toBe(5);
  expect(checkpointAt(10, 5)).toBe(10);
});
