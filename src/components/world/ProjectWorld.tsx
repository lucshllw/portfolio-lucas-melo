"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Group } from "three";
import { useShell } from "@/components/shell/context";
import Sculpture from "./Sculpture";

const identities = ["percurso", "travessia", "fragmentos", "fenda"];
function Deck({ position, wide = false, silver = false }: { position: [number, number, number]; wide?: boolean; silver?: boolean }) {
  return <RoundedBox args={[wide ? 2.25 : 1.45, 0.3, 1.12]} radius={0.065} smoothness={3} position={position} castShadow receiveShadow>
    <meshStandardMaterial color={silver ? "#B8C0C9" : "#48515B"} metalness={0.94} roughness={0.24} />
  </RoundedBox>;
}
export default function ProjectWorld({ reduced }: { reduced: boolean }) {
  const s = useShell(), root = useRef<Group>(null), sets = useRef<Group>(null), moving = useRef<Group>(null);
  useFrame(state => {
    const value = s.story.current.projects;
    const index = Math.round(value);
    const identity = s.story.current.projectScenes[index] ?? identities[index];
    const fraction = value - index;
    if (root.current) {
      root.current.rotation.y = (reduced ? 0 : state.pointer.x * 0.07) + fraction * 0.35;
      root.current.position.x = fraction * 1.4;
      root.current.scale.setScalar(1 - Math.abs(fraction) * 0.13);
    }
    sets.current?.children.forEach((g, i) => { g.visible = identities[i] === identity; });
    if (identity === "travessia" && moving.current) {
      moving.current.children.forEach((deck, i) => {
        deck.position.x = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.7 + i * 0.85) * 0.9;
      });
    }
  });
  return <group ref={root} name="project-world" position={[0, 0.1, 0]}>
    <group ref={sets}>
      <group name="preview-percurso">
        <group rotation={[0, -0.28, 0]}>
          {Array.from({ length: 7 }, (_, i) => <Deck key={i} position={[Math.sin(i * 0.45) * 0.45, i * 0.32 - 0.35, (i - 3) * -0.93]} silver={i % 3 === 0} />)}
          
        </group>
      </group>
      <group name="preview-travessia" rotation={[0, 0.28, 0]}>
        <Deck position={[0, 0, 3.65]} wide silver />
        <Deck position={[0, 0.4, -3.65]} wide silver />
        <group ref={moving}>
          {Array.from({ length: 5 }, (_, i) => <Deck key={i} position={[0, i * 0.075, (i - 2) * -1.18]} silver={i % 2 === 0} />)}
        </group>
        
      </group>
      <group name="preview-fragmentos">
        {Array.from({ length: 5 }, (_, i) => <group key={i} rotation={[0, -i * 1.256, 0]}><Deck position={[0, -0.1, 2.65]} silver={i % 2 === 0} /></group>)}
        <group scale={0.72} position={[0, 0, -0.15]}><Sculpture reduced openingOverride={0.58} /></group>
        
      </group>
      <group name="preview-fenda" scale={1.08} position={[0, -0.15, 0]}>
        <Sculpture reduced={reduced} openingOverride={0.35} />
      </group>
    </group>
  </group>;
}
