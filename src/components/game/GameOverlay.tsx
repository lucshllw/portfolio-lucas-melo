"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useShell } from "@/components/shell/context";
import "./games.css";
const descriptions = {
  percurso: {
    name: ["Percurso", "Passage"],
    title: ["Um passo de cada vez.", "One step at a time."],
    objective: [
      "14 plataformas. Dois patamares salvos. Alcance o pedestal final.",
      "14 platforms. Two saved landings. Reach the final pedestal.",
    ],
    hint: [
      "Siga em frente e salte entre os degraus.",
      "Move forward and jump between steps.",
    ],
  },
  travessia: {
    name: ["Travessia", "Crossing"],
    title: ["O caminho também se move.", "The path moves too."],
    objective: [
      "Espere os patamares móveis se alinharem, salte e alcance a margem final. O patamar central salva seu progresso.",
      "Wait for the moving decks to align, jump and reach the far bank. The central landing saves your progress.",
    ],
    hint: [
      "A faixa branca se preenche antes da inversão. Espere o alinhamento e salte; o patamar carrega você.",
      "The white strip fills before each reversal. Wait for alignment and jump; the deck carries you.",
    ],
  },
  fragmentos: {
    name: ["Fragmentos", "Fragments"],
    title: ["O todo começa nas partes.", "The whole begins with its parts."],
    objective: [
      "Caminhe pelo pavilhão, aproxime-se dos cinco fragmentos prateados e volte ao círculo central para recompor a escultura.",
      "Walk through the pavilion, approach all five silver fragments and return to the central circle to rebuild the sculpture.",
    ],
    hint: [
      "As peças são recolhidas por aproximação. Depois da quinta, retorne ao centro.",
      "Approach each piece to collect it. After the fifth, return to the center.",
    ],
  },
};
export default function GameOverlay({ onClose }: { onClose: () => void }) {
  const s = useShell(),
    root = useRef<HTMLDivElement>(null),
    state = useRef(s.game);
  const [checkpoint, setCheckpoint] = useState(0),
    [fragments, setFragments] = useState(0),
    [assembling, setAssembling] = useState(false);
  const { inputs, setGame, returnFocus } = s,
    copy = descriptions[s.gameKind];
  const translated = (pair: string[]) => s.t(pair[0], pair[1]);
  useEffect(() => {
    state.current = s.game;
    if (s.game !== "playing") inputs.current.clear();
  }, [s.game, inputs]);
  useEffect(() => {
    const keys = inputs.current,
      previous = document.activeElement as HTMLElement | null,
      launcher = returnFocus.current;
    const x = window.scrollX,
      y = window.scrollY,
      before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus({ preventScroll: true });
    const pause = () => {
      keys.clear();
      if (state.current === "playing" || state.current === "respawning")
        setGame("paused");
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    const notifyCheckpoint = (e: Event) =>
      setCheckpoint((e as CustomEvent<number>).detail);
    const notifyFragments = (e: Event) =>
      setFragments((e as CustomEvent<number>).detail);
    const notifyAssembly = (e: Event) => setAssembling((e as CustomEvent<boolean>).detail);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", pause);
    window.addEventListener("lm-checkpoint", notifyCheckpoint);
    window.addEventListener("lm-fragments", notifyFragments);
    window.addEventListener("lm-assembly", notifyAssembly);
    return () => {
      keys.clear();
      document.body.style.overflow = before;
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", pause);
      window.removeEventListener("lm-checkpoint", notifyCheckpoint);
      window.removeEventListener("lm-fragments", notifyFragments);
      window.removeEventListener("lm-assembly", notifyAssembly);
      window.scrollTo({ left: x, top: y, behavior: "instant" });
      const destination = launcher?.isConnected ? launcher : previous;
      if (destination?.isConnected) destination.focus({ preventScroll: true });
    };
  }, [inputs, setGame, returnFocus]);
  const restart = () => {
    inputs.current.clear();
    window.dispatchEvent(new Event("lm-restart"));
    root.current?.focus({ preventScroll: true });
  };
  const togglePause = () => {
    inputs.current.clear();
    if (s.game === "playing" || s.game === "respawning") setGame("paused");
    else if (s.game === "paused") setGame("playing");
    root.current?.focus({ preventScroll: true });
  };
  const hold = (key: string) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    root.current?.focus({ preventScroll: true });
    if (state.current === "playing") inputs.current.add(key);
  };
  // Jump is a queued action consumed by the fixed physics step, even for a quick tap.
  const release = (key: string) => () => {
    if (key !== "jump") inputs.current.delete(key);
  };
  const progress =
    s.gameKind === "fragmentos"
      ? `${s.t("Fragmentos", "Fragments")}: ${fragments} / 5${assembling && s.game !== "completed" ? s.t(" · Recompondo a forma", " · Rebuilding the form") : fragments === 5 && s.game !== "completed" ? s.t(" · Volte ao círculo iluminado", " · Return to the lit circle") : ""}`
      : `${s.t("Patamar salvo", "Saved landing")}: ${checkpoint === 0 ? s.t("Início", "Start") : s.gameKind === "travessia" ? (checkpoint === 4 ? s.t("Centro", "Center") : s.t("Final", "Finish")) : checkpoint === 5 ? "01" : "02"}`;
  return (
    <div
      className="game-overlay"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={translated(copy.name)}
      tabIndex={-1}
      data-game-kind={s.gameKind}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          inputs.current.clear();
          if (state.current === "playing" || state.current === "respawning")
            setGame("paused");
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          togglePause();
          return;
        }
        if (e.key === "Tab") {
          const items = [
              ...root.current!.querySelectorAll<HTMLElement>(
                "button:not(:disabled)",
              ),
            ],
            first = items[0],
            last = items.at(-1);
          if (
            e.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === root.current)
          ) {
            e.preventDefault();
            last?.focus();
          } else if (
            !e.shiftKey &&
            (document.activeElement === last ||
              document.activeElement === root.current)
          ) {
            e.preventDefault();
            first?.focus();
          }
          inputs.current.clear();
          return;
        }
        if ((e.target as HTMLElement).closest("button,input,select,textarea"))
          return;
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (key === "r") {
          e.preventDefault();
          if (!e.repeat) restart();
          return;
        }
        if (
          [
            "w",
            "a",
            "s",
            "d",
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            " ",
          ].includes(key)
        ) {
          e.preventDefault();
          if (state.current === "playing" && !e.repeat)
            inputs.current.add(key === " " ? "jump" : key);
        }
      }}
      onKeyUp={(e) => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (key !== " ") inputs.current.delete(key);
      }}
    >
      <div className="game-header">
        <div>
          <span className="eyebrow">
            {s.t("Diorama jogável", "Playable diorama")} /{" "}
            {translated(copy.name)}
          </span>
          <h2>{translated(copy.title)}</h2>
        </div>
        <div className="game-actions">
          <button
            onClick={togglePause}
            disabled={s.game === "ready" || s.game === "completed"}
          >
            {s.game === "paused"
              ? s.t("Continuar", "Resume")
              : s.t("Pausar", "Pause")}
          </button>
          <button onClick={restart}>{s.t("Reiniciar", "Restart")}</button>
          <button onClick={onClose}>{s.t("Sair", "Exit")} ×</button>
        </div>
      </div>
      <div className="game-stage scene-slot" data-world-target="game">
        <div className="checkpoint-label" aria-live="polite">
          {progress}
          {s.gameKind === "fragmentos" ? <span className="fragment-progress" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((index) => <i key={index} data-found={index < fragments} />)}
          </span> : null}
        </div>
        {s.game !== "playing" ? (
          <div
            className={
              "game-state " + (s.game === "respawning" ? "respawning" : "")
            }
            aria-live="polite"
          >
            <h3>
              {s.game === "ready"
                ? s.t("Encontre seu caminho.", "Find your way.")
                : s.game === "paused"
                  ? s.t("Uma pausa no caminho.", "A pause along the way.")
                  : s.game === "respawning"
                    ? s.t(
                        s.gameKind === "fragmentos" ? "De volta ao pavilhão." : "De volta ao último patamar.",
                        s.gameKind === "fragmentos" ? "Back to the pavilion." : "Back to the last landing.",
                      )
                    : s.gameKind === "fragmentos"
                      ? s.t("A forma está completa.", "The form is complete.")
                      : s.t("Você chegou.", "You made it.")}
            </h3>
            <p>
              {s.game === "ready"
                ? translated(copy.objective)
                : s.game === "paused"
                  ? s.t(
                      "Seu progresso está guardado nesta sessão.",
                      "Your progress is kept in this session.",
                    )
                  : s.game === "completed"
                    ? s.gameKind === "fragmentos"
                      ? s.t(
                          "Cinco peças, uma nova escultura.",
                          "Five pieces, one new sculpture.",
                        )
                      : s.t(
                          "Cada solução começa com um primeiro passo.",
                          "Every solution begins with a first step.",
                        )
                    : ""}
            </p>
            {s.game === "ready" || s.game === "paused" ? (
              <button
                className="button"
                onClick={() => {
                  inputs.current.clear();
                  setGame("playing");
                  root.current?.focus({ preventScroll: true });
                }}
              >
                {s.game === "ready"
                  ? s.t("Começar", "Start")
                  : s.t("Continuar", "Resume")}{" "}
                ↗
              </button>
            ) : s.game === "completed" ? (
              <div className="actions">
                <button className="button" onClick={restart}>
                  {s.t("Rejogar", "Play again")}
                </button>
                <button onClick={onClose}>
                  {s.t("Voltar à galeria", "Back to gallery")}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="game-footer">
        <p>
          {s.t(
            "WASD ou setas: mover · Espaço: pular · R: reiniciar · Esc: pausar",
            "WASD or arrows: move · Space: jump · R: restart · Esc: pause",
          )}
          <small>{translated(copy.hint)}</small>
        </p>
        <div className="touch-controls">
          <div className="d-pad">
            {[
              ["w", "↑"],
              ["a", "←"],
              ["s", "↓"],
              ["d", "→"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-label={s.t("Mover", "Move") + " " + label}
                onPointerDown={hold(key)}
                onPointerUp={release(key)}
                onPointerCancel={release(key)}
                onLostPointerCapture={release(key)}
                disabled={s.game !== "playing" || assembling}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="jump-button"
            onPointerDown={hold("jump")}
            onPointerUp={release("jump")}
            onPointerCancel={release("jump")}
            onLostPointerCapture={release("jump")}
            disabled={s.game !== "playing" || assembling}
          >
            {s.t("Pular", "Jump")}
          </button>
        </div>
      </div>
    </div>
  );
}
