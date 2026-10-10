import type { GameKind, Platform, LevelConfig } from "./types";
import { level } from "./level";
export type Point = { x: number; y: number; z: number };
export type GamePlatform = Platform & {
  motion?: { amplitude: number; period: number; phase: number };
};
export type GameLevel = Omit<LevelConfig, "platforms"> & {
  kind: GameKind;
  platforms: GamePlatform[];
  fragments: Point[];
  center: Point;
  finish: number;
};
export const gameLevels: Record<GameKind, GameLevel> = {
  percurso: {
    ...level,
    kind: "percurso",
    fragments: [],
    center: { x: 0, y: 0, z: 0 },
    finish: 13,
  },
  travessia: {
    ...level,
    kind: "travessia",
    finish: 8,
    fragments: [],
    center: { x: 0, y: 0, z: 0 },
    platforms: Array.from({ length: 9 }, (_, i) => ({
      x: 0,
      y: 0,
      z: i * 3.2,
      width: i % 2 ? 2.2 : 3.4,
      depth: i % 2 ? 1.8 : 2.2,
      checkpoint: i === 4 || i === 8,
      ...(i % 2
        ? {
            motion: {
              amplitude: 1.45,
              period: 8,
              phase: ((i - 1) * Math.PI) / 4,
            },
          }
        : {}),
    })),
  },
  fragmentos: {
    ...level,
    kind: "fragmentos",
    finish: -1,
    center: { x: 0, y: 0.55, z: 5 },
    platforms: [{ x: 0, y: 0, z: 5, width: 10, depth: 12, checkpoint: false }],
    fragments: [
      { x: -3, y: 0.7, z: 2 },
      { x: 3, y: 0.7, z: 2 },
      { x: -3, y: 0.7, z: 8 },
      { x: 3, y: 0.7, z: 8 },
      { x: 0, y: 0.7, z: 10 },
    ],
  },
};
export function platformPosition(p: GamePlatform, time: number): Point {
  return {
    x:
      p.x +
      (p.motion
        ? p.motion.amplitude *
          Math.sin((time * 2 * Math.PI) / p.motion.period + p.motion.phase)
        : 0),
    y: p.y,
    z: p.z,
  };
}
/** The silver inlay fills during the 700 ms immediately BEFORE each reversal. */
export function reversalCue(p: GamePlatform, time: number) {
  if (!p.motion) return { warning: 0, direction: 0 };
  const phase = (time * Math.PI * 2) / p.motion.period + p.motion.phase;
  const toTurn = ((Math.PI / 2 - phase) % Math.PI + Math.PI) % Math.PI;
  const seconds = (toTurn * p.motion.period) / (Math.PI * 2);
  return {
    warning: Math.max(0, 1 - seconds / 0.7),
    direction: Math.cos(phase) >= 0 ? 1 : -1,
  };
}
export function advanceAssembly(progress: number, delta: number, reduced: boolean) {
  return reduced ? 1 : Math.min(1, progress + Math.max(0, delta) / 1.8);
}
export function fixedBudget(remainder: number, delta: number) {
  const step = 1 / 60,
    total = remainder + Math.min(Math.max(delta, 0), step * 5);
  const steps = Math.min(5, Math.floor((total + 1e-9) / step));
  return { steps, remainder: Math.max(0, total - steps * step) };
}
export function fragmentReached(position: Point, fragment: Point) {
  return (
    Math.hypot(
      position.x - fragment.x,
      position.y - fragment.y,
      position.z - fragment.z,
    ) < 0.85
  );
}
export function savedLanding(
  config: GameLevel,
  index: number,
  current: number,
) {
  return config.platforms[index]?.checkpoint && index > current
    ? index
    : current;
}
