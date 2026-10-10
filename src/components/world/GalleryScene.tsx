"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  CatmullRomCurve3,
  TubeGeometry,
  Vector3,
  Group,
  MathUtils,
  ExtrudeGeometry,
} from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { useShell } from "@/components/shell/context";
import { pieces } from "@/data/content";
import Sculpture from "./Sculpture";
export function Form({ reduced = false }: { reduced?: boolean }) {
  const s = useShell(),
    ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current)
      ref.current.rotation.y = reduced
        ? s.inspection.current.yaw
        : MathUtils.damp(
            ref.current.rotation.y,
            s.inspection.current.yaw,
            6,
            Math.min(dt, 0.05),
          );
  });
  return (
    <group ref={ref} name="procedural-form" position={[0, 1.3, 0]}>
      {Array.from({ length: 18 }, (_, i) => (
        <mesh key={i} rotation={[i * 0.19, i * 0.31, 0]}>
          <torusGeometry args={[0.9, 0.04, 8, 64]} />
          <meshStandardMaterial
            color={i % 2 ? "#C7CDD3" : "#62369A"}
            metalness={0.9}
            roughness={0.24}
          />
        </mesh>
      ))}
    </group>
  );
}
function Traces({ lorenz = false }: { lorenz?: boolean }) {
  const paths = useMemo(() => {
    if (lorenz) {
      let x = 0.1,
        y = 0,
        z = 0;
      const points: Vector3[] = [];
      for (let i = 0; i < 2400; i++) {
        const dx = 10 * (y - x),
          dy = x * (28 - z) - y,
          dz = x * y - (8 / 3) * z;
        x += dx * 0.006;
        y += dy * 0.006;
        z += dz * 0.006;
        if (i > 300 && i % 5 === 0)
          points.push(new Vector3(x * 0.035, z * 0.035 - 0.05, y * 0.025));
      }
      return [
        new TubeGeometry(new CatmullRomCurve3(points), 320, 0.018, 5, false),
      ];
    }
    return Array.from({ length: 9 }, (_, j) => {
      const points = Array.from({ length: 38 }, (_, i) => {
        const x = (i / 37 - 0.5) * 1.65;
        return new Vector3(
          x,
          0.55 + Math.sin(x * 3 + j * 0.35) * 0.2 + j * 0.08,
          (j - 4) * 0.13 + Math.cos(x * 2) * 0.1,
        );
      });
      return new TubeGeometry(
        new CatmullRomCurve3(points),
        50,
        0.018,
        5,
        false,
      );
    });
  }, [lorenz]);
  useEffect(() => () => paths.forEach((g) => g.dispose()), [paths]);
  return (
    <group>
      {paths.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshStandardMaterial
            color={i % 2 ? "#7950B3" : "#D2D9DF"}
            metalness={0.95}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
function Word() {
  const profiles = useMemo(() => {
    // Authored local profiles, in world coordinates; no remote SVG is parsed.
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0H.55V.14H.16V1H0Z"/><path d="M0 0H.14V.74L.42 .43L.7 .74V0H.84V1L.42 .64L0 1Z"/></svg>';
    const shapes = new SVGLoader().parse(svg).paths.flatMap((path) => SVGLoader.createShapes(path));
    return shapes.map(
      (shape) =>
        new ExtrudeGeometry(shape, {
          depth: 0.16,
          bevelEnabled: true,
          bevelSize: 0.024,
          bevelThickness: 0.024,
          bevelSegments: 2,
          steps: 1,
        }),
    );
  }, []);
  useEffect(() => () => profiles.forEach((g) => g.dispose()), [profiles]);
  return (
    <group position={[-0.8, 0.13, 0]}>
      {profiles.map((geometry, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={[i * 0.75, 0, 0]}
          rotation={[0, i ? -0.3 : 0.18, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#AC89E2"
            metalness={0.95}
            roughness={0.22}
          />
        </mesh>
      ))}
    </group>
  );
}
function Connections() {
  const nodes = useMemo(
    () =>
      Array.from(
        { length: 10 },
        (_, i) =>
          new Vector3(
            Math.sin(i * 2.4) * 0.75,
            0.45 + (i % 4) * 0.23,
            Math.cos(i * 1.8) * 0.55,
          ),
      ),
    [],
  );
  const links = useMemo(
    () =>
      nodes
        .slice(1)
        .map(
          (point, i) =>
            new TubeGeometry(
              new CatmullRomCurve3([nodes[i], point]),
              1,
              0.012,
              4,
              false,
            ),
        ),
    [nodes],
  );
  useEffect(() => () => links.forEach((g) => g.dispose()), [links]);
  return (
    <group>
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.08, 12, 8]} />
          <meshStandardMaterial
            color="#C7CDD3"
            metalness={0.92}
            roughness={0.17}
          />
        </mesh>
      ))}
      {links.map((g, i) => (
        <mesh key={"edge" + i} geometry={g}>
          <meshStandardMaterial
            color="#8054B5"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
function Reaction() {
  // Relief of nested reaction fronts. The live Gray–Scott solver runs only in its dialog.
  return (
    <group position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 2.2) * 0.55,
            Math.cos(i * 1.5) * 0.55,
            (i % 3) * 0.05,
          ]}
          scale={[1, 0.7 + Math.sin(i) * 0.2, 1]}
        >
          <torusGeometry args={[0.13 + (i % 3) * 0.055, 0.028, 6, 24]} />
          <meshStandardMaterial
            color={i % 2 ? "#865CBD" : "#C7CDD3"}
            metalness={0.92}
            roughness={0.22}
          />
        </mesh>
      ))}
    </group>
  );
}
function Preview({ index, reduced }: { index: number; reduced: boolean }) {
  if (index === 0) return <Traces />;
  if (index === 1) return <Traces lorenz />;
  if (index === 2) return <Reaction />;
  if (index === 3)
    return (
      <group scale={0.57} position={[0, -0.1, 0]}>
        <Form reduced={reduced} />
      </group>
    );
  if (index === 4) return <Word />;
  if (index === 5) return <Connections />;
  if (index === 6)
    return (
      <group scale={0.39}>
        <Sculpture reduced accent />
      </group>
    );
  return (
    <group>
      {Array.from({ length: 7 }, (_, i) => (
        <RoundedBox
          key={i}
          args={[0.85, 0.14, 0.3]}
          radius={0.015}
          smoothness={1}
          position={[0, i * 0.14, (i - 3) * 0.28]}
        >
          <meshStandardMaterial
            color={i === 6 ? "#C7CDD3" : "#552B86"}
            metalness={0.9}
            roughness={0.23}
          />
        </RoundedBox>
      ))}
    </group>
  );
}
export default function GalleryScene({
  reduced = false,
}: {
  reduced?: boolean;
}) {
  const s = useShell(),
    root = useRef<Group>(null);
  useFrame((_, dt) => {
    root.current?.children.forEach((g, i) => {
      const target = i === s.piece ? 0.15 : 0;
      g.position.y = reduced
        ? target
        : MathUtils.damp(g.position.y, target, 6, Math.min(dt, 0.05));
    });
  });
  return (
    <group ref={root}>
      {pieces.map((p, i) => (
        <group
          key={p.id}
          position={p.position}
          onPointerOver={(e) => {
            const target = e.nativeEvent.target;
            if (
              target instanceof Element &&
              target.closest(".exhibition") &&
              !target.closest("button,a,dialog")
            ) {
              e.stopPropagation();
              s.setPiece(i);
            }
          }}
          onClick={(e) => {
            const target = e.nativeEvent.target;
            if (
              !(target instanceof Element) ||
              !target.closest(".exhibition") ||
              target.closest("button,a,dialog")
            )
              return;
            e.stopPropagation();
            s.setPiece(i);
          }}
        >
          <RoundedBox
            args={[2.2, 0.75, 2.2]}
            position={[0, -0.38, 0]}
            radius={0.035}
            smoothness={2}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={s.piece === i ? "#596470" : "#242B32"}
              metalness={0.88}
              roughness={0.29}
            />
          </RoundedBox>
          <Preview index={i} reduced={reduced} />
          {s.piece === i ? (
            <>
              <pointLight
                position={[0, 2, 0]}
                intensity={3}
                distance={4}
                color="#DCE5ED"
              />
              <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.4, 1.42, 48]} />
                <meshBasicMaterial color="#C7CDD3" />
              </mesh>
            </>
          ) : null}
        </group>
      ))}
    </group>
  );
}
