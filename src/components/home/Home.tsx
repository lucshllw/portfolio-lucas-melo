"use client";
import ContactEmail from "@/components/ui/ContactEmail";
import ContactGlitch from "@/components/ui/ContactGlitch";
import { motionCopy } from "@/components/ui/MotionCopy";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useShell } from "@/components/shell/context";
import { profile, education } from "@/data/content";
import type { Project } from "@/lib/types";
import Projects from "@/components/projects/Projects";
import { PieceMark, SculptureFallback } from "@/components/ui/marks";
const skills = [
  {
    name: ["Desenvolvimento", "Development"],
    title: ["Desenvolvimento de sistemas", "Systems development"],
    body: [
      "Criação de aplicações web com foco em soluções práticas, acessíveis e boas experiências de uso.",
      "Building web applications with practical, accessible solutions and good user experiences.",
    ],
    areas: [
      ["Interfaces e componentes", "Interfaces and components"],
      ["Integração de APIs e serviços", "API and service integration"],
      ["Modelagem de dados", "Data modeling"],
      ["Arquitetura de software", "Software architecture"],
    ],
    diagram: [
      ["Interface", "Interface"],
      ["Lógica", "Logic"],
      ["Dados", "Data"],
    ],
  },
  {
    name: ["Dados e IA", "Data and AI"],
    title: [
      "Relações que revelam possibilidades",
      "Relationships that reveal possibilities",
    ],
    body: [
      "Exploração de dados, visualizações e agentes de IA como ferramentas de investigação.",
      "Exploring data, visualizations and AI agents as tools for investigation.",
    ],
    areas: [
      ["Visualização interativa", "Interactive visualization"],
      ["Dados estruturados e SQL", "Structured data and SQL"],
      ["Fundamentos de agentes de IA", "AI agent fundamentals"],
      ["Experimentação e avaliação", "Experimentation and evaluation"],
    ],
    diagram: [
      ["Pergunta", "Question"],
      ["Relações", "Relationships"],
      ["Evidência", "Evidence"],
    ],
  },
  {
    name: ["Automação", "Automation"],
    title: ["Do processo à solução", "From process to solution"],
    body: [
      "Base técnica em eletroeletrônica conectada à organização de processos e automações.",
      "A technical foundation in electrical maintenance connected to process design and automation.",
    ],
    areas: [
      ["Fluxos e estados", "Workflows and states"],
      ["Sensores e sistemas de controle", "Sensors and control systems"],
      ["Fundamentos de CLP e Ladder", "PLC and Ladder fundamentals"],
      ["Integração entre sistemas", "System integration"],
    ],
    diagram: [
      ["Entrada", "Input"],
      ["Validação", "Validation"],
      ["Ação", "Action"],
    ],
  },
] as const;
export default function Home({ projects }: { projects: Project[] }) {
  const s = useShell(),
    [tab, setTab] = useState(0),
    tabs = useRef<HTMLDivElement>(null),
    [formation, setFormation] = useState(0),
    skillPanel = useRef<HTMLDivElement>(null),
    skillExit = useRef<gsap.core.Tween | null>(null),
    skillTrigger = useRef<ScrollTrigger | null>(null),
    educationTrigger = useRef<ScrollTrigger | null>(null),
    root = useRef<HTMLElement>(null);
  const moveChapter = (trigger: ScrollTrigger | null, next: number) => {
    if (trigger) window.dispatchEvent(new CustomEvent("lm-scrollTo", { detail: trigger.start + (trigger.end - trigger.start) * (next / 2) }));
  };
  const switchSkill = (next: number) => {
    if (next === tab) return;
    skillExit.current?.kill();
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) { setTab(next); return; }
    gsap.killTweensOf(skillPanel.current);
    skillExit.current = gsap.to(skillPanel.current, { y: -18, opacity: 0, duration: .16, onComplete: () => setTab(next) });
  };
  useGSAP(() => {
    if (!skillPanel.current) return;
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
      gsap.set(skillPanel.current, { y: 0, opacity: 1 }); return;
    }
    gsap.fromTo(skillPanel.current, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .48, ease: "power3.out" });
    return () => { skillExit.current?.kill(); };
  }, { scope: root, dependencies: [tab, s.locale] });
  useGSAP(
    () => {
      if (s.gate !== "portfolio") return;
      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width:1025px) and (min-height:700px)", mobile: "(max-width:1024px)" }, context => {
        if (!context.conditions?.motion) return;
        (
          [
            [".skills-section", "skills"],
            [".lab-entry", "lab"],
            [".contact", "contact"],
          ] as const
        ).forEach(([selector, key]) => {
          ScrollTrigger.create({
            trigger: root.current!.querySelector(selector),
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              s.story.current[key] = self.progress;
            },
          });
        });
        let scrollTab = -1, scrollFormation = -1;
        const cinematic = Boolean(context.conditions.desktop);
        if (!context.conditions.mobile) {
        skillTrigger.current = ScrollTrigger.create({ trigger: ".skills-chapter", start: cinematic ? "top 100px" : "top 20%", end: cinematic ? () => `+=${innerHeight * 2.4}` : "bottom 30%", pin: cinematic, anticipatePin: 1,
          onUpdate: self => { const next = Math.min(2, Math.floor(self.progress * 3));
            if (next !== scrollTab) { scrollTab = next; skillExit.current?.kill(); setTab(next); }
          }
        });
        educationTrigger.current = ScrollTrigger.create({ trigger: ".education-panel", start: cinematic ? "top 170px" : "top 35%", end: cinematic ? () => `+=${innerHeight * 1.8}` : "bottom 30%", pin: cinematic, anticipatePin: 1,
          onUpdate: self => { const next = Math.min(2, Math.floor(self.progress * 3));
            if (next !== scrollFormation) { scrollFormation = next; setFormation(next); }
          }
        });
        }
        if (cinematic) ScrollTrigger.create({ trigger: ".lab-chapter", start: "top 100px", end: () => `+=${innerHeight * .85}`, pin: true, anticipatePin: 1 });
        root.current!.querySelectorAll(".lab-entry,.contact").forEach(section => {
          gsap.fromTo(section.querySelectorAll(".section-heading,.gallery-invitation,.contact-copy"), { y: 55, opacity: .15 }, {
            y: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: section, start: "top 85%", end: "top 25%", scrub: .5 },
          });
        });
        gsap.fromTo(".invitation-copy", { y: 24 }, { y: -24, ease: "none", scrollTrigger: { trigger: ".lab-entry", start: "top bottom", end: "bottom top", scrub: .8 } });
        gsap.fromTo(".contact-object", { y: 65, rotate: -5 }, { y: 0, rotate: 0, scrollTrigger: { trigger: ".contact", start: "top 85%", end: "top 20%", scrub: .8 } });
        const hero = root.current!.querySelector(".hero");
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
            onUpdate: (self) => {
              s.story.current.heroExact = self.progress;
            },
          },
        });
        tl.fromTo(
          s.story.current,
          { hero: 0 },
          { hero: 1, duration: 1, ease: "none" },
          0,
        )
          .to(
            ".hero-copy h1",
            {
              xPercent: -12,
              y: -80,
              scale: 0.78,
              opacity: 0,
              duration: 0.25,
              ease: "power2.inOut",
            },
            0.12,
          )
          .to(
            ".hero-copy .hero-details",
            { y: 35, autoAlpha: 0, duration: 0.22, ease: "power2.in" },
            0.15,
          )
          .fromTo(
            ".hero-second-beat",
            { autoAlpha: 0, y: 45 },
            { autoAlpha: 1, y: 0, duration: 0.2 },
            0.49,
          )
          .to(".hero-second-beat", { autoAlpha: 0, y: -50, duration: 0.16 }, 0.84);
        gsap.fromTo(
          ".hero-copy",
          { clipPath: "inset(100% 0 0 0)" },
          { clipPath: "inset(0% 0 0 0)", duration: 0.85, ease: "power4.out" },
        );
        gsap.fromTo(".name-line > span", { yPercent: 120 }, { yPercent: 0, duration: 1.1, stagger: .17, ease: "power4.out" });
        gsap.fromTo(".hero-details > *", { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: .75, stagger: .12, delay: .35, ease: "power3.out" });
        const lab = gsap.timeline({ scrollTrigger: { trigger: ".lab-entry", start: "top 78%", once: true } });
        lab.fromTo(".lab-entry .section-heading > *", { y: 45, opacity: 0, clipPath: "inset(0 0 100% 0)" }, { y: 0, opacity: 1, clipPath: "inset(0)", duration: .85, stagger: .12 })
          .fromTo(".invitation-copy > *", { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: .65, stagger: .1 }, "-=.35");
        root.current!.querySelectorAll(".lab-entry h2,.contact h2").forEach(el => {
          ScrollTrigger.create({ trigger: el, start: "top 75%", once: true, onEnter: () => el.classList.add("glitch-once") });
        });
        gsap.from(".skills-section .section-heading", {
          clipPath: "inset(0 100% 0 0)",
          duration: 1,
          scrollTrigger: {
            trigger: ".skills-section",
            start: "top 85%",
            end: "top 30%",
            scrub: 0.7,
          },
        });
        gsap.fromTo(
          ".mini-pedestal",
          { y: 90, rotationZ: -18 },
          {
            y: 0,
            rotationZ: 0,
            stagger: 0.2,
            scrollTrigger: {
              trigger: ".gallery-invitation",
              start: "top 90%",
              end: "center center",
              scrub: 0.8,
            },
          },
        );
        gsap.fromTo(
          ".contact-copy h2",
          { clipPath: "inset(0 0 100% 0)", y: 80 },
          {
            clipPath: "inset(0 0 0% 0)",
            y: 0,
            scrollTrigger: {
              trigger: ".contact",
              start: "top 85%",
              end: "top 25%",
              scrub: 0.8,
            },
          },
        );
        return () => { skillTrigger.current = null; educationTrigger.current = null; };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [s.gate] },
  );
  const k = skills[tab],
    l = s.locale === "pt" ? 0 : 1;
  return motionCopy(
    <main id="main" ref={root}>
      <section className="hero" id="home">
        <div className="hero-stage">
          <div className="hero-copy">
            <h1 tabIndex={-1} className="editorial-title">
              <span className="name-line"><span>Lucas</span></span>
              <span className="name-line name-surname"><span>Melo</span></span>
            </h1>
            <div className="hero-details">
              <h2>
                {s.t(
                  "Transformo complexidade em soluções úteis.",
                  "I turn complexity into useful solutions.",
                )}
              </h2>
              <p>
                {s.t(
                  "Desenvolvimento de sistemas, inteligência artificial e automação.",
                  "Systems development, artificial intelligence and automation.",
                )}
              </p>
              <div className="actions">
                <Link href="#projetos" className="button">
                  {s.t("Ver projetos", "View projects")} <span>↗</span>
                </Link>
                <a className="button secondary" href={profile.resume} download>
                  {s.t("Baixar currículo", "Download résumé")} <span>↓</span>
                </a>
              </div>
              <a className="scroll-note" href="#projetos">
                <span className="scroll-symbol" />
                {s.t("Explore com a rolagem", "Explore as you scroll")}
              </a>
            </div>
          </div>
          <div className="hero-object scene-slot" data-world-target="home">
            <div
              className={
                s.fallback ? "static-sculpture" : "static-sculpture provisional"
              }
            >
              <SculptureFallback
                label={s.t(
                  "Escultura de planos dobrados em chumbo e prata",
                  "Sculpture of folded lead and silver planes",
                )}
              />
            </div>
          </div>
          <div className="hero-second-beat">
            <span>
              {s.t(
                "Uma forma. Muitas possibilidades.",
                "One form. Many possibilities.",
              )}
            </span>
            <p>
              {s.t("Abra espaço para explorar.", "Make room to explore.")}
            </p>
          </div>
          <span className="object-caption">
            {s.t("Fenda — estudo de forma e movimento", "Fenda — a study of form and motion")}
          </span>
        </div>
      </section>
      <Projects projects={projects} />
      <section id="competencias" className="skills-section">
        <div className="skills-chapter">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{s.t("Competências", "Skills")}</span>
            <h2 className="editorial-title">{s.t("Competências e ", "Skills and ")}<em className="editorial-serif">{s.t("trajetória", "background")}</em></h2>
            <p>
              {s.t(
                "Conhecimento técnico aplicado a projetos e em constante evolução.",
                "Technical knowledge applied to projects and continually evolving.",
              )}
            </p>
          </div>
          <p className="education">
            {s.t(
              "Estudante de Análise e Desenvolvimento de Sistemas na FACENS, com base técnica em Informática para Internet e manutenção eletroeletrônica.",
              "Systems Analysis and Development student at FACENS, with a technical foundation in Internet Computing and electrical maintenance.",
            )}
          </p>
        </div>
        <div
          ref={tabs}
          className="skill-tabs"
          role="tablist"
          aria-label={s.t("Áreas de competência", "Skill areas")}
          onKeyDown={(e) => {
            let next = tab;
            if (e.key === "ArrowRight") next = (tab + 1) % 3;
            else if (e.key === "ArrowLeft") next = (tab + 2) % 3;
            else if (e.key === "Home") next = 0;
            else if (e.key === "End") next = 2;
            else return;
            e.preventDefault();
            switchSkill(next);
            moveChapter(skillTrigger.current, next);
            tabs.current
              ?.querySelectorAll<HTMLButtonElement>("button")
              [next]?.focus();
          }}
        >
          {skills.map((x, i) => (
            <button
              id={"skill-tab-" + i}
              role="tab"
              key={i}
              aria-controls="skill-panel"
              aria-selected={tab === i}
              tabIndex={tab === i ? 0 : -1}
              onClick={() => { switchSkill(i); moveChapter(skillTrigger.current, i); }}
            >
              {x.name[l]}
            </button>
          ))}
        </div>
        <div
          ref={skillPanel}
          className={"skills-grid skills-state-" + tab}
          id="skill-panel"
          key={tab + s.locale}
          role="tabpanel"
          aria-labelledby={"skill-tab-" + tab}
        >
          <div>
            <h3>{k.title[l]}</h3>
            <p>{k.body[l]}</p>
            <h4>{s.t("Principais áreas", "Main areas")}</h4>
            <ul>
              {k.areas.map((x) => (
                <li key={x[0]}>{x[l]}</li>
              ))}
            </ul>
          </div>
          <div
            className="skill-diagram"
            role="img"
            aria-label={k.diagram.map((x) => x[l]).join(", ")}
          >
            <svg className="skill-paths" viewBox="0 0 300 270" aria-hidden="true">
              {tab === 0 ? <><rect x="34" y="40" width="230" height="170" rx="12"/><path d="M34 76H264M60 120L85 142 60 165M105 165H165"/><circle cx="53" cy="58" r="4"/></> :
                tab === 1 ? <><path d="M50 175L100 85 160 148 230 60M100 85L240 190 160 148 50 175"/>{[[50,175],[100,85],[160,148],[230,60],[240,190]].map(([x,y])=><circle key={x} cx={x} cy={y} r="11"/>)}</> :
                <><path d="M50 60H145V110H245V210H155V170H50ZM145 110V170M50 105H95V135H50"/><circle cx="245" cy="150" r="14"/><path d="M225 150H265M245 130V170"/></>}
            </svg>
            {k.diagram.map((x, i) => (
              <div className={"diagram-layer layer-" + i} key={i}>
                <span>{["▣", "⚙", "▤"][i]}</span>
                <strong>{x[l]}</strong>
              </div>
            ))}
          </div>
          <div className="related">
            <h4>{s.t("Projetos relacionados", "Related projects")}</h4>
            {projects.map((p, i) => (
              <Link href={"/projetos/" + p.slug} key={p.slug}>
                <PieceMark index={i === 2 ? 5 : i} />
                <div>
                  <strong>{p.title[s.locale]}</strong>
                  <small>{p.kind[s.locale]}</small>
                </div>
                <span>↗</span>
              </Link>
            ))}
          </div>
        </div>
        </div>
        <div className="education-panel">
          <div className="education-tabs" role="tablist" aria-label={s.t("Formações acadêmicas", "Academic education")}>
            {education.map((item,i)=><button key={item.institution} id={"education-tab-"+i} role="tab" aria-selected={formation===i} aria-controls="education-content" tabIndex={formation===i?0:-1} onClick={()=>{setFormation(i); moveChapter(educationTrigger.current, i);}} onKeyDown={e=>{
              if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
              e.preventDefault(); const next=e.key==="Home"?0:e.key==="End"?2:(formation+(e.key==="ArrowRight"?1:2))%3; setFormation(next); moveChapter(educationTrigger.current, next); document.getElementById("education-tab-"+next)?.focus();
            }}><span>{item.institution.replace("Centro Universitário ","")}</span><small>{item.year}</small></button>)}
          </div>
          <div id="education-content" key={formation} role="tabpanel" aria-labelledby={"education-tab-"+formation} className="education-content">
            <span>{s.t("Formação acadêmica", "Academic education")}</span>
            <h3>{education[formation].course[s.locale]}</h3>
            <p>{education[formation].institution}</p>
            <strong>{education[formation].status[s.locale]}</strong>
            <svg viewBox="0 0 160 100" aria-hidden="true" className={"education-diagram diagram-"+formation}>
              {formation===0 ? <><rect x="12" y="24" width="44" height="52" rx="5"/><rect x="103" y="24" width="44" height="52" rx="5"/><path d="M56 50H103M70 35L85 50 70 65"/></> : formation===1 ? <><path d="M15 50H45L55 30 65 70 75 30 85 70 95 50H145M80 10V30M80 70V90"/><circle cx="15" cy="50" r="6"/><circle cx="145" cy="50" r="6"/></> : <><rect x="18" y="18" width="124" height="65" rx="6"/><path d="M18 35H142M45 48L60 58 45 69M76 69H107"/></>}
            </svg>
          </div>
        </div>
      </section>
      <section id="experimentos" className="lab-entry">
        <div className="lab-chapter">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {s.t("Experimentos", "Experiments")}
            </span>
            <h2 className="editorial-title">{s.t("Laboratório de ", "Laboratory of ")}<em className="editorial-serif">{s.t("ideias", "ideas")}</em></h2>
            <p>
              {s.t(
                "Uma exposição de sistemas que respondem ao seu gesto.",
                "An exhibition of systems that respond to your gesture.",
              )}
            </p>
          </div>
          <span>{s.t("8 obras interativas", "8 interactive pieces")}</span>
        </div>
        <div className="gallery-invitation">
          <div className="invitation-art" aria-hidden="true">
            <div className="mini-pedestal pedestal-a">
              <PieceMark index={6} />
            </div>
            <div className="mini-pedestal pedestal-b">
              <PieceMark index={3} />
            </div>
            <div className="mini-pedestal pedestal-c">
              <PieceMark index={7} />
            </div>
          </div>
          <div className="invitation-copy">
            <h3>
              {s.t("Entre. Explore. Transforme.", "Enter. Explore. Transform.")}
            </h3>
            <p>
              {s.t(
                "Fluxos, matéria, palavras e percursos. Oito pequenas experiências entre tecnologia e forma.",
                "Flows, matter, words and passages. Eight small experiences between technology and form.",
              )}
            </p>
            <Link href="/galeria" className="button">
              {s.t("Entrar na galeria", "Enter the gallery")} <span>↗</span>
            </Link>
            <small>
              {s.t(
                "Três jogos autorais: Percurso, Travessia e Fragmentos.",
                "Three original games: Passage, Crossing and Fragments.",
              )}
            </small>
          </div>
        </div>
        </div>
      </section>
      <section id="contato" className="contact">
        <ContactGlitch />
        <div className="contact-copy">
          <span className="eyebrow">{s.t("Contato", "Contact")}</span>
          <h2>
            {s.t(
              "Vamos construir a próxima solução.",
              "Let’s build the next solution.",
            )}
          </h2>
          <p>
            {s.t(
              "Projetos, ideias ou oportunidades. Estou sempre aberto a novas conversas.",
              "Projects, ideas or opportunities. I’m always open to new conversations.",
            )}
          </p>
          <a href={"mailto:" + profile.email} className="button">
            {s.t("Conversar sobre um projeto", "Talk about a project")}{" "}
            <span>↗</span>
          </a>
          <ContactEmail />
          <div className="social-links">
            <a href={profile.resume} download>
              {s.t("Currículo", "Résumé")} ↓
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          </div>
        </div>
        <div className="contact-object">
          <div
            role="img"
            className="scene-slot contact-interaction"
            data-world-target="contact"
            aria-label={s.t("Escultura em rotação com glitch automático", "Rotating sculpture with automatic glitch")}
          >            <div
              className={
                s.fallback ? "static-sculpture" : "static-sculpture provisional"
              }
            >
              <SculptureFallback
                label={s.t(
                  "Escultura de planos dobrados em chumbo e prata",
                  "Sculpture of folded lead and silver planes",
                )}
              />
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
