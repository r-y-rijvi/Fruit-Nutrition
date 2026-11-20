"use client";

import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, Color, MathUtils, NeutralToneMapping, type Group, type MeshBasicMaterial, type PointLight } from "three";
import { FRUIT_BY_ID } from "@/data";
import { bindPointer, pointer } from "@/lib/pointer";
import { spin, useApp } from "@/lib/store";
import { cam, stage } from "./camera";
import { FruitModel, prefersReducedMotion } from "./FruitModel";
import { REST_Y } from "./fruitObject";
import { Particles } from "./Particles";
import { ThumbnailBaker } from "./ThumbnailBaker";

function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class StageErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Interactive 2D anatomical fallback if WebGL is disabled or unavailable on a device. */
function AnatomicalFallback() {
  const fruitId = useApp((s) => s.fruitId);
  const view = useApp((s) => s.view);
  const activeLayer = useApp((s) => s.activeLayer);
  const explode = useApp((s) => s.explode);
  const setActiveLayer = useApp((s) => s.setActiveLayer);
  const fruit = FRUIT_BY_ID[fruitId];
  const sliced = view === "layers";
  const layerData = fruit.layers.find((l) => l.key === activeLayer) ?? fruit.layers[1];

  return (
    <div className="grid h-full w-full place-items-center px-6">
      <div className="flex flex-col items-center gap-4 min-[900px]:translate-x-[12vw]">
        <button
          type="button"
          onClick={() => (sliced ? setActiveLayer(activeLayer === "peel" ? "flesh" : activeLayer === "flesh" ? "core" : "peel") : explode())}
          aria-label={`Interactive ${fruit.name} anatomy`}
          className="group relative grid size-60 place-items-center rounded-full transition-transform hover:scale-[1.03] sm:size-72"
        >
          <svg viewBox="0 0 240 240" className="size-full drop-shadow-[0_24px_40px_rgb(18_10_20/0.35)]">
            <circle cx="120" cy="120" r="102" fill={fruit.palette[1]} stroke={activeLayer === "peel" && sliced ? "#120A14" : "transparent"} strokeWidth="5" />
            {sliced ? (
              <>
                <circle cx="120" cy="120" r="84" fill={fruit.accent} stroke={activeLayer === "flesh" ? "#120A14" : "transparent"} strokeWidth="5" />
                <circle cx="120" cy="120" r="38" fill={fruit.palette[3]} stroke={activeLayer === "core" ? "#120A14" : "transparent"} strokeWidth="5" />
                <circle cx="120" cy="120" r="14" fill="#120A14" opacity="0.75" />
              </>
            ) : (
              <ellipse cx="92" cy="86" rx="34" ry="22" fill="#FFFDF8" opacity="0.28" transform="rotate(-24 92 86)" />
            )}
          </svg>
        </button>
        {sliced && (
          <div className="max-w-xs rounded-2xl border border-ink/12 bg-paper/90 px-4 py-3 text-center shadow-lg backdrop-blur-md">
            <p className="font-mono text-[10px] tracking-[0.1em] text-ink/55 uppercase">
              {layerData.role} · {layerData.botanical}
            </p>
            <p className="mt-1 text-[13.5px] font-semibold text-ink">{layerData.nutrients[0]?.title}</p>
            <p className="mt-0.5 text-[12px] text-ink/70">{layerData.nutrients[0]?.benefit}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useFrame((_, dt) => {
    const aspect = size.width / Math.max(1, size.height);
    const wide = size.width >= 900;
    const fit = Math.max(1, 0.8 / aspect);
    stage.x = wide ? Math.min(0.36, 0.22 * aspect) : 0;
    const d = Math.min(dt, 1 / 20);
    const still = prefersReducedMotion();
    const tx = still ? 0 : pointer.x * 0.24;
    const ty = 0.16 + (still ? 0 : pointer.y * 0.14);
    camera.position.x = MathUtils.damp(camera.position.x, tx, 3, d);
    camera.position.y = MathUtils.damp(camera.position.y, ty, 3, d);
    camera.position.z = cam.z * fit;
    camera.lookAt(0, cam.lookY + (wide ? 0 : (fit - 1) * 0.9), 0);
    camera.updateMatrixWorld();
  });
  return null;
}

function Pedestal() {
  const fruitId = useApp((s) => s.fruitId);
  const group = useRef<Group>(null!);
  const ring = useRef<MeshBasicMaterial>(null!);
  const accent = useRef<PointLight>(null!);
  const target = useMemo(() => new Color(), []);
  const glow = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.45, "rgba(255,255,255,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new CanvasTexture(c);
  }, []);
  const glowMat = useRef<MeshBasicMaterial>(null!);

  useFrame((_, dt) => {
    group.current.position.x = stage.x;
    target.set(FRUIT_BY_ID[fruitId].accent);
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 3);
    ring.current.color.lerp(target, k);
    glowMat.current.color.lerp(target, k);
    accent.current.color.lerp(target, k);
  });

  return (
    <group ref={group} position={[0, REST_Y, 0]}>
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <cylinderGeometry args={[1.32, 1.42, 0.18, 96, 1]} />
        <meshPhysicalMaterial color="#160C18" roughness={0.18} metalness={0.1} clearcoat={1} clearcoatRoughness={0.08} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.27, 1.32, 128]} />
        <meshBasicMaterial ref={ring} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.6, 4.6]} />
        <meshBasicMaterial ref={glowMat} map={glow} transparent opacity={0.32} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={accent} position={[0, 0.2, 1.6]} intensity={2.2} distance={4} decay={2} />
      <ContactShadows position={[0, 0.002, 0]} scale={3.2} blur={2.6} far={2.4} opacity={0.8} resolution={512} color="#120A14" />
    </group>
  );
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#FFF4E6", "#2A1830", 0.35]} />
      <directionalLight position={[4, 5, 5]} intensity={2.2} color="#FFE8D0" />
      <directionalLight position={[-5, 1.5, 3]} intensity={0.6} color="#CFE3FF" />
      <directionalLight position={[-3.5, 2.5, -4]} intensity={3.2} color="#FFFFFF" />
      <directionalLight position={[3.5, 0.8, -3]} intensity={2.2} color="#FFD6F0" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#CFE3FF" />
        <Lightformer form="rect" intensity={1.6} position={[5, 1, 0]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#FFE0C4" />
        <Lightformer form="ring" intensity={3} position={[0, 1, -6]} scale={3} />
      </Environment>
    </>
  );
}

