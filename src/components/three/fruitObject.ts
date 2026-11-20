import {
  BackSide,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  type BufferGeometry,
  type Material,
  type MeshPhysicalMaterial,
} from "three";
import type { LayerKey } from "@/data/types";
import { BEAD_GEOMETRY, getFruitGeometry, hashString, mulberry32, radiusAt, type FruitGeometry } from "./geometry";
import { fruitMaterial, pieceUniforms, type PieceUniforms } from "./material";
import { getFruitTextures, getNoiseBump } from "./textures";

export const LAYERS: LayerKey[] = ["peel", "flesh", "core"];
/** World height where every fruit's lowest point rests, just above the pedestal. */
export const REST_Y = -1.18;

export interface FruitRig {
  id: string;
  geo: FruitGeometry;
  root: Group;
  spinner: Group;
  pieces: Record<LayerKey, Group>;
  lid: Group;
  lidMeshes: Mesh[];
  lidMaterials: MeshPhysicalMaterial[];
  uniforms: Record<LayerKey, PieceUniforms>;
  lidUniforms: PieceUniforms;
  anchors: Record<LayerKey | "whole" | "edge", Object3D>;
  offsetY: number;
  dispose(): void;
}

const STEM_COLORS: Record<string, string> = {
  mango: "#6B5A2E", orange: "#6F7F22", avocado: "#5B4A2A", apple: "#5B3E22", papaya: "#8DA83A",
};

