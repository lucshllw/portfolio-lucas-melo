"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { ShellProvider, useShell } from "./context";
import { motionCopy, MotionObserver } from "@/components/ui/MotionCopy";
import { CharacterFallback } from "@/components/ui/marks";
import { scrollProgress, gateTransition } from "@/lib/state";
gsap.registerPlugin(ScrollTrigger, useGSAP);
const MascotChat = dynamic(() => import("@/components/ui/MascotChat"), { ssr: false });
const World = dynamic(() => import("@/components/world/World"), { ssr: false });
const GameOverlay = dynamic(() => import("@/components/game/GameOverlay"), {
  ssr: false,
});
function ShellInner({ children }: { children: ReactNode }) {
  const s = useShell(),
    path = usePathname(),
    gateEl = useRef<HTMLDivElement>(null),
    content = useRef<HTMLDivElement>(null),
    progress = useRef<HTMLDivElement>(null),
    previousPath = useRef(path),
    active = useRef(false);
  const [hydrated, setHydrated] = useState(false),
    [menu, setMenu] = useState(false),
    [section, setSection] = useState("home");
  const { setGate, setLocale, setFallback, setMode, setOpenPiece, setGame } = s;
  const { markVisited } = s;
  useEffect(() => {
    if (s.game !== null) markVisited("game:" + s.gameKind);
  }, [s.game, s.gameKind, markVisited]);
  useLayoutEffect(() => {
    setHydrated(true);
    setGate("awaitingActivation");
    try {
      const saved = localStorage.getItem("lm-locale-v1");
      if (saved === "en") setLocale("en");
    } catch {}
    const canvas = document.createElement("canvas");
    try {
      if (!canvas.getContext("webgl2")) setFallback(true);
    } catch {
      setFallback(true);
    }
  }, [setGate, setLocale, setFallback]); // Only locale is persisted, never entry authorization.
  useEffect(() => {
    document.documentElement.lang = s.locale === "pt" ? "pt-BR" : "en";
    try {
      localStorage.setItem("lm-locale-v1", s.locale);
    } catch {}
  }, [s.locale]);
  useLayoutEffect(() => {
    const locked = s.gate !== "portfolio";
    const before = document.body.style.overflow;
    document.body.style.overflow = locked ? "hidden" : before;
    return () => {
      document.body.style.overflow = before;
    };
  }, [s.gate]);
  useEffect(() => {
    if (s.gate !== "portfolio") return;
    const restore =
      path === "/" &&
      previousPath.current.startsWith("/projetos/") &&
      (!location.hash || location.hash === "#projetos")
        ? s.caseReturn.current
        : null;
    previousPath.current = path;
    setMode(
      path === "/galeria"
        ? "gallery"
        : path.startsWith("/projetos")
          ? "case"
          : "portfolio",
    );
    setOpenPiece(false);
    setGame(null);
    setMenu(false);
    const id = setTimeout(() => {
      if (document.querySelector(".game-overlay,dialog[open],.mobile-menu"))
        return;
      if (restore) {
        window.dispatchEvent(
          new CustomEvent("lm-scrollTo", { detail: restore.scroll }),
        );
        ScrollTrigger.update();
        window.dispatchEvent(
          new CustomEvent("lm-project-restore", { detail: restore }),
        );
      } else
        document
          .querySelector<HTMLElement>("h1")
          ?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(id);
  }, [path, s.gate, s.caseReturn, setMode, setOpenPiece, setGame]);
  useEffect(() => {
    if (s.gate !== "portfolio" || s.game !== null || menu) return;
    let alive = true;
    let sections = [...document.querySelectorAll<HTMLElement>("main>section[id]")];
    const update = () => {
      if (!sections.length || sections.some(el => !el.isConnected)) sections = [...document.querySelectorAll<HTMLElement>("main>section[id]")];
      const p = scrollProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
      if (progress.current) {
        progress.current.style.transform = `scaleX(${p})`;
        progress.current.dataset.progress = String(p);
      }
      const currentSection = sections.find(el => { const rect = el.getBoundingClientRect(); return rect.top <= 96 && rect.bottom > 96; });
      if (currentSection) setSection(currentSection.id);
      else if (path !== "/") setSection("home");
    };
    update();
    let lenis: Lenis | undefined;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (time: number) => lenis?.raf(time * 1000);
    if (!reduced && matchMedia("(pointer:fine)").matches) {
      lenis = new Lenis({ duration: 0.65, anchors: true, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
    }
    const resize = new ResizeObserver(() => {
      update();
      ScrollTrigger.refresh();
    });
    resize.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const visibility = () => {
      if (document.hidden || document.querySelector("dialog[open]"))
        lenis?.stop();
      else lenis?.start();
    };
    const dialogChanged = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) lenis?.stop();
      else if (!document.hidden) lenis?.start();
    };
    const scrollTo = (e: Event) => {
      const top = (e as CustomEvent<number>).detail;
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo({ top, behavior: "instant" });
    };
    window.addEventListener("lm-scrollTo", scrollTo);
    window.addEventListener("lm-dialog", dialogChanged);
    document.addEventListener("visibilitychange", visibility);
    void document.fonts.ready.then(() => {
      if (!alive) return;
      update();
      ScrollTrigger.refresh();
    });
    return () => {
      alive = false;
      resize.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("lm-dialog", dialogChanged);
      window.removeEventListener("lm-scrollTo", scrollTo);
      gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, [s.gate, s.game, path, menu]);
  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement as HTMLElement;
    document.querySelector<HTMLElement>(".mobile-menu a")?.focus();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") {
        const items = [
          ...document.querySelectorAll<HTMLElement>(
            ".mobile-menu a,.mobile-menu button",
          ),
        ];
        const a = items[0],
          z = items.at(-1);
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z?.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", key);
      previous.focus();
    };
  }, [menu]);
  const enter = () => {
    if (active.current || s.gate !== "awaitingActivation") return;
    active.current = true;
    setGate(gateTransition(s.gate, "activate"));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(s.story.current, {
      entry: 1,
      duration: reduced ? 0 : 1.35,
      ease: "power2.inOut",
      onComplete: () => {
        setGate("portfolio");
      },
    });
  };
  const nav = [
    ["projetos", s.t("Projetos", "Projects")],
    ["competencias", s.t("Competências", "Skills")],
    ["experimentos", s.t("Experimentos", "Experiments")],
    ["contato", s.t("Contato", "Contact")],
  ];
  return (
    <>
      <div className="ambient-backdrop" aria-hidden="true" />
      <World />
      {s.gate !== "portfolio" ? (
        <div
          className="gate"
          ref={gateEl}
          data-gate-state={s.gate}
          role="dialog"
          aria-modal="true"
          aria-label={s.t(
            "Entrada do portfólio de Lucas Melo",
            "Lucas Melo portfolio entrance",
          )}
        >
          <div
            className="gate-scene-slot"
            data-world-target="intro"
            aria-hidden="true"
          />
          <button
            className={
              "character-entry " +
              (s.fallback ? "with-fallback" : "")
            }
            aria-label={s.t("Entrar no portfólio", "Enter the portfolio")}
            onClick={enter}
            onPointerEnter={() => s.setCharacterActive(true)}
            onPointerLeave={() => s.setCharacterActive(false)}
            onFocus={() => s.setCharacterActive(true)}
            onBlur={() => s.setCharacterActive(false)}
            disabled={s.gate === "entering" || (!s.worldReady && !s.fallback)}
            aria-busy={!s.worldReady && !s.fallback}
          >
            {s.fallback && <span className="entry-fallback">
              <CharacterFallback
                label={s.t(
                  "Criatura roxa de formas arredondadas",
                  "Rounded purple creature",
                )}
              />
            </span>}
            {!s.worldReady && !s.fallback && <span className="entry-loading" aria-hidden="true" />}
          </button>
        </div>
      ) : null}
      <div
        ref={content}
        data-content
        inert={hydrated && s.gate !== "portfolio"}
        className={s.gate !== "portfolio" ? "content-locked" : ""}
      >
        <a className="skip" href="#main">
          {s.t("Ir para o conteúdo", "Skip to content")}
        </a>
        <div className="scroll-progress" ref={progress} aria-hidden="true" />
        <header data-theme={section === "competencias" || section === "experimentos" ? "light" : "dark"}>
          <Link
            href="/#main"
            className="brand"
            aria-label={s.t("Lucas Melo — voltar ao topo", "Lucas Melo — back to top")}
            onClick={(event) => {
              if (path !== "/") return;
              event.preventDefault();
              setMenu(false);
              window.dispatchEvent(new CustomEvent("lm-scrollTo", { detail: 0 }));
            }}
          >
            <span className="profile-avatar"><img src="/perfil/lucas-original.png" width={828} height={1472} alt="" /></span>
            <span>Lucas Melo</span>
          </Link>
          <nav aria-label={s.t("Navegação principal", "Main navigation")}>
            {nav.map(([id, label]) => (
              <Link
                key={id}
                href={`/#${id}`}
                aria-current={section === id ? "location" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <button
            className="language"
            aria-label={s.t(
              "Mudar idioma para inglês",
              "Switch language to Portuguese",
            )}
            onClick={() => setLocale(s.locale === "pt" ? "en" : "pt")}
          >
            <span className={s.locale === "pt" ? "selected" : ""}>PT</span> /{" "}
            <span className={s.locale === "en" ? "selected" : ""}>EN</span>
          </button>
          <button
            className="menu-toggle"
            aria-expanded={menu}
            aria-controls="mobile-menu"
            onClick={() => setMenu(!menu)}
          >
            {s.t("Menu", "Menu")}
          </button>
        </header>
        {menu ? (
          <div
            id="mobile-menu"
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="mobile-menu-glitch" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => <i key={i} style={{
                "--shard": i, left: `${6 + (i * 31) % 88}%`, top: `${8 + (i * 19) % 84}%`,
              } as CSSProperties} />)}
            </div>
            {nav.map(([id, label]) => (
              <Link key={id} href={`/#${id}`} onClick={() => setMenu(false)}>
                {label}
              </Link>
            ))}
            <button onClick={() => setMenu(false)}>
              {s.t("Fechar menu", "Close menu")}
            </button>
          </div>
        ) : null}
        {children}
        <MotionObserver />
        {motionCopy(<footer>
          <Link className="brand" href="/">

            <span>Lucas Melo</span>
          </Link>
          <span>
            {s.t(
              "Desenvolvimento de sistemas, inteligência artificial e automação.",
              "Systems development, artificial intelligence and automation.",
            )}
          </span>
          <a href="#main">{s.t("Voltar ao topo", "Back to top")} ↑</a>
        </footer>)}
        <span className="sr-only" aria-live="polite">
          {s.locale === "pt" ? "Idioma: Português" : "Language: English"}
        </span>
      </div>
      {s.game !== null ? (
        <GameOverlay
          onClose={() => {
            setGame(null);
            setMode(path === "/galeria" ? "gallery" : "portfolio");
          }}
        />
      ) : null}
      {s.gate === "portfolio" && s.game === null && !s.openPiece && !menu ? <MascotChat /> : null}
      <noscript>
        <style>{`.gate{display:none!important}body{overflow:auto!important}[data-content]{visibility:visible!important}.world-canvas{display:none!important}.project-frame{display:grid!important;position:relative!important;visibility:visible!important;transform:none!important;opacity:1!important}.projects-frames{height:auto!important}.hero,.projects-section{height:auto!important}.hero-stage,.projects-stage{position:relative!important}`}</style>
      </noscript>
    </>
  );
}
export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path.startsWith('/gestao/')) return <>{children}</>;
  return (
    <ShellProvider>
      <ShellInner>{children}</ShellInner>
    </ShellProvider>
  );
}