function useDragSpin(el: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    let lastX = 0;
    let lastT = 0;
    const move = (e: PointerEvent) => {
      if (!spin.dragging) return;
      const dx = e.clientX - lastX;
      const now = performance.now();
      const step = dx * 0.0085;
      spin.angle += step;
      spin.velocity = MathUtils.clamp((step / Math.max(1, now - lastT)) * 16, -0.25, 0.25);
      lastX = e.clientX;
      lastT = now;
    };
    const up = () => {
      spin.dragging = false;
      node.dataset.dragging = "false";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    const down = (e: PointerEvent) => {
      const st = useApp.getState();
      if (st.view !== "whole" || st.busy || e.button !== 0) return;
      spin.dragging = true;
      spin.velocity = 0;
      lastX = e.clientX;
      lastT = performance.now();
      node.dataset.dragging = "true";
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    };
    node.addEventListener("pointerdown", down);
    return () => {
      node.removeEventListener("pointerdown", down);
      up();
    };
  }, [el]);
}

export default function Stage() {
  const wrap = useRef<HTMLDivElement>(null);
  const [dpr, setDpr] = useState(1.75);
  const [webglOk, setWebglOk] = useState(true);
  const live = useApp((s) => s.heroVisible);
  useDragSpin(wrap);
  useEffect(bindPointer, []);
  useEffect(() => {
    setWebglOk(hasWebGL());
  }, []);

  if (!webglOk) {
    return (
      <div className="absolute inset-0">
        <AnatomicalFallback />
      </div>
    );
  }

  return (
    <StageErrorBoundary fallback={<AnatomicalFallback />}>
      <div ref={wrap} className="stage-canvas absolute inset-0 touch-pan-y" data-dragging="false">
        <Canvas
          dpr={[1, dpr]}
          frameloop={live ? "always" : "never"}
          camera={{ position: [0, 0.16, 7.4], fov: 30, near: 0.1, far: 60 }}
          gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping, toneMappingExposure: 1.05, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", () => setWebglOk(false), { once: true });
          }}
          onPointerMissed={() => {
            const st = useApp.getState();
            if (st.view === "layers" && !st.busy) st.reassemble();
          }}
          aria-label="Interactive 3D fruit model"
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />
          <CameraRig />
          <Lights />
          <Pedestal />
          <FruitModel />
          <Particles />
          <ThumbnailBaker />
        </Canvas>
      </div>
    </StageErrorBoundary>
  );
}
