"use client";
import { motionCopy } from "@/components/ui/MotionCopy";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useShell } from "@/components/shell/context";
import type { Project } from "@/lib/types";
import ProjectPreview from "./ProjectPreview";
export default function Projects({ projects }: { projects: Project[] }) {
  const s = useShell(),
    [selected, setSelected] = useState(() => s.caseReturn.current?.index ?? 0),
    [layout, setLayout] = useState<"overlap" | "flow" | "tabs">("overlap"),
    root = useRef<HTMLElement>(null),
    trigger = useRef<ScrollTrigger | null>(null),
    timeline = useRef<gsap.core.Timeline | null>(null),
    touch = useRef(0),
    index = useRef(selected),
    pendingFocus = useRef<string | null>(null),
    focusFrame = useRef(0);
  const stacked = layout !== "overlap", tabbed = layout === "tabs";
  const finishRestore = useCallback(() => {
    if (!pendingFocus.current) return;
    cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      const link = document.getElementById(pendingFocus.current ?? "");
      if (
        link &&
        !link.closest("[inert]") &&
        getComputedStyle(link).visibility === "visible"
      ) {
        link.focus({ preventScroll: true });
        pendingFocus.current = null;
      }
    });
  }, []);
  useGSAP(
    () => {
      s.story.current.projectCount = projects.length;
      s.story.current.projectScenes = projects.map(p => p.game ?? p.experience ?? p.slug);
      if (s.gate !== "portfolio" || !projects.length) return;
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width:1025px) and (min-height:650px) and (prefers-reduced-motion:no-preference)",
        () => {
          setLayout("overlap");
          const frames = gsap.utils.toArray<HTMLElement>(
            ".project-frame",
            root.current!,
          );
          const tl = gsap.timeline({
            onUpdate: () => {
              const next = Math.round(s.story.current.projects);
              if (next !== index.current) {
                index.current = next;
                setSelected(next);
              }
            },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.8,
              onScrubComplete: finishRestore,
              onUpdate: (self) => {
                const exact = self.progress * (projects.length - 1);
                s.story.current.projectsExact = exact;
              },
            },
          });
          timeline.current = tl;
          trigger.current = tl.scrollTrigger!;
          tl.fromTo(
            s.story.current,
            { projects: 0 },
            {
              projects: projects.length - 1,
              duration: Math.max(1, projects.length - 1),
              ease: "none",
            },
            0,
          );
          frames.forEach((frame, i) => {
            if (i > 0)
              tl.fromTo(
                frame,
                { x: 120, y: 60, rotationY: -13, scale: 0.91, autoAlpha: 0 },
                {
                  x: 0,
                  y: 0,
                  rotationY: 0,
                  scale: 1,
                  autoAlpha: 1,
                  duration: 0.4,
                  ease: "power3.out",
                },
                i - 0.65,
              );
            else gsap.set(frame, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
            if (i < frames.length - 1)
              tl.to(
                frame,
                {
                  x: -130,
                  y: -70,
                  rotationY: 12,
                  scale: 0.88,
                  autoAlpha: 0,
                  duration: 0.4,
                  ease: "power2.in",
                },
                i + 0.35,
              );
          });
          return () => {
            trigger.current = null;
            timeline.current = null;
          };
        },
      );
      // Mobile selection belongs to the tabs; vertical scrolling never changes it.
      mm.add("(max-width:1024px)", () => {
        setLayout("tabs");
        s.story.current.projects = index.current;
        s.story.current.projectsExact = index.current;
      });
      mm.add("(min-width:1025px) and (max-height:649px), (min-width:1025px) and (prefers-reduced-motion:reduce)", () => {
        setLayout("flow");
        const frames = gsap.utils.toArray<HTMLElement>(".project-frame", root.current!);
        frames.forEach((frame, i) => ScrollTrigger.create({
          trigger: frame, start: "top 50%", end: "bottom 50%",
          onToggle: self => {
            if (!self.isActive) return;
            s.story.current.projects = i;
            s.story.current.projectsExact = i;
            index.current = i;
            setSelected(i);
          },
        }));
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [s.gate, projects.length] },
  );
  const story = s.story;
  useEffect(() => {
    window.dispatchEvent(new Event("lm-scene"));
    if (!stacked) return;
    const rail = root.current?.querySelector<HTMLElement>(".project-index");
    const tab = rail?.querySelector<HTMLElement>(`#project-tab-${selected}`);
    if (rail && tab) rail.scrollLeft = Math.max(0, tab.offsetLeft - (rail.clientWidth - tab.clientWidth) / 2);
  }, [selected, stacked]);
  useEffect(() => {
    if (!tabbed) return;
    // A selected panel can have a different height. Recalculate the later reveals.
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [selected, tabbed, s.locale]);
  const select = useCallback(
    (i: number, focus = false) => {
      pendingFocus.current = null;
      cancelAnimationFrame(focusFrame.current);
      i = Math.max(0, Math.min(projects.length - 1, i));
      index.current = i;
      setSelected(i);
      if (trigger.current) {
        const top =
          trigger.current.start +
          (trigger.current.end - trigger.current.start) *
            (i / Math.max(1, projects.length - 1));
        window.dispatchEvent(new CustomEvent("lm-scrollTo", { detail: top }));
        ScrollTrigger.update();
        trigger.current.getTween()?.progress(1);
        timeline.current?.progress(i / Math.max(1, projects.length - 1));
      } else {
        story.current.projects = i;
        story.current.projectsExact = i;
        const frame = root.current?.querySelector<HTMLElement>(`[data-frame-index="${i}"]`);
        if (frame && layout === "flow") window.dispatchEvent(new CustomEvent("lm-scrollTo", {
          detail: window.scrollY + frame.getBoundingClientRect().top - 165,
        }));
      }
      if (focus)
        root.current
          ?.querySelectorAll<HTMLButtonElement>(".project-index button")
          [i]?.focus({ preventScroll: true });
    },
    [projects.length, story, layout],
  );
  useEffect(() => {
    const restore = (event: Event) => {
      const saved = (event as CustomEvent<{ index: number; focusId: string }>)
        .detail;
      select(saved.index);
      pendingFocus.current = saved.focusId;
      // The scrub completion is the visual handoff. Mobile has no scrub.
      if (!trigger.current) finishRestore();
    };
    window.addEventListener("lm-project-restore", restore);
    return () => {
      window.removeEventListener("lm-project-restore", restore);
      cancelAnimationFrame(focusFrame.current);
      pendingFocus.current = null;
    };
  }, [select, finishRestore]);
  if (!projects.length)
    return (
      <section id="projetos" className="empty-projects">
        <h2>
          {s.t(
            "Nenhum projeto publicado por enquanto.",
            "No projects published yet.",
          )}
        </h2>
        <p>
          {s.t(
            "Os experimentos e o contato continuam disponíveis.",
            "Experiments and contact remain available.",
          )}
        </p>
      </section>
    );
  return motionCopy(
    <section
      id="projetos"
      className="projects-section authored-collection"
      data-layout={layout}
      ref={root}
      style={{ "--project-count": projects.length } as React.CSSProperties}
    >
      <div className="projects-stage">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{s.t("Projetos", "Projects")}</span>
            <h2>{s.t("Mundos para explorar.", "Worlds to explore.")}</h2>
            <p>
              {tabbed ? s.t("Sites publicados e jogos autorais. Explore pelas abas.", "Published websites and original games. Explore using the tabs.") : s.t(
                "Sites publicados e jogos autorais. Explore com a rolagem.",
                "Published websites and original games. Explore as you scroll.",
              )}
            </p>
          </div>
          <div className="collection-controls"><span className="count">
            {String(selected + 1).padStart(2, "0")} /{" "}
            {String(projects.length).padStart(2, "0")}
          </span><div className="collection-arrows">
            <button aria-label={s.t("Projeto anterior", "Previous project")} disabled={selected === 0} onClick={() => select(selected - 1)}>←</button>
            <button aria-label={s.t("Próximo projeto", "Next project")} disabled={selected === projects.length - 1} onClick={() => select(selected + 1)}>→</button>
          </div></div>
        </div>
        <div
          className="projects-composition"
          onTouchStart={(e) => {
            touch.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (tabbed) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 90)
              select(
                (selected + (dx < 0 ? 1 : projects.length - 1)) %
                  projects.length,
              );
          }}
        >
          <div
            className="project-index"
            role="tablist"
            aria-label={s.t("Seleção de projeto", "Project selection")}
            aria-orientation={stacked ? "horizontal" : "vertical"}
            onKeyDown={(e) => {
              const focused = (e.target as HTMLElement).closest<HTMLButtonElement>("button[role=tab]");
              let i = focused ? Number(focused.id.replace("project-tab-", "")) : index.current;
              if (e.key === "ArrowDown" || e.key === "ArrowRight")
                i = (i + 1) % projects.length;
              else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
                i = (i + projects.length - 1) % projects.length;
              else if (e.key === "Home") i = 0;
              else if (e.key === "End") i = projects.length - 1;
              else return;
              e.preventDefault();
              select(i, true);
            }}
          >
            {projects.map((p, i) => (
              <button
                key={p.slug}
                role="tab"
                id={`project-tab-${i}`}
                aria-controls={`project-panel-${i}`}
                aria-selected={i === selected}
                tabIndex={i === selected ? 0 : -1}
                onClick={() => select(i)}
              >
                <small>{String(i + 1).padStart(2, "0")}</small>
                <strong>{p.title[s.locale]}</strong>
                <span>{p.kind[s.locale]}</span>
                {s.visited.includes(`project:${p.slug}`) || (p.game && s.visited.includes(`game:${p.game}`)) ? <span className="project-visited" aria-label={s.t("Explorado", "Explored")}>✓</span> : null}
              </button>
            ))}
          </div>
          <div className="projects-frames">
            <div
              className="projects-world scene-slot"
              data-world-target={!stacked && projects[selected]?.game ? "projects" : undefined}
              aria-hidden="true"
            />
            {projects.map((p, i) => (
              <div
                key={p.slug}
                className={`project-frame ${i === selected ? "is-selected" : ""}`}
                inert={s.gate !== "portfolio" || (layout !== "flow" && i !== selected)}
                hidden={tabbed && i !== selected}
                data-frame-index={i}
              >
                <div className="selected-preview">
                  {(!tabbed || i === selected) && <ProjectPreview project={p} active={i === selected} worldTarget={stacked} />}
                </div>
                <div
                  key={i === selected ? "active" : "inactive"}
                  className="project-context"
                  role="tabpanel"
                  id={`project-panel-${i}`}
                  aria-labelledby={`project-tab-${i}`}
                >
                  <span className="eyebrow">{p.kind[s.locale]}</span>
                  <h3>{p.title[s.locale]}</h3>
                  <p>{p.description[s.locale]}</p>
                  <div className="project-proof">
                    <h4>{s.t("Minha contribuição", "My contribution")}</h4>
                    <p>{p.contribution[s.locale]}</p>
                  </div>
                  <h4>{s.t("Tecnologias", "Technologies")}</h4>
                  <p className="technologies">{p.technologies.join(" / ")}</p>
                  {p.url && <a className="button visit-site" href={p.url} target="_blank" rel="noreferrer">
                    {s.t("Visitar site", "Visit website")} <span>↗</span>
                  </a>}
                  <Link
                    id={`case-link-${p.slug}`}
                    className="button"
                    href={`/projetos/${p.slug}`}
                    onClick={() => {
                      s.markVisited(`project:${p.slug}`);
                      s.caseReturn.current = {
                        scroll: window.scrollY,
                        index: i,
                        focusId: `case-link-${p.slug}`,
                      };
                    }}
                  >
                    {s.t("Ver projeto", "View project")} <span>↗</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="collection-track" aria-hidden="true">
          <span
            style={{ transform: `scaleX(${(selected + 1) / projects.length})` }}
          />
        </div>
        <span className="sr-only" role="status" aria-live="polite">{projects[selected].title[s.locale]} · {selected + 1} / {projects.length}</span>
      </div>
    </section>
  );
}
