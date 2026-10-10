"use client";
import type { GameKind } from "@/lib/types";
import { useShell } from "@/components/shell/context";
export default function GameLaunch({
  kind,
  label,
}: {
  kind: GameKind;
  label?: string;
}) {
  const s = useShell();
  return (
    <button
      data-game-launch={kind}
      className="button game-launch"
      disabled={s.fallback}
      onClick={(e) => {
        s.returnFocus.current = e.currentTarget;
        s.setGameKind(kind);
        s.setMode("game");
        s.setGame("ready");
      }}
    >
      {label ??
        s.t(
          `Jogar ${kind[0].toUpperCase() + kind.slice(1)}`,
          `Play ${kind === "percurso" ? "Passage" : kind === "travessia" ? "Crossing" : "Fragments"}`,
        )}{" "}
      <span>↗</span>
    </button>
  );
}
