"use client";
import { motionCopy } from "@/components/ui/MotionCopy";
import { useRef, useState } from "react";
import Link from "next/link";
import { useShell } from "@/components/shell/context";
import type { Project } from "@/lib/types";
import ProjectPreview from "./ProjectPreview";
import { useDialogLock } from "@/components/shell/useDialogLock";
export default function Case({ project: p }: { project: Project }) {
  const s = useShell(),
    [media, setMedia] = useState(0),
    [zoom, setZoom] = useState(false),
    [modalOpen, setModalOpen] = useState(false),
    dialog = useRef<HTMLDialogElement>(null);
  const show = (i: number) => {
    setMedia(i);
    dialog.current?.showModal();
    setModalOpen(true);
  };
  useDialogLock(modalOpen);
  return motionCopy(
    <main id="main" className="case-page">
      <Link
        className="back-link"
        href={s.caseReturn.current ? "/" : "/#projetos"}
        scroll={!s.caseReturn.current}
      >
        ← {s.t("Voltar aos projetos", "Back to projects")}
      </Link>
      <div className="case-intro">
        <span className="eyebrow">{p.kind[s.locale]}</span>
        <h1 tabIndex={-1}>{p.title[s.locale]}</h1>
        <p>{p.description[s.locale]}</p>
        <span>{p.technologies.join(" / ")}</span>
        {p.url && <a className="button" href={p.url} target="_blank" rel="noreferrer">{s.t("Visitar site", "Visit website")} ↗</a>}
      </div>
      <ProjectPreview project={p} />
      <div className="case-sections">
        {[
          [s.t("Intenção", "Intention"), p.problem],
          [s.t("Minha contribuição", "My contribution"), p.contribution],
          [s.t("Decisões", "Decisions"), p.decisions],
          [s.t("Evidência e limites", "Evidence and limits"), p.evidence],
        ].map(([title, copy]) => (
          <section key={String(title)}>
            <h2>{String(title)}</h2>
            <p>{typeof copy === "object" ? copy[s.locale] : copy}</p>
          </section>
        ))}
      </div>
      {p.media.length > 0 ? <section>
        <h2>{s.t(p.url ? "O projeto publicado" : "Representações do estudo", p.url ? "The published project" : "Study representations")}</h2>
        <p className="case-media-empty">{p.url ? s.t("Captura do site publicado. Abra o site para explorar.", "Screenshot of the published website. Open the site to explore.") : s.t("Ilustrações esquemáticas; experimente a cena ao vivo acima.", "Schematic illustrations; try the live scene above.")}</p>
        <div className="media-thumbnails">
          {p.media.map((url, i) => (
            <button
              key={url}
              onClick={() => show(i)}
              aria-label={
                s.t("Ampliar imagem", "Enlarge image") + " " + (i + 1)
              }
            >
              <img
                src={url}
                alt={p.title[s.locale] + " " + (i + 1)}
                width={1200}
                height={900}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </section> : null}
      <Link
        className="button"
        href={p.experience ? `/galeria#${p.experience}` : p.slug === "experimento-dados" ? "/galeria" : "/#contato"}
      >
        {p.experience || p.slug === "experimento-dados"
          ? s.t("Explorar na galeria", "Explore in the gallery")
          : s.t("Conversar sobre um projeto", "Talk about a project")}{" "}
        ↗
      </Link>
      <dialog
        ref={dialog}
        className="media-modal"
        aria-label={s.t("Mídia do estudo", "Study media")}
        data-lenis-prevent
        onClose={() => {
          setZoom(false);
          setModalOpen(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="modal-toolbar">
          <span>
            {media + 1} / {p.media.length}
          </span>
          <button onClick={() => setZoom(!zoom)}>
            {s.t("Zoom", "Zoom")} {zoom ? "−" : "+"}
          </button>
          <button onClick={() => dialog.current?.close()}>
            {s.t("Fechar", "Close")} ×
          </button>
        </div>
        <div className={"media-full " + (zoom ? "zoomed" : "")}>
          <img
            src={p.media[media]}
            alt={p.title[s.locale]}
            width={1200}
            height={900}
          />
        </div>
        <div className="modal-toolbar">
          <button
            onClick={() => {
              setMedia((media + p.media.length - 1) % p.media.length);
              setZoom(false);
            }}
          >
            {s.t("Anterior", "Previous")} ←
          </button>
          <button
            onClick={() => {
              setMedia((media + 1) % p.media.length);
              setZoom(false);
            }}
          >
            {s.t("Próxima", "Next")} →
          </button>
        </div>
      </dialog>
    </main>
  );
}
