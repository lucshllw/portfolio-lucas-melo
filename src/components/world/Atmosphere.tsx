"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import { Group, MathUtils } from "three";
import { useShell } from "@/components/shell/context";
export default function Atmosphere({
  chapter,
  reduced,
  lowQuality = false,
}: {
  chapter: string;
  reduced: boolean;
  lowQuality?: boolean;
}) {
  const s = useShell(),
    arches = useRef<Group>(null),
    facets = useRef<Group>(null);
  useFrame((state, dt) => {
    const p = s.story.current.hero;
    if (arches.current) {
      const yaw = reduced ? 0 : state.pointer.x * 0.1 + p * 0.18;
      arches.current.rotation.y = MathUtils.damp(
        arches.current.rotation.y,
        yaw,
        6,
        Math.min(dt, 0.05),
      );
      arches.current.position.y = -0.5 - p * 0.4;
    }
    if (facets.current) {
      facets.current.rotation.y = reduced
        ? 0
        : state.pointer.x * 0.13 - p * 0.3;
      facets.current.children.forEach((m, i) => {
        m.position.y =
          0.45 +
          Math.sin(i * 1.7) * 0.3 +
          (reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.35 + i) * 0.05) +
          p * 0.5;
      });
    }
  });
  const game = chapter === "game",
    intro = chapter === "intro";
  return (
    <group name="architectural-atmosphere">
      {intro ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.11, 0]}
          receiveShadow
        >
          <planeGeometry args={[60, 60]} />
          {lowQuality ? <meshStandardMaterial color="#252B32" transparent opacity={0.4} metalness={0.72} roughness={0.3} /> : <MeshReflectorMaterial
            transparent
            opacity={0.4}
            resolution={innerWidth < 768 ? 256 : 512}
            blur={[80, 25]}
            mixBlur={0.55}
            mixStrength={1.3}
            mirror={0.65}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.5}
            depthScale={0.5}
            color="#252B32"
            metalness={0.72}
            roughness={0.2}
          />}
        </mesh>
      ) : null}
      <group ref={arches} position={[0, -0.5, -8]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            rotation={[0, 0, -0.22 + i * 0.21]}
            position={[2 - i * 2, 1, -i * 4]}
          >
            <torusGeometry
              args={[7 + i * 1.6, 0.16 + i * 0.045, 8, 80, Math.PI * 1.28]}
            />
            <meshStandardMaterial
              color={i === 1 ? "#444C55" : "#20262C"}
              metalness={0.92}
              roughness={0.23}
            />
          </mesh>
        ))}
      </group>
      {!intro && !game && chapter !== "gallery" ? (
        <group ref={facets} position={[0, 0, -4]}>
          {Array.from({ length: 7 }, (_, i) => (
            <RoundedBox
              key={i}
              args={[0.28 + i * 0.04, 0.65, 0.23]}
              radius={0.055}
              smoothness={2}
              position={[-5 + i * 1.6, 0.6, -Math.abs(i - 3) * 0.8]}
              rotation={[0.15, i * 0.4, 0.35]}
              castShadow
            >
              <meshStandardMaterial
                color={i % 2 ? "#77818C" : "#242B32"}
                metalness={0.95}
                roughness={0.22}
              />
            </RoundedBox>
          ))}
        </group>
      ) : null}
    </group>
  );
}
