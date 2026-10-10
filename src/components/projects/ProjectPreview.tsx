"use client";
import type { Project } from "@/lib/types";
import { useShell } from "@/components/shell/context";
import Preview from "./Preview";
import GameLaunch from "@/components/game/GameLaunch";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import "./collection.css";
export default function ProjectPreview({ project, active = true, worldTarget = false }: { project: Project; active?: boolean; worldTarget?: boolean }) {
  const s = useShell(),
    path = usePathname(),
    { story } = s;
  useEffect(() => {
    if ((path ?? "").startsWith("/projetos/") && (project.game || project.experience)) {
      story.current.projectScenes = [project.game ?? project.experience!];
      story.current.projects = 0;
      story.current.projectsExact = 0;
    }
  }, [path, project.game, project.experience, story]);
  if (project.experience) {
    const experience = project.experience;
    return (
      <div className={`project-preview authored-preview authored-preview-${experience}`} data-active={active}
        {...((path ?? "").startsWith("/projetos/") && experience === "fenda" ? { "data-world-target": "projects" } : {})}>
        {experience !== "fenda" ? <svg className="authored-field" viewBox="0 0 600 560" aria-hidden="true">
          {experience === "correntes" ? Array.from({ length: 38 }, (_, i) => (
            <path key={i} d={`M ${-100 + i * 11} -40 C ${460 + i * 9} 90, ${-80 + i * 7} 270, ${180 + i * 13} 610`} />
          )) : Array.from({ length: 25 }, (_, i) => (
            <path key={i} d={`M ${300 + i * 2} ${70 + i * 6} C ${600 - i * 4} ${50 + i * 3}, ${490 - i * 4} ${390 - i * 4}, ${330 - i * 2} ${490 - i * 5} S ${-20 + i * 8} ${220 + i * 3}, ${300 + i * 2} ${70 + i * 6}`} />
          ))}
        </svg> : s.fallback ? <svg className="fenda-fallback" viewBox="0 0 420 460" aria-hidden="true"><path d="M80 400V65L330 170 310 230 145 160V400Z"/><path d="M275 410V280L105 210 130 155 340 250V410Z"/></svg> : null}
        <div className="game-preview-caption">
          <span>{experience === "fenda" ? s.t("Duas peças. Um espaço em comum.", "Two pieces. One shared space.") : experience === "correntes" ? s.t("Um gesto altera a direção.", "One gesture changes the direction.") : s.t("Toque a superfície. Deixe crescer.", "Touch the surface. Let it grow.")}</span>
          <Link className="button" href={`/galeria#${experience}`} onClick={() => s.markVisited(`project:${project.slug}`)}>
            {s.t("Explorar", "Explore")} ↗
          </Link>
        </div>
      </div>
    );
  }
  if (project.preview === "game" && project.game)
    return (
      <div
        className={`project-preview game-preview game-preview-${project.game}`}
        {...(worldTarget || (path ?? "").startsWith("/projetos/")
          ? { "data-world-target": "projects" }
          : {})}
      >
        {s.fallback ? (
          <img
            className="game-static-preview"
            src={project.media[0]}
            alt={project.title[s.locale]}
            width={1200}
            height={900}
          />
        ) : null}
        <div className="game-preview-caption">
          <span>
            {s.t(
              "Experiência autoral / protótipo jogável",
              "Original experience / playable prototype",
            )}
          </span>
          <GameLaunch kind={project.game} />
          {s.fallback ? (
            <small>
              {s.t(
                "A prévia está disponível. Jogar precisa de WebGL.",
                "Preview available. Playing requires WebGL.",
              )}
            </small>
          ) : null}
        </div>
      </div>
    );
  if (project.preview && project.preview !== "game")
    return (
      <Preview
        key={project.slug}
        index={{ tasks: 0, workflow: 1, network: 2 }[project.preview]}
      />
    );
  return (
    <div className="project-preview supplied-media">
      {project.media[0] ? (
        <img
          src={project.media[0]}
          alt={project.title[s.locale]}
          width={1200}
          height={900}
        />
      ) : (
        <p>
          {s.t(
            "Mídia não disponível para este projeto.",
            "Media is not available for this project.",
          )}
        </p>
      )}
    </div>
  );
}
