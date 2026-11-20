"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Matrix4, Quaternion, Vector3, Euler } from "three";
import { FRUIT_BY_ID } from "@/data";
import { pointer } from "@/lib/pointer";
import { useApp } from "@/lib/store";
import { mulberry32 } from "./geometry";
import { prefersReducedMotion } from "./FruitModel";

const COUNT = 44;
const m = new Matrix4();
const q = new Quaternion();
const e = new Euler();
const p = new Vector3();
const s = new Vector3();

/** Seed-like motes with spring-to-home physics, drift noise and pointer repulsion. */
export function Particles() {
  const ref = useRef<InstancedMesh>(null!);
  const fruitId = useApp((st) => st.fruitId);
  const data = useMemo(() => {
    const rand = mulberry32(42);
    return Array.from({ length: COUNT }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const home = new Vector3(side * (1.9 + rand() * 5.2), (rand() * 2 - 1) * 3.2, -1.2 - rand() * 5);
      return {
        home,
        pos: home.clone(),
        vel: new Vector3(),
        size: 0.035 + rand() * rand() * 0.14,
        stretch: 1 + rand() * 0.7,
        phase: rand() * Math.PI * 2,
        spin: (rand() - 0.5) * 0.8,
        color: new Color(),
      };
    });
  }, []);
  const targets = useRef<Color[]>([]);

  useEffect(() => {
    targets.current = FRUIT_BY_ID[fruitId].palette.map((h) => new Color(h));
  }, [fruitId]);

  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = Math.min(dt, 1 / 20);
    const t = state.clock.elapsedTime;
    const still = prefersReducedMotion();
    const camZ = state.camera.position.z;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const tan = Math.tan((30 * Math.PI) / 360);
    data.forEach((pt, i) => {
      if (!still) {
        const depth = camZ - pt.pos.z;
        const px = pointer.x * tan * depth * aspect;
        const py = pointer.y * tan * depth;
        const dx = pt.pos.x - px;
        const dy = pt.pos.y - py;
        const dist = Math.hypot(dx, dy) + 1e-4;
        const reach = 1.6;
        if (pointer.active && dist < reach) {
          const f = ((reach - dist) / reach) * 9;
          pt.vel.x += (dx / dist) * f * d;
          pt.vel.y += (dy / dist) * f * d;
        }
        pt.vel.x += ((pt.home.x - pt.pos.x) * 1.2 + Math.sin(t * 0.5 + pt.phase) * 0.35) * d;
        pt.vel.y += ((pt.home.y - pt.pos.y) * 1.2 + Math.cos(t * 0.43 + pt.phase * 1.3) * 0.35) * d;
        pt.vel.multiplyScalar(Math.pow(0.9, d * 60));
        pt.pos.addScaledVector(pt.vel, d);
      }
      const target = targets.current[i % 4];
      if (target) pt.color.lerp(target, 1 - Math.exp(-d * 2.5));
      e.set(t * pt.spin + pt.phase, t * pt.spin * 0.7, pt.phase);
      q.setFromEuler(e);
      s.set(pt.size, pt.size * pt.stretch, pt.size);
      p.copy(pt.pos);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, pt.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} raycast={() => null} frustumCulled={false}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshPhysicalMaterial roughness={0.3} clearcoat={1} clearcoatRoughness={0.2} />
    </instancedMesh>
  );
}
