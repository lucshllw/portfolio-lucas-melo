"use client";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  MathUtils,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
} from "three";
import { useShell } from "@/components/shell/context";
import { character } from "./config";
import {
  creatureBody,
  creatureLimb,
  roundedExtrusion,
  sculptedCurve,
  surfaceGrain,
} from "./authoredGeometry";

export type CharacterMotion = {
  speed: number;
  airborne: boolean;
  landed: number;
  completed: boolean;
  yaw: number;
  falling?: boolean;
  recovering?: number;
};

function eyeOutline(width: number, height: number) {
  const s = new Shape();
  s.absellipse(0, 0, width, height, 0, Math.PI * 2, false, 0);
  return s;
}

export default function Character({
  active = false,
  entering = false,
  reduced = false,
  discover = false,
  motion,
}: {
  active?: boolean;
  entering?: boolean;
  reduced?: boolean;
  discover?: boolean;
  motion?: MutableRefObject<CharacterMotion>;
}) {
  const shell = useShell();
  const rig = useRef<Group>(null),
    torso = useRef<Group>(null),
    face = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const arms = useRef<(Group | null)[]>([]),
    legs = useRef<(Group | null)[]>([]);
  const clock = useRef(0),
    gait = useRef(0),
    attention = useRef(0),
    wonder = useRef(0);
  const resources = useMemo(() => {
    const foot = new Shape();
    foot.moveTo(-0.12, 0.02);
    foot.bezierCurveTo(-0.17, 0.07, -0.12, 0.13, 0, 0.13);
    foot.bezierCurveTo(0.13, 0.14, 0.16, 0.06, 0.12, 0.02);
    foot.lineTo(-0.12, 0.02);
    const grain = surfaceGrain(823);
    const purple = new MeshPhysicalMaterial({
      color: character.color,
      roughness: 0.38,
      roughnessMap: grain,
      metalness: 0.03,
      clearcoat: 0.24,
      clearcoatRoughness: 0.32,
      envMapIntensity: 0.65,
    });
    const shadow = new MeshPhysicalMaterial({
      color: character.shadow,
      roughness: 0.37,
      roughnessMap: grain,
      metalness: 0.03,
      clearcoat: 0.22,
    });
    const eye = new MeshPhysicalMaterial({
      color: "#111015",
      roughness: 0.17,
      metalness: 0.08,
      clearcoat: 0.7,
    });
    const glint = new MeshStandardMaterial({
      color: "#F1F3F5",
      roughness: 0.28,
    });
    return {
      grain,
      geo: {
        body: creatureBody(),
        arm: creatureLimb(),
        foot: roundedExtrusion(foot, 0.27, 0.04),
        socket: roundedExtrusion(eyeOutline(0.072, 0.105), 0.014, 0.014),
        eye: roundedExtrusion(eyeOutline(0.046, 0.076), 0.012, 0.009),
        glint: roundedExtrusion(eyeOutline(0.012, 0.016), 0.004, 0.002),
        mouth: sculptedCurve(
          [
            [-0.074, 0, 0],
            [-0.025, -0.016, 0.011],
            [0.027, -0.012, 0.009],
            [0.077, 0.016, 0],
          ],
          0.012,
        ),
      },
      mat: { purple, shadow, eye, glint },
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources.geo).forEach((g) => g.dispose());
      Object.values(resources.mat).forEach((m) => m.dispose());
      resources.grain.dispose();
    },
    [resources],
  );

  useFrame((state, delta) => {
    if (!rig.current || !torso.current) return;
    const dt = Math.min(delta, 0.05),
      pose = motion?.current;
    if (!reduced) clock.current += dt;
    const t = clock.current;
    // The shell owns entry timing. No independent entry timer or random hop.
    const entry = entering
      ? MathUtils.clamp(shell.story.current.entry, 0, 1)
      : 0;
    const compress =
      entering && !reduced
        ? Math.sin(Math.PI * MathUtils.clamp(entry / 0.36, 0, 1))
        : 0;
    const depart =
      entering && !reduced ? MathUtils.smoothstep(entry, 0.3, 0.9) : 0;
    const lift =
      entering && !reduced
        ? Math.sin(Math.PI * MathUtils.smoothstep(entry, 0.28, 0.85)) * 0.14
        : 0;
    attention.current = reduced
      ? Number(active)
      : MathUtils.damp(attention.current, Number(active), 10, dt);
    const focus = attention.current;
    wonder.current = reduced
      ? Number(discover)
      : MathUtils.damp(wonder.current, Number(discover), 7, dt);
    const delight = wonder.current;
    const invitation =
      pose || active || reduced || entering
        ? 0
        : Math.pow(Math.max(0, Math.sin(t * 0.72 - 0.4)), 8);
    const speed = MathUtils.clamp(pose?.speed ?? 0, 0, 1);
    if (!reduced)
      gait.current += dt * (7.5 + speed * 5.5) * (speed > 0.04 ? 1 : 0);
    const step = reduced ? 0 : Math.sin(gait.current) * speed;
    const landing = reduced
      ? 0
      : MathUtils.clamp((pose?.landed ?? 0) / 0.16, 0, 1);
    // Retain the existing countdown contract used by the physics controller.
    if (pose) pose.landed = reduced ? 0 : Math.max(0, pose.landed - delta);
    const recovery = MathUtils.clamp(pose?.recovering ?? 0, 0, 1);
    const falling = Boolean(pose?.falling);
    const air = Boolean(pose?.airborne);
    const breath = reduced ? 0 : Math.sin(t * 1.85) * 0.009;
    rig.current.position.set(depart * 7.5, lift + depart * 1.7, -depart * 1.5);
    rig.current.scale.set(
      1 + compress * 0.09 + landing * 0.07,
      1 - compress * 0.14 - landing * 0.11,
      1 + compress * 0.04,
    );
    const yaw = pose?.yaw ?? focus * -0.1 + depart * -0.65;
    rig.current.rotation.y = reduced
      ? yaw
      : MathUtils.damp(
          rig.current.rotation.y,
          rig.current.rotation.y +
            Math.atan2(
              Math.sin(yaw - rig.current.rotation.y),
              Math.cos(yaw - rig.current.rotation.y),
            ),
          12,
          dt,
        );
    const lean = falling
      ? -0.33
      : recovery * 0.23 + depart * 0.12 - invitation * 0.035;
    rig.current.rotation.z = reduced
      ? falling
        ? -0.33
        : recovery * 0.23
      : MathUtils.damp(
          rig.current.rotation.z,
          pose?.completed ? Math.sin(t * 3) * 0.055 : lean - delight * 0.075,
          12,
          dt,
        );
    torso.current.position.y = breath + (reduced ? 0 : Math.abs(step) * 0.022);
    torso.current.rotation.x = reduced
      ? falling
        ? 0.35
        : air
          ? -0.1
          : 0
      : MathUtils.damp(
          torso.current.rotation.x,
          falling ? 0.35 : air ? -0.12 : speed * 0.11 - focus * 0.025,
          12,
          dt,
        );
    if (face.current) {
      face.current.rotation.y =
        reduced || pose
          ? 0
          : MathUtils.damp(
              face.current.rotation.y,
              state.pointer.x * 0.075,
              10,
              dt,
            );
      face.current.rotation.x =
        reduced || pose
          ? 0
          : MathUtils.damp(
              face.current.rotation.x,
              -state.pointer.y * 0.04,
              10,
              dt,
            );
    }
    if (eyes.current) {
      eyes.current.position.x = reduced || pose ? 0 : state.pointer.x * 0.017;
      eyes.current.position.y = reduced || pose ? 0 : state.pointer.y * 0.014;
      const blinkTime = t % 5.7;
      const blink =
        !reduced && blinkTime > 5.52
          ? Math.sin(((blinkTime - 5.52) / 0.18) * Math.PI)
          : 0;
      eyes.current.scale.y = 1 - blink * 0.91 + focus * 0.06 + delight * 0.17;
    }
    arms.current.forEach((arm, i) => {
      if (!arm) return;
      const side = i === 0 ? -1 : 1;
      let x = -step * side * 0.55;
      let z = side * (0.12 + focus * 0.12);
      if (air) {
        x = -0.72;
        z = side * 0.34;
      }
      if (falling) {
        x = -1.15;
        z = side * 0.73;
      }
      if (pose?.completed) {
        x = -0.3;
        z = side * 2.15;
      }
      if (!pose && i === 1) {
        z +=
          focus * 1.67 +
          invitation * 0.95 +
          compress * 0.65 +
          (reduced ? 0 : focus * Math.sin(t * 3.8) * 0.11);
        x -= focus * 0.32 + compress * 0.35 + invitation * 0.15;
      }
      if (discover && !pose) {
        z = side * (0.25 + delight * 1.65);
        x = -delight * 0.5;
      }
      arm.rotation.x = reduced ? x : MathUtils.damp(arm.rotation.x, x, 13, dt);
      arm.rotation.z = reduced ? z : MathUtils.damp(arm.rotation.z, z, 13, dt);
    });
    legs.current.forEach((leg, i) => {
      if (!leg) return;
      const side = i === 0 ? -1 : 1;
      const x = air ? 0.34 + side * 0.1 : -step * side * 0.55;
      leg.rotation.x = reduced
        ? air
          ? 0.34
          : 0
        : MathUtils.damp(leg.rotation.x, x, 15, dt);
      leg.position.y =
        0.25 + (reduced || air ? 0 : Math.max(0, step * side) * 0.065);
    });
  });

  const { geo, mat } = resources;
  return (
    <group ref={rig} name="violet-creature" dispose={null}>
      <group ref={torso}>
        <mesh
          geometry={geo.body}
          material={mat.purple}
          castShadow
          receiveShadow
        />
        <group ref={face} position={[0, 1.11, 0.315]}>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              geometry={geo.socket}
              material={mat.shadow}
              position={[side * 0.155, 0.055, 0]}
              rotation={[0, side * 0.17, side * -0.07]}
            />
          ))}
          <group ref={eyes}>
            {[-1, 1].map((side) => (
              <group
                key={side}
                position={[side * 0.155, 0.055, 0.02]}
                rotation={[0, side * 0.17, side * -0.07]}
              >
                <mesh geometry={geo.eye} material={mat.eye} />
                <mesh
                  geometry={geo.glint}
                  material={mat.glint}
                  position={[-0.013, 0.025, 0.025]}
                />
              </group>
            ))}
          </group>
          <mesh
            geometry={geo.mouth}
            material={mat.eye}
            position={[0.01, -0.115, 0.027]}
          />
        </group>
        {[-1, 1].map((side, i) => (
          <group
            key={side}
            ref={(el) => {
              arms.current[i] = el;
            }}
            position={[side * 0.52, 1.17, -0.005]}
            rotation={[0, 0, side * 0.12]}
          >
            <mesh
              geometry={geo.arm}
              material={mat.purple}
              scale={[side, 1, 1]}
              castShadow
            />
          </group>
        ))}
      </group>
      {[-1, 1].map((side, i) => (
        <group
          key={side}
          ref={(el) => {
            legs.current[i] = el;
          }}
          position={[side * 0.23, 0.25, 0]}
        >
          <mesh
            geometry={geo.arm}
            material={mat.shadow}
            scale={[0.55, 0.5, 0.7]}
            position={[0, 0.09, -0.025]}
            castShadow
          />
          <mesh
            geometry={geo.foot}
            material={mat.shadow}
            position={[0, -0.23, 0.115]}
            castShadow
          />
        </group>
      ))}
    </group>
  );
}
