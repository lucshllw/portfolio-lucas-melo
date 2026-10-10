"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Shape } from "three";
import { useShell } from "@/components/shell/context";
import { architecturalRibbon, roundedExtrusion, surfaceGrain } from "./authoredGeometry";

/** FENDA: two continuous cast-and-machined ribbons enclosing a diagonal void. */
export default function Sculpture({
  contact = false,
  reduced = false,
  openingOverride,
  accent = false,
}: {
  contact?: boolean;
  reduced?: boolean;
  openingOverride?: number;
  accent?: boolean;
}) {
  const shell = useShell(), root = useRef<Group>(null);
  const folds = useRef<(Group | null)[]>([]);
  const echo = useRef<Group>(null), glitchUntil = useRef(0);
  const spin = useRef(0), nextGlitch = useRef<number | null>(null);
  useEffect(() => { spin.current = 0; nextGlitch.current = null; glitchUntil.current = 0; }, [contact, reduced]);
  const resources = useMemo(() => {
    const grain = surfaceGrain();
    grain.repeat.set(5, 11);
    const left = architecturalRibbon([
      [-1.55, 0.08], [-1.55, 3.43], [-0.96, 3.55],
      [1.24, 2.66], [1.03, 2.08], [-0.92, 2.85],
      [-0.92, 0.60], [-0.34, 0.60], [-0.56, 0.08],
    ], 0.57, 0);
    const right = architecturalRibbon([
      [0.91, 0.08], [1.66, 0.08], [1.66, 2.88],
      [1.08, 2.63], [1.08, 0.94], [-0.66, 1.78],
      [-0.94, 1.23], [0.91, 0.34],
    ], 0.69, 1);
    const plinth = new Shape();
    plinth.moveTo(-1.59, 0.035); plinth.lineTo(1.7, 0.035);
    plinth.lineTo(1.7, 0.075); plinth.lineTo(-1.59, 0.075); plinth.closePath();
    const base = roundedExtrusion(plinth, 0.78, 0.018);
    const brushed = new MeshPhysicalMaterial({
      color: accent ? "#7444AD" : "#9FA7B0", metalness: 0.96, roughness: 0.30,
      roughnessMap: grain, envMapIntensity: 1.2,
      anisotropy: 0.32, anisotropyRotation: Math.PI / 2,
      clearcoat: 0.12, clearcoatRoughness: 0.3,
    });
    const satin = new MeshPhysicalMaterial({
      color: "#C7CDD3", metalness: 0.96, roughness: 0.24,
      roughnessMap: grain, envMapIntensity: 1.25,
      anisotropy: 0.26, clearcoat: 0.16, clearcoatRoughness: 0.22,
    });
    const cut = new MeshPhysicalMaterial({
      color: "#D4D9E0", metalness: 0.98, roughness: 0.19,
      roughnessMap: grain, envMapIntensity: 1.2,
    });
    const baseMaterial = new MeshStandardMaterial({
      color: "#272B30", metalness: 0.9, roughness: 0.36, roughnessMap: grain,
    });
    const echoes = ["#7c3aed", "#d8b4fe"].map(color => new MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: .75, depthWrite: false }));
    return { geo: [left, right, base], grain, mats: [brushed, satin, cut, baseMaterial], echoes };
  }, [accent]);
  useEffect(() => () => {
    resources.geo.forEach(g => g.dispose());
    resources.mats.forEach(m => m.dispose());
    resources.echoes.forEach(m => m.dispose());
    resources.grain.dispose();
  }, [resources]);

  useFrame((state, dt) => {
    if (!root.current) return;
    const { hero, projects, projectCount } = shell.story.current;
    const requestedOpening = openingOverride ?? (contact || reduced ? 0 : hero);
    const opening = MathUtils.clamp(Number.isFinite(requestedOpening) ? requestedOpening : 0, 0, 1);
    const study = contact || reduced ? 0 : MathUtils.clamp(projects / Math.max(1, projectCount - 1), 0, 1);
    if (contact && !reduced && !document.hidden) {
      spin.current = (spin.current + Math.min(dt, .05) * .28) % (Math.PI * 2);
      // Scheduling inside the existing visible scene loop adds no timers or canvas.
      const now = performance.now();
      if (nextGlitch.current === null) nextGlitch.current = now + 1000 + Math.random() * 1000;
      if (now >= nextGlitch.current) {
        glitchUntil.current = now + 280;
        nextGlitch.current = now + 1000 + Math.random() * 1000;
      }
    }
    const yaw = contact
      ? 0.55 + (reduced ? 0 : spin.current)
      : -0.14 + opening * 0.28 + study * 0.17 + (reduced ? 0 : state.pointer.x * 0.018);
    root.current.rotation.set(0, yaw, 0);
    root.current.position.set(0, -0.05, -opening * 0.12);
    const remaining = Math.max(0, (glitchUntil.current - performance.now()) / 280);
    const burst = reduced ? 0 : remaining;
    const shift = Math.sin(Math.floor(state.clock.elapsedTime * 12) * 17) * burst;
    if (echo.current) {
      echo.current.visible = burst > 0;
      echo.current.position.x = shift * .28;
      echo.current.scale.set(1 + burst * .06, 1, 1);
    }
    resources.mats[0].emissive.set("#6d28d9");
    resources.mats[1].emissive.set("#a855f7");
    resources.mats[0].emissiveIntensity = burst * .7;
    resources.mats[1].emissiveIntensity = burst * .5;
    // The opening peels the continuous solids away from their diagonal joint.
    // Its position is authored entirely from one normalized value and reverses exactly.
    const peel = MathUtils.smoothstep(opening, 0.06, 0.92);
    if (folds.current[0]) {
      folds.current[0].position.set(-peel * 0.65, peel * 0.26, -peel * 0.18);
      folds.current[0].position.x += shift * .22;
      folds.current[0].rotation.set(-peel * 0.06, -peel * 0.30, peel * 0.055);
    }
    if (folds.current[1]) {
      folds.current[1].position.set(peel * 0.68, peel * 0.045, peel * 0.35);
      folds.current[1].position.x -= shift * .18;
      folds.current[1].rotation.set(peel * 0.07, peel * 0.34, -peel * 0.055);
    }
  });

  return <group ref={root} name="hero-sculpture" position={[0, -0.05, 0]} dispose={null}>
    <group ref={echo} visible={false} name="purple-glitch-echo">
      {[0, 1].map(i => <mesh key={i} geometry={resources.geo[i]} material={resources.echoes[i]} position={[i ? -.15 : .15, 0, .035]} />)}
    </group>
    {[0, 1].map(i => <group key={i} ref={el => { folds.current[i] = el; }} name={`fenda-ribbon-${i}`}>
      <mesh geometry={resources.geo[i]} material={[resources.mats[i], resources.mats[2]]} castShadow receiveShadow />
    </group>)}
    <mesh geometry={resources.geo[2]} material={resources.mats[3]} castShadow receiveShadow />
  </group>;
}
