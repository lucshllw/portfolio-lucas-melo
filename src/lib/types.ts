export type Locale = "pt" | "en";
export type Copy = Record<Locale, string>;
export type GameKind = "percurso" | "travessia" | "fragmentos";
export type GateState =
  "loading" | "awaitingActivation" | "entering" | "portfolio";
export type GameState =
  "ready" | "playing" | "paused" | "respawning" | "completed";
export type WorldMode = "intro" | "portfolio" | "gallery" | "game" | "case";
export type Project = {
  preview?: "tasks" | "workflow" | "network" | "game";
  game?: GameKind;
  experience?: "fenda" | "correntes" | "materia";
  url?: string;
  slug: string;
  title: Copy;
  description: Copy;
  problem: Copy;
  contribution: Copy;
  decisions: Copy;
  evidence: Copy;
  technologies: string[];
  media: string[];
  published: boolean;
  kind: Copy;
};
export type CaseStudy = Project;
export type Experiment = {
  id: string;
  title: Copy;
  description: Copy;
  instruction: Copy;
  technique: string;
};
export type GalleryPiece = Experiment & { position: [number, number, number] };
export type CharacterConfig = {
  color: string;
  light: string;
  shadow: string;
  capsule: { radius: number; halfHeight: number };
};
export type MotionChapter = {
  id: string;
  camera: [number, number, number];
  target: [number, number, number];
  fov: number;
  mobileCamera: [number, number, number];
  rotation: number;
  key: number;
  objects: string[];
};
export type Platform = {
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  checkpoint: boolean;
};
export type LevelConfig = {
  platforms: Platform[];
  speed: number;
  jumpSpeed: number;
  gravity: number;
  step: number;
  coyote: number;
  buffer: number;
};
