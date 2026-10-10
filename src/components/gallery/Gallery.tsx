"use client";
import { motionCopy } from "@/components/ui/MotionCopy";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useShell } from "@/components/shell/context";
import { pieces } from "@/data/content";
import { PieceMark, CharacterFallback } from "@/components/ui/marks";
import { useDialogLock } from "@/components/shell/useDialogLock";
const Simulations = dynamic(() => import("./Simulations"), { ssr: false });
export default function Gallery() {
  const s = useShell(),
    dialog = useRef<HTMLDialogElement>(null),
    [reset, setReset] = useState(0),
    [param, setParam] = useState(0),
    drag = useRef<number | null>(null),
    list = useRef<HTMLDivElement>(null);
  const piece = pieces[s.piece];
  useDialogLock(s.openPiece);
  useEffect(() => {
    window.dispatchEvent(new Event("lm-inspection"));
  }, [param, reset]);
  const { setMode, setOpenPiece, setGame } = s;
  useEffect(() => {
    setMode("gallery");
    return () => {
      setOpenPiece(false);
      setGame(null);
    };
  }, [setMode, setOpenPiece, setGame]);
  const open = () => {
    setParam(0);
    setReset(0);
    s.inspection.current.yaw = 0;
    s.inspection.current.zoom = 1;
    setOpenPiece(true);
    dialog.current?.showModal();
  };
  const close = () => {
    dialog.current?.close();
    setOpenPiece(false);
  };
  return motionCopy(
    <main id="main" className="gallery-page">
      <div className="gallery-heading">
        <Link className="back-link" href="/#experimentos">
          ← {s.t("Voltar ao portfólio", "Back to portfolio")}
        </Link>
        <span>
          {s.t("Uma exposição de experiências", "An exhibition of experiences")}
        </span>
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {s.t("Galeria espacial", "Spatial gallery")}
          </span>
          <h1 tabIndex={-1}>
            {s.t("Ideias em movimento.", "Ideas in motion.")}
          </h1>
          <p>
            {s.t(
              "Escolha uma peça. Descubra o que seu gesto pode transformar.",
              "Choose a piece. Discover what your gesture can transform.",
            )}
          </p>
        </div>
        <span>0{s.piece + 1} / 08</span>
      </div>
      <div className="exhibition scene-slot" data-world-target="gallery">
        <div className="exhibition-floor" aria-hidden="true" />
        {s.fallback ? (
          <div className="gallery-static">
            {pieces.map((p, i) => (
              <button
                key={p.id}
                onClick={() => s.setPiece(i)}
                aria-label={p.title[s.locale]}
              >
                <PieceMark index={i} />
              </button>
            ))}
          </div>
        ) : null}
        <div className="exhibition-label">
          <span className="eyebrow">{piece.technique}</span>
          <h2>{piece.title[s.locale]}</h2>
          <p>{piece.description[s.locale]}</p>
          <button className="button" onClick={open}>
            {s.t("Explorar obra", "Explore piece")} ↗
          </button>
        </div>
        <span className="exhibition-location">
          {s.t(
            "Selecione abaixo ou toque em um pedestal",
            "Select below or tap a pedestal",
          )}
        </span>
      </div>
      <div
        ref={list}
        className="piece-list"
        role="tablist"
        aria-label={s.t("Obras da exposição", "Exhibition pieces")}
        onKeyDown={(e) => {
          let next = s.piece;
          if (e.key === "ArrowRight" || e.key === "ArrowDown")
            next = (next + 1) % 8;
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
            next = (next + 7) % 8;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = 7;
          else return;
          e.preventDefault();
          s.setPiece(next);
          list.current
            ?.querySelectorAll<HTMLButtonElement>("button")
            [next]?.focus();
        }}
      >
        {pieces.map((p, i) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={s.piece === i}
            tabIndex={s.piece === i ? 0 : -1}
            aria-controls="piece-description"
            onClick={() => s.setPiece(i)}
            onFocus={() => s.setPiece(i)}
          >
            <PieceMark index={i} />
            <span>
              <small>0{i + 1}</small>
              {p.title[s.locale]}
            </span>
          </button>
        ))}
      </div>
      <p className="gallery-instruction" id="piece-description" role="tabpanel">
        {piece.instruction[s.locale]}
      </p>
      <dialog
        ref={dialog}
        className="piece-modal"
        aria-label={piece.title[s.locale]}
        data-lenis-prevent
        onClose={() => setOpenPiece(false)}
      >
        <div className="piece-modal-header">
          <div>
            <span className="eyebrow">0{s.piece + 1} / 08</span>
            <h2>{piece.title[s.locale]}</h2>
          </div>
          <button onClick={close}>
            {s.t("Voltar à galeria", "Back to gallery")} ×
          </button>
        </div>
        <div
          className="piece-stage"
          {...(piece.id === "forma"
            ? { "data-world-target": "form" }
            : piece.id === "percurso"
              ? { "data-world-target": "gallery" }
              : {})}
          onPointerDown={
            piece.id === "forma"
              ? (e) => {
                  drag.current = e.clientX;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              : undefined
          }
          onPointerMove={
            piece.id === "forma"
              ? (e) => {
                  if (drag.current !== null) {
                    s.inspection.current.yaw = Math.max(
                      -Math.PI / 3,
                      Math.min(
                        Math.PI / 3,
                        s.inspection.current.yaw +
                          (e.clientX - drag.current) * 0.009,
                      ),
                    );
                    drag.current = e.clientX;
                  }
                }
              : undefined
          }
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          {s.openPiece ? (
            piece.id === "forma" ? (
              s.fallback ? (
                <div className="form-fallback">
                  <PieceMark index={3} />
                </div>
              ) : null
            ) : piece.id === "percurso" ? (
              <div className="passage-invite">
                <div className="passage-character">
                  <CharacterFallback
                    label={s.t(
                      "Criatura roxa de formas arredondadas",
                      "Rounded purple creature",
                    )}
                  />
                </div>
                <h3>
                  {s.t(
                    "Um passo. Um salto. Uma descoberta.",
                    "A step. A jump. A discovery.",
                  )}
                </h3>
                <p>
                  {s.t(
                    "Chegue ao último pedestal. Os dois patamares guardam seu progresso.",
                    "Reach the final pedestal. Two landings save your progress.",
                  )}
                </p>
                {(["percurso", "travessia", "fragmentos"] as const).map(
                  (kind) => (
                    <button
                      key={kind}
                      className="button"
                      data-game-launch={kind}
                      disabled={s.fallback}
                      onClick={() => {
                        s.returnFocus.current =
                          list.current?.querySelectorAll<HTMLButtonElement>(
                            "button",
                          )[7] ?? null;
                        dialog.current?.close();
                        s.setGameKind(kind);
                        setGame("ready");
                        setMode("game");
                      }}
                    >
                      {kind === "percurso"
                        ? s.t("Jogar percurso", "Play the passage")
                        : kind === "travessia"
                          ? s.t("Jogar travessia", "Play crossing")
                          : s.t("Jogar fragmentos", "Play fragments")}{" "}
                      ↗
                    </button>
                  ),
                )}
                {s.fallback ? (
                  <p>
                    {s.t(
                      "O jogo precisa de WebGL. As outras obras continuam disponíveis.",
                      "The game requires WebGL. Other pieces remain available.",
                    )}
                  </p>
                ) : null}
              </div>
            ) : (
              <Simulations id={piece.id} reset={reset} parameter={param} />
            )
          ) : null}
        </div>
        <div className="piece-panel">
          <p>
            {piece.description[s.locale]}
            <small>{piece.instruction[s.locale]}</small>
            {piece.id === "forma" && s.fallback ? (
              <small>
                {s.t(
                  "Prévia estática. A exploração 3D precisa de WebGL.",
                  "Static preview. 3D exploration requires WebGL.",
                )}
              </small>
            ) : null}
          </p>
          {piece.id !== "percurso" ? (
            <div className="piece-controls">
              {piece.id === "forma" ? (
                <>
                  <button
                    disabled={s.fallback}
                    aria-label={s.t("Girar para esquerda", "Rotate left")}
                    onClick={() => {
                      s.inspection.current.yaw = Math.max(
                        -Math.PI / 3,
                        s.inspection.current.yaw - 0.2,
                      );
                      window.dispatchEvent(new Event("lm-inspection"));
                    }}
                  >
                    ←
                  </button>
                  <button
                    disabled={s.fallback}
                    aria-label={s.t("Girar para direita", "Rotate right")}
                    onClick={() => {
                      s.inspection.current.yaw = Math.min(
                        Math.PI / 3,
                        s.inspection.current.yaw + 0.2,
                      );
                      window.dispatchEvent(new Event("lm-inspection"));
                    }}
                  >
                    →
                  </button>
                </>
              ) : null}
              {["trajetorias", "palavra", "dobras", "forma"].includes(
                piece.id,
              ) ? (
                <label>
                  {piece.id === "forma"
                    ? s.t("Aproximação", "Zoom")
                    : s.t("Tensão / orientação", "Tension / orientation")}
                  <input
                    type="range"
                    disabled={piece.id === "forma" && s.fallback}
                    min={piece.id === "forma" ? 70 : -90}
                    max={piece.id === "forma" ? 140 : 90}
                    value={
                      piece.id === "forma"
                        ? s.inspection.current.zoom * 100
                        : param
                    }
                    onChange={(e) => {
                      setParam(Number(e.target.value));
                      if (piece.id === "forma")
                        s.inspection.current.zoom =
                          Number(e.target.value) / 100;
                    }}
                  />
                </label>
              ) : null}
              <button
                onClick={() => {
                  setReset(reset + 1);
                  setParam(0);
                  s.inspection.current.yaw = 0;
                  s.inspection.current.zoom = 1;
                }}
              >
                {s.t("Restaurar", "Reset")} ↺
              </button>
            </div>
          ) : null}
        </div>
      </dialog>
    </main>
  );
}
