"use client";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import {
  Physics,
  RigidBody,
  CapsuleCollider,
  CuboidCollider,
  useRapier,
  useBeforePhysicsStep,
  type RapierRigidBody,
  type RapierCollider,
} from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Group, Vector3, MathUtils, Shape, ExtrudeGeometry, BoxGeometry, MeshStandardMaterial, MeshBasicMaterial, RingGeometry, type Mesh } from "three";
import { useShell } from "@/components/shell/context";
import {
  gameLevels,
  platformPosition,
  savedLanding,
  fixedBudget,
  fragmentReached,
  reversalCue,
  advanceAssembly,
  type GameLevel,
  type GamePlatform,
} from "@/lib/game-levels";
import Character, { type CharacterMotion } from "@/components/world/Character";
const notify = (name: string, detail: unknown) =>
  window.dispatchEvent(new CustomEvent(name, { detail }));
type Runtime = {
  time: number;
  collected: Set<number>;
  assembled: boolean;
  assemblyProgress: number | null;
  checkpoint: number;
  bodies: (RapierRigidBody | null)[];
};

// Every level shares its metal, bevels and repeatable profiles. The visual
// underside is cut diagonally; the known, tested walking surface stays flat.
function useGameResources(config: GameLevel) {
  const resources = useMemo(() => {
    const bevel = (points: [number, number][], depth: number) => {
      const shape = new Shape();
      points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
      shape.closePath();
      const geo = new ExtrudeGeometry(shape, {
        depth, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025,
        bevelSegments: 2, curveSegments: 1, steps: 1,
      });
      geo.translate(0, 0, -depth / 2);
      return geo;
    };
    const decks = new Map<string, ExtrudeGeometry>();
    config.platforms.forEach((p) => {
      const key = `${p.width}/${p.depth}`;
      if (decks.has(key)) return;
      const z = p.depth / 2 - 0.025;
      const geo = bevel([[-z, 0.375], [z, 0.375], [z, -0.1], [z - 0.25, -0.375], [-z + 0.25, -0.375], [-z, -0.1]], p.width - 0.05);
      geo.rotateY(Math.PI / 2);
      decks.set(key, geo);
    });
    return {
      decks,
      box: new BoxGeometry(1, 1, 1),
      blade: bevel([[-0.32, 0], [-0.32, 2.5], [0.23, 2.08], [0.43, 0]], 0.16),
      arch: bevel([[-0.3, 0], [-0.3, 3.3], [0.32, 2.82], [0.32, 0]], 0.38),
      ring: new RingGeometry(1.2, 1.23, 64),
      dark: new MeshStandardMaterial({ color: "#24272B", metalness: 0.82, roughness: 0.37 }),
      silver: new MeshStandardMaterial({ color: "#C7CDD3", metalness: 0.92, roughness: 0.25 }),
      edge: new MeshStandardMaterial({ color: "#747E87", metalness: 0.88, roughness: 0.3 }),
      recess: new MeshStandardMaterial({ color: "#101215", metalness: 0.6, roughness: 0.48 }),
      ink: new MeshBasicMaterial({ color: "#F1F3F5" }),
      trace: new MeshBasicMaterial({ color: "#41474E" }),
    };
  }, [config]);
  useEffect(() => () => {
    resources.decks.forEach((g) => g.dispose());
    resources.box.dispose(); resources.blade.dispose(); resources.arch.dispose(); resources.ring.dispose();
    resources.dark.dispose(); resources.silver.dispose(); resources.edge.dispose(); resources.recess.dispose();
    resources.ink.dispose(); resources.trace.dispose();
  }, [resources]);
  return resources;
}
type Resources = ReturnType<typeof useGameResources>;

