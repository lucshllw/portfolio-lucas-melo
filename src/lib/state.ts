import type { GateState } from "./types";
export function gateTransition(state: GateState, event: string): GateState {
  if (state === "loading" && event === "ready") return "awaitingActivation";
  if (state === "awaitingActivation" && event === "activate") return "entering";
  if (state === "entering" && event === "finished") return "portfolio";
  return state;
}
export function scrollProgress(y: number, height: number, viewport: number) {
  return height <= viewport
    ? 0
    : Math.max(0, Math.min(1, y / (height - viewport)));
}
export function selectionIndex(progress: number, count: number) {
  return Math.max(0, Math.min(count - 1, Math.floor(progress * count)));
}
