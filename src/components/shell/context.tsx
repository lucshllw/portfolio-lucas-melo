"use client";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
  type MutableRefObject,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { addVisit, parseVisits } from "@/lib/visits";
import type {
  GateState,
  Locale,
  WorldMode,
  GameState,
  GameKind,
} from "@/lib/types";
type ShellContext = {
  locale: Locale;
  setLocale: (x: Locale) => void;
  t: (pt: string, en: string) => string;
  gate: GateState;
  setGate: (x: GateState) => void;
  mode: WorldMode;
  setMode: (x: WorldMode) => void;
  piece: number;
  setPiece: (x: number) => void;
  openPiece: boolean;
  setOpenPiece: (x: boolean) => void;
  game: GameState | null;
  setGame: (x: GameState | null) => void;
  gameKind: GameKind;
  setGameKind: (x: GameKind) => void;
  returnFocus: MutableRefObject<HTMLElement | null>;
  visited: string[];
  markVisited: (id: string) => void;
  clearVisited: () => void;
  discovery: boolean;
  setDiscovery: (value: boolean) => void;
  caseReturn: MutableRefObject<{
    scroll: number;
    index: number;
    focusId: string;
  } | null>;
  story: MutableRefObject<{
    hero: number;
    heroExact: number;
    projects: number;
    projectsExact: number;
    projectCount: number;
    projectScenes: string[];
    skills: number;
    lab: number;
    contact: number;
    entry: number;
  }>;
  fallback: boolean;
  setFallback: (x: boolean) => void;
  worldReady: boolean;
  setWorldReady: (x: boolean) => void;
  characterActive: boolean;
  setCharacterActive: (x: boolean) => void;
  inputs: MutableRefObject<Set<string>>;
  inspection: MutableRefObject<{ yaw: number; zoom: number; reset: number; open: number; light: number; hoverX: number; hoverY: number; hovered: boolean }>;
};
const Context = createContext<ShellContext | null>(null);
export function useShell() {
  const ctx = useContext(Context);
  if (!ctx) throw Error("Shell missing");
  return ctx;
}
export function ShellProvider({ children }: { children: ReactNode }) {
  const [visited, setVisited] = useState<string[]>([]);
  const [visitsReady, setVisitsReady] = useState(false);
  const [discovery, setDiscovery] = useState(false);
  useEffect(() => {
    try { setVisited(parseVisits(localStorage.getItem("lm-visited-v1"))); } catch {}
    setVisitsReady(true);
  }, []);
  useEffect(() => {
    if (!visitsReady) return;
    try { localStorage.setItem("lm-visited-v1", JSON.stringify(visited)); } catch {}
  }, [visited, visitsReady]);
  const markVisited = useCallback((id: string) => setVisited(previous => addVisit(previous, id)), []);
  const clearVisited = useCallback(() => setVisited([]), []);
  const [locale, setLocale] = useState<Locale>("pt"),
    [gate, setGate] = useState<GateState>("loading"),
    [mode, setMode] = useState<WorldMode>("intro"),
    [piece, setPiece] = useState(0),
    [openPiece, setOpenPiece] = useState(false),
    [game, setGame] = useState<GameState | null>(null),
    [gameKind, setGameKind] = useState<GameKind>("percurso"),
    [fallback, setFallback] = useState(false),
    [worldReady, setWorldReady] = useState(false),
    [characterActive, setCharacterActive] = useState(false);
  const inputs = useRef(new Set<string>()),
    returnFocus = useRef<HTMLElement | null>(null),
    caseReturn = useRef<{
      scroll: number;
      index: number;
      focusId: string;
    } | null>(null),
    story = useRef({
      hero: 0,
      heroExact: 0,
      projects: 0,
      projectsExact: 0,
      projectCount: 6,
      projectScenes: [] as string[],
      skills: 0,
      lab: 0,
      contact: 0,
      entry: 0,
    }),
    inspection = useRef({ yaw: 0, zoom: 1, reset: 0, open: 0, light: 0, hoverX: 0, hoverY: 0, hovered: false });
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (pt: string, en: string) => (locale === "pt" ? pt : en),
      gate,
      setGate,
      mode,
      setMode,
      piece,
      setPiece,
      openPiece,
      setOpenPiece,
      game,
      setGame,
      gameKind,
      setGameKind,
      returnFocus,
      visited,
      markVisited,
      clearVisited,
      discovery,
      setDiscovery,
      caseReturn,
      story,
      fallback,
      setFallback,
      worldReady,
      setWorldReady,
      characterActive,
      setCharacterActive,
      inputs,
      inspection,
    }),
    [
      locale,
      gate,
      mode,
      piece,
      openPiece,
      game,
      gameKind,
      fallback,
      worldReady,
      characterActive,
      visited,
      markVisited,
      clearVisited,
      discovery,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