function Player({
  config,
  runtime,
  reduced,
}: {
  config: GameLevel;
  runtime: MutableRefObject<Runtime>;
  reduced: boolean;
}) {
  const s = useShell(),
    { world, step } = useRapier(),
    { camera } = useThree();
  const body = useRef<RapierRigidBody>(null),
    collider = useRef<RapierCollider>(null);
  const controller = useRef<ReturnType<
    typeof world.createCharacterController
  > | null>(null);
  const state = useRef(s.game),
    checkpoint = useRef(0),
    vertical = useRef(0),
    coyote = useRef(0),
    buffer = useRef(0),
    wasGrounded = useRef(false);
  const recovery = useRef<number | null>(null);
  const pose = useRef<CharacterMotion>({
    speed: 0,
    airborne: false,
    landed: 0,
    completed: false,
    yaw: 0,
  });
  const goal = useRef(new Vector3()),
    look = useRef(new Vector3());
  const { inputs, setGame } = s;
  useEffect(() => {
    state.current = s.game;
  }, [s.game]);
  const changeState = (next: NonNullable<typeof s.game>) => {
    state.current = next;
    setGame(next);
  };
  const spawn = (index: number) => {
    const p =
      config.kind === "fragmentos"
        ? { x: 0, y: 0, z: 0 }
        : platformPosition(config.platforms[index], runtime.current.time);
    const position = { x: p.x, y: p.y + 0.55, z: p.z };
    body.current?.setTranslation(position, true);
    body.current?.setNextKinematicTranslation(position);
    vertical.current = coyote.current = buffer.current = 0;
    wasGrounded.current = false;
    pose.current.airborne = false;
    pose.current.speed = 0;
    pose.current.falling = false;
    pose.current.recovering = 1;
  };
  useEffect(() => {
    const ctrl = world.createCharacterController(0.015);
    ctrl.setSlideEnabled(true);
    ctrl.enableAutostep(0.12, 0.18, false);
    ctrl.enableSnapToGround(0.12);
    controller.current = ctrl;
    const reset = () => {
      recovery.current = null;
      checkpoint.current = 0;
      runtime.current.time = 0;
      runtime.current.collected.clear();
      runtime.current.assembled = false;
      runtime.current.assemblyProgress = null;
      runtime.current.checkpoint = 0;
      config.platforms.forEach((p, i) => {
        const pos = platformPosition(p, 0),
          translation = { ...pos, y: pos.y - 0.4 };
        runtime.current.bodies[i]?.setTranslation(translation, true);
        runtime.current.bodies[i]?.setNextKinematicTranslation(translation);
      });
      spawn(0);
      inputs.current.clear();
      pose.current.completed = false;
      pose.current.landed = 0;
      pose.current.yaw = 0;
      pose.current.recovering = 0;
      state.current = "ready";
      // Synchronize the visible bodies while the simulation is stopped at ready.
      step(0);
      setGame("ready");
      notify("lm-checkpoint", 0);
      notify("lm-fragments", 0);
      notify("lm-assembly", false);
    };
    window.addEventListener("lm-restart", reset);
    return () => {
      window.removeEventListener("lm-restart", reset);
      world.removeCharacterController(ctrl);
    };
    // The scene is keyed by kind; this controller lives for that session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, step, config, runtime, inputs, setGame]);
  useBeforePhysicsStep(() => {
    if (
      state.current !== "playing" ||
      document.hidden ||
      !body.current ||
      !collider.current ||
      !controller.current
    )
      return;
    if (recovery.current !== null) {
      spawn(checkpoint.current);
      recovery.current = null;
    }
    const dt = config.step,
      ctrl = controller.current,
      keys = inputs.current,
      translation = body.current.translation();
    if (runtime.current.assemblyProgress !== null) keys.clear();
    const previousTime = runtime.current.time;
    runtime.current.time += dt;
    // Carry a grounded capsule by exactly its supporting deck's fixed-step displacement.
    const grounded = ctrl.computedGrounded();
    const support = grounded
      ? config.platforms.findIndex((p) => {
          const q = platformPosition(p, previousTime);
          return (
            Math.abs(translation.x - q.x) < p.width / 2 + 0.05 &&
            Math.abs(translation.z - q.z) < p.depth / 2 + 0.05 &&
            Math.abs(translation.y - (q.y + 0.515)) < 0.22
          );
        })
      : -1;
    let carry = 0;
    config.platforms.forEach((p, i) => {
      if (!p.motion) return;
      const next = platformPosition(p, runtime.current.time);
      if (support === i) carry = next.x - platformPosition(p, previousTime).x;
      runtime.current.bodies[i]?.setNextKinematicTranslation({
        ...next,
        y: next.y - 0.4,
      });
    });
    const dx =
      // The camera looks toward +Z: positive world X appears left on screen.
      Number(keys.has("a") || keys.has("ArrowLeft")) -
      Number(keys.has("d") || keys.has("ArrowRight"));
    const dz =
      Number(keys.has("w") || keys.has("ArrowUp")) -
      Number(keys.has("s") || keys.has("ArrowDown"));
    const norm = Math.hypot(dx, dz) || 1;
    coyote.current = grounded
      ? config.coyote
      : Math.max(0, coyote.current - dt);
    buffer.current = Math.max(0, buffer.current - dt);
    if (keys.has("jump")) {
      buffer.current = config.buffer;
      keys.delete("jump");
    }
    if (grounded && vertical.current < 0) vertical.current = 0;
    if (buffer.current > 0 && coyote.current > 0) {
      vertical.current = config.jumpSpeed;
      buffer.current = 0;
      coyote.current = 0;
    }
    vertical.current += config.gravity * dt;
    ctrl.computeColliderMovement(
      collider.current,
      {
        x: (dx / norm) * config.speed * dt + carry,
        y: vertical.current * dt,
        z: (dz / norm) * config.speed * dt,
      },
      undefined,
      undefined,
      (c) => c.handle !== collider.current?.handle,
    );
    const move = ctrl.computedMovement(),
      resting = support >= 0 && !dx && !dz && vertical.current <= 0,
      next = {
        // Keep an idle rider's local position: capsule sliding can otherwise
        // accumulate horizontal correction on a moving, flat deck.
        x: translation.x + (resting ? carry : move.x),
        y: translation.y + move.y,
        z: translation.z + (resting ? 0 : move.z),
      };
    body.current.setNextKinematicTranslation(next);
    const landed = ctrl.computedGrounded();
    if (landed && vertical.current < 0) vertical.current = 0;
    pose.current.speed = Math.hypot(dx, dz);
    pose.current.airborne = !landed;
    pose.current.falling = !landed && vertical.current < -1;
    if (landed && !wasGrounded.current) pose.current.landed = 0.14;
    wasGrounded.current = landed;
    if (dx || dz) pose.current.yaw = Math.atan2(dx, dz);
    if (config.kind === "fragmentos") {
      config.fragments.forEach((fragment, i) => {
        if (
          !runtime.current.collected.has(i) &&
          fragmentReached(next, fragment)
        ) {
          runtime.current.collected.add(i);
          notify("lm-fragments", runtime.current.collected.size);
        }
      });
      if (
        runtime.current.collected.size === config.fragments.length &&
        fragmentReached(next, config.center) &&
        runtime.current.assemblyProgress === null
      ) {
        runtime.current.assemblyProgress = 0;
        inputs.current.clear();
        notify("lm-assembly", true);
      }
      if (runtime.current.assemblyProgress !== null) {
        runtime.current.assemblyProgress = advanceAssembly(runtime.current.assemblyProgress, dt, reduced);
        if (runtime.current.assemblyProgress === 1) {
          runtime.current.assembled = true;
          pose.current.completed = true;
          changeState("completed");
        }
      }
    } else if (landed) {
      const index = config.platforms.findIndex((p) => {
        const q = platformPosition(p, runtime.current.time);
        return (
          Math.abs(next.x - q.x) < p.width / 2 &&
          Math.abs(next.z - q.z) < p.depth / 2 &&
          Math.abs(next.y - (q.y + 0.515)) < 0.25
        );
      });
      const saved = savedLanding(config, index, checkpoint.current);
      if (saved !== checkpoint.current) {
        checkpoint.current = saved;
        runtime.current.checkpoint = saved;
        notify("lm-checkpoint", saved);
      }
      if (index === config.finish) {
        pose.current.completed = true;
        inputs.current.clear();
        changeState("completed");
        notify("lm-completed", true);
      }
    }
    if (next.y < config.platforms[checkpoint.current].y - 3.5) {
      inputs.current.clear();
      recovery.current = 0.25;
      changeState("respawning");
    }
  });
  useFrame((_, delta) => {
    if (!body.current) return;
    if (state.current !== "playing") pose.current.speed = 0;
    if (state.current === "playing" && !document.hidden)
      pose.current.recovering = Math.max(
        0,
        (pose.current.recovering ?? 0) - delta * 2.5,
      );
    if (
      state.current === "respawning" &&
      recovery.current !== null &&
      !document.hidden
    ) {
      recovery.current -= Math.min(delta, 0.05);
      if (recovery.current <= 0) {
        spawn(checkpoint.current);
        recovery.current = null;
        changeState("playing");
      }
    }
    const p = body.current.translation(),
      y = MathUtils.clamp(p.y, 0.5, config.platforms.at(-1)!.y + 2);
    const z = MathUtils.clamp(
      p.z,
      0,
      config.kind === "fragmentos" ? 10 : config.platforms.at(-1)!.z,
    );
    goal.current.set(
      config.kind === "fragmentos" ? 10 : 8,
      y + (config.kind === "fragmentos" ? 8 : 6.2),
      z - (config.kind === "fragmentos" ? 10 : 8.8),
    );
    camera.position.lerp(
      goal.current,
      reduced ? 1 : 1 - Math.exp(-5 * Math.min(delta, 0.05)),
    );
    look.current.set(
      config.kind === "fragmentos" ? p.x * 0.2 : 0,
      y + 0.6,
      z + 2.7,
    );
    camera.lookAt(look.current);
    const metrics = Object.freeze({
      gameKind: config.kind,
      position: Object.freeze({ x: p.x, y: p.y, z: p.z }),
      grounded: controller.current?.computedGrounded() ?? false,
      checkpoint: checkpoint.current,
      state: state.current,
      elapsed: runtime.current.time,
      collectibleCount: runtime.current.collected.size,
      assemblyProgress: runtime.current.assemblyProgress,
      movingCues: config.platforms.map((deck) => Object.freeze(reversalCue(deck, runtime.current.time))),
      movingPositions: config.platforms.map((deck) =>
        Object.freeze(platformPosition(deck, runtime.current.time)),
      ),
    });
    Object.assign(window, { __lmGame: metrics });
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      position={[0, 0.55, 0]}
      colliders={false}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider ref={collider} args={[0.25, 0.25]} />
      <group position={[0, -0.515, 0]} scale={0.6}>
        <Character motion={pose} reduced={reduced} />
      </group>
    </RigidBody>
  );
}

function Fragment({
  index,
  config,
  runtime,
  reduced,
  resources,
}: {
  index: number;
  config: GameLevel;
  runtime: MutableRefObject<Runtime>;
  reduced: boolean;
  resources: Resources;
}) {
  const group = useRef<Group>(null),
    position = config.fragments[index],
    target = useRef(new Vector3());
  const { game } = useShell();
  useFrame((_, dt) => {
    if (!group.current || game === "paused" || document.hidden) return;
    const collected = runtime.current.collected.has(index),
      progress = runtime.current.assemblyProgress ?? 0,
      complete = progress * progress * (3 - 2 * progress);
    const angle = (index / config.fragments.length) * Math.PI * 2;
    target.current.set(
      collected ? Math.cos(angle) * (1.1 - complete * 0.73) : position.x,
      collected
        ? 0.65 + index * 0.17 + Math.sin(complete * Math.PI) * 0.45
        : position.y + Math.sin(runtime.current.time * 2 + index) * 0.06,
      collected ? 5 + Math.sin(angle) * (1.1 - complete * 0.73) : position.z,
    );
    group.current.position.lerp(
      target.current,
      reduced || game === "ready" ? 1 : 1 - Math.exp(-7 * Math.min(dt, 0.05)),
    );
    group.current.rotation.y = collected
      ? angle + 0.3 * complete
      : runtime.current.time * 0.3 + index;
  });
  return (
    <group ref={group} position={[position.x, position.y, position.z]} dispose={null}>
      <mesh geometry={resources.blade} material={resources.silver} scale={[0.75, 0.48, 1]} castShadow />
      <mesh geometry={resources.box} material={resources.ink} position={[-0.2, 0.56, -0.095]} scale={[0.018, 0.95, 0.008]} />
    </group>
  );
}
function Deck({ platform, index, config, runtime, resources }: {
  platform: GamePlatform;
  index: number;
  config: GameLevel;
  runtime: MutableRefObject<Runtime>;
  resources: Resources;
}) {
  const signal = useRef<Mesh>(null), marker = useRef<Mesh>(null);
  const p = platform;
  useFrame(() => {
    if (signal.current) {
      const cue = reversalCue(p, runtime.current.time);
      signal.current.scale.x = (p.width - 0.32) * (0.08 + cue.warning * 0.92);
      signal.current.position.x = cue.direction * (p.width - 0.32 - signal.current.scale.x) / 2;
    }
    if (marker.current) marker.current.material = runtime.current.checkpoint >= index ? resources.ink : resources.edge;
  });
  return <group dispose={null}>
    <mesh geometry={resources.decks.get(`${p.width}/${p.depth}`)} material={p.motion ? resources.silver : p.checkpoint || index === config.finish ? resources.edge : resources.dark} castShadow receiveShadow />
    <mesh geometry={resources.box} material={resources.ink} position={[0, 0.403, -p.depth / 2 + 0.1]} scale={[p.width - 0.2, 0.009, 0.025]} />
    {p.motion ? <>
      <mesh geometry={resources.box} material={resources.recess} position={[0, 0.405, p.depth / 2 - 0.18]} scale={[p.width - 0.25, 0.015, 0.14]} />
      <mesh ref={signal} geometry={resources.box} material={resources.ink} position={[0, 0.415, p.depth / 2 - 0.18]} scale={[0.1, 0.015, 0.075]} />
    </> : null}
    {p.checkpoint || index === config.finish ? <mesh ref={marker} geometry={resources.ring} material={resources.edge} position={[0, 0.408, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.38} /> : null}
  </group>;
}
function Architecture({ resources, runtime }: { resources: Resources; runtime: MutableRefObject<Runtime> }) {
  const ring = useRef<Mesh>(null);
  useFrame(() => {
    if (ring.current) {
      const all = runtime.current.collected.size === 5;
      ring.current.material = all ? resources.ink : resources.edge;
      const scale = all && !runtime.current.assembled ? 1 + Math.sin(runtime.current.time * 3) * 0.06 : 1;
      ring.current.scale.setScalar(scale);
    }
  });
  return (
    <group dispose={null}>
      {[-4.1, 4.1].map((x) => (
        <group key={x} position={[x, 0, 5]}>
          {[1, 5, 9].map((z) => (
            <RigidBody
              key={z}
              type="fixed"
              position={[0, 1.6, z - 5]}
              colliders={false}
            >
              <CuboidCollider args={[0.22, 1.6, 0.3]} />
              <mesh geometry={resources.arch} material={resources.dark} position={[0, -1.6, 0]} castShadow />
            </RigidBody>
          ))}
          <RoundedBox
            args={[0.55, 0.35, 9]}
            radius={0.09}
            position={[0, 3.15, 0]}
            castShadow
          >
            <meshStandardMaterial
              color="#C7CDD3"
              metalness={0.8}
              roughness={0.36}
            />
          </RoundedBox>
        </group>
      ))}
      <mesh ref={ring} geometry={resources.ring} material={resources.edge} position={[0, 0.025, 5]} rotation={[-Math.PI / 2, 0, 0]} />
      <RoundedBox
        args={[0.65, 0.1, 0.65]}
        radius={0.04}
        position={[0, 0.05, 5]}
      >
        <meshStandardMaterial
          color="#C7CDD3"
          metalness={0.8}
          roughness={0.35}
        />
      </RoundedBox>
    </group>
  );
}
function BoundedStepper() {
  const { step } = useRapier(),
    s = useShell(),
    remainder = useRef(0);
  useFrame((_, dt) => {
    if (s.game !== "playing" || document.hidden) {
      remainder.current = 0;
      return;
    }
    const budget = fixedBudget(remainder.current, dt);
    remainder.current = budget.remainder;
    for (let i = 0; i < budget.steps; i++) step(1 / 60);
  }, -10);
  return null;
}
function LevelScene({
  config,
  reduced,
}: {
  config: GameLevel;
  reduced: boolean;
}) {
  const runtime = useRef<Runtime>({
    time: 0,
    collected: new Set(),
    assembled: false,
    assemblyProgress: null,
    checkpoint: 0,
    bodies: [],
  });
  const resources = useGameResources(config);
  return (
    <Physics
      timeStep={config.step}
      interpolate={false}
      paused
      gravity={[0, 0, 0]}
    >
      {config.platforms.map((p, i) => {
        const initial = platformPosition(p, 0);
        return (
          <RigidBody
            key={i}
            ref={(body) => {
              runtime.current.bodies[i] = body;
            }}
            type={p.motion ? "kinematicPosition" : "fixed"}
            position={[initial.x, initial.y - 0.4, initial.z]}
            colliders={false}
          >
            <CuboidCollider args={[p.width / 2, 0.4, p.depth / 2]} />
            <Deck platform={p} index={i} config={config} runtime={runtime} resources={resources} />
          </RigidBody>
        );
      })}
      {config.kind === "fragmentos" ? (
        <>
          <Architecture resources={resources} runtime={runtime} />
          {config.fragments.map((_, i) => (
            <Fragment
              key={i}
              index={i}
              config={config}
              runtime={runtime}
              reduced={reduced}
              resources={resources}
            />
          ))}
        </>
      ) : null}
      <BoundedStepper />
      <Player config={config} runtime={runtime} reduced={reduced} />
    </Physics>
  );
}
export default function GameScene({ reduced = false }: { reduced?: boolean }) {
  const { gameKind } = useShell(),
    config = useMemo(() => gameLevels[gameKind], [gameKind]);
  return <LevelScene key={gameKind} config={config} reduced={reduced} />;
}
