"use client";
import {
  Component,
  useEffect,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree, events } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import dynamic from "next/dynamic";
import {
  Vector3,
  PerspectiveCamera,
  PCFShadowMap,
  DirectionalLight,
  SpotLight,
  MathUtils,
} from "three";
import { useShell } from "@/components/shell/context";
import { chapters } from "./config";
import Character from "./Character";
import Sculpture from "./Sculpture";
import GalleryScene, { Form } from "./GalleryScene";
import { pieces } from "@/data/content";
import Atmosphere from "./Atmosphere";
import ProjectWorld from "./ProjectWorld";
const Game = dynamic(() => import("@/components/game/GameScene"), {
  ssr: false,
});
class Boundary extends Component<
  { children: ReactNode; failed: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.failed();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function target() {
  const game = document.querySelector<HTMLElement>(
    '[data-world-target="game"]',
  );
  if (game) return game;
  const intro = document.querySelector<HTMLElement>(
    '[data-world-target="intro"]',
  );
  if (intro) return intro;
  const modal = document.querySelector<HTMLDialogElement>("dialog[open]");
  if (modal)
    return modal.querySelector<HTMLElement>("[data-world-target]") ?? undefined;
  return [
    ...document.querySelectorAll<HTMLElement>("[data-world-target]"),
  ].find((el) => {
    if (el.closest("dialog")) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  });
}
function Runtime({ hidden, reduced, lowQuality, onSlow }: { hidden: boolean; reduced: boolean; lowQuality: boolean; onSlow: () => void }) {
  const s = useShell(),
    { gl, camera, invalidate } = useThree(),
    view = useRef("intro"),
    positions = useRef({
      p: new Vector3(),
      look: new Vector3(),
      goal: new Vector3(),
      at: new Vector3(),
    }),
    metrics = useRef({ frames: 0, time: 0, samples: [] as number[] });
  const keyLight = useRef<DirectionalLight>(null),
    rimLight = useRef<DirectionalLight>(null),
    poolLight = useRef<SpotLight>(null);
  const [chapter, setChapter] = useState("intro");
  const { setWorldReady, setFallback, setGame } = s;
  useEffect(() => {
    gl.info.autoReset = false;
    const lost = (e: Event) => {
      e.preventDefault();
      setFallback(true);
      setGame(null);
    };
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", lost);
    const change = () => invalidate();
    window.addEventListener("scroll", change, { passive: true });
    window.addEventListener("pointermove", change, { passive: true });
    window.addEventListener("pointerup", change);
    window.addEventListener("keydown", change);
    window.addEventListener("lm-inspection", change);
    return () => {
      gl.info.autoReset = true;
      canvas.removeEventListener("webglcontextlost", lost);
      window.removeEventListener("scroll", change);
      window.removeEventListener("pointermove", change);
      window.removeEventListener("pointerup", change);
      window.removeEventListener("keydown", change);
      window.removeEventListener("lm-inspection", change);
    };
  }, [gl, invalidate, setWorldReady, setFallback, setGame]);
  useFrame(() => {
    gl.info.reset();
  }, -10);
  useFrame((state, dt) => {
    if (hidden) return;
    const el = target();
    gl.setScissorTest(false);
    gl.setClearColor("#050505", 0);
    gl.clear();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const id = el.dataset.worldTarget || "home";
    if (id !== view.current) {
      view.current = id;
      setChapter(id);
      metrics.current = { frames: 0, time: 0, samples: [] };
    }
    const conf = chapters[id] || chapters.home;
    const cam = camera as PerspectiveCamera;
    if (id !== "game") {
      const mobile = innerWidth <= 1024;
      positions.current.goal.set(...(mobile ? conf.mobileCamera : conf.camera));
      positions.current.at.set(...conf.target);
      if (id === "intro" && s.gate === "entering") {
        const t = s.story.current.entry;
        const home = mobile ? chapters.home.mobileCamera : chapters.home.camera;
        positions.current.goal.set(
          MathUtils.lerp(positions.current.goal.x, home[0], t),
          MathUtils.lerp(positions.current.goal.y, home[1], t),
          MathUtils.lerp(positions.current.goal.z, home[2], t),
        );
        positions.current.at.set(
          MathUtils.lerp(positions.current.at.x, chapters.home.target[0], t),
          MathUtils.lerp(positions.current.at.y, chapters.home.target[1], t),
          MathUtils.lerp(positions.current.at.z, chapters.home.target[2], t),
        );
      }
      if (id === "home") {
        if (mobile) positions.current.at.set(2.2, 1.8, 0);
        const t = reduced ? 0 : s.story.current.hero;
        positions.current.goal.x -= t * 2.1;
        positions.current.goal.y += Math.sin(t * Math.PI) * 1.4;
        positions.current.goal.z -= t * 3.1;
        positions.current.at.x += t * 1.25;
        if (!reduced) {
          positions.current.goal.x += state.pointer.x * 0.3;
          positions.current.goal.y += state.pointer.y * 0.16;
        }
      }
      if (id === "gallery") {
        const focus = pieces[s.piece].position;
        positions.current.goal.x += focus[0] * 0.55;
        positions.current.goal.z += focus[2] * 0.55;
        positions.current.at.x = focus[0] * 0.55;
        positions.current.at.z = 2 + focus[2] * 0.55;
      }
      if (id === "form")
        positions.current.goal.multiplyScalar(1 / s.inspection.current.zoom);
      const factor =
        reduced || id === "home" || id === "intro"
          ? 1
          : 1 - Math.exp(-5.5 * Math.min(dt, 0.05));
      cam.position.lerp(positions.current.goal, factor);
      positions.current.look.lerp(positions.current.at, factor);
      cam.lookAt(positions.current.look);
    }
    cam.fov =
      conf.fov + (id === "home" && !reduced ? s.story.current.hero * 5 : 0);
    cam.aspect = rect.width / rect.height;
    cam.updateProjectionMatrix();
    const lightProgress =
      id === "intro"
        ? s.story.current.entry
        : id === "home"
          ? s.story.current.hero
          : id === "contact"
            ? s.story.current.contact
            : 0;
    if (keyLight.current) {
      keyLight.current.position.set(
        -3 + lightProgress * 5,
        7 - lightProgress * 1.5,
        5,
      );
      keyLight.current.intensity =
        id === "intro"
          ? 1.8 + lightProgress * 1.2
          : 2.9 + Math.sin(lightProgress * Math.PI) * 0.6;
    }
    if (rimLight.current) {
      rimLight.current.intensity = 1.6 + lightProgress * 1.2;
      rimLight.current.position.x = 5 - lightProgress * 2;
    }
    if (poolLight.current) {
      poolLight.current.intensity = id === "intro" ? 8 + lightProgress * 5 : 14;
      poolLight.current.position.x = id === "home" ? 2.2 : 0;
    }
    gl.setViewport(
      rect.left,
      innerHeight - rect.bottom,
      rect.width,
      rect.height,
    );
    gl.setScissor(
      rect.left,
      innerHeight - rect.bottom,
      rect.width,
      rect.height,
    );
    gl.setScissorTest(true);
    gl.render(state.scene, cam);
    // Replace the loading indicator only after the actual scene has rendered.
    if (!s.worldReady) setWorldReady(true);
    Object.assign(window, {
      __lmInspection: {
        chapter: id,
        yaw: state.scene.getObjectByName(
          id === "form" ? "procedural-form" : "hero-sculpture",
        )?.rotation.y,
      },
      __lmStory: {
        hero: s.story.current.hero,
        heroExact: s.story.current.heroExact,
        projects: s.story.current.projects,
        projectsExact: s.story.current.projectsExact,
        projectCount: s.story.current.projectCount,
        skills: s.story.current.skills,
        lab: s.story.current.lab,
        contact: s.story.current.contact,
        entry: s.story.current.entry,
        camera: cam.position.toArray(),
        chapter: id,
      },
    });
    gl.setScissorTest(false);
    metrics.current.frames++;
    metrics.current.time += dt;
    if (metrics.current.samples.length >= 600) metrics.current.samples.splice(0, 300);
    if (metrics.current.frames > 60)
      metrics.current.samples.push(dt * 1000);
    if (metrics.current.frames % 60 === 0) {
      if (!lowQuality && metrics.current.frames >= 120) {
        const recent = metrics.current.samples.slice(-60);
        if (recent.length === 60 && recent.reduce((sum, ms) => sum + ms, 0) / 60 > 28) onSlow();
      }
      if (process.env.NODE_ENV === "development") {
        const marker = gl.domElement.closest<HTMLElement>(".world-canvas");
        if (marker) {
          marker.dataset.frameMs = ((metrics.current.time / metrics.current.frames) * 1000).toFixed(1);
          marker.dataset.drawCalls = String(gl.info.render.calls);
          marker.dataset.triangles = String(gl.info.render.triangles);
          marker.dataset.dpr = String(gl.getPixelRatio());
        }
      }
      Object.assign(window, {
        __lmMetrics: {
          chapter: id,
          drawCalls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
          dpr: gl.getPixelRatio(),
          frameTimes: metrics.current.samples,
          heap: (
            performance as Performance & { memory?: { usedJSHeapSize: number } }
          ).memory?.usedJSHeapSize,
        },
      });
    }
  }, 1);
  const intro = s.gate !== "portfolio",
    gallery = chapter === "gallery",
    game = s.game !== null,
    form = chapter === "form";
  return (
    <>
      <ambientLight intensity={0.22} />
      <directionalLight
        ref={keyLight}
        position={[-3, 7, 5]}
        intensity={2.9}
        castShadow
        shadow-mapSize={lowQuality ? [256, 256] : [512, 512]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <directionalLight ref={rimLight} position={[5, 3, -3]} intensity={2} />
      <spotLight
        ref={poolLight}
        position={[0, 6, 2]}
        angle={0.65}
        penumbra={0.85}
        intensity={12}
        color="#DCE5ED"
        distance={18}
        decay={2}
      />
      <Environment resolution={128}>
        <Lightformer intensity={4} position={[0, 5, -2]} scale={[8, 1.5, 1]} />
        <Lightformer
          intensity={3}
          position={[-5, 2, 1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1.4, 7, 1]}
        />
        <Lightformer
          intensity={2}
          position={[3, 2, 6]}
          rotation={[0, Math.PI, 0]}
          scale={[3, 5, 1]}
        />
        <Lightformer
          intensity={2}
          position={[-3, 4, 5]}
          rotation={[0, Math.PI, 0]}
          scale={[1, 5, 1]}
        />
      </Environment>
      <Atmosphere chapter={game ? "game" : chapter} reduced={reduced} lowQuality={lowQuality} />
      {intro ? (
        <>
          <Character
            active={s.characterActive}
            entering={s.gate === "entering"}
            reduced={reduced}
          />
          {s.gate === "entering" ? (
            <group position={[2.2, 0, 0]}>
              <Sculpture reduced={reduced} />
            </group>
          ) : null}
        </>
      ) : game ? (
        <Suspense fallback={null}>
          <Game reduced={reduced} />
        </Suspense>
      ) : gallery ? (
        <GalleryScene reduced={reduced} />
      ) : form ? (
        <Form reduced={reduced} />
      ) : chapter === "projects" ? (
        <ProjectWorld reduced={reduced} />
      ) : chapter === "home" || chapter === "contact" ? (
        <group position={chapter === "home" ? [2.2, 0, 0] : [0, 0, 0]}>
          <Sculpture contact={chapter === "contact"} reduced={reduced} />
        </group>
      ) : null}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.08, 0]}
        receiveShadow
      >
        <planeGeometry args={[80, 80]} />
        <shadowMaterial transparent opacity={0.22} />
      </mesh>
    </>
  );
}
export default function World() {
  const s = useShell(),
    [hidden, setHidden] = useState(false),
    [reduced, setReduced] = useState(false),
    [lowQuality, setLowQuality] = useState(false),
    [active, setActive] = useState(true);
  useEffect(() => {
    const limited = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (innerWidth < 768 || navigator.hardwareConcurrency <= 4 || (limited.deviceMemory && limited.deviceMemory <= 4) || limited.connection?.saveData) setLowQuality(true);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const change = () => setReduced(media.matches),
      visibility = () => setHidden(document.hidden);
    media.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const check = () => setActive(s.game !== null || Boolean(target()));
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    window.addEventListener("lm-scene", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      window.removeEventListener("lm-scene", check);
    };
  }, [s.openPiece, s.game, s.gate, s.mode]);
  if (s.fallback) return null;
  return (
    <div
      className={
        "world-canvas " +
        (s.gate !== "portfolio" ? "world-intro" : "") +
        (s.game !== null ? " world-game" : "")
      }
      aria-hidden="true"
      data-animation-active={active && !hidden}
      data-render-quality={lowQuality ? "efficient" : "balanced"}
    >
      <Boundary failed={() => s.setFallback(true)}>
        <Canvas
          shadows={{ type: PCFShadowMap }}
          dpr={[0.75, lowQuality ? 0.9 : Math.min(1.25, Math.sqrt(2000000 / (innerWidth * innerHeight)))]}
          frameloop={
            hidden || !active
              ? "never"
              : reduced && s.game === null
                ? "demand"
                : "always"
          }
          camera={{ position: [0, 1.35, 4.6], fov: 36 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          eventSource={document.body}
          events={(state) => ({
            ...events(state),
            compute(event, state) {
              const el = target();
              if (!el) return;
              const r = el.getBoundingClientRect();
              state.pointer.set(
                ((event.clientX - r.left) / r.width) * 2 - 1,
                (-(event.clientY - r.top) / r.height) * 2 + 1,
              );
              state.raycaster.setFromCamera(state.pointer, state.camera);
            },
          })}
        >
          <Suspense fallback={null}>
            <Runtime hidden={hidden} reduced={reduced} lowQuality={lowQuality} onSlow={() => setLowQuality(true)} />
          </Suspense>
        </Canvas>
      </Boundary>
    </div>
  );
}