export function buildFruit(id: string): FruitRig {
  const geo = getFruitGeometry(id);
  const tex = getFruitTextures(id);
  const noise = getNoiseBump();
  const s = geo.shape;
  const materials: Material[] = [];
  const track = <M extends Material>(m: M) => (materials.push(m), m);

  const uniforms = { peel: pieceUniforms(s.sss), flesh: pieceUniforms(s.sss), core: pieceUniforms(s.sss) };
  const lidU = pieceUniforms(s.sss);

  const skinParams = {
    map: tex.skin,
    bumpMap: tex.skinBump,
    bumpScale: s.skinMat.bumpScale,
    roughness: s.skinMat.roughness,
    clearcoat: s.skinMat.clearcoat,
    clearcoatRoughness: s.skinMat.clearcoatRoughness,
    sheen: s.skinMat.sheen,
    sheenColor: new Color(s.skinMat.sheenColor),
    sheenRoughness: 0.55,
  };
  const sectionParams = { map: tex.section, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.28 };

  const mesh = (g: BufferGeometry, m: Material, layer: LayerKey | "lid") => {
    const o = new Mesh(g, m);
    o.userData.layer = layer;
    return o;
  };

  const pieces = { peel: new Group(), flesh: new Group(), core: new Group() };
  for (const k of LAYERS) pieces[k].name = k;

  const peelBowlColor = new Color(s.peelInner).lerp(new Color(s.skin[0]), 0.22);
  pieces.peel.add(
    mesh(geo.skinBack, track(fruitMaterial(skinParams, uniforms.peel, 0.6)), "peel"),
    mesh(geo.peelBowl, track(fruitMaterial({ color: peelBowlColor, roughness: 0.85, side: BackSide, bumpMap: noise, bumpScale: 0.6 }, uniforms.peel, 0.2)), "peel"),
    mesh(geo.peelCut, track(fruitMaterial(sectionParams, uniforms.peel, 0.12)), "peel"),
  );

  if (geo.stem) {
    pieces.peel.add(mesh(geo.stem, track(fruitMaterial({ color: STEM_COLORS[id] ?? "#5B4A2A", roughness: 0.82 }, uniforms.peel, 0.1)), "peel"));
  }
  if (geo.leaf) {
    pieces.peel.add(mesh(geo.leaf, track(fruitMaterial({ color: "#3F8F3A", roughness: 0.5, side: DoubleSide, sheen: 0.4, sheenColor: new Color("#B6E59E") }, uniforms.peel, 0.25)), "peel"));
  }
  if (geo.crown) {
    const crownColor = s.extras.crown === "pomegranate" ? "#9E1220" : "#1A2460";
    pieces.peel.add(mesh(geo.crown, track(fruitMaterial({ color: crownColor, roughness: 0.62, sheen: s.skinMat.sheen, sheenColor: new Color(s.skinMat.sheenColor) }, uniforms.peel, 0.3)), "peel"));
  }

  pieces.flesh.add(
    mesh(geo.fleshOuter, track(fruitMaterial({ map: tex.fleshSurface, roughness: 0.48, clearcoat: 0.45, clearcoatRoughness: 0.3, bumpMap: noise, bumpScale: 0.5 }, uniforms.flesh, 0.55)), "flesh"),
    mesh(geo.fleshCavity, track(fruitMaterial({ color: new Color(s.flesh[1]).multiplyScalar(0.78), roughness: 0.6, side: BackSide }, uniforms.flesh, 0.2)), "flesh"),
    mesh(geo.fleshCut, track(fruitMaterial(sectionParams, uniforms.flesh, 0.12)), "flesh"),
  );

  const glossyPit = id === "avocado" || id === "papaya";
  pieces.core.add(
    mesh(geo.pitOuter, track(fruitMaterial({ map: tex.pitSurface, roughness: glossyPit ? 0.3 : 0.7, clearcoat: glossyPit ? 0.7 : 0.1, bumpMap: noise, bumpScale: glossyPit ? 0.3 : 0.8 }, uniforms.core, 0.25)), "core"),
    mesh(geo.pitCut, track(fruitMaterial(sectionParams, uniforms.core, 0.12)), "core"),
  );

  if (geo.beads && s.beads) {
    const juicy = s.beads.layout === "arils";
    const bm = track(
      fruitMaterial(
        { color: "#ffffff", roughness: juicy ? 0.12 : 0.32, clearcoat: 1, clearcoatRoughness: 0.1 },
        uniforms[geo.beads.piece],
        juicy ? 0.9 : 0.1,
      ),
    );
    const inst = new InstancedMesh(BEAD_GEOMETRY, bm, geo.beads.matrices.length);
    const rand = mulberry32(hashString(id + "bead-color"));
    const a = new Color(s.beads.colors[0]);
    const b = new Color(s.beads.colors[1]);
    geo.beads.matrices.forEach((m, i) => {
      inst.setMatrixAt(i, m);
      inst.setColorAt(i, a.clone().lerp(b, rand()));
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.userData.layer = geo.beads.piece;
    pieces[geo.beads.piece].add(inst);
  }

  const lidSkin = track(fruitMaterial({ ...skinParams, transparent: true }, lidU, 0.6));
  const lidCut = track(fruitMaterial({ ...sectionParams, transparent: true }, lidU, 0.12));
  const lid = new Group();
  const lidMeshes = [mesh(geo.skinFront, lidSkin, "lid"), mesh(geo.lidCut, lidCut, "lid")];
  lid.add(...lidMeshes);

  const spinner = new Group();
  spinner.add(pieces.peel, pieces.flesh, pieces.core, lid);
  const root = new Group();
  const offsetY = REST_Y - geo.bounds.peel.minY;
  root.position.y = offsetY;
  root.add(spinner);

  const anchor = (parent: Object3D, x: number, y: number, z: number) => {
    const o = new Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const ay = geo.eqY + s.outer.ry * 0.16;
  const ar = radiusAt(geo.outer, ay) * 0.98;
  const theta = 0.66;
  const anchors = {
    peel: anchor(pieces.peel, geo.anchors.peel[0], geo.anchors.peel[1], 0.01),
    flesh: anchor(pieces.flesh, geo.anchors.flesh[0], geo.anchors.flesh[1], 0.01),
    core: anchor(pieces.core, geo.anchors.core[0], geo.anchors.core[1], 0.03),
    whole: anchor(root, Math.sin(theta) * ar, ay, Math.cos(theta) * ar * s.zScale),
    edge: anchor(root, geo.bounds.peel.maxR + 0.14, geo.eqY, 0),
  };

  return {
    id,
    geo,
    root,
    spinner,
    pieces,
    lid,
    lidMeshes,
    lidMaterials: [lidSkin, lidCut],
    uniforms,
    lidUniforms: lidU,
    anchors,
    offsetY,
    dispose() {
      materials.forEach((m) => m.dispose());
      root.traverse((o) => {
        if (o instanceof InstancedMesh) o.dispose();
      });
    },
  };
}

export interface PieceTarget { x: number; y: number; s: number }

/** Vertical exploded stack floating just above the pedestal: peel on top, flesh in the middle, core at the bottom. */
export function explodedLayout(rig: FruitRig, wide: boolean): Record<LayerKey, PieceTarget> {
  const b = rig.geo.bounds;
  const gap = 0.24;
  const heights = LAYERS.map((k) => b[k].maxY - b[k].minY);
  const sum = heights.reduce((x, y) => x + y, 0);
  const s = Math.min(0.5, ((wide ? 2.9 : 3.3) - gap * 2) / sum);
  const total = s * sum + gap * 2;
  let top = REST_Y + 0.1 + total;
  const out = {} as Record<LayerKey, PieceTarget>;
  for (const k of LAYERS) {
    const y = top - s * b[k].maxY;
    out[k] = { x: 0, y: y - rig.offsetY, s };
    top = y + s * b[k].minY - gap;
  }
  return out;
}

