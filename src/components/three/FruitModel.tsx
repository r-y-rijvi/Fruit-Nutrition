"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { MathUtils, Mesh, Object3D, Vector3, type Group } from "three";
import type { LayerKey } from "@/data/types";
import { anchors, publishAnchors, spin, useApp } from "@/lib/store";
import { CAM_LAYERS, CAM_WHOLE, cam, prog, stage } from "./camera";
import { LAYERS, buildFruit, explodedLayout } from "./fruitObject";

const TAU = Math.PI * 2;
const noRaycast = () => {};
const meshRaycast = Mesh.prototype.raycast;
const v = new Vector3();
const center = new Object3D();

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type PickEvent = ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>;
const layerOf = (e: PickEvent) => e.object.userData.layer as LayerKey | "lid" | undefined;

export function FruitModel() {
  const fruitId = useApp((s) => s.fruitId);
  const view = useApp((s) => s.view);
  const setBusy = useApp((s) => s.setBusy);
  const [shownId, setShownId] = useState(fruitId);
  const rig = useMemo(() => buildFruit(shownId), [shownId]);
  useEffect(() => () => rig.dispose(), [rig]);

  const bob = useRef<Group>(null!);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const wide = size.width >= 900;
  const targets = useMemo(() => explodedLayout(rig, wide), [rig, wide]);
  const stackMid = useMemo(() => {
    const b = rig.geo.bounds;
    return (targets.peel.y + targets.peel.s * b.peel.maxY + targets.core.y + targets.core.s * b.core.minY) / 2 + rig.offsetY;
  }, [rig, targets]);
  const prevView = useRef(view);
  const shownRef = useRef(shownId);
  shownRef.current = shownId;
  const outTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prevView.current === view) return;
    prevView.current = view;
    if (useApp.getState().fruitId !== shownRef.current) return;
    setBusy(true);
    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: () => setBusy(false) });
    if (view === "layers") {
      spin.velocity = 0;
      const front = Math.round(spin.angle / TAU) * TAU;
      tl.to(spin, { angle: front, duration: 0.6, ease: "power2.out" }, 0)
        .to(cam, { z: 8.2, lookY: -0.3, duration: 0.85, ease: "power2.inOut" }, 0)
        .to(prog, { split: 1, duration: 0.75 }, 0.45)
        .to(prog, { spread: 1, duration: 1.05, ease: "expo.inOut" }, 1.0)
        .to(cam, { ...CAM_LAYERS, duration: 1.15 }, 0.95);
    } else {
      tl.to(prog, { spread: 0, duration: 0.85, ease: "expo.inOut" }, 0)
        .to(cam, { z: 8.8, lookY: -0.1, duration: 0.75 }, 0)
        .to(prog, { split: 0, duration: 0.6 }, 0.72)
        .to(cam, { ...CAM_WHOLE, duration: 0.85 }, 0.9);
    }
    if (prefersReducedMotion()) tl.timeScale(6);
    return () => {
      tl.kill();
    };
  }, [view, setBusy]);

  useEffect(() => {
    if (fruitId === shownId) return;
    setBusy(true);
    const tw = gsap.to(prog, {
      swap: 0,
      duration: 0.3,
      ease: "power2.in",
      overwrite: "auto",
      onComplete: () => {
        prog.split = 0;
        prog.spread = 0;
        gsap.killTweensOf(cam);
        Object.assign(cam, CAM_WHOLE);
        setShownId(fruitId);
      },
    });
    return () => {
      tw.kill();
    };
  }, [fruitId, shownId, setBusy]);

  useEffect(() => {
    if (prog.swap >= 1) return;
    const tw = gsap.to(prog, {
      swap: 1,
      duration: prefersReducedMotion() ? 0.1 : 0.65,
      ease: "back.out(1.5)",
      overwrite: "auto",
      onComplete: () => setBusy(false),
    });
    return () => {
      tw.kill();
    };
  }, [shownId, setBusy]);

  useFrame((state, dt) => {
    const st = useApp.getState();
    const d = Math.min(dt, 1 / 20);
    const t = state.clock.elapsedTime;
    const still = prefersReducedMotion();

    if (!st.busy && st.view === "whole" && !spin.dragging) {
      spin.velocity *= Math.pow(0.93, d * 60);
      spin.angle += spin.velocity + (still ? 0 : 0.3 * d);
    }
    rig.spinner.rotation.y = spin.angle + (1 - prog.swap) * 1.4;

    const sw = Math.max(0, prog.swap);
    bob.current.visible = sw > 0.002;
    bob.current.scale.setScalar(Math.max(sw, 0.002));
    bob.current.position.x = stage.x;
    bob.current.position.y = still ? 0 : Math.sin(t * 1.25) * 0.045 * (1 - prog.spread);

    const sp = prog.split;
    rig.lid.position.set(-2.3 * sp, 0, 0.5 * sp);
    rig.lid.rotation.y = -2.1 * MathUtils.smootherstep(sp, 0, 1);
    const op = 1 - MathUtils.smoothstep(sp, 0.35, 0.95);
    for (const m of rig.lidMaterials) m.opacity = op;
    rig.lid.visible = op > 0.01;
    for (const m of rig.lidMeshes) m.raycast = sp > 0.25 ? noRaycast : meshRaycast;

    const e = prog.spread;
    const focus = st.view === "layers" && e > 0.6 ? (st.hoverLayer ?? st.activeLayer) : null;
    const wholeGlow = st.view === "whole" && st.hoverFruit ? 0.4 : 0;
    LAYERS.forEach((k, i) => {
      const g = rig.pieces[k];
      const tg = targets[k];
      const on = focus === k;
      const pop = (g.userData.pop = MathUtils.damp((g.userData.pop as number) ?? 0, on ? 1 : 0, 8, d));
      const drift = still ? 0 : Math.sin(t * 1.1 + i * 1.7) * 0.03 * e;
      g.position.set(tg.x * e, tg.y * e + drift, pop * 0.2 * e);
      g.scale.setScalar(MathUtils.lerp(1, tg.s, e) * (1 + pop * 0.05 * e));
      g.rotation.set(0.12 * e, (-0.5 + (still ? 0 : Math.sin(t * 0.6 + i) * 0.05)) * e, 0);
      const u = rig.uniforms[k];
      u.uDim.value = MathUtils.damp(u.uDim.value, focus && !on ? 1 : 0, 7, d);
      u.uHighlight.value = MathUtils.damp(u.uHighlight.value, on ? 1 : wholeGlow, 7, d);
    });
    rig.lidUniforms.uHighlight.value = MathUtils.damp(rig.lidUniforms.uHighlight.value, wholeGlow, 7, d);

    const b = rig.geo.bounds.peel;
    rig.anchors.edge.position.x = MathUtils.lerp(b.maxR + 0.14, targets.peel.x + targets.peel.s * b.maxR + 0.18, e);

    const project = (o: Object3D, key: string, visible: boolean) => {
      o.getWorldPosition(v).project(camera);
      const a = anchors[key] ?? (anchors[key] = { x: 0, y: 0, visible: false });
      a.x = (v.x * 0.5 + 0.5) * size.width;
      a.y = (-v.y * 0.5 + 0.5) * size.height;
      a.visible = visible && v.z < 1;
    };
    const wholeOn = st.view === "whole" && !st.busy && prog.swap > 0.98 && sp < 0.01;
    const layersOn = st.view === "layers" && e > 0.97;
    project(rig.anchors.whole, "whole", wholeOn);
    project(rig.anchors.edge, "edge", wholeOn || layersOn);
    for (const k of LAYERS) project(rig.anchors[k], k, layersOn);
    center.position.set(stage.x + targets.peel.x * e, MathUtils.lerp((b.minY + b.maxY) / 2 + rig.offsetY, stackMid, e) + bob.current.position.y, 0);
    center.updateMatrixWorld();
    project(center, "center", true);
    publishAnchors();
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    window.clearTimeout(outTimer.current);
    const st = useApp.getState();
    if (st.busy) return;
    if (st.view === "whole") {
      if (!st.hoverFruit) st.setHoverFruit(true);
      return;
    }
    const k = layerOf(e);
    if (k && k !== "lid" && st.hoverLayer !== k) st.setHoverLayer(k);
  };

  const onOut = () => {
    window.clearTimeout(outTimer.current);
    outTimer.current = window.setTimeout(() => {
      const st = useApp.getState();
      if (st.hoverFruit) st.setHoverFruit(false);
      if (st.hoverLayer) st.setHoverLayer(null);
    }, 70);
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    const st = useApp.getState();
    if (st.view === "whole") st.explode();
    else {
      const k = layerOf(e);
      if (k && k !== "lid") st.setActiveLayer(k);
    }
  };

  return (
    <group ref={bob}>
      <primitive object={rig.root} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick} />
    </group>
  );
}
