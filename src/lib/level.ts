import type { LevelConfig } from "./types";
// Units in meters; each landing is wider than the capsule. The two larger
// gaps cannot be crossed by autostep and require a deliberate jump.
export const level: LevelConfig = {
  speed: 2.5,
  jumpSpeed: 5.9,
  gravity: -15,
  step: 1 / 60,
  coyote: 0.1,
  buffer: 0.12,
  platforms: Array.from({ length: 14 }, (_, i) => ({
    x: 0,
    y: i * 0.32,
    z: i * 1.65 + (i >= 6 ? 0.6 : 0) + (i >= 11 ? 0.6 : 0),
    width: i === 5 || i === 10 ? 3 : 2.5,
    depth: i === 0 || i === 13 ? 1.8 : 1.3,
    checkpoint: i === 5 || i === 10,
  })),
};
export function checkpointAt(platform: number, current: number) {
  return level.platforms[platform]?.checkpoint && platform > current
    ? platform
    : current;
}
